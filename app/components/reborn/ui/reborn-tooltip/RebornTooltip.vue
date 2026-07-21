<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
  type CSSProperties,
} from 'vue';
import { useId } from 'vue';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import { rebornTooltip } from './reborn-tooltip.config';

defineOptions({ name: 'RebornTooltip' });

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
type TooltipEffect = 'dark' | 'light';

interface RebornTooltipProps {
  /** 提示内容 */
  content?: string;
  /** 出现方向与对齐方式 */
  placement?: TooltipPlacement;
  /** 主题效果 */
  effect?: TooltipEffect;
  /** 是否显示箭头 */
  arrow?: boolean;
  /** 打开延时 */
  openDelay?: number;
  /** 关闭延时 */
  closeDelay?: number;
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

const props = withDefaults(defineProps<RebornTooltipProps>(), {
  content: '',
  placement: 'bottom',
  effect: 'dark',
  arrow: true,
  openDelay: 100,
  closeDelay: 100,
  disabled: false,
});

/** v-model:open 双向绑定 */
const openModel = defineModel<boolean>('open', { default: undefined });

/** 事件定义 */
const emit = defineEmits<{
  (e: 'open'): void;
  (e: 'close'): void;
}>();

/** 生成唯一 ID 用于 ARIA 关联 */
const tooltipId = `tooltip-${useId()}`;

const VIEWPORT_PADDING = 8;
const TRIGGER_GAP = 8;
const ARROW_SIZE = 8;

const isMounted = ref(false);
onMounted(() => { isMounted.value = true; });

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

/** 解析 placement，拆分为方向与对齐方式 */
const placementState = computed(() => {
  const [side, rawAlign] = props.placement.split('-') as [
    TooltipSide,
    TooltipAlign | undefined,
  ];

  return {
    side,
    align: rawAlign ?? 'center',
  };
});

const styles = computed(() =>
  rebornTooltip({
    side: placementState.value.side,
    effect: props.effect,
  }),
);

const shouldRender = computed(
  () => isVisible.value && !props.disabled && (Boolean(props.content) || hasContentSlot.value),
);

/** 是否有内容可显示 */
const hasContent = computed(() => Boolean(props.content) || hasContentSlot.value);

/** 计算触发元素与提示层之间的间距，箭头正好填充这段距离 */
const getOffset = () => props.arrow ? ARROW_SIZE : TRIGGER_GAP;

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

/** 将提示层位置钳制在可视区域内 */
const clampPosition = (position: Position, contentRect: ContentSize): Position => ({
  top: Math.min(
    Math.max(position.top, VIEWPORT_PADDING),
    window.innerHeight - contentRect.height - VIEWPORT_PADDING,
  ),
  left: Math.min(
    Math.max(position.left, VIEWPORT_PADDING),
    window.innerWidth - contentRect.width - VIEWPORT_PADDING,
  ),
});

/** 根据实际位置同步箭头坐标，保证箭头尽量指向触发元素中心 */
const syncArrowPosition = (
  triggerRect: DOMRect,
  contentRect: ContentSize,
  position: Position,
  side: TooltipSide,
) => {
  if (!props.arrow) {
    arrowStyle.value = {};
    return;
  }

  const edgePadding = 10;
  const halfArrow = ARROW_SIZE / 2;

  if (side === 'top' || side === 'bottom') {
    const idealLeft = triggerRect.left + triggerRect.width / 2 - position.left;
    const arrowLeft = Math.min(
      Math.max(idealLeft, edgePadding),
      contentRect.width - edgePadding,
    );

    if (side === 'top') {
      // 箭头在内容下方，base 紧贴内容底部，尖端向下指向触发器
      // -1px 重叠：消除 clipPath 抗锯齿在边缘产生的半透明像素缝隙
      arrowStyle.value = {
        left: `${arrowLeft - halfArrow}px`,
        top: `${contentRect.height - 1}px`,
        clipPath: "path('M 0 0 L 12 0 L 7.5 10.5 Q 6 12 4.5 10.5 L 0 0 Z')",
      };
    } else {
      // 箭头在内容上方，base 紧贴内容顶部，尖端向上指向触发器
      // +1px 重叠：消除 clipPath 抗锯齿在边缘产生的半透明像素缝隙
      arrowStyle.value = {
        left: `${arrowLeft - halfArrow}px`,
        top: `${-(ARROW_SIZE - 1)}px`,
        clipPath: "path('M 0 12 L 4.5 1.5 Q 6 0 7.5 1.5 L 12 12 Z')",
      };
    }
    return;
  }

  const idealTop = triggerRect.top + triggerRect.height / 2 - position.top;
  const arrowTop = Math.min(
    Math.max(idealTop, edgePadding),
    contentRect.height - edgePadding,
  );

  if (side === 'left') {
    // 箭头在内容右侧，base 紧贴内容右边，尖端向右指向触发器
    // -1px 重叠：消除 clipPath 抗锯齿缝隙
    arrowStyle.value = {
      top: `${arrowTop - halfArrow}px`,
      left: `${contentRect.width - 1}px`,
      clipPath: "path('M 0 0 L 10.5 4.5 Q 12 6 10.5 7.5 L 0 12 Z')",
    };
  } else {
    // 箭头在内容左侧，base 紧贴内容左边，尖端向左指向触发器
    // +1px 重叠：消除 clipPath 抗锯齿缝隙
    arrowStyle.value = {
      top: `${arrowTop - halfArrow}px`,
      left: `${-(ARROW_SIZE - 1)}px`,
      clipPath: "path('M 12 0 L 1.5 4.5 Q 0 6 1.5 7.5 L 12 12 Z')",
    };
  }
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
  const initialPosition = getPosition(
    triggerRect,
    contentRect,
    placementState.value.side,
    placementState.value.align,
  );
  const overflow = getOverflow(initialPosition, contentRect);
  const nextPosition =
    overflow.top > 0 ||
      overflow.right > 0 ||
      overflow.bottom > 0 ||
      overflow.left > 0
      ? clampPosition(initialPosition, contentRect)
      : initialPosition;

  contentStyle.value = {
    top: `${nextPosition.top}px`,
    left: `${nextPosition.left}px`,
  };
  syncArrowPosition(
    triggerRect,
    contentRect,
    nextPosition,
    placementState.value.side,
  );
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

/** 打开提示层 */
const openTooltip = () => {
  if (props.disabled || !hasContent.value) {
    return;
  }

  clearTimers();
  openTimer = setTimeout(() => {
    isVisible.value = true;
    if (openModel.value !== undefined) {
      openModel.value = true;
    }
    bindWindowEvents();
    bindKeyboardEvent();
    emit('open');
  }, props.openDelay);
};

/** 关闭提示层 */
const closeTooltip = () => {
  clearTimers();
  closeTimer = setTimeout(() => {
    isVisible.value = false;
    if (openModel.value !== undefined) {
      openModel.value = false;
    }
    unbindWindowEvents();
    unbindKeyboardEvent();
    emit('close');
  }, props.closeDelay);
};

/** 在显示期间监听窗口变化，保持定位实时更新 */
const bindWindowEvents = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('resize', syncPosition);
  window.addEventListener('scroll', syncPosition, true);
};

/** 清理窗口监听，避免重复绑定 */
const unbindWindowEvents = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('resize', syncPosition);
  window.removeEventListener('scroll', syncPosition, true);
};

