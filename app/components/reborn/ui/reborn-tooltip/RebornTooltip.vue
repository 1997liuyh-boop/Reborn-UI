<script setup lang="ts">
import type {CSSProperties} from 'vue';
import type { TooltipUI } from './reborn-tooltip.config';
import type { FloatingPoint, FloatingSize } from '~/lib/floating';
import type { Placement, PlacementAlign, PlacementSide } from '~/lib/placement';
import {
  computed,

  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  shallowRef,
  useId,
  useSlots,
  useTemplateRef,
  watch
} from 'vue';
import { useFloatingHost } from '~/composables/useFloatingHost';
import {
  FLOATING_PANEL_RADIUS,
  getArrowCenter,
  resolveFloatingPosition,
} from '~/lib/floating';
import { FLOATING_ARROW_DEPTH, FLOATING_ARROW_LENGTH } from "~/lib/floating-arrow";
import { resolvePlacement } from '~/lib/placement';
import { cn } from '~/lib/utils';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import { rebornTooltip } from './reborn-tooltip.config';

defineOptions({ name: 'RebornTooltip', inheritAttrs: false });

const props = withDefaults(defineProps<RebornTooltipProps>(), {
  content: '',
  rawContent: false,
  virtualTriggering: false,
  virtualRef: null,
  title: undefined,
  placement: 'bottom',
  arrow: true,
  autoAdjustOverflow: true,
  defaultOpen: false,
  destroyOnHidden: false,
  fresh: false,
  openDelay: 100,
  closeDelay: 100,
  trigger: 'hover',
  disabled: false,
});
/** 事件定义 */
const emit = defineEmits<{
  /** 提示层显示后触发（经打开延时） */
  (e: 'open'): void;
  /** 提示层关闭后触发（经关闭延时） */
  (e: 'close'): void;
  /** 显示隐藏变化时触发 */
  (e: 'openChange', open: boolean): void;
}>();
/** 方位取值统一取自 ~/lib/placement，与 reborn-popconfirm 等浮层组件保持完全一致 */
type TooltipSide = PlacementSide;
type TooltipAlign = PlacementAlign;
type TooltipPlacement = Placement;
/** 触发行为 */
type TooltipTrigger = 'hover' | 'focus' | 'click' | 'contextMenu';

interface RebornTooltipProps {
  /** 提示内容 */
  content?: string;
  /** 将文案作为 HTML 渲染；仅传入可信或已净化的内容 */
  rawContent?: boolean;
  /** 使用外部元素触发和定位，不渲染默认触发插槽 */
  virtualTriggering?: boolean;
  /** 虚拟触发元素；切换时迁移事件和 ARIA 关联 */
  virtualRef?: HTMLElement | null;
  /** 提示文字。显式传 null 或空字符串可禁用提示；未传时回落到 content */
  title?: string | null;
  /** 出现方向与对齐方式 */
  placement?: TooltipPlacement;
  /** 自定义背景颜色，面板与箭头同步着色 */
  color?: string;
  /** 箭头显隐；对象形式的 pointAtCenter 让箭头指向触发元素中心而非对齐端 */
  arrow?: boolean | { pointAtCenter?: boolean };
  /** 主轴放不下时自动翻转到对侧 */
  autoAdjustOverflow?: boolean;
  /** 非受控模式下的初始显隐 */
  defaultOpen?: boolean;
  /** 关闭后是否销毁提示层 DOM；默认隐藏保留 */
  destroyOnHidden?: boolean;
  /** 关闭期间文案是否保持实时更新；默认关闭时缓存最后一次显示的文案（仅对 title/content 生效，content 插槽始终实时） */
  fresh?: boolean;
  /** 浮层渲染父节点，默认渲染到 body 上 */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** 打开延时（毫秒） */
  openDelay?: number;
  /** 关闭延时（毫秒） */
  closeDelay?: number;
  /** 鼠标移入后延时多少才显示，单位：秒；传入时优先于 openDelay */
  mouseEnterDelay?: number;
  /** 鼠标移出后延时多少才隐藏，单位：秒；传入时优先于 closeDelay */
  mouseLeaveDelay?: number;
  /** 触发行为，可传数组组合多种触发方式 */
  trigger?: TooltipTrigger | TooltipTrigger[];
  /** 提示层 z-index，未传时用样式默认值 */
  zIndex?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 追加到根节点（触发器外层容器）的自定义类名 */
  class?: any;
  /** 按语义化结构覆盖各节点样式，键位见文档「自定义样式（ui）」 */
  ui?: TooltipUI;
}

