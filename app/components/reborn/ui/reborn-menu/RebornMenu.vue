<script setup lang="ts">
import type { VNode } from "vue";
import type { RouteLocationRaw } from "vue-router";
import type {
  ExpandType,
  ItemType,
  MenuColor,
  MenuMode,
  MenuTrigger,
  MenuUI,
} from "./reborn-menu.config";
import {
  Comment,
  computed,
  Fragment,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  Text,
  useSlots,
  watch,
} from "vue";
import { cn } from "~/lib/utils";
import theme, { MENU_INJECTION_KEY } from "./reborn-menu.config";
// RebornMenuItems / RebornSubMenu 由 Nuxt 全局自动注册（nuxt.config 的 pathPrefix: false），
// 这里刻意不写静态 import：三个组件互为递归引用，静态导入会形成 ESM 循环依赖。

/** 菜单项标识值类型 */
type MenuValue = string;

const props = withDefaults(defineProps<RebornMenuProps>(), {
  mode: "vertical",
  items: undefined,
  collapse: false,
  expandType: "popup",
  defaultOpeneds: () => [],
  defaultExpandAll: false,
  uniqueOpened: false,
  expandMutex: false,
  closeOnClickOutside: true,
  menuTrigger: "hover",
  router: false,
  collapseTransition: true,
  noIndent: false,
  ellipsis: false,
  ellipsisIcon: "lucide:more-horizontal",
  popperOffset: 8,
  showTimeout: 300,
  hideTimeout: 300,
  persistent: true,
  color: "primary",
  showActiveBackground: true,
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

/** 溢出折叠触发器使用的保留标识，避免与用户的 index 冲突 */
const ELLIPSIS_INDEX = "__reborn_menu_ellipsis__";

/**
 * 菜单组件属性接口
 */
export interface RebornMenuProps {
  /** 菜单模式 */
  mode?: MenuMode;
  /** 菜单数据，传入后由组件驱动渲染，无需再手写子条目 */
  items?: ItemType[];
  /** 是否折叠菜单 */
  collapse?: boolean;
  /** 默认展开的子菜单索引数组 */
  defaultOpeneds?: string[];
  /**
   * 是否默认展开全部子菜单。
   * 只在平铺展开时生效（非折叠、非水平模式，且 expandType 为 normal）：
   * 浮层形态下「全部展开」会让所有浮层同时弹出并互相遮挡，不是可用的状态。
   * 只在子菜单挂载时判定一次，优先级低于 openKeys 与 defaultOpeneds；
   * 用户手动收起后不会被再次展开，运行时改动该属性也不会重新展开。
   */
  defaultExpandAll?: boolean;
  /** 是否只保持一个子菜单的展开（手风琴模式） */
  uniqueOpened?: boolean;
  /** 子菜单打开的触发方式 (仅水平模式或折叠时生效) */
  menuTrigger?: MenuTrigger;
  /** 是否使用 vue-router 的模式，启用后 index 会作为 path 进行路由跳转 */
  router?: boolean;
  /** 是否开启折叠过渡动画 */
  collapseTransition?: boolean;
  /**
   * 平铺展开（expand-type="normal"）时子菜单是否取消缩进。
   * 默认逐层缩进 16px；开启后各级条目一律左对齐，适合侧栏窄、层级深的场景。
   * 浮层展开本就不缩进，该属性对它没有影响。
   */
  noIndent?: boolean;
  /** 水平模式下宽度不足时是否把溢出菜单项折叠进「更多」子菜单 */
  ellipsis?: boolean;
  /** 溢出折叠触发器的图标名称 */
  ellipsisIcon?: string;
  /** 浮层子菜单相对触发元素的偏移量（像素） */
  popperOffset?: number;
  /** 浮层子菜单的展开延时（毫秒） */
  showTimeout?: number;
  /** 浮层子菜单的关闭延时（毫秒） */
  hideTimeout?: number;
  /** 浮层关闭后是否保留其 DOM，为 false 时关闭即销毁 */
  persistent?: boolean;
  /** 二级菜单展开方式：平铺展开(normal) / 浮层展开(popup) */
  expandType?: ExpandType;
  /** 同级别是否互斥展开，即同级只有一个子菜单展开 */
  expandMutex?: boolean;
  /** 触发方式为点击时，点击菜单外部是否关闭展开的子菜单 */
  closeOnClickOutside?: boolean;
  /** 主题颜色 */
  color?: MenuColor;
  /** 选中项是否展示背景块，关闭后仅保留文字高亮 */
  showActiveBackground?: boolean;
  /** 菜单背景色 */
  backgroundColor?: string;
  /** 菜单文字颜色 */
  textColor?: string;
  /** 激活状态的文字颜色 */
  activeTextColor?: string;
  /** 自定义类名 */
  class?: any;
  /** UI 局部重写配置 */
  ui?: MenuUI;
}

// --- 状态与属性 ---

/**
 * 当前选中项的完整路径（含各级父菜单标识）。
 * 注意：此处存的是「路径」而非单个 key，祖先高亮依赖该语义。
 */
const selectedKeys = defineModel<string[]>("selectedKeys", {
  default: () => [],
});

/** 当前展开的子菜单标识集合 */
const openKeys = defineModel<MenuValue[]>("openKeys", {
  default: () => [],
});

const b = theme;
const slots = useSlots();
const appRouter = useRouter();

/** 当前展开的子菜单索引列表（优先使用 openKeys 模型值，否则使用 defaultOpeneds） */
const openedMenus = ref<MenuValue[]>(
  openKeys.value.length > 0 ? [...openKeys.value] : [...props.defaultOpeneds],
);
/** 记录已展开子菜单的完整路径关系：记录 key 为菜单 index，value 为路径数组 */
const openedMenuPaths = ref<Record<string, string[]>>({});
/**
 * 是否执行「默认全部展开」。
 * 初始化时判定一次即可：openKeys 与 defaultOpeneds 任一给出了初始值，
 * 就说明调用方已明确指定展开项，此时不应被全部展开覆盖。
 */
const shouldExpandAll = props.defaultExpandAll && openedMenus.value.length === 0;
/** 已自动展开过的子菜单 index，保证每个节点只自动展开一次，用户手动收起后不会被重新展开 */
const autoExpandedMenus = new Set<string>();
/** 记录延时关闭的定时器，用于防抖或平滑过渡 */
const closeTimers = ref<Set<ReturnType<typeof setTimeout>>>(new Set());
/** 记录所有 teleport 的 popup 元素，防止点击外部误判 */
const popupRefs = ref<Set<HTMLElement>>(new Set());

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

function registerPopup(el: HTMLElement) {
  popupRefs.value.add(el);
}

function unregisterPopup(el: HTMLElement) {
  popupRefs.value.delete(el);
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

/**
 * 是否处于浮层展开形态。
 * 判定口径与 RebornSubMenu 的 effectiveExpandType 一致：折叠态与水平菜单强制走浮层，
 * 其余跟随根组件的 expandType。浮层形态在整棵树上是统一的，不存在某条分支单独平铺。
 */
const isPopupExpand = computed(
  () => props.collapse || props.mode === "horizontal" || props.expandType === "popup",
);

/** 收起全部子菜单并同步模型 */
function closeAllMenus() {
  openedMenus.value = [];
  openedMenuPaths.value = {};
  openKeys.value = [];
}

/**
 * 只保留选中路径上的祖先菜单，其余分支一并收起。
 * @param indexPath 新选中项的完整路径（末位是选中项自身）
 */
function keepAncestorMenus(indexPath: string[]) {
  // 选中项自身是叶子而非子菜单，去掉末位后剩下的就是应当保持展开的那条祖先链
  const ancestorPath = indexPath.slice(0, -1);

  openedMenus.value = openedMenus.value.filter((openedIndex) => {
    const openedPath = openedMenuPaths.value[openedIndex] ?? [openedIndex];
    return isPathPrefix(openedPath, ancestorPath);
  });

  // 清除被收起分支的路径记录，避免下次展开时读到过期路径
  Object.keys(openedMenuPaths.value).forEach((openedIndex) => {
    const openedPath = openedMenuPaths.value[openedIndex];
    if (!openedPath || !isPathPrefix(openedPath, ancestorPath)) {
      delete openedMenuPaths.value[openedIndex];
    }
  });

  openKeys.value = [...openedMenus.value];
}

// --- 全局兜底关闭 ---

/**
 * ⚠️ 根因：旧实现的子组件在 popup 边界离开时调用 scheduleCloseAll/cancelCloseAll，
 * 但根组件的 provide 里从未提供这两个方法，注释描述的「全局兜底关闭」是一段死逻辑，
 * 鼠标从多级浮层快速移出时会残留展开状态。
 * ✅ 修复：在根组件实现并下发，延时取 hideTimeout。
 */
let closeAllTimer: ReturnType<typeof setTimeout> | null = null;

/** 取消全局兜底关闭 */
function cancelCloseAll() {
  if (closeAllTimer) {
    clearTimeout(closeAllTimer);
    closeAllTimer = null;
  }
}

/** 安排全局兜底关闭：鼠标真正离开整个菜单体系后收起所有层级 */
function scheduleCloseAll() {
  cancelCloseAll();
  closeAllTimer = setTimeout(() => {
    closeAllMenus();
    closeAllTimer = null;
  }, props.hideTimeout);
}

// --- 样式计算 ---

/** 获取用户传入的 UI 覆盖配置 */
const overrides = computed<MenuUI>(() => props.ui || {});

/**
 * 根据状态计算各子组件的样式生成函数
 */
const ui = computed(() => {
  const styles = b({
    mode: props.mode,
    collapse: props.collapse,
    color: props.color,
    showActiveBackground: props.showActiveBackground,
    expandType: props.expandType,
    collapseTransition: props.collapseTransition,
  });

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, overrides.value.root) }),
    menu: (opts?: { class?: any }) => styles.menu({ class: cn(opts?.class, overrides.value.menu) }),
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
    menuItemExtra: (opts?: { class?: any }) =>
      styles.menuItemExtra({ class: cn(opts?.class, overrides.value.menuItemExtra) }),
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
    menuDivider: (opts?: { class?: any; dashed?: boolean }) =>
      styles.menuDivider({
        dashed: opts?.dashed,
        class: cn(opts?.class, overrides.value.menuDivider),
      }),
  };
});

