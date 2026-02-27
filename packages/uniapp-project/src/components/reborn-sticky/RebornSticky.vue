<script lang="ts" setup>
import { computed, getCurrentInstance, onMounted, reactive, ref, watch } from 'vue'
import { tv } from '@/lib/tv'
import { isHarmony } from '@/lib/device'
import theme from './reborn-sticky.config'

defineOptions({
  name: 'RebornSticky',
})

const props = withDefaults(defineProps<RebornStickyProps>(), {
  offsetTop: 0,
  zIndex: 100,
  scrollTop: 0,
  isNeedNavbarHeight: true,
  navbarHeight: 44,
})

defineSlots<{
  default: (props: { isSticky: boolean }) => any
}>()

export interface RebornStickyProps {
  // 吸顶偏移量, 单位px
  offsetTop?: number
  // 层级
  zIndex?: number
  // 滚动位置
  scrollTop?: number
  // 是否需要减去导航栏高度
  isNeedNavbarHeight?: boolean
  // 导航栏高度
  navbarHeight?: number
}

const { proxy } = getCurrentInstance()!

const b = tv(theme)

// 表示元素的位置信息
interface Rect {
  height: number // 高度
  width: number // 宽度
  left: number // 距离页面左侧的距离
  top: number // 距离页面顶部的距离
}

// 存储当前sticky元素的位置信息
const rect = reactive<Rect>({
  height: 0,
  width: 0,
  left: 0,
  top: 0,
})

// 当前页面滚动的距离
const scrollTop = ref(0)

// 计算属性，判断当前是否处于吸顶状态
const isSticky = computed(() => {
  if (rect.height == 0) { return false }

  return scrollTop.value >= rect.top
})

const ui = computed(() => {
  const styles = b({
    sticky: isSticky.value,
  })
  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: opts?.class }),
    content: (opts?: { class?: any }) => styles.content({ class: opts?.class }),
  }
})

// 计算属性，返回sticky元素的top值（吸顶时的偏移量）
const stickyTop = computed(() => {
  if (isSticky.value) {
    let v = 0

    // #ifdef H5
    // H5端默认导航栏高度为44
    if (props.isNeedNavbarHeight) {
      v = props.navbarHeight
    }
    // #endif

    return v + props.offsetTop
  }
  else {
    return 0
  }
})


// 获取安全区域高度
function getSafeAreaTop(): number {
  const windowInfo = uni.getWindowInfo()
  return windowInfo?.safeAreaInsets?.top || 0
}

function isEmpty(value: any): boolean {
  if (Array.isArray(value)) {
    return (value as any[]).length == 0
  }

  if (typeof value === 'string') {
    return value == ''
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length == 0
  }

  return false
}

// 获取sticky元素的位置信息，并更新rect
function getRect() {
  const next = () => {
    uni.createSelectorQuery()
      .in(proxy)
      .select('.reborn-sticky-wrapper') // Updated selector
      .boundingClientRect()
      .exec((nodes) => {
        if (isEmpty(nodes)) {
          return
        }

        const node = nodes[0] as UniApp.NodeInfo

        // 赋值时做空值处理，保证类型安全
        rect.height = node.height ?? 0

        rect.width = node.width ?? 0
        rect.left = node.left ?? 0
        // top需要减去offsetTop并加上当前滚动距离，保证吸顶准确
        rect.top = (node.top ?? 0) - props.offsetTop + scrollTop.value
      })
  }

  if (isHarmony()) {
    setTimeout(() => {
      next()
    }, 300)
  }
  else {
    next()
  }
}

onMounted(() => {
  // 获取元素位置信息
  getRect()

  // 监听参数变化
  watch(
    () => props.scrollTop,
    (top: number) => {
      scrollTop.value = top
    },
    {
      immediate: true,
    },
  )
})

defineExpose({
  getRect,
})
</script>

<template>
  <view class="reborn-sticky-wrapper" :class="ui.wrapper()" :style="{
    height: rect.height == 0 ? 'auto' : `${rect.height}px`,
    zIndex,
  }">
    <view :class="ui.content()" :style="{
      width: isSticky ? `${rect.width}px` : '100%',
      left: isSticky ? `${rect.left}px` : 0,
      top: `${stickyTop}px`,
    }">
      <slot :is-sticky="isSticky" />
    </view>
  </view>
</template>
