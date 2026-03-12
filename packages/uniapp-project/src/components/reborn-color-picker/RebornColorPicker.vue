<script lang="ts">
export default {
    name: 'reborn-color-picker',
    options: {
        virtualHost: true,
        addGlobalClass: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, ref, type PropType, watch } from 'vue'
import { tv } from '@/lib/tv'
import theme from './reborn-color-picker.config'
import RebornPopover from '../reborn-popover/RebornPopover.vue'
import RebornColorPickerPanel from './RebornColorPickerPanel.vue'
import { hexToHsva, hsvaToHex, hsvaToRgba, rgbaToHex, hexToRgba, rgbaToHsva, hsvaToRgba as hsvaToRgbaUtil } from '@/lib/color-utils'

const props = defineProps({
    modelValue: { type: String, default: '#000000' },
    disabled: { type: Boolean, default: false },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
    format: { type: String as PropType<'hex' | 'rgb' | 'rgba'>, default: 'hex' },
    /** Popover content config */
    content: { type: Object as PropType<any>, default: () => ({ side: 'right', align: 'center', sideOffset: 8 }) },
    /** Whether to show arrow */
    arrow: { type: Boolean, default: true },
    ui: { type: Object as PropType<any>, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue'])
const b = tv(theme)
const showPicker = ref(false)

// Internal color state in HSVA to avoid precision loss
const internalHsva = ref(hexToHsva(props.modelValue))

// Watch modelValue from outside
watch(() => props.modelValue, (val) => {
    // Basic check to avoid infinite loop
    if (val === getFormattedColor(internalHsva.value)) return

    if (val.startsWith('#')) {
        internalHsva.value = hexToHsva(val)
    } else if (val.startsWith('rgb')) {
        // Simple regex for rgb/rgba
        const match = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
        if (match) {
            internalHsva.value = rgbaToHsva({
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            })
        }
    }
})

function getFormattedColor(hsva: any) {
    if (props.format === 'hex') {
        return hsvaToHex(hsva)
    }
    const rgba = hsvaToRgbaUtil(hsva)
    if (props.format === 'rgb') {
        return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`
    }
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})`
}

const colorValue = computed({
    get: () => getFormattedColor(internalHsva.value),
    set: (val: string) => emit('update:modelValue', val)
})

const uiOverrides = computed(() => props.ui || {})
const uiClasses = computed(() => {
    const styles = b({
        size: props.size,
        disabled: props.disabled
    })
    return {
        root: styles.root({ class: uiOverrides.value.root }),
        base: styles.base({ class: uiOverrides.value.base }),
        icon: styles.icon({ class: uiOverrides.value.icon }),
    }
})

function onPanelChange(hsva: any) {
    internalHsva.value = hsva
    emit('update:modelValue', getFormattedColor(hsva))
}

function togglePicker() {
    if (props.disabled) return
    showPicker.value = !showPicker.value
}
</script>

<template>
    <RebornPopover v-model="showPicker" :content="content" :arrow="arrow" :disabled="disabled">
        <view :class="uiClasses.root">
            <view :class="uiClasses.base" :style="{ backgroundColor: colorValue }" @tap="togglePicker">
                <view class="i-lucide-chevron-down text-white transition-transform duration-200"
                    :class="[uiClasses.icon, showPicker ? 'rotate-180' : '']">
                </view>
            </view>
        </view>
        <template #content>
            <RebornColorPickerPanel :modelValue="colorValue" @update:modelValue="onPanelChange" />
        </template>
    </RebornPopover>
</template>
