<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { fabColors, fabDirections, fabPositions, fabTriggers, fabRadialLayouts } from "./reborn-fab.config";

// 类型定义
// --- 方向定义 ---
type FabPosition = (typeof fabPositions)[number];
type FabDirection = (typeof fabDirections)[number];
type FabColor = (typeof fabColors)[number];
type FabTrigger = (typeof fabTriggers)[number];

/**
 * UI 插槽映射接口
 */
interface UiMap {
    root?: string;
    capsuleWrapper?: string;
    capsuleActions?: string;
    capsuleInner?: string;
    trigger?: string;
    icon?: string;
    actions?: string;
    divider?: string;
}

/**
 * 悬浮按钮属性定义
 */
interface Props {
    modelValue?: boolean; // 是否展开（v-model）
    active?: boolean; // 是否激活
    position?: FabPosition; // 固定位置
    top?: string | number; // 自定义顶部距离
    bottom?: string | number; // 自定义底部距离
    left?: string | number; // 自定义左侧距离
    right?: string | number; // 自定义右侧距离
    trigger?: FabTrigger; // 触发方式 (click | hover)
    direction?: FabDirection; // 展开方向
    variant?: "float" | "capsule" | "circle"; // UI变体
    color?: FabColor; // 按钮颜色
    disabled?: boolean; // 是否禁用
    draggable?: boolean; // 是否可拖拽
    attract?: boolean; // 是否开启自动吸边
    expandable?: boolean; // 是否可展开
    gap?: { top?: number; left?: number; right?: number; bottom?: number }; // 拖拽的安全间距
    inactiveIcon?: string; // 未展开时的图标
    activeIcon?: string; // 展开时的图标
    zIndex?: number; // 层级
    divider?: boolean; // 是否显示分割线
    radius?: number; // 环形布局半径
    startAngle?: number; // 环形布局起始角度 (默认 -90, 正上方)
    totalAngle?: number; // 环形布局总角度 (默认 360, 一整圈)
    customStyle?: CSSProperties; // 自定义根元素样式
    customClass?: string; // 自定义根元素类名
    ui?: UiMap; // 自定义各部分样式类
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    active: false,
    position: "right-bottom",
    trigger: "click",
    direction: "top",
    variant: "float",
    color: "primary",
    disabled: false,
    draggable: false,
    attract: true,
    expandable: true,
    gap: () => ({ top: 32, left: 32, right: 32, bottom: 32 }),
    inactiveIcon: "lucide:plus",
    activeIcon: "lucide:plus",
    zIndex: 99,
    ui: () => ({
        root: "",
        trigger: "",
        icon: "",
        actions: ""
    })
});

const emit = defineEmits(["update:modelValue", "click", "open", "opened", "close", "closed"]);

// 响应式状态：内部执行动画的关键开关
const isActive = ref(props.modelValue || props.active);
// 动画的稳定状态（完全展开或完全收起）
const isExpanded = ref(isActive.value);
// 是否正处于伸展或回弹动画中
const isAnimating = ref(false);
let animTimer: ReturnType<typeof setTimeout> | null = null;

// 监听外界主动 modelValue 变化，同步 UI
watch(
    () => props.modelValue,
    (val) => {
        if (isActive.value !== val) {
            isActive.value = val;
        }
    }
);

// 监听组件展开状态，分步进行更新控制（在动画结束后进行最终状态同步）
watch(isActive, (val) => {
    isAnimating.value = true;

    // 即时触发阶段事件
    if (val) emit("open");
    else emit("close");

    if (animTimer) clearTimeout(animTimer);
    animTimer = setTimeout(() => {
        isAnimating.value = false;
        isExpanded.value = val;
        // 等动画结束后，更新外层 v-model 并抛出终点事件
        emit("update:modelValue", val);
        if (val) emit("opened");
        else emit("closed");
    }, 400); // 匹配整体响应最大动画时间 0.4s (对应 Tailwind duration-400)
});

import { provide } from "vue";
// 提供给子组件（FabAction）的稳定展现状态，用于在插槽内部控制展示时机，避免 DOM 过早卸载
provide("reborn-fab-active", isExpanded);

const fabDirection = ref(props.direction);

