<script setup lang="ts">
import type { FloatingPoint } from "~/lib/floating";
import type { Placement } from "~/lib/placement";
import { defaultWindow, useEventListener } from "@vueuse/core";
import { computed, getCurrentInstance, onBeforeUpdate, onDeactivated, onUnmounted, shallowRef, useTemplateRef, watch } from "vue";
import { useFloatingDismiss } from "~/composables/useFloatingDismiss";
import { useFloatingHost } from "~/composables/useFloatingHost";
import { getArrowCenter, resolveFloatingPosition } from "~/lib/floating";
import { FLOATING_ARROW_DEPTH, FLOATING_ARROW_LENGTH, getFloatingArrowShadow } from "~/lib/floating-arrow";
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
  // 含 Boolean 的属性必须显式给 undefined，否则未传会被强转成 false，「未传」与「传了 false」无法区分
  defaultOpen: undefined,
});

/**
 * 受控显隐（v-model:open），变化时派发 update:open。
 * 未传保持 undefined，由 internalOpen 走非受控逻辑；含 Boolean 的模型必须显式给 undefined 默认值。
 */
defineModel<boolean>("open", { default: undefined });

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
   * 气泡与触发器的间距（px），显示箭头时从箭头尖端计算
   * @defaultValue 4
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
  /** 非受控模式的初始显隐；同时传了 v-model:open 时以 open 为准 */
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

const instance = getCurrentInstance()!;
const appProperties = instance.appContext.config.globalProperties;
/** 父级是否在 vnode 上写了 open：写了就由父级持有显隐 */
function isOpenBound() {
  return Object.hasOwn(instance.vnode.props ?? {}, "open");
}
/** 显隐归属只存布尔结果，变化才触发依赖 */
const openBound = shallowRef(isOpenBound());
onBeforeUpdate(() => {
  openBound.value = isOpenBound();
});
/** 实际显隐：初值取 open，其次 defaultOpen */
const internalOpen = shallowRef((instance.props.open as boolean | undefined) ?? props.defaultOpen ?? false);

/**
 * 父级传入的 open 变化时同步。读父级原始值而不是 defineModel 的本地缓存：只传 :open 不接更新事件时
 * useModel 会改写本地缓存，读它就成了「只读绑定点了照样变」。显式 undefined 不覆盖当前显隐（与 UniApp 端的差异见文档）。
 */
watch(() => instance.props.open as boolean | undefined, (v) => {
  if (v !== undefined) internalOpen.value = v;
});

const open = computed({
  get: () => internalOpen.value,
  set: (value) => {
    // 显隐归父级时只派发 update:open，等父级回写再同步；父级不回写（只传值或拒收）就保持父值，与 UniApp 端一致
    // 直接派发而不写 defineModel：非受控时写进它本地缓存的值会成为受控后「同值不派发」的去重基准
    if (!openBound.value) internalOpen.value = value;
    instance.emit("update:open", value);
  },
});

const wrapperRef = useTemplateRef<HTMLElement>("wrapperRef");
const triggerRef = useTemplateRef<HTMLElement>("triggerRef");
const contentRefComponent = useTemplateRef<{ el?: HTMLElement }>("contentRefComponent");
const contentRef = computed(() => contentRefComponent.value?.el as HTMLElement | undefined);

let hoverCount = 0;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

/** 路由复用和缓存停用不会卸载气泡，离开页面时也要取消可能重新打开它的悬停任务。 */
function dismissPagePopover() {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = null;
  hoverCount = 0;
  if (open.value) open.value = false;
}

// 可选读取 Vue Router 的响应式路由，普通 Vue 应用无需安装路由也能使用气泡。
watch(() => appProperties?.$route?.fullPath, dismissPagePopover);
onDeactivated(dismissPagePopover);

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
// 所在弹窗或抽屉关闭时一并收起：气泡卡片不响应 Esc，按 Esc 关掉不销毁内容的弹窗后它会留在页面上
useFloatingHost({ open: () => open.value, onHidden: () => { open.value = false; } });

/** 解析后的方位：placement 优先，未传时回落到旧的 content 对象，都没有则在下方居中 */
const placementInfo = computed(() => {
  const legacy = props.content ?? {};
  const { side, align } = props.placement
    ? resolvePlacement(props.placement)
    : { side: legacy.side ?? "bottom", align: legacy.align ?? "center" };
  return { side, align, offset: props.sideOffset ?? legacy.sideOffset ?? 4 };
});

