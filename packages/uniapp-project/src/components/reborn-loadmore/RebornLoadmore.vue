<script lang="ts">
export default {
    name: 'reborn-loadmore',
    options: {
        virtualHost: true,
        addGlobalClass: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import RebornLoading, { type RebornLoadingProps } from '@/components/reborn-loading/RebornLoading.vue'
import { isDef, isUndefined, omitBy } from '@/lib/util'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { type LoadMoreUI, loadMoreColors, LoadMoreState } from './reborn-loadmore.config'


export interface LoadMoreProps {
    customClass?: string
    customStyle?: string
    state: typeof LoadMoreState[number]
    loadingText?: string
    finishedText?: string
    errorText?: string
    color?: typeof loadMoreColors[number]
    ui?: LoadMoreUI
    loadingProps?: RebornLoadingProps
}

const props = withDefaults(defineProps<LoadMoreProps>(), {
    customClass: '',
    customStyle: '',
    state: 'loading',
    color: 'neutral',
    ui: () => ({}),
    loadingProps: () => ({
        size: '40rpx'
    })
})

const emit = defineEmits<{ reload: [] }>()


function reload() {
    if (props.state !== 'error') return
    emit('reload')
}

const b = tv(theme)

const customLoadingProps = computed(() => {
    const loadingProps = isDef(props.loadingProps) ? omitBy(props.loadingProps, isUndefined) : {}
    loadingProps.customClass = cn('inline-block align-middle mr-2 w-4 h-4', loadingProps.customClass)
    if (!loadingProps.color) {
        loadingProps.color = props.color
    }
    return loadingProps
})

const ui = computed(() => {
    const styles = b({
        color: props.color,
        state: props.state
    })
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
        divider: (opts?: { class?: any }) => styles.divider({ class: cn(opts?.class, props.ui?.divider) }),
        line: (opts?: { class?: any }) => styles.line({ class: cn(opts?.class, props.ui?.line) }),
        text: (opts?: { class?: any }) => styles.text({ class: cn(opts?.class, props.ui?.text) }),
        errorText: (opts?: { class?: any }) => styles.errorText({ class: cn(opts?.class, props.ui?.errorText) }),
        refresh: (opts?: { class?: any }) => styles.refresh({ class: cn(opts?.class, props.ui?.refresh) }),
    }
})
</script>
<template>
    <view :class="ui.root()" :style="customStyle" @click="reload">
        <view v-if="state === 'finished'" :class="ui.divider()">
            <view :class="ui.line()"></view>
            <text :class="ui.text()">{{ finishedText || '没有更多了' }}</text>
            <view :class="ui.line()"></view>
        </view>
        <block v-else-if="state === 'error'">
            <text :class="ui.text()">{{ errorText || '加载失败' }}</text>
            <text :class="ui.errorText()">{{ '点击重试' }}</text>
            <view :class="ui.refresh()" class="i-lucide-refresh-cw" />
        </block>
        <block v-else-if="state === 'loading'">
            <reborn-loading v-bind="customLoadingProps" />
            <text :class="ui.text()">{{ loadingText || '加载中...' }}</text>
        </block>
    </view>
</template>