/** v-model:open 双向绑定 */
const openModel = defineModel<boolean>('open', { default: undefined });

/** 生成唯一 ID 用于 ARIA 关联 */
const tooltipId = `tooltip-${useId()}`;

/** 箭头根部嵌入 2px，尖端与触发器保持 4px 可见间距。 */
const ARROW_OVERLAP = 2;
const TRIGGER_GAP = 4;

const isMounted = shallowRef(false);

const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef');
const triggerRef = useTemplateRef<HTMLElement>('triggerRef');
/** 普通触发器与外部触发器共用定位和容器逻辑 */
const anchorRef = computed(() => props.virtualTriggering ? props.virtualRef : triggerRef.value);
const contentRefComponent = useTemplateRef<{ el?: HTMLElement | null }>('contentRefComponent');
const contentWrapperRef = computed(() => contentRefComponent.value?.el ?? undefined);
const contentRef = useTemplateRef<HTMLElement>('contentRef');

const isVisible = shallowRef(false);
/** 定位样式与箭头样式每次都整体替换，用 shallowRef */
const contentStyle = shallowRef<CSSProperties>({ top: '0px', left: '0px' });
const arrowStyle = shallowRef<CSSProperties>({});

const slots = useSlots();
/**
 * content 插槽是否存在。useSlots() 在生产构建下不是响应式的，放进 computed 只会算一次；
 * 父级用 v-if 增删插槽时会强制本组件更新，onBeforeUpdate 在重渲染前同步一次，本次渲染即可读到新值
 */
const hasContentSlot = shallowRef(!!slots.content);
onBeforeUpdate(() => {
  hasContentSlot.value = !!slots.content;
});

let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;

/** 解析 placement（兼容驼峰别名），拆分为方向与对齐方式 */
const placementState = computed(() => resolvePlacement(props.placement));

/** 实际渲染方向：autoAdjustOverflow 翻转后可能与 placement 声明的方向不同 */
const actualSide = shallowRef<TooltipSide>('bottom');
watch(placementState, (state) => { actualSide.value = state.side; }, { immediate: true });

/** 各节点样式：主题槽位 + ui 覆盖，根节点再并入 class prop */
const uiOverrides = computed(() => props.ui || {});
const styles = computed(() => {
  const theme = rebornTooltip({ side: actualSide.value });
  const slot = (key: keyof TooltipUI) => (opts?: { class?: any }) =>
    theme[key]({ class: cn(opts?.class, uiOverrides.value[key]) });
  return {
    wrapper: () => theme.wrapper({ class: cn(uiOverrides.value.wrapper, props.class) }),
    trigger: slot('trigger'),
    contentWrapper: slot('contentWrapper'),
    content: slot('content'),
    arrow: slot('arrow'),
  };
});

/** 箭头显隐与指向模式归一化 */
const showArrow = computed(() => props.arrow !== false);
const pointAtCenter = computed(
  () => typeof props.arrow === 'object' && props.arrow !== null && !!props.arrow.pointAtCenter,
);

/** 触发行为集合 */
const triggerActions = computed<TooltipTrigger[]>(() =>
  Array.isArray(props.trigger) ? props.trigger : [props.trigger],
);
const hasTrigger = (action: TooltipTrigger) => triggerActions.value.includes(action);

/** 打开/关闭延时（毫秒）：秒级的 mouseEnterDelay/mouseLeaveDelay 传入时优先 */
const enterDelayMs = computed(() =>
  props.mouseEnterDelay != null ? props.mouseEnterDelay * 1000 : props.openDelay,
);
const leaveDelayMs = computed(() =>
  props.mouseLeaveDelay != null ? props.mouseLeaveDelay * 1000 : props.closeDelay,
);

