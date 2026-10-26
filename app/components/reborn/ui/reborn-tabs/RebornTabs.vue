<script setup lang="ts">
import type { VNode } from "vue";
import type {
  TabKey,
  TabPaneMeta,
  TabPaneRegistration,
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
import { animate } from "motion-v";
import { cloneVNode, computed, Fragment, isVNode, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, provide, shallowRef, useSlots, useTemplateRef, watch } from "vue";
import { motionPresets, prefersReducedMotion } from "@/lib/motion";
import { useLiquidSlider } from "~/composables/useLiquidSlider";
import { cn } from "~/lib/utils";
import theme, { TABS_INJECTION_KEY } from "./reborn-tabs.config";

defineOptions({
  name: "RebornTabs",
  inheritAttrs: false,
});

const props = withDefaults(defineProps<RebornTabsProps>(), {
  position: "top",
  type: "line",
  direction: "horizontal",
  size: "md",
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

const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef');
const listRef = useTemplateRef<HTMLElement>('listRef');
/** 内容区内侧的无内边距容器，高度过渡锁在这一层 */
const stageRef = useTemplateRef<HTMLElement>('stageRef');
const indicatorRef = useTemplateRef<HTMLElement>('indicatorRef');
const sliderRef = useTemplateRef<HTMLElement>('sliderRef');
const slots = useSlots();
/** 标签页登记表，顺序即头部渲染顺序 */
const panes = shallowRef<TabPaneMeta[]>([]);
const userSorted = shallowRef(false);

/** 只有标签页节点参与头部登记与默认 paneKey 注入，普通元素原样渲染、不会多出 panekey 属性 */
function isPaneNode(node: VNode) {
  const type = node.type;
  return typeof type === "object" && type !== null
    && (("name" in type && type.name === "RebornTabPane") || ("__name" in type && type.__name === "RebornTabPane"));
}

/** 模板里写 pane-key 时 VNode 的原始 props 保留连字符键，两种写法都要认 */
function readPaneKey(node: VNode): TabKey | undefined {
  return node.props?.paneKey ?? node.props?.["pane-key"];
}

/**
 * 按插槽原有结构给缺省 paneKey 的标签页补默认值，同时按书写顺序收集标签页节点供头部读取。
 * - 不改动任何节点的 Vue key，v-if 留下的注释占位与 v-for 的 Fragment 原样保留：渲染器按原结构逐位对比，
 *   前面的面板被 v-if 隐藏、或前面的 v-for 列表增删时，后面面板的组件实例与内部状态都不受影响；
 * - 默认 paneKey 取节点在插槽里的书写位置（注释占位也占一位），同样不随前面兄弟的显隐变化；
 *   顶层节点是数字下标，嵌套在 Fragment（v-for、带 v-if 的 template）里的节点是「外层位置-内层位置」字符串。
 * 没有任何节点需要补值时原样返回同一个数组，避免无谓地复制。
 */
function collectPanes(nodes: VNode[], path: string, collected: VNode[]): VNode[] {
  let changed = false;
  const mapped = nodes.map((node, index) => {
    if (!isVNode(node)) return node;
    const position: TabKey = path ? `${path}-${index}` : index;
    if (node.type === Fragment && Array.isArray(node.children)) {
      const children = node.children as VNode[];
      const next = collectPanes(children, String(position), collected);
      if (next === children) return node;
      changed = true;
      const fragment = cloneVNode(node);
      fragment.children = next;
      return fragment;
    }
    if (!isPaneNode(node)) return node;
    if (readPaneKey(node) !== undefined) {
      collected.push(node);
      return node;
    }
    changed = true;
    const pane = cloneVNode(node, { paneKey: position });
    collected.push(pane);
    return pane;
  });
  return changed ? mapped : nodes;
}

function getView() {
  const collected: VNode[] = [];
  const nodes = collectPanes(slots.default?.() ?? [], "", collected);
  let headers = collected.map(node => {
    const paneSlots = node.children && typeof node.children === 'object' && !Array.isArray(node.children) ? node.children : {};
    return { key: readPaneKey(node) as TabKey, order: node.props?.order, title: node.props?.title, disabled: node.props?.disabled === '' || !!node.props?.disabled,
      closable: node.props?.closable !== false, destroyOnHidden: !!node.props?.destroyOnHidden,
      titleSlot: 'title' in paneSlots ? paneSlots.title : undefined } as TabPaneMeta;
  });
  if (!userSorted.value && headers.every(pane => typeof pane.order === "number" && Number.isFinite(pane.order))) headers.sort((a, b) => a.order! - b.order!);
  if (userSorted.value) {
    const order = new Map(panes.value.map((pane, index) => [pane.key, index]));
    headers = [...headers].sort((a, b) => (order.get(a.key) ?? Infinity) - (order.get(b.key) ?? Infinity));
  }
  return { nodes, panes: headers, key: activeKey.value ?? props.defaultActiveKey ?? headers[0]?.key };
}

/**
 * 父级替换插槽函数（动态插槽、渲染函数写法）时会强制本组件更新，更新前让视图缓存失效；
 * 插槽内容里读到的响应式状态由 computed 自己追踪，变化时同样会重算
 */
const slotVersion = shallowRef(0);
onBeforeUpdate(() => { slotVersion.value++; });
/** 本次渲染的面板节点与头部元信息，渲染期从 VNode 读取，SSR 首帧即可输出标题，无需等子级 setup 登记 */
const view = computed(() => {
  void slotVersion.value;
  return getView();
});

/** VNode 显式传入渲染器，父级替换插槽函数时不会保留旧闭包。 */
function PaneNodes(input: { nodes: VNode[] }) { return input.nodes; }

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
const dropdownRef = useTemplateRef<HTMLElement>('dropdownRef');
onClickOutside(dropdownRef, () => {
  dropdownOpen.value = false;
});

function handleDropdownPick(pane: TabPaneMeta) {
  if (pane.disabled) return;
  dropdownOpen.value = false;
  emit("tabClick", pane.key);
  switchTo(pane.key);
}

const uiOverrides = computed(() => {
  const classes: Partial<Record<keyof TabsUI, string>> = {};
  for (const key of Object.keys(props.ui ?? {}) as (keyof TabsUI)[]) classes[key] = cn(props.ui?.[key]);
  return classes;
});

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

/** stage 的行内高度，切换期间锁住，过渡结束释放回 auto */
const stageHeight = shallowRef<string>();
/** 只在锁定期间给 stage 挂 overflow-hidden，静息态不裁剪面板内的下拉与浮层 */
const stageLocked = shallowRef(false);
const stageStyle = computed(() => ({ height: stageHeight.value, transitionDuration: "0ms" }));
let stagePlayback: ReturnType<typeof animate> | undefined;
/** 高度锁的代次，连续切换时旧测量与完成回调不再接管新高度。 */
let stageRun = 0;

const ui = computed(() => ({
  root: styles.value.root({ class: cn(props.class, uiOverrides.value.root) }),
  nav: styles.value.nav({ class: uiOverrides.value.nav }),
  navWrapper: styles.value.navWrapper({ class: uiOverrides.value.navWrapper }),
  scrollBody: styles.value.scrollBody({ class: uiOverrides.value.scrollBody }),
  list: styles.value.list({ class: uiOverrides.value.list }),
  tabTitle: styles.value.tabTitle({ class: uiOverrides.value.tabTitle }),
  tabClose: styles.value.tabClose({ class: uiOverrides.value.tabClose }),
  indicator: styles.value.indicator({ class: uiOverrides.value.indicator }),
  tabSlider: sliderClass.value,
  addButton: addButtonClass.value,
  navButton: styles.value.navButton({ class: uiOverrides.value.navButton }),
  dropdown: styles.value.dropdown({ class: uiOverrides.value.dropdown }),
  dropdownPanel: styles.value.dropdownPanel({ class: uiOverrides.value.dropdownPanel }),
  leftExtra: styles.value.leftExtra({ class: uiOverrides.value.leftExtra }),
  rightExtra: styles.value.rightExtra({ class: uiOverrides.value.rightExtra }),
  content: styles.value.content({ class: uiOverrides.value.content }),
  // 只在高度锁定期间裁剪：过渡中新内容高出目标高度的那一截必须藏住，静息态再裁会切掉面板内的浮层
  stage: styles.value.stage({
      class: cn(stageLocked.value && "overflow-hidden", uiOverrides.value.stage),
    }),
}));

const paneClass = computed(() => styles.value.pane({ class: uiOverrides.value.pane }));

/**
 * 选中态与禁用态逐个标签计算，不能并入根节点的一次性样式。
 * 首末位置（tabPlace）也在这里按下标推导：card 的首末圆角不能靠 first:/last: 伪类——
 * 滑动底板恒为标签列的末位兄弟，:last-child 永远落不到最后一个标签上
 */
const tabClassCache = computed(() => ({ variants: baseVariants.value, overrides: uiOverrides.value, tabs: new Map<string, string>(), dropdown: new Map<string, string>() }));
function tabClass(pane: TabPaneMeta, index: number, total: number, selectedKey: TabKey | undefined) {
  const cache = tabClassCache.value;
  const place = total === 1 ? 'both' : index === 0 ? 'first' : index === total - 1 ? 'last' : 'middle';
  const key = `${pane.key === selectedKey}:${pane.disabled}:${place}`;
  if (cache.tabs.has(key)) return cache.tabs.get(key);
  const value = theme({
    ...baseVariants.value,
    active: pane.key === selectedKey,
    disabled: pane.disabled,
    tabPlace: place,
  }).tab({ class: uiOverrides.value.tab });
  cache.tabs.set(key, value);
  return value;
}

/** 下拉选标的单项样式逐个计算：选中与禁用态复用标签的 active / disabled 变体 */
function dropdownItemClass(pane: TabPaneMeta) {
  const cache = tabClassCache.value;
  const key = `${pane.key === currentKey.value}:${pane.disabled}`;
  if (cache.dropdown.has(key)) return cache.dropdown.get(key);
  const value = theme({
    ...baseVariants.value,
    active: pane.key === currentKey.value,
    disabled: pane.disabled,
  }).dropdownItem({ class: uiOverrides.value.dropdownItem });
  cache.dropdown.set(key, value);
  return value;
}

/** 未写 paneKey 的标签页按登记顺序补序号，计数器随组件实例独立 */
let autoKey = 0;

function addPane(meta: TabPaneRegistration): TabPaneMeta {
  const pane = Object.assign(meta, { key: meta.key ?? autoKey++ });
  panes.value = [...panes.value, pane];
  return pane;
}

function removePane(meta: TabPaneMeta) {
  panes.value = panes.value.filter(item => item !== meta);
}

// ─── 拖拽排序 ───────────────────────────────────────────────────

/** 拖拽起点在登记表中的下标；null 表示当前没有拖拽 */
let dragFromIndex: number | null = null;
/** 本次拖拽是否发生过换位，松手时据此决定要不要对外通报 */
let dragMoved = false;
/** 父级改写 order 后接管顺序；仅本地拖拽重排不改变按 key 归一后的签名。 */
watch(() => JSON.stringify(panes.value.map(pane => [typeof pane.key, pane.key, pane.order]).sort((a, b) => JSON.stringify(a.slice(0, 2)).localeCompare(JSON.stringify(b.slice(0, 2))))), () => {
  if (panes.value.every(pane => typeof pane.order === "number" && Number.isFinite(pane.order))) userSorted.value = false;
  sortPanes();
});

/** setup 顺序在标签被插入到中间时会失真，挂载后按内容节点的 DOM 先后重排 */
function sortPanes() {
  // 用户拖拽排序过后不再按 DOM 顺序接管：内容节点仍按书写顺序排列，重排会把拖出来的顺序打回去
  if (userSorted.value) return;
  const explicit = panes.value.every(pane => typeof pane.order === "number" && Number.isFinite(pane.order));
  const next = [...panes.value].sort((a, b) => {
    if (explicit) return a.order! - b.order!;
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
  userSorted.value = true;
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
let indicatorCurrent: { start: number; size: number; vertical: boolean } | undefined;
let indicatorTarget: typeof indicatorCurrent;
let indicatorPlayback: ReturnType<typeof animate> | undefined;
let indicatorRun = 0;
let indicatorPending = false;
let motionMedia: MediaQueryList | undefined;

function applyIndicator(next: NonNullable<typeof indicatorCurrent>, settled = true) {
  indicatorCurrent = next;
  const style: Record<string, string> = next.vertical
    ? { opacity: "1", top: `${next.start}px`, height: `${next.size}px`, transitionDuration: "0ms" }
    : { opacity: "1", left: `${next.start}px`, width: `${next.size}px`, transitionDuration: "0ms" };
  if (indicatorRef.value) {
    indicatorRef.value.style.left = '';
    indicatorRef.value.style.top = '';
    indicatorRef.value.style.width = '';
    indicatorRef.value.style.height = '';
    Object.assign(indicatorRef.value.style, style);
  }
  if (settled) indicatorStyle.value = style;
}

function updateIndicator() {
  const list = listRef.value;
  if (!list || !showIndicator.value) {
    indicatorRun++;
    indicatorPlayback?.stop();
    indicatorPlayback = undefined;
    indicatorCurrent = undefined;
    indicatorTarget = undefined;
    return;
  }
  const tab = list.querySelector<HTMLElement>("[data-tab-active=\"true\"]");
  const title = tab?.querySelector<HTMLElement>("[data-tab-title]") ?? tab;
  if (!title) {
    indicatorRun++;
    indicatorPlayback?.stop();
    indicatorPlayback = undefined;
    indicatorCurrent = undefined;
    indicatorTarget = undefined;
    indicatorStyle.value = { opacity: "0", transitionDuration: "0ms" };
    return;
  }
  const listRect = list.getBoundingClientRect();
  const rect = title.getBoundingClientRect();
  const next = {
    start: isVertical.value ? rect.top - listRect.top : rect.left - listRect.left,
    size: isVertical.value ? rect.height : rect.width,
    vertical: isVertical.value,
  };
  const from = indicatorCurrent;
  const switching = indicatorPending;
  indicatorPending = false;
  indicatorTarget = next;
  // 重复测量同一终点不重新启动弹簧，ResizeObserver 因文字加粗触发时也能继续衔接。
  if (!switching && indicatorPlayback && from?.vertical === next.vertical) return;
  indicatorPlayback?.stop();
  indicatorPlayback = undefined;
  const run = ++indicatorRun;
  if (!switching || !from || from.vertical !== next.vertical || prefersReducedMotion()) {
    applyIndicator(next);
    return;
  }
  indicatorPlayback = animate(0, 1, {
    ...motionPresets.spring,
    onUpdate: progress => {
      if (run !== indicatorRun) return;
      const target = indicatorTarget ?? next;
      applyIndicator({
        ...target,
        start: from.start + (target.start - from.start) * progress,
        size: from.size + (target.size - from.size) * progress,
      }, false);
    },
    onComplete: () => {
      if (run !== indicatorRun) return;
      indicatorPlayback = undefined;
      applyIndicator(indicatorTarget ?? next);
    },
  });
}

/**
 * 底板的落位与液体形变交给 useLiquidSlider，与 RebornRadioGroup 的分段按钮滑块共用一套节奏。
 * 底板要整块盖住选中标签，两个轴向都得写，不像指示条只需要主轴
 */
const { style: sliderStyle, move: moveSlider, hide: hideSlider } = useLiquidSlider(sliderRef);
/** 只有真正换标签才跑形变；resize 与 refresh 引发的重量走直接落位 */
let liquidPending = false;

function updateSlider() {
  const list = listRef.value;
  if (!list || !showSlider.value) return;
  const tab = list.querySelector<HTMLElement>("[data-tab-active=\"true\"]");
  if (!tab) {
    hideSlider();
    return;
  }
  const switching = liquidPending;
  liquidPending = false;
  const listRect = list.getBoundingClientRect();
  const rect = tab.getBoundingClientRect();
  // 卡片类型只做弹簧滑动，胶囊类型额外使用液体形变，均由 Motion 统一调度。
  moveSlider(
    { left: rect.left - listRect.left, top: rect.top - listRect.top, width: rect.width, height: rect.height },
    { switching, liquid: isLiquid.value, vertical: isVertical.value },
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
const observedTabs = new Set<Element>();
let tabObserver: ResizeObserver | undefined;
function observeTabs() {
  const list = listRef.value;
  if (!list || typeof ResizeObserver === "undefined") return;
  tabObserver ??= new ResizeObserver(updateOverlays);
  const targets = new Set(list.querySelectorAll<HTMLElement>("[data-tab-active]"));
  for (const tab of observedTabs) {
    if (targets.has(tab as HTMLElement)) continue;
    tabObserver.unobserve(tab);
    observedTabs.delete(tab);
  }
  for (const tab of targets) {
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
  stagePlayback?.stop();
  stagePlayback = undefined;
  stageRun += 1;
  stageHeight.value = undefined;
  if (stageRef.value) stageRef.value.style.height = '';
  stageLocked.value = false;
}

/**
 * 内容高度过渡。在 pre 冲刷里调用，此刻 DOM 还是旧内容，量到的就是起点高度。
 * 用 offsetHeight 而非 getBoundingClientRect：进场面板带着 scale-[0.98]，后者量出来的是形变后的盒子
 */
async function lockStageHeight() {
  const stage = stageRef.value;
  if (!canFluidHeight.value || !stage || prefersReducedMotion()) return;
  const from = stage.offsetHeight;
  releaseStage();
  const run = stageRun;

  stageHeight.value = `${from}px`;
  stageLocked.value = true;

  // 先让出行内高度量出新内容的自然高度，再写回起点。这几步都是微任务，浏览器不绘制，不会闪
  await nextTick();
  if (run !== stageRun) return;
  stage.style.height = '';
  await nextTick();
  if (run !== stageRun) return;
  const to = stage.offsetHeight;
  if (to === from) {
    releaseStage();
    return;
  }
  stage.style.height = `${from}px`;
  stagePlayback = animate(from, to, {
    ...motionPresets.slow,
    onUpdate: value => { if (run === stageRun) stage.style.height = `${value}px`; },
    onComplete: () => { if (run === stageRun) releaseStage(); },
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
    indicatorPending = true;
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

watch(canFluidHeight, enabled => { if (!enabled) releaseStage(); });

/** 系统关闭动态效果时，正在播放的指示器与内容高度立即落到终点。 */
function syncMotionPreference() {
  if (!motionMedia?.matches) return;
  indicatorRun++;
  indicatorPlayback?.stop();
  indicatorPlayback = undefined;
  if (indicatorTarget) applyIndicator(indicatorTarget);
  releaseStage();
}

onMounted(() => {
  motionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  motionMedia?.addEventListener("change", syncMotionPreference);
});
onUpdated(() => {
  observeTabs();
  // Vue 更新动态样式时会重写最后落定的位置，随后恢复 Motion 当前帧，避免反向切换跳回旧终点。
  if (indicatorCurrent) applyIndicator(indicatorCurrent, false);
});
onBeforeUnmount(() => {
  releaseStage();
  indicatorRun++;
  indicatorPlayback?.stop();
  motionMedia?.removeEventListener("change", syncMotionPreference);
  tabObserver?.disconnect();
  observedTabs.clear();
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
  <div v-bind="$attrs" :class="ui.root" :data-position="resolvedPosition">
    <div :class="ui.nav">
      <!-- 头部起始侧的额外内容：水平方向靠左、垂直方向靠顶，排在箭头与标签列之前 -->
      <div v-if="$slots['left-extra']" :class="ui.leftExtra">
        <slot name="left-extra" />
      </div>

      <!-- 向前箭头。只在 overflow="arrows" 且标签真正溢出时渲染，滚到起点后置灰 -->
      <button
        v-if="showArrows" type="button" :class="ui.navButton" :disabled="!canScrollPrev"
        aria-label="向前滚动标签" @click="scrollByStep(-1)"
      >
        <Icon :name="isVertical ? 'lucide:chevron-up' : 'lucide:chevron-left'" class="size-[1.2em]" />
      </button>

      <!-- 溢出导航模式下 mask 让两端的标签渐隐成透明，滚过哪端哪端才开孔（见 scrollMaskClass） -->
      <div
        ref="wrapperRef" :class="[ui.navWrapper, scrollMaskClass]"
        @scroll.passive="updateOverflowState"
      >
        <!--
          scrollBody 把标签列与新增按钮包进同一份滚动内容：按钮紧贴末尾标签而不是被推到头部最右端，
          代价是标签溢出时按钮跟着滚动（与 uniapp 端一致）
        -->
        <div :class="ui.scrollBody">
          <div ref="listRef" role="tablist" :class="ui.list" :aria-orientation="isVertical ? 'vertical' : 'horizontal'">
            <button
              v-for="(pane, index) in view.panes" :key="pane.key" type="button" role="tab" :class="tabClass(pane, index, view.panes.length, view.key)"
              :disabled="pane.disabled" :aria-selected="pane.key === view.key"
              :data-tab-active="pane.key === view.key"
              :draggable="props.draggable && !pane.disabled ? true : undefined" @click="handleTabClick(pane)"
              @mouseenter="handleTabHover(pane)" @dragstart="handleDragStart(index, $event)"
              @dragover="handleDragOver(index, $event)" @dragend="handleDragEnd" @drop.prevent
            >
              <span data-tab-title :class="ui.tabTitle">
                <component :is="pane.titleSlot" v-if="pane.titleSlot" />
                <template v-else>{{ pane.title }}</template>
              </span>
              <span
                v-if="props.editable && pane.closable" :class="ui.tabClose" role="button"
                :aria-label="`关闭 ${pane.title ?? pane.key}`" @click.stop="handleDelete(pane)"
              >
                <Icon name="lucide:x" class="size-full" />
              </span>
            </button>

            <!-- 指示器跟随选中标题滑动，位置由测量写入行内样式 -->
            <span v-if="showIndicator" ref="indicatorRef" aria-hidden="true" :class="ui.indicator" :style="indicatorStyle" />

            <!--
              选中底板。放在标签之后是为了不让 card 的 [&>*+*]:-ml-px 落到首个标签上，
              层叠顺序与这里的先后无关：底板有 z-index 而标签不定位，底板天然画在所有标签的背景之上，
              标题与关闭图标又提了 z-[1] 压在底板之上，于是底板滑过沿途标签时不会盖住它们的文字
            -->
            <span v-if="showSlider" ref="sliderRef" aria-hidden="true" :class="ui.tabSlider" :style="sliderStyle" />
          </div>

          <button v-if="showAdd" type="button" :class="ui.addButton" aria-label="新增标签" @click="emit('add')">
            <Icon name="lucide:plus" class="size-[1.2em]" />
          </button>
        </div>
      </div>

      <!-- 向后箭头。贴在滚动容器之后，滚到终点后置灰 -->
      <button
        v-if="showArrows" type="button" :class="ui.navButton" :disabled="!canScrollNext"
        aria-label="向后滚动标签" @click="scrollByStep(1)"
      >
        <Icon :name="isVertical ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="size-[1.2em]" />
      </button>

      <!-- 下拉选标。开关与面板包在同一个定位锚点里，点面板外任意处收起 -->
      <div v-if="showDropdown" ref="dropdownRef" :class="ui.dropdown">
        <button
          type="button" :class="ui.navButton" aria-label="展开标签列表" aria-haspopup="listbox"
          :aria-expanded="dropdownOpen" @click="dropdownOpen = !dropdownOpen"
        >
          <Icon
            name="lucide:chevron-down"
            class="size-[1.2em] transition-transform duration-200 motion-reduce:transition-none"
            :class="dropdownOpen && 'rotate-180'"
          />
        </button>
        <div v-if="dropdownOpen" role="listbox" :class="ui.dropdownPanel">
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
      <div v-if="$slots['right-extra']" :class="ui.rightExtra">
        <slot name="right-extra" />
      </div>
    </div>

    <div v-show="!props.hideContent" :class="ui.content">
      <!-- 无内边距的中间层：高度过渡锁在这里，量到的进场面板净高就是要写的高度 -->
      <div ref="stageRef" :class="ui.stage" :style="stageStyle">
        <PaneNodes :nodes="view.nodes" />
      </div>
    </div>
  </div>
</template>
