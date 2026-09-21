<script setup lang="ts">
import type {
  TabKey,
  TabPaneMeta,
  TabsColor,
  TabsDirection,
  TabsOverflow,
  TabsPosition,
  TabsSize,
  TabsTrigger,
  TabsType,
  TabsUI,
} from "./reborn-tabs.config";
import { onClickOutside, useResizeObserver } from "@vueuse/core";
import { computed, nextTick, onBeforeUnmount, provide, shallowRef, watch } from "vue";
import { cn } from "~/lib/utils";
import theme, { TABS_INJECTION_KEY } from "./reborn-tabs.config";

defineOptions({
  name: "RebornTabs",
});

const props = withDefaults(defineProps<RebornTabsProps>(), {
  position: "top",
  type: "line",
  direction: "horizontal",
  size: "medium",
  color: "primary",
  editable: false,
  showAddButton: false,
  destroyOnHidden: false,
  lazyLoad: false,
  justify: false,
  stretch: false,
  animation: false,
  autoSwitch: false,
  hideContent: false,
  draggable: false,
  trigger: "click",
  overflow: "scroll",
  scrollPosition: "auto",
});

const emit = defineEmits<{
  /** 当前标签值改变时触发 */
  (e: "change", key: TabKey): void;
  /** 用户点击标签时触发，禁用标签不触发；模板上写作 @tab-click */
  (e: "tabClick", key: TabKey): void;
  /** 用户点击增加按钮时触发 */
  (e: "add"): void;
  /** 用户点击删除按钮时触发，组件不会自行移除标签，需由外部维护列表 */
  (e: "delete", key: TabKey): void;
  /** 拖拽排序松手后触发，载荷为新顺序的完整 key 数组，需持久化顺序时由外部保存 */
  (e: "sort", keys: TabKey[]): void;
}>();

export interface RebornTabsProps {
  /** 默认选中的标签 key，非受控状态使用；为空时选中第一个标签页 */
  defaultActiveKey?: TabKey;
  /** 选项卡头部的位置 */
  position?: TabsPosition;
  /** 选项卡的大小 */
  size?: TabsSize;
  /** 选项卡的类型 */
  type?: TabsType;
  /** 选项卡的方向，vertical 等价于把头部放到侧边 */
  direction?: TabsDirection;
  /** 选项卡主题色，决定选中态文字、指示器与卡片边框的取色 */
  color?: TabsColor;
  /** 是否开启可编辑模式，开启后才会渲染删除按钮与增加按钮 */
  editable?: boolean;
  /** 是否显示增加按钮，仅在可编辑模式可用 */
  showAddButton?: boolean;
  /** 是否在不显示标签时销毁 DOM 结构，对所有标签页生效 */
  destroyOnHidden?: boolean;
  /** 是否在首次展示标签时才挂载内容 */
  lazyLoad?: boolean;
  /** 高度撑满容器，只在水平模式下生效 */
  justify?: boolean;
  /** 标签宽度是否自撑开：标签均分头部宽度、标题居中，只在水平模式下生效；标签总宽仍超出容器时照常滚动 */
  stretch?: boolean;
  /** 是否开启选项内容过渡动画 */
  animation?: boolean;
  /** 创建标签后是否切换到新标签（最后一个） */
  autoSwitch?: boolean;
  /** 是否隐藏内容区，隐藏时标签页仍保持挂载，头部不受影响 */
  hideContent?: boolean;
  /** 是否允许拖拽标签头调整顺序，松手后通过 sort 事件通报新顺序；禁用标签不可拖动 */
  draggable?: boolean;
  /** 切换标签的触发方式 */
  trigger?: TabsTrigger;
  /** 标签超出容器时的导航方式：scroll 仅滚动，arrows 两端箭头分步滚动，dropdown 末尾下拉选标；后两者只在真正溢出时渲染按钮 */
  overflow?: TabsOverflow;
  /** 被选中标签的滚动位置，auto 只在超出可视区域时滚动，数字为直接指定的滚动距离 */
  scrollPosition?: "start" | "end" | "center" | "auto" | number;
  class?: any;
  /** 细粒度样式覆盖对象，键为 root/nav/navWrapper/scrollBody/list/tab/tabTitle/tabClose/indicator/tabSlider/addButton/navButton/dropdown/dropdownPanel/dropdownItem/leftExtra/rightExtra/content/stage/pane */
  ui?: TabsUI;
}

/** 当前选中的标签 key；未绑定 v-model 时由组件自身维护 */
const activeKey = defineModel<TabKey | undefined>("activeKey", { default: undefined });

const wrapperRef = shallowRef<HTMLElement>();
const listRef = shallowRef<HTMLElement>();
/** 内容区内侧的无内边距容器，高度过渡锁在这一层 */
const stageRef = shallowRef<HTMLElement>();
/** 标签页登记表，顺序即头部渲染顺序 */
const panes = shallowRef<TabPaneMeta[]>([]);

