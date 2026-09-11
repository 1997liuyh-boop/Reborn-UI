<script setup lang="ts">
import type {
  TabKey,
  TabPaneMeta,
  TabsColor,
  TabsDirection,
  TabsPosition,
  TabsSize,
  TabsTrigger,
  TabsType,
  TabsUI,
} from "./reborn-tabs.config";
import { useResizeObserver } from "@vueuse/core";
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
  destroyOnHide: false,
  lazyLoad: false,
  justify: false,
  animation: false,
  autoSwitch: false,
  hideContent: false,
  trigger: "click",
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
  /** 是否在不显示标签时销毁内容，对所有标签页生效 */
  destroyOnHide?: boolean;
  /** 是否在首次展示标签时才挂载内容 */
  lazyLoad?: boolean;
  /** 高度撑满容器，只在水平模式下生效 */
  justify?: boolean;
  /** 是否开启选项内容过渡动画 */
  animation?: boolean;
  /** 创建标签后是否切换到新标签（最后一个） */
  autoSwitch?: boolean;
  /** 是否隐藏内容区，隐藏时标签页仍保持挂载，头部不受影响 */
  hideContent?: boolean;
  /** 切换标签的触发方式 */
  trigger?: TabsTrigger;
  /** 被选中标签的滚动位置，auto 只在超出可视区域时滚动，数字为直接指定的滚动距离 */
  scrollPosition?: "start" | "end" | "center" | "auto" | number;
  class?: any;
  /** 细粒度样式覆盖对象，键为 root/nav/navWrapper/list/tab/tabTitle/tabClose/indicator/tabSlider/addButton/extra/content/stage/pane */
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

const uiOverrides = computed<TabsUI>(() => props.ui || {});

