<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { CSSProperties } from "vue";
import type { RouteLocationRaw } from "vue-router";
import type { ItemType, MenuContext, MenuUI } from "./reborn-menu.config";
import { useEventListener } from "@vueuse/core";
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, useSlots, watch } from "vue";
import { motionPresets, runMotion, stopMotion } from "@/lib/motion";
import { cn } from "~/lib/utils";
import theme, { getMenuFallbackChar, MENU_INJECTION_KEY, MENU_INLINE_INDENT } from "./reborn-menu.config";
// RebornMenuItems 由 Nuxt 全局自动注册，不写静态 import 以避免递归组件的 ESM 循环依赖。

/**
 * 子菜单组件属性接口
 */
export interface RebornSubMenuProps {
  /** 子菜单唯一标识 */
  index: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子菜单数据，传入后由组件递归渲染，无需再手写子条目 */
  items?: ItemType[];
  /** 父级自身是否可被选中，缺省时继承根节点的 checkStrictly；只在悬停触发时生效 */
  selectable?: boolean;
  /** 父级被选中时的跳转地址，缺省时 router 模式下回退使用 index */
  route?: RouteLocationRaw;
  /** 浮层的自定义类名 */
  popperClass?: ClassValue;
  /** 浮层的自定义内联样式 */
  popperStyle?: CSSProperties;
  /** 浮层相对触发元素的偏移量（像素），缺省时继承菜单根节点配置 */
  popperOffset?: number;
  /** 浮层展开延时（毫秒），缺省时继承菜单根节点配置 */
  showTimeout?: number;
  /** 浮层关闭延时（毫秒），缺省时继承菜单根节点配置 */
  hideTimeout?: number;
  /** 浮层是否传送到 body，关闭后浮层将跟随父级定位 */
  teleported?: boolean;
  /** 平铺（normal）态下的收起图标，需与 expandOpenIcon 成对提供 */
  expandCloseIcon?: string;
  /** 平铺（normal）态下的展开图标，需与 expandCloseIcon 成对提供 */
  expandOpenIcon?: string;
  /** 折叠（collapse）态下的收起图标，需与 collapseOpenIcon 成对提供 */
  collapseCloseIcon?: string;
  /** 折叠（collapse）态下的展开图标，需与 collapseCloseIcon 成对提供 */
  collapseOpenIcon?: string;
  /** 自定义类名 */
  class?: any;
  /** UI 局部重写配置 */
  ui?: MenuUI;
}

