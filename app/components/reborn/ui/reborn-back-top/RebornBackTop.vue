<script setup lang="ts">
import type { ClassValue } from "clsx"
import type {
    backTopColors,
    backTopDirections,
    backTopShapes,
    backTopSizes} from "./reborn-back-top.config";
import { useResizeObserver, useWindowScroll, useWindowSize } from '@vueuse/core'
import { computed, onMounted, ref, shallowRef } from "vue";
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, {
    BACK_TOP_PROGRESS_PATHS
} from "./reborn-back-top.config";

defineOptions({
    name: "RebornBackTop"
});

const props = withDefaults(defineProps<BackTopProps>(), {
    threshold: 300,
    bottom: 20,
    duration: 300,
    isTab: false,
    safeArea: true,
    direction: 'top',
    shape: 'circle',
    showProgress: false,
    color: 'primary',
    size: 'md'
});

const emit = defineEmits([
    /** 点击按钮时触发，无参数；组件已先发起滚动（回到顶部或去底部），无需在回调中重复处理 */
    "click",
]);

export interface BackTopProps {
    // Web: 也可以传入自定义的 scrollTop，如果不传则自动监听 window
    scrollTop?: number;
    // 显示阈值 (px)：回到顶部按钮在滚动距离超过它后显示，去底部按钮在距底部的剩余距离超过它时显示
    threshold?: number;
    // 底部距离 (px)
    bottom?: number;
    // 滚动动画时长 (ms) - Web 使用 CSS scroll-behavior: smooth，此参数作为兼容保留
    duration?: number;
    // 是否是 TabBar 页面 (Web 通常不需要)
    isTab?: boolean;
    // 是否适配安全区域
    safeArea?: boolean;
    // 滚动方向：top 回到顶部 / bottom 去底部。需要两个按钮时放两个实例，用 bottom 错开位置
    direction?: typeof backTopDirections[number];
    // 按钮形状：circle 圆形 / square 圆角方形；进度环随形状变成圆环或圆角方框
    shape?: typeof backTopShapes[number];
    // 图标名（Iconify 格式，如 lucide:arrow-big-up）；不传时显示文字箭头，方向随 direction
    icon?: string;
    // 是否在按钮边缘展示滚动进度环；回到顶部顺时针画、去底部逆时针画。传了自定义默认插槽时不生效（按钮结构已由插槽接管）
    showProgress?: boolean;
    // 可滚动总距离 (px)。外部接管 scrollTop 时用于换算百分比与去底部按钮的显隐；不传则按 document 实测
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

const b = tv(theme)

const isBottom = computed(() => props.direction === 'bottom')

/** 无障碍名称：按钮只有图标，读屏软件靠它念出用途 */
const label = computed(() => isBottom.value ? '去底部' : '回到顶部')

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

// ── 滚动进度 ────────────────────────────────────────────────
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

/**
 * 是否显示。回到顶部看已滚动的距离，去底部看离底部还剩多少；
 * 隐藏时给外层加 inert 而不是 aria-hidden：点击会让按钮获得焦点，滚到目标后它随即隐藏，
 * aria-hidden 落在仍持有焦点的元素上会被浏览器拦截告警；inert 会让浏览器先移走焦点，同时对读屏与 Tab 键隐藏。
 * 挂载前文档高度未测量，maxScroll 兜底为 1，去底部按钮在服务端渲染时保持隐藏，不会闪一下。
 */
const visible = computed(() => isBottom.value
    ? maxScroll.value - currentScrollTop.value > props.threshold
    : currentScrollTop.value > props.threshold)

// 当前进度，取值 0 ~ 1
const progress = computed(() => Math.min(1, Math.max(0, currentScrollTop.value / maxScroll.value)))

const progressPath = computed(() => BACK_TOP_PROGRESS_PATHS[props.shape])

// 进度环的可见长度，路径总长已用 pathLength 归一为 100；为 0 时模板不渲染进度本体，圆头线帽会把零长度的虚线段画成一个点
const progressLength = computed(() => progress.value * 100)

/**
 * 虚线为「长 100、间隔 100」，只靠偏移量决定露出哪一段：
 * 回到顶部偏移 100 - L，露出路径开头的 [0, L]，从 12 点顺时针长出；
 * 去底部偏移 L - 100，露出路径末尾的 [100 - L, 100]，从 12 点逆时针长出。
 * 两个按钮表达同一个滚动进度，并排时左右对称。
 */
const progressDashOffset = computed(() => isBottom.value
    ? progressLength.value - 100
    : 100 - progressLength.value)

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        color: props.color,
        size: props.size,
        shape: props.shape,
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

// 回到顶部或去底部；scrollHeight 超出可滚动范围时浏览器会自动夹到最底
function scrollToTarget() {
    window.scrollTo({
        top: isBottom.value ? document.documentElement.scrollHeight : 0,
        behavior: 'smooth'
    });
    emit("click");
}
</script>

<template>
  <div
    :class="ui.wrapper()" role="button" :aria-label="label" tabindex="0" :inert="!visible"
    :style="{ bottom: viewBottom, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }"
    @click.stop="scrollToTarget" @keydown.enter.prevent="scrollToTarget" @keydown.space.prevent="scrollToTarget"
  >
    <slot>
      <div
        :class="[
          ui.base(),
          visible ? '-translate-x-3' : 'translate-x-20'
        ]"
      >
        <svg v-if="showProgress" :class="ui.progress()" viewBox="0 0 100 100" aria-hidden="true">
          <path :class="ui.progressTrack()" :d="progressPath" pathLength="100" />
          <path v-if="progressLength > 0" :class="ui.progressBar()" :d="progressPath" pathLength="100" stroke-dasharray="100" :stroke-dashoffset="progressDashOffset" />
        </svg>
        <Icon v-if="icon" :name="icon" :class="ui.icon()" />
        <span v-else :class="ui.icon()">{{ isBottom ? '↓' : '↑' }}</span>
      </div>
    </slot>
  </div>
</template>
