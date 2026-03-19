<script lang="ts" setup>
import { computed } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme, { paginationModes, paginationColors } from './reborn-pagination.config'

/**
 * RebornPagination 分页组件 (Web 版)
 */

type PaginationMode = typeof paginationModes[number]
type PaginationColor = typeof paginationColors[number]

interface Props {
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
    /** 上一页文字 */
    prevText?: string
    /** 下一页文字 */
    nextText?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 是否显示背景 */
    background?: boolean
    /** 尺寸 (仅 Web 端支持多尺寸) */
    size?: 'sm' | 'md' | 'lg'
    /** 是否隐藏只有一页时的分页 */
    hideOnSinglePage?: boolean
    /** 各部分 UI 自定义 */
    ui?: any
    /** 自定义类名 */
    class?: any
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: 1,
    total: 0,
    pageSize: 10,
    mode: 'multi',
    color: 'primary',
    prevText: '',
    nextText: '',
    disabled: false,
    background: false,
    size: 'md',
    hideOnSinglePage: false,
    ui: () => ({})
})

const emit = defineEmits(['update:modelValue', 'change'])

const currentPage = defineModel<number>({ default: 1 })

// 计算总页数
const totalPages = computed(() => {
    if (props.total <= 0) return 1
    return Math.ceil(props.total / props.pageSize)
})

// 分页逻辑计算
const pageList = computed(() => {
    const total = totalPages.value
    const current = currentPage.value
    const list: (number | string)[] = []

    if (total <= 1) return [1]

    if (total <= 7) {
        for (let i = 1; i <= total; i++) list.push(i)
    } else {
        list.push(1)
        if (current <= 4) {
            for (let i = 2; i <= 5; i++) list.push(i)
            list.push('...')
            list.push(total)
        } else if (current >= total - 3) {
            list.push('...')
            for (let i = total - 4; i <= total; i++) list.push(i)
        } else {
            list.push('...')
            for (let i = current - 1; i <= current + 1; i++) list.push(i)
            list.push('...')
            list.push(total)
        }
    }
    return list
})

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

function getStyles(active = false, disabled = false) {
    return b({
        mode: props.mode,
        color: props.color,
        size: props.size,
        active,
        disabled,
        background: props.background
    })
}

const rootClasses = computed(() =>
    getStyles(false, props.disabled).root({
        class: cn(uiOverrides.value.root, props.class)
    })
)

function handlePageClick(page: number | string) {
    if (props.disabled || typeof page === 'string' || page === currentPage.value) return
    currentPage.value = page
    emit('change', page)
}

function prev() {
    if (props.disabled || currentPage.value <= 1) return
    handlePageClick(currentPage.value - 1)
}

function next() {
    if (props.disabled || currentPage.value >= totalPages.value) return
    handlePageClick(currentPage.value + 1)
}

defineExpose({ prev, next })
</script>

<template>
    <nav v-if="!(hideOnSinglePage && totalPages <= 1)" :class="rootClasses" aria-label="Pagination">
        <!-- 上一页 -->
        <slot name="prev" :currentPage="currentPage" :totalPages="totalPages" :prev="prev"
            :disabled="disabled || currentPage <= 1">
            <button type="button"
                :class="getStyles(false, disabled || currentPage <= 1).item({ class: cn(uiOverrides.item, uiOverrides.prev, prevText ? 'w-auto px-3' : '') })"
                :disabled="disabled || currentPage <= 1" @click="prev">
                <Icon v-if="!prevText" name="lucide:chevron-left" class="text-lg" />
                <span v-else class="text-sm font-medium">{{ prevText }}</span>
            </button>
        </slot>

        <!-- 页码列表 (Multi 模式) -->
        <template v-if="mode === 'multi'">
            <div v-for="(page, index) in pageList" :key="index">
                <div v-if="page === '...'"
                    :class="getStyles(false, disabled).ellipsis({ class: uiOverrides.ellipsis })">
                    <span class="text-gray-400 opacity-50">•••</span>
                </div>
                <slot v-else name="page" :page="page" :active="currentPage === page" :handlePageClick="handlePageClick"
                    :disabled="disabled">
                    <button type="button"
                        :class="getStyles(currentPage === page, disabled).item({ class: uiOverrides.item })"
                        :disabled="disabled" @click="handlePageClick(page as number)">
                        <span class="text-sm">{{ page }}</span>
                    </button>
                </slot>
            </div>
        </template>

        <!-- 简易显示 (Simple 模式) -->
        <slot v-else name="simpleContent" :currentPage="currentPage" :totalPages="totalPages"
            :handlePageClick="handlePageClick" :disabled="disabled">
            <div :class="getStyles(false, disabled).simpleContent({ class: uiOverrides.simpleContent })">
                <span :class="`text-${color}`">{{ currentPage }}</span>
                <span class="opacity-30">/</span>
                <span>{{ totalPages }}</span>
            </div>
        </slot>

        <!-- 下一页 -->
        <slot name="next" :currentPage="currentPage" :totalPages="totalPages" :next="next"
            :disabled="disabled || currentPage >= totalPages">
            <button type="button"
                :class="getStyles(false, disabled || currentPage >= totalPages).item({ class: cn(uiOverrides.item, uiOverrides.next, nextText ? 'w-auto px-3' : '') })"
                :disabled="disabled || currentPage >= totalPages" @click="next">
                <Icon v-if="!nextText" name="lucide:chevron-right" class="text-lg" />
                <span v-else class="text-sm font-medium">{{ nextText }}</span>
            </button>
        </slot>
    </nav>
</template>
