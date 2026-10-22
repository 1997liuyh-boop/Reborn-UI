<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { motionPresets, runMotion, stopMotion } from '@/lib/motion'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-collapse.config'

export interface RebornCollapseProps {
    disabled?: boolean
    position?: 'bottom' | 'top'
    absolute?: boolean
    customClass?: ClassValue
    ui?: {
        root?: ClassValue
        trigger?: ClassValue
        content?: ClassValue
    }
}

const props = withDefaults(defineProps<RebornCollapseProps>(), {
    disabled: false,
    position: 'bottom',
    absolute: false,
    customClass: '',
    ui: () => ({})
})

const emit = defineEmits<{
    (e: 'toggle', value: boolean): void
}>()
const collapse = defineModel("modelValue", {
    type: Boolean,
    default: false
})

const isAnimating = ref(false)
const b = tv(theme)
const ui = computed(() => b({
    open: collapse.value,
    position: props.position,
    absolute: props.absolute,
    animating: isAnimating.value
}))
const overrides = computed(() => props.ui || {})

const triggerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
let generation = 0

/** 从动画中的可见高度续接；收起完成后才交回 0fr，避免提前裁掉内容。 */
watch([collapse, () => props.absolute, () => props.position], async () => {
    const trigger = triggerRef.value
    const content = contentRef.value
    if (!trigger || !content) return
    const version = ++generation
    const previousHeight = trigger.getBoundingClientRect().height
    const previousTransform = typeof getComputedStyle === 'function' ? getComputedStyle(content).transform : 'none'
    stopMotion(trigger)
    stopMotion(content)
    isAnimating.value = true
    await nextTick()
    if (version !== generation) return
    if (triggerRef.value !== trigger) {
        isAnimating.value = false
        return
    }
    const element = props.absolute ? content : trigger
    let animation
    if (props.absolute) {
        trigger.style.removeProperty('height')
        content.style.removeProperty('transform')
        const targetTransform = typeof getComputedStyle === 'function' ? getComputedStyle(content).transform : 'none'
        animation = runMotion(content, { transform: [previousTransform, targetTransform] }, motionPresets.slow)
    } else {
        // 动画中从浮层切回文档流时，清掉停止后保留的平移，避免内容永久偏移。
        content.style.removeProperty('transform')
        animation = runMotion(trigger, { height: [`${previousHeight}px`, `${collapse.value ? content.scrollHeight : 0}px`] }, motionPresets.slow)
    }
    await animation.finished
    if (version !== generation) return
    element.style.removeProperty(props.absolute ? 'transform' : 'height')
    isAnimating.value = false
})

function show() { collapse.value = true }
function hide() { collapse.value = false }

function toggle() {
    if (props.disabled) return
    if (collapse.value) { hide() } else { show() }
    emit('toggle', collapse.value)
}

function resize() { }

onBeforeUnmount(() => {
    generation++
    stopMotion(triggerRef.value)
    stopMotion(contentRef.value)
})

defineExpose({ show, hide, toggle, resize, isAnimating })
</script>

<template>
  <div :class="ui.root({ class: cn(props.customClass, overrides?.root) })">
    <div v-if="position === 'top'" ref="triggerRef" :class="ui.trigger({ class: overrides?.trigger })">
      <div ref="contentRef" :class="cn(ui.content({ class: overrides?.content }))">
        <slot name="content" />
      </div>
    </div>

    <div :class="disabled ? 'cursor-not-allowed' : undefined" @click="toggle">
      <slot :open="collapse" />
    </div>

    <div v-if="position === 'bottom'" ref="triggerRef" :class="ui.trigger({ class: overrides?.trigger })">
      <div ref="contentRef" :class="cn(ui.content({ class: overrides?.content }))">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>
