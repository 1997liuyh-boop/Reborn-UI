<script setup lang="ts">
import type { Placement } from '~/lib/placement'
import { computed, provide } from 'vue'
import { useFormInject } from '~/composables/useFieldGroup'
import theme from './reborn-color-picker.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import RebornButton from '../reborn-button/RebornButton.vue'
import RebornColorPickerPanel from './RebornColorPickerPanel.vue'

interface Props {
    modelValue?: string
    disabled?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg',
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

const open = ref(false)

const props = withDefaults(defineProps<Props>(), {
    modelValue: '#000000',
    disabled: false,
    size: 'md',
    placement: 'bottom',
    sideOffset: 8,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

/**
 * 接入表单：尺寸、禁用跟随所在表单（控件显式传入的 size 优先），字段校验失败时触发器描边标红，
 * 取色后按表单的 trigger 配置触发字段校验
 */
const { size: formSize, disabled: formDisabled, isError, validate } = useFormInject(props)
const isDisabled = computed(() => !!formDisabled.value || props.disabled)
// 面板里的十六进制输入框等是本组件的内部零件，与 RebornTransfer 一样切断表单上下文，
// 否则它们会继承外层表单项的错误态（面板里的输入框跟着标红）并各自触发字段校验
provide('rebornForm', null)
provide('rebornFormItem', null)

// --- 颜色值计算属性 ---
const colorValue = computed({
    get: () => props.modelValue!,
    set: (val: string) => {
        emit('update:modelValue', val)
        validate('change')
    },
})

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
                <div :class="ui.base()" :style="{ backgroundColor: colorValue }">
                    <Icon name="lucide:chevron-down" :class="ui.icon()" />
                </div>
            </div>
        </slot>

        <!-- 颜色选择面板 -->
        <template #content>
            <RebornColorPickerPanel v-model="colorValue" />
        </template>
    </RebornPopover>
</template>