/** 实时文案：title 显式传值（含 null/空串禁用）优先，未传回落 content */
const liveText = computed(() => (props.title === undefined ? props.content : (props.title ?? '')));

/**
 * fresh=false（默认）时关闭期间冻结文案：destroyOnHidden=false 的场景下 DOM 保留，
 * 冻结可避免隐藏期间外部数据变化引起提示层内容抖动；fresh=true 则始终实时
 */
const frozenText = shallowRef('');
watch(
  [isVisible, liveText],
  ([visible, text]) => {
    if (visible || props.fresh) frozenText.value = text;
  },
  { immediate: true },
);
const displayText = computed(() => (isVisible.value || props.fresh ? liveText.value : frozenText.value));

const shouldRender = computed(
  () => isVisible.value && !props.disabled && (Boolean(liveText.value) || hasContentSlot.value),
);

/** 是否有内容可显示；title 为 null 或空串时视为禁用 */
const hasContent = computed(() => Boolean(liveText.value) || hasContentSlot.value);

/**
 * 悬停能看到提示时，触发区显示帮助光标。点击、右键触发的浮层语义是「操作」而非「说明」，不加；
 * 插槽里自带光标的交互元素（按钮、链接）保持它们自己的光标
 */
const helpCursor = computed(() => hasTrigger('hover') && !props.disabled && hasContent.value);

/** 浮层挂载目标：getPopupContainer 优先，默认 body */
const popupTarget = computed<HTMLElement | string>(() => {
  if (!isMounted.value) return 'body';
  if (props.getPopupContainer && anchorRef.value) {
    try {
      return props.getPopupContainer(anchorRef.value) ?? document.body;
    } catch {
      return document.body;
    }
  }
  return document.body;
});

/** 定位样式 + 可选 zIndex 覆盖 */
const popupStyle = computed(() =>
  props.zIndex != null
    ? [contentStyle.value, { zIndex: String(props.zIndex) }]
    : contentStyle.value,
);

/** 面板间距包含箭头露出高度，带箭头和无箭头时的可见间隙均为 4px。 */
const getOffset = () => TRIGGER_GAP + (showArrow.value ? FLOATING_ARROW_DEPTH - ARROW_OVERLAP : 0);

/** 清理显隐定时器，避免快速移入移出时状态错乱 */
const clearTimers = () => {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }

  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

/** 上下方向按对齐端或 pointAtCenter 定位，左右方向始终指向触发器的高度中心。 */
const syncArrowPosition = (
  triggerRect: DOMRect,
  contentRect: FloatingSize,
  position: FloatingPoint,
  side: TooltipSide,
  align: TooltipAlign,
) => {
  if (!showArrow.value) {
    arrowStyle.value = {};
    return;
  }

  const halfThickness = FLOATING_ARROW_DEPTH / 2;
  const length = FLOATING_ARROW_LENGTH;
  const halfLength = length / 2;
  // 根部内嵌面板，遮住曲线两端平直边并消除接缝。
  const overlap = ARROW_OVERLAP;
  // 对齐端内缩量为圆角加半个底边，钳制与极小面板的兜底由 getArrowCenter 统一处理
  const inset = FLOATING_PANEL_RADIUS + halfLength;

  let centerX: number;
  let centerY: number;

  if (side === 'top' || side === 'bottom') {
    centerX = getArrowCenter({
      panelStart: position.left,
      panelExtent: contentRect.width,
      triggerStart: triggerRect.left,
      triggerExtent: triggerRect.width,
      align,
      inset,
      pointAtCenter: pointAtCenter.value,
    });
    if (side === 'top') {
      // 面板在触发器上方：箭头贴面板底边，尖端向下
      centerY = contentRect.height + halfThickness - overlap;
    } else {
      // 面板在触发器下方：箭头贴面板顶边，尖端向上
      centerY = -halfThickness + overlap;
    }
  } else {
    centerY = getArrowCenter({
      panelStart: position.top,
      panelExtent: contentRect.height,
      triggerStart: triggerRect.top,
      triggerExtent: triggerRect.height,
      align,
      // 侧向只预留半个底边，避免固定内缩量把矮触发器的中心挤偏。
      inset: halfLength,
      pointAtCenter: true,
    });
    if (side === 'left') {
      // 面板在触发器左侧：箭头贴面板右边，尖端向右（SVG 原始方向）
      centerX = contentRect.width + halfThickness - overlap;
    } else {
      // 面板在触发器右侧：箭头贴面板左边，尖端向左
      centerX = -halfThickness + overlap;
    }
  }

  // 按实际方向设置布局盒，长短边始终保持 2.5:1。
  const vertical = side === 'top' || side === 'bottom';
  arrowStyle.value = {
    left: `${centerX - (vertical ? halfLength : halfThickness)}px`,
    top: `${centerY - (vertical ? halfThickness : halfLength)}px`,
  };
};

