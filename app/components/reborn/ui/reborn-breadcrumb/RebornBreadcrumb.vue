<script setup lang="ts">
import type { Slots, VNode, VNodeArrayChildren } from 'vue'
import type { BreadcrumbContext, BreadcrumbDroplistItem, BreadcrumbRoute, BreadcrumbUI } from './reborn-breadcrumb.config'
import { cloneVNode, computed, Fragment, h, isVNode, provide } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { BREADCRUMB_INJECTION_KEY } from './reborn-breadcrumb.config'
import RebornBreadcrumbItem from './RebornBreadcrumbItem.vue'

export interface RebornBreadcrumbProps {
    /** 分隔符文字 */
    separator?: string | number
    /** 图标分隔符（Iconify 名称或组件），优先级高于 separator */
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

// --- max-count 折叠 ---
/** 折叠区间 [start, end)，落在区间内的条目隐藏；保留首项与末尾 maxCount - 1 项 */
function collapseRangeOf(total: number) {
    const max = props.maxCount || 0
    if (max <= 0 || total <= max) { return null }
    return { start: 1, end: total - max + 1 }
}

/** ShapeFlags.FUNCTIONAL_COMPONENT | ShapeFlags.STATEFUL_COMPONENT；vue 未公开导出该枚举，这里按位值书写 */
const COMPONENT_SHAPE = 2 | 4

/**
 * 条目节点：展开片段后，默认插槽里的每个组件节点都算一项；普通元素、文本与注释不计数，原位保留。
 * 不按 node.type === RebornBreadcrumbItem 判断：全局注册的组件经运行时解析（站内 /playground 的模板编译、
 * resolveComponent、<component is>）拿到的是 defineAsyncComponent 包装，按身份比较一律落空，折叠与排序随之失效。
 * 序号与折叠结果以属性写进节点，异步包装会原样转交给内部组件，单根包装组件也会经透传属性落到内部条目上。
 */
function isItemNode(node: VNode) {
    return (node.shapeFlag & COMPONENT_SHAPE) !== 0
}

/** 按插槽顺序统计条目数，片段（v-for / template / 转发的插槽）逐层展开 */
function countItems(nodes: VNodeArrayChildren): number {
    let count = 0
    for (const node of nodes) {
        if (!isVNode(node)) { continue }
        if (node.type === Fragment && Array.isArray(node.children)) { count += countItems(node.children) }
        else if (isItemNode(node)) { count++ }
    }
    return count
}

/**
 * 根因：默认插槽的条目由使用者书写，若让条目在 setup 时向容器登记，下标是 setup 的先后顺序而不是插槽位置，
 * v-if / v-for 中途插入的条目会排到末尾，折叠时隐藏错项；服务端渲染时容器先于条目渲染，首屏也拿不到总数。
 * 方案：容器在渲染期展开插槽，按插槽顺序给条目编号、算出折叠结果，克隆节点把结果写进条目的内部 prop，
 * 并把省略号直接插在首个条目之后。DOM 顺序即视觉顺序，服务端首屏就是折叠后的结果。
 * 片段与注释占位（v-if 为假）原样保留，v-if 切换时同级节点的位置不会漂移。渲染期只读不写响应式状态。
 * 模板里传给它的插槽内不能写注释：本组件调用插槽时不带 _push，服务端走的是 SSR 编译产物的 vnode 回退分支，
 * 该分支不保留 v-if / v-else 分支前的模板注释；开发模式下客户端却会把注释编进分支（分支变成「注释 + 内容」的片段），
 * 两边节点结构对不上，水合时报 Hydration node mismatch。说明性注释统一写在 <BreadcrumbTrail> 外面。
 */
const BreadcrumbTrail = (_props: unknown, { slots: own }: { slots: Slots }) => {
    let nodes = own.default?.() ?? []
    // 完整显式序位时展开片段并排序；混传或无效值保持原插槽结构。
    const flatten = (list: VNodeArrayChildren): VNode[] => list.flatMap(node => {
        if (!isVNode(node)) return []
        return node.type === Fragment && Array.isArray(node.children) ? flatten(node.children) : [node]
    })
    const flat = flatten(nodes)
    const items = flat.filter(isItemNode)
    if (items.length && items.every(node => typeof node.props?.order === 'number' && Number.isFinite(node.props.order))) {
        const sorted = [...items].sort((a, b) => a.props!.order - b.props!.order)
        let cursor = 0
        nodes = flat.map(node => isItemNode(node) ? sorted[cursor++]! : node)
    }
    const range = collapseRangeOf(countItems(nodes))
    let index = 0

    const layout = (list: VNodeArrayChildren): VNodeArrayChildren => {
        const out: VNodeArrayChildren = []
        for (const node of list) {
            if (!isVNode(node)) {
                out.push(node)
                continue
            }
            if (node.type === Fragment && Array.isArray(node.children)) {
                out.push(h(Fragment, node.key == null ? null : { key: node.key }, layout(node.children)))
                continue
            }
            if (!isItemNode(node)) {
                out.push(node)
                continue
            }
            const current = index++
            out.push(cloneVNode(node, {
                internalIndex: current,
                internalCollapsed: !!range && current >= range.start && current < range.end
            }))
            // 省略号紧跟首项；用固定 key 与条目区分，出现 / 消失时不会让后面的条目错位复用
            if (range && current === 0) {
                out.push(h(Fragment, { key: '__reborn-breadcrumb-more__' }, own.more?.()))
            }
        }
        return out
    }

    return layout(nodes)
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

/** 只提供只读的 computed：条目读取容器配置，但不能改写容器状态 */
const context: BreadcrumbContext = {
    separator: computed(() => props.separator),
    separatorIcon: computed(() => props.separatorIcon),
    ui: computed(() => props.ui || {})
}

provide(BREADCRUMB_INJECTION_KEY, context)
</script>

<template>
  <nav :class="ui.root()" aria-label="Breadcrumb">
    <!-- routes 模式由组件渲染条目，否则渲染使用者书写的条目；省略号由 BreadcrumbTrail 插到首个条目之后。插槽内不写注释，原因见 BreadcrumbTrail -->
    <BreadcrumbTrail>
      <template v-if="props.routes?.length">
        <RebornBreadcrumbItem
          v-for="(route, index) in props.routes"
          :key="`${route.label}-${index}`"
          :order="index"
          :to="hrefOf(index)"
          :droplist="route.children"
          @select="item => emit('select', item, index)"
        >
          <slot name="item-render" :route="route" :routes="props.routes" :paths="pathsOf(index)">
            {{ route.label }}
          </slot>
          <template v-if="$slots.separator" #separator>
            <slot name="separator" />
          </template>
        </RebornBreadcrumbItem>
      </template>
      <slot v-else />

      <template #more>
        <div :class="ui.item()">
          <span :class="ui.more()">
            <slot name="more-icon">
              <Icon name="lucide:ellipsis" :class="ui.moreIcon()" />
            </slot>
          </span>
          <span :class="ui.separator()" aria-hidden="true">
            <slot name="separator">
              <component :is="props.separatorIcon" v-if="props.separatorIcon && typeof props.separatorIcon !== 'string'" />
              <Icon v-else-if="props.separatorIcon" :name="props.separatorIcon" />
              <template v-else>{{ props.separator }}</template>
            </slot>
          </span>
        </div>
      </template>
    </BreadcrumbTrail>
  </nav>
</template>