/** 上下方向起止对齐时，箭头中心距面板端部 25px。 */
const ARROW_INSET = 25;
const ARROW_HEIGHT = FLOATING_ARROW_DEPTH;
/** 根部嵌入面板 2px，遮住曲线两端的平直边与抗锯齿接缝。 */
const ARROW_OVERLAP = 2;
/** 定位与悬停桥接只计箭头露出部分，sideOffset 始终表示可见间隙。 */
const panelOffset = computed(() => placementInfo.value.offset + (props.arrow ? ARROW_HEIGHT - ARROW_OVERLAP : 0));

const style = shallowRef<Record<string, string>>({
  left: "0px",
  top: "0px",
});

const resolvedSide = shallowRef<PopoverSide>(placementInfo.value.side);
const resolvedAlign = shallowRef<PopoverAlign>(placementInfo.value.align);

const arrowPosition = shallowRef({
  x: "50%",
  y: "50%",
});

/**
 * 同步箭头在面板内的坐标。落点规则与 reborn-tooltip 一致：
 * 上下方向的 start / end 停在对齐端的内缩位置；左右方向始终指向触发器的高度中心。
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
      align: "center",
      // 侧向只预留半个底边，避免固定内缩量把矮触发器的中心挤偏。
      inset: isVertical ? ARROW_INSET : FLOATING_ARROW_LENGTH / 2,
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
  const { side: preferredSide, align } = placementInfo.value;

  // 翻转与贴边都交给共享的浮层几何，口径与 reborn-tooltip 保持一致
  const { side, position } = resolveFloatingPosition({
    triggerRect: rect,
    size,
    side: preferredSide,
    align,
    offset: panelOffset.value,
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

/** 面板实际阴影，箭头投影跟随 ui.content 的阴影覆盖。 */
const panelShadow = shallowRef("none");

const onBeforeEnter = (el: Element) => {
  calculatePosition(el as HTMLElement);
};

const onEnter = (el: Element) => {
  calculatePosition(el as HTMLElement);
  // 此时面板已插入文档；即使暂未显示箭头，也保留阴影以支持展开期间切换 arrow。
  const content = el.firstElementChild;
  if (content) panelShadow.value = getComputedStyle(content).boxShadow;
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

/**
 * 不关闭的滚动（closeOnScroll 关掉、或滚动的是与触发器无关的容器）仍要让气泡跟着触发器重新定位。
 * 监听目标随打开状态切换：关闭时返回 undefined 不注册，避免每个实例常驻捕获阶段的全局滚动监听。
 */
const openWindow = () => (open.value ? defaultWindow : undefined);
useEventListener(openWindow, "resize", updatePosition, { passive: true });
useEventListener(openWindow, "scroll", updatePosition, { capture: true, passive: true });

onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer);
  if (resizeObserver) resizeObserver.disconnect();
});

// 方位在打开期间改变（如演练场切换 placement）时立即重新定位
watch([placementInfo, () => props.arrow], () => {
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
  // 四向统一内嵌根部，实色箭头与投影底片共用这个偏移。
  const offset = `-${ARROW_HEIGHT - ARROW_OVERLAP}px`;

  if (side === "bottom") {
    return {
      top: offset,
      left: arrowPosition.value.x,
      transform: "translateX(-50%)",
    };
  }

  if (side === "top") {
    return {
      bottom: offset,
      left: arrowPosition.value.x,
      transform: "translateX(-50%)",
    };
  }

  if (side === "left") {
    return {
      right: offset,
      top: arrowPosition.value.y,
      transform: "translateY(-50%)",
    };
  }

  return {
    left: offset,
    top: arrowPosition.value.y,
    transform: "translateY(-50%)",
  };
});

/** 按裁切后的箭头轮廓投影，底片垫在面板后方，避免矩形阴影与接缝。 */
const arrowShadowStyle = computed(() => {
  return {
    ...arrowStyle.value,
    zIndex: "-1",
    filter: getFloatingArrowShadow(panelShadow.value),
    maskImage: "none",
    background: "transparent",
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
            :style="{ margin: `-${panelOffset}px` }"
          />

          <div v-if="arrow" :class="ui.arrow()" :style="arrowShadowStyle" aria-hidden="true">
            <div :class="ui.arrow()" :style="{ inset: 0 }" />
          </div>
          <div v-if="arrow" :class="ui.arrow()" :style="arrowStyle" data-floating-arrow aria-hidden="true" />
        </div>
      </RebornTransition>
    </Teleport>
  </div>
</template>
