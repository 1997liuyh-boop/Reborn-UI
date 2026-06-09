<script lang="ts" setup>
import type { CSSProperties } from "vue";
import type { fabColors, fabDirections, fabPositions, fabTriggers } from "./reborn-fab.config";

import { computed, nextTick, onMounted, onUnmounted, provide, reactive, ref, watch } from "vue";
import { tv } from "~/lib/tv";

import { cn } from "~/lib/utils";
import theme, { fabRadialLayouts } from "./reborn-fab.config";

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
    actions: "",
  }),
});

const emit = defineEmits(["update:modelValue", "click", "open", "opened", "close", "closed"]);

// 响应式状态：内部执行动画的关键开关
const isActive = ref(props.modelValue || props.active);
// 动画的稳定状态（完全展开或完全收起）
const isExpanded = ref(isActive.value);
// 是否正处于伸展或回弹动画中
const isAnimating = ref(false);
let animTimer: ReturnType<typeof setTimeout> | null = null;
let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

// 监听外界主动 modelValue 变化，同步 UI
watch(
  () => props.modelValue,
  (val) => {
    if (isActive.value !== val) {
      isActive.value = val;
    }
  },
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
const hasDragged = ref(false); // 是否已经通过拖拽确定过位置，用于避免交互时回到初始坐标

/**
 * 拖拽边界限制
 */
const bounding = reactive({
  minTop: 0, // 最小顶部距离 (gap.top)
  minLeft: 0, // 最小左侧距离 (gap.left)
  maxTop: 0, // 最大顶部距离 (视口高度 - 按钮高度 - gap.bottom)
  maxLeft: 0, // 最大左侧距离 (视口宽度 - 按钮宽度 - gap.right)
});

const b = tv(theme);
const uiOverrides = computed(() => props.ui || {});

// 样式类生成
const uiClasses = computed(() => {
  const styles = b({
    color: props.color,
    active: isActive.value,
    variant: props.variant,
    direction: fabDirection.value,
  });
  return {
    root: (opts?: any) =>
      styles.root({ class: cn(opts?.class, uiOverrides.value.root, props.customClass) }),
    capsuleWrapper: (opts?: any) =>
      styles.capsuleWrapper({ class: cn(opts?.class, uiOverrides.value.capsuleWrapper) }),
    capsuleActions: (opts?: any) =>
      styles.capsuleActions({ class: cn(opts?.class, uiOverrides.value.capsuleActions) }),
    capsuleInner: (opts?: any) =>
      styles.capsuleInner({ class: cn(opts?.class, uiOverrides.value.capsuleInner) }),
    trigger: (opts?: any) => styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
    icon: (opts?: any) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    actions: (opts?: any) => styles.actions({ class: cn(opts?.class, uiOverrides.value.actions) }),
    divider: (opts?: any) => styles.divider({ class: cn(opts?.class, uiOverrides.value.divider) }),
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
  const configLayout =
    (fabRadialLayouts as any)[fabDirection.value] || (fabRadialLayouts as any).circle;

  // 参数优先级: Prop > Config > Default
  const radius = props.radius ?? (configLayout?.radius || 100);
  const startAngle = props.startAngle ?? (configLayout?.startAngle || -90);
  const totalAngle = props.totalAngle ?? (configLayout?.totalAngle || 360);

  const count = items.length;
  // 如果是 360 度全圆，则平分；如果是半圆，则根据间隔平分
  const angleStep =
    totalAngle === 360 ? totalAngle / count : count > 1 ? totalAngle / (count - 1) : 0;

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
  { immediate: true },
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
  // minTop/minLeft: 间距最小值
  bounding.minTop = top;
  bounding.minLeft = gLeft;

  // maxLeft/maxTop: 屏幕宽度/高度减去按钮尺寸及对应间距
  bounding.maxLeft = screen.width - fabSize.width - (typeof right === "number" ? right : 32);
  bounding.maxTop = screen.height - fabSize.height - (typeof bottom === "number" ? bottom : 32);

  // 如果未初始化，或者用户尚未拖拽定位过，则应用预设坐标
  if (!inited.value || !hasDragged.value) {
    initPosition();
    inited.value = true;
  } else {
    // 如果已经手动拖动过，仅在 Resize 时做越界修正，防止按钮消失在视口外
    leftPos.value = Math.max(bounding.minLeft, Math.min(Number(leftPos.value), bounding.maxLeft));
    topPos.value = Math.max(bounding.minTop, Math.min(Number(topPos.value), bounding.maxTop));
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
    return Number.parseFloat(str);
  }

  const num = Number.parseFloat(str);
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
    const fontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
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
  } else if (explicitRight !== undefined) {
    leftPos.value = screen.width - fabSize.width - explicitRight;
  } else {
    // 使用预设位置的 X 轴
    leftPos.value = props.position.includes("left") ? minLeft : maxLeft;
  }
}

// 拖拽控制逻辑
const isDragging = ref(false);
const hasMoved = ref(false); // 当前按下手势是否已经发生拖拽，用于阻止拖拽后的 click
const dragOffset = reactive({ x: 0, y: 0 });
const startPointerPos = reactive({ x: 0, y: 0 });
const pendingDragPosition = { x: 0, y: 0 };
let capturedTarget: HTMLElement | null = null;
let dragFrame: number | null = null;

function applyDragPosition(x: number, y: number) {
  leftPos.value = x;
  topPos.value = y;
}

function scheduleDragPosition(x: number, y: number) {
  pendingDragPosition.x = x;
  pendingDragPosition.y = y;

  if (dragFrame !== null) return;

  dragFrame = window.requestAnimationFrame(() => {
    dragFrame = null;
    applyDragPosition(pendingDragPosition.x, pendingDragPosition.y);
  });
}

function flushDragPosition() {
  if (dragFrame === null) return;

  window.cancelAnimationFrame(dragFrame);
  dragFrame = null;
  applyDragPosition(pendingDragPosition.x, pendingDragPosition.y);
}

/**
 * 指针按下：初始化拖拽状态
 * 记录初始位置并开启全局事件监听
 */
function handlePointerDown(e: PointerEvent) {
  if (!props.draggable || props.disabled) return;

  // 适配多端捕获：防止滑动过快导致指针脱离元素
  const target = e.currentTarget as HTMLElement;
  if (target && target.setPointerCapture) {
    target.setPointerCapture(e.pointerId);
    capturedTarget = target;
  }

  isDragging.value = true;
  hasMoved.value = false;
  attractTransition.value = false;

  const currentLeft =
    typeof leftPos.value === "number" ? leftPos.value : Number.parseFloat(String(leftPos.value));
  const currentTop =
    typeof topPos.value === "number" ? topPos.value : Number.parseFloat(String(topPos.value));
  pendingDragPosition.x = currentLeft;
  pendingDragPosition.y = currentTop;

  // 记录点击位置相对于按钮左上角的偏移量，以便拖拽时精准定位
  dragOffset.x = e.clientX - currentLeft;
  dragOffset.y = e.clientY - currentTop;
  startPointerPos.x = e.clientX;
  startPointerPos.y = e.clientY;

  // 注册全局指针移动与抬起事件
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
}

/**
 * 指针移动：更新按钮位置并在越界时应用限制
 */
function handlePointerMove(e: PointerEvent) {
  if (!isDragging.value || !props.draggable || props.disabled) return;

  const moveX = Math.abs(e.clientX - startPointerPos.x);
  const moveY = Math.abs(e.clientY - startPointerPos.y);

  // 只有当位移超过 5px 时，才认为发生了拖拽，此时应关闭展开态以防干扰
  if (!hasMoved.value && (moveX > 5 || moveY > 5)) {
    hasMoved.value = true;
    hasDragged.value = true;
    isActive.value = false;
  }

  if (!hasMoved.value) return;

  let x = e.clientX - dragOffset.x;
  let y = e.clientY - dragOffset.y;

  // 边界限制
  x = Math.max(bounding.minLeft, Math.min(x, bounding.maxLeft));
  y = Math.max(bounding.minTop, Math.min(y, bounding.maxTop));

  e.preventDefault();
  scheduleDragPosition(x, y);
}

// 响应方向 prop 变化
watch(
  () => props.direction,
  (val) => {
    fabDirection.value = val;
    isActive.value = false;
  },
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
  },
);

// 监听 gap 变化，重新计算边界
watch(
  () => props.gap,
  () => {
    updateBounding();
  },
  { deep: true },
);

/**
 * 指针抬起：重置状态并执行吸边动画
 * 计算最终落点，并根据剩余空间自动调整展开方向
 */
function handlePointerUp(e: PointerEvent) {
  if (!isDragging.value || !props.draggable || props.disabled) return;
  isDragging.value = false;

  if (capturedTarget && capturedTarget.releasePointerCapture) {
    capturedTarget.releasePointerCapture(e.pointerId);
    capturedTarget = null;
  }

  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);
  window.removeEventListener("pointercancel", handlePointerUp);
  flushDragPosition();

  if (!hasMoved.value) return;

  // 开启吸边过渡（如果属性开启了 attract）
  if (props.attract) {
    attractTransition.value = true;
    const centerX = screen.width / 2;
    const currentLeft =
      typeof leftPos.value === "number" ? leftPos.value : Number.parseFloat(String(leftPos.value));
    const fabX = currentLeft + fabSize.width / 2;

    // 根据中心点位置决定向左或向右边缘吸附
    if (fabX < centerX) {
      leftPos.value = bounding.minLeft;
    } else {
      leftPos.value = bounding.maxLeft;
    }
  }

  // --- 动态方向调整 ---
  // 根据抬起后的位置与屏幕边界的距离，判断展开空间是否充足
  // 如果空间不足 (小于 safeZone)，则自动切换到相反的方向（例如靠右时由 right 变为 left）
  const currentTopAfter =
    typeof topPos.value === "number" ? topPos.value : Number.parseFloat(String(topPos.value));
  const currentLeftAfter =
    typeof leftPos.value === "number" ? leftPos.value : Number.parseFloat(String(leftPos.value));

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

function clearHoverCloseTimer() {
  if (!hoverCloseTimer) return;

  clearTimeout(hoverCloseTimer);
  hoverCloseTimer = null;
}

function getHoverCloseDelay() {
  return props.variant === "circle" ? 320 : 160;
}

/**
 * 鼠标进入：Hover 模式下展开
 */
function handleMouseEnter() {
  if (props.disabled || props.trigger !== "hover" || isDragging.value) return;
  clearHoverCloseTimer();
  isActive.value = true;
}

/**
 * 鼠标离开：Hover 模式下收回
 */
function handleMouseLeave() {
  if (props.disabled || props.trigger !== "hover") return;
  clearHoverCloseTimer();
  hoverCloseTimer = setTimeout(() => {
    hoverCloseTimer = null;
    if (props.disabled || props.trigger !== "hover" || isDragging.value) return;

    isActive.value = false;
  }, getHoverCloseDelay());
}

// 按钮根元素样式计算：处理位置定位、层级以及拖拽/吸边时的过渡效果
const rootStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    position: "fixed",
    zIndex: props.zIndex,
    // 如果处于吸边动画中，应用平滑位移过渡
    ...(attractTransition.value
      ? {
          transition:
            "top 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28), left 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
        }
      : {}),
    // 拖拽时开启 will-change 提示浏览器进行硬件加速优化
    ...(isDragging.value ? { willChange: "top, left" } : {}),
    ...props.customStyle,
  };

  // 胶囊模式下显式定义根容器尺寸，确保内部绝对定位的锚点准确
  if (props.variant === "capsule") {
    style.width = `${fabSize.width}px`;
    style.height = `${fabSize.height}px`;
  }

  // 默认展示逻辑
  if (!inited.value) {
    if (props.top !== undefined)
      style.top = typeof props.top === "number" ? `${props.top}px` : props.top;
    else if (props.bottom !== undefined)
      style.bottom = typeof props.bottom === "number" ? `${props.bottom}px` : props.bottom;

    if (props.left !== undefined)
      style.left = typeof props.left === "number" ? `${props.left}px` : props.left;
    else if (props.right !== undefined)
      style.right = typeof props.right === "number" ? `${props.right}px` : props.right;
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
  clearHoverCloseTimer();
  window.removeEventListener("resize", updateBounding);
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);
  window.removeEventListener("pointercancel", handlePointerUp);
  flushDragPosition();
});

