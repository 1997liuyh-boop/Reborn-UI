<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { cn } from "~/lib/utils";
import theme from "./reborn-menu.config";

// --- 类型定义 ---

/** 菜单项标识值类型 */
type MenuValue = string;
/** 二级菜单展开方式：平铺展开 / 浮层展开 */
type ExpandType = "normal" | "popup";
/** 菜单显示模式：水平或垂直 */
type MenuMode = "horizontal" | "vertical";
/** 菜单触发方式：悬浮或点击 */
type MenuTrigger = "hover" | "click";
/** 菜单主题颜色 */
type MenuColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

/**
 * 菜单组件属性接口
 */
export interface RebornMenuProps {
  /** 菜单模式 */
  mode?: MenuMode;
  /** 是否折叠菜单 */
  collapse?: boolean;
  /** 默认展开的子菜单索引数组 */
  defaultOpeneds?: string[];
  /** 是否只保持一个子菜单的展开（手风琴模式） */
  uniqueOpened?: boolean;
  /** 子菜单打开的触发方式 (仅水平模式或折叠时生效) */
  menuTrigger?: MenuTrigger;
  /** 是否使用 vue-router 的模式，启用后 index 会作为 path 进行路由跳转 */
  router?: boolean;
  /** 是否开启折叠过渡动画 */
  collapseTransition?: boolean;
  /** 二级菜单展开方式：平铺展开(normal) / 浮层展开(popup) */
  expandType?: ExpandType;
  /** 同级别是否互斥展开，即同级只有一个子菜单展开 */
  expandMutex?: boolean;
  /** 触发方式为点击时，点击菜单外部是否关闭展开的子菜单 */
  closeOnClickOutside?: boolean;
  /** 主题颜色 */
  color?: MenuColor;
  /** 菜单背景色 */
  backgroundColor?: string;
  /** 菜单文字颜色 */
  textColor?: string;
  /** 激活状态的文字颜色 */
  activeTextColor?: string;
  /** 自定义类名 */
  class?: any;
  /** UI 局部重写配置 */
  ui?: Partial<{
    root: ClassValue;
    menu: ClassValue;
    menuItem: ClassValue;
    menuItemContent: ClassValue;
    menuItemTitle: ClassValue;
    menuItemIcon: ClassValue;
    menuItemArrow: ClassValue;
    subMenu: ClassValue;
    subMenuPopup: ClassValue;
    subMenuContent: ClassValue;
    menuItemGroup: ClassValue;
    menuItemGroupTitle: ClassValue;
  }>;
}

// --- 状态与属性 ---

/** 当前激活的菜单项路径 */
const active = defineModel<string[]>("active", {
  default: () => [],
});

/** 子菜单展开的导航集合，支持 v-model:expanded（等价于 .sync 修饰符） */
const expanded = defineModel<MenuValue[]>("expanded", {
  default: () => [],
});

const props = withDefaults(defineProps<RebornMenuProps>(), {
  mode: "vertical",
  collapse: false,
  expandType: "popup",
  defaultOpeneds: () => [],
  uniqueOpened: false,
  expandMutex: false,
  closeOnClickOutside: true,
  menuTrigger: "hover",
  router: false,
  collapseTransition: true,
  color: "primary",
  backgroundColor: "",
  textColor: "",
  activeTextColor: "",
  class: undefined,
  ui: () => ({}),
});

// --- 事件定义 ---

const emit = defineEmits<{
  /** 菜单项被选中时触发 */
  (e: "select", index: string, indexPath: string[]): void;
  /** 子菜单展开时触发 */
  (e: "open", index: string, indexPath: string[]): void;
  /** 子菜单收起时触发 */
  (e: "close", index: string, indexPath: string[]): void;
}>();

const b = theme;
const appRouter = useRouter();

/** 当前展开的子菜单索引列表（优先使用 expanded 模型值，否则使用 defaultOpeneds） */
const openedMenus = ref<MenuValue[]>(
  expanded.value.length > 0 ? [...expanded.value] : [...props.defaultOpeneds]
);
/** 记录已展开子菜单的完整路径关系：记录 key 为菜单 index，value 为路径数组 */
const openedMenuPaths = ref<Record<string, string[]>>({});
/** 记录延时关闭的定时器，用于防抖或平滑过渡 */
const closeTimers = ref<Set<ReturnType<typeof setTimeout>>>(new Set());

// --- 辅助方法 ---

/**
 * 清除所有的关闭定时器
 */
function clearCloseTimers() {
  closeTimers.value.forEach((timer) => clearTimeout(timer));
  closeTimers.value.clear();
}

/**
 * 注册一个关闭定时器
 * @param timer 定时器实例
 */
