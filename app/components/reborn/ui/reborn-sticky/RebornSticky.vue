<template>
    <!-- 包装器容器：负责占位，防止吸顶时页面内容跳动 -->
    <div ref="wrapperRef" class="reborn-sticky-wrapper" :class="stickyUi.wrapper" :style="wrapperStyle">
        <!-- 实际内容容器：负责执行吸顶/吸底定位。
             添加 will-change: transform 在 sticky 状态下提升为 GPU 合成层，
             防止快速滚动时浏览器跳过重绘导致元素消失 -->
        <div ref="contentRef" :class="stickyUi.content" :style="contentStyle">
            <slot :is-sticky="isSticky"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, reactive, watch, watchEffect, nextTick, onMounted, onBeforeUnmount, type CSSProperties } from 'vue';
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import { useWindowScroll, useElementBounding } from '@vueuse/core';
import theme from './reborn-sticky.config';

defineOptions({
    name: "RebornSticky"
});

/**
 * 插槽定义
 * @slot default 默认插槽，返回当前是否处于吸顶状态
 */
defineSlots<{
    default(props: { isSticky: boolean }): unknown;
}>();

/**
 * 事件定义
 * @event change 当吸顶状态发生改变时触发
 * @event resize 当组件尺寸或位置发生改变时触发
 */
const emit = defineEmits<{
    /** 吸顶/吸底状态切换时触发，isSticky 为切换后的固定状态 */
    (e: 'change', isSticky: boolean): void;
    /** 组件尺寸或位置变化时触发，rect 为最新的宽高与页面绝对位置（单位 px） */
    (e: 'resize', rect: { height: number; width: number; left: number; top: number }): void;
}>();

export interface RebornStickyProps {
    // 吸顶偏移量, 单位px
    offsetTop?: number;
    // 层级
    zIndex?: number;
    // 是否需要减去导航栏高度
    isNeedNavbarHeight?: boolean;
    // 导航栏高度
    navbarHeight?: number;
    // 目标容器，CSS选择器或DOM元素。吸顶元素将始终保持在该容器内，超过范围则隐藏
    target?: string | HTMLElement;
    // 手动控制吸顶状态
    sticky?: boolean;
    // 固定位置：top 吸顶，bottom 吸底
    position?: 'top' | 'bottom';
    // 吸底越界后的边界基准：parent 保持旧逻辑，target 按目标容器底部向上 offsetTop 停靠
    bottomBoundary?: 'parent' | 'target';
    // 吸底固定后的占位策略：auto 保持旧逻辑，keep 保留高度，none 不参与页面排版
    bottomPlaceholder?: 'auto' | 'keep' | 'none';
    // 覆盖内部节点类名：wrapper 为外层占位容器，content 为实际执行吸附定位的内容容器
    ui?: { wrapper?: string, content?: string };
}

const props = withDefaults(defineProps<RebornStickyProps>(), {
    offsetTop: 0,
    zIndex: 100,
    isNeedNavbarHeight: true,
    navbarHeight: 0, // Web 端默认值通常为 0，除非存在固定的导航栏
    target: undefined,
    sticky: true,
    position: 'top',
    bottomBoundary: 'parent',
    bottomPlaceholder: 'auto',
    ui: undefined
});

const b = tv(theme);

const wrapperRef = ref<HTMLElement | null>(null);

const contentRef = ref<HTMLElement | null>(null);

// 使用 VueUse 获取滚动位置和元素边界数据
const { y: scrollTop } = useWindowScroll();
const {
    top: wrapperTop,
    bottom: wrapperBottom,
    width: wrapperWidth,
    left: wrapperLeft,
    update: updateRect
} = useElementBounding(wrapperRef);
const { height: contentHeight, update: updateContentRect } = useElementBounding(contentRef);

const targetElement = ref<HTMLElement | null>(null);
const { bottom: targetBottom, update: updateTargetRect } = useElementBounding(targetElement);

const initTarget = () => {
    if (!props.target) {
        targetElement.value = null;
        return;
    }
    if (typeof props.target === 'string') {
        targetElement.value = document.querySelector(props.target) as HTMLElement | null;
    } else {
        targetElement.value = props.target;
    }
};

onMounted(() => {
    initTarget();
});

watch(() => props.target, () => {
    initTarget();
});

