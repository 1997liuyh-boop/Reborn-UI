<script setup lang="ts">
import { computed } from 'vue'
import theme from './reborn-chip.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'

const b = tv(theme)

type Theme = typeof theme

type ChipColor = keyof Theme['variants']['color']
type ChipSize = keyof Theme['variants']['size']
type ChipPosition = keyof Theme['variants']['position']

export interface ChipProps {
  color?: ChipColor | (string & {})
  size?: ChipSize | (string & {})
  text?: string | number
  position?: ChipPosition | (string & {})
  show?: boolean
  inset?: boolean
  standalone?: boolean
  /** 追加到根元素的自定义类名 */
  class?: any
  /** 按内部结构键（root/base/label）覆盖对应节点的样式类 */
  ui?: any
}

const props = withDefaults(defineProps<ChipProps>(), {
  color: 'primary',
  size: 'md',
  position: 'top-right',
  show: true,
  inset: false,
  standalone: false
})

const emit = defineEmits<{
  /** 显隐状态变化时触发，配合 `v-model:show` 同步 */
  'update:show': [value: boolean]
}>()

const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const ui = computed(() => {
  const styles = b({
    color: props.color as ChipColor,
    size: props.size as ChipSize,
    position: props.position as ChipPosition,
    inset: props.inset,
    standalone: props.standalone
  })
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.class, props.ui?.root) }),
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, props.ui?.base) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, props.ui?.label) }),
  }
})
</script>

<template>
  <span :class="ui.root({ class: props.class })">
    <slot />
    <div v-if="show" :class="ui.base()">
      <div v-if="props.text" :class="ui.label()">
        {{ props.text }}
      </div>
    </div>
  </span>
</template>
