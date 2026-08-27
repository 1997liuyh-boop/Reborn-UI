<script setup lang="ts">
import type { BreadcrumbDroplistItem, BreadcrumbUI } from './reborn-breadcrumb.config'
import { computed, inject, onBeforeUnmount, ref, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import RebornDropdown from '../reborn-dropdown/RebornDropdown.vue'
import RebornDropdownItem from '../reborn-dropdown/RebornDropdownItem.vue'
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
    /** 透传给底层 RebornDropdown 的属性 */
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

function navigate(path: string) {
    const isExternal = /^(?:https?:)?\/\//.test(path)
    navigateTo(path, isExternal ? { external: true } : undefined)
}

function onCommand(command: string) {
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
        droplistItem: (opts?: { class?: any }) => styles.droplistItem({ class: cn(opts?.class, inherited.droplistItem, props.ui?.droplistItem) })
    }
})
</script>

<template>
  <div :class="ui.item()" :style="orderStyle">
    <!-- 带下拉菜单的条目 -->
    <RebornDropdown
      v-if="hasDroplist"
      :ui="{ dropdown: ui.droplist() }"
      v-bind="props.dropdownProps"
      :class="ui.link({ class: 'reborn-breadcrumb-item__link' })"
      @command="onCommand"
      @visible-change="value => (isOpen = value)"
    >
      <slot />
      <Icon name="lucide:chevron-down" :class="ui.dropIcon()" />
      <template #dropdown>
        <slot name="droplist">
          <RebornDropdownItem
            v-for="(option, optionIndex) in props.droplist"
            :key="`${option.label}-${optionIndex}`"
            :command="String(optionIndex)"
            :class="ui.droplistItem()"
          >
            {{ option.label }}
          </RebornDropdownItem>
        </slot>
      </template>
    </RebornDropdown>

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