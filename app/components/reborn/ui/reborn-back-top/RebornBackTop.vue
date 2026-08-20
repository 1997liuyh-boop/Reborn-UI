<template>
    <div :class="ui.wrapper()"
        :style="{ bottom: viewBottom, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }"
        @click.stop="toTop">
        <slot>
            <div :class="[
                ui.base(),
                visible ? '-translate-x-3' : 'translate-x-20'
            ]">
                <span :class="ui.icon()">↑</span>
            </div>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ClassValue } from "clsx"
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { useWindowScroll } from '@vueuse/core'
import theme, { backTopColors, backTopSizes } from "./reborn-back-top.config";

defineOptions({
    name: "RebornBackTop"
});

export interface BackTopProps {
    // Web: 也可以传入自定义的 scrollTop，如果不传则自动监听 window
    scrollTop?: number;
    // 滚动多少距离后显示
    threshold?: number;
    // 底部距离 (px)
    bottom?: number;
    // 滚动动画时长 (ms) - Web 使用 CSS scroll-behavior: smooth，此参数作为兼容保留
    duration?: number;
    // 是否是 TabBar 页面 (Web 通常不需要)
    isTab?: boolean;
    // 是否适配安全区域
    safeArea?: boolean;
    color?: typeof backTopColors[number]
    size?: typeof backTopSizes[number]
    ui?: {
        wrapper?: ClassValue,
        base?: ClassValue,
        icon?: ClassValue
    }
}

const props = withDefaults(defineProps<BackTopProps>(), {
    threshold: 300,
    bottom: 20,
    duration: 300,
    isTab: false,
    safeArea: true,
    color: 'primary',
    size: 'md'
});

const b = tv(theme)

const emit = defineEmits([
    /** 点击返回顶部按钮时触发，无参数；组件已先发起回到顶部滚动，无需在回调中重复处理 */
    "click",
]);

// 自动获取 window 滚动
const { y: windowY } = useWindowScroll()

// 优先使用 props.scrollTop (如果外部手动控制)，否则使用 windowY
const currentScrollTop = computed(() => {
    return props.scrollTop !== undefined ? props.scrollTop : windowY.value
})

// Web 端安全区域通常为 0
const getSafeAreaBottom = () => 0

// 计算最终底部距离
const viewBottom = computed(() => {
    let h = props.bottom;

    if (props.safeArea) {
        h += getSafeAreaBottom();
    }

    if (props.isTab) {
        h += 50;
    }

    return `${h}px`;
});

// 是否显示
const visible = computed(() => currentScrollTop.value > props.threshold);

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        color: props.color,
        size: props.size,
    })

    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    }
})

// 回到顶部
function toTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    emit("click");
}
</script>
