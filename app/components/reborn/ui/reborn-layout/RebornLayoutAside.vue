<script lang="ts">
import type { ClassValue } from "clsx";
import type { CSSProperties, VNode } from "vue";
import type { LayoutSiderBreakpoint, LayoutSiderCollapseType } from "./reborn-layout.config";

/**
 * RebornLayoutAside（Sider）属性定义
 */
export interface LayoutAsideProps {
  /**
   * 展开宽度，数字视为 px，也接受任意合法 CSS 长度
   * @defaultValue 200
   */
  width?: number | string;
  /**
   * 是否可收起：开启后底部显示折叠触发器
   * @defaultValue false
   */
  collapsible?: boolean;
  /**
   * 收起宽度（px），设置为 0 时底部触发器替换为贴在侧边栏外缘的特殊触发器
   * @defaultValue 80
   */
  collapsedWidth?: number;
  /**
   * 非受控模式下是否默认收起
   * @defaultValue false
   */
  defaultCollapsed?: boolean;
  /**
   * 翻转折叠箭头方向与零宽触发器贴边，侧边栏放在右侧时使用
   * @defaultValue false
   */
  reverseArrow?: boolean;
  /**
   * 自定义触发器文字内容；设置为 null 时隐藏所有触发器（含零宽触发器），trigger 插槽优先于本属性
   */
  trigger?: string | null;
  /** collapsedWidth 为 0 时特殊触发器的行内样式 */
  zeroWidthTriggerStyle?: CSSProperties;
  /** 响应式断点：视口宽度低于断点时自动收起并触发 breakpoint 事件 */
  breakpoint?: LayoutSiderBreakpoint;
  /**
   * 渲染的 HTML 元素或组件
   * @defaultValue 'aside'
   */
  as?: any;
  /** 自定义类名 */
  class?: any;
  /** 组件 UI 微调配置 */
  ui?: Partial<{
    aside: ClassValue;
    asideContent: ClassValue;
    trigger: ClassValue;
    zeroTrigger: ClassValue;
  }>;
}

/**
 * RebornLayoutAside 插槽定义
 */
export interface LayoutAsideSlots {
  /** 侧边栏内容 */
  default?(props?: {}): VNode[];
  /** 自定义底部折叠触发器内容，替换默认箭头 */
  trigger?: (props: { collapsed: boolean }) => VNode[];
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { LAYOUT_ASIDE_WIDTH_VAR, layoutSiderBreakpoints } from "./reborn-layout.config";

defineOptions({ name: "RebornLayoutAside" });

const props = withDefaults(defineProps<LayoutAsideProps>(), {
  width: 200,
  collapsible: false,
  collapsedWidth: 80,
  defaultCollapsed: false,
  reverseArrow: false,
  trigger: undefined,
  as: "aside",
});

const emit = defineEmits<{
  /** 展开-收起时触发；type 区分点击触发器与响应式断点两种来源 */
  (e: "collapse", collapsed: boolean, type: LayoutSiderCollapseType): void;
  /** 视口跨过响应式断点时触发，broken 表示是否已低于断点 */
  (e: "breakpoint", broken: boolean): void;
}>();

defineSlots<LayoutAsideSlots>();

/** 受控收起状态；未传保持 undefined 走非受控逻辑，含 Boolean 的模型必须显式给 undefined 默认值 */
const collapsedModel = defineModel<boolean>("collapsed", { default: undefined });
/** 非受控内部状态，初始值取受控值或 defaultCollapsed */
const innerCollapsed = ref(collapsedModel.value ?? props.defaultCollapsed);
const isCollapsed = computed(() => collapsedModel.value ?? innerCollapsed.value);

function setCollapsed(value: boolean, type: LayoutSiderCollapseType) {
  if (value === isCollapsed.value) return;
  innerCollapsed.value = value;
  collapsedModel.value = value;
  emit("collapse", value, type);
}

/** collapsedWidth 为 0 启用零宽特殊触发器 */
const isZeroWidth = computed(() => props.collapsible && props.collapsedWidth === 0);
/** trigger 显式传 null 时隐藏所有触发器 */
const triggerHidden = computed(() => props.trigger === null);
const showBottomTrigger = computed(() => props.collapsible && !triggerHidden.value && !isZeroWidth.value);
const showZeroTrigger = computed(() => isZeroWidth.value && !triggerHidden.value);

/**
 * 折叠箭头方向：展开时指向收起方向。
 * 侧边栏在左（默认）展开显示「<」、收起显示「>」；reverseArrow 整体翻转。
 */
const arrowIcon = computed(() =>
  isCollapsed.value !== props.reverseArrow ? "lucide:chevron-right" : "lucide:chevron-left",
);

const variant = tv(theme);

const ui = computed(() => {
  const styles = variant({ zeroTriggerSide: props.reverseArrow ? "left" : "right" });
  return {
    aside: (opts?: { class?: any }) =>
      styles.aside({ class: cn(opts?.class, props.ui?.aside, props.class) }),
    asideContent: (opts?: { class?: any }) =>
      styles.asideContent({ class: cn(opts?.class, props.ui?.asideContent) }),
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, props.ui?.trigger) }),
    zeroTrigger: (opts?: { class?: any }) =>
      styles.zeroTrigger({ class: cn(opts?.class, props.ui?.zeroTrigger) }),
  };
});

