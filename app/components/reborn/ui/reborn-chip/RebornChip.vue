<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUpdate, shallowRef } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme from './reborn-chip.config'

const props = withDefaults(defineProps<ChipProps>(), {
  color: 'primary',
  size: 'md',
  position: 'top-right',
  inset: false,
  standalone: false
})

const b = tv(theme)

type Theme = typeof theme

type ChipColor = keyof Theme['variants']['color']
type ChipSize = keyof Theme['variants']['size']
type ChipPosition = keyof Theme['variants']['position']
type ChipVariant = keyof Theme['variants']['variant']

export interface ChipProps {
  /** 语义色：solid / textDot 取 6 阶作底色，outline / textOutline 取 6 阶作描边与文字色 */
  color?: ChipColor | (string & {})
  /** 尺寸档位，各变体的具体像素不同：圆点 4~6px、圆环外径 8~16px、文字角标高 16~24px */
  size?: ChipSize | (string & {})
  /**
   * 视觉变体：solid 实心圆点、outline 空心圆环、textDot 实心文字角标、textOutline 描边文字角标。
   * 不传时按 text 自动选择：有文本取 textDot，否则取 solid。
   */
  variant?: ChipVariant
  /** 角标文本，仅 textDot / textOutline 渲染；按真值判断，0 与空字符串都不显示 */
  text?: string | number
  /** 角标吸附在宿主的哪个角 */
  position?: ChipPosition | (string & {})
  /** 为 true 时取消向外平移，角标整个落在宿主内部 */
  inset?: boolean
  /** 只给角标节点追加 absolute，而角标节点本身已是 absolute，目前没有可见效果 */
  standalone?: boolean
  /** 追加到根元素的自定义类名 */
  class?: any
  /** 按内部结构键（root/base/label）覆盖对应节点的样式类 */
  ui?: any
}

/** 是否渲染角标节点，配合 `v-model:show` 同步；组件内部不会改写它 */
defineModel<boolean>('show', { default: undefined })
/**
 * 要区分「未传 show」与「显式传了 undefined / null」：前者保持可见，后者隐藏。
 * defineModel 只看值、分不出这两种情况，所以读原始 vnode.props 的键；
 * 只在更新前同步一个布尔值，键集合没变时 show 不跟着重算
 */
const instance = getCurrentInstance()!
const hasShowProp = () => !!instance.vnode.props && Object.hasOwn(instance.vnode.props, 'show')
const showPassed = shallowRef(hasShowProp())
onBeforeUpdate(() => { showPassed.value = hasShowProp() })
/** 缺省时保持可见；显式 false、undefined、null 都按隐藏处理。 */
const show = computed(() => showPassed.value ? !!instance.props.show : true)

/** 实际生效的变体：未指定时按有无文本自动选择，「传 text 显示计数、不传显示圆点」的用法保持不变 */
const variant = computed<ChipVariant>(() => props.variant ?? (props.text ? 'textDot' : 'solid'))

/** 只有文字类变体渲染文本节点：solid / outline 的圆点只有 4~16px，放不下文字 */
const showLabel = computed(() => !!props.text && (variant.value === 'textDot' || variant.value === 'textOutline'))

const ui = computed(() => {
  const styles = b({
    variant: variant.value,
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
  <span :class="ui.root()">
    <slot />
    <div v-if="show" :class="ui.base()">
      <div v-if="showLabel" :class="ui.label()">
        {{ props.text }}
      </div>
    </div>
  </span>
</template>