function registerCloseTimer(timer: ReturnType<typeof setTimeout>) {
  closeTimers.value.add(timer);
}

/**
 * 判断 targetPath 是否以 parentPath 为前缀（即 targetPath 是否为 parentPath 的子级路径）
 * @param parentPath 父路径数组
 * @param targetPath 目标路径数组
 */
function isPathPrefix(parentPath: string[], targetPath: string[]) {
  if (parentPath.length > targetPath.length) return false;
  return parentPath.every((segment, index) => targetPath[index] === segment);
}

// --- 样式计算 ---

/** 获取用户传入的 UI 覆盖配置 */
const overrides = computed(() => props.ui || {});

/** 
 * 根据状态计算各子组件的样式生成函数
 */
const ui = computed(() => {
  const styles = b({
    mode: props.mode,
    collapse: props.collapse,
    color: props.color,
    expandType: props.expandType,
  });

  return {
    root: (opts?: { class?: any }) =>
      styles.root({ class: cn(opts?.class, overrides.value.root) }),
    menu: (opts?: { class?: any }) =>
      styles.menu({ class: cn(opts?.class, overrides.value.menu) }),
    menuItem: (opts?: {
      class?: any;
      active?: boolean;
      color?: MenuColor;
      opened?: boolean;
      disabled?: boolean;
    }) =>
      styles.menuItem({
        active: opts?.active,
        color: opts?.color,
        opened: opts?.opened,
        disabled: opts?.disabled,
        class: cn(opts?.class, overrides.value.menuItem),
      }),
    menuItemContent: (opts?: { class?: any }) =>
      styles.menuItemContent({ class: cn(opts?.class, overrides.value.menuItemContent) }),
    menuItemTitle: (opts?: { class?: any }) =>
      styles.menuItemTitle({ class: cn(opts?.class, overrides.value.menuItemTitle) }),
    menuItemIcon: (opts?: { class?: any }) =>
      styles.menuItemIcon({ class: cn(opts?.class, overrides.value.menuItemIcon) }),
    menuItemArrow: (opts?: { class?: any; opened?: boolean }) =>
      styles.menuItemArrow({
        opened: opts?.opened,
        class: cn(opts?.class, overrides.value.menuItemArrow),
      }),
    subMenu: (opts?: { class?: any }) =>
      styles.subMenu({ class: cn(opts?.class, overrides.value.subMenu) }),
    subMenuPopup: (opts?: { class?: any }) =>
      styles.subMenuPopup({ class: cn(opts?.class, overrides.value.subMenuPopup) }),
    subMenuContent: (opts?: { class?: any }) =>
      styles.subMenuContent({ class: cn(opts?.class, overrides.value.subMenuContent) }),
    menuItemGroup: (opts?: { class?: any }) =>
      styles.menuItemGroup({ class: cn(opts?.class, overrides.value.menuItemGroup) }),
    menuItemGroupTitle: (opts?: { class?: any }) =>
      styles.menuItemGroupTitle({ class: cn(opts?.class, overrides.value.menuItemGroupTitle) }),
  };
});

/** 菜单内联样式（背景色与文字色） */
const menuStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
  color: props.textColor,
}));

// --- 核心交互逻辑 ---

/**
 * 选中菜单项的回调
 * @param index 选中项的标识
 * @param indexPath 选中项的路径
 */
function handleSelect(index: string, indexPath: string[]) {
  active.value = [...indexPath];
  clearCloseTimers();
  // 选中某项时，收起其他子菜单
  openedMenus.value = [];
  openedMenuPaths.value = {};
  expanded.value = [];
  emit("select", index, indexPath);

  // 如果开启了 router 模式，则进行路由跳转
  if (props.router && index) {
    void appRouter.push(index);
  }
}

/**
 * 展开子菜单的回调
 * @param index 展开项的标识
 * @param indexPath 展开项的路径
 */
function handleOpen(index: string, indexPath: string[]) {
  openedMenuPaths.value[index] = [...indexPath];

  // expandMutex 同级别互斥：关闭同级其他展开菜单
  if (props.expandMutex) {
    const parentPath = indexPath.slice(0, -1);
    const toClose: string[] = [];
    for (const [openedIndex, openedPath] of Object.entries(openedMenuPaths.value)) {
      if (openedIndex === index) continue;
      const openedParent = openedPath.slice(0, -1);
      if (
        openedParent.length === parentPath.length &&
        openedParent.every((seg, i) => seg === parentPath[i])
      ) {
        toClose.push(openedIndex);
      }
    }
    for (const idx of toClose) {
      delete openedMenuPaths.value[idx];
    }
    openedMenus.value = openedMenus.value.filter((idx) => !toClose.includes(idx));
  }

  if (props.menuTrigger === "hover" || props.uniqueOpened) {
    // 悬浮触发或开启手风琴模式时，只保留当前路径的展开状态
    openedMenus.value = [...indexPath];
  } else {
    // 否则将新展开的项加入到展开列表中
    openedMenus.value = Array.from(new Set([...openedMenus.value, ...indexPath]));
  }

  // 同步到 expanded 模型
  expanded.value = [...openedMenus.value];

  emit("open", index, indexPath);
}

