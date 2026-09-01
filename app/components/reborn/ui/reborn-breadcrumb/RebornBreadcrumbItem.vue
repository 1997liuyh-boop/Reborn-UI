<script setup lang="ts">
import type { BreadcrumbDroplistItem, BreadcrumbUI } from './reborn-breadcrumb.config'
import { computed, inject, onBeforeUnmount, provide, ref, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import RebornSelectTrigger from '../reborn-select-trigger/RebornSelectTrigger.vue'
import theme, { BREADCRUMB_INJECTION_KEY } from './reborn-breadcrumb.config'

export interface RebornBreadcrumbItemProps {
    /** 跳转目标，同 vue-router 的 to */
    to?: string | object
    /** 跳转方式：push 入栈 / replace 替换 / blank 新窗口 */
    replace?: 'push' | 'replace' | 'blank'
    /** 分隔符文字，优先级高于父组件的 separator */
    separator?: string | number
    /** 图标分隔符，优先级高于本条目的 separator */
    separatorIcon?: any
    /** 下拉菜单数据 */
    droplist?: BreadcrumbDroplistItem[]
    /** 透传给底层浮层容器 RebornSelectTrigger 的属性（如 portal、size、closeOn、ui） */
    dropdownProps?: Record<string, any>
    /** 追加到条目链接节点的自定义类名 */
    customClass?: any
    /** 细粒度样式覆盖对象，优先级高于父组件的 ui */
    ui?: BreadcrumbUI
}

const props = withDefaults(defineProps<RebornBreadcrumbItemProps>(), {
    replace: 'push',
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
 * 折叠态下父组件把省略号放在了 DOM 最前，这里用 order 把条目排回原位，
 * 同时补发首项样式（此时首项已不是 first-child）。
 */
const isCollapsing = computed(() => !!context?.collapsing)
const isFirst = computed(() => isCollapsing.value && index.value === 0)
const orderStyle = computed(() =>
    isCollapsing.value && index.value >= 0 ? { order: index.value * 2 } : undefined
)

// --- 分隔符：条目级配置优先于容器级 ---
const separatorText = computed(() => props.separator ?? context?.separator ?? '/')
const separatorIcon = computed(() => props.separatorIcon ?? context?.separatorIcon)

// --- 下拉菜单 ---
const isOpen = ref(false)
const hasDroplist = computed(() => !!slots.droplist || !!props.droplist?.length)

function toggleDroplist() {
    if (!hasDroplist.value) { return }
    isOpen.value = !isOpen.value
}

function closeDroplist() {
    isOpen.value = false
}

/** 浮层锚点可聚焦（tabindex 0），补齐键盘操作：Enter / Space 开合，Esc 收起 */
function onTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggleDroplist()
    }
    else if (event.key === 'Escape' && isOpen.value) {
        closeDroplist()
    }
}

function navigate(path: string) {
    const isExternal = /^(?:https?:)?\/\//.test(path)
    navigateTo(path, isExternal ? { external: true } : undefined)
}

/**
 * 菜单项点击。command 为 droplist 的下标；
 * #droplist 插槽里的自定义项传的是使用者自定的 command，取不到数据时只负责收起。
 */
function onCommand(command: string) {
    closeDroplist()
    const item = props.droplist?.[Number(command)]
    if (!item) { return }
    emit('select', item)
    if (item.path) { navigate(item.path) }
}

// --- 样式计算 ---
const b = tv(theme)
const ui = computed(() => {
    const styles = b({
        active: !!props.to,
        first: isFirst.value,
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
        droplistDivider: (opts?: { class?: any }) => styles.droplistDivider({ class: cn(opts?.class, inherited.droplistDivider, props.ui?.droplistDivider) })
    }
})

/**
 * 兼容 #droplist 插槽里书写的 RebornDropdownItem。
 * 该组件的点击回调与样式全部取自 provide('reborn-dropdown')，
 * 本条目改用 RebornSelectTrigger 自绘浮层后已不存在 RebornDropdown 提供上下文，
 * 这里补一份：点击走 onCommand（点完即收起），样式换成面包屑自己的 droplistItem。
 */
provide('reborn-dropdown', {
    handleItemClick: onCommand,
    ui: computed(() => ({
        item: (opts?: { class?: any }) => ui.value.droplistItem({ class: opts?.class }),
        divider: (opts?: { class?: any }) => ui.value.droplistDivider({ class: opts?.class }),
        label: (opts?: { class?: any }) => cn('flex-1 truncate', opts?.class)
    }))
})
</script>

<template>
  <div :class="ui.item()" :style="orderStyle">
    <!--
      带下拉菜单的条目。
      浮层只借 RebornSelectTrigger 的定位与外部点击边界，触发器仍是一枚普通面包屑条目：
      不套任何边框 / 底色 / 内边距，样式与不带下拉的条目完全一致，只多一枚箭头。
      close-on="mousedown"：外部一有动静（按下任意鼠标键、面板外滚动）立即收起。
    -->
    <RebornSelectTrigger
      v-if="hasDroplist"
      :is-open="isOpen"
      close-on="mousedown"
      :ui="{ wrapper: 'w-auto', dropdown: 'w-auto!' }"
      v-bind="props.dropdownProps"
      @keydown="onTriggerKeydown"
      @close="closeDroplist"
    >
      <template #trigger>
        <span
          :class="ui.link({ class: 'reborn-breadcrumb-item__link' })"
          role="button"
          :aria-expanded="isOpen"
          @click="toggleDroplist"
        >
          <slot />
          <Icon name="lucide:chevron-down" :class="ui.dropIcon()" />
        </span>
      </template>

      <template #content>
        <div :class="ui.droplist()" role="menu">
          <slot name="droplist">
            <div
              v-for="(option, optionIndex) in props.droplist"
              :key="`${option.label}-${optionIndex}`"
              :class="ui.droplistItem()"
              role="menuitem"
              @click="onCommand(String(optionIndex))"
            >
              {{ option.label }}
            </div>
          </slot>
        </div>
      </template>
    </RebornSelectTrigger>

    <!-- 可跳转条目 -->
    <NuxtLink
      v-else-if="props.to"
      :to="props.to"
      :replace="props.replace === 'replace'"
      :target="props.replace === 'blank' ? '_blank' : undefined"
      :class="ui.link({ class: 'reborn-breadcrumb-item__link' })"
    >
      <slot />
    </NuxtLink>

    <span v-else :class="ui.link({ class: 'reborn-breadcrumb-item__link' })">
      <slot />
    </span>

    <span :class="ui.separator()" aria-hidden="true">
      <slot name="separator">
        <component :is="separatorIcon" v-if="separatorIcon && typeof separatorIcon !== 'string'" />
        <Icon v-else-if="separatorIcon" :name="separatorIcon" />
        <template v-else>{{ separatorText }}</template>
      </slot>
    </span>
  </div>
</template>