const props = withDefaults(defineProps<RebornSubMenuProps>(), {
  disabled: false,
  items: undefined,
  // 必须显式写 undefined：布尔类型的 prop 未传时会被 Vue 强转成 false，「缺省继承根节点」就判断不出来
  selectable: undefined,
  route: undefined,
  popperClass: undefined,
  popperStyle: undefined,
  popperOffset: undefined,
  showTimeout: undefined,
  hideTimeout: undefined,
  teleported: true,
  expandCloseIcon: undefined,
  expandOpenIcon: undefined,
  collapseCloseIcon: undefined,
  collapseOpenIcon: undefined,
  class: undefined,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 点击子菜单标题时触发 */
  (e: "titleClick", event: MouseEvent): void;
}>();

const menuContext = inject<MenuContext>(MENU_INJECTION_KEY);
const slots = useSlots();

const isActive = computed(() => menuContext?.selectedKeys.value.includes(props.index) ?? false);

/**
 * 父级自身能否被选中（checkStrictly / selectable）。
 * 只在悬停触发时成立：上下文里的 menuTrigger 已是生效值，平铺展开恒为 click，
 * 那时点击标题要负责展开 / 收起，再兼做选中就无法区分用户想做哪一件。
 */
const isSelectable = computed(
  () =>
    !props.disabled &&
    (props.selectable ?? menuContext?.checkStrictly.value ?? false) &&
    menuContext?.menuTrigger.value === "hover",
);

/**
 * 父级自己就是被选中的那一项（而不是因为后代被选中而高亮的祖先）。
 * 样式上按叶子项渲染（hasSubmenu: false），与祖先高亮区分开。
 */
const isSelfSelected = computed(
  () => isSelectable.value && menuContext?.selectedKeys.value.at(-1) === props.index,
);
const isOpened = computed(() => menuContext?.openedMenus.value.includes(props.index) ?? false);
const indexPath = computed(() => [...(menuContext?.parentIndexPath.value ?? []), props.index]);

/** 菜单层级：无父级路径即为一级菜单 */
const level = computed(() =>
  (menuContext?.parentIndexPath.value ?? []).length === 0 ? "root" : "sub",
);

/** 一级水平菜单不显示箭头 */
const isRootHorizontal = computed(
  () => menuContext?.mode.value === "horizontal" && level.value === "root",
);

/**
 * 是否渲染首字兜底（没有 icon 插槽时才会走到这一分支），判定与 RebornMenuItem 一致：
 * 只有垂直菜单的一级标题会被折叠收起，其余位置标题始终可见。
 * 不随 collapse 变化，展开态兜底宽度为 0 但留在 DOM 里，折叠切换才有过渡。
 */
const showFallback = computed(
  () => level.value === "root" && (menuContext?.mode.value ?? "vertical") === "vertical",
);

/**
 * 首字兜底的文字：取 title 插槽的首字，插槽缺省时标题区显示的是 index，这里也退回 index，
 * 首字与展开态看到的标题保持同源。在模板里调用的原因见 RebornMenuItem 的 fallbackChar。
 */
function fallbackChar() {
  return getMenuFallbackChar(slots.title?.(), props.index);
}

/** 折叠模式或水平模式下子菜单强制浮层展开，不可平铺 */
const effectiveExpandType = computed(() => {
  if (menuContext?.collapse.value) return "popup";
  if (menuContext?.mode.value === "horizontal") return "popup";
  return menuContext?.expandType.value ?? "popup";
});

/** 浮层偏移量：优先取自身属性，其次继承根节点 */
const effectivePopperOffset = computed(
  () => props.popperOffset ?? menuContext?.popperOffset.value ?? 8,
);
/** 展开延时：优先取自身属性，其次继承根节点 */
const effectiveShowTimeout = computed(
  () => props.showTimeout ?? menuContext?.showTimeout.value ?? 300,
);
/** 关闭延时：优先取自身属性，其次继承根节点 */
const effectiveHideTimeout = computed(
  () => props.hideTimeout ?? menuContext?.hideTimeout.value ?? 300,
);

/**
 * 是否使用自定义展开图标。
 * 对齐 Element Plus：两个图标必须成对提供，缺一则整体回退到默认箭头，
 * 保证不传时观感与旧实现完全一致（chevron-right + 展开旋转 90 度）。
 */
const hasCustomExpandIcon = computed(() => {
  if (menuContext?.collapse.value) {
    return Boolean(props.collapseCloseIcon && props.collapseOpenIcon);
  }
  return Boolean(props.expandCloseIcon && props.expandOpenIcon);
});

/** 当前应展示的展开图标名称 */
const currentExpandIcon = computed(() => {
  if (menuContext?.collapse.value) {
    return isOpened.value ? props.collapseOpenIcon : props.collapseCloseIcon;
  }
  return isOpened.value ? props.expandOpenIcon : props.expandCloseIcon;
});

/**
 * 平铺展开的缩进：写在条目自身的左内边距上，而不是容器 ul 上。
 * ⚠️ 根因：缩进若给容器，整列条目一起右移，悬浮态与选中态的背景块也跟着缩进，行首露白。
 * ✅ 修复：容器铺满整行、条目自己缩进，背景块因此始终占满整行宽度。
 * 根级（depth 为 0）不下发内联值，沿用 mode 变体给的 px-4；
 * 菜单开了 no-indent 时同样不下发，各级标题左对齐。
 */
const inlineIndentStyle = computed<CSSProperties | undefined>(() => {
  const depth = menuContext?.inlineDepth.value ?? 0;
  // 父级自己被选中时与 RebornMenuItem 一致，套用根节点的 activeTextColor（为空则交给主题色）
  const activeColor = isSelfSelected.value ? menuContext?.activeTextColor.value : "";
  const colorStyle = activeColor ? { color: activeColor } : {};
  if (depth <= 0 || menuContext?.noIndent.value) return activeColor ? colorStyle : undefined;

  // depth 1 得 32px = 原容器 ml-4(16px) + 条目 px-4(16px)，与改造前观感一致
  return { ...colorStyle, paddingLeft: `${MENU_INLINE_INDENT * (depth + 1)}px` };
});

if (menuContext) {
  provide<MenuContext>(MENU_INJECTION_KEY, {
    ...menuContext,
    parentIndexPath: indexPath,
    collapse: computed(() => false),
    /** 平铺子菜单逐层加深缩进；浮层是独立面板，进入浮层即归零 */
    inlineDepth: computed(() =>
      effectiveExpandType.value === "normal" ? (menuContext?.inlineDepth.value ?? 0) + 1 : 0,
    ),
    /** 子级通知时，由于使用 CSS Grid 动画，直接向上冒泡即可 */
    notifyResize: () => {
      menuContext?.notifyResize?.();
    },
  });
}

/**
 * 挂载时向根节点报到，由根节点决定是否执行「默认全部展开」。
 * 平铺态下整棵树在首次渲染时就全部挂载，因此一轮上报即可覆盖所有层级。
 */
onMounted(() => {
  menuContext?.registerSubMenu?.(props.index, indexPath.value, props.disabled);
});

const subMenuUi = computed(() => {
  const styles = theme({
    mode: menuContext?.mode.value ?? "vertical",
    collapse: menuContext?.collapse.value ?? false,
    color: menuContext?.color.value ?? "primary",
    showActiveBackground: menuContext?.showActiveBackground.value ?? true,
    expandType: effectiveExpandType.value,
    collapseTransition: menuContext?.collapseTransition.value ?? true,
    level: level.value,
    opened: isOpened.value,
    active: isActive.value,
    disabled: props.disabled,
    // 本组件必然带子菜单，据此让水平菜单跳过底部指示器、选中态走祖先配色；
    // 父级自己被选中时（checkStrictly）按叶子项处理，拿到完整的选中态与指示器
    hasSubmenu: !isSelfSelected.value,
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
          opened: isOpened.value,
          disabled: props.disabled,
          hasSubmenu: !isSelfSelected.value,
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
    menuItemIconFallback: (opts?: { class?: any }) =>
      cn(
        styles.menuItemIconFallback?.(),
        opts?.class,
        rootOverrides.menuItemIconFallback,
        localOverrides.menuItemIconFallback,
      ),
    menuItemArrow: (opts?: { class?: any; opened?: boolean }) =>
      cn(
        styles.menuItemArrow?.({ opened: opts?.opened }),
        opts?.class,
        rootOverrides.menuItemArrow,
        localOverrides.menuItemArrow,
      ),
    subMenu: (opts?: { class?: any }) =>
      cn(styles.subMenu?.(), opts?.class, rootOverrides.subMenu, localOverrides.subMenu),
    subMenuPopup: (opts?: { class?: any }) =>
      cn(
        styles.subMenuPopup?.(),
        opts?.class,
        rootOverrides.subMenuPopup,
        localOverrides.subMenuPopup,
        props.popperClass,
      ),
    subMenuContent: (opts?: { class?: any }) =>
      cn(
        styles.subMenuContent?.(),
        opts?.class,
        rootOverrides.subMenuContent,
        localOverrides.subMenuContent,
      ),
  };
});

const popupRef = ref<HTMLElement | null>(null);
const liRef = ref<HTMLElement | null>(null);
const popupStyle = ref<Record<string, string>>({});

/**
 * 浮层展开动画的缩放原点。
 * 浮层是从触发条目「长出来」的，原点必须落在与条目贴合的那条边上，
 * 否则缩放看起来像是从半空中凭空浮现。具体方位由 updatePopupPosition 按实际落位（含翻转）写入。
 * 默认值对应未翻转的左上角，也是不 teleport 分支（纯 CSS 定位在条目右上）的正确原点。
 */
const popupOrigin = ref("left top");

/**
 * 浮层展开动画是否生效。
 * 复用 collapseTransition 这一个开关：它在平铺态关掉高度过渡，在浮层态关掉出现/消失动画，
 * 对使用者是同一句「不要菜单动画」。关闭时用 Transition 的 css=false 彻底跳过过渡，
 * 而不是叠一个 transition-none 去和工具类抢优先级。
 */
const popupTransitionEnabled = computed(() => menuContext?.collapseTransition.value !== false);

const popupVersions = new WeakMap<Element, number>();
const popupFrames = new WeakMap<Element, { opacity: number; scale: string }>();
/** 定位层只做透明度过渡；缩放放到内容层，避免覆盖浮层计算出的坐标。 */
function animatePopup(element: Element, done: () => void, entering: boolean) {
  const version = (popupVersions.get(element) ?? 0) + 1;
  popupVersions.set(element, version);
  const duration = popupTransitionEnabled.value ? (entering ? 0.2 : 0.15) : 0;
  const content = element.firstElementChild;
  const frame = popupFrames.get(element);
  popupFrames.delete(element);
  const opacity = frame?.opacity ?? (element instanceof HTMLElement && element.style.opacity ? Number(getComputedStyle(element).opacity) : entering ? 0 : 1);
  if (content instanceof HTMLElement) {
    const scale = frame?.scale ?? (content.style.scale ? getComputedStyle(content).scale : entering ? '0.96' : '1');
    runMotion(content, { scale: [scale, entering ? '1' : '0.96'] }, { ...motionPresets.base, duration });
  }
  const animation = runMotion(element, { opacity: [opacity, entering ? 1 : 0] }, { ...motionPresets.base, duration });
  void animation.finished.then(() => {
    if (popupVersions.get(element) === version) done();
  });
}
function cancelPopup(element: Element) {
  // Vue 更新定位样式前保存中断画面，下一段动画不受 style patch 的影响。
  popupFrames.set(element, {
    opacity: Number(getComputedStyle(element).opacity),
    scale: element.firstElementChild ? getComputedStyle(element.firstElementChild).scale : '1',
  });
  popupVersions.set(element, (popupVersions.get(element) ?? 0) + 1);
  stopMotion(element);
  stopMotion(element.firstElementChild);
}
const popupTransitionProps = {
  onEnter: (element: Element, done: () => void) => animatePopup(element, done, true),
  onLeave: (element: Element, done: () => void) => animatePopup(element, done, false),
  onEnterCancelled: cancelPopup,
  onLeaveCancelled: cancelPopup,
} as const;

/**
 * 平铺展开是否已落定（完全展开且高度动画结束）。
 * 高度由 Motion 插值，收起与过渡期间必须 overflow-hidden 才能裁掉未露出的部分；
 * 但展开后一直裁着，会把首尾子条目的选中投影切掉一半。所以只在落定后放开裁剪，
 * 一旦开始收起就立刻恢复，收起动画照常被裁住。
 */
const inlineSettled = ref(isOpened.value);
const inlineRef = ref<HTMLElement | null>(null);
const inlineAnimating = ref(false);
let inlineVersion = 0;
/** 展开与收起都从当前可见高度出发，落定后放开裁剪，保留条目投影。 */
watch([isOpened, popupTransitionEnabled, effectiveExpandType], async ([opened]) => {
  const element = inlineRef.value;
  const version = ++inlineVersion;
  inlineSettled.value = false;
  if (!element || effectiveExpandType.value !== 'normal') {
    stopMotion(element);
    inlineAnimating.value = false;
    inlineSettled.value = opened;
    return;
  }
  const previousHeight = element.getBoundingClientRect().height;
  stopMotion(element);
  inlineAnimating.value = true;
  await nextTick();
  if (version !== inlineVersion) return;
  if (inlineRef.value !== element) {
    inlineAnimating.value = false;
    inlineSettled.value = opened;
    return;
  }
  const target = opened ? element.firstElementChild?.scrollHeight ?? 0 : 0;
  const animation = runMotion(element, { height: [`${previousHeight}px`, `${target}px`] }, {
    ...motionPresets.slow,
    duration: popupTransitionEnabled.value ? 0.3 : 0,
  });
  await animation.finished;
  if (version !== inlineVersion) return;
  element.style.removeProperty('height');
  inlineAnimating.value = false;
  inlineSettled.value = opened;
});

/** 浮层非持久化时，用于控制关闭后销毁 DOM */
const popupMounted = ref(false);

watch(isOpened, (val) => {
  if (val) popupMounted.value = true;
});

/**
 * 浮层是否需要出现在 DOM 中。
 * persistent 为 true 时挂载后一直保留（用 v-show 切换），为 false 时关闭即销毁。
 */
const shouldRenderPopup = computed(() => {
  if (effectiveExpandType.value !== "popup") return false;
  if (menuContext?.persistent.value === false) return isOpened.value;
  return popupMounted.value || isOpened.value;
});

watch(popupRef, (newVal, oldVal) => {
  if (oldVal) menuContext?.unregisterPopup?.(oldVal);
  if (newVal) menuContext?.registerPopup?.(newVal);
});

let closeTimer: ReturnType<typeof setTimeout> | null = null;
let openTimer: ReturnType<typeof setTimeout> | null = null;

/** 清除本组件挂起的展开定时器 */
function clearOpenTimer() {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }
}

/** 清除本组件挂起的关闭定时器 */
function clearOwnCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function handleClick(event: MouseEvent) {
  if (props.disabled) return;

  emit("titleClick", event);

  // 父子不强关联：点击标题选中父级自身。悬停触发下标题点击原本什么都不做（展开交给悬停），
  // 所以这里不会与下方的点击切换冲突——isSelectable 成立时 canToggleByClick 必为假
  if (isSelectable.value) {
    menuContext?.handleSelect(props.index, indexPath.value, props.route);
  }

  // ⚠️ 根因：切换只认 menuTrigger === "click"，而平铺态的 handleMouseLeave 又刻意不做移出关闭
  // （鼠标移向子项必经父项之外，倒计时关闭会让刚展开的子菜单当场收回）。
  // 两者叠加后「悬停 + 平铺」根本没有收起路径，展开即锁死，只能靠展开同级项互斥挤掉。
  // ✅ 修复：平铺态无论触发方式如何，都允许点击标题切换展开状态。
  // 子项与嵌套子菜单的 li 都带 @click.stop，冒泡不上来，不会误折叠祖先。
  const canToggleByClick =
    menuContext?.menuTrigger.value === "click" || effectiveExpandType.value === "normal";

  if (canToggleByClick) {
    // 撤销 hover 排队中的展开，否则「进入后 300ms 内点两下」会被延迟触发的 handleOpen 再次打开
    clearOpenTimer();
    menuContext?.toggleSubMenu(props.index, indexPath.value);
  }
}

function handleMouseEnter() {
  if (props.disabled) return;

  menuContext?.clearCloseTimer?.();
  clearOwnCloseTimer();
  // 任意菜单元素被进入时，取消全局兜底关闭
  menuContext?.cancelCloseAll?.();

  if (menuContext?.menuTrigger.value !== "hover") return;

  // 已展开时无需再排队，避免重复触发 open 事件
  if (isOpened.value) return;

  clearOpenTimer();
  const delay = effectiveShowTimeout.value;
  if (delay <= 0) {
    menuContext.handleOpen(props.index, indexPath.value);
    return;
  }
  openTimer = setTimeout(() => {
    menuContext.handleOpen(props.index, indexPath.value);
    openTimer = null;
  }, delay);
}

function handleMouseLeave() {
  if (props.disabled) return;

  // 离开时撤销尚未生效的展开排队，防止快速划过时子菜单延迟弹出
  clearOpenTimer();

  // ⚠️ 根因：平铺展开是把子项挤在父项下方推开内容，鼠标移向子项的路上
  // 必然先离开父项的 li，此时若按 hover 语义倒计时关闭，刚展开的子项会当场收回，根本点不到。
  // ✅ 修复：平铺态不做移出关闭，收起交给 handleOpen 里的手风琴逻辑（展开同级时自动互斥关闭）。
  if (effectiveExpandType.value === "normal") return;

  if (menuContext?.menuTrigger.value === "hover") {
    closeTimer = setTimeout(() => {
      menuContext.handleClose(props.index, indexPath.value);
      closeTimer = null;
    }, effectiveHideTimeout.value);

    menuContext?.registerCloseTimer?.(closeTimer);
  }
}

/**
 * popup 边界离开处理：在每层 close 之外，额外触发全局兜底关闭。
 * 兄弟 li 之间的切换不会触发 popup mouseleave，因此不会误关闭父菜单；
 * 当鼠标真正离开整个菜单体系时，没有任何 mouseenter 会取消该定时器。
 */
function handlePopupMouseLeave() {
  handleMouseLeave();
  menuContext?.scheduleCloseAll?.();
}

async function updatePopupPosition() {
  if (!popupRef.value || !liRef.value) return;
  // 先重置样式，以便测量真实的 DOM 尺寸
  popupStyle.value = { visibility: "hidden" };
  await nextTick();

  const liRect = liRef.value.getBoundingClientRect();
  // ⚠️ 条目自身不带 transform，用 getBoundingClientRect 量是准的；浮层不行：
  // 展开动画靠 scale 缩放，getBoundingClientRect 量到的是「缩放之后」的尺寸，
  // 起始帧只有真实尺寸的 95%，据此判断溢出会让贴边的浮层翻到错误的一侧。
  // 所以浮层尺寸一律用不受 transform / scale 影响的 offsetWidth、offsetHeight。
  const popupWidth = popupRef.value.offsetWidth;
  const popupHeight = popupRef.value.offsetHeight;
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const isRootHoriz = isRootHorizontal.value;
  // ⚠️ 根因：旧实现四处硬编码 8，导致声明出来的 popperOffset 属性完全没有接线。
  // ✅ 修复：统一由 offset 提供触发元素与浮层之间的间距，视口安全边距另算。
  const offset = effectivePopperOffset.value;
  /** 贴近视口边缘时保留的安全距离 */
  const safeGap = 8;

  let top = isRootHoriz ? liRect.bottom + offset : liRect.top;
  let left = isRootHoriz ? liRect.left : liRect.right + offset;
  /** 是否因右侧空间不足翻到了条目左边 */
  let flippedToLeft = false;

  // 底部溢出处理
  if (top + popupHeight > viewportHeight) {
    top = Math.max(safeGap, viewportHeight - popupHeight - safeGap);
  }

  // 右侧溢出处理
  if (left + popupWidth > viewportWidth) {
    if (isRootHoriz) {
      left = Math.max(safeGap, viewportWidth - popupWidth - safeGap);
    } else {
      // ⚠️ 根因：翻转分支此前无条件写 liRect.left - popupWidth - offset，不做任何钳位。
      // 浮层最小宽度 200px，视口窄到约 470px 以下时左边同样塞不下，
      // 这个减法会得到负数，浮层有一截被推出左边缘，里面的条目直接点不到。
      // ✅ 修复：只有左侧确实放得下才翻转；两侧都放不下时退回较宽的一侧再钳进视口。
      const flippedLeft = liRect.left - popupWidth - offset;
      if (flippedLeft >= safeGap) {
        left = flippedLeft;
        flippedToLeft = true;
      } else if (liRect.left > viewportWidth - liRect.right) {
        // 条目左侧空间更大：贴左边缘摆放
        left = safeGap;
        flippedToLeft = true;
      } else {
        // 条目右侧空间更大：贴右边缘摆放
        left = Math.max(safeGap, viewportWidth - popupWidth - safeGap);
      }
      // 走到后两支时浮层必然与触发条目重叠——视口已经容不下「菜单 + 浮层」并排，
      // 重叠至少还能点，被裁在视口外则完全不可用。
    }
  }

  // 缩放原点取浮层与触发条目贴合的那个点：横向是贴合的那条边（翻转后换成右边），
  // 纵向是条目中线相对浮层顶边的偏移。根级水平菜单的浮层挂在条目下方，
  // 这个偏移算出来是负数，钳到 0 正好落在浮层上边缘，方向仍然对。
  const originY = Math.min(Math.max(liRect.top + liRect.height / 2 - top, 0), popupHeight);
  popupOrigin.value = `${flippedToLeft ? "right" : "left"} ${Math.round(originY)}px`;

  popupStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    visibility: "visible",
  };
}

