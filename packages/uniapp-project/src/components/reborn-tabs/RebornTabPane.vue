<script setup lang="ts">
import type { TabKey, TabPaneMeta, TabsContext } from './reborn-tabs.config'
import {
  computed,
  getCurrentInstance,
  inject,
  onBeforeUnmount,
  ref,
  shallowReactive,
  watch,
  watchEffect,
} from 'vue'
import { cn } from '@/lib/utils'
import { TABS_INJECTION_KEY } from './reborn-tabs.config'

defineOptions({
  name: 'RebornTabPane',
})

const props = withDefaults(defineProps<RebornTabPaneProps>(), {
  disabled: false,
  closable: true,
  destroyOnHide: false,
})

export interface RebornTabPaneProps {
  /** 标题文本 */
  title?: string
  /** 是否禁用，禁用后点击与悬停都不会切换 */
  disabled?: boolean
  /** 是否允许关闭此选项卡，仅在可编辑模式生效 */
  closable?: boolean
  /** 是否在不显示此标签时销毁内容，与父级同名参数取或 */
  destroyOnHide?: boolean
}

const ctx = inject<TabsContext | null>(TABS_INJECTION_KEY, null)
if (!ctx) throw new Error('[RebornTabPane] 必须作为 RebornTabs 的子组件使用')

const instance = getCurrentInstance()

/** 登记到父级的元信息，父级据此渲染头部；未写 key 时留空由父级补序号 */
const meta = shallowReactive<TabPaneMeta>({
  key: (instance?.vnode.key ?? undefined) as TabKey,
  title: props.title,
  disabled: props.disabled,
  closable: props.closable,
  destroyOnHide: props.destroyOnHide,
})

watchEffect(() => {
  meta.title = props.title
  meta.disabled = props.disabled
  meta.closable = props.closable
  meta.destroyOnHide = props.destroyOnHide
})

ctx.addPane(meta)

const isActive = computed(() => ctx.activeKey.value === meta.key)
const destroyOnHide = computed(() => props.destroyOnHide || ctx.destroyOnHide.value)

/** 记录是否被展示过，lazy-load 据此决定首次挂载时机 */
const shown = ref(false)
watchEffect(() => {
  if (isActive.value) shown.value = true
})

const shouldRender = computed(() => {
  if (destroyOnHide.value) return isActive.value
  if (ctx.lazyLoad.value) return shown.value
  return true
})

/** 小程序端没有 Transition，入场动画只能靠切换类名实现 */
const faded = ref(false)
watch(
  isActive,
  value => {
    if (!value) {
      faded.value = false
      return
    }
    // display 由 none 变回可见的同帧改样式不会触发过渡，须等下一帧
    faded.value = false
    setTimeout(() => {
      faded.value = true
    }, 20)
  },
  { immediate: true },
)

/**
 * 入场的复合过渡：透明度之外再叠缩放与位移，新旧内容就有一段互相渗透的观感。
 * 与 web 端两处刻意不同：
 * 1. 不加模糊 —— 小程序渲染层对 filter: blur 支持不稳；
 * 2. 只缩放 X 轴 —— 父级的高度过渡靠 boundingClientRect 异步量进场面板的净高，
 *    而它返回的是形变后的盒子，纵向缩放 0.98 会把高度量少约 2%，过渡末尾会跳一下。
 *    横向缩放不影响量到的高度，观感上也够
 */
const paneClass = computed(() =>
  cn(
    ctx.paneClass.value,
    ctx.animation.value
      && (faded.value
        ? 'opacity-100 scale-x-100 translate-y-0'
        : 'opacity-0 scale-x-98 translate-y-[8rpx]'),
  ),
)

onBeforeUnmount(() => {
  ctx.removePane(meta)
})
</script>

<template>
  <!-- active 专属类是父级量高度的锚点：v-show 隐藏的兄弟节点量出 0，只能单点查询选中的那个 -->
  <view
    v-show="isActive"
    class="reborn-tabs__pane"
    :class="[paneClass, isActive ? 'reborn-tabs__pane--active' : '']"
  >
    <slot v-if="shouldRender" />
  </view>
</template>
