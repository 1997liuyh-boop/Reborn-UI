<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
  stickyTriggerLead: 0,
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
  // 吸顶判定提前 (px)，用于根节点上方还有标题等与测量 top 不对齐时
  stickyTriggerLead?: number
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
const scrollTop = computed(() => props.scrollTop)
let disposed = false
let measureVersion = 0
let measureTimer: ReturnType<typeof setTimeout> | undefined

// 计算属性，判断当前是否处于吸顶状态
const isSticky = computed(() => {
  if (rect.height == 0) { return false }

  // 添加1px的容差，避免微信小程序滚动精度问题
  const triggerTop = Math.max(0, rect.top - props.stickyTriggerLead)
  return scrollTop.value + 1 >= triggerTop
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


// 测量 sticky 元素并更新 rect；updatePosition 为 false 时只刷新宽高、不动吸顶触发点
let positionPending = false
function measure(updatePosition: boolean) {
  const version = ++measureVersion
  // 被后一次测量作废的「重算位置」请求要并入本次，避免外部 getRect 的位置更新被内部重测吞掉
  positionPending = positionPending || updatePosition
  clearTimeout(measureTimer)
  const next = () => {
    if (disposed || version !== measureVersion) return
    uni.createSelectorQuery()
      .in(proxy)
      .select('.reborn-sticky-wrapper')
      .boundingClientRect()
      .exec((nodes) => {
        if (disposed || version !== measureVersion || !nodes?.[0]) {
          return
        }

        const node = nodes[0] as UniApp.NodeInfo

        rect.height = node.height ?? 0
        rect.width = node.width ?? 0

        if (positionPending) {
          positionPending = false
          // 外层占位容器始终保留在文档流中，每次测量都能恢复最新绝对位置。
          // node.top 取自渲染层查询时刻，scrollTop 是回到逻辑层时的 prop，滚动中两者差一次跨线程往返，
          // 所以只在首次与外部主动重测时重算；吸顶切换后的内部重测不改触发点，避免临界点来回跳
          rect.left = node.left ?? 0
          rect.top = (node.top ?? 0) + scrollTop.value
        }
      })
  }

  if (isHarmony()) {
    measureTimer = setTimeout(() => {
      next()
    }, 300)
  }
  else {
    next()
  }
}

// 获取sticky元素的位置信息，并更新rect（对外暴露，内容或布局变化后手动调用）
function getRect() {
  measure(true)
}

onMounted(() => {
  // 获取元素位置信息
  getRect()

})

/**
 * 吸顶前在文档流里的宽度。父容器按内容收缩包裹时（如 flex 列 align-items: flex-start），
 * 内容 fixed 后不再撑开占位容器，它会被压成 0 宽，重测出的内容宽度也随之归零；
 * 吸顶期间靠它把占位容器撑回原宽度。切换的这一刻 rect 仍是吸顶前的测量值
 */
const flowWidth = ref(0)
// 吸顶状态切换后布局会变，下一帧只重测宽高；占位容器仍在文档流里，触发点不变。
watch(isSticky, (value) => {
  if (value) flowWidth.value = rect.width
  nextTick(() => { if (!disposed) measure(false) })
})
onBeforeUnmount(() => {
  disposed = true
  measureVersion++
  clearTimeout(measureTimer)
})

defineExpose({
  // 重新测量组件的位置与尺寸并更新内部 rect（内容或布局变化导致高度改变后可手动调用）
  getRect,
  // 当前是否处于吸顶状态
  isSticky,
})
</script>

<template>
  <view class="reborn-sticky-wrapper" :class="ui.wrapper()" :style="{
    height: rect.height > 0 ? `${rect.height}px` : 'auto',
    // 只设下限不写死宽度：块级父容器里占位仍随父容器伸缩；100% 保证父容器变窄时不撑破
    minWidth: isSticky && flowWidth > 0 ? `min(${flowWidth}px, 100%)` : undefined,
    zIndex,
  }">
    <view :class="ui.content()" :style="{
      width: isSticky ? `${rect.width}px` : 'auto',
      left: isSticky ? `${rect.left}px` : 'auto',
      top: isSticky ? `${stickyTop}px` : 'auto',
    }">
      <slot :is-sticky="isSticky" />
    </view>
  </view>
</template>
