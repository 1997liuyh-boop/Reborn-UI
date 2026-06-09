<script setup lang="ts">
import type {
  TransferCheckShape,
  TransferDataRecord,
  TransferFieldNames,
  TransferOperationButtonConfig,
  TransferOperationButtons,
  TransferSize,
} from "./reborn-transfer.config";
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from "vue";
import RebornPagination from "~/components/reborn/ui/reborn-pagination/RebornPagination.vue";
import RebornTransition from "~/components/reborn/ui/reborn-transition/RebornTransition.vue";
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
  titles: () => ["源列表", "目标列表"] as [string, string],
  disabled: false,
  showSearch: false,
  headerSelect: "checkbox",
  searchPlaceholder: "请输入搜索内容",
  size: "md",
  checkShape: "rounded",
  oneWay: false,
  showUndo: false,
  pagination: false,
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

defineSlots<{
  /** 自定义列表条目内容，作用域参数为 { item }（原始数据对象，字段名未归一化） */
  item: (props: { item: TransferDataRecord }) => any;
  /** 完全自定义按钮内容（替换默认的图标 + 文案结构） */
  "operation-to-right"?: (props: TransferOperationSlotProps) => any;
  "operation-to-left"?: (props: TransferOperationSlotProps) => any;
  "operation-undo"?: (props: TransferOperationSlotProps) => any;
}>();

const b = tv(theme);

