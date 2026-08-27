<template>
    <div :class="ui.wrapper()"
        :style="{ bottom: viewBottom, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }"
        @click.stop="toTop">
        <slot>
            <div :class="[
                ui.base(),
                visible ? '-translate-x-3' : 'translate-x-20'
            ]">
                <svg v-if="showProgress" :class="ui.progress()" viewBox="0 0 100 100" aria-hidden="true">
                    <circle :class="ui.progressTrack()" cx="50" cy="50" :r="progressRadius" />
                    <circle :class="ui.progressBar()" cx="50" cy="50" :r="progressRadius"
                        :stroke-dasharray="progressCircumference" :stroke-dashoffset="progressDashOffset" />
                </svg>
                <span :class="ui.icon()">↑</span>
            </div>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from "vue";
import type { ClassValue } from "clsx"
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { useResizeObserver, useWindowScroll, useWindowSize } from '@vueuse/core'
import theme, {
    backTopColors,
    backTopSizes,
    BACK_TOP_PROGRESS_CIRCUMFERENCE,
    BACK_TOP_PROGRESS_RADIUS,
} from "./reborn-back-top.config";

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
    // 是否在按钮边缘展示滚动进度环；传了自定义默认插槽时不生效（按钮结构已由插槽接管）
    showProgress?: boolean;
    // 可滚动总距离 (px)。外部接管 scrollTop 时用于换算百分比；不传则按 document 实测
    scrollRange?: number;
    color?: typeof backTopColors[number]
    size?: typeof backTopSizes[number]
    ui?: {
        wrapper?: ClassValue,
        base?: ClassValue,
        icon?: ClassValue,
        progress?: ClassValue,
        progressTrack?: ClassValue,
        progressBar?: ClassValue
    }
}

const props = withDefaults(defineProps<BackTopProps>(), {
    threshold: 300,
    bottom: 20,
    duration: 300,
    isTab: false,
    safeArea: true,
    showProgress: false,
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

// ── 滚动进度 ────────────────────────────────────────────────
const progressRadius = BACK_TOP_PROGRESS_RADIUS
const progressCircumference = BACK_TOP_PROGRESS_CIRCUMFERENCE

const { height: windowHeight } = useWindowSize()

// 文档高度不是响应式的，需要观察后手动同步
const docHeight = ref(0)
// 观察目标延后到 onMounted 赋值：SSR 阶段没有 document，直接引用会报错
const docEl = shallowRef<HTMLElement | null>(null)

const measureDoc = () => {
    docHeight.value = document.documentElement.scrollHeight
}

// 图片、懒加载内容撑高页面后重新测量，否则进度环会算成「已经到底」
useResizeObserver(docEl, measureDoc)

onMounted(() => {
    measureDoc()
    docEl.value = document.documentElement
})

// 可滚动总距离：外部传了 scrollRange 就用外部的，否则按文档高度 - 视口高度
const maxScroll = computed(() => {
    const range = props.scrollRange ?? docHeight.value - windowHeight.value
    // 兜底为 1，避免内容不足一屏时除零得到 Infinity
    return Math.max(1, range)
})

// 当前进度，取值 0 ~ 1
const progress = computed(() => Math.min(1, Math.max(0, currentScrollTop.value / maxScroll.value)))

// 环的可见长度靠 dashoffset 收缩：进度 0 时偏移整个周长（不可见），进度 1 时偏移 0（满环）
const progressDashOffset = computed(() => progressCircumference * (1 - progress.value))

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
        progress: (opts?: { class?: any }) => styles.progress({ class: cn(opts?.class, uiOverrides.value.progress) }),
        progressTrack: (opts?: { class?: any }) => styles.progressTrack({ class: cn(opts?.class, uiOverrides.value.progressTrack) }),
        progressBar: (opts?: { class?: any }) => styles.progressBar({ class: cn(opts?.class, uiOverrides.value.progressBar) }),
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