// 胶囊水平展开：JS 驱动宽度动画
// CSS grid-template-columns 的 fr 单位在 intrinsic width 场景下无法撑开容器，
// 水平方向改用测量 capsuleInner 的 offsetWidth 后通过 width 过渡实现展开。
const capsuleInnerRef = ref<HTMLElement | null>(null);
const capsuleContentWidth = ref(0);
let capsuleRo: ResizeObserver | null = null;

/**
 * 测量胶囊内容自然宽度
 */
function measureCapsuleWidth() {
    if (!capsuleInnerRef.value || props.variant !== "capsule") return;
    const dir = fabDirection.value;
    if (dir !== "left" && dir !== "right") return;

    const el = capsuleInnerRef.value;
    const originalTransition = el.style.transition;
    el.style.transition = "none";
    // 强制重绘以确保 transition: none 立即生效
    void el.offsetWidth;
    const width = el.getBoundingClientRect().width;
    el.style.transition = originalTransition;

    capsuleContentWidth.value = width;
}

/**
 * 水平方向胶囊展开的内联样式
 */
const capsuleActionsStyle = computed<CSSProperties>(() => {
    if (props.variant !== "capsule") return {};
    const dir = fabDirection.value;
    if (dir !== "left" && dir !== "right") return {};
    // 收起态始终 0；展开态使用测量值；未测量前不约束（让内容自然撑开）
    if (!isActive.value) return { width: "0px" };
    if (capsuleContentWidth.value > 0) return { width: `${capsuleContentWidth.value}px` };
    return {};
});

// 拖拽相关内部状态
const inited = ref(false); // 是否已初始化位置
const topPos = ref<string | number>(0); // 实时顶部像素
const leftPos = ref<string | number>(0); // 实时左侧像素
const fabSize = reactive({ width: 48, height: 48 }); // 按钮尺寸（默认 md = size-12 = 48px）
const screen = reactive({ width: 0, height: 0 }); // 屏幕尺寸
const attractTransition = ref(false); // 是否处于吸边动画中

/**
 * 拖拽边界限制
 */
const bounding = reactive({
    minTop: 0, // 最小顶部距离 (gap.top)
    minLeft: 0, // 最小左侧距离 (gap.left)
    maxTop: 0, // 最大顶部距离 (视口高度 - 按钮高度 - gap.bottom)
    maxLeft: 0 // 最大左侧距离 (视口宽度 - 按钮宽度 - gap.right)
});

const b = tv(theme);
const uiOverrides = computed(() => props.ui || {});

// 样式类生成
const uiClasses = computed(() => {
    const styles = b({
        color: props.color,
        active: isActive.value,
        variant: props.variant,
        direction: fabDirection.value
    });
    return {
        root: (opts?: any) => styles.root({ class: cn(opts?.class, uiOverrides.value.root, props.customClass) }),
        capsuleWrapper: (opts?: any) => styles.capsuleWrapper({ class: cn(opts?.class, uiOverrides.value.capsuleWrapper) }),
        capsuleActions: (opts?: any) => styles.capsuleActions({ class: cn(opts?.class, uiOverrides.value.capsuleActions) }),
        capsuleInner: (opts?: any) => styles.capsuleInner({ class: cn(opts?.class, uiOverrides.value.capsuleInner) }),
        trigger: (opts?: any) => styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
        icon: (opts?: any) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
        actions: (opts?: any) => styles.actions({ class: cn(opts?.class, uiOverrides.value.actions) }),
        divider: (opts?: any) => styles.divider({ class: cn(opts?.class, uiOverrides.value.divider) })
    };
});

const triggerRef = ref<HTMLElement | null>(null);
const actionsRef = ref<HTMLElement | null>(null);

/**
 * 计算环形排列布局
 */