watch(
    () => [props.position, props.target, props.offsetTop, props.navbarHeight, props.bottomBoundary, props.bottomPlaceholder],
    async () => {
        isStickyState.value = false;
        isTargetBottomState.value = false;
        stickyActivationDocBottom.value = 0;
        initTarget();
        await forceUpdate();
    },
    { flush: 'post' }
);

// 响应式对象，用于存储吸顶开始时的包装器尺寸信息
const rect = reactive({
    height: 0,
    width: 0,
    left: 0,
    top: 0
});

// 触发吸顶状态的阈值计算
const stickyThreshold = computed(() => {
    let offset = props.offsetTop;
    if (props.isNeedNavbarHeight) {
        offset += props.navbarHeight;
    }
    return offset;
});

/**
 * 获取包装器的实时边界。
 * 快速滚动时 VueUse 的边界值可能晚一帧，这里直接读取 DOM，避免 fixed/absolute 切换越界。
 *
 * ⚠️ 必须先无条件读取响应式边界值再读 DOM：这些函数运行在 computed / watchEffect 中，
 *    若响应式值只作为 ??/|| 的兜底，DOM 读取成功时会被短路跳过、不注册依赖，
 *    导致元素尺寸变化（如异步数据加载撑高页面）后样式不重算——
 *    表现为「进入页面初始位置不对，滚动一下才恢复」。
 */
function getWrapperMetrics(currentScrollTop = scrollTop.value) {
    // 先读取响应式值注册依赖（值本身仍以同帧 DOM 测量优先）
    const reactiveTop = wrapperTop.value;
    const reactiveBottom = wrapperBottom.value;
    const reactiveWidth = wrapperWidth.value;
    const reactiveLeft = wrapperLeft.value;
    const domRect = wrapperRef.value?.getBoundingClientRect();
    const top = domRect?.top ?? reactiveTop;
    const bottom = domRect?.bottom ?? reactiveBottom;
    return {
        top,
        bottom,
        width: domRect?.width ?? reactiveWidth,
        left: domRect?.left ?? reactiveLeft,
        docTop: top + currentScrollTop,
        docBottom: bottom + currentScrollTop
    };
}

/**
 * 获取目标容器的实时边界。
 * 同样先读响应式值注册依赖：target（如 #app-affix-container）在异步内容加载后长高时，
 * useElementBounding 的 ResizeObserver 会更新 targetBottom → 触发 contentStyle/watchEffect 重算。
 */
function getTargetMetrics(currentScrollTop = scrollTop.value) {
    const reactiveBottom = targetBottom.value;
    const domRect = targetElement.value?.getBoundingClientRect();
    const bottom = domRect?.bottom ?? reactiveBottom;
    return {
        bottom,
        docBottom: bottom + currentScrollTop
    };
}

/**
 * 获取当前内容真实高度。
 * 先读响应式高度注册依赖，再以同帧 DOM 测量优先，理由同上。
 */
function getCurrentContentHeight() {
    const reactiveHeight = contentHeight.value;
    return contentRef.value?.getBoundingClientRect().height || reactiveHeight || 0;
}

/**
 * 获取边界计算使用的内容高度。
 * 优先读取当前 DOM 高度，避免内容变化后一帧内仍使用旧缓存导致越界。
 */
function getBoundaryContentHeight() {
    const currentContentHeight = getCurrentContentHeight();
    return currentContentHeight > 0 ? currentContentHeight : rect.height;
}

/**
 * 同步缓存 sticky 激活时的尺寸，避免状态切换后 wrapper 高度变化导致判断抖动。
 */
function syncStickyRect(currentScrollTop = scrollTop.value) {
    const wrapperMetrics = getWrapperMetrics(currentScrollTop);
    const currentContentHeight = getBoundaryContentHeight();
    if (currentContentHeight > 0) {
        rect.height = currentContentHeight;
        rect.width = wrapperMetrics.width;
        rect.left = wrapperMetrics.left;
        rect.top = wrapperMetrics.docTop;
    }
}

/**
 * 吸底越界后的内容底部位置。
 * parent 为旧逻辑：停在目标底部向内 offsetTop；target 按目标底部向上 offsetTop 停靠。
 */
function getBottomBoundaryLine(targetBottomValue: number) {
    if (props.bottomBoundary === 'target') {
        return targetBottomValue - stickyThreshold.value;
    }
    return targetBottomValue - stickyThreshold.value;
}

/**
 * 吸底触发边界。parent 分支保留历史触发线，避免影响旧页面。
 */
