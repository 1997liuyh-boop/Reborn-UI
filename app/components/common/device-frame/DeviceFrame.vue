<script setup lang="ts">
const props = defineProps<{
    src: string
}>()

interface Device {
    name: string
    width: number
    height: number
}

const devices: Device[] = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12/13/14', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'Pixel 7', width: 412, height: 915 },
    { name: 'Galaxy S20', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 },
]

const selectedDeviceName = ref(devices[1].name)
const selectedDevice = computed(() => devices.find(d => d.name === selectedDeviceName.value) || devices[0])
</script>

<template>
    <div class="flex flex-col items-center gap-4 w-full h-full p-4 bg-muted/20">
        <div class="flex items-center gap-2">
            <USelect v-model="selectedDeviceName" :options="devices" option-attribute="name" value-attribute="name"
                class="" />
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
            <iframe :src="props.src" class="w-full h-full bg-white border-none" :title="selectedDevice.name" />
        </div>
    </div>
</template>
