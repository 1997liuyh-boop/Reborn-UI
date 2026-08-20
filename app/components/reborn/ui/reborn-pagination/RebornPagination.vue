<script lang="ts" setup>
/**
 * RebornPagination 分页组件 (Web 版)
 * 遵循 Reborn UI 设计规范，支持多种显示模式、尺寸与主题颜色。
 * 优化了渲染性能和动画切换效果。
 */
import { computed } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme, {
    type PaginationMode,
    type PaginationColor,
    type PaginationSize,
    type PaginationUI
} from './reborn-pagination.config'


/**
 * 组件属性接口定义
 */
export interface PaginationProps {
    /** 数据总数 */
    total?: number
    /** 每页条数 */
    pageSize?: number
    /** 显示模式 */
    mode?: PaginationMode
    /** 主题颜色 */
    color?: PaginationColor
    /** 尺寸 */
    size?: PaginationSize
    /** 上一页文字 */
    prevText?: string
    /** 下一页文字 */
    nextText?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 是否显示背景 */
    background?: boolean
    /** 是否隐藏只有一页时的分页 */
    hideOnSinglePage?: boolean
    /** 各部分 UI 自定义 */
    ui?: Partial<PaginationUI>
    /** 自定义类名 */
    class?: any
}

const props = withDefaults(defineProps<PaginationProps>(), {
    total: 0,
    pageSize: 10,
    mode: 'multi',
    color: 'primary',
    size: 'md',
    prevText: '',
    nextText: '',
    disabled: false,
    background: false,
    hideOnSinglePage: false,
    ui: () => ({})
})

const emit = defineEmits<{
    /** 页码改变事件 */
    (e: 'change', value: number): void
}>()

/**
 * 当前页码双向绑定
 */
const modelValue = defineModel<number>({ default: 1 })

/**
 * 计算总页数
 */
const totalPages = computed(() => {
    if (props.total <= 0) return 1
    return Math.ceil(props.total / props.pageSize)
})

/**
 * 分页逻辑计算：生成包含页码和省略号的列表
 */
const pageList = computed(() => {
    const total = totalPages.value
    const current = modelValue.value
    const list: { type: 'page' | 'ellipsis', value: number | string, key: string }[] = []

    if (total <= 1) return [{ type: 'page', value: 1, key: 'page-1' }]

    if (total <= 7) {
        for (let i = 1; i <= total; i++) list.push({ type: 'page', value: i, key: `page-${i}` })
    } else {
        list.push({ type: 'page', value: 1, key: 'page-1' })
        if (current <= 4) {
            for (let i = 2; i <= 5; i++) list.push({ type: 'page', value: i, key: `page-${i}` })
            list.push({ type: 'ellipsis', value: '...', key: 'ellipsis-end' })
            list.push({ type: 'page', value: total, key: `page-${total}` })
        } else if (current >= total - 3) {
            list.push({ type: 'ellipsis', value: '...', key: 'ellipsis-start' })
            for (let i = total - 4; i <= total; i++) list.push({ type: 'page', value: i, key: `page-${i}` })
        } else {
            list.push({ type: 'ellipsis', value: '...', key: 'ellipsis-start' })
            for (let i = current - 1; i <= current + 1; i++) list.push({ type: 'page', value: i, key: `page-${i}` })
            list.push({ type: 'ellipsis', value: '...', key: 'ellipsis-end' })
            list.push({ type: 'page', value: total, key: `page-${total}` })
        }
    }
    return list
})

const b = tv(theme)
/**
 * 自定义 UI 覆盖
 */
const uiOverrides = computed(() => props.ui || {})

/**
 * 基础样式对象
 */
