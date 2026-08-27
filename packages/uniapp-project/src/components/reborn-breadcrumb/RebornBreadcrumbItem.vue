<script setup lang="ts">
import type { BreadcrumbDroplistItem, BreadcrumbUI } from './reborn-breadcrumb.config'
import { computed, inject, onBeforeUnmount, ref, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { BREADCRUMB_INJECTION_KEY } from './reborn-breadcrumb.config'

export interface RebornBreadcrumbItemProps {
  /** 跳转目标，字符串页面路径或含 path 字段的对象 */
  to?: string | object
  /** 跳转方式，对应 uni 的四种路由 API */
  replace?: 'navigate' | 'redirect' | 'switchTab' | 'reLaunch'
  /** 预留的链接打开方式属性：uniapp 端跳转方式由 replace 决定，当前不参与跳转逻辑 */
  target?: string
  /** 分隔符文字，优先级高于父组件的 separator */
  separator?: string | number
  /** 图标分隔符（图标类名），优先级高于本条目的 separator */
  separatorIcon?: any
  /** 下拉菜单数据 */
  droplist?: BreadcrumbDroplistItem[]
  /** 下拉菜单属性，uniapp 端仅支持 hideOnClick */
  dropdownProps?: Record<string, any>
  /** 追加到条目链接节点的自定义类名 */
  customClass?: any
  /** 细粒度样式覆盖对象，优先级高于父组件的 ui */
  ui?: BreadcrumbUI
}

const props = withDefaults(defineProps<RebornBreadcrumbItemProps>(), {
  replace: 'navigate',
  ui: () => ({})
})

const emit = defineEmits<{
  /** 点击下拉菜单项时触发 */
  (e: 'select', item: BreadcrumbDroplistItem): void
}>()

const slots = useSlots()
const context = inject<any>(BREADCRUMB_INJECTION_KEY, null)

// --- 位置信息：折叠相关状态由父组件的注册索引下发 ---
const itemId = context ? context.registerItem() : -1
onBeforeUnmount(() => context?.unregisterItem(itemId))

const index = computed(() => (context ? context.indexOfItem(itemId) : -1))
const isCollapsed = computed(() => (context ? context.isItemCollapsed(index.value) : false))

/**
 * 折叠态下父组件把省略号放在了最前，这里用 order 把条目排回原位。
 * 首尾项由父组件按索引下发，不依赖 :first-child / :last-child。
 */
const isCollapsing = computed(() => !!context?.collapsing)
const isFirst = computed(() => (context ? context.isItemFirst(index.value) : false))
const isLast = computed(() => (context ? context.isItemLast(index.value) : false))
const orderStyle = computed(() =>
  isCollapsing.value && index.value >= 0 ? { order: index.value * 2 } : undefined
)

// --- 分隔符：条目级配置优先于容器级 ---
const separatorText = computed(() => props.separator ?? context?.separator ?? '/')
const separatorIcon = computed(() => props.separatorIcon ?? context?.separatorIcon)

// --- 跳转 ---
function navigate(url: string) {
  if (!url) { return }
  const navMap = {
    navigate: uni.navigateTo,
    redirect: uni.redirectTo,
    switchTab: uni.switchTab,
    reLaunch: uni.reLaunch
  }
  const navFn = navMap[props.replace] || uni.navigateTo
  navFn({ url })
}

function handleClick() {
  if (!props.to) { return }
  const url = typeof props.to === 'string' ? props.to : (props.to as any).path || ''
  navigate(url)
}

// --- 下拉菜单 ---
const isOpen = ref(false)
const hasDroplist = computed(() => !!slots.droplist || !!props.droplist?.length)
const hideOnClick = computed(() => props.dropdownProps?.hideOnClick !== false)

function toggleDroplist() {
  if (!hasDroplist.value) { return }
  isOpen.value = !isOpen.value
}

function onSelect(item: BreadcrumbDroplistItem) {
  emit('select', item)
  if (hideOnClick.value) { isOpen.value = false }
  if (item.path) { navigate(item.path) }
}

/**
 * 面板内点击的兜底关闭。
 * 根因：#droplist 插槽的内容由使用者书写，组件拿不到它们的点击事件，
 * 选完后面板会一直展开，与 web 端点击即收起的行为不一致。
 * 方案：在面板容器上监听冒泡上来的点击，hideOnClick 时统一收起；
 * 默认菜单项自带 .stop，不会与 onSelect 重复触发。
 */
function onPanelTap() {
  if (hideOnClick.value) { isOpen.value = false }
}

// --- 样式计算 ---
const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    active: !!props.to,
    first: isFirst.value,
    last: isLast.value,
    open: isOpen.value,
    droplist: hasDroplist.value,
    collapsed: isCollapsed.value
  })
  /** 父组件的 ui 先落地，条目自身的 ui 后落地，因此条目级覆盖优先 */
  const inherited: BreadcrumbUI = context?.ui || {}
  return {
    item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class, inherited.item, props.ui?.item) }),
    link: (opts?: { class?: any }) => styles.link({ class: cn(opts?.class, inherited.link, props.ui?.link, props.customClass) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class, inherited.separator, props.ui?.separator) }),
    dropIcon: (opts?: { class?: any }) => styles.dropIcon({ class: cn(opts?.class, inherited.dropIcon, props.ui?.dropIcon) }),
    droplist: (opts?: { class?: any }) => styles.droplist({ class: cn(opts?.class, inherited.droplist, props.ui?.droplist) }),
    droplistItem: (opts?: { class?: any }) => styles.droplistItem({ class: cn(opts?.class, inherited.droplistItem, props.ui?.droplistItem) }),
    droplistMask: (opts?: { class?: any }) => styles.droplistMask({ class: cn(opts?.class, inherited.droplistMask, props.ui?.droplistMask) })
  }
})
</script>

<template>
  <view :class="ui.item()" :style="orderStyle">
    <!-- 带下拉菜单的条目：小程序没有传送门能力，面板直接挂在条目内做绝对定位 -->
    <template v-if="hasDroplist">
      <view :class="ui.link({ class: 'reborn-breadcrumb-item__link' })" @tap.stop="toggleDroplist">
        <slot />
        <view class="i-lucide-chevron-down" :class="ui.dropIcon()" />
      </view>
      <view v-if="isOpen" :class="ui.droplistMask()" @tap.stop="isOpen = false" />
      <view v-if="isOpen" :class="ui.droplist()" @tap="onPanelTap">
        <slot name="droplist">
          <view
            v-for="(option, optionIndex) in props.droplist"
            :key="`${option.label}-${optionIndex}`"
            :class="ui.droplistItem()"
            @tap.stop="onSelect(option)"
          >
            <text>{{ option.label }}</text>
          </view>
        </slot>
      </view>
    </template>

    <view v-else :class="ui.link({ class: 'reborn-breadcrumb-item__link' })" @tap="handleClick">
      <slot />
    </view>

    <view :class="ui.separator()">
      <slot name="separator">
        <view v-if="separatorIcon" :class="separatorIcon" />
        <text v-else>{{ separatorText }}</text>
      </slot>
    </view>
  </view>
</template>