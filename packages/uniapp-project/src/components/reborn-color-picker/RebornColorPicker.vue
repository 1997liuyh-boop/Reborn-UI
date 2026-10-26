<script lang="ts" setup>
import type { PopoverContentProps, PopoverPlacement } from '../reborn-popover/types'
import { computed, shallowRef, watch } from 'vue'
import { colorStringToHsva, detectColorFormat, hsvaToColorString, type ColorFormat } from '@/lib/color-utils'
import { tv } from '@/lib/tv'
import RebornPopover from '../reborn-popover/RebornPopover.vue'
import theme from './reborn-color-picker.config'
import RebornColorPickerPanel from './RebornColorPickerPanel.vue'

interface Props {
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  defaultFormat?: ColorFormat
  format?: ColorFormat
  placement?: PopoverPlacement
  sideOffset?: number
  content?: PopoverContentProps
  arrow?: boolean
  ui?: { root?: string; base?: string; icon?: string }
}
defineOptions({ name: 'RebornColorPicker', options: { virtualHost: true, addGlobalClass: true, styleIsolation: 'shared' } })
const props = withDefaults(defineProps<Props>(), { disabled: false, size: 'md', arrow: true, content: () => ({ side: 'right', align: 'center', sideOffset: 8 }), ui: () => ({}) })
const emit = defineEmits<{ change: [value: string] }>()
const model = defineModel<string>({ default: '#000000' })
const b = tv(theme)
const showPicker = shallowRef(false)
const resolvedDefaultFormat = computed<ColorFormat | undefined>(() => props.defaultFormat ?? props.format)
const selectedFormat = shallowRef<ColorFormat>(resolvedDefaultFormat.value ?? detectColorFormat(model.value))

// 以 HSVA 保存内部颜色，避免格式转换损失精度。
const internalHsva = shallowRef(colorStringToHsva(model.value))

watch(() => resolvedDefaultFormat.value, (val) => {
    if (val) {
        selectedFormat.value = val
    }
}, { immediate: true })

watch(() => model.value, (val) => {
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
    set: (val: string) => { model.value = val }
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
    model.value = getFormattedColor(hsva)
    emit('change', value)
}

</script>

<template>
    <RebornPopover v-model:open="showPicker" :placement="placement" :side-offset="sideOffset" :content="content" :arrow="arrow" :disabled="disabled">
        <view :class="uiClasses.root">
            <view :class="uiClasses.base" :style="{ backgroundColor: colorValue }">
                <view class="i-lucide-chevron-down text-white transition-transform duration-200"
                    :class="[uiClasses.icon, showPicker ? 'rotate-180' : '']">
                </view>
            </view>
        </view>
        <template #content>
            <RebornColorPickerPanel :model-value="colorValue" v-model:format="selectedFormat"
                @update:modelValue="colorValue = $event" @change="onPanelChange" />
        </template>
    </RebornPopover>
</template>