const baseVariants = computed(() => ({
  position: resolvedPosition.value,
  type: props.type,
  size: props.size,
  color: props.color,
  divider: hasDivider.value,
  // justify 只在水平方向生效
  justify: props.justify && !isVertical.value,
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
  list: () => styles.value.list({ class: uiOverrides.value.list }),
  tabTitle: () => styles.value.tabTitle({ class: uiOverrides.value.tabTitle }),
  tabClose: () => styles.value.tabClose({ class: uiOverrides.value.tabClose }),
  indicator: () => styles.value.indicator({ class: uiOverrides.value.indicator }),
  tabSlider: () => sliderClass.value,
  addButton: () => addButtonClass.value,
  extra: () => styles.value.extra({ class: uiOverrides.value.extra }),
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

/** 未写 key 的标签页按登记顺序补序号，计数器随组件实例独立 */
let autoKey = 0;

function addPane(meta: TabPaneMeta) {
  if (meta.key === undefined || meta.key === null) meta.key = autoKey++;
  panes.value = [...panes.value, meta];
}

function removePane(meta: TabPaneMeta) {
  panes.value = panes.value.filter(item => item !== meta);
}

/** setup 顺序在标签被插入到中间时会失真，挂载后按内容节点的 DOM 先后重排 */
function sortPanes() {
  const next = [...panes.value].sort((a, b) => {
    if (!a.el || !b.el) return 0;
    return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  if (next.some((item, index) => item !== panes.value[index])) panes.value = next;
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
const LIQUID_TRAVEL_DURATION = 180;
const LIQUID_TRAVEL_EASING = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const LIQUID_SETTLE_DURATION = 240;
const LIQUID_SETTLE_EASING = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";

/** 底板要整块盖住选中标签，两个轴向都得写，不像指示条只需要主轴 */
const sliderStyle = shallowRef<Record<string, string>>({ opacity: "0" });
/** 上一次提交的落点，作为液体形变的起点；连点时取的是提交值而非飞行中的视觉位置 */
let sliderRect: SliderRect | undefined;
/** 液体形变第二段的定时器，下次切换时清掉 */
let liquidTimer: ReturnType<typeof setTimeout> | undefined;
/** 只有真正换标签才跑形变；resize 与 refresh 引发的重量走直接落位 */
let liquidPending = false;
/** 悬停跟随的主轴偏移量。底板本来就是手写行内样式，用普通变量即可，不必触发重渲染 */
let hoverOffset = 0;

/** transition-none 只能关掉过渡、关不掉行内 transform 的瞬时生效，所以形变要在 JS 里判定 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 把悬停偏移叠到主轴起点上，长度不变 */
function withHoverOffset(rect: SliderRect): SliderRect {
  if (!hoverOffset) return rect;
  return isVertical.value
    ? { ...rect, top: rect.top + hoverOffset }
    : { ...rect, left: rect.left + hoverOffset };
}

/**
 * 把落点写成行内样式。
 * margin 归零是为了抹掉 card 类型挂在标签列上的 [&>*+*]:-ml-px —— 底板作为末位兄弟同样会命中，
 * 行内样式优先级高于类名，清零后底板才会正好落在量到的位置上
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
    applySlider(withHoverOffset(to), {
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
    withHoverOffset(next),
    isLiquid.value ? { transform: isVertical.value ? "scaleX(1)" : "scaleY(1)" } : undefined,
  );
}

/** 悬停跟随：底板朝鼠标所在标签轻微前倾，尺寸不变。形变飞行中不打断，落位后才跟随 */
function applyHoverSlider() {
  if (!sliderRect || !isLiquid.value || liquidTimer !== undefined) return;
  applySlider(withHoverOffset(sliderRect), {
    transform: isVertical.value ? "scaleX(1)" : "scaleY(1)",
    transitionDuration: `${LIQUID_TRAVEL_DURATION}ms`,
    transitionTimingFunction: LIQUID_TRAVEL_EASING,
  });
}

/** 指示条与底板都挂在标签列上，任何一次重排都要一起重量 */
function updateOverlays() {
  updateIndicator();
  updateSlider();
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

function handleTabHover(pane: TabPaneMeta, event: MouseEvent) {
  if (props.trigger === "hover") {
    if (pane.disabled) return;
    switchTo(pane.key);
    return;
  }
  // 点击触发时悬停只做底板的轻微前倾，给 trigger=hover 的直接切换让位
  const list = listRef.value;
  const target = event.currentTarget as HTMLElement | null;
  if (!list || !target || !sliderRect || !isLiquid.value) return;
  if (pane.disabled || pane.key === currentKey.value) return;
  const listRect = list.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const targetCenter = isVertical.value
    ? rect.top - listRect.top + rect.height / 2
    : rect.left - listRect.left + rect.width / 2;
  const selfCenter = isVertical.value
    ? sliderRect.top + sliderRect.height / 2
    : sliderRect.left + sliderRect.width / 2;
  hoverOffset = (targetCenter - selfCenter) * 0.15;
  applyHoverSlider();
}

/** 归位挂在整条标签列上而不是单个标签，标签之间移动时底板持续跟随 */
function handleListLeave() {
  if (!hoverOffset) return;
  hoverOffset = 0;
  applyHoverSlider();
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
    // 点击后底板真正吸附到目标标签，不再保留悬停的前倾
    hoverOffset = 0;
    // 首次确定选中项时没有可用的起点高度，跳过这一次高度过渡
    if (previous !== undefined) void lockStageHeight();
  },
  { flush: "pre" },
);

watch([currentKey, () => panes.value, () => props.type, () => props.size, resolvedPosition], refresh);

watch(
  () => panes.value.length,
  (length, previous) => {
    if (!props.autoSwitch || length <= (previous ?? 0)) return;
    const last = panes.value[length - 1];
    if (last) switchTo(last.key);
  },
);

useResizeObserver(listRef, updateOverlays);

onBeforeUnmount(() => {
  if (liquidTimer !== undefined) clearTimeout(liquidTimer);
  if (stageTimer !== undefined) clearTimeout(stageTimer);
  tabObserver?.disconnect();
});

provide(TABS_INJECTION_KEY, {
  activeKey: currentKey,
  lazyLoad: computed(() => props.lazyLoad),
  destroyOnHide: computed(() => props.destroyOnHide),
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
      <div ref="wrapperRef" :class="ui.navWrapper()">
        <div
          ref="listRef" role="tablist" :class="ui.list()" :aria-orientation="isVertical ? 'vertical' : 'horizontal'"
          @mouseleave="handleListLeave"
        >
          <button
            v-for="(pane, index) in panes" :key="pane.key" type="button" role="tab" :class="tabClass(pane, index)"
            :disabled="pane.disabled" :aria-selected="pane.key === currentKey"
            :data-tab-active="pane.key === currentKey" @click="handleTabClick(pane)"
            @mouseenter="handleTabHover(pane, $event)"
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
      </div>

      <button v-if="showAdd" type="button" :class="ui.addButton()" aria-label="新增标签" @click="emit('add')">
        <Icon name="lucide:plus" class="size-[1.2em]" />
      </button>

      <!-- 额外内容贴在头部末尾，水平方向靠右、垂直方向靠底 -->
      <div v-if="$slots.extra" :class="ui.extra()">
        <slot name="extra" />
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