/**
 * 拦截子菜单列表内部的滚动边界溢出。
 *
 * ⚠️ 根因：此前第一支是「不可滚动就 preventDefault，防止背景页面滚动」，而 subMenuContent
 * 默认只有 flex flex-col gap-y-1，既没有 max-height 也没有 overflow-y-auto，永远不可滚动。
 * 于是这一支每次都命中：鼠标只要停在任何一个展开的子菜单上，滚轮就被整个吃掉，页面滚不动；
 * 下面那段边界判断也因此一次都没执行过。
 * ✅ 修复：只有元素确实是滚动容器、且这一下滚轮会越过它的上下边界时才拦截，其余一律放行。
 * 浮层本就设计成「页面一滚就关」（见下方 scroll 监听），锁住页面反而让那条路径永远走不到。
 */
function handleWheel(e: WheelEvent) {
  const el = e.currentTarget as HTMLElement;
  if (!el) return;

  // 不是滚动容器就没有「滚动穿透」可言，直接放行
  // （只有使用者通过 ui.subMenuContent 传入 max-h-* / overflow-y-auto 时才会成为滚动容器）
  if (el.scrollHeight <= el.clientHeight) return;

  const { deltaY } = e;
  // 向上滚动且已达顶部
  if (deltaY < 0 && el.scrollTop <= 0) {
    if (e.cancelable) e.preventDefault();
  }
  // 向下滚动且已达底部
  else if (deltaY > 0 && Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight) {
    if (e.cancelable) e.preventDefault();
  }
}

