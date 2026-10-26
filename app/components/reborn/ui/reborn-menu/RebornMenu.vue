<script setup lang="ts">
import type { VNode } from "vue";
import type { RouteLocationRaw } from "vue-router";
import type {
  ExpandType,
  ItemType,
  MenuColor,
  MenuMode,
  MenuTooltipConfig,
  MenuTrigger,
  MenuUI,
} from "./reborn-menu.config";
import {
  Comment,
  computed,
  Fragment,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  readonly,
  Text,
  useSlots,
  useTemplateRef,
  watch,
} from "vue";
import { cn } from "~/lib/utils";
import theme, { isMenuGroup, isSubMenu, MENU_INJECTION_KEY } from "./reborn-menu.config";
import { useMenuEllipsis } from "./useMenuEllipsis";
import { useScrollIntoContainer } from "./useScrollIntoContainer";
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
  checkStrictly: false,
  router: false,
  collapseTransition: true,
  tooltip: true,
  autoScrollIntoView: false,
  scrollConfig: undefined,
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
  /** 菜单项被点击选中时触发；重复点击已选中的项也会触发，但不写回 selectedKeys、router 模式下不重复跳转 */
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
  /**
   * 父子不强关联：带子菜单的父级自身也可被点击选中（router 模式下随之跳转），与它的子项各自独立。
   * 只在悬停触发（浮层展开 + menuTrigger="hover"）时生效：那时展开交给悬停，点击标题才能空出来做选中；
   * 平铺展开或点击触发下，点击标题已用于展开 / 收起，该开关被忽略。单个子菜单可用 selectable 覆盖。
   */
  checkStrictly?: boolean;
  /** 是否使用 vue-router 的模式，启用后 index 会作为 path 进行路由跳转 */
  router?: boolean;
  /** 是否开启折叠过渡动画 */
  collapseTransition?: boolean;
  /**
   * 折叠态下一级菜单项悬停时的文字提示。
   * 默认开启：折叠后标题被隐藏，只剩图标，靠提示补回可读性；
   * 传 false 关闭，传对象则透传给 RebornTooltip（placement 默认 right）。
   */
  tooltip?: boolean | MenuTooltipConfig;
  /**
   * 是否自动把选中项滚动到可见区域。
   * 选中项变化时（含首次挂载）生效，适合菜单很长、选中项由路由或外部值驱动的侧栏；
   * 选中项所在子菜单未展开时，退而滚动到被高亮的祖先子菜单标题。
   */
  autoScrollIntoView?: boolean;
  /**
   * 自动滚动的配置，block / inline / behavior 语义同原生 scrollIntoView，默认 { block: 'nearest', inline: 'nearest' }。
   * 与原生不同：只滚动选中项最近的可滚动祖先容器，不会连带滚动页面。
   * behavior 缺省时挂载即时定位、之后的选中变化平滑滚动；显式传入则两种时机都按它来
   */
  scrollConfig?: ScrollIntoViewOptions;
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

/** 受控时始终读取父级值，拒收更新不能留下本地展开副本 */
const instance = getCurrentInstance();
const hasOpenKeys = () => {
  const raw = instance?.vnode.props ?? {};
  return "openKeys" in raw || "open-keys" in raw;
};
if (!openKeys.value.length && props.defaultOpeneds.length) openKeys.value = [...props.defaultOpeneds];
const openedMenus = computed<readonly string[]>(() => hasOpenKeys() ? (instance?.props.openKeys as string[] ?? []) : openKeys.value);
/** 完整路径只作内部簿记，不参与渲染 */
let openedMenuPaths: Record<string, string[]> = {};
const subMenuPaths = new Map<string, string[]>();
/**
 * 是否执行「默认全部展开」。
 * 初始化时判定一次即可：openKeys 与 defaultOpeneds 任一给出了初始值，
 * 就说明调用方已明确指定展开项，此时不应被全部展开覆盖。
 */
const shouldExpandAll = props.defaultExpandAll && openedMenus.value.length === 0;
/** 已自动展开过的子菜单 index，保证每个节点只自动展开一次，用户手动收起后不会被重新展开 */
const autoExpandedMenus = new Set<string>();
/** 记录延时关闭的定时器，用于防抖或平滑过渡 */
const closeTimers = new Set<ReturnType<typeof setTimeout>>();
/** 记录所有 teleport 的 popup 元素，防止点击外部误判 */
const popupRefs = new Set<HTMLElement>();

// --- 辅助方法 ---

/**
 * 清除所有的关闭定时器
 */
function clearCloseTimers() {
  closeTimers.forEach((timer) => clearTimeout(timer));
  closeTimers.clear();
}

