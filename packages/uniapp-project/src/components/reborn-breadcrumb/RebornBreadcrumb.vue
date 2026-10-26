<script setup lang="ts">
import type { BreadcrumbDroplistItem, BreadcrumbRoute, BreadcrumbUI } from './reborn-breadcrumb.config'
import { computed, onMounted, watch } from 'vue'
import { useChildren } from '@/composables/useChildren'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { BREADCRUMB_INJECTION_KEY } from './reborn-breadcrumb.config'
import RebornBreadcrumbItem from './RebornBreadcrumbItem.vue'

export interface RebornBreadcrumbProps {
  /** 分隔符文字 */
  separator?: string | number
  /** 图标分隔符（图标类名，如 i-lucide-chevron-right），优先级高于 separator */
  separatorIcon?: any
  /** 路径数据，传入后由组件驱动渲染，无需再手写子条目 */
  routes?: BreadcrumbRoute[]
  /** 最多展示的面包屑数量，0 表示不限制，超出部分折叠为省略号 */
  maxCount?: number
  /** 自定义链接地址，入参为当前条目及其祖先的 path 数组 */
  customUrl?: (paths: string[]) => string
  /** 追加到面包屑根节点的自定义类名 */
  customClass?: any
  /** 细粒度样式覆盖对象，会级联到所有子条目 */
  ui?: BreadcrumbUI
}

const props = withDefaults(defineProps<RebornBreadcrumbProps>(), {
  separator: '/',
  maxCount: 0,
  ui: () => ({})
})

const emit = defineEmits<{
  /** routes 模式下点击下拉菜单项时触发 */
  (e: 'select', item: BreadcrumbDroplistItem, index: number): void
}>()

// 子项顺序以实际 vnode 树为准，中间插入/删除后重新排序。
const { children, linkChildren } = useChildren(BREADCRUMB_INJECTION_KEY)

// --- max-count 折叠 ---
/** 条目总数：routes 模式取数据长度，插槽模式取注册数量 */
const total = computed(() => (props.routes?.length ? props.routes.length : children.length))

/** 折叠区间 [start, end)，落在区间内的条目隐藏；保留首项与末尾 maxCount - 1 项 */
const collapseRange = computed(() => {
  const max = props.maxCount || 0
  if (max <= 0 || total.value <= max) { return null }
  return { start: 1, end: total.value - max + 1 }
})

const isCollapsing = computed(() => !!collapseRange.value)

function isItemCollapsed(index: number) {
  const range = collapseRange.value
  if (!range || index < 0) { return false }
  return index >= range.start && index < range.end
}

/**
 * 首尾项判定。
 * 根因：小程序自定义组件的根节点恒为其组件内唯一子节点，:first-child / :last-child 恒成立，
 * 条目无法靠结构伪类识别自己是不是首尾项。
 * 方案：由父组件按注册索引与总数下发结论，两端表现一致。
 */
function isItemFirst(index: number) {
  return index === 0
}

function isItemLast(index: number) {
  return index >= 0 && index === total.value - 1
}

// --- routes 模式的地址解析 ---
/** 取第 index 项及其所有祖先的 path 集合 */
function pathsOf(index: number): string[] {
  return (props.routes || [])
    .slice(0, index + 1)
    .map(route => route.path || '')
    .filter(Boolean)
}

/** 解析条目最终跳转地址：custom-url 优先于 route.path；末项代表当前页，不生成链接 */
function hrefOf(index: number): string | undefined {
  const routes = props.routes || []
  const route = routes[index]
  if (!route || index === routes.length - 1) { return undefined }
  if (props.customUrl) { return props.customUrl(pathsOf(index)) }
  return route.path
}

// --- 样式计算 ---
const b = tv(theme)
const ui = computed(() => {
  const styles = b()
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
    item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class, props.ui?.item) }),
    more: (opts?: { class?: any }) => styles.more({ class: cn(opts?.class, props.ui?.more) }),
    moreIcon: (opts?: { class?: any }) => styles.moreIcon({ class: cn(opts?.class, props.ui?.moreIcon) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class, props.ui?.separator) })
  }
})

const context = {
  separator: computed(() => props.separator),
  separatorIcon: computed(() => props.separatorIcon),
  collapsing: isCollapsing,
  ui: computed(() => props.ui || {}),
  indexOfItemUid: (uid: number) => children.findIndex(child => child.$.uid === uid),
  isItemCollapsed,
  isItemFirst,
  isItemLast
}

linkChildren(context)

// #ifndef H5
// 小程序没有 VNode 树可供排序：挂载后新增、且没有逐项传 order 的条目只能按登记顺序追加到末尾，
// 中间插入会让首尾分隔符与折叠区间错位。开发态提示一次，避免漏传 order 时静默复现。
// uni 构建会把 process.env.NODE_ENV 替换成常量；UniApp 工程只引入了 @dcloudio/types，这里补一个仅类型的最小声明
declare const process: { env: { NODE_ENV?: string } }
if (process.env.NODE_ENV !== 'production') {
  let mounted = false
  let warned = false
  onMounted(() => { mounted = true })
  watch(() => children.length, (length, previous) => {
    if (!mounted || warned || length <= previous || props.routes?.length) return
    if (children.every(child => Number.isFinite(child.$.props.order))) return
    warned = true
    console.warn('[RebornBreadcrumb] 小程序端插槽模式下挂载后新增了条目，但并非每个 RebornBreadcrumbItem 都传了 order：新条目只会追加到末尾，中间插入时首尾分隔符与折叠会错位。请为动态条目逐项传入 :order（见文档「两端差异对照」），或改用 routes。')
  })
}
// #endif
</script>

<template>
  <view :class="ui.root()">
    <!--
      根因：省略号必须落在首项之后，但默认插槽的条目由使用者书写，父组件无法插入到它们中间。
      方案：省略号固定渲染在最前，再用 flex order（省略号取 1、条目取 index * 2）纠正视觉顺序。
    -->
    <view v-if="isCollapsing" :class="ui.item()" :style="{ order: 1 }">
      <view :class="ui.more()">
        <slot name="more-icon">
          <view class="i-lucide-ellipsis" :class="ui.moreIcon()" />
        </slot>
      </view>
      <view :class="ui.separator()">
        <slot name="separator">
          <view v-if="props.separatorIcon" :class="props.separatorIcon" />
          <text v-else>{{ props.separator }}</text>
        </slot>
      </view>
    </view>

    <!-- routes 模式：条目由组件渲染，item-render 插槽可接管单项内容 -->
    <template v-if="props.routes?.length">
      <RebornBreadcrumbItem
        v-for="(route, index) in props.routes"
        :key="index"
        :order="index"
        :to="hrefOf(index)"
        :droplist="route.children"
        @select="(item) => emit('select', item, index)"
      >
        <slot name="item-render" :route="route" :routes="props.routes" :paths="pathsOf(index)">
          <text>{{ route.label }}</text>
        </slot>
        <!-- 无条件转发并在这一层兜底：小程序编译器把转发的具名插槽一律记为已传入，
             子条目的 $slots.separator 恒为真，靠子条目自己的后备内容会让分隔符消失 -->
        <template #separator>
          <slot name="separator">
            <view v-if="props.separatorIcon" :class="props.separatorIcon" />
            <text v-else>{{ props.separator }}</text>
          </slot>
        </template>
      </RebornBreadcrumbItem>
    </template>

    <!-- 默认插槽模式：使用者自行书写 RebornBreadcrumbItem -->
    <slot v-else />
  </view>
</template>
