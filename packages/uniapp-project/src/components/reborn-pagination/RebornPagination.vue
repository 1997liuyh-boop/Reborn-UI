<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { paginationModes, paginationColors } from './reborn-pagination.config'

/**
 * RebornPagination 分页组件
 * 支持基础页码列表模式和简易上下翻页模式。
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
    /** 是否隐藏只有一页时的分页 */
    hideOnSinglePage?: boolean
    /** 各部分 UI 自定义 */
    ui?: any
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
    hideOnSinglePage: false,
    ui: () => ({})
})

const emit = defineEmits([
    /** 当前页码变化时触发（v-model 双向同步），参数为新页码 */
    'update:modelValue',
    /** 页码切换后触发，参数为切换后的页码；点击当前页、省略号或禁用时不触发 */
    'change'
])

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
        active,
        disabled,
        background: props.background
    })
}

const rootClasses = computed(() => getStyles(false, props.disabled).root({ class: cn(uiOverrides.value.root) }))

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

defineExpose({
    /** 翻到上一页（当前页 - 1）：禁用或已在第一页时无操作，成功时同步 v-model 并触发 change */
    prev,
    /** 翻到下一页（当前页 + 1）：禁用或已在最后一页时无操作，成功时同步 v-model 并触发 change */
    next
})
</script>

<template>
    <view v-if="!(hideOnSinglePage && totalPages <= 1)" :class="rootClasses">
        <!-- 上一页 -->
        <slot name="prev" :currentPage="currentPage" :totalPages="totalPages" :prev="prev"
            :disabled="disabled || currentPage <= 1">
            <view
                :class="getStyles(false, disabled || currentPage <= 1).item({ class: cn(uiOverrides.item, uiOverrides.prev, prevText ? 'w-auto px-2' : '') })"
                @tap="prev">
                <view v-if="!prevText" class="i-lucide-chevron-left text-24" />
                <text v-else class="text-24">{{ prevText }}</text>
            </view>
        </slot>

        <!-- 页码列表 (Multi 模式) -->
        <template v-if="mode === 'multi'">
            <view v-for="(page, index) in pageList" :key="index">
                <view v-if="page === '...'"
                    :class="getStyles(false, disabled).ellipsis({ class: uiOverrides.ellipsis })">
                    <text class="text-24">•••</text>
                </view>
                <slot v-else name="page" :page="page" :active="currentPage === page" :handlePageClick="handlePageClick"
                    :disabled="disabled">
                    <view :class="getStyles(currentPage === page, disabled).item({ class: uiOverrides.item })"
                        @tap="handlePageClick(page as number)">
                        <text class="text-24">{{ page }}</text>
                    </view>
                </slot>
            </view>
        </template>

        <!-- 简易显示 (Simple 模式) -->
        <slot v-else name="simpleContent" :currentPage="currentPage" :totalPages="totalPages"
            :handlePageClick="handlePageClick" :disabled="disabled">
            <view :class="getStyles(false, disabled).simpleContent({ class: uiOverrides.simpleContent })">
                <text :class="`text-${color}`">{{ currentPage }}</text>
                <text class="opacity-30">/</text>
                <text>{{ totalPages }}</text>
            </view>
        </slot>

        <!-- 下一页 -->
        <slot name="next" :currentPage="currentPage" :totalPages="totalPages" :next="next"
            :disabled="disabled || currentPage >= totalPages">
            <view
                :class="getStyles(false, disabled || currentPage >= totalPages).item({ class: cn(uiOverrides.item, uiOverrides.next, nextText ? 'w-auto px-2' : '') })"
                @tap="next">
                <view v-if="!nextText" class="i-lucide-chevron-right text-24" />
                <text v-else class="text-24">{{ nextText }}</text>
            </view>
        </slot>
    </view>
</template>
