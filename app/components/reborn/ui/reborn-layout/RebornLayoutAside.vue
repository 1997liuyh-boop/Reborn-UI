<script lang="ts">
import type { ClassValue } from "clsx";
import type { VNode } from "vue";

/**
 * RebornLayoutAside 属性定义
 */
export interface LayoutAsideProps {
  /**
   * 侧边栏宽度，接受任意合法 CSS 长度
   * @defaultValue '300px'
   */
  width?: string;
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
  }>;
}

/**
 * RebornLayoutAside 插槽定义
 */
export interface LayoutAsideSlots {
  /** 侧边栏内容 */
  default?(props?: {}): VNode[];
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { LAYOUT_ASIDE_WIDTH_VAR } from "./reborn-layout.config";

defineOptions({ name: "RebornLayoutAside" });

const props = withDefaults(defineProps<LayoutAsideProps>(), {
  width: "300px",
  as: "aside",
});

defineSlots<LayoutAsideSlots>();

const variant = tv(theme);

const ui = computed(() => {
  const styles = variant();
  return {
    aside: (opts?: { class?: any }) =>
      styles.aside({
        class: cn(opts?.class, props.ui?.aside, props.class),
      }),
  };
});

/** 宽度经 CSS 变量下发，配合配置里的 w-[var(...)] 生效 */
const rootStyle = computed(() => ({ [LAYOUT_ASIDE_WIDTH_VAR]: props.width }));
</script>

<template>
  <component :is="as" :class="ui.aside()" :style="rootStyle">
    <slot />
  </component>
</template>