/** position 为左右时强制纵向；direction 为 vertical 时把上下位置折算成左侧 */
const isVertical = computed(
  () => props.direction === "vertical" || props.position === "left" || props.position === "right",
);
const resolvedPosition = computed<TabsPosition>(() => {
  if (props.position === "left" || props.position === "right") return props.position;
  return isVertical.value ? "left" : props.position;
});

/** 为空时回落到 defaultActiveKey，仍为空则选中第一个标签页 */
const currentKey = computed<TabKey | undefined>(
  () => activeKey.value ?? props.defaultActiveKey ?? panes.value[0]?.key,
);

/** line、card 系列的头部与内容之间有分隔线，其余类型靠标签自身形态区分 */
const hasDivider = computed(() => ["line", "card", "card-gutter"].includes(props.type));
/** 只有下划线类型需要可滑动的指示器 */
const showIndicator = computed(() => props.type === "line");
/** 五种类型用一块可滑动的底板承载选中态，切换时底板从旧标签滑到新标签 */
const showSlider = computed(() =>
  ["card", "card-gutter", "card-fill", "rounded", "capsule"].includes(props.type),
);
/** 只有胶囊型底板做液体形变：卡片型底板就是那张卡片，形变会看着像渲染坏了 */
const isLiquid = computed(() => ["rounded", "capsule"].includes(props.type));
/** 可编辑模式才渲染增加按钮 */
const showAdd = computed(() => props.editable && props.showAddButton);

/** 标签列是否真的超出了滚动容器，箭头与下拉开关都只在此时渲染 */
const hasOverflow = shallowRef(false);
/** 是否还能向前 / 向后滚动，箭头据此置灰；1px 容差吸收亚像素误差 */
const canScrollPrev = shallowRef(false);
const canScrollNext = shallowRef(false);

/** 当前未完整落在可视区域内的标签 key，下拉选标只列这些；随滚动与尺寸变化实时维护 */
const hiddenKeys = shallowRef<TabKey[]>([]);

/**
 * 逐个标签与滚动容器的视口矩形对比，没完整露出的都算隐藏（半截露出的也点不准，一并收进下拉）。
 * 用视口坐标对比而不是滚动量换算：标签列外面还包着 scrollBody，滚动量换算得把它的偏移也算进去
 */
function updateHiddenTabs() {
  const wrapper = wrapperRef.value;
  const list = listRef.value;
  if (!wrapper || !list) return;
  const vertical = isVertical.value;
  const view = wrapper.getBoundingClientRect();
  const viewStart = (vertical ? view.top : view.left) - 1;
  const viewEnd = (vertical ? view.bottom : view.right) + 1;
  const next: TabKey[] = [];
  list.querySelectorAll<HTMLElement>("[role=\"tab\"]").forEach((tab, index) => {
    const rect = tab.getBoundingClientRect();
    const start = vertical ? rect.top : rect.left;
    const end = vertical ? rect.bottom : rect.right;
    const pane = panes.value[index];
    if (pane && (start < viewStart || end > viewEnd)) next.push(pane.key);
  });
  // 滚动事件里每帧都会走到这，内容没变就不写，避免无谓地触发下拉列表重渲染
  if (JSON.stringify(next) !== JSON.stringify(hiddenKeys.value)) hiddenKeys.value = next;
}

function updateOverflowState() {
  const wrapper = wrapperRef.value;
  if (!wrapper) return;
  const vertical = isVertical.value;
  const scrollSize = vertical ? wrapper.scrollHeight : wrapper.scrollWidth;
  const view = vertical ? wrapper.clientHeight : wrapper.clientWidth;
  const scrolled = vertical ? wrapper.scrollTop : wrapper.scrollLeft;
  hasOverflow.value = scrollSize - view > 1;
  canScrollPrev.value = scrolled > 1;
  canScrollNext.value = scrolled + view < scrollSize - 1;
  if (props.overflow === "dropdown") updateHiddenTabs();
}

const showArrows = computed(() => props.overflow === "arrows" && hasOverflow.value);
const showDropdown = computed(() => props.overflow === "dropdown" && hasOverflow.value);

/**
 * 溢出导航模式下滚动容器两端做渐隐（mask-image）：标签自身淡出成透明，
 * 读起来就是滑进箭头 / 下拉按钮下面。不用叠深色遮罩，明暗主题与任何底色天然成立。
 * 渐隐段固定 28px，滚过哪一端才在哪一端开孔，滚到端点即恢复实心——
 * 四种组合各写成完整的字面量类名，Tailwind 才能静态扫描到
 */