/**
 * 收起子菜单的回调
 * @param index 收起项的标识
 * @param indexPath 收起项的路径
 */
function handleClose(index: string, indexPath: string[]) {
  const currentPath = openedMenuPaths.value[index] ?? indexPath;

  // 过滤掉当前菜单及其所有子菜单的展开状态
  openedMenus.value = openedMenus.value.filter((openedIndex) => {
    const openedPath = openedMenuPaths.value[openedIndex] ?? [openedIndex];
    return !isPathPrefix(currentPath, openedPath);
  });

  // 清除已收起菜单的路径记录
  Object.keys(openedMenuPaths.value).forEach((openedIndex) => {
    const openedPath = openedMenuPaths.value[openedIndex];
    if (openedPath && isPathPrefix(currentPath, openedPath)) {
      delete openedMenuPaths.value[openedIndex];
    }
  });

  // 同步到 expanded 模型
  expanded.value = [...openedMenus.value];

  emit("close", index, indexPath);
}

/**
 * 切换子菜单展开/收起状态
 * @param index 操作项的标识
 * @param indexPath 操作项的路径
 */
function toggleSubMenu(index: string, indexPath: string[]) {
  if (openedMenus.value.includes(index)) {
    handleClose(index, indexPath);
  } else {
    handleOpen(index, indexPath);
  }
}

/** 监听外部 expanded 模型变化，同步展开状态 */
watch(expanded, (val) => {
  openedMenus.value = [...val];
  // 重建路径映射
  const newPaths: Record<string, string[]> = {};
  for (const idx of val) {
    if (openedMenuPaths.value[idx]) {
      newPaths[idx] = [...openedMenuPaths.value[idx]];
    } else {
      newPaths[idx] = [idx];
    }
  }
  openedMenuPaths.value = newPaths;
}, { deep: true });

// --- 点击外部关闭 ---

/** 菜单根元素引用，用于判断点击是否在菜单内部 */
const rootRef = ref<HTMLElement | null>(null);

/** 点击菜单外部时关闭所有展开的子菜单 */
function handleClickOutside(event: MouseEvent) {
  if (!props.closeOnClickOutside) return;
  if (props.menuTrigger !== "click") return;
  if (!rootRef.value) return;
  if (openedMenus.value.length === 0) return;

  const target = event.target as HTMLElement | null;
  if (!target) return;

  // 点击在菜单内部则不处理
  if (rootRef.value.contains(target)) return;

  // 关闭所有展开的子菜单
  openedMenus.value = [];
  openedMenuPaths.value = {};
  expanded.value = [];
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside, true);
});

// --- 依赖注入与方法暴露 ---

/**
 * 向下提供给子组件的上下文和方法
 */
provide("reborn-menu", {
  active,
  openedMenus,
  parentIndexPath: computed(() => [] as string[]),
  mode: computed(() => props.mode),
  collapse: computed(() => props.collapse),
  menuTrigger: computed(() => props.menuTrigger),
  color: computed(() => props.color),
  backgroundColor: computed(() => props.backgroundColor),
  textColor: computed(() => props.textColor),
  activeTextColor: computed(() => props.activeTextColor),
  expandType: computed(() => props.expandType),
  expandMutex: computed(() => props.expandMutex),
  ui,
  handleSelect,
  handleOpen,
  handleClose,
  toggleSubMenu,
  clearCloseTimer: clearCloseTimers,
  registerCloseTimer,
  /** 通知父级需要重新计算高度（根级无需操作） */
  notifyResize: () => {},
});

/**
 * 暴露给外部调用的实例方法
 */
defineExpose({
  /** 展开指定菜单 */
  open: (index: string) => {
    handleOpen(index, [index]);
  },
  /** 收起指定菜单 */
  close: (index: string) => {
    handleClose(index, [index]);
  },
  /** 更新当前激活的菜单路径 */
  updateActive: (indexPath: string[]) => {
    active.value = [...indexPath];
  },
});
</script>

<template>
  <div ref="rootRef" :class="ui.root({ class: props.class })">
    <ul :class="ui.menu()" :style="menuStyle" role="menu">
      <slot />
    </ul>
  </div>
</template>
