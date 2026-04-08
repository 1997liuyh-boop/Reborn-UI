<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import theme from "./reborn-popover.config";
import RebornTransition from "../reborn-transition/RebornTransition.vue";

defineOptions({
  name: "RebornPopover",
});

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
  class?: any;
  ui?: any;
}

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
  (e: "update:open", v: boolean): void;
}>();

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
const ARROW_INSET = 20;

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

function syncArrowPosition(rect: DOMRect, x: number, y: number, width: number, height: number) {
  const triggerCenterX = rect.left + rect.width / 2 - x;
  const triggerCenterY = rect.top + rect.height / 2 - y;

  arrowPosition.value = {
    x: `${Math.min(Math.max(triggerCenterX, ARROW_INSET), width - ARROW_INSET)}px`,
    y: `${Math.min(Math.max(triggerCenterY, ARROW_INSET), height - ARROW_INSET)}px`,
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
  syncArrowPosition(rect, clamped.x, clamped.y, width, height);

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
  return b({
    side: resolvedSide.value,
    align: resolvedAlign.value,
  });
});

defineExpose({
  close: () => (open.value = false),
});
</script>

<template>
  <div ref="wrapperRef" :class="ui.wrapper({ class: props.class })" @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <div ref="triggerRef" :class="ui.trigger()" @click="onClickTrigger">
      <slot :open="open" />
    </div>

    <Teleport :to="typeof portal === 'string' ? portal : 'body'" :disabled="!portal">
      <div v-if="open && modal" :class="ui.mask()" @click="props.dismissible && (open = false)" />

      <RebornTransition :show="open" name="zoom-in" :duration="{ enter: 200, leave: 150 }"
        :custom-class="ui.contentWrapper()" :custom-style="style" ref="contentRefComponent"
        @before-enter="onBeforeEnter" @enter="onEnter" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <div :class="ui.content()">
          <slot name="content" />

          <div v-if="props.mode === 'hover'" :class="ui.bridge()"
            :style="{ margin: `-${props.content.sideOffset ?? 8}px` }" />

          <div v-if="arrow" :class="ui.arrow()" :style="arrowStyle" />
        </div>
      </RebornTransition>
    </Teleport>
  </div>
</template>
