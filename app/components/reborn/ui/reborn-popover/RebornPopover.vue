<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import theme from "./reborn-popover.config";

defineOptions({
  name: "RebornPopover",
});

const props = withDefaults(defineProps<PopoverProps>(), {
  mode: "click",
  portal: true,
  arrow: false,
  dismissible: true,
  modal: false,
  openDelay: 0,
  closeDelay: 120,
  content: () => ({
    side: "bottom",
    align: "center",
    sideOffset: 8,
  }),
});

const emit = defineEmits<{
  /** 显隐状态变化时触发，参数为最新的 open 值（对应 v-model:open） */
  (e: "update:open", v: boolean): void;
}>();

export interface PopoverContentProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

type PopoverSide = NonNullable<PopoverContentProps["side"]>;
type PopoverAlign = NonNullable<PopoverContentProps["align"]>;

export interface PopoverProps {
  mode?: "click" | "hover";
  content?: PopoverContentProps;
  arrow?: boolean;
  portal?: boolean | string;
  dismissible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  openDelay?: number;
  closeDelay?: number;
  /** 追加到根元素（触发器外层容器）的自定义类名 */
  class?: any;
  /** 按内部结构键覆盖各节点类名，键位见文档「自定义样式（ui）」 */
  ui?: Partial<{
    wrapper?: any;
    trigger?: any;
    contentWrapper?: any;
    content?: any;
    arrow?: any;
    bridge?: any;
    mask?: any;
  }>;
}

const internalOpen = ref(props.defaultOpen ?? props.open ?? false);

watch(
  () => props.open,
  (v) => {
    if (v !== undefined) internalOpen.value = v;
  },
);

const open = computed({
  get: () => internalOpen.value,
  set: (value) => {
    internalOpen.value = value;
    emit("update:open", value);
  },
});

const wrapperRef = ref<HTMLElement>();
const triggerRef = ref<HTMLElement>();
const contentRefComponent = ref<any>();
const contentRef = computed(() => contentRefComponent.value?.el as HTMLElement | undefined);

let hoverCount = 0;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const onMouseEnter = () => {
  if (props.mode !== "hover") return;

  hoverCount++;
  if (hoverTimer) clearTimeout(hoverTimer);

  hoverTimer = setTimeout(() => {
    open.value = true;
  }, props.openDelay);
};

const onMouseLeave = () => {
  if (props.mode !== "hover") return;

  hoverCount--;
  if (hoverTimer) clearTimeout(hoverTimer);

  hoverTimer = setTimeout(() => {
    if (hoverCount <= 0) open.value = false;
  }, props.closeDelay);
};

const onClickTrigger = () => {
  if (props.mode === "click") {
    open.value = !open.value;
  }
};

const onClickOutside = (event: MouseEvent) => {
  if (!open.value || !props.dismissible) return;

  const target = event.target as Node;
  if (wrapperRef.value?.contains(target) || contentRef.value?.contains(target)) {
    return;
  }

  open.value = false;
};

const VIEWPORT_OFFSET = 8;
/**
 * 箭头中心距面板端部的最小内缩量，与 reborn-tooltip 取同一口径：
 * 面板圆角 8px（rounded-ui-sm）加半个箭头底边（12px 方块旋转 45° 后底边 ≈16.97px，半边 ≈8.49px），取整 17。
 * 小于该值箭头底边会压到圆角的弧线上，连接处出现悬空缺口。
 */
const ARROW_INSET = 17;

const style = ref<Record<string, string>>({
  left: "0px",
  top: "0px",
});

const resolvedSide = ref<PopoverSide>(props.content?.side || "bottom");
const resolvedAlign = ref<PopoverAlign>(props.content?.align || "center");

const arrowPosition = ref({
  x: "50%",
  y: "50%",
});

function getPosition(
  rect: DOMRect,
  width: number,
  height: number,
  side: PopoverSide,
  align: PopoverAlign,
  offset: number,
) {
  let x = rect.left;
  let y = rect.bottom + offset;

  if (side === "top") {
    y = rect.top - height - offset;
  }

  if (side === "left") {
    x = rect.left - width - offset;
    y = rect.top + rect.height / 2 - height / 2;
  }

  if (side === "right") {
    x = rect.right + offset;
    y = rect.top + rect.height / 2 - height / 2;
  }

  if (side === "top" || side === "bottom") {
    if (align === "center") {
      x = rect.left + rect.width / 2 - width / 2;
    } else if (align === "end") {
      x = rect.right - width;
    }
  }

  if (side === "left" || side === "right") {
    if (align === "start") {
      y = rect.top;
    } else if (align === "end") {
      y = rect.bottom - height;
    }
  }

  return { x, y };
}