const ui = computed(() => {
    const styles = b({
        mode: props.mode,
        color: props.color,
        size: props.size,
        background: props.background,
        disabled: props.disabled
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.class, uiOverrides.value.root) }),
        list: (opts?: { class?: any }) => styles.list({ class: cn(opts?.class, uiOverrides.value.list) }),
        item: (opts?: { class?: any, active?: boolean, disabled?: boolean }) => styles.item({ active: opts?.active, disabled: opts?.disabled, class: cn(opts?.class, uiOverrides.value.item) }),
        itemLabel: (opts?: { class?: any }) => styles.itemLabel({ class: cn(opts?.class, uiOverrides.value.itemLabel) }),
        prev: (opts?: { class?: any, active?: boolean, disabled?: boolean }) => styles.prev({ active: opts?.active, disabled: opts?.disabled, class: cn(opts?.class, uiOverrides.value.prev) }),
        prevIcon: (opts?: { class?: any }) => styles.prevIcon({ class: cn(opts?.class, uiOverrides.value.prevIcon) }),
        prevLabel: (opts?: { class?: any }) => styles.prevLabel({ class: cn(opts?.class, uiOverrides.value.prevLabel) }),
        next: (opts?: { class?: any, active?: boolean, disabled?: boolean }) => styles.next({ active: opts?.active, disabled: opts?.disabled, class: cn(opts?.class, uiOverrides.value.next) }),
        nextIcon: (opts?: { class?: any }) => styles.nextIcon({ class: cn(opts?.class, uiOverrides.value.nextIcon) }),
        nextLabel: (opts?: { class?: any }) => styles.nextLabel({ class: cn(opts?.class, uiOverrides.value.nextLabel) }),
        ellipsis: (opts?: { class?: any }) => styles.ellipsis({ class: cn(opts?.class, uiOverrides.value.ellipsis) }),
        ellipsisText: (opts?: { class?: any }) => styles.ellipsisText({ class: cn(opts?.class, uiOverrides.value.ellipsisText) }),
        simpleContent: (opts?: { class?: any }) => styles.simpleContent({ class: cn(opts?.class, uiOverrides.value.simpleContent) }),
        simpleCurrent: (opts?: { class?: any }) => styles.simpleCurrent({ class: cn(opts?.class, uiOverrides.value.simpleCurrent) }),
        simpleSeparator: (opts?: { class?: any }) => styles.simpleSeparator({ class: cn(opts?.class, uiOverrides.value.simpleSeparator) }),
        simpleTotal: (opts?: { class?: any }) => styles.simpleTotal({ class: cn(opts?.class, uiOverrides.value.simpleTotal) }),
        pageListItem: (opts?: { class?: any }) => styles.pageListItem({ class: cn(opts?.class, uiOverrides.value.pageListItem) }),
        pageListMove: (opts?: { class?: any }) => styles.pageListMove({ class: cn(opts?.class, uiOverrides.value.pageListMove) }),
        pageListEnterActive: (opts?: { class?: any }) => styles.pageListEnterActive({ class: cn(opts?.class, uiOverrides.value.pageListEnterActive) }),
        pageListLeaveActive: (opts?: { class?: any }) => styles.pageListLeaveActive({ class: cn(opts?.class, uiOverrides.value.pageListLeaveActive) }),
        pageListEnterFrom: (opts?: { class?: any }) => styles.pageListEnterFrom({ class: cn(opts?.class, uiOverrides.value.pageListEnterFrom) }),
        pageListEnterTo: (opts?: { class?: any }) => styles.pageListEnterTo({ class: cn(opts?.class, uiOverrides.value.pageListEnterTo) }),
        pageListLeaveFrom: (opts?: { class?: any }) => styles.pageListLeaveFrom({ class: cn(opts?.class, uiOverrides.value.pageListLeaveFrom) }),
        pageListLeaveTo: (opts?: { class?: any }) => styles.pageListLeaveTo({ class: cn(opts?.class, uiOverrides.value.pageListLeaveTo) })
    }
})

/**
 * 处理页码点击
 */
function handlePageClick(page: number | string) {
    if (props.disabled || typeof page === 'string' || page === modelValue.value) return
    modelValue.value = page as number
    emit('change', page as number)
}

/**
 * 跳转至上一页
 */