/** 同步提示层位置与箭头位置 */
const updatePosition = (el?: Element) => {
  const currentContent = el ?? contentWrapperRef.value;
  if (!shouldRender.value || !anchorRef.value || !currentContent) {
    return;
  }

  const htmlEl = currentContent as HTMLElement;
  const triggerRect = anchorRef.value.getBoundingClientRect();
  // offsetWidth/offsetHeight 不受 CSS transform（如 zoom-in 动画的 scale-90）影响，
  // 避免在 onBeforeEnter 期间测量到缩放后的错误尺寸
  const contentRect: FloatingSize = { width: htmlEl.offsetWidth, height: htmlEl.offsetHeight };
  const { side, align } = placementState.value;

  const { side: usedSide, position: nextPosition } = resolveFloatingPosition({
    triggerRect,
    size: contentRect,
    side,
    align,
    offset: getOffset(),
    autoAdjustOverflow: props.autoAdjustOverflow,
  });

  actualSide.value = usedSide;
  contentStyle.value = {
    top: `${nextPosition.top}px`,
    left: `${nextPosition.left}px`,
  };
  syncArrowPosition(triggerRect, contentRect, nextPosition, usedSide, align);
};

const onBeforeEnter = (el: Element) => {
  updatePosition(el);
};

const onEnter = (el: Element) => {
  updatePosition(el);
};

/** 通过动画帧节流位置更新，减少滚动时的抖动 */
const syncPosition = () => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  rafId = window.requestAnimationFrame(() => {
    rafId = null;
    updatePosition();
  });
};

/** 统一的显隐入口：同步 v-model、事件与各类监听 */
const setOpen = (value: boolean) => {
  if (value && (props.disabled || !hasContent.value || (props.virtualTriggering && !anchorRef.value?.isConnected))) return;
  if (isVisible.value === value) return;

  isVisible.value = value;
  if (openModel.value !== undefined) {
    openModel.value = value;
  }

  if (value) {
    bindWindowEvents();
    bindKeyboardEvent();
    bindOutsideClose();
    emit('open');
  } else {
    unbindWindowEvents();
    unbindKeyboardEvent();
    unbindOutsideClose();
    emit('close');
  }
  emit('openChange', value);
};

// 所在弹窗或抽屉关闭时一并收起，并取消尚未到点的显隐定时器
useFloatingHost({ open: () => isVisible.value, onHidden: () => { clearTimers(); setOpen(false); } });

/** 经延时打开；delay<=0 时立即生效 */
const requestOpen = (delay: number) => {
  if (props.disabled || !hasContent.value || (props.virtualTriggering && !anchorRef.value?.isConnected)) {
    return;
  }

  clearTimers();
  if (delay <= 0) {
    setOpen(true);
  } else {
    openTimer = setTimeout(() => setOpen(true), delay);
  }
};

/** 经延时关闭；delay<=0 时立即生效 */
const requestClose = (delay: number) => {
  clearTimers();
  if (delay <= 0) {
    setOpen(false);
  } else {
    closeTimer = setTimeout(() => setOpen(false), delay);
  }
};

/** 打开提示层（走鼠标延时，供 expose 与 hover 触发使用） */
const openTooltip = () => requestOpen(enterDelayMs.value);

