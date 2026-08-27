<script lang="ts">
import type { ClassValue } from "clsx";
import type { VNode } from "vue";

/**
 * RebornLayoutHeader 属性定义
 */
export interface LayoutHeaderProps {
  /**
   * 顶栏高度，接受任意合法 CSS 长度
   * @defaultValue '60px'
   */
  height?: string;
  /**
   * 渲染的 HTML 元素或组件
   * @defaultValue 'header'
   */
  as?: any;
  /** 自定义类名 */
  class?: any;
  /** 组件 UI 微调配置 */
  ui?: Partial<{
    header: ClassValue;
  }>;
}

/**
 * RebornLayoutHeader 插槽定义
 */
export interface LayoutHeaderSlots {
  /** 顶栏内容 */
  default?(props?: {}): VNode[];
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { LAYOUT_HEADER_HEIGHT_VAR } from "./reborn-layout.config";

defineOptions({ name: "RebornLayoutHeader" });

const props = withDefaults(defineProps<LayoutHeaderProps>(), {
  height: "60px",
  as: "header",
});

defineSlots<LayoutHeaderSlots>();

const variant = tv(theme);

const ui = computed(() => {
  const styles = variant();
  return {
    header: (opts?: { class?: any }) =>
      styles.header({
        class: cn(opts?.class, props.ui?.header, props.class),
      }),
  };
});

/** 高度经 CSS 变量下发，配合配置里的 h-[var(...)] 生效 */
const rootStyle = computed(() => ({ [LAYOUT_HEADER_HEIGHT_VAR]: props.height }));
</script>

<template>
  <component :is="as" :class="ui.header()" :style="rootStyle">
    <slot />
  </component>
</template>
