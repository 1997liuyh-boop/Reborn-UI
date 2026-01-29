<script lang="ts">
export interface RebornCollapseProps {
    customClass?: any
    ui?: {
        root?: any
        trigger?: any
        content?: any
    }
}
</script>
<script setup lang="ts">
import { computed, ref, watch, getCurrentInstance } from 'vue'
import { cn } from '@/lib/utils'
import { tv } from '@/lib/tv'
import theme from './reborn-collapse.config'

const props = withDefaults(defineProps<RebornCollapseProps>(), {
    customClass: '',
    ui: () => ({})
})

const collapse = defineModel("modelValue", {
    type: Boolean,
    default: false
})

// 获取组件实例
const { proxy } = getCurrentInstance()!;

const b = tv(theme)
const ui = computed(() => b())
const overrides = computed(() => props.ui || {})

// 折叠展开状态
const isOpened = ref(false);
// 内容高度
const height = ref(0);

/**
 * 显示折叠内容
 */
function show() {
    isOpened.value = true;
    updateHeight();
}

/**
 * 隐藏折叠内容
 */
function hide() {
    isOpened.value = false;
    height.value = 0;
}

/**
 * 更新高度
 */
function updateHeight() {
    // 使用 nextTick 确保 DOM 更新后再获取
    // Use setTimeout as simple generic nextTick for uni-app sometimes nextTick is not enough for layout
    setTimeout(() => {
        const query = uni.createSelectorQuery().in(proxy)
        query.select(".reborn-collapse__content")
            .boundingClientRect((data) => {
                const node = data as UniApp.NodeInfo
                if (node && node.height !== undefined) {
                    height.value = node.height;
                }
            })
            .exec();
    }, 50)
}

/**
 * 切换折叠状态
 */
function toggle() {
    if (isOpened.value) {
        hide();
    } else {
        show();
    }
}

// 监听折叠状态变化
watch(
    () => collapse.value,
    (val: boolean) => {
        if (val) {
            show();
        } else {
            hide();
        }
    },
    { immediate: true }
);

defineExpose({
    show,
    hide,
    toggle,
    resize: updateHeight
});
</script>

<template>
    <view :class="ui.root({ class: cn(props.customClass, overrides?.root) })">
        <view @click="toggle">
            <slot :open="isOpened" />
        </view>
        <view :class="ui.trigger({ class: overrides?.trigger })" :style="{ height: isOpened ? height + 'px' : '0px' }">

            <view class="reborn-collapse__content" :class="ui.content({ class: overrides?.content })">
                <slot name="content"></slot>
            </view>
        </view>
    </view>
</template>