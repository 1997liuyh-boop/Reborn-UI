<script setup lang="ts">
import type { FloatingPoint } from "~/lib/floating";
import type { Placement } from "~/lib/placement";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useFloatingDismiss } from "~/composables/useFloatingDismiss";
import { getArrowCenter, resolveFloatingPosition } from "~/lib/floating";
import { resolvePlacement } from "~/lib/placement";
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
  closeOnScroll: true,
  modal: false,
  openDelay: 0,
  closeDelay: 120,
  // placement / sideOffset / content 都不给默认值：保持 undefined 才能识别「未传」，按 placement → content → 默认值的顺序回落
  placement: undefined,
  sideOffset: undefined,
  content: undefined,
});

const emit = defineEmits<{
  /** 显隐状态变化时触发，参数为最新的 open 值（对应 v-model:open） */
  (e: "update:open", v: boolean): void;
}>();

/** 旧的定位对象写法，等价于 placement + sideOffset，仅为兼容保留 */
export interface PopoverContentProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

/** 气泡方位取值，与 reborn-popconfirm、reborn-tooltip 的 placement 完全一致 */
export type PopoverPlacement = Placement;

type PopoverSide = NonNullable<PopoverContentProps["side"]>;
type PopoverAlign = NonNullable<PopoverContentProps["align"]>;

export interface PopoverProps {
  /** 触发方式：click 点击触发器切换 / hover 悬停打开、移出关闭 */
  mode?: "click" | "hover";
  /**
   * 出现方向与对齐方式，「方向-对齐」写法，与 reborn-popconfirm、reborn-tooltip 一致；主轴放不下时自动翻到对侧
   * @defaultValue 'bottom'
   */
  placement?: PopoverPlacement;
  /**
   * 气泡与触发器的间距（px）
   * @defaultValue 8
   */
  sideOffset?: number;
  /**
   * 旧的定位对象写法（side / align / sideOffset），等价于 placement + sideOffset，仅为兼容保留
   * @deprecated 请改用 placement / sideOffset
   */
  content?: PopoverContentProps;
  /** 是否显示指向触发器的箭头 */
  arrow?: boolean;
  /** 传送目标：true 传送到 body，字符串为目标选择器，false 原地渲染 */
  portal?: boolean | string;
  /** 点击外部（含遮罩、iframe 内）是否关闭气泡 */
  dismissible?: boolean;
  /** 页面或触发器所在容器滚动时是否关闭气泡；关闭后气泡跟随触发器移动 */
  closeOnScroll?: boolean;
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

/**
 * 点击外部关闭与滚动关闭交给共享的 useFloatingDismiss：
 * 捕获阶段判定、嵌套浮层（气泡里的 Select、Popconfirm 等）里的点击不算外部、只有带动触发器位移的滚动才关闭
 */
useFloatingDismiss({
  open: () => open.value,
  elements: () => [wrapperRef.value, contentRef.value],
  anchor: () => triggerRef.value,
  closeOnClickOutside: () => props.dismissible,
  closeOnScroll: () => props.closeOnScroll,
  onDismiss: () => {
    open.value = false;
  },
});

/** 解析后的方位：placement 优先，未传时回落到旧的 content 对象，都没有则在下方居中 */
const placementInfo = computed(() => {
  const legacy = props.content ?? {};
  const { side, align } = props.placement
    ? resolvePlacement(props.placement)
    : { side: legacy.side ?? "bottom", align: legacy.align ?? "center" };
  return { side, align, offset: props.sideOffset ?? legacy.sideOffset ?? 8 };
});

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

const resolvedSide = ref<PopoverSide>(placementInfo.value.side);
const resolvedAlign = ref<PopoverAlign>(placementInfo.value.align);

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
  const { side: preferredSide, align, offset } = placementInfo.value;

  // 翻转与贴边都交给共享的浮层几何，口径与 reborn-tooltip 保持一致
  const { side, position } = resolveFloatingPosition({
    triggerRect: rect,
    size,
    side: preferredSide,
    align,
    offset,
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

// 不关闭的滚动（closeOnScroll 关掉、或滚动的是与触发器无关的容器）仍要让气泡跟着触发器重新定位
onMounted(() => {
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
});

onUnmounted(() => {
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
  if (hoverTimer) clearTimeout(hoverTimer);
  if (resizeObserver) resizeObserver.disconnect();
});

// 方位在打开期间改变（如演练场切换 placement）时立即重新定位
watch(placementInfo, () => {
  if (open.value) updatePosition();
});

watch(open, (value) => {
  if (!value) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => calculatePosition());
  });
});

const arrowStyle = computed(() => {
  const side = resolvedSide.value;
  // 12px 方块旋转 45° 后中心压在面板 1px 描边的中线上，箭头的两条描边与面板描边无缝相接
  // 保留朝内的半块背景覆盖面板描边，裁成三角形会在箭头底边留下分割线
  const offsetScale = "-6.5px";

  if (side === "bottom") {
    return {
      top: offsetScale,
      left: arrowPosition.value.x,
      transform: "translateX(-50%) rotate(45deg)",
      borderBottomWidth: "0",
      borderRightWidth: "0",
    };
  }

  if (side === "top") {
    return {
      bottom: offsetScale,
      left: arrowPosition.value.x,
      transform: "translateX(-50%) rotate(45deg)",
      borderTopWidth: "0",
      borderLeftWidth: "0",
    };
  }

  if (side === "left") {
    return {
      right: offsetScale,
      top: arrowPosition.value.y,
      transform: "translateY(-50%) rotate(45deg)",
      borderBottomWidth: "0",
      borderLeftWidth: "0",
    };
  }

  return {
    left: offsetScale,
    top: arrowPosition.value.y,
    transform: "translateY(-50%) rotate(45deg)",
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
            :style="{ margin: `-${placementInfo.offset}px` }"
          />

          <div v-if="arrow" :class="ui.arrow()" :style="arrowStyle" />
        </div>
      </RebornTransition>
    </Teleport>
  </div>
</template>