/** 关闭提示层（走鼠标延时，供 expose 与 hover 触发使用） */
const closeTooltip = () => requestClose(leaveDelayMs.value);

/** hover 触发 */
const handleMouseEnter = () => {
  if (hasTrigger('hover')) openTooltip();
};
const handleMouseLeave = () => {
  if (hasTrigger('hover')) closeTooltip();
};

/** focus 触发 */
const handleFocusIn = () => {
  if (hasTrigger('focus')) requestOpen(0);
};
const handleFocusOut = () => {
  if (hasTrigger('focus')) requestClose(0);
};

/** click 触发：点击切换显隐 */
const handleClick = () => {
  if (!hasTrigger('click')) return;
  if (isVisible.value) {
    requestClose(0);
  } else {
    requestOpen(0);
  }
};

/** contextMenu 触发：右键打开并拦截系统菜单 */
const handleContextMenu = (e: MouseEvent) => {
  if (!hasTrigger('contextMenu')) return;
  e.preventDefault();
  requestOpen(0);
};

/** click/contextMenu 打开后，点击触发器与提示层以外区域关闭 */
const handleDocumentPointerDown = (e: MouseEvent) => {
  const target = e.target as Node | null;
  if (!target) return;
  if (wrapperRef.value?.contains(target)) return;
  if (anchorRef.value?.contains(target)) return;
  if (contentWrapperRef.value?.contains(target)) return;
  requestClose(0);
};

function bindOutsideClose() {
  if (typeof window === 'undefined') return;
  if (hasTrigger('click') || hasTrigger('contextMenu')) {
    document.addEventListener('mousedown', handleDocumentPointerDown, true);
  }
}

function unbindOutsideClose() {
  if (typeof window === 'undefined') return;
  document.removeEventListener('mousedown', handleDocumentPointerDown, true);
}

/** 在显示期间监听窗口变化，保持定位实时更新 */
function bindWindowEvents() {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('resize', syncPosition);
  window.addEventListener('scroll', syncPosition, true);
}

/** 清理窗口监听，避免重复绑定 */
function unbindWindowEvents() {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('resize', syncPosition);
  window.removeEventListener('scroll', syncPosition, true);
}

/** 键盘事件处理 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isVisible.value) {
    closeTooltip();
  }
};

/** 绑定键盘事件 */
function bindKeyboardEvent() {
  if (typeof window === 'undefined') {
    return;
  }
  window.addEventListener('keydown', handleKeydown);
}

/** 解绑键盘事件 */
function unbindKeyboardEvent() {
  if (typeof window === 'undefined') {
    return;
  }
  window.removeEventListener('keydown', handleKeydown);
}

/** 外部触发元素变化时迁移监听；单例切换锚点保持当前显隐状态 */
watch(
  [isMounted, () => props.virtualTriggering, () => props.virtualRef],
  ([mounted, virtual, element], previous, onCleanup) => {
    if (!mounted) return;
    clearTimers();
    if (virtual) {
      if (!element?.isConnected) {
        setOpen(false);
        return;
      }
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.addEventListener('focusin', handleFocusIn);
      element.addEventListener('focusout', handleFocusOut);
      element.addEventListener('click', handleClick);
      element.addEventListener('contextmenu', handleContextMenu);
      onCleanup(() => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('focusin', handleFocusIn);
        element.removeEventListener('focusout', handleFocusOut);
        element.removeEventListener('click', handleClick);
        element.removeEventListener('contextmenu', handleContextMenu);
      });
    }
    // 同轮失焦再聚焦可能让父级 open 保持 true，需要在锚点变化后重新同步
    if (openModel.value === true && !isVisible.value) setOpen(true);
    if (shouldRender.value) nextTick(updatePosition);
  },
  { flush: 'post' },
);

