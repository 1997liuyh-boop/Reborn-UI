<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
    src: string
}>()

// Use standard Nuxt color mode
const colorMode = useColorMode()
const iframeRef = ref<HTMLIFrameElement>()
const isLoading = ref(true)

// Initial src
const iframeSrc = computed(() => {
    return props.src
})

function syncTheme() {
    if (!iframeRef.value?.contentWindow) return

    // Post message to uniapp H5
    iframeRef.value.contentWindow.postMessage({
        type: 'theme-change',
        theme: colorMode.value
    }, '*')
}

function onIframeLoad() {
    isLoading.value = false;
    syncTheme()
}

watch(() => props.src, () => {
    isLoading.value = true;
}, { immediate: true })

watch(() => colorMode.value, () => {
    syncTheme()
})

interface Device {
    label: string
    width: number
    height: number
}

const devices: Device[] = [
    { label: 'iPhone SE', width: 320, height: 568 },
    { label: 'iPhone 12/13/14', width: 375, height: 812 },
    { label: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { label: 'HUAWEI MATE 80', width: 366, height: 809 },
    { label: 'HUAWEI MATE 70', width: 374, height: 827 },
    { label: 'iPad', width: 768, height: 1024 },
]

const selectedDeviceName = ref(devices[1]!.label)
const selectedDevice = computed(() => devices.find(d => d.label === selectedDeviceName.value) || devices[0])
</script>

<template>
    <div class="flex flex-col items-center gap-4 w-full h-full p-4 bg-muted/20">
        <div class="flex items-center gap-2">
            <USelect v-model="selectedDeviceName" :items="devices" labelKey="label" valueKey="label" class="z-[999]" />
            <div class="text-sm text-muted-foreground">
                {{ selectedDevice?.width }} x {{ selectedDevice?.height }}
            </div>
        </div>

        <div v-if="selectedDevice"
            class="relative shadow-2xl rounded-[3rem] border-8 border-gray-900 bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out"
            :style="{
                width: `${selectedDevice.width}px`,
                height: `${selectedDevice.height}px`,
                maxHeight: 'calc(100vh - 200px)'
            }">

            <div v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-950 z-10">
                <UIcon name="svg-spinners:blocks-wave" class="size-15 text-red-5" />
            </div>

            <iframe ref="iframeRef" :src="iframeSrc" class="w-full h-full bg-white border-none"
                :title="selectedDevice.label" @load="onIframeLoad" />
        </div>
    </div>
</template>
