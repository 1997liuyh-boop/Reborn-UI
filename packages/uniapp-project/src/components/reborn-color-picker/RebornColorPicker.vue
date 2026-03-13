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
import { colorStringToHsva, detectColorFormat, hsvaToColorString, type ColorFormat } from '@/lib/color-utils'

const props = defineProps({
    modelValue: { type: String, default: '#000000' },
    disabled: { type: Boolean, default: false },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
    defaultFormat: { type: String as PropType<ColorFormat | undefined>, default: undefined },
    format: { type: String as PropType<ColorFormat | undefined>, default: undefined },
    /** Popover content config */
    content: { type: Object as PropType<any>, default: () => ({ side: 'right', align: 'center', sideOffset: 8 }) },
    /** Whether to show arrow */
    arrow: { type: Boolean, default: true },
    ui: { type: Object as PropType<any>, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'onChange'])
const b = tv(theme)
const showPicker = ref(false)
const resolvedDefaultFormat = computed<ColorFormat | undefined>(() => props.defaultFormat ?? props.format)
const selectedFormat = ref<ColorFormat>(resolvedDefaultFormat.value ?? detectColorFormat(props.modelValue))

// Internal color state in HSVA to avoid precision loss
const internalHsva = ref(colorStringToHsva(props.modelValue))

watch(() => resolvedDefaultFormat.value, (val) => {
    if (val) {
        selectedFormat.value = val
    }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
    const nextHsva = colorStringToHsva(val)
    // 与当前内部状态一致时跳过，避免 Panel 选色后产生多余回写和重渲染导致卡顿
    const same =
        internalHsva.value.h === nextHsva.h &&
        internalHsva.value.s === nextHsva.s &&
        internalHsva.value.v === nextHsva.v &&
        internalHsva.value.a === nextHsva.a
    if (!same) {
        internalHsva.value = nextHsva
    }

    if (!resolvedDefaultFormat.value) {
        selectedFormat.value = detectColorFormat(val)
    }
}, { immediate: true })

function getFormattedColor(hsva: any) {
    return hsvaToColorString(hsva, selectedFormat.value)
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

function onPanelChange(value: string) {
    const hsva = colorStringToHsva(value)
    internalHsva.value = hsva
    emit('update:modelValue', getFormattedColor(hsva))
    emit('onChange', value)
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
            <RebornColorPickerPanel :model-value="colorValue" v-model:format="selectedFormat"
                @update:modelValue="onPanelChange" />
        </template>
    </RebornPopover>
</template>