// 暴露 API
defineExpose({
  open: () => (isActive.value = true),
  close: () => (isActive.value = false),
});
</script>

<template>
  <div
    :class="uiClasses.root()"
    :style="rootStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 胶囊变体模式 -->
    <template v-if="variant === 'capsule'">
      <div :class="uiClasses.capsuleWrapper()">
        <!-- 内部悬浮项 -->
        <div
          v-show="expandable"
          :class="uiClasses.capsuleActions()"
          :style="capsuleActionsStyle"
        >
          <div
            ref="capsuleInnerRef"
            class="reborn-capsule-inner"
            :class="uiClasses.capsuleInner()"
          >
            <slot
              :is-active="isActive"
              :is-expanded="isExpanded"
              :is-animating="isAnimating"
              :is-dragging="isDragging"
              :is-attracting="attractTransition"
            />
          </div>
        </div>
        <div
          v-show="isActive && divider"
          :class="uiClasses.divider()"
        >
          <slot name="divider" />
        </div>
        <!-- 触发器 -->
        <div
          ref="triggerRef"
          class="pointer-events-auto w-max shrink-0"
          :class="[{ 'touch-none': draggable }]"
          @click.stop="handleClick"
          @pointerdown="handlePointerDown"
        >
          <slot
            name="trigger"
            :is-active="isActive"
            :is-expanded="isExpanded"
            :is-animating="isAnimating"
            :is-dragging="isDragging"
            :is-attracting="attractTransition"
          >
            <div :class="uiClasses.trigger()">
              <Icon
                :name="isActive ? activeIcon : inactiveIcon"
                :class="uiClasses.icon()"
              />
            </div>
          </slot>
        </div>
      </div>
    </template>

    <!-- 默认悬浮变体模式 -->
    <template v-else>
      <!-- 悬浮操作项插槽 -->
      <div
        v-show="expandable || variant === 'circle'"
        ref="actionsRef"
        class="reborn-fab-actions-container"
        :class="[uiClasses.actions(), { 'is-active': isActive }]"
      >
        <slot
          :is-active="isActive"
          :is-expanded="isExpanded"
          :is-animating="isAnimating"
          :is-dragging="isDragging"
          :is-attracting="attractTransition"
        />
      </div>

      <!-- 主按钮触发区域 -->
      <div
        ref="triggerRef"
        class="pointer-events-auto w-max"
        :class="[{ 'touch-none': draggable }]"
        @click.stop="handleClick"
        @pointerdown="handlePointerDown"
      >
        <slot
          name="trigger"
          :is-active="isActive"
          :is-expanded="isExpanded"
          :is-animating="isAnimating"
          :is-dragging="isDragging"
          :is-attracting="attractTransition"
        >
          <div :class="uiClasses.trigger()">
            <Icon
              :name="isActive ? activeIcon : inactiveIcon"
              :class="uiClasses.icon()"
            />
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
