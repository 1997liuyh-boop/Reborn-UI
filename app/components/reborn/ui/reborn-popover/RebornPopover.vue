<script setup lang="ts">
import type { FloatingPoint } from "~/lib/floating";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getArrowCenter, resolveFloatingPosition } from "~/lib/floating";
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

/**
 * 箭头中心距面板端部的最小内缩量，与 reborn-tooltip 取同一口径：
 * 面板圆角 8px（rounded-lg）加半个箭头底边（12px 方块旋转 45° 后底边 ≈16.97px，半边 ≈8.49px），取整 17。
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

/**
 * 同步箭头在面板内的坐标。落点规则与 reborn-tooltip 一致：
 * start / end 停在对齐端的内缩位置，只有 center 才指向触发器中心，
 * 这样三档对齐的箭头位置是稳定的，不随触发器宽度漂移。
 *
 * 箭头绝对定位在带边框的 .content 里，top / left 以内边距盒为原点，
 * 而 position 是面板边框盒的位置，因此要把边框宽度算进面板起点。
 */
function syncArrowPosition(
  rect: DOMRect,
  position: FloatingPoint,
  side: PopoverSide,
  align: PopoverAlign,
  contentBox: HTMLElement,
) {
  // clientLeft / clientTop 即左、上边框宽度，clientWidth / clientHeight 即内边距盒尺寸
  const isVertical = side === "top" || side === "bottom";

  arrowPosition.value = {
    x: `${getArrowCenter({
      panelStart: position.left + contentBox.clientLeft,
      panelExtent: contentBox.clientWidth,
      triggerStart: rect.left,
      triggerExtent: rect.width,
      // 主轴方向上没有对齐概念，那一轴的值也用不到，按 center 计算即可
      align: isVertical ? align : "center",
      inset: ARROW_INSET,
    })}px`,
    y: `${getArrowCenter({
      panelStart: position.top + contentBox.clientTop,
      panelExtent: contentBox.clientHeight,
      triggerStart: rect.top,
      triggerExtent: rect.height,
      align: isVertical ? "center" : align,
      inset: ARROW_INSET,
    })}px`,
  };
}

function calculatePosition(contentElement?: HTMLElement) {
  const currentContent = contentElement ?? contentRef.value;
  if (!triggerRef.value || !currentContent) return;

  const contentBox = currentContent.firstElementChild as HTMLElement | null;
  if (!contentBox) return;

  const rect = triggerRef.value.getBoundingClientRect();
  // 取 offsetWidth / offsetHeight 而非 getBoundingClientRect，入场动画的 scale 不会算进尺寸
  const size = { width: contentBox.offsetWidth, height: contentBox.offsetHeight };
  const align: PopoverAlign = props.content?.align || "center";

  // 翻转与贴边都交给共享的浮层几何，口径与 reborn-tooltip 保持一致
  const { side, position } = resolveFloatingPosition({
    triggerRect: rect,
    size,
    side: props.content?.side || "bottom",
    align,
    offset: props.content?.sideOffset ?? 8,
  });

  resolvedSide.value = side;
  resolvedAlign.value = align;
  syncArrowPosition(rect, position, side, align, contentBox);

  style.value = {
    left: `${position.left}px`,
    top: `${position.top}px`,
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
