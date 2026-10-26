<script setup lang="ts">
import { demoDevices as devices } from '~/utils/demoDevices'

interface Props {
    src: string
}
const props = defineProps<Props>()

const iframeRef = useTemplateRef<HTMLIFrameElement>('iframeRef')
const isLoading = shallowRef(true)
const { onFrameLoad } = useDemoFrameTheme(iframeRef)

// 地址变化时重新加载预览。
const iframeSrc = computed(() => {
    return props.src
})

function onIframeLoad() {
    isLoading.value = false;
    onFrameLoad()
}

watch(() => props.src, () => {
    isLoading.value = true;
}, { immediate: true })

const selectedDeviceName = shallowRef(devices[1]!.label)
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
            class="touch-none overscroll-contain relative shadow-2xl rounded-[3rem] border-8 border-gray-900 bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out"
            :style="{
                width: `${selectedDevice.width}px`,
                height: `${selectedDevice.height}px`,
                maxHeight: 'calc(100vh - 200px)'
            }">

            <div v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-950 z-10">
                <UIcon name="svg-spinners:blocks-wave" class="size-15 text-red-5" />
            </div>

            <iframe ref="iframeRef" :src="iframeSrc" class="touch-none w-full h-full bg-white border-none"
                :title="selectedDevice.label" @load="onIframeLoad" />
        </div>
    </div>
</template>
