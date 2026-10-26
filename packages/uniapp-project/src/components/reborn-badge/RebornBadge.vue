<script setup lang="ts">
import type { badgeColors, badgeSizes, badgeVariants } from './reborn-badge.config'
import { computed, nextTick } from 'vue'
import { useBooleanModel } from '@/composables/useBooleanModel'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import RebornTransition from '../reborn-transition/RebornTransition.vue'
import theme from './reborn-badge.config'

defineOptions({
  name: 'RebornBadge',
})

const props = withDefaults(defineProps<BadgeProps>(), {
  color: 'primary',
  variant: 'filled',
  size: 'md',
  closeIcon: 'i-mdi-close-circle',
  gap: false
})
const emit = defineEmits<{
  'update:show': [value: boolean]
  'update:checked': [value: boolean]
  /** 点击关闭按钮、徽章隐藏后触发 */
  close: [ev: unknown]
  /** 点击徽章时触发 */
  click: [ev: unknown]
  /** 可选中模式下选中态切换时触发，载荷为切换后的新值 */
  change: [checked: boolean]
}>()

/** 插槽签名与 web 端 BadgeSlots 对齐：均透出 ui 作用域，close 插槽额外透出关闭方法 */
const slots = defineSlots<{
  leading?: (props: { ui: any }) => any
  default?: (props: { ui: any }) => any
  trailing?: (props: { ui: any }) => any
  close?: (props: { ui: any, close: (e: unknown) => void }) => any
}>()
// 直接从主体对象派生类型，以确保静态分析正常工作
type BadgeColor = (typeof badgeColors)[number]
type BadgeVariant = (typeof badgeVariants)[number]
type BadgeSize = (typeof badgeSizes)[number]

export interface BadgeProps {
  gap?: boolean
  label?: string | number
  color?: BadgeColor
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: string
  square?: boolean
  /** 圆角标签：与按钮一致变为全圆角胶囊 */
  round?: boolean
  /** 可选中模式：作为类复选框的 Check Tag 使用，配合 v-model:checked */
  check?: boolean
  /** 是否禁用（可选中模式下屏蔽选中与关闭交互） */
  disabled?: boolean
  closable?: boolean
  closeIcon?: string
  customClass?: any
  ui?: {
    root?: string
    base?: string
    label?: string
    leadingIcon?: string
    trailingIcon?: string
    closeButton?: string
    closeIcon?: string
  }
}

defineModel<boolean>('show', { default: undefined })
defineModel<boolean>('checked', { default: undefined })
const show = useBooleanModel('show', true)
const checked = useBooleanModel('checked')

const b = tv(theme)

const uiOverrides = computed(() => props.ui || {})

function buildUi(square: boolean) {
  const styles = b({
    color: props.color,
    variant: props.variant,
    size: props.size,
    square,
    round: props.round,
    unchecked: props.check && !checked.value,
    disabled: props.disabled,
    gap: props.gap,
  })

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
    leadingIcon: (opts?: { class?: any }) => styles.leadingIcon({ class: cn(opts?.class, uiOverrides.value.leadingIcon) }),
    trailingIcon: (opts?: { class?: any }) => styles.trailingIcon({ class: cn(opts?.class, uiOverrides.value.trailingIcon) }),
    closeButton: (opts?: { class?: any }) => styles.closeButton({ class: cn(opts?.class, uiOverrides.value.closeButton) }),
    closeIcon: (opts?: { class?: any }) => styles.closeIcon({ class: cn(opts?.class, uiOverrides.value.closeIcon) }),
  }
}

// 插槽不是响应式来源，不能在 computed 里读；square 只有「是否有默认插槽」这一处依赖插槽，
// 按两种取值各缓存一套样式，模板渲染时按 $slots 二选一，避免每次 ui() 调用都重跑变体计算
/** 有默认插槽：只按 square prop 判断方形 */
const uiWithDefaultSlot = computed(() => buildUi(!!props.square))
/** 无默认插槽：没有 label 与 icon 时也按方形（纯数字 / 圆点） */
const uiWithoutDefaultSlot = computed(() => buildUi(!!props.square || (!props.label && !props.icon)))
const ui = () => (slots.default ? uiWithDefaultSlot.value : uiWithoutDefaultSlot.value)

function onClick(e: any) {
  if (props.disabled) return
  emit('click', e)
  // 可选中模式：点击即切换选中态并抛出 change。
  // 受控绑定下 defineModel 的赋值要等父组件回流才可见，change 必须带本地算好的新值
  if (props.check) {
    const next = !checked.value
    checked.value = next
    emit('change', next)
  }
}

function handleClose(e: any) {
  if (props.disabled) return
  show.value = false
  nextTick(() => {
    emit('close', e)
  })
}
</script>

<template>
  <RebornTransition :show="show" name="badge-custom" :duration="200" destroy :custom-class="ui().root()">
    <view
      :class="ui().base({
        class: cn(props.customClass)
      })" @tap="onClick"
    >
      <slot name="leading" :ui="ui()">
        <view v-if="props.icon" :class="cn(props.icon, ui().leadingIcon())" />
      </slot>

      <!-- 微信小程序中 text 内不得再嵌套 text/slot 文本节点，否则子内容不渲染只剩占位；用 view 包住 -->
      <view v-if="props.label || slots.default" :class="ui().label()">
        <slot :ui="ui()">
          <text v-if="props.label">{{ props.label }}</text>
        </slot>
      </view>

      <slot name="trailing" :ui="ui()" />

      <view v-if="props.closable" :class="ui().closeButton()" @tap.stop="handleClose">
        <slot name="close" :ui="ui()" :close="handleClose">
          <view :class="cn(props.closeIcon, ui().closeIcon())" />
        </slot>
      </view>
    </view>
  </RebornTransition>
</template>

<style scoped></style>