function prev() {
    if (props.disabled || modelValue.value <= 1) return
    handlePageClick(modelValue.value - 1)
}

/**
 * 跳转至下一页
 */
function next() {
    if (props.disabled || modelValue.value >= totalPages.value) return
    handlePageClick(modelValue.value + 1)
}

defineExpose({
    /** 翻到上一页（当前页 - 1）：禁用或已在第一页时无操作，成功时同步 v-model 并触发 change */
    prev,
    /** 翻到下一页（当前页 + 1）：禁用或已在最后一页时无操作，成功时同步 v-model 并触发 change */
    next
})
</script>

<template>
    <nav v-if="!(hideOnSinglePage && totalPages <= 1)" :class="ui.root()" aria-label="分页导航">
        <!-- 上一页插槽 -->
        <slot name="prev" :currentPage="modelValue" :totalPages="totalPages" :prev="prev"
            :disabled="disabled || modelValue <= 1">
            <div :class="ui.prev({
                active: false,
                disabled: disabled || modelValue <= 1,
                class: [!prevText ? '!aspect-square !p-0' : '', 'cursor-pointer']
            })" :disabled="disabled || modelValue <= 1" @click="prev">
                <Icon v-if="!prevText" name="lucide:chevron-left" :class="ui.prevIcon()" />
                <span v-else :class="ui.prevLabel()">{{ prevText }}</span>
            </div>
        </slot>

        <!-- 页码列表 (Multi 模式) -->
        <template v-if="mode === 'multi'">
            <div :class="ui.list()">
                <TransitionGroup :move-class="ui.pageListMove()" :enter-active-class="ui.pageListEnterActive()"
                    :leave-active-class="ui.pageListLeaveActive()" :enter-from-class="ui.pageListEnterFrom()"
                    :enter-to-class="ui.pageListEnterTo()" :leave-from-class="ui.pageListLeaveFrom()"
                    :leave-to-class="ui.pageListLeaveTo()">
                    <div v-for="(item, index) in pageList" :key="index" :class="ui.pageListItem()">
                        <!-- 省略号显示 -->
                        <div v-if="item.type === 'ellipsis'" :class="ui.ellipsis()">
                            <span :class="ui.ellipsisText()">•••</span>
                        </div>
                        <!-- 页码按钮插槽 -->
                        <slot v-else name="page" :page="item.value" :active="modelValue === item.value"
                            :handlePageClick="handlePageClick" :disabled="disabled">
                            <div :class="ui.item({
                                active: modelValue === item.value,
                                disabled: disabled,
                                class: ['!aspect-square !p-0', 'cursor-pointer']
                            })" :disabled="disabled" @click="handlePageClick(item.value as number)">
                                <span :class="ui.itemLabel()">{{ item.value }}</span>
                            </div>
                        </slot>
                    </div>
                </TransitionGroup>
            </div>
        </template>

        <!-- 简易显示模式 (Simple 模式) -->
        <slot v-else name="simpleContent" :currentPage="modelValue" :totalPages="totalPages"
            :handlePageClick="handlePageClick" :disabled="disabled">
            <div :class="ui.simpleContent()">
                <span :class="ui.simpleCurrent()">{{ modelValue }}</span>
                <span :class="ui.simpleSeparator()">/</span>
                <span :class="ui.simpleTotal()">{{ totalPages }}</span>
            </div>
        </slot>

        <!-- 下一页插槽 -->
        <slot name="next" :currentPage="modelValue" :totalPages="totalPages" :next="next"
            :disabled="disabled || modelValue >= totalPages">
            <div :class="ui.next({
                active: false,
                disabled: disabled || modelValue >= totalPages,
                class: [!nextText ? '!aspect-square !p-0' : '', 'cursor-pointer']
            })" :disabled="disabled || modelValue >= totalPages" @click="next">
                <Icon v-if="!nextText" name="lucide:chevron-right" :class="ui.nextIcon()" />
                <span v-else :class="ui.nextLabel()">{{ nextText }}</span>
            </div>
        </slot>
    </nav>
</template>
