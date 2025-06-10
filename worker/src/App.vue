<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { computed, h, ref } from 'vue'

import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'
import { Dashboard, UppyContextProvider } from '@uppy/vue'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy().use(AwsS3, {
    id: 'awsPlugin',
    endpoint: '/',
})

const lua = ref('upload something')

uppy.on('upload-success', async (file, res) => {
    console.log('uploaded', file, res)

    lua.value = "i'm thinking..."

    const { uploadURL } = res

    const converted = await fetch('/128x128/' + uploadURL)

    lua.value = await converted.text()
})
</script>

<template>
    <div>
        <h1>imgon</h1>

        <h2>upload</h2>
        <Dashboard :uppy="uppy" />

        <h2>result</h2>
        <pre>{{ lua }}</pre>
    </div>
</template>

<style src="@uppy/vue/dist/styles.css"></style>

<style scoped>
</style>
