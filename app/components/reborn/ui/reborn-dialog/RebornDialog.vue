<script setup lang="ts">
import type { ButtonProps } from "../reborn-button/RebornButton.vue";
import { computed, nextTick, onBeforeUnmount, ref, useId, useSlots, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import theme from "./reborn-dialog.config";

/**
 * 对话框操作按钮类型
 * @description 可以是字符串（标签）、false（隐藏）或按钮属性对象
 */
type DialogActionButton = string | false | ButtonProps;

/**
 * 对话框过渡动画配置：
 * - 语义预设：scale 缩放 / slide 滑动 / fade 淡入淡出 / bounce 弹跳
 * - 也可传任意 RebornTransition 过渡名称字符串，或其属性对象（name / duration / enterFromClass 等）
 */
export type DialogTransition =
  | "scale"
  | "slide"
  | "fade"
  | "bounce"
  | (string & {})
  | Record<string, any>;

/**
 * RebornDialog UI 样式配置
 */
export interface RebornDialogUi {
  /** 触发器容器类名 */
  trigger?: string;
  /** 根容器类名 */
  root?: string;
  /** 遮罩层类名 */
  backdrop?: string;
  /** 弹窗定位壳类名 */
  shell?: string;
  /** 面板动画包裹层类名（过渡动画作用层） */
  panelWrapper?: string;
  /** 弹窗面板类名 */
  panel?: string;
  /** 头部容器类名 */
  header?: string;
  /** 头部内容容器类名 */
  headerContent?: string;
  /** 标题类名 */
  title?: string;
  /** 描述类名 */
  description?: string;
  /** 关闭按钮类名 */
  close?: string;
  /** 主体类名 */
  body?: string;
  /** 底部容器类名 */
  footer?: string;
}

/**
 * RebornDialog 属性配置（对齐 Element Plus Dialog 的属性命名）
 */
export interface RebornDialogProps {
  /** 对话框标题，也可通过 header 具名插槽传入 */
  title?: string;
  /** 标题下方的描述文字，与标题间隔 8px */
  describe?: string;
  /** describe 的旧属性名，保留以兼容既有用法；两者同传时 describe 优先 */
  description?: string;
  /** 对话框宽度，数字按 px 处理；默认走主题的 max-w 设计宽度 */
  width?: string | number;
  /** 是否全屏显示 */
  fullscreen?: boolean;
  /** 非居中形态下面板距视口顶部的距离（CSS margin-top 语义），默认 15vh */
  top?: string;
  /** 是否需要遮罩层 */
  modal?: boolean;
  /** 是否允许穿透遮罩层与背后页面交互；modal 必须为 false 才生效 */
  modalPenetrable?: boolean;
  /** 对话框自身是否插入至 body 元素上（本实现默认已挂载 body，false 时渲染在组件当前位置） */
  appendToBody?: boolean;
  /** 对话框挂载到哪个 DOM 元素（CSS 选择器或元素），会覆盖 append-to-body */
  appendTo?: string | HTMLElement;
  /** 出现时是否锁定 body 滚动 */
  lockScroll?: boolean;
  /** 打开的延时时间（毫秒） */
  openDelay?: number;
  /** 关闭的延时时间（毫秒） */
  closeDelay?: number;
  /** 是否可以通过点击遮罩关闭 */
  closeOnClickModal?: boolean;
  /** 是否可以通过按下 ESC 关闭 */
  closeOnPressEscape?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 关闭前的回调，会暂停关闭；回调内执行 done 才真正关闭 */
  beforeClose?: (done: () => void) => void;
  /** 是否启用拖拽（按住头部平移，非全屏时有效） */
  draggable?: boolean;
  /** 拖动范围是否可以超出可视区 */
  overflow?: boolean;
  /** header 与 footer 是否居中排列 */
  center?: boolean;
  /** 是否水平垂直居中对话框（false 时按 top 顶部落位） */
  alignCenter?: boolean;
  /** 关闭时是否销毁其中的元素 */
  destroyOnClose?: boolean;
  /** 自定义关闭图标名 */
  closeIcon?: string;
  /** 标题的 aria-level 属性 */
  headerAriaLevel?: string;
  /** 面板过渡动画：scale 缩放 / slide 滑动 / fade 淡入淡出 / bounce 弹跳，或 RebornTransition 过渡名 / 属性对象 */
  transition?: DialogTransition;
  /** 内容是否独立滚动（扩展属性：页头页脚固定，正文滚动） */
  scrollable?: boolean;
  /** 取消按钮配置：字符串为标签、false 隐藏、对象透传按钮属性 */
  cancelBtn?: DialogActionButton;
  /** 确认按钮配置：字符串为标签、false 隐藏、对象透传按钮属性 */
  confirmBtn?: DialogActionButton;
  /** 层级 */
  zIndex?: number;
  /** 自定义类名（作用于面板） */
  class?: any;
  /** UI 样式透传配置 */
  ui?: RebornDialogUi;
}

defineOptions({
  name: "RebornDialog",
  inheritAttrs: false,
});

const props = withDefaults(defineProps<RebornDialogProps>(), {
  title: "",
  describe: "",
  description: "",
  width: "",
  fullscreen: false,
  top: "15vh",
  modal: true,
  modalPenetrable: false,
  appendToBody: false,
  appendTo: "body",
  lockScroll: true,
  openDelay: 0,
  closeDelay: 0,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showClose: true,
  beforeClose: undefined,
  draggable: false,
  overflow: false,
  center: false,
  alignCenter: false,
  destroyOnClose: false,
  closeIcon: "lucide:x",
  headerAriaLevel: "2",
  transition: "scale",
  scrollable: false,
  cancelBtn: "取消",
  confirmBtn: "确认",
  zIndex: 2400,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 打开动作发生时触发（打开动画开始前） */
  (e: "beforeOpen"): void;
  /** 打开动画结束时触发 */
  (e: "opened"): void;
  /** 关闭动作发生时触发（关闭动画开始前） */
  (e: "beforeClose"): void;
  /** 关闭动画结束时触发 */
  (e: "closed"): void;
  /** 输入焦点聚焦在对话框内容时触发 */
  (e: "openAutoFocus"): void;
  /** 输入焦点从对话框内容失焦时触发 */
  (e: "closeAutoFocus"): void;
  /** 点击确认按钮触发（不会自动关闭，由使用方决定关闭时机） */
  (e: "confirm"): void;
  /** 点击取消按钮触发（会随后走关闭流程） */
  (e: "cancel"): void;
}>();

/** 显隐双向绑定；未绑定时组件内部自管理（trigger 插槽点击即可打开） */
const model = defineModel<boolean>({ default: undefined });

const slots = useSlots();
const b = tv(theme);

/** Teleport 内容是否存在于 DOM（destroy-on-close 为 false 时首开后常驻） */
const mounted = ref(false);
/** 一次打开生命周期是否进行中（滚动锁定 / 根层显示的依据，动画结束才熄灭） */
const active = ref(false);
/** 面板与遮罩的过渡显隐 */
const visible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const previousFocus = ref<HTMLElement | null>(null);

const titleId = `reborn-dialog-title-${useId().replace(/[^\w-]/g, "")}`;
const descriptionId = `reborn-dialog-description-${useId().replace(/[^\w-]/g, "")}`;

const dragOffset = ref({ x: 0, y: 0 });

let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let bodyLockTimer: ReturnType<typeof setTimeout> | null = null;
const initialPaddingState = { right: "", overflow: "" };

const mergedOpen = computed(() => Boolean(model.value));

/** 遮罩穿透仅在 modal=false 时生效 */
const penetrable = computed(() => !props.modal && props.modalPenetrable);

/** Teleport 目标：appendTo 优先，appendToBody 强制 body；两者均未设时默认挂 body */
const teleportTarget = computed<string | HTMLElement>(() => {
  if (props.appendToBody) {
    return "body";
  }
  return props.appendTo || "body";
});

/** 生效的描述文字：describe 优先，回退旧属性名 description */
const mergedDescribe = computed(() => props.describe || props.description);

const headerVisible = computed(() =>
  Boolean(slots.header || props.title || mergedDescribe.value),
);

function normalizeActionButton(
  value: DialogActionButton,
  defaults: ButtonProps,
): ButtonProps | null {
  if (value === false) {
    return null;
  }

  if (typeof value === "string") {
    return {
      ...defaults,
      label: value,
    };
  }

  return {
    ...defaults,
    ...(value ?? {}),
    label: value?.label ?? defaults.label,
  };
}

const normalizedCancelButton = computed(() =>
  normalizeActionButton(props.cancelBtn, {
    label: "取消",
    color: "neutral",
    variant: "outlined",
    size: "md",
    borderStyle: "solid",
  }),
);

const normalizedConfirmButton = computed(() =>
  normalizeActionButton(props.confirmBtn, {
    label: "确认",
    variant: "filled",
    size: "md",
    borderStyle: "solid",
  }),
);

const footerVisible = computed(() =>
  Boolean(slots.footer || normalizedCancelButton.value || normalizedConfirmButton.value),
);

/** width 数字按 px 处理，字符串原样透传 */
const normalizedWidth = computed(() => {
  if (props.width === "" || props.width == null) {
    return "";
  }
  return typeof props.width === "number" ? `${props.width}px` : props.width;
});

const panelStyle = computed(() => {
  const style: Record<string, string> = {};

  if (!props.fullscreen) {
    style.transform = `translate(${dragOffset.value.x}px, ${dragOffset.value.y}px)`;

    if (normalizedWidth.value) {
      style.width = normalizedWidth.value;
      style.maxWidth = "100%";
    }
  }

  return style;
});

/** 非居中且非全屏时按 top 顶部落位（margin-top 语义由壳层 padding 实现） */
const shellStyle = computed(() => {
  if (props.fullscreen || props.alignCenter) {
    return {};
  }
  return { paddingTop: props.top || "15vh", paddingBottom: "16px" };
});

const rootStyle = computed(() => ({
  zIndex: `${props.zIndex}`,
}));

/** 入场缓动曲线：快出缓收，无过冲（过冲曲线会先放大过头再缩回，观感像动画播放了两次） */
const EASE_IN_BEZIER = "cubic-bezier(0.22, 1, 0.36, 1)";
/** 离场缓动曲线：标准 material 曲线 */
const EASE_OUT_BEZIER = "cubic-bezier(0.4, 0, 0.2, 1)";
/** 入场缓动的 Tailwind 任意值类（Tailwind 只认字面量，不能由上面的常量拼出来，改动时两处要同步） */
const EASE_IN_CURVE = "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]";
/** 离场缓动的 Tailwind 任意值类（同上） */
const EASE_OUT_CURVE = "[transition-timing-function:cubic-bezier(0.4,0,0.2,1)]";

/**
 * 语义化过渡预设：scale 缩放 / slide 滑动（自上方滑入）/ fade 淡入淡出 / bounce 弹跳。
 * 全部使用显式自定义类与标准缓动，不复用共享过渡名，避免曲线过冲与时长错配；
 * bounce 入场走关键帧动画（reborn-dialog-bounce，见 theme/base.css），离场用普通缩放淡出
 */
const DIALOG_TRANSITION_PRESETS: Record<string, Record<string, any>> = {
  scale: {
    duration: { enter: 250, leave: 200 },
    enterFromClass: "opacity-0 scale-95",
    enterActiveClass: `transition-[opacity,scale] ${EASE_IN_CURVE}`,
    enterToClass: "opacity-100 scale-100",
    leaveFromClass: "opacity-100 scale-100",
    leaveActiveClass: `transition-[opacity,scale] ${EASE_OUT_CURVE}`,
    leaveToClass: "opacity-0 scale-95",
  },
  slide: {
    duration: { enter: 280, leave: 220 },
    enterFromClass: "opacity-0 -translate-y-8",
    enterActiveClass: `transition-[opacity,translate] ${EASE_IN_CURVE}`,
    enterToClass: "opacity-100 translate-y-0",
    leaveFromClass: "opacity-100 translate-y-0",
    leaveActiveClass: `transition-[opacity,translate] ${EASE_OUT_CURVE}`,
    leaveToClass: "opacity-0 -translate-y-8",
  },
  fade: {
    duration: { enter: 200, leave: 200 },
    enterFromClass: "opacity-0",
    enterActiveClass: "transition-opacity ease-out",
    enterToClass: "opacity-100",
    leaveFromClass: "opacity-100",
    leaveActiveClass: "transition-opacity ease-in",
    leaveToClass: "opacity-0",
  },
  bounce: {
    duration: { enter: 500, leave: 200 },
    // 起始形变全部交给关键帧的 both 填充，enter-from 只压透明度，避免与关键帧起点（scale 0.7）不一致产生跳帧
    enterFromClass: "opacity-0",
    enterActiveClass: "animate-[reborn-dialog-bounce_500ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
    enterToClass: "opacity-100 scale-100",
    leaveFromClass: "opacity-100 scale-100",
    leaveActiveClass: `transition-[opacity,scale] ${EASE_OUT_CURVE}`,
    leaveToClass: "opacity-0 scale-95",
  },
};

/** 面板过渡配置：语义预设优先，其次任意 RebornTransition 过渡名，对象整体透传 */
const panelTransitionProps = computed(() => {
  if (typeof props.transition === "object" && props.transition !== null) {
    return { duration: 250, ...props.transition };
  }
  const key = props.transition || "scale";
  return DIALOG_TRANSITION_PRESETS[key] ?? { name: key, duration: 250 };
});

/**
 * 遮罩淡入淡出时长：按预设逐个给定，对齐的是面板「视觉上站定」的时刻，而不是面板动画的总时长。
 *
 * 关键在于 animation-timing-function 是**逐关键帧段**生效的：bounce 的 0%→45% 这一段
 * 占 500ms 中的 225ms，用的却是过冲曲线 cubic-bezier(0.34,1.56,0.64,1)，其 y 值会越过 1，
 * 而 opacity 会被钳到 1 —— 面板大约在 90ms 就已经完全实体化，后面 400ms 只是缩放回弹。
 * 遮罩若还按面板总时长（500ms，哪怕封顶到 300ms）淡入，就会在弹窗已经站定之后继续变暗，
 * 这正是「遮罩比弹窗慢」的观感来源。所以 bounce 的遮罩必须又短又快。
 */
const BACKDROP_DURATION_PRESETS: Record<string, { enter: number; leave: number }> = {
  scale: { enter: 250, leave: 200 },
  slide: { enter: 260, leave: 220 },
  fade: { enter: 200, leave: 200 },
  bounce: { enter: 140, leave: 200 },
};

/** 遮罩时长：命中语义预设取预设值；自定义过渡名 / 属性对象则回退到跟随面板时长（入场封顶 300ms） */
const backdropDuration = computed(() => {
  const key = typeof props.transition === "string" ? props.transition || "scale" : "";
  const preset = BACKDROP_DURATION_PRESETS[key];
  if (preset) return preset;

  const d = panelTransitionProps.value.duration ?? 250;
  const enter = typeof d === "object" ? (d.enter ?? 250) : d;
  const leave = typeof d === "object" ? (d.leave ?? 200) : d;
  return { enter: Math.min(enter, 300), leave };
});

/**
 * 遮罩过渡的内联样式（时长与缓动都写在元素上，方向随 visible 切换）。
 *
 * 遮罩刻意不走 <Transition>：Vue 的过渡要等 nextFrame（双 rAF，约两帧）才切到 enter-to
 * 才开始插值，而面板 bounce 的关键帧动画在 enter-active 类挂上的那一刻（beforeEnter）
 * 就已经跑起来了，白白让遮罩晚出发两帧 —— 这就是「显示顺序」上的落后。
 * 改成遮罩节点常驻 DOM、只靠 visible 翻透明度后，类名变更与面板动画在同一帧生效，起跑线才真正对齐。
 */
const backdropStyle = computed(() => ({
  transitionDuration: `${visible.value ? backdropDuration.value.enter : backdropDuration.value.leave}ms`,
  transitionTimingFunction: visible.value ? EASE_IN_BEZIER : EASE_OUT_BEZIER,
}));

const ui = computed(() => {
  const styles = b({
    modal: props.modal,
    penetrable: penetrable.value,
    scrollable: props.scrollable,
    fullscreen: props.fullscreen,
    draggable: props.draggable && !props.fullscreen,
    center: props.center,
    alignCenter: props.alignCenter,
  });

  return {
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, props.ui?.trigger) }),
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.ui?.root) }),
    backdrop: (opts?: { class?: any }) =>
      styles.backdrop({ class: cn(opts?.class, props.ui?.backdrop) }),
    shell: (opts?: { class?: any }) => styles.shell({ class: cn(opts?.class, props.ui?.shell) }),
    panelWrapper: (opts?: { class?: any }) =>
      styles.panelWrapper({ class: cn(opts?.class, props.ui?.panelWrapper) }),
    panel: (opts?: { class?: any }) =>
      styles.panel({ class: cn(opts?.class, props.class, props.ui?.panel) }),
    header: (opts?: { class?: any }) => styles.header({ class: cn(opts?.class, props.ui?.header) }),
    headerContent: (opts?: { class?: any }) =>
      styles.headerContent({ class: cn(opts?.class, props.ui?.headerContent) }),
    title: (opts?: { class?: any }) => styles.title({ class: cn(opts?.class, props.ui?.title) }),
    description: (opts?: { class?: any }) =>
      styles.description({ class: cn(opts?.class, props.ui?.description) }),
    close: (opts?: { class?: any }) => styles.close({ class: cn(opts?.class, props.ui?.close) }),
    body: (opts?: { class?: any }) => styles.body({ class: cn(opts?.class, props.ui?.body) }),
    footer: (opts?: { class?: any }) => styles.footer({ class: cn(opts?.class, props.ui?.footer) }),
  };
});

