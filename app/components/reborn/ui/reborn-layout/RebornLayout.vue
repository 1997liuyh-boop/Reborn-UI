<script lang="ts">
import type { ClassValue } from "clsx";
import type { VNode } from "vue";
import type { LayoutDirection } from "./reborn-layout.config";

/**
 * RebornLayout 属性定义
 */
export interface LayoutProps {
  /**
   * 排列方向。
   * 不传时自动判定：子元素中出现 Header 或 Footer 则纵向，否则横向。
   */
  direction?: LayoutDirection;
  /**
   * 容器渲染的 HTML 元素或组件
   * @defaultValue 'section'
   */
  as?: any;
  /** 自定义类名 */
  class?: any;
  /** 组件 UI 微调配置 */
  ui?: Partial<{
    root: ClassValue;
  }>;
}

/**
 * RebornLayout 插槽定义
 */
export interface LayoutSlots {
  /** 布局内容，直接子元素应为 Header / Aside / Main / Footer 中的一个或多个 */
  default?(props?: {}): VNode[];
}
</script>

<script setup lang="ts">
import { Fragment, useSlots } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { VERTICAL_LAYOUT_CHILDREN } from "./reborn-layout.config";

defineOptions({ name: "RebornLayout" });

const props = withDefaults(defineProps<LayoutProps>(), {
  as: "section",
});

defineSlots<LayoutSlots>();

const slots = useSlots();

const variant = tv(theme);

/**
 * 展平插槽节点。
 * v-for 与 <template> 包裹会把真实节点塞进 Fragment，
 * 不递归展开就会漏掉藏在里面的 Header / Footer，方向判定失效。
 */
function flattenVNodes(nodes: VNode[]): VNode[] {
  const result: VNode[] = [];
  for (const node of nodes) {
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flattenVNodes(node.children as VNode[]));
    } else {
      result.push(node);
    }
  }
  return result;
}

/**
 * 取组件名。
 * 优先读 defineOptions 显式声明的 name，
 * 回退到 SFC 编译期推断的 __name（未显式声明 name 时才有值）。
 */
function componentNameOf(node: VNode): string {
  const type = node.type as any;
  if (!type || typeof type === "string") return "";
  return type.name ?? type.__name ?? "";
}

/**
 * 判定排列方向。
 * 刻意做成每次渲染都重算的普通函数而非 computed：
 * 插槽节点不是响应式数据，computed 会把首帧结果缓存住，
 * 之后用 v-if 动态增删 Header 时方向不会跟着变。
 */
function resolveDirection(): LayoutDirection {
  if (props.direction) return props.direction;
  const nodes = flattenVNodes(slots.default?.() ?? []);
  return nodes.some((node) => VERTICAL_LAYOUT_CHILDREN.has(componentNameOf(node)))
    ? "vertical"
    : "horizontal";
}

/** 根节点类名 */
function rootClass() {
  return variant({ direction: resolveDirection() }).root({
    class: cn(props.ui?.root, props.class),
  });
}
</script>

<template>
  <component :is="as" :class="rootClass()">
    <slot />
  </component>
</template>
