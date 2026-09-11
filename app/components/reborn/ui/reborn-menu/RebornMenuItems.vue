<script setup lang="ts">
import type {
  ItemType,
  MenuContext,
  MenuItemGroupType,
  MenuItemType,
  SubMenuType,
} from "./reborn-menu.config";
import { computed, inject } from "vue";
import { isMenuDivider, isMenuGroup, isSubMenu, MENU_INJECTION_KEY } from "./reborn-menu.config";
// RebornMenuItem / RebornSubMenu / RebornMenuItemGroup / RebornMenuDivider
// 由 Nuxt 全局自动注册，不写静态 import 以避免递归组件的 ESM 循环依赖。

/**
 * 菜单数据渲染器属性接口。
 * 这是库内部使用的递归渲染组件，把 items 配置式数据展开成对应的菜单子组件。
 */
export interface RebornMenuItemsProps {
  /** 待渲染的菜单数据 */
  items: ItemType[];
}

const props = defineProps<RebornMenuItemsProps>();

const menuContext = inject<MenuContext>(MENU_INJECTION_KEY);

/**
 * 渲染节点：把 ItemType 联合类型转成带 kind 判别字段的结构。
 * 之所以在脚本里先归一化，而不是在模板里直接调类型守卫，
 * 是因为字面量判别字段能让模板侧稳定收窄，避免大量 as 断言。
 */
type RenderNode =
  | { kind: "divider"; id: string; dashed: boolean }
  | { kind: "group"; id: string; data: MenuItemGroupType }
  | { kind: "submenu"; id: string; data: SubMenuType }
  | { kind: "item"; id: string; data: MenuItemType };

const nodes = computed<RenderNode[]>(() =>
  props.items.map((item, index) => {
    // 分组与分割线的 key 允许缺省，回退用下标保证 v-for 键稳定
    const id = item.key ?? `__reborn_menu_node_${index}__`;

    if (isMenuDivider(item)) return { kind: "divider", id, dashed: item.dashed ?? false };
    if (isMenuGroup(item)) return { kind: "group", id, data: item };
    if (isSubMenu(item)) return { kind: "submenu", id, data: item };
    return { kind: "item", id, data: item };
  }),
);

/** 当前所在层是否为一级水平菜单 */
const isRootHorizontal = computed(
  () =>
    menuContext?.mode.value === "horizontal" &&
    (menuContext?.parentIndexPath.value ?? []).length === 0,
);

/**
 * Ant Design 的 popupOffset 是 [x, y] 双轴，而浮层只需要与触发元素之间的单向间距：
 * 一级水平菜单的浮层向下弹出，取 y；其余情况向侧方弹出，取 x。
 */
function popperOffsetOf(item: SubMenuType) {
  if (!item.popupOffset) return undefined;
  return isRootHorizontal.value ? item.popupOffset[1] : item.popupOffset[0];
}
</script>

<template>
  <template
    v-for="node in nodes"
    :key="node.id"
  >
    <!-- 分割线 -->
    <RebornMenuDivider
      v-if="node.kind === 'divider'"
      :dashed="node.dashed"
    />

    <!-- 分组：标题 + 递归渲染子级 -->
    <RebornMenuItemGroup
      v-else-if="node.kind === 'group'"
      :title="node.data.label"
      :items="node.data.children"
    />

    <!-- 子菜单：递归渲染子级 -->
    <RebornSubMenu
      v-else-if="node.kind === 'submenu'"
      :index="node.data.key"
      :disabled="node.data.disabled"
      :items="node.data.children"
      :popper-class="node.data.popupClassName"
      :popper-offset="popperOffsetOf(node.data)"
      @title-click="
        (event: MouseEvent) => node.data.onTitleClick?.({ key: node.data.key, domEvent: event })
      "
    >
      <template
        v-if="node.data.icon"
        #icon
      >
        <Icon
          :name="node.data.icon"
          class="size-4"
        />
      </template>
      <template #title>{{ node.data.label ?? node.data.key }}</template>
    </RebornSubMenu>

    <!-- 普通菜单项 -->
    <RebornMenuItem
      v-else
      :index="node.data.key"
      :route="node.data.route"
      :disabled="node.data.disabled"
      :danger="node.data.danger"
      :extra="node.data.extra"
      :title="node.data.title"
    >
      <template
        v-if="node.data.icon"
        #icon
      >
        <Icon
          :name="node.data.icon"
          class="size-4"
        />
      </template>
      {{ node.data.label ?? node.data.key }}
    </RebornMenuItem>
  </template>
</template>
