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
import { computed, ref } from 'vue'
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

const emit = defineEmits(['reload'])

const currentState = ref<typeof LoadMoreState[number] | null>(null)

function reload() {
    if (props.state !== 'error') return
    currentState.value = 'loading'
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
            <svg :class="ui.refresh()" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="1em"
                height="1em" fill="currentColor">
                <path
                    d="M512 1024C229.2 1024 0 794.8 0 512S229.2 0 512 0s512 229.2 512 512-229.2 512-512 512zM512 66.8C266.3 66.8 66.8 266.3 66.8 512S266.3 957.2 512 957.2 957.2 757.7 957.2 512 757.7 66.8 512 66.8z">
                </path>
                <path
                    d="M512 795.1c-156.1 0-283.1-127-283.1-283.1S355.9 228.9 512 228.9c35.6 0 70 6.6 102.1 19.5 17.6 7 26.1 27.1 19 44.7s-27.1 26.1-44.7 19c-24.3-9.7-50.2-14.7-76.4-14.7-119.3 0-216.3 97-216.3 216.3s97 216.3 216.3 216.3c103.5 0 193.3-73.4 212.4-175 3.4-18.7 21.4-31 40-27.6s31 21.4 27.6 40c-25.2 133.5-143.1 229.2-279.7 229.2z">
                </path>
                <path
                    d="M478.6 478.6c13.1 13.1 34.3 13.1 47.3 0L764 240.4c13.1-13.1 13.1-34.3 0-47.3-13.1-13.1-34.3-13.1-47.3 0L478.6 431.2c-13.1 13.1-13.1 34.4 0 47.4z">
                </path>
                <path
                    d="M856 507.2c-15.3 0-28.7-10.4-32.3-25.7-4.3-18-9.6-35.8-15.8-53.1-6.1-17.6-25.4-26.8-43-20.7s-26.8 25.4-20.7 43c4.8 13.3 8.9 27.1 12.2 41 4.2 18 22.3 29.3 40.3 25 1.7-.4 3.4-.9 5-.1 13.9 6.2 30 0 36.2-13.9.7-1.6 1.4-3.3 2.1-5s-.2-4.1-.2-4.1-1.3-4.8-3.8-6.4z">
                </path>
            </svg>
        </block>
        <block v-else-if="state === 'loading'">
            <reborn-loading v-bind="customLoadingProps" />
            <text :class="ui.text()">{{ loadingText || '加载中...' }}</text>
        </block>
    </view>
</template>
