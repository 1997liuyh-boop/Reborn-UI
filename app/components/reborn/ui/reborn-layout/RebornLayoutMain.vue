<script lang="ts">
import type { ClassValue } from "clsx";
import type { VNode } from "vue";

/**
 * RebornLayoutMain 属性定义
 */
export interface LayoutMainProps {
  /**
   * 渲染的 HTML 元素或组件
   * @defaultValue 'main'
   */
  as?: any;
  /** 自定义类名 */
  class?: any;
  /** 组件 UI 微调配置 */
  ui?: Partial<{
    main: ClassValue;
  }>;
}

/**
 * RebornLayoutMain 插槽定义
 */
export interface LayoutMainSlots {
  /** 主区域内容 */
  default?(props?: {}): VNode[];
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-layout.config";

defineOptions({ name: "RebornLayoutMain" });

const props = withDefaults(defineProps<LayoutMainProps>(), {
  as: "main",
});

defineSlots<LayoutMainSlots>();

const variant = tv(theme);

const ui = computed(() => {
  const styles = variant();
  return {
    main: (opts?: { class?: any }) =>
      styles.main({
        class: cn(opts?.class, props.ui?.main, props.class),
      }),
  };
});
</script>

<template>
  <component :is="as" :class="ui.main()">
    <slot />
  </component>
</template>