/** 只增删自己的描述 ID，保留触发元素已有的 ARIA 描述 */
watch(
  [shouldRender, () => props.virtualTriggering, () => props.virtualRef],
  ([visible, virtual, element], previous, onCleanup) => {
    if (!visible || !virtual || !element?.isConnected) return;
    const hadDescription = element.hasAttribute('aria-describedby');
    const descriptions = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    const added = !descriptions.includes(tooltipId);
    if (added) element.setAttribute('aria-describedby', [...descriptions, tooltipId].join(' '));

    // 模板 ref 置空会触发上方监听，直接移除 DOM 的场景由观察器兜底
    const observer = new MutationObserver(() => {
      if (!element.isConnected) {
        clearTimers();
        setOpen(false);
      }
    });
    observer.observe(element.ownerDocument.documentElement, { childList: true, subtree: true });
    onCleanup(() => {
      observer.disconnect();
      if (!added) return;
      const remaining = (element.getAttribute('aria-describedby') || '').split(/\s+/)
        .filter(id => id && id !== tooltipId).join(' ');
      if (remaining || hadDescription) element.setAttribute('aria-describedby', remaining);
      else element.removeAttribute('aria-describedby');
    });
  },
  { flush: 'post' },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      clearTimers();
      setOpen(false);
    }
  },
);

watch(liveText, (text) => {
  if (!text && !hasContentSlot.value) {
    clearTimers();
    setOpen(false);
  }
});

watch(
  () => [props.placement, props.arrow, props.rawContent, liveText.value] as const,
  () => {
    if (shouldRender.value) {
      nextTick(updatePosition);
    }
  },
);

watch(isVisible, (visible) => {
  // 关闭时不清空 arrowStyle：离场动画期间 DOM 仍可见，
  // 清空会让箭头失去定位、跳回面板背后（下次打开前会重算）
  if (!visible) {
    return;
  }

  nextTick(updatePosition);
});

/** 监听 v-model:open 变化，同步内部状态 */
watch(openModel, (value) => {
  if (value === true && !isVisible.value) {
    clearTimers();
    setOpen(true);
  } else if (value === false && isVisible.value) {
    clearTimers();
    setOpen(false);
  }
});

/** 暴露方法供外部调用 */
defineExpose({
  /** 手动打开提示层（仍受 disabled 与打开延时约束，无内容时不生效） */
  open: openTooltip,
  /** 手动关闭提示层（经关闭延时后隐藏） */
  close: closeTooltip,
});

onMounted(() => {
  isMounted.value = true;

  // defaultOpen（非受控）或初始受控值为 true 时，挂载后立即展示
  const shouldOpenInitially =
    openModel.value === true || (openModel.value === undefined && props.defaultOpen);
  if (shouldOpenInitially && !props.disabled && hasContent.value) {
    nextTick(() => setOpen(true));
  }
});

onBeforeUnmount(() => {
  clearTimers();
  unbindWindowEvents();
  unbindKeyboardEvent();
  unbindOutsideClose();

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});
</script>

<template>
  <span
    v-if="!virtualTriggering" ref="wrapperRef" v-bind="$attrs" :class="styles.wrapper()" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn" @focusout="handleFocusOut" @click="handleClick" @contextmenu="handleContextMenu"
  >
    <span ref="triggerRef" :class="styles.trigger({ class: helpCursor && 'cursor-help' })" :aria-describedby="shouldRender ? tooltipId : undefined">
      <slot />
    </span>
  </span>

  <Teleport :to="popupTarget" :disabled="!isMounted">
    <RebornTransition
      ref="contentRefComponent" :show="shouldRender" name="fade" :destroy="destroyOnHidden"
      lazy-render :custom-class="styles.contentWrapper()" :custom-style="popupStyle" @before-enter="onBeforeEnter"
      @enter="onEnter" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave"
    >
      <div
        :id="tooltipId" ref="contentRef" :class="styles.content()"
        :style="props.color ? { backgroundColor: props.color, color: '#fff' } : undefined" role="tooltip"
      >
        <slot name="content">
          <span v-if="rawContent" v-html="displayText" />
          <template v-else>{{ displayText }}</template>
        </slot>
      </div>
      <!-- 曲线轮廓与 Popover、下拉浮层共用，背景色跟随面板。 -->
      <span
        v-if="showArrow" :class="styles.arrow()" :style="[arrowStyle, props.color ? { backgroundColor: props.color } : null]"
        data-floating-arrow aria-hidden="true"
      />
    </RebornTransition>
  </Teleport>
</template>
