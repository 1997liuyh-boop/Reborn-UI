<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { MenuContext, MenuUI } from "./reborn-menu.config";
import { computed, inject } from "vue";
import { cn } from "~/lib/utils";
import theme, { MENU_INJECTION_KEY, MENU_INLINE_INDENT } from "./reborn-menu.config";

/**
 * 菜单项组件属性接口
 */
export interface RebornMenuItemProps {
  /** 菜单项唯一标识，router 模式下缺省 route 时作为跳转路径 */
  index: string;
  /** 指定跳转地址，仅在菜单开启 router 模式时生效 */
  route?: RouteLocationRaw;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否为危险项（展示为错误色） */
  danger?: boolean;
  /** 右侧额外内容，常用于展示快捷键，也可用 extra 插槽自定义 */
  extra?: string;
  /** 原生 title 提示文案 */
  title?: string;
  /** 自定义类名 */
  class?: any;
  /** UI 局部重写配置 */
  ui?: MenuUI;
}

const props = withDefaults(defineProps<RebornMenuItemProps>(), {
  route: undefined,
  disabled: false,
  danger: false,
  extra: undefined,
  title: undefined,
  class: undefined,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 点击菜单项时触发 */
  (e: "click", index: string): void;
}>();

const menuContext = inject<MenuContext>(MENU_INJECTION_KEY);

const isActive = computed(() => menuContext?.selectedKeys.value.includes(props.index) ?? false);
const indexPath = computed(() => [...(menuContext?.parentIndexPath.value ?? []), props.index]);

/** 菜单层级：无父级路径即为一级菜单 */
const level = computed(() =>
  (menuContext?.parentIndexPath.value ?? []).length === 0 ? "root" : "sub",
);

const itemStyle = computed(() => {
  if (!menuContext) return undefined;

  const depth = menuContext.inlineDepth.value;
  // noIndent 打开时不下发左内边距，沿用 mode 变体给的 px-4，各级条目因此左对齐
  const indented = depth > 0 && !menuContext.noIndent.value;

  return {
    color: isActive.value ? menuContext.activeTextColor.value : menuContext.textColor.value,
    // 平铺展开的缩进由条目自身承担（容器 ul 不再缩进），悬浮态与选中态的背景块才能铺满整行。
    // depth 1 得 32px = 原容器 ml-4(16px) + 条目 px-4(16px)，与改造前观感一致。
    ...(indented ? { paddingLeft: `${MENU_INLINE_INDENT * (depth + 1)}px` } : {}),
  };
});

const itemUi = computed(() => {
  const styles = theme({
    mode: menuContext?.mode.value ?? "vertical",
    collapse: menuContext?.collapse.value ?? false,
    color: menuContext?.color.value ?? "primary",
    showActiveBackground: menuContext?.showActiveBackground.value ?? true,
    collapseTransition: menuContext?.collapseTransition.value ?? true,
    level: level.value,
    active: isActive.value,
    disabled: props.disabled,
    danger: props.danger,
  });

  // 根节点的全局覆盖优先级低于本组件的局部覆盖
  const rootOverrides = menuContext?.uiOverrides.value ?? {};
  const localOverrides = props.ui || {};

  return {
    menuItem: (opts?: { class?: any }) =>
      cn(
        styles.menuItem?.({
          active: isActive.value,
          color: menuContext?.color.value,
          disabled: props.disabled,
          danger: props.danger,
        }),
        opts?.class,
        rootOverrides.menuItem,
        localOverrides.menuItem,
      ),
    menuItemContent: (opts?: { class?: any }) =>
      cn(
        styles.menuItemContent?.(),
        opts?.class,
        rootOverrides.menuItemContent,
        localOverrides.menuItemContent,
      ),
    menuItemTitle: (opts?: { class?: any }) =>
      cn(
        styles.menuItemTitle?.(),
        opts?.class,
        rootOverrides.menuItemTitle,
        localOverrides.menuItemTitle,
      ),
    menuItemIcon: (opts?: { class?: any }) =>
      cn(
        styles.menuItemIcon?.(),
        opts?.class,
        rootOverrides.menuItemIcon,
        localOverrides.menuItemIcon,
      ),
    menuItemExtra: (opts?: { class?: any }) =>
      cn(
        styles.menuItemExtra?.(),
        opts?.class,
        rootOverrides.menuItemExtra,
        localOverrides.menuItemExtra,
      ),
  };
});

function handleClick() {
  if (props.disabled) return;

  emit("click", props.index);
  // ⚠️ 根因：route 属性此前只声明未使用，router 模式下永远拿 index 当路径，
  // 导致标识与路由路径无法解耦（例如 index 用业务编码、路径另有其名）。
  // ✅ 修复：把 route 透传给根节点，由根节点在 router 模式下优先使用它。
  menuContext?.handleSelect(props.index, indexPath.value, props.route);
}
</script>

<template>
  <li
    :class="itemUi.menuItem({ class: props.class })"
    :style="itemStyle"
    role="menuitem"
    :title="props.title"
    :aria-current="isActive ? 'page' : undefined"
    :aria-disabled="props.disabled || undefined"
    @click.stop="handleClick"
  >
    <div :class="itemUi.menuItemContent()">
      <div
        v-if="$slots.icon"
        :class="itemUi.menuItemIcon()"
      >
        <slot name="icon" />
      </div>
      <div :class="itemUi.menuItemTitle()">
        <slot />
      </div>
      <div
        v-if="$slots.extra || props.extra"
        :class="itemUi.menuItemExtra()"
      >
        <slot name="extra">{{ props.extra }}</slot>
      </div>
    </div>
  </li>
</template>
