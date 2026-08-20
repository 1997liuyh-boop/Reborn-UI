<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { backTopColors, backTopSizes } from './reborn-back-top.config'
import { computed } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-back-top.config'

defineOptions({
  name: 'RebornBackTop',
})

const props = withDefaults(defineProps<BackTopProps>(), {
  scrollTop: 0,
  threshold: 300,
  bottom: 20,
  duration: 300,
  isTab: false,
  safeArea: true,
  color: 'primary',
  size: 'md',
})

const emit = defineEmits([
  /** 点击返回顶部按钮时触发，无参数；组件已先发起回到顶部滚动，无需在回调中重复处理 */
  'click',
])

export interface BackTopProps {
  // 当前页面的滚动距离
  scrollTop?: number
  // 滚动多少距离后显示
  threshold?: number
  // 底部距离 (px)
  bottom?: number
  // 滚动动画时长 (ms)
  duration?: number
  // 是否是 TabBar 页面 (如果是，会自动抬高 50px)
  isTab?: boolean
  // 是否适配安全区域
  safeArea?: boolean
  color?: typeof backTopColors[number]
  size?: typeof backTopSizes[number]
  ui?: {
    wrapper?: ClassValue
    base?: ClassValue
    icon?: ClassValue
  }
}

const b = tv(theme)

// 获取安全区域高度
function getSafeAreaBottom(): number {
  const windowInfo = uni.getWindowInfo()
  return windowInfo?.safeAreaInsets?.bottom || 0
}

// 计算最终底部距离
const viewBottom = computed(() => {
  let h = props.bottom

  // 1. 如果开启了安全区域适配 (通常非 Tab 页需要避开底部黑条)
  if (props.safeArea) {
    h += getSafeAreaBottom()
  }

  // 2. 如果是 Tab 页，额外抬高 50px (标准 TabBar 高度)
  // 这样你就不用手动写 bottom="70" 了
  if (props.isTab) {
    h += 50
  }

  return `${h}px`
})

// 是否显示
const visible = computed(() => props.scrollTop > props.threshold)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    color: props.color,
    size: props.size,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
  }
})

// 回到顶部
function toTop() {
  uni.pageScrollTo({
    scrollTop: 0,
    duration: props.duration,
  })
  emit('click')
}
</script>

<template>
  <view :class="ui.wrapper()" :style="{ bottom: viewBottom, opacity: visible ? 1 : 0 }" @tap.stop="toTop">
    <slot>
      <view :class="[
        ui.base(),
        visible ? '-translate-x-3' : 'translate-x-20',
      ]">
        <text :class="ui.icon()">↑</text>
      </view>
    </slot>
  </view>
</template>