/** 菜单内联样式（背景色与文字色） */
const menuStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
  color: props.textColor,
}));

/**
 * 折叠态的根容器宽度。
 * ⚠️ 根因：折叠宽度写在主题变体里会被使用者的 class 压掉——tv 把 props.class 拼在最后，
 * twMerge 后者胜，demo 里的 `w-full max-w-xs` 会直接吃掉 w-16，
 * 结果只有内层 ul 缩到 64px，外层白底面板仍是原宽，看着像没折叠。
 * ✅ 修复：折叠宽度改用内联样式下发，优先级高于任何 class。
 */
const rootStyle = computed(() => (props.collapse ? { width: "4rem" } : {}));

// --- 核心交互逻辑 ---

/**
 * 选中菜单项的回调
 * @param index 选中项的标识
 * @param indexPath 选中项的路径
 * @param route 显式指定的跳转地址，缺省时回退使用 index
 */
function handleSelect(index: string, indexPath: string[], route?: RouteLocationRaw) {
  selectedKeys.value = [...indexPath];
  clearCloseTimers();
  cancelCloseAll();
  // ⚠️ 根因：旧实现对任何选中都无条件收起全部子菜单，于是点开一层、点其中一条，
  // 刚展开的那层会随着这次点击立刻塌陷——click 与 hover 两种触发方式下都一样难用。
  // ✅ 修复：只有一级菜单项（路径长度为 1）才收起全部子菜单，子菜单内的条目保持展开。
  // 浮层形态并不会因此关不掉：点击外部走 handleClickOutside，移出浮层走 scheduleCloseAll。
  //
  // ⚠️ 根因（悬停触发的残留展开）：平铺展开下父级没有「移出即收起」的通道
  // （见 RebornSubMenu.handleMouseLeave 对平铺态的提前返回），而上面这条只在一级项上收起全部，
  // 于是先选「名单管理 / 白名单管理」再选同级的「权限管理」时，名单管理仍留在 openedMenus 里，
  // 明明已经切走了，那一整条分支却还摊开着，与悬停「跟着指针走一条路径」的预期相悖。
  // ✅ 修复：悬停态本就只维持一条展开路径（见 handleOpen 的 openedMenus = [...indexPath]），
  // 选中后按同一口径裁剪——只保留选中项的祖先链，旧分支随之收起。
  // 注：残留的**字体颜色**已在配置层解决（reborn-menu.config.ts 取消了展开态上色），
  // 这里裁剪的是展开状态本身，两者各管一层，不可互相替代。
  // 选中项所在的那条链不受影响，「点子项不收起」的行为依旧成立；祖先链为空时等价于收起全部。
  // 点击触发保持原样：那里允许同时展开多条分支（含 defaultExpandAll），裁剪会把用户手动展开的分支一并关掉。
  if (props.menuTrigger === "hover") {
    keepAncestorMenus(indexPath);
  } else if (indexPath.length <= 1) {
    closeAllMenus();
  }
  emit("select", index, indexPath);

  // 如果开启了 router 模式，则进行路由跳转
  const target = route ?? index;
  if (props.router && target) {
    void appRouter.push(target);
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

  // ⚠️ 根因：浮层 + 点击触发走的是下面的累加分支，openedMenus 只增不减，
  // 点开 A 再点开同级的 B 会得到 ["A","B"]，两块浮层同时悬在页面上互相遮挡，
  // 也看不出当前停在哪一支。平铺态多分支同时展开是合理的（条目就地撑开、互不重叠），
  // 浮层态不是：浮层脱离文档流，同时开多块只会是干扰。
  // ✅ 修复：浮层形态一律只保留当前路径。indexPath 自带祖先链，
  // 所以点开浮层内的下级子菜单时父级浮层照常保留，被收起的只有其它分支。
  // 平铺形态不受影响，仍然累加（defaultExpandAll 依赖多分支同时展开）。
  if (props.menuTrigger === "hover" || props.uniqueOpened || isPopupExpand.value) {
    // 悬浮触发、手风琴模式或浮层展开时，只保留当前路径的展开状态
    openedMenus.value = [...indexPath];
  } else {
    // 否则将新展开的项加入到展开列表中
    openedMenus.value = Array.from(new Set([...openedMenus.value, ...indexPath]));
  }

  // 同步到 openKeys 模型
  openKeys.value = [...openedMenus.value];

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

  // 同步到 openKeys 模型
  openKeys.value = [...openedMenus.value];

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

/**
 * 子菜单挂载时向根节点报到，用于「默认全部展开」。
 * 之所以由子菜单自报而不是在根节点遍历 items，是因为菜单树也可以完全由插槽书写，
 * 那种写法下根节点拿不到结构；自报则两种写法都能覆盖。
 * @param index 子菜单标识
 * @param indexPath 子菜单的完整路径
 * @param disabled 子菜单是否禁用
 */
function registerSubMenu(index: string, indexPath: string[], disabled: boolean) {
  if (!shouldExpandAll) return;
  // 判定口径与 RebornSubMenu 的 effectiveExpandType 一致：折叠态与水平态强制浮层展开。
  // 浮层形态下全部展开会让所有浮层同时弹出并互相遮挡，直接跳过。
  if (props.collapse || props.mode === "horizontal" || props.expandType !== "normal") return;
  // 溢出折叠触发器是内部保留节点，展开它会让「更多」浮层在初始化时就弹开
  if (index === ELLIPSIS_INDEX) return;
  if (disabled) return;
  if (autoExpandedMenus.has(index)) return;
  autoExpandedMenus.add(index);

  // 先写路径再写 openKeys：openKeys 的 watch 会据此重建 openedMenuPaths，顺序与 handleOpen 保持一致
  openedMenuPaths.value[index] = [...indexPath];
  openedMenus.value = Array.from(new Set([...openedMenus.value, index]));
  openKeys.value = [...openedMenus.value];
}

/** 监听外部 openKeys 模型变化，同步展开状态 */
watch(
  openKeys,
  (val) => {
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
  },
  { deep: true },
);

// --- 水平模式溢出折叠（ellipsis） ---

/** 菜单列表元素引用，溢出测量的基准容器 */
const menuRef = ref<HTMLElement | null>(null);
/**
 * 溢出切分下标：-1 表示不折叠（全量展示）。
 * 大于等于 0 时，下标之后的条目移入「更多」子菜单。
 */
const sliceIndex = ref(-1);
/** 缓存「更多」触发器的实测宽度，重置测量时它已从 DOM 移除，需用上次的值预留空间 */
const ellipsisWidth = ref(56);

/** 溢出折叠是否生效：仅水平、非折叠态下开启 */
const ellipsisEnabled = computed(
  () => props.ellipsis && props.mode === "horizontal" && !props.collapse,
);

/**
 * 把插槽返回的节点展平：模板里的 v-for / v-if 会产出 Fragment，
 * 不展平就无法按「菜单项」为粒度切分。同时剔除注释与空白文本节点。
 */
function flattenNodes(nodes: VNode[]): VNode[] {
  const result: VNode[] = [];
  for (const node of nodes) {
    if (node.type === Comment) continue;
    if (node.type === Text && !String(node.children ?? "").trim()) continue;
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flattenNodes(node.children as VNode[]));
    } else {
      result.push(node);
    }
  }
  return result;
}