watch(
  isOpened,
  (val) => {
    // 非 teleport 浮层由 CSS 定位，无需 JS 计算
    if (!props.teleported) return;
    // ⚠️ 收起时不能再清空 popupStyle：浮层是 position: fixed，
    // 清掉 top / left 会立刻落回类名里的 left-full top-0（视口最右侧之外），
    // 收起动画就变成「先飞出屏幕再淡出」。
    // 留着上一次的坐标没有副作用：下次展开时 updatePopupPosition 会整份覆盖，
    // persistent 为 false 时元素本身也会被销毁。
    if (!val || effectiveExpandType.value !== "popup") return;
    void updatePopupPosition();
  },
  // ⚠️ 必须用 post：浮层受 shouldRenderPopup 的 v-if 控制，
  // 默认的 pre 时机下 DOM 尚未打补丁，popupRef 仍为 null，
  // updatePopupPosition 会在开头直接 return，导致「首次展开」完全没有定位。
  { flush: "post" },
);

// 当弹窗打开时，监听滚动事件
// 使用 capture 确保能捕获到局部滚动容器的滚动
useEventListener(
  window,
  "scroll",
  (e) => {
    if (!props.teleported) return;
    if (isOpened.value && effectiveExpandType.value === "popup") {
      const target = e.target as HTMLElement;
      if (!popupRef.value) return;

      // 1. 如果是在当前弹出层内部滚动，更新位置并返回
      if (popupRef.value.contains(target)) {
        void updatePopupPosition();
        return;
      }

      // 2. 如果是在子级弹出层（已被 Teleport 到 body）内部滚动，也不应该关闭当前层
      // 通过 data-menu-path 属性判断层级关系
      const targetPopup = target.closest?.("[data-menu-path]") as HTMLElement;
      if (targetPopup) {
        const path = targetPopup.getAttribute("data-menu-path")?.split(",") || [];
        const myPath = indexPath.value;
        // 如果目标弹出层的路径包含了当前菜单的完整路径，说明它是当前菜单的后代
        const isDescendant =
          myPath.length <= path.length && myPath.every((seg, i) => path[i] === seg);
        if (isDescendant) {
          void updatePopupPosition();
          return;
        }
      }

      // 3. 否则说明是父级容器或页面其他部分在滚动，关闭当前菜单
      menuContext?.handleClose(props.index, indexPath.value);
    }
  },
  { capture: true, passive: true },
);