const scrollMaskClass = computed(() => {
  if (props.overflow !== "arrows" && props.overflow !== "dropdown") return "";
  if (!hasOverflow.value) return "";
  const prev = canScrollPrev.value;
  const next = canScrollNext.value;
  if (!prev && !next) return "";
  if (isVertical.value) {
    if (prev && next)
      return "[mask-image:linear-gradient(to_bottom,transparent,black_28px,black_calc(100%-28px),transparent)]";
    if (prev) return "[mask-image:linear-gradient(to_bottom,transparent,black_28px)]";
    return "[mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)]";
  }
  if (prev && next)
    return "[mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)]";
  if (prev) return "[mask-image:linear-gradient(to_right,transparent,black_28px)]";
  return "[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]";
});

/** 箭头每次滚动可视区的八成，留两成重叠让人对得上滚动前后的位置 */
function scrollByStep(direction: 1 | -1) {
  const wrapper = wrapperRef.value;
  if (!wrapper) return;
  const vertical = isVertical.value;
  const delta = direction * (vertical ? wrapper.clientHeight : wrapper.clientWidth) * 0.8;
  wrapper.scrollBy(vertical ? { top: delta, behavior: "smooth" } : { left: delta, behavior: "smooth" });
}

/** 下拉选标只列被滚出可视区域的标签：看得见的标签直接点头部就行，列全量反而要在长列表里找 */
const dropdownPanes = computed(() => {
  const hidden = new Set(hiddenKeys.value);
  return panes.value.filter(pane => hidden.has(pane.key));
});

/** 下拉选标的展开状态；点面板外任意处收起 */
const dropdownOpen = shallowRef(false);
const dropdownRef = shallowRef<HTMLElement>();
onClickOutside(dropdownRef, () => {
  dropdownOpen.value = false;
});

function handleDropdownPick(pane: TabPaneMeta) {
  if (pane.disabled) return;
  dropdownOpen.value = false;
  emit("tabClick", pane.key);
  switchTo(pane.key);
}

const uiOverrides = computed<TabsUI>(() => props.ui || {});

const baseVariants = computed(() => ({
  position: resolvedPosition.value,
  type: props.type,
  size: props.size,
  color: props.color,
  divider: hasDivider.value,
  // justify 与 stretch 都只在水平方向生效：纵向标签本就撑满列宽
  justify: props.justify && !isVertical.value,
  stretch: props.stretch && !isVertical.value,
  animation: props.animation,
}));

const styles = computed(() => theme(baseVariants.value));

/**
 * 增加按钮直接套用未选中标签的整套盒子样式（高度、内边距、圆角、边框、底色、悬浮反馈），
 * addButton 槽只在末尾补图标按钮特有的方形宽度与居中，靠 tailwind-merge 覆盖掉标签的水平内边距
 */
const addButtonClass = computed(() =>
  theme({ ...baseVariants.value, active: false }).tab({
    class: cn(styles.value.addButton(), uiOverrides.value.addButton),
  }),
);

/**
 * 选中标签处在标签列的哪一端。card 类型的圆角按首尾分配，而底板是标签列的兄弟节点、
 * 永远既非首也非末，用不了标签那套 first:/last:，只能把端位算出来交给变体
 */
const activeEdge = computed<"first" | "last" | "both" | "middle">(() => {
  const total = panes.value.length;
  const index = panes.value.findIndex(item => item.key === currentKey.value);
  if (index < 0) return "middle";
  if (total === 1) return "both";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
});

/** 底板样式单独算一次，避免把随选中项变化的 edge 并进 baseVariants 让整套样式跟着重算 */
const sliderClass = computed(() =>
  theme({ ...baseVariants.value, edge: activeEdge.value }).tabSlider({
    class: uiOverrides.value.tabSlider,
  }),
);

/** 高度过渡时长，与 stage 槽上的 transition-[height] duration-[280ms] 对齐 */
const STAGE_TRANSITION_DURATION = 280;

/** stage 的行内高度，切换期间锁住，过渡结束释放回 auto */
const stageHeight = shallowRef<string>();
/** 只在锁定期间给 stage 挂 overflow-hidden，静息态不裁剪面板内的下拉与浮层 */
const stageLocked = shallowRef(false);
const stageStyle = computed(() => (stageHeight.value ? { height: stageHeight.value } : undefined));
let stageTimer: ReturnType<typeof setTimeout> | undefined;
/** 高度锁的代次。释放锁时自增，此前排队的 rAF 回调据此作废，不会把已释放的高度重新锁上 */
let stageRun = 0;