/** 取插槽里的顶层菜单节点（每次调用重新求值，避免复用旧 vnode） */
function slotNodes(): VNode[] {
  return flattenNodes(slots.default?.() ?? []);
}

/** 插槽模式：留在菜单栏内的节点 */
function VisibleSlotNodes() {
  const nodes = slotNodes();
  return sliceIndex.value < 0 ? nodes : nodes.slice(0, sliceIndex.value);
}

/** 插槽模式：被折叠进「更多」的节点 */
function OverflowSlotNodes() {
  const nodes = slotNodes();
  return sliceIndex.value < 0 ? [] : nodes.slice(sliceIndex.value);
}

/** items 模式：留在菜单栏内的数据 */
const visibleItems = computed(() =>
  sliceIndex.value < 0 ? (props.items ?? []) : (props.items ?? []).slice(0, sliceIndex.value),
);

/** items 模式：被折叠进「更多」的数据 */
const overflowItems = computed(() =>
  sliceIndex.value < 0 ? [] : (props.items ?? []).slice(sliceIndex.value),
);

/** 是否需要渲染「更多」触发器 */
const showEllipsis = computed(() => ellipsisEnabled.value && sliceIndex.value >= 0);

/** 测量是否正在进行，用于阻断重入 */
let measuring = false;
/** 测量期间收到的新一轮请求，结束后补算一次 */
let measurePending = false;