/** 键盘事件处理 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isVisible.value) {
    closeTooltip();
  }
};

/** 绑定键盘事件 */
const bindKeyboardEvent = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.addEventListener('keydown', handleKeydown);
};

/** 解绑键盘事件 */
const unbindKeyboardEvent = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.removeEventListener('keydown', handleKeydown);
};

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      clearTimers();
      isVisible.value = false;
      unbindWindowEvents();
    }
  },
);

watch(
  () => props.content,
  (content) => {
    if (!content) {
      clearTimers();
      isVisible.value = false;
      unbindWindowEvents();
    }
  },
);

watch(
  () => [props.placement, props.effect, props.arrow, props.content] as const,
  () => {
    if (shouldRender.value) {
      nextTick(updatePosition);
    }
  },
);

watch(isVisible, (visible) => {
  if (!visible) {
    arrowStyle.value = {};
    unbindWindowEvents();
    unbindKeyboardEvent();
    return;
  }

  nextTick(updatePosition);
});

/** 监听 v-model:open 变化，同步内部状态 */
watch(openModel, (value) => {
  if (value === true && !isVisible.value) {
    clearTimers();
    isVisible.value = true;
    bindWindowEvents();
    bindKeyboardEvent();
    emit('open');
  } else if (value === false && isVisible.value) {
    clearTimers();
    isVisible.value = false;
    unbindWindowEvents();
    unbindKeyboardEvent();
    emit('close');
  }
});

/** 暴露方法供外部调用 */
defineExpose({
  open: openTooltip,
  close: closeTooltip,
});

onBeforeUnmount(() => {
  clearTimers();
  unbindWindowEvents();
  unbindKeyboardEvent();

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});
</script>

<template>
  <span ref="wrapperRef" :class="styles.wrapper()" @mouseenter="openTooltip" @mouseleave="closeTooltip">
    <span ref="triggerRef" :class="styles.trigger()" :aria-describedby="shouldRender ? tooltipId : undefined">
      <slot />
    </span>

    <Teleport to="body" :disabled="!isMounted">
      <RebornTransition ref="contentRefComponent" :show="shouldRender" name="fade"
        :custom-class="styles.contentWrapper()" :custom-style="contentStyle" @before-enter="onBeforeEnter"
        @enter="onEnter" @mouseenter="openTooltip" @mouseleave="closeTooltip">
        <div :id="tooltipId" ref="contentRef" :class="styles.content()" role="tooltip">
          <slot name="content">
            {{ props.content }}
          </slot>
        </div>
        <span v-if="arrow" :class="styles.arrow()" :style="arrowStyle" aria-hidden="true" />
      </RebornTransition>
    </Teleport>
  </span>
</template>