onBeforeUnmount(() => {
  inlineVersion++;
  stopMotion(inlineRef.value);
  if (popupRef.value) cancelPopup(popupRef.value);
  clearOwnCloseTimer();
  clearOpenTimer();
  if (popupRef.value) {
    menuContext?.unregisterPopup?.(popupRef.value);
  }
});
</script>

<template>
  <li
    ref="liRef"
    :class="subMenuUi.subMenu({ class: props.class })"
    role="menuitem"
    :data-menu-active="isActive || undefined"
    @click.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 禁用态样式已下沉到 disabled 布尔变体，模板不再手拼状态类 -->
    <div
      :class="subMenuUi.menuItem()"
      :style="inlineIndentStyle"
    >
      <div :class="subMenuUi.menuItemContent()">
        <div
          v-if="$slots.icon"
          :class="subMenuUi.menuItemIcon()"
        >
          <slot name="icon" />
        </div>
        <!-- 首字只是视觉替身，读屏已能读到标题，对辅助技术隐藏 -->
        <div
          v-else-if="showFallback"
          :class="subMenuUi.menuItemIconFallback()"
          aria-hidden="true"
        >
          {{ fallbackChar() }}
        </div>
        <div :class="subMenuUi.menuItemTitle()">
          <slot name="title">{{ index }}</slot>
        </div>
        <div
          v-if="!isRootHorizontal"
          :class="subMenuUi.menuItemArrow({ opened: hasCustomExpandIcon ? false : isOpened })"
        >
          <Icon
            :name="hasCustomExpandIcon ? currentExpandIcon! : 'lucide:chevron-right'"
            class="size-4"
          />
        </div>
      </div>
    </div>

    <!-- 浮层展开（teleport 到 body，由 JS 定位） -->
    <Teleport
      v-if="effectiveExpandType === 'popup' && props.teleported"
      to="body"
    >
      <Transition
        v-bind="popupTransitionProps"
        :css="false"
      >
        <div
          v-if="shouldRenderPopup"
          v-show="isOpened"
          ref="popupRef"
          :class="subMenuUi.subMenuPopup()"
          :data-menu-path="indexPath.join(',')"
          :style="{
            position: 'fixed',
            margin: 0,
            transformOrigin: popupOrigin,
            backgroundColor: menuContext?.backgroundColor.value,
            color: menuContext?.textColor.value,
            ...popupStyle,
            ...props.popperStyle,
          }"
          @mouseenter="handleMouseEnter"
          @mouseleave="handlePopupMouseLeave"
        >
          <ul
            :class="subMenuUi.subMenuContent()"
            role="menu"
            @wheel="handleWheel"
          >
            <RebornMenuItems
              v-if="props.items?.length"
              :items="props.items"
            />
            <slot v-else />
          </ul>
        </div>
      </Transition>
    </Teleport>

    <!-- 浮层展开（不 teleport，由 CSS 相对父级定位） -->
    <Transition
      v-else-if="effectiveExpandType === 'popup'"
      v-bind="popupTransitionProps"
      :css="false"
    >
      <div
        v-show="isOpened"
        ref="popupRef"
        :class="subMenuUi.subMenuPopup()"
        :data-menu-path="indexPath.join(',')"
        :style="{
          transformOrigin: popupOrigin,
          backgroundColor: menuContext?.backgroundColor.value,
          color: menuContext?.textColor.value,
          ...props.popperStyle,
        }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handlePopupMouseLeave"
      >
        <ul
          :class="subMenuUi.subMenuContent()"
          role="menu"
          @wheel="handleWheel"
        >
          <RebornMenuItems
            v-if="props.items?.length"
            :items="props.items"
          />
          <slot v-else />
        </ul>
      </div>
    </Transition>

    <!-- 平铺展开：Motion 控制高度，栅格保留空闲状态的显隐 -->
    <div
      v-else
      ref="inlineRef"
      :class="subMenuUi.subMenuPopup({ class: inlineSettled ? 'overflow-visible' : undefined })"
      :style="{
        gridTemplateRows: isOpened || inlineAnimating ? '1fr' : '0fr',
        backgroundColor: menuContext?.backgroundColor.value,
        color: menuContext?.textColor.value,
        ...props.popperStyle,
      }"
    >
      <div class="min-h-0">
        <ul
          :class="subMenuUi.subMenuContent()"
          role="menu"
          @wheel="handleWheel"
        >
          <RebornMenuItems
            v-if="props.items?.length"
            :items="props.items"
          />
          <slot v-else />
        </ul>
      </div>
    </div>
  </li>
</template>