/**
 * 重新计算溢出切分点。
 *
 * ⚠️ 根因：折叠后被隐藏的条目已从 DOM 移除，直接在折叠态下测量拿不到真实总宽，
 * 会导致窗口变宽后无法还原（折叠点单调不可逆）。
 * ✅ 修复：采用「重置 → 测量 → 应用」三拍，每次先全量渲染再量。
 *
 * 「重置」这一拍会改动 DOM，可能反过来惊动 ResizeObserver，
 * 因此用 measuring 阻断重入、用 measurePending 保证期间的请求不丢失。
 */
async function calcEllipsis(): Promise<void> {
  if (measuring) {
    measurePending = true;
    return;
  }
  measuring = true;

  try {
    await runEllipsisMeasure();
  } finally {
    measuring = false;
  }

  if (measurePending) {
    measurePending = false;
    await calcEllipsis();
  }
}

/** 单轮「重置 → 测量 → 应用」，仅供 calcEllipsis 调用 */
async function runEllipsisMeasure() {
  if (!ellipsisEnabled.value) {
    sliceIndex.value = -1;
    return;
  }

  // 第一拍：重置为全量渲染
  if (sliceIndex.value !== -1) {
    sliceIndex.value = -1;
    await nextTick();
  }

  const menuEl = menuRef.value;
  if (!menuEl) return;

  // 第二拍：在全量状态下测量
  const children = Array.from(menuEl.children) as HTMLElement[];
  if (children.length === 0) return;

  const menuStyles = window.getComputedStyle(menuEl);
  const paddingRight = Number.parseFloat(menuStyles.paddingRight) || 0;
  // clientWidth 含内边距，减去右侧内边距得到内容区可用右边界
  const available = menuEl.clientWidth - paddingRight;

  // 未溢出则保持全量展示
  if (menuEl.scrollWidth <= menuEl.clientWidth) {
    sliceIndex.value = -1;
    return;
  }

  // 子元素与 ul 共享同一个 offsetParent（根容器为 relative），换算成相对 ul 的右边界
  const originLeft = menuEl.offsetLeft;
  const limit = available - ellipsisWidth.value;

  let nextSlice = -1;
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const right = child.offsetLeft + child.offsetWidth - originLeft;
    if (right > limit) {
      nextSlice = i;
      break;
    }
  }

  // 至少保留一项，避免容器极窄时整条菜单只剩「更多」
  sliceIndex.value = nextSlice === 0 ? 1 : nextSlice;

  // 第三拍：应用后回读「更多」触发器的真实宽度，供下次测量预留
  if (sliceIndex.value >= 0) {
    await nextTick();
    const last = menuEl.lastElementChild as HTMLElement | null;
    if (last?.dataset.rebornMenuEllipsis === "true") {
      ellipsisWidth.value = last.offsetWidth;
    }
  }
}

