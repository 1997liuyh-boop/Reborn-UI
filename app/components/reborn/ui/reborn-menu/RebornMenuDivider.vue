<script setup lang="ts">
import type { MenuContext, MenuUI } from "./reborn-menu.config";
import { computed, inject } from "vue";
import { cn } from "~/lib/utils";
import theme, { MENU_INJECTION_KEY } from "./reborn-menu.config";

/**
 * 菜单分割线组件属性接口
 */
export interface RebornMenuDividerProps {
  /** 是否为虚线样式 */
  dashed?: boolean;
  /** 自定义类名 */
  class?: any;
  /** 内置 UI 部件的类名覆盖 */
  ui?: MenuUI;
}

const props = withDefaults(defineProps<RebornMenuDividerProps>(), {
  dashed: false,
  class: undefined,
  ui: () => ({}),
});

const menuContext = inject<MenuContext>(MENU_INJECTION_KEY);

/**
 * 分割线样式。
 * 实线/虚线是本组件自身的状态，需要直接取 theme 求值，
 * 不能复用根节点下发的 ui（那份是按根节点属性算出来的，拿不到逐条的 dashed）。
 */
const dividerClass = computed(() => {
  const styles = theme({ dashed: props.dashed });
  // 根节点的全局覆盖优先级低于本组件的局部覆盖
  const rootOverrides = menuContext?.uiOverrides.value ?? {};
  const localOverrides = props.ui || {};

  return cn(
    styles.menuDivider(),
    props.class,
    rootOverrides.menuDivider,
    localOverrides.menuDivider,
  );
});
</script>

<template>
  <li
    :class="dividerClass"
    role="separator"
    aria-orientation="horizontal"
  />
</template>