function updateCircleLayout() {
    // 只有当 variant 为 circle 时，才执行径向分布逻辑
    if (props.variant !== "circle" || !actionsRef.value) return;

    const items = Array.from(actionsRef.value.children) as HTMLElement[];
    if (items.length === 0) return;

    // 从配置中获取对应方向的默认径向布局参数
    const configLayout = (fabRadialLayouts as any)[fabDirection.value] || (fabRadialLayouts as any).circle;

    // 参数优先级: Prop > Config > Default
    const radius = props.radius ?? (configLayout?.radius || 100);
    const startAngle = props.startAngle ?? (configLayout?.startAngle || -90);
    const totalAngle = props.totalAngle ?? (configLayout?.totalAngle || 360);

    const count = items.length;
    // 如果是 360 度全圆，则平分；如果是半圆，则根据间隔平分
    const angleStep = totalAngle === 360 ? totalAngle / count : count > 1 ? totalAngle / (count - 1) : 0;

    items.forEach((item, index) => {
        const angle = startAngle + angleStep * index;
        const radian = (angle * Math.PI) / 180;
        const x = Math.cos(radian) * radius;
        const y = Math.sin(radian) * radius;

        item.style.position = "absolute";
        item.style.left = "50%";
        item.style.top = "50%";
        item.style.transition = `all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) ${index * 0.05}s`;

        if (isActive.value) {
            item.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`;
            item.style.opacity = "1";
        } else {
            item.style.transform = `translate(-50%, -50%) scale(0.3)`;
            item.style.opacity = "0";
        }
    });
}

// 监听展开状态、方向或子元素变化时更新布局
watch(
    [isActive, fabDirection, () => props.radius, () => props.startAngle, () => props.totalAngle],
    () => {
        updateCircleLayout();
    },
    { immediate: true }
);

// 使用 MutationObserver 监听 Slot 内部子元素的变化
let observer: MutationObserver | null = null;
onMounted(() => {
    if (actionsRef.value) {
        observer = new MutationObserver(() => updateCircleLayout());
        observer.observe(actionsRef.value, { childList: true });
    }
    updateCircleLayout();
});

onUnmounted(() => {
    if (observer) observer.disconnect();
});

/**
 * 更新屏幕和按钮尺寸，并重新计算可拖拽的边界范围
 * 在组件挂载、窗口缩放或属性变化时调用，确保按钮位置合法
 */
function updateBounding() {
    // 使用 clientWidth/Height 以排除滚动条的影响，确保左右对称
    screen.width = document.documentElement.clientWidth || window.innerWidth;
    screen.height = document.documentElement.clientHeight || window.innerHeight;

    if (triggerRef.value) {
        // 实时测量触发按钮的宽高
        const rect = triggerRef.value.getBoundingClientRect();
        fabSize.width = rect.width || 48;
        fabSize.height = rect.height || 48;
    }

    const { top = 32, left: gLeft = 32, right = 32, bottom = 32 } = props.gap || {};

    // 计算边界约束条件：
    bounding.minTop = top;
    bounding.minLeft = gLeft;

    // maxLeft/maxTop: 屏幕宽度/高度减去按钮尺寸及对应间距
    bounding.maxLeft = screen.width - fabSize.width - (typeof right === "number" ? right : 32);
    bounding.maxTop = screen.height - fabSize.height - (typeof bottom === "number" ? bottom : 32);

    // 如果未初始化，或者用户尚未拖拽过，则应用预设坐标
    if (!inited.value || !hasMoved.value) {
        initPosition();
        inited.value = true;
    } else {
        // 如果已经手动拖动过，仅在 Resize 时做越界修正，防止按钮消失在视口外
        // 添加 || 0 防御，防止 leftPos/topPos 为字符串时 Number() 返回 NaN
        leftPos.value = Math.max(bounding.minLeft, Math.min(Number(leftPos.value) || 0, bounding.maxLeft));
        topPos.value = Math.max(bounding.minTop, Math.min(Number(topPos.value) || 0, bounding.maxTop));

        // attract 模式下 resize 后重新吸边
        // 使用记录的吸边方向而非重新按中心线判断，避免屏幕大小切换后方向反转
        if (props.attract && !isDragging.value && lastAttractedSide.value) {
            attractTransition.value = true;
            if (lastAttractedSide.value === 'left') {
                leftPos.value = bounding.minLeft;
            } else {
                leftPos.value = bounding.maxLeft;
            }
        }
    }
}

/**
 * 解析带有单位的尺寸字符串，转化为当前的像素值（支持 %, vh, vw, px, rem）
 */
function parseUnit(val: string | number | undefined, isVertical = false): number | undefined {
    if (val === undefined) return undefined;
    if (typeof val === "number") return val;

    const str = String(val).trim();
    // 纯数字字符串
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str);
    }

    const num = parseFloat(str);
    if (isNaN(num)) return undefined;

    if (str.endsWith("%")) {
        const base = isVertical ? screen.height : screen.width;
        return (num / 100) * base;
    } else if (str.endsWith("vh")) {
        return (num / 100) * window.innerHeight;
    } else if (str.endsWith("vw")) {
        return (num / 100) * window.innerWidth;
    } else if (str.endsWith("px")) {
        return num;
    } else if (str.endsWith("rem")) {
        const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        return num * fontSize;
    }

    return num;
}

/**
 * 根据 position 预设或显式坐标初始化按钮位置
 */
function initPosition() {
    const { minLeft, minTop, maxLeft, maxTop } = bounding;

    // --- 1. 计算初始 Top ---
    const explicitTop = parseUnit(props.top, true);
    const explicitBottom = parseUnit(props.bottom, true);

    if (explicitTop !== undefined) {
        topPos.value = explicitTop;
    } else if (explicitBottom !== undefined) {
        topPos.value = screen.height - fabSize.height - explicitBottom;
    } else {
        // 使用预设位置的 Y 轴
        topPos.value = props.position.includes("top") ? minTop : maxTop;
    }

    // --- 2. 计算初始 Left ---
    const explicitLeft = parseUnit(props.left, false);
    const explicitRight = parseUnit(props.right, false);

    if (explicitLeft !== undefined) {
        leftPos.value = explicitLeft;
        // 根据实际位置判断初始吸边方向（仅首次初始化时生效）
        if (!lastAttractedSide.value) {
            const fabCenter = explicitLeft + fabSize.width / 2;
            lastAttractedSide.value = fabCenter < screen.width / 2 ? 'left' : 'right';
        }
    } else if (explicitRight !== undefined) {
        leftPos.value = screen.width - fabSize.width - explicitRight;
    } else {
        // 使用预设位置的 X 轴
        leftPos.value = props.position.includes("left") ? minLeft : maxLeft;
    }

    // 记录初始吸边方向（position 预设或 right 显式定位时）
    if (!lastAttractedSide.value) {
        lastAttractedSide.value = props.position.includes("left") ? 'left' : 'right';
    }
}

// 拖拽控制逻辑
const isDragging = ref(false);
const hasMoved = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const startPointerPos = reactive({ x: 0, y: 0 });
let capturedTarget: HTMLElement | null = null;
let activePointerId = -1;

/** 根元素模板引用，用于拖拽时直接操作 DOM 绕过 Vue 响应式 */
const rootRef = ref<HTMLElement | null>(null);

/** 记录最后一次吸边方向，用于 resize 时正确恢复位置而非重新按中心线判断 */
const lastAttractedSide = ref<'left' | 'right' | null>(null);

/**
 * 指针按下：初始化拖拽状态
 * 记录初始位置并开启全局事件监听
 */
function handlePointerDown(e: PointerEvent) {
    if (!props.draggable || props.disabled) return;

    // 暂存目标和 pointerId
    capturedTarget = e.currentTarget as HTMLElement;
    activePointerId = e.pointerId;

    isDragging.value = true;
    hasMoved.value = false;
    attractTransition.value = false;

    // 从 getBoundingClientRect 读取当前渲染位置，
    // 防止吸边动画中 leftPos 是目标值而非当前渲染位置导致的视觉跳变
    const rect = capturedTarget.getBoundingClientRect();
    const currentLeft = rect.left;
    const currentTop = rect.top;

    // 将渲染位置同步回逻辑位置，确保后续计算的一致性
    leftPos.value = currentLeft;
    topPos.value = currentTop;

    // 记录点击位置相对于按钮左上角的偏移量，以便拖拽时精准定位
    dragOffset.x = e.clientX - currentLeft;
    dragOffset.y = e.clientY - currentTop;
    startPointerPos.x = e.clientX;
    startPointerPos.y = e.clientY;

    // 延迟到实际拖拽移动时才捕获指针（handlePointerMove 中 hasMoved 判定后），
    // 避免立即 capture 导致子元素（如 NuxtLink）收不到 click 事件无法跳转。
    // touch-action: none（模板中 touch-none）已能防止触摸设备上的手势逃逸。

    // 注册全局指针移动与抬起事件
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
}

/**
 * 指针移动：更新按钮位置并在越界时应用限制
 * 直接操作 DOM style.top/left，绕过 Vue 响应式更新链，确保拖拽跟手流畅
 */
function handlePointerMove(e: PointerEvent) {
    if (!isDragging.value || !props.draggable || props.disabled) return;

    const moveX = Math.abs(e.clientX - startPointerPos.x);
    const moveY = Math.abs(e.clientY - startPointerPos.y);

    // 只有当位移超过 5px 时，才认为发生了拖拽，此时应关闭展开态以防干扰
    if (!hasMoved.value && (moveX > 5 || moveY > 5)) {
        hasMoved.value = true;
        isActive.value = false;

        // 确认拖拽后捕获指针，防止快速滑动时指针脱离元素
        if (capturedTarget && capturedTarget.setPointerCapture && activePointerId !== -1) {
            try {
                capturedTarget.setPointerCapture(activePointerId);
            } catch {
                // 忽略无效指针捕获错误
            }
        }
    }

    if (!hasMoved.value) return;

    let x = e.clientX - dragOffset.x;
    let y = e.clientY - dragOffset.y;

    // 边界限制
    x = Math.max(bounding.minLeft, Math.min(x, bounding.maxLeft));
    y = Math.max(bounding.minTop, Math.min(y, bounding.maxTop));

    e.preventDefault();

    // 核心优化：直接操作 DOM style.top/left，绕过 Vue 响应式更新链
    // 拖拽时 rootStyle 中 isDragging=true 已经设置了 transition:none，
    // 所以直接写 DOM 不会与 CSS transition 冲突
    if (rootRef.value) {
        rootRef.value.style.left = `${x}px`;
        rootRef.value.style.top = `${y}px`;
    }
}

// 响应方向 prop 变化
watch(
    () => props.direction,
    (val) => {
        fabDirection.value = val;
        isActive.value = false;
    }
);

// 监听变体或方向变化，重新测量胶囊内容宽度
watch([() => props.variant, fabDirection], () => {
    nextTick(measureCapsuleWidth);
});

// 响应位置 prop 变化（在不可拖拽时生效）
watch(
    () => props.position,
    () => {
        if (!props.draggable) {
            initPosition();
        }
    }
);

// 监听 gap 变化，重新计算边界
watch(
    () => props.gap,
    () => {
        updateBounding();
    },
    { deep: true }
);

/**
 * 指针抬起：重置状态并执行吸边动画
 * 计算最终落点，并根据剩余空间自动调整展开方向
 */
function handlePointerUp(e: PointerEvent) {
    if (!isDragging.value || !props.draggable || props.disabled) return;

    // 使用保存的 activePointerId 而非 e.pointerId，避免 pointercancel 时 ID 不一致
    if (capturedTarget && capturedTarget.releasePointerCapture && activePointerId !== -1) {
        try {
            capturedTarget.releasePointerCapture(activePointerId);
        } catch {
            // 忽略未捕获的指针释放错误
        }
        capturedTarget = null;
    }
    activePointerId = -1;

    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);

    if (hasMoved.value && rootRef.value) {
        // 从 DOM 读取拖拽最终位置，写回 Vue 响应式变量
        const finalLeft = parseFloat(rootRef.value.style.left) || 0;
        const finalTop = parseFloat(rootRef.value.style.top) || 0;
        leftPos.value = finalLeft;
        topPos.value = finalTop;

        // 清除直接写的 DOM style，让 Vue 通过 rootStyle computed 接管后续渲染
        rootRef.value.style.left = "";
        rootRef.value.style.top = "";
    }

    // 在 Vue 接管后再关闭 isDragging，确保 rootStyle computed 生效时位置已同步
    isDragging.value = false;

    // 开启吸边过渡（仅在真正拖拽后执行，纯点击不触发吸引）
    if (props.attract && hasMoved.value) {
        attractTransition.value = true;
        const centerX = screen.width / 2;
        const currentLeft = Number(leftPos.value) || 0;
        const fabX = currentLeft + fabSize.width / 2;

        // 根据中心点位置决定向左或向右边缘吸附
        if (fabX < centerX) {
            leftPos.value = bounding.minLeft;
            lastAttractedSide.value = 'left';
        } else {
            leftPos.value = bounding.maxLeft;
            lastAttractedSide.value = 'right';
        }
    }

    // --- 动态方向调整 ---
    // 根据抬起后的位置与屏幕边界的距离，判断展开空间是否充足
    // 如果空间不足 (小于 safeZone)，则自动切换到相反的方向（例如靠右时由 right 变为 left）
    const currentTopAfter = Number(topPos.value) || 0;
    const currentLeftAfter = Number(leftPos.value) || 0;

    const safeZone = 140;
    let nextDir = props.direction;

    if (nextDir === "left" && currentLeftAfter - bounding.minLeft < safeZone) {
        nextDir = "right";
    } else if (nextDir === "right" && bounding.maxLeft - currentLeftAfter < safeZone) {
        nextDir = "left";
    } else if (nextDir === "top" && currentTopAfter - bounding.minTop < safeZone) {
        nextDir = "bottom";
    } else if (nextDir === "bottom" && bounding.maxTop - currentTopAfter < safeZone) {
        nextDir = "top";
    }

    fabDirection.value = nextDir;
}

/**
 * 点击触发：切换展开状态或触发点击事件
 */
function handleClick() {
    if (props.disabled || props.trigger === "hover" || hasMoved.value) return;
    if (props.expandable) {
        isActive.value = !isActive.value;
    } else {
        emit("click");
    }
}

/**
 * 鼠标进入：Hover 模式下展开
 */
function handleMouseEnter() {
    if (props.disabled || props.trigger !== "hover" || isDragging.value) return;
    isActive.value = true;
}

/**
 * 鼠标离开：Hover 模式下收回
 */
function handleMouseLeave() {
    if (props.disabled || props.trigger !== "hover") return;
    isActive.value = false;
}

// 按钮根元素样式计算：处理位置定位、层级以及拖拽/吸边时的过渡效果
const rootStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        position: "fixed",
        zIndex: props.zIndex
    };

    // 吸边动画：使用 top/left transition（仅在非拖拽态生效）
    if (attractTransition.value && !isDragging.value) {
        style.transition = "top 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28), left 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)";
    }

    // 展开 customStyle
    Object.assign(style, props.customStyle);

    // 拖拽时强制禁用 transition + 设置 will-change
    // 放在 customStyle 之后，确保不被用户传入的样式覆盖
    if (isDragging.value) {
        style.transition = "none";
        style.willChange = "top, left";
    }

    // 胶囊模式下显式定义根容器尺寸，确保内部绝对定位的锚点准确
    if (props.variant === "capsule") {
        style.width = `${fabSize.width}px`;
        style.height = `${fabSize.height}px`;
    }

    // 默认展示逻辑
    if (!inited.value) {
        if (props.top !== undefined) style.top = typeof props.top === "number" ? `${props.top}px` : props.top;
        else if (props.bottom !== undefined) style.bottom = typeof props.bottom === "number" ? `${props.bottom}px` : props.bottom;

        if (props.left !== undefined) style.left = typeof props.left === "number" ? `${props.left}px` : props.left;
        else if (props.right !== undefined) style.right = typeof props.right === "number" ? `${props.right}px` : props.right;
    } else {
        // 初始化后或拖拽过程中，统一转为 top/left 绝对定位
        style.top = typeof topPos.value === "number" ? `${topPos.value}px` : topPos.value;
        style.left = typeof leftPos.value === "number" ? `${leftPos.value}px` : leftPos.value;
        style.bottom = "auto";
        style.right = "auto";
    }

    return style;
});

onMounted(() => {
    // 胶囊模式：开启尺寸监听（用于处理动态内容导致的宽度变动）
    if (capsuleInnerRef.value) {
        capsuleRo = new ResizeObserver(() => measureCapsuleWidth());
        capsuleRo.observe(capsuleInnerRef.value);
    }

    // 初始化时测量一次宽度，并校准位置
    nextTick(() => measureCapsuleWidth());
    updateBounding();
    window.addEventListener("resize", updateBounding);
});

onUnmounted(() => {
    // 销毁监听器，防止内存泄漏
    if (capsuleRo) capsuleRo.disconnect();
    window.removeEventListener("resize", updateBounding);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
});

// 暴露 API
defineExpose({
    open: () => (isActive.value = true),
    close: () => (isActive.value = false)
});
</script>

<template>
    <div ref="rootRef" :class="uiClasses.root()" :style="rootStyle" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        <!-- 胶囊变体模式 -->
        <template v-if="variant === 'capsule'">
            <div :class="uiClasses.capsuleWrapper()">
                <!-- 内部悬浮项 -->
                <div v-show="expandable" :class="uiClasses.capsuleActions()" :style="capsuleActionsStyle">
                    <div ref="capsuleInnerRef" class="reborn-capsule-inner" :class="uiClasses.capsuleInner()">
                        <slot :isActive="isActive" :isExpanded="isExpanded" :isAnimating="isAnimating"
                            :isDragging="isDragging" :isAttracting="attractTransition" />
                    </div>
                </div>
                <div v-show="isActive && divider" :class="uiClasses.divider()">
                    <slot name="divider" />
                </div>
                <!-- 触发器 -->
                <div ref="triggerRef" :class="['pointer-events-auto shrink-0 w-max', { 'touch-none': draggable }]"
                    @click.stop="handleClick" @pointerdown="handlePointerDown">
                    <slot name="trigger" :isActive="isActive" :isExpanded="isExpanded" :isAnimating="isAnimating"
                        :isDragging="isDragging" :isAttracting="attractTransition">
                        <div :class="uiClasses.trigger()">
                            <Icon :name="isActive ? activeIcon : inactiveIcon" :class="uiClasses.icon()" />
                        </div>
                    </slot>
                </div>
            </div>
        </template>

        <!-- 默认悬浮变体模式 -->
        <template v-else>
            <!-- 悬浮操作项插槽 -->
            <div v-show="expandable || variant === 'circle'" ref="actionsRef"
                :class="[uiClasses.actions(), 'reborn-fab-actions-container', { 'is-active': isActive }]">
                <slot :isActive="isActive" :isExpanded="isExpanded" :isAnimating="isAnimating" :isDragging="isDragging"
                    :isAttracting="attractTransition" />
            </div>

            <!-- 主按钮触发区域 -->
            <div ref="triggerRef" :class="['pointer-events-auto w-max', { 'touch-none': draggable }]"
                @click.stop="handleClick" @pointerdown="handlePointerDown">
                <slot name="trigger" :isActive="isActive" :isExpanded="isExpanded" :isAnimating="isAnimating"
                    :isDragging="isDragging" :isAttracting="attractTransition">
                    <div :class="uiClasses.trigger()">
                        <Icon :name="isActive ? activeIcon : inactiveIcon" :class="uiClasses.icon()" />
                    </div>
                </slot>
            </div>
        </template>
    </div>
</template>

<style scoped>
/* 胶囊内部项强制原始尺寸，防止在 Grid flex 收缩时被挤压变形 */
.reborn-capsule-inner :slotted(*) {
    flex-shrink: 0;
}

/* 悬浮变体：子项逐个收起/展示的动画效果 */
.reborn-fab-actions-container :slotted(*) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: scale(0.3);
}

/* 激活状态：子项展示 */
.is-active.reborn-fab-actions-container :slotted(*) {
    opacity: 1;
    transform: scale(1);
}

/* 逐个展示延迟 */
.is-active.reborn-fab-actions-container :slotted(*:nth-child(1)) {
    transition-delay: 0.05s;
}

.is-active.reborn-fab-actions-container :slotted(*:nth-child(2)) {
    transition-delay: 0.1s;
}

.is-active.reborn-fab-actions-container :slotted(*:nth-child(3)) {
    transition-delay: 0.15s;
}

.is-active.reborn-fab-actions-container :slotted(*:nth-child(4)) {
    transition-delay: 0.2s;
}

.is-active.reborn-fab-actions-container :slotted(*:nth-child(5)) {
    transition-delay: 0.25s;
}

/* 逐个收起延迟 (反向) */
.reborn-fab-actions-container:not(.is-active) :slotted(*:nth-child(1)) {
    transition-delay: 0.2s;
}

.reborn-fab-actions-container:not(.is-active) :slotted(*:nth-child(2)) {
    transition-delay: 0.15s;
}

.reborn-fab-actions-container:not(.is-active) :slotted(*:nth-child(3)) {
    transition-delay: 0.1s;
}

.reborn-fab-actions-container:not(.is-active) :slotted(*:nth-child(4)) {
    transition-delay: 0.05s;
}

.reborn-fab-actions-container:not(.is-active) :slotted(*:nth-child(5)) {
    transition-delay: 0s;
}
</style>
