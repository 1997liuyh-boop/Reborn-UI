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

const b = tv(theme as any)

/**
 * 组件属性接口定义
 */
export interface PaginationProps {
    /** 当前页码 */
    modelValue?: number
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
    modelValue: 1,
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
    /** 页码更新事件 */
    (e: 'update:modelValue', value: number): void
    /** 页码改变事件 */
    (e: 'change', value: number): void
}>()

/**
 * 当前页码双向绑定
 */
const currentPage = defineModel<number>({ default: 1 })

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
    const current = currentPage.value
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

/**
 * 自定义 UI 覆盖
 */
const uiOverrides = computed(() => props.ui || {})

/**
 * 基础样式对象
 */
const ui = computed(() => b({
    mode: props.mode,
    color: props.color,
    size: props.size,
    background: props.background,
    disabled: props.disabled
}))

/**
 * 生成页码项样式类
 * @param active 是否选中
 * @param disabled 是否禁用
 * @param slotName 插槽名称 (item, prev, next)
 */
const getItemClass = (active = false, disabled = false, slotName: 'item' | 'prev' | 'next' = 'item') => {
    return b({
        mode: props.mode,
        color: props.color,
        size: props.size,
        background: props.background,
        active,
        disabled
    })[slotName]({ class: uiOverrides.value[slotName] })
}

/**
 * 根容器类名
 */
const rootClasses = computed(() => ui.value.root({
    class: cn(uiOverrides.value.root, props.class)
}))

/**
 * 处理页码点击
 */
function handlePageClick(page: number | string) {
    if (props.disabled || typeof page === 'string' || page === currentPage.value) return
    currentPage.value = page as number
    emit('change', page as number)
}

/**
 * 跳转至上一页
 */
function prev() {
    if (props.disabled || currentPage.value <= 1) return
    handlePageClick(currentPage.value - 1)
}

/**
 * 跳转至下一页
 */
function next() {
    if (props.disabled || currentPage.value >= totalPages.value) return
    handlePageClick(currentPage.value + 1)
}

defineExpose({ prev, next })
</script>

<template>
    <nav v-if="!(hideOnSinglePage && totalPages <= 1)" :class="rootClasses" aria-label="分页导航">
        <!-- 上一页插槽 -->
        <slot name="prev" :currentPage="currentPage" :totalPages="totalPages" :prev="prev"
            :disabled="disabled || currentPage <= 1">
            <div :class="[
                getItemClass(false, disabled || currentPage <= 1, 'prev'),
                !prevText ? '!aspect-square !p-0' : '',
                'cursor-pointer'
            ]" :disabled="disabled || currentPage <= 1" @click="prev">
                <Icon v-if="!prevText" name="lucide:chevron-left"
                    :class="ui.prevIcon({ class: uiOverrides.prevIcon })" />
                <span v-else :class="ui.prevLabel({ class: uiOverrides.prevLabel })">{{ prevText }}</span>
            </div>
        </slot>

        <!-- 页码列表 (Multi 模式) -->
        <template v-if="mode === 'multi'">
            <div :class="ui.list({ class: uiOverrides.list })">
                <TransitionGroup :move-class="ui.pageListMove({ class: uiOverrides.pageListMove })"
                    :enter-active-class="ui.pageListEnterActive({ class: uiOverrides.pageListEnterActive })"
                    :leave-active-class="ui.pageListLeaveActive({ class: uiOverrides.pageListLeaveActive })"
                    :enter-from-class="ui.pageListEnterFrom({ class: uiOverrides.pageListEnterFrom })"
                    :enter-to-class="ui.pageListEnterTo({ class: uiOverrides.pageListEnterTo })"
                    :leave-from-class="ui.pageListLeaveFrom({ class: uiOverrides.pageListLeaveFrom })"
                    :leave-to-class="ui.pageListLeaveTo({ class: uiOverrides.pageListLeaveTo })">
                    <div v-for="item in pageList" :key="item.key"
                        :class="ui.pageListItem({ class: uiOverrides.pageListItem })">
                        <!-- 省略号显示 -->
                        <div v-if="item.type === 'ellipsis'" :class="ui.ellipsis({ class: uiOverrides.ellipsis })">
                            <span :class="ui.ellipsisText({ class: uiOverrides.ellipsisText })">•••</span>
                        </div>
                        <!-- 页码按钮插槽 -->
                        <slot v-else name="page" :page="item.value" :active="currentPage === item.value"
                            :handlePageClick="handlePageClick" :disabled="disabled">
                            <div :class="[
                                getItemClass(currentPage === item.value, disabled),
                                '!aspect-square !p-0',
                                'cursor-pointer'
                            ]" :disabled="disabled" @click="handlePageClick(item.value as number)">
                                <span :class="ui.itemLabel({ class: uiOverrides.itemLabel })">{{ item.value }}</span>
                            </div>
                        </slot>
                    </div>
                </TransitionGroup>
            </div>
        </template>

        <!-- 简易显示模式 (Simple 模式) -->
        <slot v-else name="simpleContent" :currentPage="currentPage" :totalPages="totalPages"
            :handlePageClick="handlePageClick" :disabled="disabled">
            <div :class="ui.simpleContent({ class: uiOverrides.simpleContent })">
                <span :class="ui.simpleCurrent({ class: uiOverrides.simpleCurrent })">{{ currentPage }}</span>
                <span :class="ui.simpleSeparator({ class: uiOverrides.simpleSeparator })">/</span>
                <span :class="ui.simpleTotal({ class: uiOverrides.simpleTotal })">{{ totalPages }}</span>
            </div>
        </slot>

        <!-- 下一页插槽 -->
        <slot name="next" :currentPage="currentPage" :totalPages="totalPages" :next="next"
            :disabled="disabled || currentPage >= totalPages">
            <div :class="[
                getItemClass(false, disabled || currentPage >= totalPages, 'next'),
                !nextText ? '!aspect-square !p-0' : '',
                'cursor-pointer'
            ]" :disabled="disabled || currentPage >= totalPages" @click="next">
                <Icon v-if="!nextText" name="lucide:chevron-right"
                    :class="ui.nextIcon({ class: uiOverrides.nextIcon })" />
                <span v-else :class="ui.nextLabel({ class: uiOverrides.nextLabel })">{{ nextText }}</span>
            </div>
        </slot>
    </nav>
</template>
