<script setup lang="ts">
import type { ItemType, MenuContext, MenuUI } from "./reborn-menu.config";
import { computed, inject } from "vue";
import { cn } from "~/lib/utils";
import { MENU_INJECTION_KEY } from "./reborn-menu.config";
// RebornMenuItems 由 Nuxt 全局自动注册，不写静态 import 以避免递归组件的 ESM 循环依赖。

/**
 * 菜单分组组件属性接口
 */
export interface RebornMenuItemGroupProps {
  /** 组标题 */
  title?: string;
  /** 分组下的菜单数据，传入后由组件递归渲染，无需再手写子条目 */
  items?: ItemType[];
  /** 自定义类名 */
  class?: any;
  /** 内置 UI 部件的类名覆盖 */
  ui?: MenuUI;
}

const props = withDefaults(defineProps<RebornMenuItemGroupProps>(), {
  title: "",
  items: undefined,
  class: undefined,
  ui: () => ({}),
});

const menuContext = inject<MenuContext>(MENU_INJECTION_KEY);

/**
 * ⚠️ 根因：旧实现写成 `const b = (opts?: any) => {...}` 的工厂函数，
 * 外层形参 opts 被内层箭头函数的同名形参完全遮蔽（永远拿不到值），
 * 而且模板里每次渲染都调 `b()` 重建一遍样式对象，与兄弟组件的写法也不一致。
 * ✅ 修复：改成 computed，与 RebornMenuItem / RebornSubMenu 保持同一范式。
 */
const groupUi = computed(() => {
  const baseStyles = menuContext?.ui.value ?? {};
  // 根节点的全局覆盖优先级低于本组件的局部覆盖
  const rootOverrides = menuContext?.uiOverrides.value ?? {};
  const localOverrides = props.ui || {};

  return {
    menuItemGroup: (opts?: { class?: any }) =>
      cn(
        baseStyles.menuItemGroup?.(),
        opts?.class,
        rootOverrides.menuItemGroup,
        localOverrides.menuItemGroup,
      ),
    menuItemGroupContent: (opts?: { class?: any }) =>
      cn(
        baseStyles.menuItemGroupContent?.(),
        opts?.class,
        rootOverrides.menuItemGroupContent,
        localOverrides.menuItemGroupContent,
      ),
    menuItemGroupTitle: (opts?: { class?: any }) =>
      cn(
        baseStyles.menuItemGroupTitle?.(),
        opts?.class,
        rootOverrides.menuItemGroupTitle,
        localOverrides.menuItemGroupTitle,
      ),
  };
});
</script>

<template>
  <li
    :class="groupUi.menuItemGroup({ class: props.class })"
    role="group"
  >
    <div :class="groupUi.menuItemGroupTitle()">
      <slot name="title">{{ title }}</slot>
    </div>
    <ul
      role="menu"
      :class="groupUi.menuItemGroupContent()"
    >
      <RebornMenuItems
        v-if="props.items?.length"
        :items="props.items"
      />
      <slot v-else />
    </ul>
  </li>
</template>
