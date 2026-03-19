<script setup lang="ts">
import type { badgeColors, badgeSizes, badgeVariants } from './reborn-badge.config'
import { computed, ref, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-badge.config'

defineOptions({
  name: 'RebornBadge',
  inheritAttrs: false,
})

import type { BadgeColor, BadgeSize, BadgeVariant } from './reborn-badge.config'

export interface BadgeProps {
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
})

const emit = defineEmits(['close', 'click'])

const b = tv(theme)

const slots = useSlots()
const isClosing = ref(false)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    color: props.color,
    variant: props.variant,
    size: props.size,
    square: props.square || (!props.label && !props.icon && !slots.default),
  })

  return {
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
  isClosing.value = true
  nextTick(() => {
    emit('close', e)
  })
}
</script>

<template>
  <view :class="ui.base({
    class: cn(props.customClass, `
      transition-all duration-200 ease-in-out
    `, isClosing && 'scale-90 opacity-0')
  })" @tap="onClick">
    <slot name="leading">
      <view v-if="props.icon" :class="cn(props.icon, ui.leadingIcon())" />
    </slot>

    <slot>
      <text v-if="props.label" :class="ui.label()">{{ props.label }}</text>
    </slot>

    <slot name="trailing" />

    <view v-if="props.closable" :class="ui.closeButton()" @tap.stop="handleClose">
      <slot name="close">
        <view :class="cn(props.closeIcon, ui.closeIcon())" />
      </slot>
    </view>
  </view>
</template>

<style scoped></style>
