<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'
import { Dashboard } from '@uppy/vue'

import { luaToJSON, parseRawmodePacket, FormatOption, DitheringOption, defaultPalette } from './modules/sanjuuni'

import type { DownloadSpec } from './modules/download'
import { downloadData, formatBytes } from './modules/download'

import { blit } from './modules/canvas'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy().use(AwsS3, {
    id: 'awsPlugin',
    endpoint: '/',
})

const lua = ref('upload something')
const json = ref('upload something')

// options
const width = ref(128)
const height = ref(128)
const dithering = ref(DitheringOption.None)
const format = ref(FormatOption.Bimg)
const downloads = ref<DownloadSpec[]>([])

// template refs
const canvas = useTemplateRef('canvas')

// Download all files in the downloads array
function downloadAll() {
    downloads.value.forEach(download => {
        downloadData(download.data, download.type, download.filename)
    })
}

uppy.on('upload-success', async (file, res) => {
    console.log('uploaded', file, res)

    // lua.value = "i'm thinking..."
    // json.value = "i'm thinking..."

    const { uploadURL } = res

    const converted = await fetch(`/${width.value}x${height.value}:F${format.value}:D${dithering.value}/` + uploadURL)
    const resJson = await converted.json()

    downloads.value.unshift({
        data: resJson.lua,
        size: resJson.lua.length,
        filename: `imgon.${file ? file.name + '.' : ''}${format.value}`,
        type: 'application/x-lua',
    })

    lua.value = resJson.lua

    // console.log('lua', lua.value)

	const resBuf = new ArrayBuffer(resJson.raw.length);
	const resView = new Uint8Array(resBuf);
	for (let i = 0; i < resJson.raw.length; i++) {
		resView[i] = resJson.raw.charCodeAt(i) & 0xFF;
	}

    const imgJson = parseRawmodePacket(resBuf)

    console.log('json', imgJson)

    // const sixels = imgJson.terminalData?.textData?.canvasData.map((c, i) => {
    //     const [ blit, fg, bg ] = v

    //     const blitParsed = blit.match(/( |\\\d{3})/g)?.map(c => {
    //         return (c === ' ' ? 0x80 : parseInt(c.replace('\\', ''))) - 0x80
    //     })
        
    //     return {
    //         blit,
    //         blitParsed,
    //         fg,
    //         bg,
    //     }
    // })
    
    // console.log('sixels', sixels)

    // console.log('sixel 16', sixels[16])

    if (canvas.value) {
        const ctx = canvas.value.getContext('2d');

        if (ctx) {
            // blit(ctx, sixels[16].blitParsed, [], [])

            // reference impl
            // for (let i = 0; i < sixels.length; i++) {
            //     const { blitParsed, fg, bg } = sixels[i]
            //     blit(0, i * 3, ctx, blitParsed, fg, bg)
            // }

            // loop over height, then width
            if (imgJson.terminalData) {
                const palette = imgJson.terminalData.palette;
                const textData = imgJson.terminalData.textData;
                const colorData = imgJson.terminalData.colorData?.canvasData;

                for (let y = 0; y < imgJson.terminalData?.height; y++) {
                    for (let x = 0; x < imgJson.terminalData?.width; x++) {
                        const index: number = y * imgJson.terminalData?.width + x;
                        const data = imgJson.terminalData?.textData?.canvasData[index];

                        // colorData: Array of numbers (0-15) representing palette indices as pairs [background, foreground]
                        const bg = colorData ? colorData[index * 2] : 0;
                        const fg = colorData ? colorData[index * 2 + 1] : 0;

                        blit(
                            x * 2, // x position in pixels
                            y * 3,     // y position in pixels
                            ctx,
                            data ?? 0,  // blit data
                            palette?.colors[bg]?.style ?? '#000000',  // background color
                            palette?.colors[fg]?.style ?? '#FFFFFF' // foreground color
                        );
                    }
                }
            }
        }
    }
})
</script>

<template>
    <div class="imgon">
        <h1>imgon</h1>

        <div class="wrapper">
            <div class="column w-30">
                <h2>upload</h2>
                <Dashboard :uppy="uppy" :props="{
                    height: '400px',
                    // width: '100%',
                }" />
            </div>
            <div class="column w-70">
                <div>
                    <h2>options</h2>
                    <label>height: <input type="number" v-model="height" min="0" /></label>
                    <label>width: <input type="number" v-model="width" min="0" /></label>
                    <br>
                    <label>dithering:
                        <select v-model="dithering">
                            <option v-for="dithering in Object.values(DitheringOption)" :key="dithering" :value="dithering">{{ dithering }}</option>
                        </select>
                    </label>
                    <br>
                    <label>format:
                        <select v-model="format">
                            <option v-for="format in Object.values(FormatOption)" :key="format" :value="format">{{ format }}</option>
                        </select>
                    </label>
                </div>
                <div>
                    <h2>results ({{ downloads.length }})</h2>
                    <canvas ref="canvas" />
                    <button @click="downloads = []">clear</button>
                    <button @click="downloadAll">download all of them!!</button>
                    <ul>
                        <li v-for="download in downloads" :key="download.filename">
                            <button @click="downloadData(download.data, download.type, download.filename)">
                                Download {{ download.filename }} ({{ formatBytes(download.size) }})
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- <style src="@uppy/vue/dist/styles.css"></style> -->

<style lang="scss" scoped>
* {
    box-sizing: border-box !important;
}

.imgon {
    h1 {
        text-align: center;
    }

    .wrapper {
        display: flex;
        flex-direction: row;
        max-width: 1000px;
        margin: auto;
        max-height: 500px;

        .column {
            padding: 10px;
            display: flex;
            flex-direction: column;;

            &.w-30 {
                min-width: 300px;
                width: 30%;
            }

            &.w-70 {
                width: 70%;
            }
        }

        pre {
            display: block;
            overflow: auto;
            background: red;
            max-width: 200px;
            height: 200px;
        }
    }
}
</style>