/** 勾选图标，复用于头部全选框和条目复选框（避免模板中重复内联 SVG） */
const CheckMark = () =>
  h("svg", { class: "size-2.5 text-white", viewBox: "0 0 10 10", fill: "none" }, [
    h("path", {
      d: "M1.5 5L4 7.5L8.5 2.5",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  ]);

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
   * 未绑定 v-model 或目标列表为空时生效；仅初始化一次，会过滤掉 dataSource 中不存在的 key
   */
  defaultTargetKeys?: string[];
  /** 两个面板的标题，索引 0 为源列表，索引 1 为目标列表 */
  titles?: [string, string];
  /**
   * 中间操作区三个按钮的自定义配置（图标、文案、样式等）
   * 如需完全自定义按钮结构，可使用 operation-to-right 等插槽
   */
  operationButtons?: TransferOperationButtons;
  /** 是否禁用整体穿梭框（包括所有勾选与移动操作） */
  disabled?: boolean;
  /** 是否在两个面板顶部显示搜索框 */
  showSearch?: boolean;
  /**
   * 面板头部选择控件模式
   * - 'checkbox'：仅显示全选复选框（默认）
   * - 'menu'：仅显示下拉扩展菜单（全选所有 / 全选当页 / 反选当页）
   * - 'both'：同时显示全选复选框与下拉菜单
   * - 'none'：隐藏所有选择控件，仅保留标题与计数
   */
  headerSelect?: "none" | "checkbox" | "menu" | "both";
  /** 搜索框占位符文字 */
  searchPlaceholder?: string;
  /** 自定义过滤函数，返回 true 表示条目匹配搜索词（item 为原始数据对象） */
  filterOption?: (inputValue: string, item: TransferDataRecord) => boolean;
  /** 组件尺寸 */
  size?: TransferSize;
  /**
   * 选中框外观
   * - square：方形（直角）
   * - rounded：圆角（默认）
   * - circle：圆形
   */
  checkShape?: TransferCheckShape;
  /**
   * 单向模式：仅允许从左向右移动，不可移回
   * 开启后右侧为只读展示，不显示头部全选及条目勾选框
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
   * 组件整体宽度
   * 支持数字（px）或 CSS 长度，如 640、'100%'、'50vw'
   */
  width?: string | number;
  /**
   * 组件整体高度；设置后列表区域在固定高度内滚动（头部、搜索、分页栏固定不滚动）
   * 支持数字（px）或 CSS 长度，如 320、'20rem'、'50vh'
   */
  height?: string | number;
  class?: any;
  ui?: any;
}

/** 单次穿梭操作的历史记录，用于撤回 */
interface TransferHistoryEntry {
  targetKeysSnapshot: string[];
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

/** 中间区单个操作按钮的渲染描述 */
interface CenterOperationDescriptor {
  key: "toRight" | "toLeft" | "undo";
  slotName: "operation-to-right" | "operation-to-left" | "operation-undo";
  visible: boolean;
  disabled: boolean;
  config: ResolvedOperationButton;
  onClick: () => void;
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

const defaultTargetKeysApplied = ref(false);

function resolveDefaultTargetKeys(): string[] {
  if (props.defaultTargetKeys.length === 0) return [];
  const sourceKeySet = new Set(props.dataSource.map((item) => getItemKey(item)));
  return props.defaultTargetKeys.filter((key) => sourceKeySet.has(key));
}

function applyDefaultTargetKeys() {
  if (defaultTargetKeysApplied.value) return;
  if (targetKeys.value.length > 0) {
    defaultTargetKeysApplied.value = true;
    return;
  }
  const validKeys = resolveDefaultTargetKeys();
  if (validKeys.length > 0) {
    targetKeys.value = [...validKeys];
  }
  defaultTargetKeysApplied.value = true;
}

onMounted(() => {
  applyDefaultTargetKeys();
});

watch(
  () => props.dataSource,
  () => {
    if (!defaultTargetKeysApplied.value) {
      applyDefaultTargetKeys();
    }
  },
  { deep: true },
);

// ─── 两侧面板搜索关键字 / 勾选状态 ────────────────────────────────

const leftSearch = ref("");
const rightSearch = ref("");
const leftChecked = ref<string[]>([]);
const rightChecked = ref<string[]>([]);

/** 穿梭操作历史栈（栈顶为最近一次操作） */
const historyStack = ref<TransferHistoryEntry[]>([]);

// ─── 数据分组：按 targetKeys 分成左右两列 ──────────────────────────

const leftItems = computed(() =>
  props.dataSource.filter((item) => !targetKeys.value.includes(getItemKey(item))),
);

const rightItems = computed(() =>
  props.dataSource.filter((item) => targetKeys.value.includes(getItemKey(item))),
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

const leftCurrentPage = ref(1);
const rightCurrentPage = ref(1);

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

watch(leftSearch, () => {
  leftCurrentPage.value = 1;
});
watch(rightSearch, () => {
  rightCurrentPage.value = 1;
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

// ─── 可操作条目 ────────────────────────────────────────────────────

const enabledLeftItems = computed(() => visibleLeftItems.value.filter((i) => !isItemDisabled(i)));
const enabledRightItems = computed(() => visibleRightItems.value.filter((i) => !isItemDisabled(i)));

/** 全选所有范围：当前侧全部过滤结果（跨分页，受搜索影响） */
const enabledLeftScopeItems = computed(() =>
  filteredLeftItems.value.filter((i) => !isItemDisabled(i)),
);
const enabledRightScopeItems = computed(() =>
  filteredRightItems.value.filter((i) => !isItemDisabled(i)),
);

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
    enabledLeftItems.value.every((i) => leftChecked.value.includes(getItemKey(i))),
);
const leftIndeterminate = computed(
  () =>
    !leftAllChecked.value &&
    enabledLeftItems.value.some((i) => leftChecked.value.includes(getItemKey(i))),
);

const rightAllChecked = computed(
  () =>
    enabledRightItems.value.length > 0 &&
    enabledRightItems.value.every((i) => rightChecked.value.includes(getItemKey(i))),
);
const rightIndeterminate = computed(
  () =>
    !rightAllChecked.value &&
    enabledRightItems.value.some((i) => rightChecked.value.includes(getItemKey(i))),
);

const leftAllScopeChecked = computed(
  () =>
    enabledLeftScopeItems.value.length > 0 &&
    enabledLeftScopeItems.value.every((i) => leftChecked.value.includes(getItemKey(i))),
);

const rightAllScopeChecked = computed(
  () =>
    enabledRightScopeItems.value.length > 0 &&
    enabledRightScopeItems.value.every((i) => rightChecked.value.includes(getItemKey(i))),
);

// ─── 全选 / 取消全选操作 ───────────────────────────────────────────

function toggleLeftAll() {
  if (props.disabled || enabledLeftItems.value.length === 0) return;
  if (leftAllChecked.value) {
    leftChecked.value = leftChecked.value.filter(
      (k) => !enabledLeftItems.value.some((i) => getItemKey(i) === k),
    );
  } else {
    const newKeys = enabledLeftItems.value.map((i) => getItemKey(i));
    leftChecked.value = [...new Set([...leftChecked.value, ...newKeys])];
  }
  emitSelectChange();
}

function toggleRightAll() {
  if (props.disabled || enabledRightItems.value.length === 0) return;
  if (rightAllChecked.value) {
    rightChecked.value = rightChecked.value.filter(
      (k) => !enabledRightItems.value.some((i) => getItemKey(i) === k),
    );
  } else {
    const newKeys = enabledRightItems.value.map((i) => getItemKey(i));
    rightChecked.value = [...new Set([...rightChecked.value, ...newKeys])];
  }
  emitSelectChange();
}

// ─── 头部下拉：click 触发 + 点击外部关闭 ──────────────────────────

const leftSelectMenuOpen = ref(false);
const rightSelectMenuOpen = ref(false);

function closeHeaderSelectMenus() {
  leftSelectMenuOpen.value = false;
  rightSelectMenuOpen.value = false;
}

function toggleLeftSelectMenu() {
  if (!showHeaderSelectMenu.value || props.disabled) return;
  const next = !leftSelectMenuOpen.value;
  closeHeaderSelectMenus();
  leftSelectMenuOpen.value = next;
}

function toggleRightSelectMenu() {
  if (!showHeaderSelectMenu.value || props.disabled) return;
  const next = !rightSelectMenuOpen.value;
  closeHeaderSelectMenus();
  rightSelectMenuOpen.value = next;
}

onMounted(() => document.addEventListener("click", closeHeaderSelectMenus));
onBeforeUnmount(() => document.removeEventListener("click", closeHeaderSelectMenus));

// ─── 头部菜单操作 ──────────────────────────────────────────────────

function toggleLeftAllScope() {
  if (props.disabled || enabledLeftScopeItems.value.length === 0) return;
  const allKeys = new Set(enabledLeftScopeItems.value.map((i) => getItemKey(i)));
  if (leftAllScopeChecked.value) {
    leftChecked.value = leftChecked.value.filter((k) => !allKeys.has(k));
  } else {
    leftChecked.value = [...new Set([...leftChecked.value, ...allKeys])];
  }
  leftSelectMenuOpen.value = false;
  emitSelectChange();
}

function selectLeftPage() {
  if (props.disabled || enabledLeftItems.value.length === 0) return;
  const newKeys = enabledLeftItems.value.map((i) => getItemKey(i));
  leftChecked.value = [...new Set([...leftChecked.value, ...newKeys])];
  leftSelectMenuOpen.value = false;
  emitSelectChange();
}

function invertLeftPage() {
  if (props.disabled || enabledLeftItems.value.length === 0) return;
  const pageKeys = new Set(enabledLeftItems.value.map((i) => getItemKey(i)));
  const next = new Set(leftChecked.value);
  for (const key of pageKeys) {
    if (next.has(key)) next.delete(key);
    else next.add(key);
  }
  leftChecked.value = [...next];
  leftSelectMenuOpen.value = false;
  emitSelectChange();
}

function toggleRightAllScope() {
  if (props.disabled || enabledRightScopeItems.value.length === 0) return;
  const allKeys = new Set(enabledRightScopeItems.value.map((i) => getItemKey(i)));
  if (rightAllScopeChecked.value) {
    rightChecked.value = rightChecked.value.filter((k) => !allKeys.has(k));
  } else {
    rightChecked.value = [...new Set([...rightChecked.value, ...allKeys])];
  }
  rightSelectMenuOpen.value = false;
  emitSelectChange();
}

function selectRightPage() {
  if (props.disabled || enabledRightItems.value.length === 0) return;
  const newKeys = enabledRightItems.value.map((i) => getItemKey(i));
  rightChecked.value = [...new Set([...rightChecked.value, ...newKeys])];
  rightSelectMenuOpen.value = false;
  emitSelectChange();
}

function invertRightPage() {
  if (props.disabled || enabledRightItems.value.length === 0) return;
  const pageKeys = new Set(enabledRightItems.value.map((i) => getItemKey(i)));
  const next = new Set(rightChecked.value);
  for (const key of pageKeys) {
    if (next.has(key)) next.delete(key);
    else next.add(key);
  }
  rightChecked.value = [...next];
  rightSelectMenuOpen.value = false;
  emitSelectChange();
}

// ─── 头部控件显示逻辑 ──────────────────────────────────────────────

const showLeftHeaderSelectControls = computed(
  () => showHeaderCheckbox.value || showHeaderSelectMenu.value,
);

const showRightHeaderCheckbox = computed(() => showHeaderCheckbox.value && !props.oneWay);

const showRightHeaderSelectControls = computed(
  () => showRightHeaderCheckbox.value || showHeaderSelectMenu.value,
);

watch(showHeaderSelectMenu, (visible) => {
  if (!visible) closeHeaderSelectMenus();
});

watch(
  () => props.oneWay,
  (isOneWay) => {
    if (!isOneWay) return;
    rightChecked.value = [];
    closeHeaderSelectMenus();
    emitSelectChange();
  },
);

// ─── 单项勾选 ──────────────────────────────────────────────────────

function toggleLeftItem(item: TransferDataRecord) {
  if (isItemDisabled(item) || props.disabled) return;
  const key = getItemKey(item);
  const idx = leftChecked.value.indexOf(key);
  if (idx > -1) leftChecked.value.splice(idx, 1);
  else leftChecked.value.push(key);
  emitSelectChange();
}

function toggleRightItem(item: TransferDataRecord) {
  if (isItemDisabled(item) || props.disabled) return;
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
    direction,
    moveKeys: [...moveKeys],
  });
  const overflow = historyStack.value.length - MAX_UNDO_STEPS;
  if (overflow > 0) historyStack.value.splice(0, overflow);
}

function moveToRight() {
  const validKeys = getLeftCheckedMovableKeys();
  if (!validKeys.length || props.disabled) return;
  pushHistory("right", validKeys);
  targetKeys.value = [...targetKeys.value, ...validKeys];
  leftChecked.value = leftChecked.value.filter((k) => !validKeys.includes(k));
  emit("change", [...targetKeys.value], "right", validKeys);
  emitSelectChange();
}

function moveToLeft() {
  const validKeys = getRightCheckedMovableKeys();
  if (!validKeys.length || props.disabled || props.oneWay) return;
  pushHistory("left", validKeys);
  targetKeys.value = targetKeys.value.filter((k) => !validKeys.includes(k));
  rightChecked.value = rightChecked.value.filter((k) => !validKeys.includes(k));
  emit("change", [...targetKeys.value], "left", validKeys);
  emitSelectChange();
}

function revertRightItemsByKeys(keys: string[]) {
  if (!props.oneWay || props.disabled || !keys.length) return;
  const moveKeys = keys.filter((k) => rightMovableKeySet.value.has(k));
  if (!moveKeys.length) return;
  pushHistory("left", moveKeys);
  targetKeys.value = targetKeys.value.filter((k) => !moveKeys.includes(k));
  rightSelectMenuOpen.value = false;
  emit("change", [...targetKeys.value], "left", moveKeys);
  emitSelectChange();
}

function revertRightPage() {
  revertRightItemsByKeys(enabledRightItems.value.map((i) => getItemKey(i)));
}

function revertRightAll() {
  revertRightItemsByKeys(enabledRightScopeItems.value.map((i) => getItemKey(i)));
}

function revertOneWayItem(item: TransferDataRecord) {
  if (!props.oneWay || props.disabled || isItemDisabled(item)) return;
  const key = getItemKey(item);
  if (!targetKeys.value.includes(key)) return;
  revertRightItemsByKeys([key]);
}

function isOneWayItemUndoDisabled(item: TransferDataRecord): boolean {
  return props.disabled || isItemDisabled(item);
}

const rightHeaderSelectMenuDisabled = computed(() => {
  if (props.disabled) return true;
  if (props.oneWay) return rightItems.value.length === 0;
  return enabledRightScopeItems.value.length === 0;
});

function undoLast() {
  if (undoDisabled.value) return;
  const entry = historyStack.value.pop();
  if (!entry) return;
  targetKeys.value = [...entry.targetKeysSnapshot];
  leftChecked.value = [];
  rightChecked.value = [];
  const reverseDirection = entry.direction === "right" ? "left" : "right";
  emit("change", [...targetKeys.value], reverseDirection, entry.moveKeys);
  emit("undo", [...targetKeys.value], { direction: entry.direction, moveKeys: entry.moveKeys });
  emitSelectChange();
}

// ─── 统计文字 ──────────────────────────────────────────────────────

const leftCountText = computed(() => {
  const checked = leftChecked.value.filter((k) =>
    filteredLeftItems.value.some((i) => getItemKey(i) === k),
  ).length;
  const total = filteredLeftItems.value.length;
  return checked > 0 ? `${checked} / ${total}` : `${total} 项`;
});

const rightCountText = computed(() => {
  const total = filteredRightItems.value.length;
  if (props.oneWay) return `${total} 项`;
  const checked = rightChecked.value.filter((k) =>
    filteredRightItems.value.some((i) => getItemKey(i) === k),
  ).length;
  return checked > 0 ? `${checked} / ${total}` : `${total} 项`;
});

// ─── 操作按钮禁用状态 ──────────────────────────────────────────────

const rightBtnDisabled = computed(() => props.disabled || getLeftCheckedMovableKeys().length === 0);

const leftBtnDisabled = computed(
  () => props.disabled || props.oneWay || getRightCheckedMovableKeys().length === 0,
);

const undoDisabled = computed(
  () => props.disabled || !props.showUndo || historyStack.value.length === 0,
);

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

// ─── 固定尺寸与滚动 ──────────────────────────────────────────────────

function formatCssSize(value: string | number): string {
  return typeof value === "number" ? `${value}px` : value;
}

function isCssSizeSet(value: string | number | undefined | null): value is string | number {
  return value !== undefined && value !== null && value !== "";
}

const useFixedListHeight = computed(() => isCssSizeSet(props.height));

const rootStyle = computed(() => {
  const style: Record<string, string> = {};
  if (isCssSizeSet(props.width)) style.width = formatCssSize(props.width);
  if (isCssSizeSet(props.height)) style.height = formatCssSize(props.height);
  return Object.keys(style).length ? style : undefined;
});

function getPanelClass() {
  return cn(ui.value.panel(), useFixedListHeight.value && "h-full min-h-0");
}

function getPanelBodyClass(...extra: Array<string | false | undefined>) {
  return cn(
    ui.value.panelBody(),
    useFixedListHeight.value && "max-h-none min-h-0 flex-1 overflow-y-auto",
    ...extra,
  );
}

function getPanelContentClass(...extra: Array<string | false | undefined>) {
  return cn(
    ui.value.panelContent(),
    useFixedListHeight.value && "max-h-none min-h-0 flex-1",
    ...extra,
  );
}

function getPanelEmptyClass() {
  return cn(ui.value.panelEmpty(), useFixedListHeight.value && "min-h-0 flex-1");
}

// ─── 样式计算 ──────────────────────────────────────────────────────

const ui = computed(() => {
  const s = b({ size: props.size, checkShape: props.checkShape });
  const ov: any = props.ui ?? {};
  const slot =
    <K extends keyof typeof s>(key: K) =>
    (opts?: { class?: any }) =>
      s[key]({ class: cn(opts?.class, ov[key]) });
  return {
    root: slot("root"),
    panel: slot("panel"),
    panelHeader: slot("panelHeader"),
    panelTitleArea: slot("panelTitleArea"),
    panelTitle: slot("panelTitle"),
    panelCount: slot("panelCount"),
    panelSearch: slot("panelSearch"),
    searchWrapper: slot("searchWrapper"),
    searchIcon: slot("searchIcon"),
    searchInput: slot("searchInput"),
    panelContent: slot("panelContent"),
    panelBody: slot("panelBody"),
    panelBodyFill: slot("panelBodyFill"),
    panelBodyRounded: slot("panelBodyRounded"),
    panelFooter: slot("panelFooter"),
    panelEmpty: slot("panelEmpty"),
    item: slot("item"),
    checkAll: slot("checkAll"),
    headerSelectControls: slot("headerSelectControls"),
    headerSelectMenu: slot("headerSelectMenu"),
    headerSelectTrigger: slot("headerSelectTrigger"),
    headerSelectIcon: slot("headerSelectIcon"),
    headerSelectDropdown: slot("headerSelectDropdown"),
    headerSelectDropdownInner: slot("headerSelectDropdownInner"),
    headerSelectItem: slot("headerSelectItem"),
    itemCheck: slot("itemCheck"),
    itemContent: slot("itemContent"),
    itemLabel: slot("itemLabel"),
    itemDesc: slot("itemDesc"),
    itemUndoBtn: slot("itemUndoBtn"),
    itemUndoIcon: slot("itemUndoIcon"),
    operations: slot("operations"),
    operationBtn: slot("operationBtn"),
    operationBtnLabeled: slot("operationBtnLabeled"),
    operationBtnIcon: slot("operationBtnIcon"),
    operationBtnLabel: slot("operationBtnLabel"),
  };
});

function getItemClass(isSelected: boolean, isDisabled: boolean | undefined) {
  return cn(
    ui.value.item(),
    isSelected && "bg-primary/8 dark:bg-primary/10",
    isDisabled || props.disabled
      ? "opacity-50 cursor-not-allowed"
      : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
  );
}

function getRightItemClass(item: TransferDataRecord) {
  if (props.oneWay) {
    return cn(
      ui.value.item(),
      "cursor-default",
      isItemDisabled(item) || props.disabled
        ? "opacity-50"
        : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    );
  }
  return getItemClass(rightChecked.value.includes(getItemKey(item)), isItemDisabled(item));
}

function handleRightItemClick(item: TransferDataRecord) {
  if (props.oneWay) return;
  toggleRightItem(item);
}

function getOperationBtnClass(isDisabled: boolean, config: ResolvedOperationButton) {
  return cn(
    ui.value.operationBtn(),
    !isIconOnlyOperationBtn(config) && ui.value.operationBtnLabeled(),
    isDisabled
      ? "opacity-40 cursor-not-allowed pointer-events-none bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600"
      : "cursor-pointer bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-primary/5 hover:border-primary/60 hover:text-primary dark:hover:bg-primary/10 dark:hover:border-primary/50 dark:hover:text-primary",
  );
}

function getCheckAllClass(isChecked: boolean, isIndeterminate: boolean, isEmpty: boolean) {
  return cn(
    ui.value.checkAll(),
    isChecked || isIndeterminate
      ? "bg-primary border-primary"
      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
    isEmpty || props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
  );
}

function getItemCheckClass(isSelected: boolean) {
  return cn(
    ui.value.itemCheck(),
    isSelected
      ? "bg-primary border-primary"
      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
  );
}
</script>

<template>
  <div
    :class="cn(ui.root(), props.class)"
    :style="rootStyle"
  >
    <!-- ══════════════════════════════════════════
         左侧面板（源列表）
    ══════════════════════════════════════════ -->
    <div :class="getPanelClass()">
      <!-- 面板头部：可选全选 / 扩展菜单 + 标题 + 计数 -->
      <div :class="ui.panelHeader()">
        <div
          v-if="showLeftHeaderSelectControls"
          :class="ui.headerSelectControls()"
        >
          <!-- 头部全选复选框 -->
          <div
            v-if="showHeaderCheckbox"
            :class="
              getCheckAllClass(leftAllChecked, leftIndeterminate, enabledLeftItems.length === 0)
            "
            role="checkbox"
            :aria-checked="leftIndeterminate ? 'mixed' : leftAllChecked"
            @click="toggleLeftAll"
          >
            <CheckMark v-if="leftAllChecked" />
            <span
              v-else-if="leftIndeterminate"
              class="h-px w-2 rounded-full bg-white"
            />
          </div>

          <!-- 全选扩展菜单（click 触发，点击外部自动关闭） -->
          <div
            v-if="showHeaderSelectMenu"
            :class="ui.headerSelectMenu()"
            @click.stop
          >
            <button
              type="button"
              :class="
                cn(
                  ui.headerSelectTrigger(),
                  (props.disabled || enabledLeftScopeItems.length === 0) &&
                    'pointer-events-none opacity-40',
                )
              "
              :disabled="props.disabled || enabledLeftScopeItems.length === 0"
              aria-haspopup="menu"
              :aria-expanded="leftSelectMenuOpen"
              @click="toggleLeftSelectMenu"
            >
              <Icon
                name="lucide:chevron-down"
                :class="cn(ui.headerSelectIcon(), leftSelectMenuOpen && 'rotate-180')"
              />
            </button>

            <RebornTransition
              :show="leftSelectMenuOpen"
              name="select-collapse"
              :duration="{ enter: 160, leave: 100 }"
              enter-active-class="transition-[height,opacity] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] overflow-hidden"
              leave-active-class="transition-[height,opacity] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
              :custom-class="ui.headerSelectDropdown()"
            >
              <div
                :class="ui.headerSelectDropdownInner()"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  :class="ui.headerSelectItem()"
                  :disabled="props.disabled || enabledLeftScopeItems.length === 0"
                  @click.stop="toggleLeftAllScope"
                >
                  {{ leftAllScopeChecked ? "取消全选" : "全选所有" }}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  :class="ui.headerSelectItem()"
                  :disabled="props.disabled || enabledLeftItems.length === 0"
                  @click.stop="selectLeftPage"
                >
                  全选当页
                </button>
                <button
                  type="button"
                  role="menuitem"
                  :class="ui.headerSelectItem()"
                  :disabled="props.disabled || enabledLeftItems.length === 0"
                  @click.stop="invertLeftPage"
                >
                  反选当页
                </button>
              </div>
            </RebornTransition>
          </div>
        </div>

        <!-- 标题与计数 -->
        <div :class="ui.panelTitleArea()">
          <span :class="ui.panelTitle()">{{ titles[0] }}</span>
          <span :class="ui.panelCount()">{{ leftCountText }}</span>
        </div>
      </div>

      <!-- 搜索框（可选） -->
      <div
        v-if="showSearch"
        :class="ui.panelSearch()"
      >
        <div :class="ui.searchWrapper()">
          <Icon
            name="lucide:search"
            :class="ui.searchIcon()"
          />
          <input
            v-model="leftSearch"
            type="text"
            :placeholder="searchPlaceholder"
            :disabled="props.disabled"
            :class="ui.searchInput()"
          />
        </div>
      </div>

      <!-- 条目列表（无分页） -->
      <div
        v-if="!paginationEnabled"
        :class="getPanelBodyClass(ui.panelBodyRounded())"
      >
        <template v-if="filteredLeftItems.length">
          <div
            v-for="item in visibleLeftItems"
            :key="getItemKey(item)"
            :class="getItemClass(leftChecked.includes(getItemKey(item)), isItemDisabled(item))"
            @click="toggleLeftItem(item)"
          >
            <span :class="getItemCheckClass(leftChecked.includes(getItemKey(item)))">
              <CheckMark v-if="leftChecked.includes(getItemKey(item))" />
            </span>
            <div :class="ui.itemContent()">
              <slot
                name="item"
                :item="item"
              >
                <div :class="ui.itemLabel()">{{ getItemLabel(item) }}</div>
                <div
                  v-if="getItemDescription(item)"
                  :class="ui.itemDesc()"
                >
                  {{ getItemDescription(item) }}
                </div>
              </slot>
            </div>
          </div>
        </template>
        <div
          v-else
          :class="getPanelEmptyClass()"
        >
          <Icon
            name="lucide:inbox"
            class="size-8 opacity-40"
          />
          <span>{{ leftSearch ? "无匹配结果" : "暂无数据" }}</span>
        </div>
      </div>

      <!-- 条目列表 + 底部分页 -->
      <div
        v-else
        :class="getPanelContentClass(ui.panelBodyRounded())"
      >
        <div :class="getPanelBodyClass(ui.panelBodyFill())">
          <template v-if="filteredLeftItems.length">
            <div
              v-for="item in visibleLeftItems"
              :key="getItemKey(item)"
              :class="getItemClass(leftChecked.includes(getItemKey(item)), isItemDisabled(item))"
              @click="toggleLeftItem(item)"
            >
              <span :class="getItemCheckClass(leftChecked.includes(getItemKey(item)))">
                <CheckMark v-if="leftChecked.includes(getItemKey(item))" />
              </span>
              <div :class="ui.itemContent()">
                <slot
                  name="item"
                  :item="item"
                >
                  <div :class="ui.itemLabel()">{{ getItemLabel(item) }}</div>
                  <div
                    v-if="getItemDescription(item)"
                    :class="ui.itemDesc()"
                  >
                    {{ getItemDescription(item) }}
                  </div>
                </slot>
              </div>
            </div>
          </template>
          <div
            v-else
            :class="cn(getPanelEmptyClass(), 'min-h-full')"
          >
            <Icon
              name="lucide:inbox"
              class="size-8 opacity-40"
            />
            <span>{{ leftSearch ? "无匹配结果" : "暂无数据" }}</span>
          </div>
        </div>

        <div
          v-if="filteredLeftItems.length"
          :class="ui.panelFooter()"
        >
          <RebornPagination
            v-model="leftCurrentPage"
            :total="filteredLeftItems.length"
            :page-size="paginationPageSize"
            :disabled="disabled"
            size="sm"
          />
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         中间操作按钮区
    ══════════════════════════════════════════ -->
    <div :class="ui.operations()">
      <button
        v-for="op in visibleCenterOperations"
        :key="op.key"
        type="button"
        :class="getOperationBtnClass(op.disabled, op.config)"
        :title="op.config.title"
        :aria-label="op.config.ariaLabel"
        @click="op.onClick"
      >
        <slot
          v-if="$slots[op.slotName]"
          :name="op.slotName"
          :ui="ui"
          :config="op.config"
          :disabled="op.disabled"
        />
        <template v-else>
          <span
            v-if="op.config.showIcon"
            :class="ui.operationBtnIcon()"
          >
            <Icon
              :name="op.config.icon"
              :class="op.config.iconClass"
            />
          </span>
          <span
            v-if="op.config.label"
            :class="ui.operationBtnLabel()"
          >
            {{ op.config.label }}
          </span>
          <span
            v-if="op.config.showTrailingIcon && op.config.trailingIcon"
            :class="ui.operationBtnIcon()"
          >
            <Icon
              :name="op.config.trailingIcon"
              :class="op.config.trailingIconClass"
            />
          </span>
        </template>
      </button>
    </div>

    <!-- ══════════════════════════════════════════
         右侧面板（目标列表）
    ══════════════════════════════════════════ -->
    <div :class="getPanelClass()">
      <!-- 面板头部 -->
      <div :class="ui.panelHeader()">
        <div
          v-if="showRightHeaderSelectControls"
          :class="ui.headerSelectControls()"
        >
          <div
            v-if="showRightHeaderCheckbox"
            :class="
              getCheckAllClass(rightAllChecked, rightIndeterminate, enabledRightItems.length === 0)
            "
            role="checkbox"
            :aria-checked="rightIndeterminate ? 'mixed' : rightAllChecked"
            @click="toggleRightAll"
          >
            <CheckMark v-if="rightAllChecked" />
            <span
              v-else-if="rightIndeterminate"
              class="h-px w-2 rounded-full bg-white"
            />
          </div>

          <div
            v-if="showHeaderSelectMenu"
            :class="ui.headerSelectMenu()"
            @click.stop
          >
            <button
              type="button"
              :class="
                cn(
                  ui.headerSelectTrigger(),
                  rightHeaderSelectMenuDisabled && 'pointer-events-none opacity-40',
                )
              "
              :disabled="rightHeaderSelectMenuDisabled"
              aria-haspopup="menu"
              :aria-expanded="rightSelectMenuOpen"
              @click="toggleRightSelectMenu"
            >
              <Icon
                name="lucide:chevron-down"
                :class="cn(ui.headerSelectIcon(), rightSelectMenuOpen && 'rotate-180')"
              />
            </button>

            <RebornTransition
              :show="rightSelectMenuOpen"
              name="select-collapse"
              :duration="{ enter: 160, leave: 100 }"
              enter-active-class="transition-[height,opacity] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] overflow-hidden"
              leave-active-class="transition-[height,opacity] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
              :custom-class="ui.headerSelectDropdown()"
            >
              <div
                :class="ui.headerSelectDropdownInner()"
                role="menu"
              >
                <!-- 单向模式：撤回菜单 -->
                <template v-if="oneWay">
                  <button
                    type="button"
                    role="menuitem"
                    :class="ui.headerSelectItem()"
                    :disabled="props.disabled || enabledRightItems.length === 0"
                    @click.stop="revertRightPage"
                  >
                    撤回当页
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    :class="ui.headerSelectItem()"
                    :disabled="props.disabled || enabledRightScopeItems.length === 0"
                    @click.stop="revertRightAll"
                  >
                    撤回全部
                  </button>
                </template>
                <!-- 双向模式：勾选菜单 -->
                <template v-else>
                  <button
                    type="button"
                    role="menuitem"
                    :class="ui.headerSelectItem()"
                    :disabled="props.disabled || enabledRightScopeItems.length === 0"
                    @click.stop="toggleRightAllScope"
                  >
                    {{ rightAllScopeChecked ? "取消全选" : "全选所有" }}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    :class="ui.headerSelectItem()"
                    :disabled="props.disabled || enabledRightItems.length === 0"
                    @click.stop="selectRightPage"
                  >
                    全选当页
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    :class="ui.headerSelectItem()"
                    :disabled="props.disabled || enabledRightItems.length === 0"
                    @click.stop="invertRightPage"
                  >
                    反选当页
                  </button>
                </template>
              </div>
            </RebornTransition>
          </div>
        </div>

        <!-- 标题与计数 -->
        <div :class="ui.panelTitleArea()">
          <span :class="ui.panelTitle()">{{ titles[1] }}</span>
          <span :class="ui.panelCount()">{{ rightCountText }}</span>
        </div>
      </div>

      <!-- 搜索框（可选） -->
      <div
        v-if="showSearch"
        :class="ui.panelSearch()"
      >
        <div :class="ui.searchWrapper()">
          <Icon
            name="lucide:search"
            :class="ui.searchIcon()"
          />
          <input
            v-model="rightSearch"
            type="text"
            :placeholder="searchPlaceholder"
            :disabled="props.disabled"
            :class="ui.searchInput()"
          />
        </div>
      </div>

      <!-- 条目列表（无分页） -->
      <div
        v-if="!paginationEnabled"
        :class="getPanelBodyClass(ui.panelBodyRounded())"
      >
        <template v-if="filteredRightItems.length">
          <div
            v-for="item in visibleRightItems"
            :key="getItemKey(item)"
            :class="getRightItemClass(item)"
            @click="handleRightItemClick(item)"
          >
            <span
              v-if="!oneWay"
              :class="getItemCheckClass(rightChecked.includes(getItemKey(item)))"
            >
              <CheckMark v-if="rightChecked.includes(getItemKey(item))" />
            </span>
            <div :class="ui.itemContent()">
              <slot
                name="item"
                :item="item"
              >
                <div :class="ui.itemLabel()">{{ getItemLabel(item) }}</div>
                <div
                  v-if="getItemDescription(item)"
                  :class="ui.itemDesc()"
                >
                  {{ getItemDescription(item) }}
                </div>
              </slot>
            </div>
            <button
              v-if="oneWay"
              type="button"
              :class="
                cn(
                  ui.itemUndoBtn(),
                  isOneWayItemUndoDisabled(item) && 'pointer-events-none opacity-40',
                )
              "
              :title="undoOperationBtn.title"
              :disabled="isOneWayItemUndoDisabled(item)"
              aria-label="移回左侧"
              @click.stop="revertOneWayItem(item)"
            >
              <Icon
                name="lucide:undo-2"
                :class="ui.itemUndoIcon()"
              />
            </button>
          </div>
        </template>
        <div
          v-else
          :class="getPanelEmptyClass()"
        >
          <Icon
            name="lucide:inbox"
            class="size-8 opacity-40"
          />
          <span>{{ rightSearch ? "无匹配结果" : "暂无数据" }}</span>
        </div>
      </div>

      <!-- 条目列表 + 底部分页 -->
      <div
        v-else
        :class="getPanelContentClass(ui.panelBodyRounded())"
      >
        <div :class="getPanelBodyClass(ui.panelBodyFill())">
          <template v-if="filteredRightItems.length">
            <div
              v-for="item in visibleRightItems"
              :key="getItemKey(item)"
              :class="getRightItemClass(item)"
              @click="handleRightItemClick(item)"
            >
              <span
                v-if="!oneWay"
                :class="getItemCheckClass(rightChecked.includes(getItemKey(item)))"
              >
                <CheckMark v-if="rightChecked.includes(getItemKey(item))" />
              </span>
              <div :class="ui.itemContent()">
                <slot
                  name="item"
                  :item="item"
                >
                  <div :class="ui.itemLabel()">{{ getItemLabel(item) }}</div>
                  <div
                    v-if="getItemDescription(item)"
                    :class="ui.itemDesc()"
                  >
                    {{ getItemDescription(item) }}
                  </div>
                </slot>
              </div>
              <button
                v-if="oneWay"
                type="button"
                :class="
                  cn(
                    ui.itemUndoBtn(),
                    isOneWayItemUndoDisabled(item) && 'pointer-events-none opacity-40',
                  )
                "
                :title="undoOperationBtn.title"
                :disabled="isOneWayItemUndoDisabled(item)"
                aria-label="移回左侧"
                @click.stop="revertOneWayItem(item)"
              >
                <Icon
                  name="lucide:undo-2"
                  :class="ui.itemUndoIcon()"
                />
              </button>
            </div>
          </template>
          <div
            v-else
            :class="cn(getPanelEmptyClass(), 'min-h-full')"
          >
            <Icon
              name="lucide:inbox"
              class="size-8 opacity-40"
            />
            <span>{{ rightSearch ? "无匹配结果" : "暂无数据" }}</span>
          </div>
        </div>

        <div
          v-if="filteredRightItems.length"
          :class="ui.panelFooter()"
        >
          <RebornPagination
            v-model="rightCurrentPage"
            :total="filteredRightItems.length"
            :page-size="paginationPageSize"
            :disabled="disabled"
            size="sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