function getBottomBoundaryTriggerLine(targetBottomValue: number) {
    if (props.bottomBoundary === 'target') {
        return getBottomBoundaryLine(targetBottomValue);
    }
    return targetBottomValue + stickyThreshold.value;
}

// 判断当前是否处于固定状态
const isStickyState = ref(false);

/** 是否已挂载：用于 none overlay 的开关。SSR 与首帧 hydration 均为 false（与服务端一致，避免 hydration 不匹配），
 *  mount 后置 true 再切换为 overlay。 */
const hasMounted = ref(false);

/** 吸底模式：target 底部越过 fixed bottom 偏移线后，停靠到 target 底部上方 offsetTop 的位置 */
const isTargetBottomState = ref(false);

/** 吸底目标边界切换容差，避免边界附近 fixed/absolute 来回抖动 */
const bottomBoundaryTolerance = 2;

/** 记录吸顶激活瞬间的 wrapper 顶部精确位置，用于消除子像素间隙 */
const stickySnapshotTop = ref(0);

/** 吸底激活瞬间的文档绝对底部位置，用于稳定的退出判定（不受 wrapper 塌陷影响） */
const stickyActivationDocBottom = ref(0);

/**
 * 冻结吸顶状态：当子组件（如 RebornCollapse）正在执行展开/收起动画时，
 * 暂停吸顶状态的判定，防止动画期间的布局变化导致 isSticky 状态反复翻转，
 * 从而避免 position 切换引起的页面跳动和滑动
 */
const stickyFrozen = ref(false);
let stickyFreezeTimer: ReturnType<typeof setTimeout> | null = null;

function shouldStickToTargetBottom(targetBoundaryLine: number, threshold: number) {
    if (props.bottomBoundary !== 'target') {
        return targetBoundaryLine <= threshold;
    }
    if (isTargetBottomState.value) {
        return targetBoundaryLine <= threshold + bottomBoundaryTolerance;
    }
    return targetBoundaryLine <= threshold - bottomBoundaryTolerance;
}

function freezeStickyTemporarily(duration?: number) {
    if (stickyFrozen.value) return
    stickyFrozen.value = true
    if (stickyFreezeTimer) clearTimeout(stickyFreezeTimer)
    stickyFreezeTimer = setTimeout(() => {
        stickyFrozen.value = false
        stickyFreezeTimer = null
        if (wrapperRef.value) {
            updateRect();
            updateContentRect();
            if (targetElement.value) {
                updateTargetRect();
            }
        }
    }, duration ?? 400) // 略大于 collapse 动画时长（300ms）+ 余量
}