/** 数字宽度视为 px */
function toCssWidth(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

/** 宽度经 CSS 变量下发，配合配置里的 w-[var(...)] 生效；收起时取 collapsedWidth */
const rootStyle = computed(() => ({
  [LAYOUT_ASIDE_WIDTH_VAR]: isCollapsed.value && props.collapsible
    ? `${props.collapsedWidth}px`
    : toCssWidth(props.width),
}));

// ─── 响应式断点 ───────────────────────────────────────────────
let mediaQuery: MediaQueryList | null = null;
let onMediaChange: ((event: MediaQueryListEvent) => void) | null = null;

function teardownBreakpoint() {
  if (mediaQuery && onMediaChange) mediaQuery.removeEventListener("change", onMediaChange);
  mediaQuery = null;
  onMediaChange = null;
}

watch(
  () => props.breakpoint,
  (breakpoint) => {
    teardownBreakpoint();
    if (!breakpoint || typeof window === "undefined") return;
    mediaQuery = window.matchMedia(`(max-width: ${layoutSiderBreakpoints[breakpoint] - 0.02}px)`);
    onMediaChange = (event) => {
      emit("breakpoint", event.matches);
      setCollapsed(event.matches, "responsive");
    };
    // 挂载时只在已低于断点的情况下收起，避免覆盖 defaultCollapsed 的展开态设定
    if (mediaQuery.matches) {
      emit("breakpoint", true);
      setCollapsed(true, "responsive");
    }
    mediaQuery.addEventListener("change", onMediaChange);
  },
  { immediate: true },
);

onBeforeUnmount(teardownBreakpoint);

defineExpose({
  /** 切换收起状态（等价于点击触发器） */
  toggle: () => setCollapsed(!isCollapsed.value, "clickTrigger"),
});
</script>

<template>
  <component :is="as" :class="ui.aside()" :style="rootStyle" :data-collapsed="collapsible ? isCollapsed : undefined">
    <div :class="ui.asideContent()">
      <slot />
    </div>

    <div
      v-if="showBottomTrigger" data-layout-trigger role="button" :aria-expanded="!isCollapsed" aria-label="折叠侧边栏"
      :class="ui.trigger()" @click="setCollapsed(!isCollapsed, 'clickTrigger')"
    >
      <slot name="trigger" :collapsed="isCollapsed">
        <template v-if="trigger">{{ trigger }}</template>
        <Icon v-else :name="arrowIcon" class="size-[16px]" />
      </slot>
    </div>

    <div
      v-else-if="showZeroTrigger" data-layout-zero-trigger role="button" :aria-expanded="!isCollapsed" aria-label="折叠侧边栏"
      :class="ui.zeroTrigger()" :style="zeroWidthTriggerStyle" @click="setCollapsed(!isCollapsed, 'clickTrigger')"
    >
      <slot name="trigger" :collapsed="isCollapsed">
        <template v-if="trigger">{{ trigger }}</template>
        <Icon v-else name="lucide:menu" class="size-[16px]" />
      </slot>
    </div>
  </component>
</template>
