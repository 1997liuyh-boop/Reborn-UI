<script setup lang="ts">
import { computed, useAttrs, useSlots, ref } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { badgeColors, badgeSizes, badgeVariants } from './reborn-badge.config'

defineOptions({
  name: 'reborn-badge',
  inheritAttrs: false,
})

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
  class?: any
}

const props = withDefaults(defineProps<BadgeProps>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  closeIcon: 'i-mdi-close-circle', // Standard icon name, change if using SVG/Lucide
})

const emit = defineEmits(['close', 'click'])

const attrs = useAttrs()
const slots = useSlots()
const isClosing = ref(false)

const ui = computed(() => {
  const styles = b({
    color: props.color,
    variant: props.variant,
    size: props.size,
    square: props.square || (!props.label && !props.icon && !slots.default),
  })

  return {
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class) }),
    leadingIcon: (opts?: { class?: any }) => styles.leadingIcon({ class: cn(opts?.class) }),
    trailingIcon: (opts?: { class?: any }) => styles.trailingIcon({ class: cn(opts?.class) }),
    closeButton: (opts?: { class?: any }) => styles.closeButton({ class: cn(opts?.class) }),
    closeIcon: (opts?: { class?: any }) => styles.closeIcon({ class: cn(opts?.class) }),
  }
})

const onClick = (e: any) => {
  emit('click', e)
}

const handleClose = (e: any) => {
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
    :class="ui.base({ class: cn(props.class, 'transition-all duration-200 ease-in-out', isClosing && 'opacity-0 scale-90') })"
    @tap="onClick">
    <slot name="leading">
      <view v-if="props.icon" :class="cn('mr-1', props.icon, ui.leadingIcon())"></view>
    </slot>

    <slot>
      <text v-if="props.label" :class="ui.label()">{{ props.label }}</text>
    </slot>

    <slot name="trailing"></slot>

    <view v-if="props.closable" @tap.stop="handleClose" :class="ui.closeButton()">
      <slot name="close">
        <!-- Using simple text x or check if icon component exists -->
        <!-- <text>×</text> -->
        <view :class="cn(props.closeIcon, ui.closeIcon())" /> <!-- Assuming icon class -->
      </slot>
    </view>
  </view>
</template>

<style scoped></style>