/** 延时任务在触发或取消后立即移出集合 */
function scheduleClose(task: () => void, delay: number) {
  const timer = setTimeout(() => { closeTimers.delete(timer); task(); }, delay);
  closeTimers.add(timer);
  return () => { clearTimeout(timer); closeTimers.delete(timer); };
}

function registerPopup(el: HTMLElement) {
  popupRefs.add(el);
}

function unregisterPopup(el: HTMLElement) {
  popupRefs.delete(el);
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

/**
 * 实际生效的子菜单触发方式：悬停只作用于浮层展开，平铺展开一律按点击处理。
 * ⚠️ 根因：平铺 + 悬停时，鼠标在标题上停满 showTimeout 就已经展开，用户随后那一下点击
 * 又走 toggle 把它收了回去，表现为「点了没反应、要点两三次」；悬停展开还会让下方条目
 * 在指针底下跟着上下跳，指针一路划过就连环展开别的分支。
 * ✅ 修复：与 menuTrigger 的声明口径（仅水平模式或折叠时生效）对齐，平铺态只认点击。
 * 点击外部关闭仍按使用者传入的 menuTrigger 判定，不受这里影响。
 */
const effectiveMenuTrigger = computed<MenuTrigger>(() =>
  isPopupExpand.value ? props.menuTrigger : "click",
);

/** 收起全部子菜单并同步模型 */
function closeAllMenus() {
  openKeys.value = [];
}

/**
 * 只保留选中路径上的祖先菜单，其余分支一并收起。
 * @param indexPath 新选中项的完整路径（末位是选中项自身）
 */
function keepAncestorMenus(indexPath: string[]) {
  // 选中项自身是叶子而非子菜单，去掉末位后剩下的就是应当保持展开的那条祖先链
  const ancestorPath = indexPath.slice(0, -1);

  openKeys.value = openedMenus.value.filter((openedIndex) => {
    const openedPath = openedMenuPaths[openedIndex] ?? pathOf(openedIndex);
    return isPathPrefix(openedPath, ancestorPath);
  });
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
  // ⚠️ 根因（重复点击已选中的项）：旧实现每次点击都写回一个新数组，内容不变也会派发 update:selectedKeys，
  // 使用方的 watch 被白白触发。
  // ✅ 修复：路径没变就不写回。select 事件仍照常派发（见下方），使用方可借它做「点当前项刷新」。
  if (!isSameKeys(selectedKeys.value, indexPath)) {
    selectedKeys.value = [...indexPath];
  }
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
  // 平铺展开已统一按点击处理（见 effectiveMenuTrigger），裁剪实际只发生在浮层形态。
  if (effectiveMenuTrigger.value === "hover") {
    keepAncestorMenus(indexPath);
  } else if (indexPath.length <= 1) {
    closeAllMenus();
  }
  emit("select", index, indexPath);

  // 如果开启了 router 模式，则进行路由跳转
  // ⚠️ 根因（重复点击当前页的菜单项，页面被拉回顶部）：push 到当前地址时 Vue Router 不会真的导航，
  // 却会按「重复导航」执行一次 scrollBehavior，没有 hash 时通常回到顶部——读者只是又点了一下当前项，正文就跳走了。
  // ✅ 修复：目标就是当前页时不再 push。
  const target = route ?? index;
  if (props.router && target && !isCurrentRoute(target)) {
    void appRouter.push(target);
  }
}

/** 两组路径是否逐项相同 */
function isSameKeys(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((key, i) => key === b[i]);
}

/**
 * 跳转目标是否就是当前页。
 * 目标不带 hash 时忽略当前地址上的 hash：读者经由页内目录跳到了某个锚点，
 * 再点同一页的菜单项仍算「点了当前项」，不应把正文拉回顶部；目标自己带 hash 时则按完整地址比较，锚点跳转照常。
 */
function isCurrentRoute(target: RouteLocationRaw) {
  const resolved = appRouter.resolve(target);
  const withoutHash = (fullPath: string) => (resolved.hash ? fullPath : fullPath.split("#")[0]);
  return withoutHash(resolved.fullPath) === withoutHash(appRouter.currentRoute.value.fullPath);
}

/**
 * 展开子菜单的回调
 * @param index 展开项的标识
 * @param indexPath 展开项的路径
 */
function handleOpen(index: string, indexPath: string[]) {
  let next = [...openedMenus.value];

  // 同级互斥同时移除旧分支的后代，仅按父级实际接受的展开集合生成提案
  if (props.expandMutex) {
    const parentPath = indexPath.slice(0, -1);
    const toClose = next
      .filter(key => key !== index)
      .map(key => openedMenuPaths[key] ?? pathOf(key))
      .filter(path => isSameKeys(path.slice(0, -1), parentPath));
    next = next.filter(key => !toClose.some(path => isPathPrefix(path, openedMenuPaths[key] ?? pathOf(key))));
  }

  // ⚠️ 根因：浮层 + 点击触发走的是下面的累加分支，openedMenus 只增不减，
  // 点开 A 再点开同级的 B 会得到 ["A","B"]，两块浮层同时悬在页面上互相遮挡，
  // 也看不出当前停在哪一支。平铺态多分支同时展开是合理的（条目就地撑开、互不重叠），
  // 浮层态不是：浮层脱离文档流，同时开多块只会是干扰。
  // ✅ 修复：浮层形态一律只保留当前路径。indexPath 自带祖先链，
  // 所以点开浮层内的下级子菜单时父级浮层照常保留，被收起的只有其它分支。
  // 平铺形态不受影响，仍然累加（defaultExpandAll 依赖多分支同时展开）。
  // effectiveMenuTrigger 为 hover 时必然是浮层形态，已被 isPopupExpand 覆盖，这里不再单列
  if (props.uniqueOpened || isPopupExpand.value) {
    // 手风琴模式或浮层展开（含悬停触发）时，只保留当前路径的展开状态
    openKeys.value = [...indexPath];
  } else {
    // 否则将新展开的项加入到展开列表中
    openKeys.value = Array.from(new Set([...next, ...indexPath]));
  }

  // 同步到 openKeys 模型

  emit("open", index, indexPath);
}

/**
 * 收起子菜单的回调
 * @param index 收起项的标识
 * @param indexPath 收起项的路径
 */
function handleClose(index: string, indexPath: string[]) {
  const currentPath = openedMenuPaths[index] ?? indexPath;

  // 过滤掉当前菜单及其所有子菜单的展开状态
  openKeys.value = openedMenus.value.filter((openedIndex) => {
    const openedPath = openedMenuPaths[openedIndex] ?? pathOf(openedIndex);
    return !isPathPrefix(currentPath, openedPath);
  });

  // 同步到 openKeys 模型

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
  subMenuPaths.set(index, [...indexPath]);
  // 插槽结构在挂载时才可知，为实际展开项补全路径
  if (openedMenus.value.includes(index)) openedMenuPaths[index] = [...indexPath];
  if (!shouldExpandAll) return;
  // 判定口径与 RebornSubMenu 的 effectiveExpandType 一致：折叠态与水平态强制浮层展开。
  // 浮层形态下全部展开会让所有浮层同时弹出并互相遮挡，直接跳过。
  if (props.collapse || props.mode === "horizontal" || props.expandType !== "normal") return;
  // 溢出折叠触发器是内部保留节点，展开它会让「更多」浮层在初始化时就弹开
  if (index === ELLIPSIS_INDEX) return;
  if (disabled) return;
  if (autoExpandedMenus.has(index)) return;
  autoExpandedMenus.add(index);

  openKeys.value = Array.from(new Set([...openedMenus.value, ...autoExpandedMenus]));
}

function unregisterSubMenu(index: string, indexPath: string[]) {
  if (isSameKeys(subMenuPaths.get(index) ?? [], indexPath)) subMenuPaths.delete(index);
}
const itemPaths = computed(() => {
  const paths = new Map<string, string[]>();
  function visit(items: ItemType[], parent: string[] = []) {
    for (const item of items) {
      if (isMenuGroup(item)) visit(item.children, parent);
      else if (isSubMenu(item)) {
        const path = [...parent, item.key];
        paths.set(item.key, path);
        visit(item.children, path);
      }
    }
  }
  visit(props.items ?? []);
  return paths;
});
function pathOf(index: string) { return itemPaths.value.get(index) ?? subMenuPaths.get(index) ?? [index]; }
// 初值、外部替换及结构变化都从真实路径重建，拒收提案不改簿记
watch([openedMenus, itemPaths], ([keys]) => {
  openedMenuPaths = Object.fromEntries(keys.map(key => [key, pathOf(key)]));
}, { deep: true, immediate: true });

// --- 水平模式溢出折叠（ellipsis） ---

/** 菜单列表元素引用，溢出测量的基准容器 */
const menuRef = useTemplateRef<HTMLElement>("menuRef");
/** 溢出折叠是否生效：仅水平、非折叠态下开启 */
const ellipsisEnabled = computed(
  () => props.ellipsis && props.mode === "horizontal" && !props.collapse,
);

const { sliceIndex, calcEllipsis, recordSlotCount } = useMenuEllipsis(menuRef, {
  enabled: ellipsisEnabled,
  slotMode: () => !props.items?.length,
  sources: () => [props.items, props.mode],
});
const { scrollIntoContainer } = useScrollIntoContainer();

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

/**
 * 取插槽里的顶层菜单节点（每次调用重新求值，避免复用旧 vnode）。
 * 顺带登记条目数：溢出测量据此判断组件更新后要不要补量，登记的是普通变量，渲染期写入不会引发渲染。
 */
function slotNodes(): VNode[] {
  const nodes = flattenNodes(slots.default?.() ?? []);
  recordSlotCount(nodes.length);
  return nodes;
}

/** 插槽模式：留在菜单栏内的节点 */
function VisibleSlotNodes(renderProps: { nodes: VNode[] }) {
  const nodes = renderProps.nodes;
  return sliceIndex.value < 0 ? nodes : nodes.slice(0, sliceIndex.value);
}

/** 插槽模式：被折叠进「更多」的节点 */
function OverflowSlotNodes(renderProps: { nodes: VNode[] }) {
  const nodes = renderProps.nodes;
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

// --- 点击外部关闭 ---

/** 菜单根元素引用，用于判断点击是否在菜单内部 */
const rootRef = useTemplateRef<HTMLElement>("rootRef");

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
  for (const popup of popupRefs) {
    if (popup.contains(target)) return;
  }

  // 关闭所有展开的子菜单
  closeAllMenus();
}

// --- 选中项自动滚入可见区域 ---

/** 元素是否实际占位：display:none 的祖先或收起到 0 高度的平铺子菜单里的条目都不算 */
function isRendered(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * 把选中项滚到可见区域。
 * 候选为选中的菜单项（aria-current）与被高亮的子菜单（data-menu-active），按文档顺序取最后一个可见的：
 * 叶子项总排在其祖先子菜单之后，可见时优先命中叶子；叶子藏在未展开的子菜单里时落到祖先标题上。
 * 浮层子菜单被 teleport 到 body，不在 menuRef 内，天然不参与。
 * @param initial 是否为挂载时的首次定位：页面刚渲染就看着列表滚一段像是一次多余的跳动，缺省 behavior 时直接到位
 */
async function scrollActiveIntoView(initial = false) {
  if (!props.autoScrollIntoView) return;
  await nextTick();

  const menuEl = menuRef.value;
  if (!menuEl) return;

  const candidates = Array.from(
    menuEl.querySelectorAll<HTMLElement>('[aria-current="page"], [data-menu-active]'),
  ).filter(isRendered);
  const target = candidates.at(-1);
  if (!target) return;

  // 子菜单 li 包含已展开的整棵子树，只滚它的标题行，否则 block: nearest 会按整棵子树的高度对齐
  const anchor = target.hasAttribute("data-menu-active")
    ? ((target.firstElementChild as HTMLElement | null) ?? target)
    : target;

  const {
    block = "nearest",
    inline = "nearest",
    behavior = initial ? "instant" : "smooth",
  } = props.scrollConfig ?? {};
  scrollIntoContainer(anchor, { block, inline, behavior });
}

watch(
  () => [selectedKeys.value, props.autoScrollIntoView] as const,
  () => {
    void scrollActiveIntoView();
  },
  { deep: true },
);

onMounted(() => {
  document.addEventListener("click", handleClickOutside, true);
  void scrollActiveIntoView(true);


});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside, true);
  clearCloseTimers();
  cancelCloseAll();
});