const ui = computed(() => ({
  root: (opts?: { class?: any }) => styles.value.root({ class: cn(opts?.class, uiOverrides.value.root) }),
  nav: () => styles.value.nav({ class: uiOverrides.value.nav }),
  navWrapper: () => styles.value.navWrapper({ class: uiOverrides.value.navWrapper }),
  scrollBody: () => styles.value.scrollBody({ class: uiOverrides.value.scrollBody }),
  list: () => styles.value.list({ class: uiOverrides.value.list }),
  tabTitle: () => styles.value.tabTitle({ class: uiOverrides.value.tabTitle }),
  tabClose: () => styles.value.tabClose({ class: uiOverrides.value.tabClose }),
  indicator: () => styles.value.indicator({ class: uiOverrides.value.indicator }),
  tabSlider: () => sliderClass.value,
  addButton: () => addButtonClass.value,
  navButton: () => styles.value.navButton({ class: uiOverrides.value.navButton }),
  dropdown: () => styles.value.dropdown({ class: uiOverrides.value.dropdown }),
  dropdownPanel: () => styles.value.dropdownPanel({ class: uiOverrides.value.dropdownPanel }),
  leftExtra: () => styles.value.leftExtra({ class: uiOverrides.value.leftExtra }),
  rightExtra: () => styles.value.rightExtra({ class: uiOverrides.value.rightExtra }),
  content: () => styles.value.content({ class: uiOverrides.value.content }),
  // 只在高度锁定期间裁剪：过渡中新内容高出目标高度的那一截必须藏住，静息态再裁会切掉面板内的浮层
  stage: () =>
    styles.value.stage({
      class: cn(stageLocked.value && "overflow-hidden", uiOverrides.value.stage),
    }),
}));

const paneClass = computed(() => styles.value.pane({ class: uiOverrides.value.pane }));

/**
 * 选中态与禁用态逐个标签计算，不能并入根节点的一次性样式。
 * 首末位置（tabPlace）也在这里按下标推导：card 的首末圆角不能靠 first:/last: 伪类——
 * 滑动底板恒为标签列的末位兄弟，:last-child 永远落不到最后一个标签上
 */
function tabClass(pane: TabPaneMeta, index: number) {
  const total = panes.value.length;
  return theme({
    ...baseVariants.value,
    active: pane.key === currentKey.value,
    disabled: pane.disabled,
    tabPlace: total === 1 ? "both" : index === 0 ? "first" : index === total - 1 ? "last" : "middle",
  }).tab({ class: uiOverrides.value.tab });
}

/** 下拉选标的单项样式逐个计算：选中与禁用态复用标签的 active / disabled 变体 */
function dropdownItemClass(pane: TabPaneMeta) {
  return theme({
    ...baseVariants.value,
    active: pane.key === currentKey.value,
    disabled: pane.disabled,
  }).dropdownItem({ class: uiOverrides.value.dropdownItem });
}

/** 未写 key 的标签页按登记顺序补序号，计数器随组件实例独立 */
let autoKey = 0;

function addPane(meta: TabPaneMeta) {
  if (meta.key === undefined || meta.key === null) meta.key = autoKey++;
  panes.value = [...panes.value, meta];
}

function removePane(meta: TabPaneMeta) {
  panes.value = panes.value.filter(item => item !== meta);
}

// ─── 拖拽排序 ───────────────────────────────────────────────────

/** 拖拽起点在登记表中的下标；null 表示当前没有拖拽 */
let dragFromIndex: number | null = null;
/** 本次拖拽是否发生过换位，松手时据此决定要不要对外通报 */
let dragMoved = false;
/** 用户拖拽排序过一次后置真，此后 sortPanes 的 DOM 顺序重排永久让位 */
let userSorted = false;