watchEffect(() => {
    if (!props.sticky || !wrapperRef.value) {
        isStickyState.value = false;
        isTargetBottomState.value = false;
        return;
    }

    if (props.position === 'bottom') {
        // ── 吸底模式 ──
        // 不使用 freeze 冻结机制：改用文档绝对位置做退出判定，
        // 彻底消除 wrapper 塌陷引起的 wrapperBottom 跳变问题，
        // 保证快速滚动时状态响应即时且稳定。
        const viewportHeight = import.meta.client ? window.innerHeight : 0;
        const threshold = viewportHeight - stickyThreshold.value;
        const currentScrollTop = scrollTop.value;

        // ── overlay 占位（none / keep）：恒为 overlay，isStickyState 仅作样式信号 ──
        // 仅依据 target 几何（占位高度恒定、不随 isSticky 翻转）+ 迟滞，判定「钉视口底部 / 停靠 target 底部」；
        // 不读取 wrapper 自身位置，也不随 isSticky 增删/改变占位，从根本上杜绝逐帧翻转的反馈抖动。
        if (isBottomOverlay.value) {
            if (targetElement.value) {
                const targetMetrics = getTargetMetrics(currentScrollTop);
                // 钉在视口底部(overlay) ⟺ target 底部仍低于视口底部；与 contentStyle 的 Math.min 切换点一致。
                // 迟滞 bottomBoundaryTolerance，避免边界处亚像素来回翻转。
                isStickyState.value = isStickyState.value
                    ? targetMetrics.bottom >= viewportHeight - bottomBoundaryTolerance
                    : targetMetrics.bottom >= viewportHeight + bottomBoundaryTolerance;
            } else {
                isStickyState.value = true;
            }
            isTargetBottomState.value = false;
            return;
        }

        const wrapperMetrics = getWrapperMetrics(currentScrollTop);

        if (targetElement.value) {
            const targetMetrics = getTargetMetrics(currentScrollTop);
            const targetBoundaryLine = getBottomBoundaryTriggerLine(targetMetrics.bottom);
            if (isStickyState.value) {
                // 退出判定（target/parent 通用）：向下滚回到激活点以下 → 退出吸底。
                // 使用激活瞬间冻结的文档绝对底部，不受 wrapper 塌陷影响，稳定可靠。
                // ⚠️ Bug1 根因：旧逻辑 target 分支只更新 isTargetBottomState，缺失这段退出判定，
                //    导致一旦吸底 isStickyState 永不回 false。
                const virtualWrapperBottom = stickyActivationDocBottom.value - currentScrollTop;
                if (virtualWrapperBottom < threshold - 2) {
                    isStickyState.value = false;
                    isTargetBottomState.value = false;
                } else if (props.bottomBoundary === 'target') {
                    // target 模式加入迟滞判断，避免边界附近 fixed/absolute 反复切换
                    isTargetBottomState.value = shouldStickToTargetBottom(targetBoundaryLine, threshold);
                } else {
                    // parent 模式：直接根据 target 底部切换 fixed ↔ absolute，无延迟
                    isTargetBottomState.value = targetBoundaryLine <= threshold;
                }
            } else {
                // 正常流：wrapper 底部到达视口底部时激活吸底
                const shouldStickTarget = shouldStickToTargetBottom(targetBoundaryLine, threshold);
                if (wrapperMetrics.bottom >= threshold || (props.bottomBoundary === 'target' && shouldStickTarget)) {
                    syncStickyRect(currentScrollTop);
                    stickyActivationDocBottom.value = Math.max(wrapperMetrics.docBottom, currentScrollTop + threshold);
                    isTargetBottomState.value = props.bottomBoundary === 'target' ? shouldStickTarget : targetBoundaryLine <= threshold;
                    isStickyState.value = true;
                }
            }
        } else {
            // 无 target
            isTargetBottomState.value = false;
            if (isStickyState.value) {
                const virtualWrapperBottom = stickyActivationDocBottom.value - currentScrollTop;
                if (virtualWrapperBottom < threshold - 2) {
                    isStickyState.value = false;
                }
            } else {
                if (wrapperMetrics.bottom >= threshold) {
                    syncStickyRect(currentScrollTop);
                    stickyActivationDocBottom.value = wrapperMetrics.docBottom;
                    isStickyState.value = true;
                }
            }
        }
        return;
    }

    // ── 吸顶模式 ──
    // 子组件动画期间冻结吸顶状态，防止动画引起的布局变化导致状态翻转
    if (childAnimationLock.value && !stickyFrozen.value) {
        freezeStickyTemporarily()
        return
    }
    if (stickyFrozen.value) return

    isTargetBottomState.value = false;

    // 吸顶模式：当元素顶部即将离开视口顶部时固定
    const threshold = stickyThreshold.value;
    const currentScrollTop = scrollTop.value;
    const wrapperMetrics = getWrapperMetrics(currentScrollTop);
    if (isStickyState.value) {
        if (wrapperMetrics.top > threshold + 2) isStickyState.value = false;
    } else {
        if (wrapperMetrics.top <= threshold) {
            // ⚠️ 同理：先同步捕获尺寸，再激活 sticky，防止 wrapper 高度塌陷触发死循环
            syncStickyRect(currentScrollTop);
            isStickyState.value = true;
            // 记录激活瞬间的精确位置，后续定位使用 Math.floor 消除子像素间隙
            stickySnapshotTop.value = wrapperMetrics.top;
        }
    }
});

const isSticky = computed(() => isStickyState.value);

/**
 * none 占位模式：始终作为「0 高度占位块 + fixed overlay」渲染，与 isSticky 解耦。
 * ⚠️ 抖动根因：旧逻辑把占位移除绑定在 isSticky 上，而吸底元素是 target(#app-affix-container)
 *    的最后一个子节点——吸底切换会把它移入/移出文档流，导致 target/document 高度突变一个元素高度，
 *    进而让用于判定的 target.bottom / wrapper.bottom 反复越界，逐帧翻转 → 页面上下抖动。
 *    解耦后占位恒定（高度恒为 0），isSticky 仅作样式信号，彻底消除该反馈环。
 *    SSR 阶段（无 client）保持正常流，mount 后转为 overlay。
 */