let resizeObserver: ResizeObserver | null = null;

watch(
  () => [ellipsisEnabled.value, props.items, props.mode] as const,
  () => {
    void calcEllipsis();
  },
  { deep: true },
);

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

  // 检查是否在任何浮层内部
  for (const popup of popupRefs.value) {
    if (popup.contains(target)) return;
  }

  // 关闭所有展开的子菜单
  closeAllMenus();
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside, true);

  if (menuRef.value) {
    resizeObserver = new ResizeObserver(() => {
      void calcEllipsis();
    });
    resizeObserver.observe(menuRef.value);
  }
  void calcEllipsis();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside, true);
  resizeObserver?.disconnect();
  resizeObserver = null;
  clearCloseTimers();
  cancelCloseAll();
});

// --- 依赖注入与方法暴露 ---

/**
 * 向下提供给子组件的上下文和方法
 */
provide(MENU_INJECTION_KEY, {
  selectedKeys,
  openedMenus,
  parentIndexPath: computed(() => [] as string[]),
  mode: computed(() => props.mode),
  collapse: computed(() => props.collapse),
  menuTrigger: computed(() => props.menuTrigger),
  color: computed(() => props.color),
  showActiveBackground: computed(() => props.showActiveBackground),
  /** 根级条目不缩进，平铺子菜单逐层 +1（见 RebornSubMenu 的再次下发） */
  inlineDepth: computed(() => 0),
  noIndent: computed(() => props.noIndent),
  backgroundColor: computed(() => props.backgroundColor),
  textColor: computed(() => props.textColor),
  activeTextColor: computed(() => props.activeTextColor),
  expandType: computed(() => props.expandType),
  expandMutex: computed(() => props.expandMutex),
  persistent: computed(() => props.persistent),
  popperOffset: computed(() => props.popperOffset),
  showTimeout: computed(() => props.showTimeout),
  hideTimeout: computed(() => props.hideTimeout),
  collapseTransition: computed(() => props.collapseTransition),
  ui,
  uiOverrides: overrides,
  handleSelect,
  handleOpen,
  handleClose,
  toggleSubMenu,
  clearCloseTimer: clearCloseTimers,
  registerCloseTimer,
  registerPopup,
  unregisterPopup,
  scheduleCloseAll,
  cancelCloseAll,
  registerSubMenu,
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
  /** 主动触发一次溢出折叠测量 */
  handleResize: () => calcEllipsis(),
  /** 更新当前选中的菜单路径 */
  updateActiveIndex: (indexPath: string[]) => {
    selectedKeys.value = [...indexPath];
  },
});
</script>

<template>
  <div
    ref="rootRef"
    :class="ui.root({ class: props.class })"
    :style="rootStyle"
  >
    <ul
      ref="menuRef"
      :class="ui.menu()"
      :style="menuStyle"
      role="menu"
    >
      <!-- items 模式：条目由组件递归渲染 -->
      <RebornMenuItems
        v-if="props.items?.length"
        :items="visibleItems"
      />
      <!-- 插槽模式：ellipsis 开启时按测量结果切分 vnode -->
      <component
        :is="VisibleSlotNodes"
        v-else
      />

      <!-- 溢出折叠触发器 -->
      <RebornSubMenu
        v-if="showEllipsis"
        :index="ELLIPSIS_INDEX"
        data-reborn-menu-ellipsis="true"
      >
        <template #title>
          <Icon
            :name="props.ellipsisIcon"
            class="size-4"
          />
        </template>
        <RebornMenuItems
          v-if="props.items?.length"
          :items="overflowItems"
        />
        <component
          :is="OverflowSlotNodes"
          v-else
        />
      </RebornSubMenu>
    </ul>
  </div>
</template>
