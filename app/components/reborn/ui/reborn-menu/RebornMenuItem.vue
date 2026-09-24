<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { MenuContext, MenuUI } from "./reborn-menu.config";
import { computed, inject } from "vue";
import { cn } from "~/lib/utils";
import RebornTooltip from "../reborn-tooltip/RebornTooltip.vue";
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
  /**
   * 提示文案：展开态作为原生 title；折叠态作为一级菜单项的文字提示内容，
   * 缺省时提示内容取默认插槽（即菜单项标题）
   */
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

/**
 * 文字提示配置，为 false 表示不包提示。
 * 只有垂直模式的一级菜单项需要：折叠仅在垂直模式生效且只隐藏一级标题，子级都在浮层里完整展示标题。
 * 是否包提示不随 collapse 变化，折叠切换时 DOM 结构保持不变，标题的淡出过渡才不会因重建节点而丢失；
 * 展开态靠 tooltipDisabled 停用。
 */
const tooltipConfig = computed(() => {
  if (!menuContext || level.value !== "root" || menuContext.mode.value !== "vertical") return false;
  const config = menuContext.tooltip.value;
  if (config === false) return false;
  return { placement: "right" as const, ...config };
});

/**
 * 提示按触发器定位，而触发器位于 li 的内边距之内，直接用会让提示贴着图标弹出、压住条目自身的背景块。
 * 用与垂直模式 menuItem（px-4 py-3）等量的负外边距 + 内边距把触发器撑到 li 的边框盒：
 * 内容位置不变，提示改为对齐整行，悬停整行（含内边距）也都能触发。
 */
// max-w-none 用来覆盖提示默认的 max-w-full，否则宽度仍被卡在包裹层（内容盒）以内
const TOOLTIP_TRIGGER_CLASS = "flex max-w-none -mx-4 -my-3 px-4 py-3";

/** 仅折叠态启用提示 */
const tooltipDisabled = computed(() => !menuContext?.collapse.value);

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
    :title="tooltipConfig && !tooltipDisabled ? undefined : props.title"
    :aria-current="isActive ? 'page' : undefined"
    :aria-disabled="props.disabled || undefined"
    @click.stop="handleClick"
  >
    <!-- 提示包在 li 内而非 li 外，保住 ul > li 的结构与 role="menu" 语义；
         无提示时退化为 display: contents 的 div，不参与 li 的 flex 布局 -->
    <component
      :is="tooltipConfig ? RebornTooltip : 'div'"
      v-bind="tooltipConfig ? {
        ...tooltipConfig,
        disabled: tooltipDisabled,
        ui: { wrapper: 'block w-full min-w-0', trigger: TOOLTIP_TRIGGER_CLASS, ...tooltipConfig.ui },
      } : { class: 'contents' }"
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
      <template
        v-if="tooltipConfig"
        #content
      >
        <template v-if="props.title">
          {{ props.title }}
        </template>
        <slot v-else />
      </template>
    </component>
  </li>
</template>
