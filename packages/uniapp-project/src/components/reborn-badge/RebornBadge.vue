<script setup lang="ts">
import { badgeColors, badgeSizes, badgeVariants } from './reborn-badge.config'
import { computed, nextTick, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-badge.config'
import RebornTransition from '../reborn-transition/RebornTransition.vue'

defineOptions({
  name: 'RebornBadge',
  inheritAttrs: false,
})

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

const props = withDefaults(defineProps<BadgeProps>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  closeIcon: 'i-mdi-close-circle',
  gap: false
})

const emit = defineEmits(['close', 'click'])

const show = defineModel<boolean>('show', { default: true })

const b = tv(theme)

const slots = useSlots()

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    color: props.color,
    variant: props.variant,
    size: props.size,
    square: props.square || (!props.label && !props.icon && !slots.default),
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
})

function onClick(e: any) {
  emit('click', e)
}

function handleClose(e: any) {
  show.value = false
  nextTick(() => {
    emit('close', e)
  })
}
</script>

<template>
  <RebornTransition :show="show" name="badge-custom" :duration="200" destroy :custom-class="ui.root()">
    <view :class="ui.base({
      class: cn(props.customClass)
    })" @tap="onClick">
      <slot name="leading">
        <view v-if="props.icon" :class="cn(props.icon, ui.leadingIcon())" />
      </slot>

      <!-- 微信小程序中 text 内不得再嵌套 text/slot 文本节点，否则子内容不渲染只剩占位；用 view 包住 -->
      <view v-if="props.label || slots.default" :class="ui.label()">
        <slot>
          <text v-if="props.label">{{ props.label }}</text>
        </slot>
      </view>

      <slot name="trailing" />

      <view v-if="props.closable" :class="ui.closeButton()" @tap.stop="handleClose">
        <slot name="close">
          <view :class="cn(props.closeIcon, ui.closeIcon())" />
        </slot>
      </view>
    </view>
  </RebornTransition>
</template>

<style scoped></style>
