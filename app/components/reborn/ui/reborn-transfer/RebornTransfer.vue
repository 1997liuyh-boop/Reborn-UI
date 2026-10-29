<script setup lang="ts">
import type {
  TransferCheckShape,
  TransferColor,
  TransferDataRecord,
  TransferFieldNames,
  TransferOperationButtonConfig,
  TransferOperationButtons,
  TransferVariant,
} from "./reborn-transfer.config";
import type { SelectOption } from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornPagination from "~/components/reborn/ui/reborn-pagination/RebornPagination.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornScrollbar from "~/components/reborn/ui/scrollbar/RebornScrollbar.vue";
import { FORM_ITEM_KEY, FORM_KEY, useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { defaultTransferFieldNames } from "./reborn-transfer.config";

/** 分页配置项 */
export interface TransferPaginationConfig {
  /** 每页条数，默认 10 */
  pageSize?: number;
}

const props = withDefaults(defineProps<TransferProps>(), {
  dataSource: () => [],
  defaultTargetKeys: () => [],
  defaultSelectedKeys: () => [],
  titles: () => [] as unknown as [string, string],
  disabled: false,
  showSearch: false,
  headerSelect: "both",
  searchPlaceholder: "请输入搜索内容",
  checkShape: "rounded",
  variant: "outlined",
  color: "primary",
  oneWay: false,
  showUndo: false,
  pagination: false,
  virtualScroll: false,
  virtualItemHeight: 34,
  virtualBuffer: 4,
  fieldNames: () => ({}),
});

// ─── 事件定义 ──────────────────────────────────────────────────────

const emit = defineEmits<{
  /** 条目在两列之间转移时触发，携带新目标列表、方向和本次移动的 key 数组 */
  (e: "change", nextTargetKeys: string[], direction: "right" | "left", moveKeys: string[]): void;
  /** 任意面板的勾选状态发生变化时触发 */
  (e: "selectChange", sourceSelectedKeys: string[], targetSelectedKeys: string[]): void;
  /** 点击撤回按钮，恢复至上一次穿梭前的目标列表 */
  (
    e: "undo",
    nextTargetKeys: string[],
    payload: { direction: "right" | "left"; moveKeys: string[] },
  ): void;
}>();

// ─── 插槽声明 ──────────────────────────────────────────────────────

const slots = defineSlots<{
  /** 头部左侧的勾选区（默认是全选复选框 + 计数文案），左右面板共用，用 direction 区分 */
  title?: (props: TransferTitleSlotProps) => any;
  /** 头部右侧区域（默认是面板标题） */
  extra?: (props: TransferExtraSlotProps) => any;
  /** 列表条目内容；渲染在条目复选框的文案位置，复选框本身仍由组件负责 */
  default?: (props: TransferItemSlotProps) => any;
  /** 旧版条目插槽，作用域只有 { item }；新代码请用 default 插槽，二者同时提供时 default 优先 */
  item?: (props: { item: TransferDataRecord }) => any;
  /** 替换整个列表，复用面板搜索、勾选、穿梭与分页逻辑 */
  list?: (props: TransferListSlotProps) => any;
  /** 面板底部区域，渲染在分页栏下方 */
  footer?: (props: TransferFooterSlotProps) => any;
  /** 整个替换中间操作按钮；不提供时渲染 RebornButton */
  operation?: (props: TransferOperationButtonSlotProps) => any;
  /** 只替换按钮内部内容（默认的图标 + 文案结构），按钮外壳仍是 RebornButton */
  "operation-to-right"?: (props: TransferOperationSlotProps) => any;
  "operation-to-left"?: (props: TransferOperationSlotProps) => any;
  "operation-undo"?: (props: TransferOperationSlotProps) => any;
}>();

const b = tv(theme);

/**
 * 穿梭框自身接入表单：禁用跟随所在表单，字段校验失败时两侧面板描边标红，穿梭（含撤回）后按表单的 trigger 配置触发字段校验。
 * inject 读取的是父组件提供的上下文，不受下面置空的影响
 */
const { disabled: formDisabled, isError, validate } = useFormInject(props);
// useFormInject 已合并表单级与自身的 disabled，这里只做布尔收紧
const isDisabled = computed(() => formDisabled.value === true);

// 内部的 RebornCheckbox 会注入表单上下文：继承表单尺寸与禁用、勾选时触发字段校验、校验失败时描红。
// 这些勾选只是面板内的临时选择，不是表单值，因此对子组件置空隔断，表单交互只由穿梭框自身承担
provide(FORM_KEY, null);
provide(FORM_ITEM_KEY, null);

/** 撤回操作最大步数（固定值，无需对外暴露） */
const MAX_UNDO_STEPS = 20;

// ─── Props ────────────────────────────────────────────────────────

export interface TransferProps {
  /** 数据源，包含所有可选条目（字段名可通过 field-names 映射） */
  dataSource?: TransferDataRecord[];
  /**
   * 数据源字段别名
   * 例如后端返回 { id, name, remark, isDisabled } 时可配置为
   * { key: 'id', label: 'name', description: 'remark', disabled: 'isDisabled' }
   */
  fieldNames?: TransferFieldNames;
  /**
   * 默认已在目标列表（右侧）的条目 key
   * 未绑定 v-model 或目标列表为空时生效；在首次拿到非空 dataSource 时初始化一次，会过滤掉 dataSource 中不存在的 key
   */
  defaultTargetKeys?: string[];
  /** 首次取得非空数据时默认勾选的 key，按目标列表分配至两侧，禁用项不参与 */
  defaultSelectedKeys?: string[];
  /** 两个面板的标题，索引 0 为源列表，索引 1 为目标列表 */
  titles?: [string, string];
  /**
   * 中间操作区三个按钮的自定义配置（图标、文案、样式等）
   * 整个按钮替换用 operation 插槽，只换按钮内部内容用 operation-to-right 等插槽
   */
  operationButtons?: TransferOperationButtons;
  /** 是否禁用整体穿梭框（包括所有勾选与移动操作） */
  disabled?: boolean;
  /** 是否在两个面板顶部显示搜索框 */
  showSearch?: boolean;
  /**
   * 面板头部选择控件模式（variant 为 borderless 时不渲染头部，此项不生效）
   * - 'both'：同时显示全选复选框与下拉菜单（默认）
   * - 'checkbox'：仅显示全选复选框，计数作为复选框文案
   * - 'menu'：仅显示下拉菜单（RebornSelect 多选，触发器显示计数文案；逐项列出当前面板搜索结果内的全部条目，跨分页，点击切换勾选）
   * - 'none'：隐藏所有选择控件，仅保留标题与计数
   */
  headerSelect?: "none" | "checkbox" | "menu" | "both";
  /** 搜索框占位符文字 */
  searchPlaceholder?: string;
  /**
   * 自定义搜索方法，返回 true 表示条目匹配搜索词（item 为原始数据对象）
   * 不传时按 label 字段做不区分大小写的包含匹配
   */
  filterOption?: (inputValue: string, item: TransferDataRecord) => boolean;
  /**
   * 选中框外观
   * - square：方形（直角）
   * - rounded：圆角（默认）
   * - circle：圆形
   */
  checkShape?: TransferCheckShape;
  /**
   * 形态变体
   * - outlined：8px 圆角描边面板，带头部（默认）
   * - borderless：去掉面板边框与内部分隔线，且不渲染头部（全选、下拉菜单、标题、计数一并隐藏）
   */
  variant?: TransferVariant;
  /** 语义色，决定复选框的勾选色、选中条目的底色、头部下拉的选中项颜色与操作按钮颜色 */
  color?: TransferColor;
  /**
   * 单向模式：仅允许从左向右移动，不可移回
   * 开启后右侧为只读展示，不显示头部全选及条目勾选框；
   * 开启单向模式后移入右侧的条目可逐条撤回，开启前就在右侧的条目（含初始值）不可撤回
   */
  oneWay?: boolean;
  /** 是否显示中间撤回按钮（撤销上一次穿梭操作），默认不显示 */
  showUndo?: boolean;
  /**
   * 是否开启列表分页；数据量大时建议开启，避免单页渲染过多条目
   * 传 true 使用默认每页 10 条，或传入 { pageSize } 配置
   */
  pagination?: boolean | TransferPaginationConfig;
  /**
   * 是否开启虚拟滚动：列表只渲染可视区域附近的条目，滚动时按位置替换，适合上千条数据
   * 开启后每行高度固定为 virtualItemHeight 减去 4px 行间距，面板需要确定的高度（传 height 或由父元素给出）
   */
  virtualScroll?: boolean;
  /**
   * 虚拟滚动的行步长（px），即单行高度加上 4px 行间距
   * 默认 34 对应只有 label 的条目（行高 30）；带 description 的条目行高 52，应传 56；用插槽改了条目内容时须与实际高度一致
   */
  virtualItemHeight?: number;
  /** 虚拟滚动在可视区上下各多渲染的条数，快速滚动时减少白屏 */
  virtualBuffer?: number;
  /**
   * 单个面板宽度，两侧相同；不传时按父容器宽度均分
   * 支持数字（px）或 CSS 长度，如 240、'18rem'、'40%'
   */
  width?: string | number;
  /**
   * 组件整体高度；默认不设，由父元素决定（根节点 h-full），列表在面板内用滚动条滚动
   * 支持数字（px）或 CSS 长度，如 320、'20rem'、'50vh'
   */
  height?: string | number;
  class?: any;
  ui?: any;
}

/** 面板方向：left 为源列表，right 为目标列表 */
export type TransferDirection = "left" | "right";

/** title 插槽作用域：头部左侧勾选区 */
export interface TransferTitleSlotProps {
  /** 当前面板方向 */
  direction: TransferDirection;
  /** 当前面板的条目是否可勾选（单向模式下右侧为 false） */
  selectable: boolean;
  /** 当前页可选条目是否已全部勾选 */
  checked: boolean;
  /** 当前页可选条目是否部分勾选 */
  indeterminate: boolean;
  /** 全选是否不可用（整体禁用或当前页没有可选条目） */
  disabled: boolean;
  /** 默认计数文案：未勾选时为「N 项」，有勾选时为「选中 N 项」 */
  countText: string;
  /** 搜索结果内已勾选的条目数 */
  checkedCount: number;
  /** 搜索结果总条目数 */
  total: number;
  /** 切换当前页全选，与默认全选复选框的行为一致 */
  toggle: () => void;
}

/** extra 插槽作用域：头部右侧区域 */
export interface TransferExtraSlotProps {
  /** 当前面板方向 */
  direction: TransferDirection;
  /** titles 中对应面板的标题 */
  title: string;
}

/** default 插槽作用域：单个列表条目 */
export interface TransferItemSlotProps {
  /** 原始数据对象（字段名未归一化） */
  item: TransferDataRecord;
  /** 条目所在面板方向 */
  direction: TransferDirection;
  /** 条目是否已勾选（单向模式右侧恒为 false） */
  checked: boolean;
  /** 条目是否禁用（整体禁用或条目自身禁用） */
  disabled: boolean;
}

/** list 插槽作用域：当前页数据与面板内的勾选状态 */
export interface TransferListSlotProps {
  direction: TransferDirection;
  items: TransferDataRecord[];
  selectedKeys: string[];
  disabled: boolean;
  /** 只更新当前页的勾选，不影响其他页或搜索结果外的勾选 */
  onSelectionChange: (keys: string[]) => void;
}

/** footer 插槽作用域：面板底部 */
export interface TransferFooterSlotProps {
  /** 当前面板方向 */
  direction: TransferDirection;
  /** 搜索结果总条目数 */
  total: number;
  /** 搜索结果内已勾选的条目数 */
  checkedCount: number;
}

/** 单次穿梭操作的历史记录，用于撤回 */
interface TransferHistoryEntry {
  targetKeysSnapshot: string[];
  /** 单向模式下「开启后移入」记录的快照，撤回上一步时一并还原 */
  oneWayMovedKeysSnapshot: string[];
  direction: "right" | "left";
  moveKeys: string[];
}

/** 解析后的中间操作按钮配置（模板直接使用） */
export interface ResolvedOperationButton {
  title: string;
  label?: string;
  icon: string;
  iconClass: string;
  trailingIcon?: string;
  trailingIconClass: string;
  ariaLabel: string;
  showIcon: boolean;
  showTrailingIcon: boolean;
}

/** 操作按钮插槽作用域 */
export interface TransferOperationSlotProps {
  ui: Record<string, (opts?: { class?: any }) => string>;
  config: ResolvedOperationButton;
  disabled: boolean;
}

/** operation 插槽作用域：整个替换中间操作按钮时使用 */
export interface TransferOperationButtonSlotProps {
  /** 按钮对应的操作：toRight 移至右侧、toLeft 移回左侧、undo 撤回上一步 */
  action: "toRight" | "toLeft" | "undo";
  /** 合并 operation-buttons 后的按钮配置（图标、文案、提示） */
  config: ResolvedOperationButton;
  /** 当前是否不可操作 */
  disabled: boolean;
  /** 执行该操作；禁用时调用也不会生效 */
  onClick: () => void;
}

/** 中间区单个操作按钮的渲染描述 */
interface CenterOperationDescriptor {
  key: "toRight" | "toLeft" | "undo";
  slotName: "operation-to-right" | "operation-to-left" | "operation-undo";
  visible: boolean;
  disabled: boolean;
  config: ResolvedOperationButton;
  onClick: () => void;
}

/** 单侧面板的渲染描述：左右面板共用同一份模板，差异都收在这里 */
interface PanelDescriptor {
  direction: TransferDirection;
  title: string;
  selectable: boolean;
  search: string;
  setSearch: (value: string) => void;
  filtered: TransferDataRecord[];
  visible: TransferDataRecord[];
  enabled: TransferDataRecord[];
  allChecked: boolean;
  indeterminate: boolean;
  countText: string;
  checkedCount: number;
  total: number;
  showHeaderCheckbox: boolean;
  toggleAll: () => void;
  toggleItem: (item: TransferDataRecord) => void;
  isChecked: (item: TransferDataRecord) => boolean;
  itemClass: (item: TransferDataRecord) => string;
  onItemClick: (item: TransferDataRecord) => void;
  menuDisabled: boolean;
  isMenuItemChecked: (item: TransferDataRecord) => boolean;
  isMenuItemDisabled: (item: TransferDataRecord) => boolean;
  toggleMenuItem: (item: TransferDataRecord) => void;
  currentPage: number;
  setPage: (page: number) => void;
}

/** 单侧面板的虚拟滚动窗口：与 PanelDescriptor 分开计算，滚动只重算这一份 */
interface PanelVirtualWindow {
  /** 实际渲染的条目：开启虚拟滚动时为可视区间内的切片，否则等于当前页全部条目 */
  rows: TransferDataRecord[];
  /** 窗口层的纵向偏移（px） */
  offset: number;
  /** 占位层的总高度（px） */
  totalHeight: number;
}

/** 列表中单行的渲染数据 */
interface PanelRow {
  item: TransferDataRecord;
  key: string;
  /** 勾选态在父组件渲染时求成普通布尔值，复选框插槽内不再直接读取勾选集合 */
  checked: boolean;
}

/** 单侧头部下拉的选项与选中值：与滚动状态无关，单独缓存，避免滚动时逐帧重建上千个选项 */
interface PanelMenuState {
  options: SelectOption[];
  value: string[];
}

const defaultOperationButtonPresets = {
  toRight: { title: "移至右侧", icon: "lucide:arrow-right", iconClass: "size-4" },
  toLeft: { title: "移回左侧", icon: "lucide:arrow-left", iconClass: "size-4" },
  undo: { title: "撤回上一步", icon: "lucide:rotate-ccw", iconClass: "size-4" },
} as const;

function resolveOperationButton(
  key: keyof typeof defaultOperationButtonPresets,
  custom?: TransferOperationButtonConfig,
): ResolvedOperationButton {
  const preset = defaultOperationButtonPresets[key];
  const title = custom?.title ?? preset.title;
  const icon = custom?.leadingIcon ?? custom?.icon ?? preset.icon;
  const iconClass = custom?.leadingIconClass ?? custom?.iconClass ?? preset.iconClass;
  const trailingIcon = custom?.trailingIcon?.trim() || undefined;
  const trailingIconClass = custom?.trailingIconClass ?? preset.iconClass;
  const label = custom?.label?.trim() || undefined;
  const ariaLabel = custom?.ariaLabel ?? label ?? title;
  const showIcon = custom?.showIcon !== false;
  const showTrailingIcon = custom?.showTrailingIcon !== false && !!trailingIcon;
  return {
    title,
    label,
    icon,
    iconClass,
    trailingIcon,
    trailingIconClass,
    ariaLabel,
    showIcon: showIcon && !!icon,
    showTrailingIcon,
  };
}

function isIconOnlyOperationBtn(config: ResolvedOperationButton): boolean {
  return config.showIcon && !config.label && !config.showTrailingIcon;
}

/** 由 headerSelect 派生，供内部逻辑和模板使用 */
const showHeaderCheckbox = computed(
  () => props.headerSelect === "checkbox" || props.headerSelect === "both",
);
const showHeaderSelectMenu = computed(
  () => props.headerSelect === "menu" || props.headerSelect === "both",
);

// ─── 字段别名与读取 ──────────────────────────────────────────────────

const resolvedFieldNames = computed(() => ({
  key: props.fieldNames?.key ?? defaultTransferFieldNames.key,
  label: props.fieldNames?.label ?? defaultTransferFieldNames.label,
  description: props.fieldNames?.description ?? defaultTransferFieldNames.description,
  disabled: props.fieldNames?.disabled ?? defaultTransferFieldNames.disabled,
}));

function readItemField(
  item: TransferDataRecord,
  field: keyof typeof defaultTransferFieldNames,
): unknown {
  return item[resolvedFieldNames.value[field]];
}

function getItemKey(item: TransferDataRecord): string {
  const value = readItemField(item, "key");
  return value == null ? "" : String(value);
}

function getItemLabel(item: TransferDataRecord): string {
  const value = readItemField(item, "label");
  return value == null ? "" : String(value);
}

function getItemDescription(item: TransferDataRecord): string | undefined {
  const value = readItemField(item, "description");
  if (value == null || value === "") return undefined;
  return String(value);
}

function isItemDisabled(item: TransferDataRecord): boolean {
  return !!readItemField(item, "disabled");
}

// ─── v-model：目标侧 key 列表 ──────────────────────────────────────

const targetKeys = defineModel<string[]>({ default: () => [] });

function resolveDefaultTargetKeys(): string[] {
  if (props.defaultTargetKeys.length === 0) return [];
  const sourceKeySet = new Set(props.dataSource.map((item) => getItemKey(item)));
  return props.defaultTargetKeys.filter((key) => sourceKeySet.has(key));
}

/**
 * 默认目标键只初始化一次：setup 阶段立即尝试，SSR 首屏即可把条目放进右栏；
 * dataSource 异步到达（挂载时为空）时，等首次拿到非空数据再尝试。
 * 目标列表已有值、或已经尝试过一次后立即停止监听，不再对整份数据做深度遍历
 */
/** 尝试应用默认目标键；返回 true 表示已完成（应用过或无需应用），之后不再尝试 */
function settleDefaultTargetKeys(length: number): boolean {
  if (targetKeys.value.length > 0) return true;
  if (length === 0) return false;
  const validKeys = resolveDefaultTargetKeys();
  if (validKeys.length > 0) targetKeys.value = validKeys;
  return true;
}

if (!settleDefaultTargetKeys(props.dataSource.length)) {
  const stopDefaultTargetKeysWatch = watch(
    () => props.dataSource.length,
    (length) => {
      if (settleDefaultTargetKeys(length)) stopDefaultTargetKeysWatch();
    },
  );
}

// ─── 两侧面板搜索关键字 / 勾选状态 ────────────────────────────────

const leftSearch = shallowRef("");
const rightSearch = shallowRef("");
const leftChecked = ref<string[]>([]);
const rightChecked = ref<string[]>([]);

// 默认勾选仅初始化一次；异步数据到达后再按左右面板分配。
if (props.defaultSelectedKeys.length) {
  const stop = watch(() => props.dataSource, (items) => {
    if (!items.length) return;
    const defaults = new Set(props.defaultSelectedKeys);
    const targets = new Set(targetKeys.value);
    const keys = items.filter(item => defaults.has(getItemKey(item)) && !isItemDisabled(item)).map(getItemKey);
    leftChecked.value = keys.filter(key => !targets.has(key));
    rightChecked.value = props.oneWay ? [] : keys.filter(key => targets.has(key));
    nextTick(() => stop());
  }, { immediate: true });
}

/** 穿梭操作历史栈（栈顶为最近一次操作） */
const historyStack = ref<TransferHistoryEntry[]>([]);

/**
 * 单向模式下开启后移入右侧的 key：只有这些条目可以逐条撤回；
 * 开启前就在右侧的条目（含 v-model / defaultTargetKeys 给出的初始值）视为已定结果，不可撤回。
 * 每次开启单向模式时清空
 */
const oneWayMovedKeys = shallowRef<string[]>([]);

/**
 * 各 key 数组的集合形态：成员判断从 includes 的线性查找改为 has，
 * 数据量上千时（虚拟滚动的典型场景）避免分组、全选、计数退化成平方级遍历
 */
const targetKeySet = computed(() => new Set(targetKeys.value));
const leftCheckedSet = computed(() => new Set(leftChecked.value));
const rightCheckedSet = computed(() => new Set(rightChecked.value));
const oneWayMovedKeySet = computed(() => new Set(oneWayMovedKeys.value));

// 外部改写 v-model 时移出右侧的 key 不再算「开启后移入」
watch(targetKeys, (keys) => {
  const keySet = new Set(keys);
  if (oneWayMovedKeys.value.every((k) => keySet.has(k))) return;
  oneWayMovedKeys.value = oneWayMovedKeys.value.filter((k) => keySet.has(k));
});

// ─── 数据分组：按 targetKeys 分成左右两列 ──────────────────────────

const leftItems = computed(() =>
  props.dataSource.filter((item) => !targetKeySet.value.has(getItemKey(item))),
);

const rightItems = computed(() =>
  props.dataSource.filter((item) => targetKeySet.value.has(getItemKey(item))),
);

// ─── 搜索过滤 ──────────────────────────────────────────────────────

function defaultFilter(input: string, item: TransferDataRecord): boolean {
  return getItemLabel(item).toLowerCase().includes(input.toLowerCase());
}

const filterFn = computed(() => props.filterOption ?? defaultFilter);

const filteredLeftItems = computed(() => {
  if (!leftSearch.value) return leftItems.value;
  return leftItems.value.filter((item) => filterFn.value(leftSearch.value, item));
});

const filteredRightItems = computed(() => {
  if (!rightSearch.value) return rightItems.value;
  return rightItems.value.filter((item) => filterFn.value(rightSearch.value, item));
});

// ─── 分页 ──────────────────────────────────────────────────────────

const paginationEnabled = computed(() => !!props.pagination);

const paginationPageSize = computed(() => {
  if (typeof props.pagination === "object" && props.pagination.pageSize) {
    return props.pagination.pageSize;
  }
  return 10;
});

const leftCurrentPage = shallowRef(1);
const rightCurrentPage = shallowRef(1);

function slicePageItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function clampPage(page: number, totalItems: number, pageSize: number): number {
  const maxPage = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  return Math.min(Math.max(1, page), maxPage);
}

const visibleLeftItems = computed(() => {
  if (!paginationEnabled.value) return filteredLeftItems.value;
  return slicePageItems(filteredLeftItems.value, leftCurrentPage.value, paginationPageSize.value);
});

const visibleRightItems = computed(() => {
  if (!paginationEnabled.value) return filteredRightItems.value;
  return slicePageItems(filteredRightItems.value, rightCurrentPage.value, paginationPageSize.value);
});

// 关键词变化后列表换了一批数据，页码与滚动位置都回到开头
watch(leftSearch, () => {
  leftCurrentPage.value = 1;
  resetPanelScroll("left");
});
watch(rightSearch, () => {
  rightCurrentPage.value = 1;
  resetPanelScroll("right");
});

watch(
  () => filteredLeftItems.value.length,
  (len) => {
    if (!paginationEnabled.value) return;
    leftCurrentPage.value = clampPage(leftCurrentPage.value, len, paginationPageSize.value);
  },
);

watch(
  () => filteredRightItems.value.length,
  (len) => {
    if (!paginationEnabled.value) return;
    rightCurrentPage.value = clampPage(rightCurrentPage.value, len, paginationPageSize.value);
  },
);

watch(
  () => props.pagination,
  (enabled) => {
    if (!enabled) {
      leftCurrentPage.value = 1;
      rightCurrentPage.value = 1;
    }
  },
);

// ─── 虚拟滚动 ──────────────────────────────────────────────────────
// 占位层按「条数 × 步长」撑出真实滚动条，窗口层只渲染可视区附近的条目并按偏移平移；
// 滚动距离与可视高度都按左右面板分开记录

/** 首次实测前的可视高度兜底：只影响挂载瞬间多渲染几条，实测后即被替换 */
const VIRTUAL_FALLBACK_VIEWPORT = 320;
/** 行间距（px），与 config 中 panelList / virtualWindow 的 gap-1 保持一致 */
const VIRTUAL_ROW_GAP = 4;

/**
 * 各面板可视区首行的行号（未扣缓冲行）：只在跨行时整体替换，
 * 像素级的滚动事件不会让整个组件重渲染
 */
const panelScrollRow = shallowRef<Record<TransferDirection, number>>({ left: 0, right: 0 });
/** 最近一次的滚动距离（px），非响应式，只在行步长变化时用来重算行号 */
const panelRawScrollTop: Record<TransferDirection, number> = { left: 0, right: 0 };
const panelViewportHeight = ref<Record<TransferDirection, number>>({
  left: VIRTUAL_FALLBACK_VIEWPORT,
  right: VIRTUAL_FALLBACK_VIEWPORT,
});

const scrollbarRefs: Partial<Record<TransferDirection, InstanceType<typeof RebornScrollbar> | null>> =
  {};

function setScrollbarRef(direction: TransferDirection, el: unknown) {
  scrollbarRefs[direction] = (el as InstanceType<typeof RebornScrollbar> | null) ?? null;
}

/** 读取滚动层（RebornScrollbar 的 wrap）的可视高度；面板未挂载或高度为 0 时保留上一次的值 */
function measureViewport(direction: TransferDirection) {
  const height = scrollbarRefs[direction]?.wrapRef?.clientHeight ?? 0;
  if (height > 0 && height !== panelViewportHeight.value[direction]) {
    panelViewportHeight.value[direction] = height;
  }
}

/** 记录滚动距离，换算出的首行行号变化时才写入响应式状态 */
function setPanelScrollTop(direction: TransferDirection, scrollTop: number) {
  panelRawScrollTop[direction] = scrollTop;
  const row = Math.floor(scrollTop / props.virtualItemHeight);
  if (panelScrollRow.value[direction] !== row) {
    panelScrollRow.value = { ...panelScrollRow.value, [direction]: row };
  }
}

function onPanelScroll(direction: TransferDirection, payload: { scrollTop: number }) {
  if (!props.virtualScroll) return;
  setPanelScrollTop(direction, payload.scrollTop);
}

/** 列表换了一批数据（搜索、翻页）时，虚拟窗口与真实滚动位置一起回到顶部 */
function resetPanelScroll(direction: TransferDirection) {
  if (!props.virtualScroll) return;
  setPanelScrollTop(direction, 0);
  scrollbarRefs[direction]?.setScrollTop(0, { animated: false });
}

/**
 * 面板高度会随父元素、搜索框显隐、分页栏出现而变化，滚动事件感知不到，
 * 所以开启虚拟滚动期间用 ResizeObserver 盯住两侧滚动层
 */
let viewportObserver: ResizeObserver | null = null;

function stopViewportObserver() {
  viewportObserver?.disconnect();
  viewportObserver = null;
}

function startViewportObserver() {
  stopViewportObserver();
  const directions: TransferDirection[] = ["left", "right"];
  directions.forEach(measureViewport);
  if (typeof ResizeObserver === "undefined") return;
  viewportObserver = new ResizeObserver(() => directions.forEach(measureViewport));
  for (const direction of directions) {
    const wrap = scrollbarRefs[direction]?.wrapRef;
    if (wrap) viewportObserver.observe(wrap);
  }
}

onMounted(() => {
  if (props.virtualScroll) nextTick(startViewportObserver);
});

watch(
  () => props.virtualScroll,
  (enabled) => {
    if (!enabled) {
      stopViewportObserver();
      return;
    }
    // 关闭期间不记录滚动距离，开启时以滚动层的实际位置为准
    for (const direction of ["left", "right"] as const) {
      setPanelScrollTop(direction, scrollbarRefs[direction]?.wrapRef?.scrollTop ?? 0);
    }
    nextTick(startViewportObserver);
  },
);

// 行步长变化后，同一滚动距离对应的行号也变了，按记录的像素值重算
watch(
  () => props.virtualItemHeight,
  () => {
    if (!props.virtualScroll) return;
    setPanelScrollTop("left", panelRawScrollTop.left);
    setPanelScrollTop("right", panelRawScrollTop.right);
  },
);

onBeforeUnmount(stopViewportObserver);

function computeVirtualWindow(
  items: TransferDataRecord[],
  direction: TransferDirection,
): PanelVirtualWindow {
  if (!props.virtualScroll) return { rows: items, offset: 0, totalHeight: 0 };
  const h = props.virtualItemHeight;
  const buffer = props.virtualBuffer;
  const total = items.length;
  const viewport = panelViewportHeight.value[direction];
  // 末行之后没有行间距，总高度扣掉一个间距，与非虚拟时的列表高度一致
  const totalHeight = total ? total * h - VIRTUAL_ROW_GAP : 0;
  // 数据变少（移走、筛选）而滚动事件尚未回报新位置时，按最大可滚距离截断，避免窗口落在数据之外渲染成空白
  const maxRow = Math.floor(Math.max(0, totalHeight - viewport) / h);
  const row = Math.min(panelScrollRow.value[direction], maxRow);
  const start = Math.max(0, row - buffer);
  const end = Math.min(total, start + Math.ceil(viewport / h) + buffer * 2);
  return { rows: items.slice(start, end), offset: start * h, totalHeight };
}

/** 两侧实际渲染的条目；关闭虚拟滚动时原样返回当前页条目 */
const panelWindows = computed<Record<TransferDirection, PanelVirtualWindow>>(() => ({
  left: computeVirtualWindow(visibleLeftItems.value, "left"),
  right: computeVirtualWindow(visibleRightItems.value, "right"),
}));

/**
 * 两侧实际渲染的行：在窗口切片上附带 key 与勾选态。
 * 复选框的默认插槽在复选框自己的渲染里执行，若插槽里直接读勾选集合，
 * 勾选任意一条都会让全部复选框各自重渲染；这里先求值成普通布尔值再交给插槽
 */
const panelRows = computed<Record<TransferDirection, PanelRow[]>>(() => ({
  left: panelWindows.value.left.rows.map((item) => {
    const key = getItemKey(item);
    return { item, key, checked: leftCheckedSet.value.has(key) };
  }),
  right: panelWindows.value.right.rows.map((item) => {
    const key = getItemKey(item);
    return { item, key, checked: !props.oneWay && rightCheckedSet.value.has(key) };
  }),
}));

/** 虚拟模式下单行的固定高度：步长减去行间距 */
const virtualRowStyle = computed(() =>
  props.virtualScroll ? { height: `${props.virtualItemHeight - VIRTUAL_ROW_GAP}px` } : undefined,
);

/** 占位层高度：撑出与完整列表等长的滚动条 */
function getVirtualPhantomStyle(direction: TransferDirection) {
  if (!props.virtualScroll) return undefined;
  return { height: `${panelWindows.value[direction].totalHeight}px` };
}

/** 窗口层偏移：把当前渲染的切片平移到它在完整列表中的位置 */
function getVirtualWindowStyle(direction: TransferDirection) {
  if (!props.virtualScroll) return undefined;
  return { transform: `translateY(${panelWindows.value[direction].offset}px)` };
}

// ─── 可操作条目 ────────────────────────────────────────────────────

const enabledLeftItems = computed(() => visibleLeftItems.value.filter((i) => !isItemDisabled(i)));
const enabledRightItems = computed(() => visibleRightItems.value.filter((i) => !isItemDisabled(i)));

const leftMovableKeySet = computed(
  () => new Set(leftItems.value.filter((i) => !isItemDisabled(i)).map((i) => getItemKey(i))),
);
const rightMovableKeySet = computed(
  () => new Set(rightItems.value.filter((i) => !isItemDisabled(i)).map((i) => getItemKey(i))),
);

function getLeftCheckedMovableKeys(): string[] {
  return leftChecked.value.filter((k) => leftMovableKeySet.value.has(k));
}

function getRightCheckedMovableKeys(): string[] {
  return rightChecked.value.filter((k) => rightMovableKeySet.value.has(k));
}

// ─── 全选 / 半选状态 ───────────────────────────────────────────────

const leftAllChecked = computed(
  () =>
    enabledLeftItems.value.length > 0 &&
    enabledLeftItems.value.every((i) => leftCheckedSet.value.has(getItemKey(i))),
);
const leftIndeterminate = computed(
  () =>
    !leftAllChecked.value &&
    enabledLeftItems.value.some((i) => leftCheckedSet.value.has(getItemKey(i))),
);

const rightAllChecked = computed(
  () =>
    enabledRightItems.value.length > 0 &&
    enabledRightItems.value.every((i) => rightCheckedSet.value.has(getItemKey(i))),
);
const rightIndeterminate = computed(
  () =>
    !rightAllChecked.value &&
    enabledRightItems.value.some((i) => rightCheckedSet.value.has(getItemKey(i))),
);

// ─── 全选 / 取消全选操作 ───────────────────────────────────────────

function toggleLeftAll() {
  if (isDisabled.value || enabledLeftItems.value.length === 0) return;
  if (leftAllChecked.value) {
    const enabledKeys = new Set(enabledLeftItems.value.map((i) => getItemKey(i)));
    leftChecked.value = leftChecked.value.filter((k) => !enabledKeys.has(k));
  } else {
    const newKeys = enabledLeftItems.value.map((i) => getItemKey(i));
    leftChecked.value = [...new Set([...leftChecked.value, ...newKeys])];
  }
  emitSelectChange();
}

function toggleRightAll() {
  if (isDisabled.value || enabledRightItems.value.length === 0) return;
  if (rightAllChecked.value) {
    const enabledKeys = new Set(enabledRightItems.value.map((i) => getItemKey(i)));
    rightChecked.value = rightChecked.value.filter((k) => !enabledKeys.has(k));
  } else {
    const newKeys = enabledRightItems.value.map((i) => getItemKey(i));
    rightChecked.value = [...new Set([...rightChecked.value, ...newKeys])];
  }
  emitSelectChange();
}

// ─── 头部控件显示逻辑 ──────────────────────────────────────────────

/** borderless 形态不渲染头部，全选、扩展菜单、标题、计数随之隐藏 */
const hasPanelHeader = computed(() => props.variant !== "borderless");

const showRightHeaderCheckbox = computed(() => showHeaderCheckbox.value && !props.oneWay);

watch(
  () => props.oneWay,
  (isOneWay) => {
    if (!isOneWay) return;
    rightChecked.value = [];
    oneWayMovedKeys.value = [];
    emitSelectChange();
  },
);

// ─── 单项勾选 ──────────────────────────────────────────────────────

function toggleLeftItem(item: TransferDataRecord) {
  if (isItemDisabled(item) || isDisabled.value) return;
  const key = getItemKey(item);
  const idx = leftChecked.value.indexOf(key);
  if (idx > -1) leftChecked.value.splice(idx, 1);
  else leftChecked.value.push(key);
  emitSelectChange();
}

function toggleRightItem(item: TransferDataRecord) {
  if (isItemDisabled(item) || isDisabled.value) return;
  const key = getItemKey(item);
  const idx = rightChecked.value.indexOf(key);
  if (idx > -1) rightChecked.value.splice(idx, 1);
  else rightChecked.value.push(key);
  emitSelectChange();
}

function emitSelectChange() {
  emit("selectChange", [...leftChecked.value], [...rightChecked.value]);
}

// ─── 穿梭操作 ──────────────────────────────────────────────────────

function pushHistory(direction: "right" | "left", moveKeys: string[]) {
  if (!props.showUndo) return;
  historyStack.value.push({
    targetKeysSnapshot: [...targetKeys.value],
    oneWayMovedKeysSnapshot: [...oneWayMovedKeys.value],
    direction,
    moveKeys: [...moveKeys],
  });
  const overflow = historyStack.value.length - MAX_UNDO_STEPS;
  if (overflow > 0) historyStack.value.splice(0, overflow);
}

function moveToRight() {
  const validKeys = getLeftCheckedMovableKeys();
  if (!validKeys.length || isDisabled.value) return;
  pushHistory("right", validKeys);
  targetKeys.value = [...targetKeys.value, ...validKeys];
  if (props.oneWay) oneWayMovedKeys.value = [...oneWayMovedKeys.value, ...validKeys];
  const validKeySet = new Set(validKeys);
  leftChecked.value = leftChecked.value.filter((k) => !validKeySet.has(k));
  emit("change", [...targetKeys.value], "right", validKeys);
  validate("change");
  emitSelectChange();
}

function moveToLeft() {
  const validKeys = getRightCheckedMovableKeys();
  if (!validKeys.length || isDisabled.value || props.oneWay) return;
  pushHistory("left", validKeys);
  const validKeySet = new Set(validKeys);
  targetKeys.value = targetKeys.value.filter((k) => !validKeySet.has(k));
  rightChecked.value = rightChecked.value.filter((k) => !validKeySet.has(k));
  emit("change", [...targetKeys.value], "left", validKeys);
  validate("change");
  emitSelectChange();
}

function revertRightItemsByKeys(keys: string[]) {
  if (!props.oneWay || isDisabled.value || !keys.length) return;
  // 只撤回开启单向模式后移入的条目，开启前就在右侧的不动
  const moveKeys = keys.filter(
    (k) => rightMovableKeySet.value.has(k) && oneWayMovedKeySet.value.has(k),
  );
  if (!moveKeys.length) return;
  pushHistory("left", moveKeys);
  const moveKeySet = new Set(moveKeys);
  targetKeys.value = targetKeys.value.filter((k) => !moveKeySet.has(k));
  oneWayMovedKeys.value = oneWayMovedKeys.value.filter((k) => !moveKeySet.has(k));
  emit("change", [...targetKeys.value], "left", moveKeys);
  validate("change");
  emitSelectChange();
}

/** 单向模式下该条目是否为开启后移入右侧的（只有这些条目显示撤回按钮） */
function isOneWayItemMoved(item: TransferDataRecord): boolean {
  return oneWayMovedKeySet.value.has(getItemKey(item));
}

function revertOneWayItem(item: TransferDataRecord) {
  if (!props.oneWay || isDisabled.value || isItemDisabled(item)) return;
  if (!isOneWayItemMoved(item)) return;
  revertRightItemsByKeys([getItemKey(item)]);
}

function isOneWayItemUndoDisabled(item: TransferDataRecord): boolean {
  return isDisabled.value || isItemDisabled(item) || !isOneWayItemMoved(item);
}

// ─── 统计文字 ──────────────────────────────────────────────────────

const leftCheckedCount = computed(() => {
  const filteredKeys = new Set(filteredLeftItems.value.map((i) => getItemKey(i)));
  return leftChecked.value.filter((k) => filteredKeys.has(k)).length;
});

const rightCheckedCount = computed(() => {
  if (props.oneWay) return 0;
  const filteredKeys = new Set(filteredRightItems.value.map((i) => getItemKey(i)));
  return rightChecked.value.filter((k) => filteredKeys.has(k)).length;
});

const leftCountText = computed(() => {
  const total = filteredLeftItems.value.length;
  return leftCheckedCount.value > 0 ? `选中 ${leftCheckedCount.value} 项` : `${total} 项`;
});

const rightCountText = computed(() => {
  const total = filteredRightItems.value.length;
  return rightCheckedCount.value > 0 ? `选中 ${rightCheckedCount.value} 项` : `${total} 项`;
});

// ─── 操作按钮禁用状态 ──────────────────────────────────────────────

const rightBtnDisabled = computed(() => isDisabled.value || getLeftCheckedMovableKeys().length === 0);

const leftBtnDisabled = computed(
  () => isDisabled.value || props.oneWay || getRightCheckedMovableKeys().length === 0,
);

const undoDisabled = computed(
  () => isDisabled.value || !props.showUndo || historyStack.value.length === 0,
);

function undoLast() {
  if (undoDisabled.value) return;
  const entry = historyStack.value.pop();
  if (!entry) return;
  targetKeys.value = [...entry.targetKeysSnapshot];
  oneWayMovedKeys.value = [...entry.oneWayMovedKeysSnapshot];
  leftChecked.value = [];
  rightChecked.value = [];
  const reverseDirection = entry.direction === "right" ? "left" : "right";
  emit("change", [...targetKeys.value], reverseDirection, entry.moveKeys);
  validate("change");
  emit("undo", [...targetKeys.value], { direction: entry.direction, moveKeys: entry.moveKeys });
  emitSelectChange();
}

const toRightOperationBtn = computed(() =>
  resolveOperationButton("toRight", props.operationButtons?.toRight),
);
const toLeftOperationBtn = computed(() =>
  resolveOperationButton("toLeft", props.operationButtons?.toLeft),
);
const undoOperationBtn = computed(() =>
  resolveOperationButton("undo", props.operationButtons?.undo),
);

const centerOperations = computed<CenterOperationDescriptor[]>(() => [
  {
    key: "toRight",
    slotName: "operation-to-right",
    visible: true,
    disabled: rightBtnDisabled.value,
    config: toRightOperationBtn.value,
    onClick: moveToRight,
  },
  {
    key: "toLeft",
    slotName: "operation-to-left",
    visible: !props.oneWay,
    disabled: leftBtnDisabled.value,
    config: toLeftOperationBtn.value,
    onClick: moveToLeft,
  },
  {
    key: "undo",
    slotName: "operation-undo",
    visible: props.showUndo,
    disabled: undoDisabled.value,
    config: undoOperationBtn.value,
    onClick: undoLast,
  },
]);

const visibleCenterOperations = computed(() => centerOperations.value.filter((op) => op.visible));

// ─── 面板宽度与整体高度 ────────────────────────────────────────────

function formatCssSize(value: string | number): string {
  return typeof value === "number" ? `${value}px` : value;
}

function isCssSizeSet(value: string | number | undefined | null): value is string | number {
  return value !== undefined && value !== null && value !== "";
}

const rootStyle = computed(() => {
  const style: Record<string, string> = {};
  if (isCssSizeSet(props.height)) style.height = formatCssSize(props.height);
  return Object.keys(style).length ? style : undefined;
});

const panelStyle = computed(() =>
  isCssSizeSet(props.width) ? { width: formatCssSize(props.width) } : undefined,
);

// ─── 样式计算 ──────────────────────────────────────────────────────

const ui = computed(() => {
  const s = b({
    checkShape: props.checkShape,
    variant: props.variant,
    color: props.color,
    error: isError.value,
    fixedWidth: isCssSizeSet(props.width),
  });
  const ov: any = props.ui ?? {};
  const slot =
    <K extends keyof typeof s>(key: K) =>
      (opts?: { class?: any }) =>
        s[key]({ class: cn(opts?.class, ov[key]) });
  return {
    root: slot("root"),
    panel: slot("panel"),
    panelHeader: slot("panelHeader"),
    headerSelectControls: slot("headerSelectControls"),
    headerSelectMenu: slot("headerSelectMenu"),
    headerSelectTrigger: slot("headerSelectTrigger"),
    headerSelectIconWrapper: slot("headerSelectIconWrapper"),
    headerSelectArrow: slot("headerSelectArrow"),
    headerSelectDropdown: slot("headerSelectDropdown"),
    headerSelectItem: slot("headerSelectItem"),
    panelTitleArea: slot("panelTitleArea"),
    panelTitle: slot("panelTitle"),
    panelCount: slot("panelCount"),
    panelContent: slot("panelContent"),
    panelSearch: slot("panelSearch"),
    searchInput: slot("searchInput"),
    panelBody: slot("panelBody"),
    panelList: slot("panelList"),
    virtualPhantom: slot("virtualPhantom"),
    virtualWindow: slot("virtualWindow"),
    panelFooter: slot("panelFooter"),
    panelPagination: slot("panelPagination"),
    panelEmpty: slot("panelEmpty"),
    checkAll: slot("checkAll"),
    itemCheck: slot("itemCheck"),
    item: slot("item"),
    itemSelected: slot("itemSelected"),
    itemContent: slot("itemContent"),
    itemLabel: slot("itemLabel"),
    itemDesc: slot("itemDesc"),
    itemUndoBtn: slot("itemUndoBtn"),
    itemUndoIcon: slot("itemUndoIcon"),
    operations: slot("operations"),
    operationBtn: slot("operationBtn"),
    operationBtnIconOnly: slot("operationBtnIconOnly"),
    operationBtnIcon: slot("operationBtnIcon"),
    operationBtnLabel: slot("operationBtnLabel"),
  };
});

function getItemClass(isSelected: boolean, itemDisabled: boolean | undefined) {
  return cn(
    ui.value.item(),
    // 选中底色取语义色的 1 级色阶，hover 也锁在同色上，免得选中行悬停时闪回灰底
    isSelected && ui.value.itemSelected(),
    itemDisabled || isDisabled.value
      ? "opacity-50 cursor-not-allowed"
      : !isSelected && "hover:bg-gray-2",
  );
}

function getRightItemClass(item: TransferDataRecord) {
  if (props.oneWay) {
    // 单向模式的右侧行本身不可点（只有撤回按钮可点）：正常时默认光标，禁用时禁止光标
    return cn(
      ui.value.item(),
      isItemDisabled(item) || isDisabled.value
        ? "opacity-50 cursor-not-allowed"
        : "cursor-default hover:bg-gray-2",
    );
  }
  return getItemClass(rightCheckedSet.value.has(getItemKey(item)), isItemDisabled(item));
}

// 撤回按钮禁用时不用 pointer-events-none：会让禁止光标穿透消失；原生 disabled 已拦住点击
function getUndoBtnClass(item: TransferDataRecord) {
  return cn(
    ui.value.itemUndoBtn(),
    (isDisabled.value || isItemDisabled(item))
    && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-gray-5 active:scale-100",
  );
}

function handleRightItemClick(item: TransferDataRecord) {
  if (props.oneWay) return;
  toggleRightItem(item);
}

/**
 * 条目 v-memo 的依赖：只有这些值变化时才重新生成该行，勾选一条只更新这一行，其余行连同复选框整体跳过。
 * 行内用到的 ui 槽位、字段别名、行高以 computed 结果的引用放入，任一变化即全部重新生成。
 * 提供了自定义 default / item 插槽时，插槽可能读取组件外部的状态，v-memo 感知不到，
 * 于是放入每次都不同的新对象，等同关闭缓存（大数据请配合 virtual-scroll 或 pagination）
 */
function getItemMemo(panel: PanelDescriptor, item: TransferDataRecord, checked: boolean): unknown[] {
  if (slots.default || slots.item) return [{}];
  return [
    item,
    isItemDisabled(item),
    getItemLabel(item),
    getItemDescription(item),
    checked,
    panel.selectable,
    isDisabled.value,
    isOneWayItemMoved(item),
    props.oneWay,
    props.color,
    ui.value,
    resolvedFieldNames.value,
    virtualRowStyle.value,
  ];
}

// ─── 头部下拉：交给 RebornSelect 多选 ───────────────────────────────
// 选项是当前面板搜索结果内的全部条目（不受分页限制），选中值由面板勾选态推导，
// 回写时只取前后差集逐条切换，勾选状态仍以面板为准

function isLeftMenuItemDisabled(item: TransferDataRecord): boolean {
  return isDisabled.value || isItemDisabled(item);
}

// 单向模式右侧没有勾选态：只有开启后移入的条目可取消（即撤回到左侧）
function isRightMenuItemDisabled(item: TransferDataRecord): boolean {
  return props.oneWay ? isOneWayItemUndoDisabled(item) : isDisabled.value || isItemDisabled(item);
}

function buildMenuOptions(
  items: TransferDataRecord[],
  isMenuItemDisabled: (item: TransferDataRecord) => boolean,
): SelectOption[] {
  return items.map((item) => ({
    label: getItemLabel(item),
    value: getItemKey(item),
    disabled: isMenuItemDisabled(item),
  }));
}

/**
 * 两侧下拉选项只依赖搜索结果与禁用态，与勾选态、滚动位置无关：
 * 单独缓存后，勾选一条不会把上千个选项整批重建
 */
const leftMenuOptions = computed(() =>
  buildMenuOptions(filteredLeftItems.value, isLeftMenuItemDisabled),
);
const rightMenuOptions = computed(() =>
  buildMenuOptions(filteredRightItems.value, isRightMenuItemDisabled),
);

function getMenuValue(panel: PanelDescriptor): string[] {
  return panel.filtered.filter((item) => panel.isMenuItemChecked(item)).map(getItemKey);
}

function handleMenuChange(panel: PanelDescriptor, value: unknown) {
  const next = new Set(Array.isArray(value) ? value.map(String) : []);
  const current = new Set(getMenuValue(panel));
  for (const item of panel.filtered) {
    const key = getItemKey(item);
    if (next.has(key) !== current.has(key)) panel.toggleMenuItem(item);
  }
}

/** 自定义列表只回写当前页，保留其他页与搜索结果外的勾选。 */
function updatePanelSelection(panel: PanelDescriptor, keys: string[]) {
  if (isDisabled.value || !panel.selectable) return;
  const selected = new Set(keys);
  for (const item of panel.visible) {
    if (selected.has(getItemKey(item)) !== panel.isChecked(item)) panel.toggleItem(item);
  }
}

// ─── 左右面板描述 ──────────────────────────────────────────────────

const panels = computed<[PanelDescriptor, PanelDescriptor]>(() => [
  {
    direction: "left",
    title: props.titles[0],
    selectable: true,
    search: leftSearch.value,
    setSearch: (value) => {
      leftSearch.value = value;
    },
    filtered: filteredLeftItems.value,
    visible: visibleLeftItems.value,
    enabled: enabledLeftItems.value,
    allChecked: leftAllChecked.value,
    indeterminate: leftIndeterminate.value,
    countText: leftCountText.value,
    checkedCount: leftCheckedCount.value,
    total: filteredLeftItems.value.length,
    showHeaderCheckbox: showHeaderCheckbox.value,
    toggleAll: toggleLeftAll,
    toggleItem: toggleLeftItem,
    isChecked: (item) => leftCheckedSet.value.has(getItemKey(item)),
    itemClass: (item) =>
      getItemClass(leftCheckedSet.value.has(getItemKey(item)), isItemDisabled(item)),
    onItemClick: toggleLeftItem,
    menuDisabled: isDisabled.value,
    isMenuItemChecked: (item) => leftCheckedSet.value.has(getItemKey(item)),
    isMenuItemDisabled: isLeftMenuItemDisabled,
    toggleMenuItem: toggleLeftItem,
    currentPage: leftCurrentPage.value,
    setPage: (page) => {
      leftCurrentPage.value = page;
      resetPanelScroll("left");
    },
  },
  {
    direction: "right",
    title: props.titles[1],
    selectable: !props.oneWay,
    search: rightSearch.value,
    setSearch: (value) => {
      rightSearch.value = value;
    },
    filtered: filteredRightItems.value,
    visible: visibleRightItems.value,
    enabled: enabledRightItems.value,
    allChecked: rightAllChecked.value,
    indeterminate: rightIndeterminate.value,
    countText: rightCountText.value,
    checkedCount: rightCheckedCount.value,
    total: filteredRightItems.value.length,
    showHeaderCheckbox: showRightHeaderCheckbox.value,
    toggleAll: toggleRightAll,
    toggleItem: toggleRightItem,
    isChecked: (item) => !props.oneWay && rightCheckedSet.value.has(getItemKey(item)),
    itemClass: getRightItemClass,
    onItemClick: handleRightItemClick,
    menuDisabled: isDisabled.value,
    // 单向模式右侧没有勾选态：右侧条目一律呈选中，只有开启后移入的可取消（即撤回到左侧）
    isMenuItemChecked: (item) => props.oneWay || rightCheckedSet.value.has(getItemKey(item)),
    isMenuItemDisabled: isRightMenuItemDisabled,
    toggleMenuItem: (item) => (props.oneWay ? revertOneWayItem(item) : toggleRightItem(item)),
    currentPage: rightCurrentPage.value,
    setPage: (page) => {
      rightCurrentPage.value = page;
      resetPanelScroll("right");
    },
  },
]);

/**
 * 两侧头部下拉的选项与选中值：选项取自上面单独缓存的 computed，勾选变化只重算选中值，
 * 交给 RebornSelect 的选项数组引用保持不变
 */
const panelMenus = computed<[PanelMenuState, PanelMenuState]>(() => [
  { options: leftMenuOptions.value, value: getMenuValue(panels.value[0]) },
  { options: rightMenuOptions.value, value: getMenuValue(panels.value[1]) },
]);

/** 面板方向只对应元组的两个有效位置，模板无需使用非空断言 */
function getPanelMenu(panel: PanelDescriptor): PanelMenuState {
  return panelMenus.value[panel.direction === "left" ? 0 : 1];
}
</script>

<template>
  <div :class="cn(ui.root(), props.class)" :style="rootStyle">
    <template v-for="(panel, index) in panels" :key="panel.direction">
      <div :class="ui.panel()" :style="panelStyle">
        <!-- 头部：左侧勾选区（title 插槽）+ 下拉菜单，右侧标题（extra 插槽） -->
        <div v-if="hasPanelHeader" :class="ui.panelHeader()">
          <div :class="ui.headerSelectControls()">
            <slot
              name="title" :direction="panel.direction" :selectable="panel.selectable" :checked="panel.allChecked"
              :indeterminate="panel.indeterminate" :disabled="isDisabled || panel.enabled.length === 0"
              :count-text="panel.countText" :checked-count="panel.checkedCount" :total="panel.total"
              :toggle="panel.toggleAll"
            >
              <RebornCheckbox
                v-if="panel.showHeaderCheckbox" :model-value="panel.allChecked"
                :indeterminate="panel.indeterminate" :disabled="isDisabled || panel.enabled.length === 0"
                :color="props.color" size="sm" :label="showHeaderSelectMenu ? undefined : panel.countText"
                :ui="{ control: ui.checkAll(), label: ui.panelCount() }" class="gap-2" @change="panel.toggleAll"
              />
              <span v-else-if="!showHeaderSelectMenu" :class="ui.panelCount()">{{ panel.countText }}</span>
            </slot>

            <!-- 开启下拉时计数文案显示在触发器里，复选框不再重复显示 -->
            <!-- 开启虚拟滚动时下拉列表同样虚拟渲染，选项与面板条目一样多 -->
            <RebornSelect
              v-if="showHeaderSelectMenu" :model-value="getPanelMenu(panel).value"
              :options="getPanelMenu(panel).options" :virtual="props.virtualScroll" multiple collapse-tags
              variant="borderless" size="sm" :clearable="false" :color="props.color" :disabled="panel.menuDisabled"
              :class="ui.headerSelectMenu()"
              :trigger-ui="{
                trigger: ui.headerSelectTrigger(), dropdown: ui.headerSelectDropdown(),
                triggerIconWrapper: ui.headerSelectIconWrapper(), arrow: ui.headerSelectArrow(),
              }"
              :ui="{ option: ui.headerSelectItem() }" @update:model-value="(value) => handleMenuChange(panel, value)"
            >
              <span :class="ui.panelCount()">{{ panel.countText }}</span>
            </RebornSelect>
          </div>

          <div :class="ui.panelTitleArea()">
            <slot name="extra" :direction="panel.direction" :title="panel.title">
              <span :class="ui.panelTitle()">{{ panel.title }}</span>
            </slot>
          </div>
        </div>

        <!-- 内容区：搜索 + 滚动列表 + 底部 -->
        <div :class="ui.panelContent()">
          <div v-if="showSearch" :class="ui.panelSearch()">
            <RebornInput
              size="sm" variant="outlined" suffix-icon="lucide:search" :separator="false"
              :model-value="panel.search" :placeholder="searchPlaceholder" :disabled="isDisabled"
              :class="ui.searchInput()" @update:model-value="(value) => panel.setSearch(String(value ?? ''))"
            />
          </div>

          <div v-if="$slots.list" :class="ui.panelBody()">
            <slot
              name="list" :direction="panel.direction" :items="panel.visible"
              :selected-keys="panel.filtered.filter(panel.isChecked).map(getItemKey)"
              :disabled="isDisabled || !panel.selectable"
              :on-selection-change="keys => updatePanelSelection(panel, keys)"
            />
          </div>
          <RebornScrollbar
            v-else
            :ref="(el) => setScrollbarRef(panel.direction, el)" :size="4" :horizontal="false"
            :class="ui.panelBody()" :content-class="ui.panelList()"
            @scroll="(payload) => onPanelScroll(panel.direction, payload)"
          >
            <!--
              虚拟滚动：占位层撑出总高度，窗口层按偏移贴到可视区；
              关闭时两层都是 display: contents，不产生盒子，条目仍直接排在 panelList 的 flex 列里
            -->
            <div
              v-if="panel.filtered.length" :class="props.virtualScroll ? ui.virtualPhantom() : 'contents'"
              :style="getVirtualPhantomStyle(panel.direction)"
            >
              <div
                :class="props.virtualScroll ? ui.virtualWindow() : 'contents'"
                :style="getVirtualWindowStyle(panel.direction)"
              >
                <!--
                  左右面板各用一处 v-for：v-memo 的缓存按模板里的编译位置存放，
                  两侧共用一处 v-for 时会互相覆盖缓存、永远命中不了。左侧条目恒可勾选，右侧在单向模式下只读
                -->
                <template v-if="panel.direction === 'left'">
                  <!-- eslint-disable vue/valid-v-memo -- 外层面板循环里这处 v-for 每次渲染只执行一次（仅左侧），缓存不会被另一侧覆盖 -->
                  <div
                    v-for="{ item, key, checked } in panelRows.left"
                    :key="key"
                    v-memo="getItemMemo(panel, item, checked)"
                    :class="panel.itemClass(item)"
                    :style="virtualRowStyle"
                    @click="panel.onItemClick(item)"
                  >
                    <!-- eslint-enable vue/valid-v-memo -->
                    <!-- 复选框自身的点击由 change 处理，这里截停冒泡，避免行点击再切换一次 -->
                    <span :class="ui.itemContent()" @click.stop>
                      <RebornCheckbox
                        :model-value="checked"
                        :disabled="isDisabled || isItemDisabled(item)"
                        :color="props.color"
                        size="sm"
                        :ui="{ control: ui.itemCheck(), label: 'min-w-0 flex-1' }"
                        class="flex w-full gap-2"
                        @change="panel.toggleItem(item)"
                      >
                        <slot :item="item" :direction="panel.direction" :checked="checked" :disabled="isDisabled || isItemDisabled(item)">
                          <slot name="item" :item="item">
                            <div :class="ui.itemLabel()">{{ getItemLabel(item) }}</div>
                            <div v-if="getItemDescription(item)" :class="ui.itemDesc()">
                              {{ getItemDescription(item) }}
                            </div>
                          </slot>
                        </slot>
                      </RebornCheckbox>
                    </span>
                  </div>
                </template>

                <template v-else>
                  <!-- eslint-disable vue/valid-v-memo -- 同上，这处 v-for 每次渲染只执行一次（仅右侧） -->
                  <div
                    v-for="{ item, key, checked } in panelRows.right"
                    :key="key"
                    v-memo="getItemMemo(panel, item, checked)"
                    :class="panel.itemClass(item)"
                    :style="virtualRowStyle"
                    @click="panel.onItemClick(item)"
                  >
                    <!-- eslint-enable vue/valid-v-memo -->
                    <!-- 与左侧条目的复选框结构一致，修改时两处同步 -->
                    <span v-if="panel.selectable" :class="ui.itemContent()" @click.stop>
                      <RebornCheckbox
                        :model-value="checked"
                        :disabled="isDisabled || isItemDisabled(item)"
                        :color="props.color"
                        size="sm"
                        :ui="{ control: ui.itemCheck(), label: 'min-w-0 flex-1' }"
                        class="flex w-full gap-2"
                        @change="panel.toggleItem(item)"
                      >
                        <slot :item="item" :direction="panel.direction" :checked="checked" :disabled="isDisabled || isItemDisabled(item)">
                          <slot name="item" :item="item">
                            <div :class="ui.itemLabel()">{{ getItemLabel(item) }}</div>
                            <div v-if="getItemDescription(item)" :class="ui.itemDesc()">
                              {{ getItemDescription(item) }}
                            </div>
                          </slot>
                        </slot>
                      </RebornCheckbox>
                    </span>

                    <!-- 单向模式：右侧条目不可勾选；开启后移入的条目右侧显示撤回按钮，开启前就在右侧的没有 -->
                    <template v-else>
                      <div :class="ui.itemContent()">
                        <slot :item="item" :direction="panel.direction" :checked="false" :disabled="isDisabled || isItemDisabled(item)">
                          <slot name="item" :item="item">
                            <div :class="ui.itemLabel()">{{ getItemLabel(item) }}</div>
                            <div v-if="getItemDescription(item)" :class="ui.itemDesc()">
                              {{ getItemDescription(item) }}
                            </div>
                          </slot>
                        </slot>
                      </div>
                      <button
                        v-if="isOneWayItemMoved(item)"
                        type="button"
                        :class="getUndoBtnClass(item)"
                        title="撤回"
                        :disabled="isDisabled || isItemDisabled(item)"
                        aria-label="撤回到左侧"
                        @click.stop="revertOneWayItem(item)"
                      >
                        <Icon name="lucide:undo-2" :class="ui.itemUndoIcon()" />
                      </button>
                    </template>
                  </div>
                </template>
              </div>
            </div>

            <div v-else :class="ui.panelEmpty()">
              <Icon name="lucide:inbox" class="size-8 opacity-40" />
              <span>{{ panel.search ? "无匹配结果" : "暂无数据" }}</span>
            </div>
          </RebornScrollbar>

          <div v-if="$slots.footer || (paginationEnabled && panel.filtered.length)" :class="ui.panelFooter()">
            <div v-if="paginationEnabled && panel.filtered.length" :class="ui.panelPagination()">
              <RebornPagination
                :model-value="panel.currentPage" :total="panel.filtered.length"
                :page-size="paginationPageSize" :disabled="isDisabled" size="sm" @update:model-value="panel.setPage"
              />
            </div>
            <slot name="footer" :direction="panel.direction" :total="panel.total" :checked-count="panel.checkedCount" />
          </div>
        </div>
      </div>

      <!-- 中间操作按钮：插在左右面板之间 -->
      <div v-if="index === 0" :class="ui.operations()">
        <template v-for="op in visibleCenterOperations" :key="op.key">
          <slot name="operation" :action="op.key" :config="op.config" :disabled="op.disabled" :on-click="op.onClick">
            <!-- 禁用时改用 neutral，避免彩色底的禁用按钮被误认为可点 -->
            <RebornButton
              type="button" size="sm" :color="op.disabled ? 'neutral' : props.color" :disabled="op.disabled"
              :title="op.config.title" :aria-label="op.config.ariaLabel" :class="cn(ui.operationBtn(), isIconOnlyOperationBtn(op.config) && ui.operationBtnIconOnly())
              " @click="op.onClick"
            >
              <slot
                v-if="$slots[op.slotName]" :name="op.slotName" :ui="ui" :config="op.config"
                :disabled="op.disabled"
              />
              <template v-else>
                <span v-if="op.config.showIcon" :class="ui.operationBtnIcon()">
                  <Icon :name="op.config.icon" :class="op.config.iconClass" />
                </span>
                <span v-if="op.config.label" :class="ui.operationBtnLabel()">{{ op.config.label }}</span>
                <span v-if="op.config.showTrailingIcon && op.config.trailingIcon" :class="ui.operationBtnIcon()">
                  <Icon :name="op.config.trailingIcon" :class="op.config.trailingIconClass" />
                </span>
              </template>
            </RebornButton>
          </slot>
        </template>
      </div>
    </template>
  </div>
</template>