function clearTimers() {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }

  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function rememberActiveElement(element?: HTMLElement | null) {
  if (element) {
    previousFocus.value = element;
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (activeElement && !panelRef.value?.contains(activeElement)) {
    previousFocus.value = activeElement;
  }
}

function openDialog() {
  rememberActiveElement(triggerRef.value);
  model.value = true;
}

function doOpen() {
  clearTimers();
  dragOffset.value = { x: 0, y: 0 };
  mounted.value = true;
  active.value = true;
  emit("beforeOpen");

  // 隔一帧再起动画：让 Teleport 挂载与滚动锁引发的整页重排先落定，
  // 避免昂贵的首次布局挤进动画首帧造成开场卡停
  nextTick(() => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        visible.value = true;
      });
    } else {
      visible.value = true;
    }
  });
}

function doClose() {
  clearTimers();
  emit("beforeClose");
  visible.value = false;
}

/** 关闭请求统一入口：beforeClose 回调可拦截，done 执行才真正关闭 */
function requestClose() {
  const done = () => {
    model.value = false;
  };

  if (props.beforeClose) {
    props.beforeClose(done);
    return;
  }

  done();
}

/** 关闭对话框（对齐 Element Plus 的 handleClose expose，走 beforeClose 拦截） */
function handleClose() {
  requestClose();
}

