<script lang="ts">
import type { ClassValue } from "clsx";
import type { VNode } from "vue";

/**
 * RebornLayoutFooter 属性定义
 */
export interface LayoutFooterProps {
  /**
   * 底栏高度，接受任意合法 CSS 长度
   * @defaultValue '60px'
   */
  height?: string;
  /**
   * 渲染的 HTML 元素或组件
   * @defaultValue 'footer'
   */
  as?: any;
  /** 自定义类名 */
  class?: any;
  /** 组件 UI 微调配置 */
  ui?: Partial<{
    footer: ClassValue;
  }>;
}

/**
 * RebornLayoutFooter 插槽定义
 */
export interface LayoutFooterSlots {
  /** 底栏内容 */
  default?(props?: {}): VNode[];
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { LAYOUT_FOOTER_HEIGHT_VAR } from "./reborn-layout.config";

defineOptions({ name: "RebornLayoutFooter" });

const props = withDefaults(defineProps<LayoutFooterProps>(), {
  height: "60px",
  as: "footer",
});

defineSlots<LayoutFooterSlots>();

const variant = tv(theme);

const ui = computed(() => {
  const styles = variant();
  return {
    footer: (opts?: { class?: any }) =>
      styles.footer({
        class: cn(opts?.class, props.ui?.footer, props.class),
      }),
  };
});

/** 高度经 CSS 变量下发，配合配置里的 h-[var(...)] 生效 */
const rootStyle = computed(() => ({ [LAYOUT_FOOTER_HEIGHT_VAR]: props.height }));
</script>

<template>
  <component :is="as" :class="ui.footer()" :style="rootStyle">
    <slot />
  </component>
</template>