function getOverflow(x: number, y: number, width: number, height: number) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight;

  return {
    top: y < VIEWPORT_OFFSET,
    bottom: y + height > viewportHeight - VIEWPORT_OFFSET,
    left: x < VIEWPORT_OFFSET,
    right: x + width > viewportWidth - VIEWPORT_OFFSET,
  };
}

function clampPosition(x: number, y: number, width: number, height: number) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight;

  return {
    x: Math.min(Math.max(x, VIEWPORT_OFFSET), viewportWidth - width - VIEWPORT_OFFSET),
    y: Math.min(Math.max(y, VIEWPORT_OFFSET), viewportHeight - height - VIEWPORT_OFFSET),
  };
}

function getVerticalAlignFallbacks(align: PopoverAlign, direction: "top" | "bottom") {
  if (direction === "bottom") {
    if (align === "start") return ["center", "end"] as PopoverAlign[];
    if (align === "center") return ["end"] as PopoverAlign[];
    return [] as PopoverAlign[];
  }

  if (align === "end") return ["center", "start"] as PopoverAlign[];
  if (align === "center") return ["start"] as PopoverAlign[];
  return [] as PopoverAlign[];
}

/** 把箭头中心钳制在面板直边范围内；面板短到放不下两倍内缩量时退回正中，避免上下限倒挂。 */
function clampArrowOffset(center: number, extent: number) {
  if (extent < ARROW_INSET * 2) return extent / 2;
  return Math.min(Math.max(center, ARROW_INSET), extent - ARROW_INSET);
}

/**
 * 同步箭头在面板内的坐标：箭头指向触发器中心，再按最小内缩量钳制到面板直边内。
 * 箭头绝对定位在带边框的 .content 里，top / left 以内边距盒为原点，
 * 而 x / y 是面板边框盒的位置，因此要扣掉边框宽度，箭头中心才能真正落在触发器中心上。
 */
function syncArrowPosition(rect: DOMRect, x: number, y: number, contentBox: HTMLElement) {
  // clientLeft / clientTop 即左、上边框宽度，clientWidth / clientHeight 即内边距盒尺寸
  const triggerCenterX = rect.left + rect.width / 2 - x - contentBox.clientLeft;
  const triggerCenterY = rect.top + rect.height / 2 - y - contentBox.clientTop;

  arrowPosition.value = {
    x: `${clampArrowOffset(triggerCenterX, contentBox.clientWidth)}px`,
    y: `${clampArrowOffset(triggerCenterY, contentBox.clientHeight)}px`,
  };
}

function calculatePosition(contentElement?: HTMLElement) {
  const currentContent = contentElement ?? contentRef.value;
  if (!triggerRef.value || !currentContent) return;

  const contentBox = currentContent.firstElementChild as HTMLElement | null;
  if (!contentBox) return;

  const rect = triggerRef.value.getBoundingClientRect();
  const width = contentBox.offsetWidth;
  const height = contentBox.offsetHeight;
  const offset = props.content?.sideOffset ?? 8;

  let side: PopoverSide = props.content?.side || "bottom";
  let align: PopoverAlign = props.content?.align || "center";
  const originAlign: PopoverAlign = props.content?.align || "center";
  let position = getPosition(rect, width, height, side, align, offset);
  let overflow = getOverflow(position.x, position.y, width, height);

  if (side === "bottom" && overflow.bottom) {
    side = "top";
    position = getPosition(rect, width, height, side, align, offset);
    overflow = getOverflow(position.x, position.y, width, height);
  } else if (side === "top" && overflow.top) {
    side = "bottom";
    position = getPosition(rect, width, height, side, align, offset);
    overflow = getOverflow(position.x, position.y, width, height);
  } else if (side === "left" || side === "right") {
    if (side === "left" && overflow.left) {
      side = "right";
      position = getPosition(rect, width, height, side, align, offset);
      overflow = getOverflow(position.x, position.y, width, height);
    } else if (side === "right" && overflow.right) {
      side = "left";
      position = getPosition(rect, width, height, side, align, offset);
      overflow = getOverflow(position.x, position.y, width, height);
    }

    if (overflow.bottom || overflow.top) {
      const direction = overflow.bottom ? "bottom" : "top";

      for (const nextAlign of getVerticalAlignFallbacks(align, direction)) {
        align = nextAlign;
        position = getPosition(rect, width, height, side, align, offset);
        overflow = getOverflow(position.x, position.y, width, height);

        if (
          (direction === "bottom" && !overflow.bottom) ||
          (direction === "top" && !overflow.top)
        ) {
          break;
        }
      }

      if ((direction === "bottom" && overflow.bottom) || (direction === "top" && overflow.top)) {
        side = direction === "bottom" ? "top" : "bottom";
        align = originAlign;
        position = getPosition(rect, width, height, side, align, offset);
      }
    }
  }

  const clamped = clampPosition(position.x, position.y, width, height);
  resolvedSide.value = side;
  resolvedAlign.value = align;
  syncArrowPosition(rect, clamped.x, clamped.y, contentBox);

  style.value = {
    left: `${clamped.x}px`,
    top: `${clamped.y}px`,
  };
}