/** 重置拖拽产生的位置偏移 */
function resetPosition() {
  dragOffset.value = { x: 0, y: 0 };
}

function onTriggerClick() {
  openDialog();
}

function onBackdropClick() {
  if (!props.closeOnClickModal) {
    return;
  }

  requestClose();
}

function onCloseClick() {
  requestClose();
}

function onCancelClick() {
  emit("cancel");
  requestClose();
}

function onConfirmClick() {
  emit("confirm");
}

function onOpened() {
  nextTick(() => {
    panelRef.value?.focus();
    emit("openAutoFocus");
    emit("opened");
  });
}

function onClosed() {
  if (mergedOpen.value) {
    return;
  }

  active.value = false;
  dragOffset.value = { x: 0, y: 0 };

  // destroy-on-close 时卸载 Teleport 内容，否则保留 DOM 供下次直接复用
  if (props.destroyOnClose) {
    mounted.value = false;
  }

  const focusTarget = previousFocus.value;
  if (focusTarget?.isConnected) {
    focusTarget.focus();
  }

  emit("closeAutoFocus");
  emit("closed");
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && visible.value && props.closeOnPressEscape) {
    requestClose();
  }
}

function onHeaderMouseDown(event: MouseEvent) {
  if (!props.draggable || props.fullscreen || event.button !== 0) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target?.closest("button, a, input, textarea, select")) {
    return;
  }

  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = dragOffset.value.x;
  const initialY = dragOffset.value.y;

  // overflow=false 时把拖拽限制在可视区内：以面板当前矩形反推零偏移基准位，再算允许的偏移区间
  const rect = panelRef.value?.getBoundingClientRect();
  const baseLeft = rect ? rect.left - initialX : 0;
  const baseTop = rect ? rect.top - initialY : 0;
  const baseWidth = rect?.width ?? 0;
  const baseHeight = rect?.height ?? 0;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));

  const onMove = (moveEvent: MouseEvent) => {
    let nextX = initialX + moveEvent.clientX - startX;
    let nextY = initialY + moveEvent.clientY - startY;

    if (!props.overflow && rect) {
      nextX = clamp(nextX, -baseLeft, window.innerWidth - baseWidth - baseLeft);
      nextY = clamp(nextY, -baseTop, window.innerHeight - baseHeight - baseTop);
    }

    dragOffset.value = { x: nextX, y: nextY };
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

watch(
  mergedOpen,
  (value) => {
    clearTimers();

    if (value) {
      rememberActiveElement();
      if (props.openDelay > 0) {
        openTimer = setTimeout(() => doOpen(), props.openDelay);
      } else {
        doOpen();
      }
      return;
    }

    if (!active.value) {
      return;
    }

    if (props.closeDelay > 0) {
      closeTimer = setTimeout(() => doClose(), props.closeDelay);
    } else {
      doClose();
    }
  },
  { immediate: true },
);

/** 本实例是否持有滚动锁计数（防止未加锁实例误减别的对话框的计数） */
let hasScrollLock = false;

/** 获取一份滚动锁：首个持有者写入样式，其余仅累加计数 */
function acquireScrollLock() {
  if (typeof document === "undefined" || hasScrollLock) {
    return;
  }

  const body = document.body;
  const html = document.documentElement;

  if (!body.hasAttribute("data-scroll-locked")) {
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    initialPaddingState.right = body.style.paddingRight;
    initialPaddingState.overflow = body.style.overflow;
    // 不锁定 html.style.overflow，避免破坏 Nuxt 中 position: sticky 的侧边栏布局

    if (scrollbarWidth > 0) {
      const computedPadding = window.getComputedStyle(body).paddingRight;
      const currentPadding = Number.parseFloat(computedPadding) || 0;
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      body.style.setProperty("--reborn-scrollbar-width", `${scrollbarWidth}px`);
    }
    body.style.overflow = "hidden";
    body.setAttribute("data-scroll-locked", "1");
  } else {
    const lockCount = Number.parseInt(body.getAttribute("data-scroll-locked") || "1", 10);
    body.setAttribute("data-scroll-locked", `${lockCount + 1}`);
  }

  hasScrollLock = true;
}

/** 归还本实例持有的滚动锁：计数归零时恢复样式 */
function releaseScrollLock() {
  if (typeof document === "undefined" || !hasScrollLock) {
    return;
  }

  hasScrollLock = false;
  const body = document.body;
  if (!body.hasAttribute("data-scroll-locked")) {
    return;
  }

  const lockCount = Number.parseInt(body.getAttribute("data-scroll-locked") || "1", 10) - 1;
  if (lockCount <= 0) {
    body.style.paddingRight = initialPaddingState.right;
    body.style.overflow = initialPaddingState.overflow;
    body.style.removeProperty("--reborn-scrollbar-width");
    body.removeAttribute("data-scroll-locked");
  } else {
    body.setAttribute("data-scroll-locked", `${lockCount}`);
  }
}

watch(
  () => active.value && props.lockScroll,
  (locked) => {
    if (typeof document === "undefined") {
      return;
    }

    if (bodyLockTimer) {
      clearTimeout(bodyLockTimer);
      bodyLockTimer = null;
    }

    if (locked) {
      acquireScrollLock();
      return;
    }

    if (!hasScrollLock) {
      return;
    }

    // 延迟释放：让相邻弹窗切换时不至于闪动滚动条
    bodyLockTimer = setTimeout(() => {
      bodyLockTimer = null;
      releaseScrollLock();
    }, 200);
  },
  { immediate: true },
);

watch(
  () => visible.value,
  (value) => {
    if (typeof document === "undefined") {
      return;
    }

    if (value) {
      document.addEventListener("keydown", onKeydown);
      return;
    }

    document.removeEventListener("keydown", onKeydown);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTimers();

  if (bodyLockTimer) {
    clearTimeout(bodyLockTimer);
    bodyLockTimer = null;
  }

  if (typeof document !== "undefined") {
    document.removeEventListener("keydown", onKeydown);
    // 无论锁在持有中还是等待延迟释放，卸载时都立即归还，避免计数泄漏
    releaseScrollLock();
  }
});

defineExpose({
  /** 打开对话框 */
  open: openDialog,
  /** 关闭对话框（走 beforeClose 拦截流程） */
  close: handleClose,
  /** 关闭对话框（对齐 Element Plus 的同名 expose） */
  handleClose,
  /** 重置拖拽位置 */
  resetPosition,
});
</script>

<template>
  <div v-if="$slots.trigger" ref="triggerRef" :class="ui.trigger()" @click="onTriggerClick">
    <slot name="trigger" :open="mergedOpen" />
  </div>

  <Teleport :to="teleportTarget">
    <div
      v-if="mounted" v-show="active" :class="ui.root()" :style="rootStyle"
      @wheel="(e) => !props.scrollable && !penetrable && e.preventDefault()"
    >
      <!-- 遮罩常驻 DOM，只翻透明度，保证与面板动画同帧起跑（缘由见 backdropStyle 注释） -->
      <div
        v-if="props.modal || !penetrable" :class="ui.backdrop({ class: visible ? 'opacity-100' : 'opacity-0' })"
        :style="backdropStyle" @click="onBackdropClick" @touchmove.prevent
      />

      <!-- 定位壳静态不动画（避免整屏图层参与缩放）；点击面板外空白等同点击遮罩 -->
      <div :class="ui.shell()" :style="shellStyle" @click.self="onBackdropClick">
        <RebornTransition
          :show="visible" v-bind="panelTransitionProps" :appear="true"
          :destroy="props.destroyOnClose" :custom-class="cn(ui.panelWrapper(), 'transform-gpu')"
          @after-enter="onOpened" @after-leave="onClosed"
        >
          <div
            ref="panelRef" :class="cn(ui.panel(), 'will-change-transform')" :style="panelStyle" tabindex="-1"
            role="dialog" :aria-modal="true" :aria-labelledby="props.title && !$slots.header ? titleId : undefined"
            :aria-describedby="mergedDescribe && !$slots.header ? descriptionId : undefined" @click.stop
          >
            <div v-if="headerVisible" :class="ui.header()" @mousedown="onHeaderMouseDown">
              <div :class="ui.headerContent()">
                <slot name="header" :open="mergedOpen" :close="handleClose">
                  <span
                    v-if="props.title" :id="titleId" role="heading" :aria-level="props.headerAriaLevel"
                    :class="ui.title()"
                  >
                    {{ props.title }}
                  </span>
                  <p v-if="mergedDescribe" :id="descriptionId" :class="ui.description()">
                    {{ mergedDescribe }}
                  </p>
                </slot>
              </div>

              <Icon v-if="props.showClose" :class="ui.close()" :name="props.closeIcon" @click="onCloseClick" />
            </div>

            <!-- 未提供 default 插槽时不渲染正文区，避免面板 gap 产生空段间距 -->
            <div v-if="$slots.default" :class="ui.body()">
              <slot :open="mergedOpen" :close="handleClose" />
            </div>

            <div v-if="footerVisible" :class="ui.footer()">
              <slot
                name="footer" :open="mergedOpen" :close="handleClose" :confirm="onConfirmClick"
                :cancel="onCancelClick"
              >
                <RebornButton v-if="normalizedCancelButton" v-bind="normalizedCancelButton" @click="onCancelClick" />
                <RebornButton v-if="normalizedConfirmButton" v-bind="normalizedConfirmButton" @click="onConfirmClick" />
              </slot>
            </div>
          </div>
        </RebornTransition>
      </div>
    </div>
  </Teleport>
</template>