const isBottomNoPlaceholder = computed(() => hasMounted.value && props.position === 'bottom' && props.bottomPlaceholder === 'none');

/**
 * keep 占位模式：复用 none 的「overlay + 占位解耦」硬化逻辑，但占位高度恒为 rect.height（保留高度，满足业务排版）。
 * ⚠️ keep 旧逻辑的抖动 / isSticky 卡死根因：占位高度随 isSticky 在 rect.height ↔ auto 之间翻转，
 *    而吸底元素在 target(#app-affix-container) 内部——占位高度一变，target/文档高度随之突变，
 *    判定值反复越界逐帧翻转（向上滚到临界点尤为明显）；且 isSticky 走冻结 docBottom 的滚动退出，
 *    只在贴近页面底部极窄区间才翻转，观感上「几乎不变」。
 *    改为：占位高度恒定（不随 isSticky 变）、内容恒为 overlay、isSticky 仅作 target 几何信号，彻底消除反馈抖动。
 */
const isBottomKeepOverlay = computed(() => hasMounted.value && props.position === 'bottom' && props.bottomPlaceholder === 'keep');

/** none / keep 统一走「overlay + 占位解耦」路径；差异仅在占位高度（none=0、keep=rect.height）。 */
const isBottomOverlay = computed(() => isBottomNoPlaceholder.value || isBottomKeepOverlay.value);

const wrapperStyle = computed<CSSProperties>(() => {
    if (isBottomOverlay.value) {
        // overlay 模式（none / keep 共用）：内容恒为 fixed/absolute overlay，占位高度与 isSticky 解耦。
        //   · none → 高度恒为 0，不预留纵向空间；
        //   · keep → 高度恒为 rect.height，始终保留元素高度（满足业务排版）。
        // 关键：占位高度不再随 isSticky 翻转，从根上消除 target/文档高度突变引发的反馈抖动。
        // position:relative：既维持容器宽度/left 供 overlay 测量定位，又作为「停靠态」absolute 内容的定位参照系。
        return {
            height: isBottomKeepOverlay.value ? rect.height + 'px' : '0px',
            minHeight: '0px',
            overflow: 'visible',
            position: 'relative',
            zIndex: props.zIndex
        };
    }

    return {
        height: isSticky.value && props.position !== 'bottom' ? rect.height + 'px' : 'auto',
        zIndex: isSticky.value ? props.zIndex : 'auto'
    };
});

/** 防抖分隔符：确保同一帧内只执行一次尺寸更新 */
let updatePending = false;

/**
 * 更新元素位置和尺寸信息
 * 用于吸顶时保持内容容器与原占位容器一致
 * 使用 rAF 防抖，避免由多条 resize/observe 链路同时触发导致的死循环
 */
const updateDimensions = () => {
    if (updatePending) return;
    updatePending = true;
    requestAnimationFrame(() => {
        updatePending = false;
        // 检查元素是否仍然挂载
        if (!wrapperRef.value) return;

        updateRect();
        updateContentRect();
        if (targetElement.value) {
            updateTargetRect();
        }
        // 使用 content 的真实高度，防止 wrapper 在吸顶后高度塌陷为0
        const currentContentHeight = getCurrentContentHeight();
        // 仅在尺寸确实发生变化时才更新 rect 并 emit resize，进一步减少冗余响应。
        // none 模式下 wrapper 仍是全宽 0 高度块，宽度/left 可正常测量，无需冻结。
        const nextWidth = wrapperWidth.value;
        const nextLeft = wrapperLeft.value;
        const nextTop = wrapperTop.value + scrollTop.value;
        if (
            rect.height !== currentContentHeight ||
            rect.width !== nextWidth ||
            rect.left !== nextLeft
        ) {
            rect.height = currentContentHeight;
            rect.width = nextWidth;
            rect.left = nextLeft;
            rect.top = nextTop;
            emit('resize', { ...rect });
        }
    });
};

/**
 * 强制刷新尺寸信息
 * 用于处理 v-if 切换导致的 DOM 变化
 */
const forceUpdate = async () => {
    await nextTick();
    updateRect();
    updateContentRect();
    if (targetElement.value) {
        updateTargetRect();
    }
    syncStickyRect();
};