let frame: number | null = null;

function updatePosition() {
  if (frame) return;

  frame = requestAnimationFrame(() => {
    calculatePosition();
    frame = null;
  });
}

const onBeforeEnter = (el: Element) => {
  calculatePosition(el as HTMLElement);
};

const onEnter = (el: Element) => {
  calculatePosition(el as HTMLElement);
};

let resizeObserver: ResizeObserver | null = null;

watch(
  contentRef,
  (element) => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (!element) return;

    resizeObserver = new ResizeObserver(() => {
      if (open.value) updatePosition();
    });
    resizeObserver.observe(element);

    if (open.value) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => calculatePosition());
      });
    }
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onClickOutside);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
  if (hoverTimer) clearTimeout(hoverTimer);
  if (resizeObserver) resizeObserver.disconnect();
});

watch(open, (value) => {
  if (!value) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => calculatePosition());
  });
});

const arrowStyle = computed(() => {
  const side = resolvedSide.value;
  const offsetScale = "-6px";

  if (side === "bottom") {
    return {
      top: offsetScale,
      left: arrowPosition.value.x,
      transform: "translateX(-50%) rotate(45deg)",
      clipPath: "polygon(0 0, 100% 0, 0 100%)",
      borderBottomWidth: "0",
      borderRightWidth: "0",
    };
  }

  if (side === "top") {
    return {
      bottom: offsetScale,
      left: arrowPosition.value.x,
      transform: "translateX(-50%) rotate(45deg)",
      clipPath: "polygon(100% 100%, 100% 0, 0 100%)",
      borderTopWidth: "0",
      borderLeftWidth: "0",
    };
  }

  if (side === "left") {
    return {
      right: offsetScale,
      top: arrowPosition.value.y,
      transform: "translateY(-50%) rotate(45deg)",
      clipPath: "polygon(100% 0, 0 0, 100% 100%)",
      borderBottomWidth: "0",
      borderLeftWidth: "0",
    };
  }

  return {
    left: offsetScale,
    top: arrowPosition.value.y,
    transform: "translateY(-50%) rotate(45deg)",
    clipPath: "polygon(0 100%, 0 0, 100% 100%)",
    borderTopWidth: "0",
    borderRightWidth: "0",
  };
});

const b = tv(theme);
const ui = computed(() => {
  const s = b({
    side: resolvedSide.value,
    align: resolvedAlign.value,
  });
  const ov: any = props.ui ?? {};
  // 把 ui 传入的类名并进对应槽位，未传时行为与原先完全一致
  const slot =
    <K extends keyof typeof s>(key: K) =>
    (opts?: { class?: any }) =>
      s[key]({ class: [opts?.class, ov[key]] });
  return {
    wrapper: slot("wrapper"),
    trigger: slot("trigger"),
    contentWrapper: slot("contentWrapper"),
    content: slot("content"),
    arrow: slot("arrow"),
    bridge: slot("bridge"),
    mask: slot("mask"),
  };
});

defineExpose({
  /** 手动关闭 Popover */
  close: () => (open.value = false),
});
</script>

<template>
  <div
    ref="wrapperRef" :class="ui.wrapper({ class: props.class })" @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div ref="triggerRef" :class="ui.trigger()" @click="onClickTrigger">
      <slot :open="open" />
    </div>

    <Teleport :to="typeof portal === 'string' ? portal : 'body'" :disabled="!portal">
      <div v-if="open && modal" :class="ui.mask()" @click="props.dismissible && (open = false)" />

      <RebornTransition
        ref="contentRefComponent" :show="open" name="zoom-in"
        :duration="{ enter: 200, leave: 150 }" :custom-class="ui.contentWrapper()" :custom-style="style"
        @before-enter="onBeforeEnter" @enter="onEnter" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave"
      >
        <div :class="ui.content()">
          <slot name="content" />

          <div
            v-if="props.mode === 'hover'" :class="ui.bridge()"
            :style="{ margin: `-${props.content.sideOffset ?? 8}px` }"
          />

          <div v-if="arrow" :class="ui.arrow()" :style="arrowStyle" />
        </div>
      </RebornTransition>
    </Teleport>
  </div>
</template>
