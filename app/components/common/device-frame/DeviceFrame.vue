<script setup lang="ts">
const props = defineProps<{
    src: string
}>()

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
            <USelect v-model="selectedDeviceName" :items="devices" labelKey="label" valueKey="label" class="z-999" />
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
            <iframe :src="props.src" class="w-full h-full bg-white border-none" :title="selectedDevice.label" />
        </div>
    </div>
</template>