// 监听吸顶状态变化，更新尺寸（仅在首次变为 sticky 时触发一次）
watch(isSticky, (newValue) => {
    if (newValue) {
        // 延迟一帧，确保 position:fixed 产生的布局变化已经稳定
        nextTick(() => {
            updateDimensions();
        });
    } else {
        isTargetBottomState.value = false;
        // 吸底模式使用虚拟位置做退出判定，不需要冻结机制
        // 吸顶模式仍需冻结：wrapper 高度从 rect.height 变为 auto 时
        // wrapperTop 骤变可能触发重新激活的死循环
        if (props.position !== 'bottom') {
            freezeStickyTemporarily(400);
        }
    }
    emit('change', newValue);
});

/**
 * 使用原生写法注册 resize 和 ResizeObserver 监听器，
 * 避免使用 useEventListener/useResizeObserver 导致的 scoped useEffect 嵌套
 * （useElementBounding 内部已经注册了自己的一套 resize/observe 监听器，
 * 如果我们再叠加第二套，resize 时二者互相触发，会形成死循环）。
 */
let resizeObserver: ResizeObserver | null = null;
/** rAF 防抖标记，避免同一帧内多次触发 updateDimensions */
let resizeRafPending = false;
/** 子组件动画锁：当 RebornCollapse 正在执行展开/收起动画时，
 *  跳过尺寸更新，防止动画期间的 ResizeObserver 回调引发连锁重排 */
const childAnimationLock = ref(false);
let childAnimationTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 检测 RebornCollapse 的动画状态
 * 当 collapse 组件的 trigger 元素带有 reborn-collapse__animating 类名时，
 * 说明正在执行 300ms 的高度过渡动画，此时应跳过尺寸更新
 */
function isChildAnimating(entries?: ResizeObserverEntry[]): boolean {
    if (entries) {
        for (const entry of entries) {
            const el = entry.target as HTMLElement
            if (el.classList?.contains('reborn-collapse__animating') ||
                el.querySelector?.('.reborn-collapse__animating')) {
                return true
            }
        }
    }
    // 同时检查 wrapper 内是否有动画中的 collapse
    if (wrapperRef.value?.querySelector('.reborn-collapse__animating')) {
        return true
    }
    return false
}

function lockChildAnimation() {
    childAnimationLock.value = true
    if (childAnimationTimer) clearTimeout(childAnimationTimer)
    childAnimationTimer = setTimeout(() => {
        childAnimationLock.value = false
        childAnimationTimer = null
        // 动画结束后强制同步一次最终尺寸，并刷新响应式边界值触发 watchEffect 重新检测位置
        if (wrapperRef.value) {
            updateRect();
            updateContentRect();
            updateDimensions()
        }
    }, 350) // 略大于 collapse 的 300ms 动画时长
}

/**
 * 统一的 ResizeObserver 回调处理
 * 使用 rAF 防抖合并同一帧内的多次回调，减少重排次数
 */
function handleResizeObserver(entries: ResizeObserverEntry[]) {
    if (isChildAnimating(entries)) {
        if (!childAnimationLock.value) {
            lockChildAnimation()
        }
        return
    }
    // 动画锁激活期间跳过
    if (childAnimationLock.value) return

    if (resizeRafPending) return
    resizeRafPending = true
    requestAnimationFrame(() => {
        resizeRafPending = false
        updateDimensions()
    })
}

const handleWindowResize = () => {
    updateDimensions();
};

onMounted(() => {
    // 标记已挂载：此后 none 模式才切换为 fixed overlay，避免与 SSR 首帧不一致引发 hydration 警告
    hasMounted.value = true;
    // 窗口 resize 监听
    if (import.meta.client && window) {
        window.addEventListener('resize', handleWindowResize, { passive: true });
    }
    // 单个 ResizeObserver 同时监听 wrapper 和 content
    if (import.meta.client && window && 'ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(handleResizeObserver);
        if (wrapperRef.value) {
            resizeObserver.observe(wrapperRef.value);
        }
        if (contentRef.value) {
            resizeObserver.observe(contentRef.value);
        }
    }
});