/** setup 顺序在标签被插入到中间时会失真，挂载后按内容节点的 DOM 先后重排 */
function sortPanes() {
  // 用户拖拽排序过后不再按 DOM 顺序接管：内容节点仍按书写顺序排列，重排会把拖出来的顺序打回去
  if (userSorted) return;
  const next = [...panes.value].sort((a, b) => {
    if (!a.el || !b.el) return 0;
    return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  if (next.some((item, index) => item !== panes.value[index])) panes.value = next;
}

function handleDragStart(index: number, event: DragEvent) {
  if (!props.draggable) return;
  dragFromIndex = index;
  dragMoved = false;
  // Firefox 不写 dataTransfer 不会真正开始拖拽，内容随意
  event.dataTransfer?.setData("text/plain", "");
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(index: number, event: DragEvent) {
  if (dragFromIndex === null) return;
  // 不 preventDefault 浏览器会把标签列当成不可放置区域，光标一直是禁止样式
  event.preventDefault();
  if (index === dragFromIndex) return;
  // 指针越过目标标签的中点才换位：宽窄标签相邻时，换位本身会让指针落回旧标签，不加阈值会来回抖
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const pointer = isVertical.value ? event.clientY : event.clientX;
  const middle = isVertical.value ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
  if (index > dragFromIndex ? pointer < middle : pointer > middle) return;
  const next = [...panes.value];
  const [moved] = next.splice(dragFromIndex, 1);
  if (!moved) return;
  next.splice(index, 0, moved);
  panes.value = next;
  dragFromIndex = index;
  dragMoved = true;
  userSorted = true;
}

/** dragend 在源元素上必然触发（包括拖出窗口取消），收尾统一放这里 */
function handleDragEnd() {
  if (dragFromIndex === null) return;
  dragFromIndex = null;
  if (dragMoved) emit("sort", panes.value.map(pane => pane.key));
  dragMoved = false;
}

/** 指示器位置由测量标题得到，写成行内样式避免为每个位置生成一套类名 */
const indicatorStyle = shallowRef<Record<string, string>>({ opacity: "0" });

function updateIndicator() {
  const list = listRef.value;
  if (!list || !showIndicator.value) return;
  const tab = list.querySelector<HTMLElement>("[data-tab-active=\"true\"]");
  const title = tab?.querySelector<HTMLElement>("[data-tab-title]") ?? tab;
  if (!title) {
    indicatorStyle.value = { opacity: "0" };
    return;
  }
  const listRect = list.getBoundingClientRect();
  const rect = title.getBoundingClientRect();
  indicatorStyle.value = isVertical.value
    ? { opacity: "1", top: `${rect.top - listRect.top}px`, height: `${rect.height}px` }
    : { opacity: "1", left: `${rect.left - listRect.left}px`, width: `${rect.width}px` };
}

/** 底板落点，相对标签列左上角；两个轴向都记，不像指示条只需要主轴 */
interface SliderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 液体形变两段的节奏：行程直奔目标，回弹越过目标再弹回 */
const LIQUID_TRAVEL_DURATION = 110;
const LIQUID_TRAVEL_EASING = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const LIQUID_SETTLE_DURATION = 150;
const LIQUID_SETTLE_EASING = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";

/** 底板要整块盖住选中标签，两个轴向都得写，不像指示条只需要主轴 */
const sliderStyle = shallowRef<Record<string, string>>({ opacity: "0" });
/** 上一次提交的落点，作为液体形变的起点；连点时取的是提交值而非飞行中的视觉位置 */
let sliderRect: SliderRect | undefined;
/** 液体形变第二段的定时器，下次切换时清掉 */
let liquidTimer: ReturnType<typeof setTimeout> | undefined;
/** 只有真正换标签才跑形变；resize 与 refresh 引发的重量走直接落位 */
let liquidPending = false;

/** transition-none 只能关掉过渡、关不掉行内 transform 的瞬时生效，所以形变要在 JS 里判定 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 把落点写成行内样式。
 * margin 归零是防御：底板是标签列的末位兄弟，若使用方通过 ui.list 给相邻子节点加了负外边距
 * （如早先 card 类型共用边框时的 [&>*+*]:-ml-px），底板同样会命中，行内清零后才会正好落在量到的位置上
 */
function applySlider(rect: SliderRect, extra?: Record<string, string>) {
  sliderStyle.value = {
    opacity: "1",
    margin: "0",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    ...extra,
  };
}

/**
 * 液体形变。阶段 A 把底板主轴区间拉成起点与终点的并集（前缘先到、后缘留在原地），
 * 阶段 B 收拢到目标矩形并用 back-out 缓动越过目标再弹回。
 * 拉伸不只是装饰：行程中底板同时盖住两个标签，rounded 那身近白的选中文字才不会有一段
 * 悬在页面底色上看不见。交叉轴同时压扁一点，读起来像液体被拉长时的表面张力
 */
function runLiquid(from: SliderRect, to: SliderRect) {
  const vertical = isVertical.value;
  const fromStart = vertical ? from.top : from.left;
  const fromSize = vertical ? from.height : from.width;
  const toStart = vertical ? to.top : to.left;
  const toSize = vertical ? to.height : to.width;

  const unionStart = Math.min(fromStart, toStart);
  const unionEnd = Math.max(fromStart + fromSize, toStart + toSize);
  // 压扁幅度随位移增长并封顶，相邻标签之间不会夸张形变
  const squash = Math.min(0.12, Math.abs(toStart - fromStart) / 900);
  const stretched: SliderRect = vertical
    ? { ...to, top: unionStart, height: unionEnd - unionStart }
    : { ...to, left: unionStart, width: unionEnd - unionStart };

  applySlider(stretched, {
    transform: vertical ? `scaleX(${1 - squash})` : `scaleY(${1 - squash})`,
    transitionDuration: `${LIQUID_TRAVEL_DURATION}ms`,
    transitionTimingFunction: LIQUID_TRAVEL_EASING,
  });

  liquidTimer = setTimeout(() => {
    liquidTimer = undefined;
    applySlider(to, {
      transform: vertical ? "scaleX(1)" : "scaleY(1)",
      transitionDuration: `${LIQUID_SETTLE_DURATION}ms`,
      transitionTimingFunction: LIQUID_SETTLE_EASING,
    });
  }, LIQUID_TRAVEL_DURATION);
}

function updateSlider() {
  const list = listRef.value;
  if (!list || !showSlider.value) return;
  const tab = list.querySelector<HTMLElement>("[data-tab-active=\"true\"]");
  if (!tab) {
    sliderRect = undefined;
    sliderStyle.value = { opacity: "0" };
    return;
  }
  const listRect = list.getBoundingClientRect();
  const rect = tab.getBoundingClientRect();
  const next: SliderRect = {
    left: rect.left - listRect.left,
    top: rect.top - listRect.top,
    width: rect.width,
    height: rect.height,
  };
  const previous = sliderRect;
  sliderRect = next;

  const liquid = liquidPending;
  liquidPending = false;
  if (liquidTimer !== undefined) {
    clearTimeout(liquidTimer);
    liquidTimer = undefined;
  }

  if (liquid && previous && isLiquid.value && !prefersReducedMotion()) {
    runLiquid(previous, next);
    return;
  }
  // 卡片类型不写行内时长与 transform，节奏交回 tabSlider 槽上的 duration-300，行为与改动前一致
  applySlider(
    next,
    isLiquid.value ? { transform: isVertical.value ? "scaleX(1)" : "scaleY(1)" } : undefined,
  );
}

/** 指示条与底板都挂在标签列上，任何一次重排都要一起重量；溢出状态由同一批尺寸决定，也一起刷 */
function updateOverlays() {
  updateIndicator();
  updateSlider();
  updateOverflowState();
}

/** 按 scroll-position 把选中标签滚进可视区域 */
function scrollActiveIntoView() {
  const wrapper = wrapperRef.value;
  const list = listRef.value;
  if (!wrapper || !list) return;
  const tab = list.querySelector<HTMLElement>("[data-tab-active=\"true\"]");
  if (!tab) return;

  const vertical = isVertical.value;
  if (typeof props.scrollPosition === "number") {
    wrapper.scrollTo(vertical ? { top: props.scrollPosition } : { left: props.scrollPosition });
    return;
  }

  const listRect = list.getBoundingClientRect();
  const rect = tab.getBoundingClientRect();
  const start = vertical ? rect.top - listRect.top : rect.left - listRect.left;
  const size = vertical ? rect.height : rect.width;
  const view = vertical ? wrapper.clientHeight : wrapper.clientWidth;
  const current = vertical ? wrapper.scrollTop : wrapper.scrollLeft;

  let next = current;
  if (props.scrollPosition === "start") next = start;
  else if (props.scrollPosition === "end") next = start + size - view;
  else if (props.scrollPosition === "center") next = start + size / 2 - view / 2;
  // auto：只在超出可视区域时补齐差值，不做额外位置调整
  else if (start < current) next = start;
  else if (start + size > current + view) next = start + size - view;

  next = Math.max(0, next);
  if (next === current) return;
  wrapper.scrollTo(vertical ? { top: next, behavior: "smooth" } : { left: next, behavior: "smooth" });
}

/**
 * 标签自身的尺寸也要观察。标题里的图标是异步取回的，取回前它宽度为 0，
 * 而标签列的宽度由 root 撑满、自始至终不变，列上的观察者不会触发，
 * 底板就会一直短掉一个图标的宽度 —— 反色文字的 rounded 会因此露出底板外。
 * 只给没观察过的标签补观察：每次 observe 都会立刻回调一次，
 * 重复 observe 会在液体动画途中插进一次测量、把动画打断
 */
const observedTabs = new WeakSet<Element>();
let tabObserver: ResizeObserver | undefined;
function observeTabs() {
  const list = listRef.value;
  if (!list || typeof ResizeObserver === "undefined") return;
  tabObserver ??= new ResizeObserver(updateOverlays);
  for (const tab of list.querySelectorAll<HTMLElement>("[data-tab-active]")) {
    if (observedTabs.has(tab)) continue;
    observedTabs.add(tab);
    tabObserver.observe(tab);
  }
}

async function refresh() {
  await nextTick();
  observeTabs();
  updateOverlays();
  scrollActiveIntoView();
}

function switchTo(key: TabKey) {
  if (key === currentKey.value) return;
  activeKey.value = key;
  // 受控绑定下写入后同步读仍是旧值，事件载荷用本地 key
  emit("change", key);
}

function handleTabClick(pane: TabPaneMeta) {
  if (pane.disabled) return;
  emit("tabClick", pane.key);
  switchTo(pane.key);
}

/**
 * 悬停只在 trigger="hover" 下起作用（直接切换）。
 * 点击触发时悬停不做任何动画：底板只在真正切换时才移动，
 * 未选中标签的悬浮底色也是瞬时切换（见 config 里 rounded / capsule 的 transition 设置）
 */
function handleTabHover(pane: TabPaneMeta) {
  if (props.trigger !== "hover" || pane.disabled) return;
  switchTo(pane.key);
}

function handleDelete(pane: TabPaneMeta) {
  if (pane.disabled) return;
  emit("delete", pane.key);
}

/** 高度过渡的开启条件：justify 下高度由容器给，hideContent 下内容整块不参与布局 */
const canFluidHeight = computed(
  () => props.animation && !props.hideContent && !(props.justify && !isVertical.value),
);

/** 释放高度锁：回到 auto，此刻两值相等所以无跳变，之后内容自己长高也不会再被裁 */
function releaseStage() {
  if (stageTimer !== undefined) {
    clearTimeout(stageTimer);
    stageTimer = undefined;
  }
  stageRun += 1;
  stageHeight.value = undefined;
  stageLocked.value = false;
}

/**
 * 内容高度过渡。在 pre 冲刷里调用，此刻 DOM 还是旧内容，量到的就是起点高度。
 * 用 offsetHeight 而非 getBoundingClientRect：进场面板带着 scale-[0.98]，后者量出来的是形变后的盒子
 */
async function lockStageHeight() {
  const stage = stageRef.value;
  if (!canFluidHeight.value || !stage) return;
  releaseStage();
  const run = stageRun;

  const from = stage.offsetHeight;
  stageHeight.value = `${from}px`;
  stageLocked.value = true;

  // 先让出行内高度量出新内容的自然高度，再写回起点。这几步都是微任务，浏览器不绘制，不会闪
  await nextTick();
  stageHeight.value = undefined;
  await nextTick();
  const to = stage.offsetHeight;
  if (to === from) {
    releaseStage();
    return;
  }
  stageHeight.value = `${from}px`;
  await nextTick();
  // 兜底：标签页切到后台时 rAF 会被冻结，下面的双帧回调可能迟迟不执行。定时器不受冻结影响，
  // 保证裁剪与行内高度一定会释放，不会把内容长期锁在起点高度上。与 uniapp 端的兜底时长一致
  stageTimer = setTimeout(releaseStage, STAGE_TRANSITION_DURATION * 2);
  // 双帧：Vue 的响应式冲刷是微任务，单帧里写回的起点高度还没被绘制就被终点覆盖，过渡不会发生
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // 兜底已经释放过，或者已被下一次切换接管，这次回调作废，否则会把高度重新锁上
      if (run !== stageRun) return;
      stageHeight.value = `${to}px`;
      if (stageTimer !== undefined) clearTimeout(stageTimer);
      stageTimer = setTimeout(releaseStage, STAGE_TRANSITION_DURATION);
    });
  });
}

