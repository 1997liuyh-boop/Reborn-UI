<script setup lang="ts">
import type {CSSProperties} from 'vue';
import {
  computed,
  
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useSlots, watch 
} from 'vue';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import { rebornTooltip } from './reborn-tooltip.config';

defineOptions({ name: 'RebornTooltip' });

const props = withDefaults(defineProps<RebornTooltipProps>(), {
  content: '',
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
type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
type TooltipAlign = 'center' | 'start' | 'end';
type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';
/** 驼峰风格的方位命名，作为 TooltipPlacement 的等价别名 */
type TooltipPlacementAlias =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom';
/** 触发行为 */
type TooltipTrigger = 'hover' | 'focus' | 'click' | 'contextMenu';

interface RebornTooltipProps {
  /** 提示内容 */
  content?: string;
  /** 提示文字。显式传 null 或空字符串可禁用提示；未传时回落到 content */
  title?: string | null;
  /** 出现方向与对齐方式，同时接受驼峰命名别名（topLeft 等） */
  placement?: TooltipPlacement | TooltipPlacementAlias;
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
}

interface Position {
  top: number;
  left: number;
}

interface Overflow {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 仅包含 width/height 的尺寸描述，避免与 DOMRect 耦合 */
interface ContentSize {
  width: number;
  height: number;
}

/** v-model:open 双向绑定 */
const openModel = defineModel<boolean>('open', { default: undefined });

/** 生成唯一 ID 用于 ARIA 关联 */
const tooltipId = `tooltip-${useId()}`;

const VIEWPORT_PADDING = 8;
const TRIGGER_GAP = 8;
/** 箭头伸出面板的厚度（设计稿 7px），同时作为面板与触发器的间距 */
const ARROW_SIZE = 7;
/** 箭头沿面板边缘方向的底边长（设计稿 18px） */
const ARROW_LENGTH = 18;
/** 非 pointAtCenter 时箭头中心距对齐端的内缩量：8px 边距 + 半个底边 */
const ARROW_INSET = 17;

/** 驼峰方位命名 → 内部 side-align 命名 */
const PLACEMENT_ALIAS_MAP: Record<TooltipPlacementAlias, TooltipPlacement> = {
  topLeft: 'top-start',
  topRight: 'top-end',
  bottomLeft: 'bottom-start',
  bottomRight: 'bottom-end',
  leftTop: 'left-start',
  leftBottom: 'left-end',
  rightTop: 'right-start',
  rightBottom: 'right-end',
};

/** 主轴溢出时的翻转映射 */
const FLIP_SIDE: Record<TooltipSide, TooltipSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const isMounted = ref(false);

const wrapperRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const contentRefComponent = ref<any>(null);
const contentWrapperRef = computed(() => contentRefComponent.value?.el as HTMLElement | undefined);
const contentRef = ref<HTMLElement | null>(null);

const isVisible = ref(false);
const contentStyle = ref<CSSProperties>({ top: '0px', left: '0px' });
const arrowStyle = ref<CSSProperties>({});

const slots = useSlots();
const hasContentSlot = computed(() => !!slots.content);

let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;

/** 解析 placement（兼容驼峰别名），拆分为方向与对齐方式 */
const placementState = computed(() => {
  const normalized =
    PLACEMENT_ALIAS_MAP[props.placement as TooltipPlacementAlias] ?? (props.placement as TooltipPlacement);
  const [side, rawAlign] = normalized.split('-') as [TooltipSide, TooltipAlign | undefined];

  return {
    side,
    align: rawAlign ?? 'center',
  };
});

/** 实际渲染方向：autoAdjustOverflow 翻转后可能与 placement 声明的方向不同 */
const actualSide = ref<TooltipSide>('bottom');
watch(placementState, (state) => { actualSide.value = state.side; }, { immediate: true });

const styles = computed(() =>
  rebornTooltip({
    side: actualSide.value,
  }),
);

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
const frozenText = ref('');
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

/** 浮层挂载目标：getPopupContainer 优先，默认 body */
const popupTarget = computed<HTMLElement | string>(() => {
  if (!isMounted.value) return 'body';
  if (props.getPopupContainer && triggerRef.value) {
    try {
      return props.getPopupContainer(triggerRef.value) ?? document.body;
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

/** 计算触发元素与提示层之间的间距，箭头正好填充这段距离 */
const getOffset = () => (showArrow.value ? ARROW_SIZE : TRIGGER_GAP);

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

/** 根据方向与对齐方式计算初始坐标 */
const getPosition = (
  triggerRect: DOMRect,
  contentRect: ContentSize,
  side: TooltipSide,
  align: TooltipAlign,
): Position => {
  const offset = getOffset();

  if (side === 'top') {
    return {
      top: triggerRect.top - contentRect.height - offset,
      left:
        align === 'start'
          ? triggerRect.left
          : align === 'end'
            ? triggerRect.right - contentRect.width
            : triggerRect.left + triggerRect.width / 2 - contentRect.width / 2,
    };
  }

  if (side === 'bottom') {
    return {
      top: triggerRect.bottom + offset,
      left:
        align === 'start'
          ? triggerRect.left
          : align === 'end'
            ? triggerRect.right - contentRect.width
            : triggerRect.left + triggerRect.width / 2 - contentRect.width / 2,
    };
  }

  if (side === 'left') {
    return {
      top:
        align === 'start'
          ? triggerRect.top
          : align === 'end'
            ? triggerRect.bottom - contentRect.height
            : triggerRect.top + triggerRect.height / 2 - contentRect.height / 2,
      left: triggerRect.left - contentRect.width - offset,
    };
  }

  return {
    top:
      align === 'start'
        ? triggerRect.top
        : align === 'end'
          ? triggerRect.bottom - contentRect.height
          : triggerRect.top + triggerRect.height / 2 - contentRect.height / 2,
    left: triggerRect.right + offset,
  };
};

/** 计算提示层相对视口的溢出量 */
const getOverflow = (position: Position, contentRect: ContentSize): Overflow => ({
  top: VIEWPORT_PADDING - position.top,
  right:
    position.left + contentRect.width - (window.innerWidth - VIEWPORT_PADDING),
  bottom:
    position.top + contentRect.height - (window.innerHeight - VIEWPORT_PADDING),
  left: VIEWPORT_PADDING - position.left,
});

/** 取某一侧的主轴溢出量 */
const getMainOverflow = (overflow: Overflow, side: TooltipSide) =>
  side === 'top'
    ? overflow.top
    : side === 'bottom'
      ? overflow.bottom
      : side === 'left'
        ? overflow.left
        : overflow.right;

/**
 * 贴边偏移：交叉轴方向把提示层挪回视口内，但始终与触发元素保持最小交叠——
 * 触发元素随滚动移出视口时，提示层跟着一同滚出，而不是钉死在屏幕边缘
 */
const shiftCrossAxis = (
  position: Position,
  contentRect: ContentSize,
  triggerRect: DOMRect,
  side: TooltipSide,
): Position => {
  if (side === 'top' || side === 'bottom') {
    const overlap = Math.min(12, triggerRect.width / 2);
    let left = Math.min(
      Math.max(position.left, VIEWPORT_PADDING),
      window.innerWidth - contentRect.width - VIEWPORT_PADDING,
    );
    left = Math.min(
      Math.max(left, triggerRect.left + overlap - contentRect.width),
      triggerRect.right - overlap,
    );
    return { top: position.top, left };
  }

  const overlap = Math.min(12, triggerRect.height / 2);
  let top = Math.min(
    Math.max(position.top, VIEWPORT_PADDING),
    window.innerHeight - contentRect.height - VIEWPORT_PADDING,
  );
  top = Math.min(
    Math.max(top, triggerRect.top + overlap - contentRect.height),
    triggerRect.bottom - overlap,
  );
  return { top, left: position.left };
};

/** 根据实际位置同步箭头坐标；默认停在对齐端，pointAtCenter 时指向触发元素中心 */
const syncArrowPosition = (
  triggerRect: DOMRect,
  contentRect: ContentSize,
  position: Position,
  side: TooltipSide,
  align: TooltipAlign,
) => {
  if (!showArrow.value) {
    arrowStyle.value = {};
    return;
  }

  const halfThickness = ARROW_SIZE / 2;
  const halfLength = ARROW_LENGTH / 2;
  // 箭头底边向面板内收 0.5px，保证连接处无缝
  const overlap = 0.5;
  // 对齐端内缩量对极小面板做兜底，避免钳制上下限倒挂
  const inset = Math.min(
    ARROW_INSET,
    (side === 'top' || side === 'bottom' ? contentRect.width : contentRect.height) / 2,
  );

  let centerX: number;
  let centerY: number;
  let rotate: string;

  if (side === 'top' || side === 'bottom') {
    const ideal =
      pointAtCenter.value || align === 'center'
        ? triggerRect.left + triggerRect.width / 2 - position.left
        : align === 'start'
          ? ARROW_INSET
          : contentRect.width - ARROW_INSET;
    centerX = Math.min(Math.max(ideal, inset), contentRect.width - inset);
    if (side === 'top') {
      // 面板在触发器上方：箭头贴面板底边，尖端向下
      centerY = contentRect.height + halfThickness - overlap;
      rotate = 'rotate(90deg)';
    } else {
      // 面板在触发器下方：箭头贴面板顶边，尖端向上
      centerY = -halfThickness + overlap;
      rotate = 'rotate(-90deg)';
    }
  } else {
    const ideal =
      pointAtCenter.value || align === 'center'
        ? triggerRect.top + triggerRect.height / 2 - position.top
        : align === 'start'
          ? ARROW_INSET
          : contentRect.height - ARROW_INSET;
    centerY = Math.min(Math.max(ideal, inset), contentRect.height - inset);
    if (side === 'left') {
      // 面板在触发器左侧：箭头贴面板右边，尖端向右（SVG 原始方向）
      centerX = contentRect.width + halfThickness - overlap;
      rotate = 'rotate(0deg)';
    } else {
      // 面板在触发器右侧：箭头贴面板左边，尖端向左
      centerX = -halfThickness + overlap;
      rotate = 'rotate(180deg)';
    }
  }

  // 布局盒固定为 7×18（SVG 原始方向，尖端向右），以中心点定位后绕中心旋转到目标方向
  arrowStyle.value = {
    left: `${centerX - halfThickness}px`,
    top: `${centerY - halfLength}px`,
    transform: rotate,
  };
};

/** 同步提示层位置与箭头位置 */
const updatePosition = (el?: Element) => {
  const currentContent = el ?? contentWrapperRef.value;
  if (!shouldRender.value || !triggerRef.value || !currentContent) {
    return;
  }

  const htmlEl = currentContent as HTMLElement;
  const triggerRect = triggerRef.value.getBoundingClientRect();
  // offsetWidth/offsetHeight 不受 CSS transform（如 zoom-in 动画的 scale-90）影响，
  // 避免在 onBeforeEnter 期间测量到缩放后的错误尺寸
  const contentRect: ContentSize = { width: htmlEl.offsetWidth, height: htmlEl.offsetHeight };
  const { side, align } = placementState.value;

  let usedSide = side;
  let nextPosition = getPosition(triggerRect, contentRect, side, align);

  if (props.autoAdjustOverflow) {
    // 主轴放不下先尝试翻转到对侧；对侧也放不下则维持原方向
    const overflow = getOverflow(nextPosition, contentRect);
    if (getMainOverflow(overflow, side) > 0) {
      const flippedSide = FLIP_SIDE[side];
      const flippedPosition = getPosition(triggerRect, contentRect, flippedSide, align);
      const flippedOverflow = getOverflow(flippedPosition, contentRect);
      if (getMainOverflow(flippedOverflow, flippedSide) <= 0) {
        usedSide = flippedSide;
        nextPosition = flippedPosition;
      }
    }
    nextPosition = shiftCrossAxis(nextPosition, contentRect, triggerRect, usedSide);
  }

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

/** 经延时打开；delay<=0 时立即生效 */
const requestOpen = (delay: number) => {
  if (props.disabled || !hasContent.value) {
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
  () => [props.placement, props.arrow, liveText.value] as const,
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
    ref="wrapperRef" :class="styles.wrapper()" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn" @focusout="handleFocusOut" @click="handleClick" @contextmenu="handleContextMenu"
  >
    <span ref="triggerRef" :class="styles.trigger()" :aria-describedby="shouldRender ? tooltipId : undefined">
      <slot />
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
            {{ displayText }}
          </slot>
        </div>
        <!-- 箭头取自设计稿（7×18 圆头曲线，尖端向右为原始方向），fill 走 currentColor 与面板同色 -->
        <span
          v-if="showArrow" :class="styles.arrow()" :style="[arrowStyle, props.color ? { color: props.color } : null]"
          aria-hidden="true"
        >
          <svg class="block" width="7" height="18" viewBox="0 0 7 18" fill="currentColor">
            <path
              d="M0,0L0,18C0.322,15.745,1.46,13.687,3.199,12.216L5.647,10.145C6.355,9.546,6.355,8.454,5.647,7.855L3.199,5.784C1.46,4.313,0.322,2.255,0,0Z"
            />
          </svg>
        </span>
      </RebornTransition>
    </Teleport>
  </span>
</template>
