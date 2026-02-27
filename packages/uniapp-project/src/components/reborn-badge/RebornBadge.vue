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

const props = withDefaults(defineProps<BadgeProps>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  closeIcon: 'i-mdi-close-circle', // Standard icon name, change if using SVG/Lucide
})

const emit = defineEmits(['close', 'click'])

const b = tv(theme)

export interface BadgeProps {
  label?: string | number
  color?: typeof badgeColors[number]
  variant?: typeof badgeVariants[number]
  size?: typeof badgeSizes[number]
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
  // Only stop propagation if we are handling close
  // In UniApp we might default stop
  // e.stopPropagation() // Standard Vue
  isClosing.value = true
  setTimeout(() => {
    emit('close', e)
    // Optional: reset isClosing if the component is not destroyed (e.g. parent doesn't hide it)
    // But usually it is hidden. If not, it stays invisible.
    // Let's reset it just in case? No, if we reset, it pops back in.
    // If the parent doesn't hide it, it stays invisible (closing state).
  }, 200)
}
</script>

<template>
  <view
    :class="ui.base({ class: cn(props.customClass, `
      transition-all duration-200 ease-in-out
    `, isClosing && 'scale-90 opacity-0') })"
    @tap="onClick"
  >
    <slot name="leading">
      <view v-if="props.icon" :class="cn(props.icon, ui.leadingIcon())" />
    </slot>

    <slot>
      <text v-if="props.label" :class="ui.label()">{{ props.label }}</text>
    </slot>

    <slot name="trailing" />

    <view v-if="props.closable" :class="ui.closeButton()" @tap.stop="handleClose">
      <slot name="close">
        <!-- Using simple text x or check if icon component exists -->
        <!-- <text>×</text> -->
        <view :class="cn(props.closeIcon, ui.closeIcon())" /> <!-- Assuming icon class -->
      </slot>
    </view>
  </view>
</template>

<style scoped></style>