/**
 * 切换标签的前置钩子。用 pre 冲刷是为了在 DOM 更新前拿到旧内容的高度；
 * 挂在 currentKey 上而不是写进 switchTo，才能一并覆盖受控模式下外部直接改 activeKey 的情况
 */
watch(
  currentKey,
  (_key, previous) => {
    liquidPending = true;
    // 首次确定选中项时没有可用的起点高度，跳过这一次高度过渡
    if (previous !== undefined) void lockStageHeight();
  },
  { flush: "pre" },
);

// overflow 也在列：运行时切到 dropdown 时隐藏标签清单还没算过，要补一次测量
watch([currentKey, () => panes.value, () => props.type, () => props.size, () => props.overflow, resolvedPosition], refresh);

watch(
  () => panes.value.length,
  (length, previous) => {
    if (!props.autoSwitch || length <= (previous ?? 0)) return;
    const last = panes.value[length - 1];
    if (last) switchTo(last.key);
  },
);

useResizeObserver(listRef, updateOverlays);
// 容器一侧的尺寸变化（窗口缩放、父级布局变动）不会触发标签列的观察者，溢出判定要单独盯滚动容器
useResizeObserver(wrapperRef, updateOverflowState);

onBeforeUnmount(() => {
  if (liquidTimer !== undefined) clearTimeout(liquidTimer);
  if (stageTimer !== undefined) clearTimeout(stageTimer);
  tabObserver?.disconnect();
});