// --- 依赖注入与方法暴露 ---

/**
 * 向下提供给子组件的上下文和方法
 */
provide(MENU_INJECTION_KEY, {
  selectedKeys: readonly(selectedKeys),
  openedMenus,
  parentIndexPath: computed(() => [] as string[]),
  mode: computed(() => props.mode),
  collapse: computed(() => props.collapse),
  menuTrigger: effectiveMenuTrigger,
  checkStrictly: computed(() => props.checkStrictly),
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
  tooltip: computed<false | MenuTooltipConfig>(() => {
    if (props.tooltip === false) return false;
    return props.tooltip === true ? {} : props.tooltip;
  }),
  uiOverrides: overrides,
  handleSelect,
  handleOpen,
  handleClose,
  toggleSubMenu,
  clearCloseTimer: clearCloseTimers,
  scheduleClose,
  registerPopup,
  unregisterPopup,
  scheduleCloseAll,
  cancelCloseAll,
  registerSubMenu,
  unregisterSubMenu,
});

/**
 * 暴露给外部调用的实例方法
 */
defineExpose({
  /** 展开指定菜单 */
  open: (index: string) => {
    handleOpen(index, pathOf(index));
  },
  /** 收起指定菜单 */
  close: (index: string) => {
    handleClose(index, pathOf(index));
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
      <slot v-else-if="!ellipsisEnabled" />
      <!-- 插槽模式：ellipsis 开启时按测量结果切分 vnode -->
      <component
        :is="VisibleSlotNodes"
        v-else
        :nodes="slotNodes()"
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
          :nodes="slotNodes()"
        />
      </RebornSubMenu>
    </ul>
  </div>
</template>
