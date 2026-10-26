<script setup lang="ts">
import type { colorPickerSizes } from './reborn-color-picker.config'
import type { Placement } from '~/lib/placement'
import { computed, provide, shallowRef } from 'vue'
import { FORM_ITEM_KEY, FORM_KEY, useFormInject } from '~/composables/useFieldGroup'
import theme from './reborn-color-picker.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import RebornColorPickerPanel from './RebornColorPickerPanel.vue'

interface Props {
    disabled?: boolean
    /** 色块触发器尺寸，取值与主题的 size 变体一致 */
    size?: (typeof colorPickerSizes)[number]
    /** 面板出现的方向与对齐方式，与 reborn-popover 的 placement 一致；主轴放不下时自动翻到对侧 */
    placement?: Placement
    /** 面板与触发器的间距（px） */
    sideOffset?: number
    ui?: {
        root?: string
        base?: string
        icon?: string
    }
}

const open = shallowRef(false)

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    size: 'md',
    placement: 'bottom',
    sideOffset: 8,
})

/**
 * 绑定的色值：不透明时为 #rrggbb，带透明度时为 #rrggbbaa。
 * 未绑定 v-model 时退化为组件自己的本地状态，触发器色块照样跟随取色
 */
const model = defineModel<string>({ default: '#000000' })

const emit = defineEmits<{
    /** 一次取色交互结束且颜色确实变化时触发（松开拖拽、点选预设色、输入框提交） */
    (e: 'change', value: string): void
}>()

/**
 * 接入表单：尺寸、禁用跟随所在表单（控件显式传入的 size 优先），字段校验失败时触发器描边标红，
 * 一次取色交互结束（面板派发 change）后按表单的 trigger 配置触发字段校验
 */
const { size: formSize, disabled: formDisabled, isError, validate } = useFormInject(props)
const isDisabled = computed(() => !!formDisabled.value || props.disabled)
// 面板里的十六进制输入框等是本组件的内部零件，与 RebornTransfer 一样切断表单上下文，
// 否则它们会继承外层表单项的错误态（面板里的输入框跟着标红）并各自触发字段校验
provide(FORM_KEY, null)
provide(FORM_ITEM_KEY, null)

/** 拖拽中 v-model 逐帧更新让触发器跟手，校验只在松手 / 选定时做一次，避免表单里拖一下校验几十次 */
function onPanelChange(value: string) {
    emit('change', value)
    validate('change')
}

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        size: formSize.value || props.size,
        disabled: isDisabled.value,
        error: isError.value,
        open: open.value,
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    }
})
</script>

<template>
    <RebornPopover v-model:open="open" :disabled="isDisabled" :placement="placement" :side-offset="sideOffset" arrow>
        <!-- 触发器插槽 -->
        <slot>
            <div :class="ui.root()">
                <div :class="ui.base()" :style="{ backgroundColor: model }">
                    <Icon name="lucide:chevron-down" :class="ui.icon()" />
                </div>
            </div>
        </slot>

        <!-- 颜色选择面板 -->
        <template #content>
            <RebornColorPickerPanel v-model="model" @change="onPanelChange" />
        </template>
    </RebornPopover>
</template>