provide(TABS_INJECTION_KEY, {
  activeKey: currentKey,
  lazyLoad: computed(() => props.lazyLoad),
  destroyOnHidden: computed(() => props.destroyOnHidden),
  animation: computed(() => props.animation),
  paneClass,
  addPane,
  sortPanes,
  removePane,
});

defineExpose({
  /** `() => Promise<void>` 重新测量指示条与选中底板并把选中标签滚进可视区域，外部改变标签宽度后调用 */
  refresh,
});
</script>

<template>
  <div :class="ui.root({ class: props.class })" :data-position="resolvedPosition">
    <div :class="ui.nav()">
      <!-- 头部起始侧的额外内容：水平方向靠左、垂直方向靠顶，排在箭头与标签列之前 -->
      <div v-if="$slots['left-extra']" :class="ui.leftExtra()">
        <slot name="left-extra" />
      </div>

      <!-- 向前箭头。只在 overflow="arrows" 且标签真正溢出时渲染，滚到起点后置灰 -->
      <button
        v-if="showArrows" type="button" :class="ui.navButton()" :disabled="!canScrollPrev"
        aria-label="向前滚动标签" @click="scrollByStep(-1)"
      >
        <Icon :name="isVertical ? 'lucide:chevron-up' : 'lucide:chevron-left'" class="size-[1.2em]" />
      </button>

      <!-- 溢出导航模式下 mask 让两端的标签渐隐成透明，滚过哪端哪端才开孔（见 scrollMaskClass） -->
      <div
        ref="wrapperRef" :class="[ui.navWrapper(), scrollMaskClass]"
        @scroll.passive="updateOverflowState"
      >
        <!--
          scrollBody 把标签列与新增按钮包进同一份滚动内容：按钮紧贴末尾标签而不是被推到头部最右端，
          代价是标签溢出时按钮跟着滚动（与 uniapp 端一致）
        -->
        <div :class="ui.scrollBody()">
          <div ref="listRef" role="tablist" :class="ui.list()" :aria-orientation="isVertical ? 'vertical' : 'horizontal'">
            <button
              v-for="(pane, index) in panes" :key="pane.key" type="button" role="tab" :class="tabClass(pane, index)"
              :disabled="pane.disabled" :aria-selected="pane.key === currentKey"
              :data-tab-active="pane.key === currentKey"
              :draggable="props.draggable && !pane.disabled ? true : undefined" @click="handleTabClick(pane)"
              @mouseenter="handleTabHover(pane)" @dragstart="handleDragStart(index, $event)"
              @dragover="handleDragOver(index, $event)" @dragend="handleDragEnd" @drop.prevent
            >
              <span data-tab-title :class="ui.tabTitle()">
                <component :is="pane.titleSlot" v-if="pane.titleSlot" />
                <template v-else>{{ pane.title }}</template>
              </span>
              <span
                v-if="props.editable && pane.closable" :class="ui.tabClose()" role="button"
                :aria-label="`关闭 ${pane.title ?? pane.key}`" @click.stop="handleDelete(pane)"
              >
                <Icon name="lucide:x" class="size-full" />
              </span>
            </button>

            <!-- 指示器跟随选中标题滑动，位置由测量写入行内样式 -->
            <span v-if="showIndicator" aria-hidden="true" :class="ui.indicator()" :style="indicatorStyle" />

            <!--
              选中底板。放在标签之后是为了不让 card 的 [&>*+*]:-ml-px 落到首个标签上，
              层叠顺序与这里的先后无关：底板有 z-index 而标签不定位，底板天然画在所有标签的背景之上，
              标题与关闭图标又提了 z-[1] 压在底板之上，于是底板滑过沿途标签时不会盖住它们的文字
            -->
            <span v-if="showSlider" aria-hidden="true" :class="ui.tabSlider()" :style="sliderStyle" />
          </div>

          <button v-if="showAdd" type="button" :class="ui.addButton()" aria-label="新增标签" @click="emit('add')">
            <Icon name="lucide:plus" class="size-[1.2em]" />
          </button>
        </div>
      </div>

      <!-- 向后箭头。贴在滚动容器之后，滚到终点后置灰 -->
      <button
        v-if="showArrows" type="button" :class="ui.navButton()" :disabled="!canScrollNext"
        aria-label="向后滚动标签" @click="scrollByStep(1)"
      >
        <Icon :name="isVertical ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="size-[1.2em]" />
      </button>

      <!-- 下拉选标。开关与面板包在同一个定位锚点里，点面板外任意处收起 -->
      <div v-if="showDropdown" ref="dropdownRef" :class="ui.dropdown()">
        <button
          type="button" :class="ui.navButton()" aria-label="展开标签列表" aria-haspopup="listbox"
          :aria-expanded="dropdownOpen" @click="dropdownOpen = !dropdownOpen"
        >
          <Icon
            name="lucide:chevron-down"
            class="size-[1.2em] transition-transform duration-200 motion-reduce:transition-none"
            :class="dropdownOpen && 'rotate-180'"
          />
        </button>
        <div v-if="dropdownOpen" role="listbox" :class="ui.dropdownPanel()">
          <button
            v-for="pane in dropdownPanes" :key="pane.key" type="button" role="option"
            :aria-selected="pane.key === currentKey" :disabled="pane.disabled" :class="dropdownItemClass(pane)"
            @click="handleDropdownPick(pane)"
          >
            <component :is="pane.titleSlot" v-if="pane.titleSlot" />
            <template v-else>{{ pane.title }}</template>
          </button>
        </div>
      </div>

      <!-- 头部末尾侧的额外内容：水平方向靠右、垂直方向靠底 -->
      <div v-if="$slots['right-extra']" :class="ui.rightExtra()">
        <slot name="right-extra" />
      </div>
    </div>

    <div v-show="!props.hideContent" :class="ui.content()">
      <!-- 无内边距的中间层：高度过渡锁在这里，量到的进场面板净高就是要写的高度 -->
      <div ref="stageRef" :class="ui.stage()" :style="stageStyle">
        <slot />
      </div>
    </div>
  </div>
</template>