onBeforeUnmount(() => {
    if (import.meta.client && window) {
        window.removeEventListener('resize', handleWindowResize);
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (childAnimationTimer) {
        clearTimeout(childAnimationTimer);
        childAnimationTimer = null;
    }
    if (stickyFreezeTimer) {
        clearTimeout(stickyFreezeTimer);
        stickyFreezeTimer = null;
    }
});

const uiOverrides = computed(() => props.ui || {});
/**
 * 样式管理
 */
const stickyUi = computed(() => {
    const styles = b({
        sticky: isSticky.value,
    });
    return {
        wrapper: cn(styles.wrapper(), uiOverrides.value.wrapper),
        content: cn(styles.content(), uiOverrides.value.content),
    };
});

/**
 * 水平边界像素对齐：消除 fixed 定位时左右边缘的亚像素缝隙。
 * 吸顶/吸底条是「不透明遮盖条」，其背后有内容在滚动，因此必须向外取整（左边 floor、右边 ceil），
 * 保证遮盖条永远完整盖住背后内容——最坏只是向两侧留白区多溢出不到 1px（不可见），绝不会欠盖露出缝隙。
 * ⚠️ 不能用 Math.round：就近取整可能把左/右边缘向内推，导致背后滚动的内容（如商品图）从边缘露出一丝。
 * 再由取整后的两条边之差反推 width，避免 left、width 各自取整产生累计偏差。
 */
function snapEdges(left: number, width: number): { left: number; width: number } {
    const snappedLeft = Math.floor(left);
    const snappedRight = Math.ceil(left + width);
    return { left: snappedLeft, width: Math.max(0, snappedRight - snappedLeft) };
}

/**
 * 计算固定时的状态与位置样式
 *
 * ⚠️ bottom + target 越界时停靠到 target 底部上方 offsetTop 的位置，避免 fixed 状态跑出目标容器。
 */
const contentStyle = computed<CSSProperties>(() => {
    // overlay 占位模式（none / keep）：与 isSticky 解耦的 overlay（占位高度恒定，不随 isSticky 变化，避免占位翻转反馈环）。
    // 按「内容应钉视口底部 / 应停靠 target 底部」分两种锚点（二者在临界点 boundaryTop==fixedTop 处重合，切换无跳变）：
    //   · 钉视口底部 → position:fixed（锚视口，top 恒定）
    //   · 停靠 target 底部 → position:absolute（锚文档，随滚动原生静止，消除 fixed 跟踪滚动的一帧浮动）
    if (isBottomOverlay.value) {
        const currentScrollTop = scrollTop.value;
        const viewportHeight = import.meta.client ? window.innerHeight : 0;
        const boundaryContentHeight = getBoundaryContentHeight();
        // 钉在视口底部时的内容顶部（视口坐标，恒定、不随滚动变化）
        const fixedTop = viewportHeight - stickyThreshold.value - boundaryContentHeight;

        if (targetElement.value) {
            const targetMetrics = getTargetMetrics(currentScrollTop);
            // 停靠在 target 底部上方 offsetTop 时的内容顶部（视口坐标）
            const boundaryTop = getBottomBoundaryLine(targetMetrics.bottom) - boundaryContentHeight;
            // boundaryTop <= fixedTop ⟺ target 底部已上移进视口 → 进入「停靠态」，
            // 元素应钉在 target 底部上方、随文档一起滚动（视觉上静止于文档）。
            //
            // ⚠️ 浮动根因：此前停靠态仍用 position:fixed 并每帧用响应式重算 top 去跟踪 target 底部。
            //    fixed 锚定的是视口，而 top 的响应式更新比浏览器合成的滚动晚一帧 → 元素先随视口
            //    漂移、再被新 top 拉回原位，形成「向下/向上浮动后归位」的抖动。
            // ✅ 修复：停靠态改用 position:absolute 锚定 wrapper（已置为 relative 的 0 高度参照系），
            //    top 取「同帧测得的 boundaryTop 与 wrapper 顶部之差」。二者均为视口坐标且同帧采样，
            //    scrollTop 自动抵消 → absolute top 恒定，由浏览器原生处理滚动，彻底消除浮动。
            //    absolute 与 fixed 同为脱离文档流，不改变 target/文档高度，不会重新引入占位翻转反馈环。
            if (boundaryTop <= fixedTop) {
                const wrapperMetrics = getWrapperMetrics(currentScrollTop);
                return {
                    width: rect.width + 'px',
                    left: '0px',
                    top: (boundaryTop - wrapperMetrics.top) + 'px',
                    bottom: 'auto',
                    position: 'absolute',
                    willChange: 'auto'
                };
            }
        }

        // 钉在视口底部（pinned）：fixed 锚定视口、top 恒定 → 本就无浮动
        const pinnedEdges = snapEdges(rect.left, rect.width);
        return {
            width: pinnedEdges.width + 'px',
            left: pinnedEdges.left + 'px',
            top: Math.floor(fixedTop) + 'px',
            bottom: 'auto',
            position: 'fixed',
            willChange: 'transform'
        };
    }

    if (!isSticky.value) {
        return {
            width: '100%',
            left: '0px',
            top: '0px',
            position: 'relative',
            willChange: 'auto'
        };
    }

    if (props.position === 'bottom') {
        if (targetElement.value && isTargetBottomState.value) {
            // 非 none 占位：越界后切换为 absolute 停靠到 target 底部上方 offsetTop
            const currentScrollTop = scrollTop.value;
            const targetMetrics = getTargetMetrics(currentScrollTop);
            const boundaryContentHeight = getBoundaryContentHeight();
            const wrapperMetrics = getWrapperMetrics(currentScrollTop);
            const absoluteTop = getBottomBoundaryLine(targetMetrics.bottom) - wrapperMetrics.top - boundaryContentHeight;
            return {
                width: rect.width + 'px',
                left: '0px',
                top: absoluteTop + 'px',
                position: 'absolute',
                willChange: 'transform'
            };
        }
        // 吸底模式固定在视口底部
        const bottomEdges = snapEdges(rect.left, rect.width);
        return {
            width: bottomEdges.width + 'px',
            left: bottomEdges.left + 'px',
            bottom: stickyThreshold.value + 'px',
            top: 'auto',
            position: 'fixed',
            willChange: 'transform'
        };
    }

    // 吸顶模式：检查是否已触达目标容器底部
    if (targetElement.value) {
        const currentScrollTop = scrollTop.value;
        const targetMetrics = getTargetMetrics(currentScrollTop);
        const boundaryContentHeight = getBoundaryContentHeight();
        const maxTop = targetMetrics.bottom - boundaryContentHeight;
        if (maxTop <= stickyThreshold.value) {
            // 触达容器底部 → 停靠态：内容应停在 target 底部上方、随文档一起滚动（视觉上静止于文档）。
            //
            // ⚠️ 越界回弹根因：旧逻辑停靠态仍用 position:fixed 并每帧响应式重算 top 追踪 target 底部。
            //    fixed 锚定的是视口，而 top 的响应式更新比浏览器合成滚动晚一帧 → 上滑时元素先随视口
            //    滑出 target 底部边界（看起来「超出 target 内容」），再被新 top 拉回（「回到 target 中」）。
            // ✅ 修复（与吸底 overlay 停靠态同一手法）：停靠态改用 position:absolute 锚定 wrapper
            //    （占位块在文档流中，类名已含 relative）。top 取「同帧测得的 maxTop 与 wrapper 顶部之差」，
            //    二者均为视口坐标且同帧采样，scrollTop 相互抵消 → absolute top 恒定，
            //    滚动由浏览器原生处理，彻底消除一帧滞后的越界回弹。
            //    absolute 与 fixed 同为脱离文档流，不改变占位/文档高度，不影响 isSticky 判定。
            const wrapperMetrics = getWrapperMetrics(currentScrollTop);
            return {
                width: rect.width + 'px',
                left: '0px',
                top: (maxTop - wrapperMetrics.top) + 'px',
                position: 'absolute',
                willChange: 'auto'
            };
        }
    }

    // 吸顶模式固定在视口顶部
    // 直接使用 stickyThreshold（即 offsetTop）作为 fixed top 值，
    // 确保吸顶后始终贴合 header 底部，不受滚动时触发位置的影响。
    // Math.floor 消除子像素差值导致的 1px 缝隙；snapEdges 同理消除左右边缘的亚像素缝隙
    const topEdges = snapEdges(rect.left, rect.width);
    return {
        width: topEdges.width + 'px',
        left: topEdges.left + 'px',
        top: Math.floor(stickyThreshold.value) + 'px',
        position: 'fixed',
        willChange: 'transform'
    };
});

/**
 * 暴露给外部的属性和状态
 */
defineExpose({
    /** 组件当前高度 */
    height: computed(() => rect.height),
    /** 是否处于固定状态 */
    isSticky,
    /** 固定位置方向 */
    position: computed(() => props.position),
    /** 位置和尺寸矩形对象 */
    rect,
    /** 强制刷新尺寸信息 */
    forceUpdate
});
</script>
