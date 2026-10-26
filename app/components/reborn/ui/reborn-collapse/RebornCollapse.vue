<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants'
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onBeforeUpdate, readonly, shallowRef, useTemplateRef, watch } from 'vue'
import { motionPresets, runMotion, stopMotion } from '@/lib/motion'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { useLayoutAnimationRegistration } from '~/composables/useLayoutAnimation'
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
    (e: 'update:modelValue', value: boolean): void
    (e: 'toggle', value: boolean): void
}>()
const collapseModel = defineModel<boolean>({ default: undefined })
/**
 * 受控判断要区分「未传」与「显式传了 undefined / null」：前者由组件自己记住开合，后者按收起渲染。
 * useModel 只看值、分不出这两种情况，所以读原始 vnode.props 的键（模板写法保留连字符键，两种都认）。
 * 只在更新前同步一个布尔值，键集合没变时 controlled 不变，collapse 也不跟着重算
 */
const instance = getCurrentInstance()!
function hasModelProp() {
    const raw = instance.vnode.props
    return !!raw && (Object.hasOwn(raw, 'modelValue') || Object.hasOwn(raw, 'model-value'))
}
const controlled = shallowRef(hasModelProp())
onBeforeUpdate(() => { controlled.value = hasModelProp() })
const localCollapse = shallowRef(false)
const collapse = computed({
    get: () => controlled.value ? !!instance.props.modelValue : localCollapse.value,
    set: (value: boolean) => {
        // 受控分支绕过了 useModel 的同值短路，自己比较：已是目标状态时不再派发 update:modelValue
        if (controlled.value) {
            if (!!instance.props.modelValue !== value) emit('update:modelValue', value)
        }
        else {
            localCollapse.value = value
            collapseModel.value = value
        }
    }
})

const isAnimating = shallowRef(false)
const unregisterLayoutAnimation = useLayoutAnimationRegistration(readonly(isAnimating))
const b = tv(theme)
const ui = computed(() => b({
    open: collapse.value,
    position: props.position,
    absolute: props.absolute,
    animating: isAnimating.value
}))
const overrides = computed(() => props.ui || {})

const triggerRef = useTemplateRef<HTMLElement>('triggerRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')
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
    // 受控绑定下赋值后 collapse.value 要等父组件回流才更新，载荷必须用本地算出的新值
    const next = !collapse.value
    collapse.value = next
    emit('toggle', next)
}

function resize() { }

onBeforeUnmount(() => {
    unregisterLayoutAnimation?.()
    generation++
    stopMotion(triggerRef.value)
    stopMotion(contentRef.value)
})

// isAnimating 只读暴露：动画收尾与 animating 变体都依赖它，不允许外部改写
defineExpose({ show, hide, toggle, resize, isAnimating: readonly(isAnimating) })
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
