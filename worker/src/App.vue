<script setup lang="ts">
import { ref } from 'vue'

import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'
import { Dashboard } from '@uppy/vue'

import { luaToJSON, FormatOption, DitheringOption } from './modules/sanjuuni'

import type { DownloadSpec } from './modules/download'
import { downloadData, formatBytes } from './modules/download'

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
    const blob = await converted.blob()

    downloads.value.unshift({
        data: blob,
        size: blob.size,
        filename: `imgon.${file ? file.name + '.' : ''}${format.value}`,
        type: 'application/x-lua',
    })

    // lua.value = await converted.text()

    // const imgJson = luaToJSON(`return ${lua.value}`)

    // console.log('json', imgJson)

    // const sixels = imgJson[0].map((v: string[], k: number) => {
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
