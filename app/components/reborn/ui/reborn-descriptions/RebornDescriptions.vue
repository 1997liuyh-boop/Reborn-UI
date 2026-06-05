<script setup lang="ts">
import type { VNode } from "vue";
import type {
  DescriptionsAlign,
  DescriptionsBorderMode,
  DescriptionsLineHeight,
  DescriptionsLineHeightValue,
  DescriptionsSize,
} from "./reborn-descriptions.config";
import { useResizeObserver } from "@vueuse/core";
import { computed, Fragment, provide, ref, useSlots } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, {
  DescriptionsInjectionKey,
  isDescriptionsLineHeightPreset,
} from "./reborn-descriptions.config";

// ─── 类型定义 ───────────────────────────────────────────────────

/**
 * 数据驱动模式下单个描述项的数据结构
 */
export interface DescriptionsItem {
  /** 标签文字 */
  label?: string;
  /** 内容值（简单文本），支持 null 表示空值 */
  value?: string | number | null;
  /** 占据列数，默认 1 */
  span?: number;
  /** 自定义标签单元格 CSS 类 */
  labelClass?: string;
  /** 自定义内容单元格 CSS 类 */
  contentClass?: string;
  /** 单项标签单元格背景色（优先于组件全局 labelBackground） */
  labelBackground?: string;
  /** 单项内容单元格背景色（优先于组件全局 contentBackground） */
  contentBackground?: string;
  /** 单项标签字体颜色（优先于组件全局 labelColor） */
  labelColor?: string;
  /** 单项内容字体颜色（优先于组件全局 contentColor） */
  contentColor?: string;
  /** 单项标签字体加粗（优先于组件全局 labelBold） */
  labelBold?: boolean;
  /** 单项内容字体加粗（优先于组件全局 contentBold） */
  contentBold?: boolean;
  /**
   * 内容区自定义插槽名称。
   * 设置后，父级可通过 `<template #content-[slot]>` 插入富内容。
   */
  slot?: string;
  /**
   * 标签区自定义插槽名称。
   * 设置后，父级可通过 `<template #label-[slot]>` 插入富内容。
   */
  labelSlot?: string;
}

export interface DescriptionsProps {
  /** 标题 */
  title?: string;
  /** 每行显示的列数，默认 3 */
  column?: number;
  /**
   * 是否根据容器宽度自适应列数，默认 true
   * - true：< 480px 为 1 列，< 640px 最多 2 列，否则使用 column
   * - false：始终使用 column，不随容器宽度变化
   */
  responsive?: boolean;
  /** 尺寸大小 */
  size?: DescriptionsSize;
  /**
   * 边框样式
   * - bordered：有边框（表格外框 + 单元格网格线）
   * - divider：无框（仅行与行之间的分割线，默认）
   * - none：无边框（无任何边线）
   */
  border?: DescriptionsBorderMode;
  /** 排列方向：horizontal（水平）或 vertical（垂直） */
  direction?: "horizontal" | "vertical";
  /** 标签后是否显示冒号，默认 true */
  colon?: boolean;
  /** 表格外层是否圆角，默认 true */
  rounded?: boolean;
  /** 标签列背景色（CSS 颜色值，如 '#f9fafb'） */
  labelBackground?: string;
  /** 内容列背景色（CSS 颜色值，如 '#ffffff'） */
  contentBackground?: string;
  /** 标签列字体颜色（CSS 颜色值，如 '#6b7280'） */
  labelColor?: string;
  /** 内容列字体颜色（CSS 颜色值，如 '#111827'） */
  contentColor?: string;
  /** 标签列字体加粗 */
  labelBold?: boolean;
  /** 内容列字体加粗 */
  contentBold?: boolean;
  /** 标签单元格的最小宽度（CSS 值，如 '120px'） */
  labelWidth?: string;
  /** 标签单元格水平对齐，默认 left */
  labelAlign?: DescriptionsAlign;
  /** 内容单元格水平对齐，默认 left */
  contentAlign?: DescriptionsAlign;
  /**
   * 标签字体行高
   * - 预设：none / tight / snug / normal / relaxed / loose
   * - 自定义 CSS 值：如 '1.8'、'28px'
   */
  labelLineHeight?: DescriptionsLineHeightValue;
  /**
   * 内容字体行高
   * - 预设：none / tight / snug / normal / relaxed / loose
   * - 自定义 CSS 值：如 '1.8'、'28px'
   */
  contentLineHeight?: DescriptionsLineHeightValue;
  /** 数据驱动模式：传入项目列表 */
  items?: DescriptionsItem[];
  class?: any;
  ui?: any;
}

// ─── 内部解析项类型 ───────────────────────────────────────────────

interface ParsedItem extends DescriptionsItem {
  span: number;
  /** 从 VNode 子插槽提取的标签渲染函数 */
  labelSlotFn: ((...args: any[]) => any) | null;
  /** 从 VNode 子插槽提取的内容渲染函数 */
  contentSlotFn: ((...args: any[]) => any) | null;
}

// ─── Props ───────────────────────────────────────────────────────

const props = withDefaults(defineProps<DescriptionsProps>(), {
  column: 3,
  size: "md",
  direction: "horizontal",
  colon: true,
  rounded: true,
  responsive: true,
  labelAlign: "left",
  contentAlign: "left",
});

const borderMode = computed<DescriptionsBorderMode>(() => props.border ?? "divider");

// ─── 响应式容器宽度 ────────────────────────────────────────────────

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(9999);

useResizeObserver(containerRef, (entries) => {
  if (!props.responsive) return;
  const entry = entries[0];
  if (entry) containerWidth.value = entry.contentRect.width;
});

/**
 * 根据容器宽度动态计算实际列数（responsive 关闭时固定为 props.column）
 */
const effectiveColumn = computed(() => {
  if (!props.responsive) return props.column;
  if (containerWidth.value < 480) return 1;
  if (containerWidth.value < 640) return Math.min(props.column, 2);
  return props.column;
});

/** 窄容器下允许标签换行，避免溢出（仅 responsive 开启时生效） */
const isNarrow = computed(() => props.responsive && containerWidth.value < 480);

/** 解析行高：labelLineHeight / contentLineHeight prop，默认 relaxed */
function resolveLineHeightValue(type: "label" | "content"): string {
  const specific = type === "label" ? props.labelLineHeight : props.contentLineHeight;
  return specific != null && specific !== "" ? String(specific) : "relaxed";
}

/** 预设行高用于 tailwind-variants；自定义 CSS 时使用 custom 占位（不附加 leading 类） */
function resolveLineHeightVariant(type: "label" | "content"): DescriptionsLineHeight | "custom" {
  const value = resolveLineHeightValue(type);
  return isDescriptionsLineHeightPreset(value) ? value : "custom";
}

/** 自定义行高 CSS 值（非预设时写入 inline style） */
function resolveLineHeightCss(type: "label" | "content"): string | undefined {
  const value = resolveLineHeightValue(type);
  return isDescriptionsLineHeightPreset(value) ? undefined : value;
}

// ─── 基础构建 ────────────────────────────────────────────────────

const b = tv(theme);
const slots = useSlots();

// ─── 样式计算 ────────────────────────────────────────────────────

const ui = computed(() => {
  const overrides = props.ui ?? {};
  const styles = b({
    size: props.size,
    border: borderMode.value,
    rounded: props.rounded,
    labelAlign: props.labelAlign,
    contentAlign: props.contentAlign,
    labelLineHeight: resolveLineHeightVariant("label"),
    contentLineHeight: resolveLineHeightVariant("content"),
  });
  return {
    root: (opts?: any) => styles.root({ class: cn(opts?.class, overrides.root) }),
    header: (opts?: any) => styles.header({ class: cn(opts?.class, overrides.header) }),
    title: (opts?: any) => styles.title({ class: cn(opts?.class, overrides.title) }),
    titleWrapper: (opts?: any) =>
      styles.titleWrapper({ class: cn(opts?.class, overrides.titleWrapper) }),
    actions: (opts?: any) =>
      styles.actions({ class: cn(opts?.class, overrides.actions) }),
    tableWrapper: (opts?: any) =>
      styles.tableWrapper({ class: cn(opts?.class, overrides.tableWrapper) }),
    body: (opts?: any) => styles.body({ class: cn(opts?.class, overrides.body) }),
    label: (opts?: any) => styles.label({ class: cn(opts?.class, overrides.label) }),
    content: (opts?: any) => styles.content({ class: cn(opts?.class, overrides.content) }),
    colon: (opts?: any) => styles.colon({ class: cn(opts?.class, overrides.colon) }),
  };
});

// ─── 向子组件提供响应式上下文 ─────────────────────────────────────

provide(DescriptionsInjectionKey, {
  get column() { return props.column; },
  get border() { return borderMode.value; },
  get size() { return props.size; },
  get direction() { return props.direction; },
  get colon() { return props.colon; },
  get labelWidth() { return props.labelWidth; },
  get labelAlign() { return props.labelAlign; },
  get contentAlign() { return props.contentAlign; },
});

// ─── VNode 解析：从默认插槽提取 RebornDescriptionsItem ────────────

/**
 * 递归展平 VNode 树，提取所有 RebornDescriptionsItem 节点
 */
function extractItems(vnodes: VNode[]): ParsedItem[] {
  const result: ParsedItem[] = [];
  for (const vnode of vnodes) {
    if (!vnode) continue;
    // 展平 Fragment（v-for / v-if 产生的虚拟容器）
    if (vnode.type === Fragment) {
      const children = Array.isArray(vnode.children) ? (vnode.children as VNode[]) : [];
      result.push(...extractItems(children));
      continue;
    }
    // 识别 RebornDescriptionsItem 组件
    if (typeof vnode.type === "object" && (vnode.type as any).__name === "RebornDescriptionsItem") {
      const children = vnode.children as any;
      result.push({
        label: vnode.props?.label || "",
        span: vnode.props?.span || 1,
        labelClass: vnode.props?.labelClass,
        contentClass: vnode.props?.contentClass,
        labelBackground: vnode.props?.labelBackground,
        contentBackground: vnode.props?.contentBackground,
        labelColor: vnode.props?.labelColor,
        contentColor: vnode.props?.contentColor,
        labelBold: vnode.props?.labelBold,
        contentBold: vnode.props?.contentBold,
        labelSlotFn: children?.label ?? null,
        contentSlotFn: children?.default ?? null,
      });
    }
  }
  return result;
}

// ─── 数据汇总 ────────────────────────────────────────────────────

/**
 * 获取所有描述项（优先 items prop，其次插槽子组件）
 */
const allItems = computed<ParsedItem[]>(() => {
  if (props.items?.length) {
    return props.items.map((item) => ({
      ...item,
      span: item.span || 1,
      labelSlotFn: null,
      contentSlotFn: null,
    }));
  }
  const defaultSlotVnodes = slots.default?.() ?? [];
  return extractItems(defaultSlotVnodes);
});

/**
 * 将描述项按列数组织为行数组
 * 末项自动延伸以填满剩余列
 */
const rows = computed<ParsedItem[][]>(() => {
  const column = effectiveColumn.value;
  const items = allItems.value;
  const rowList: ParsedItem[][] = [];
  let currentRow: ParsedItem[] = [];
  let currentSpan = 0;

  for (const item of items) {
    const span = Math.min(item.span || 1, column);

    if (currentSpan + span > column) {
      if (currentRow.length > 0) {
        const last = currentRow[currentRow.length - 1] as ParsedItem;
        currentRow[currentRow.length - 1] = { ...last, span: last.span + (column - currentSpan) };
        rowList.push([...currentRow]);
      }
      currentRow = [];
      currentSpan = 0;
    }

    currentRow.push({ ...item, span });
    currentSpan += span;

    if (currentSpan >= column) {
      rowList.push([...currentRow]);
      currentRow = [];
      currentSpan = 0;
    }
  }

  if (currentRow.length > 0) {
    const last = currentRow[currentRow.length - 1] as ParsedItem;
    currentRow[currentRow.length - 1] = { ...last, span: last.span + (column - currentSpan) };
    rowList.push([...currentRow]);
  }

  return rowList;
});

// ─── 样式辅助函数 ──────────────────────────────────────────────────

/** 构建单元格内联样式（背景色 + 字体颜色 + 行高，item 级优先） */
function buildCellStyle(item: ParsedItem, type: "label" | "content") {
  const style: Record<string, string> = {};
  if (type === "label" && props.labelWidth) style.minWidth = props.labelWidth;

  const bg =
    type === "label"
      ? item.labelBackground || props.labelBackground
      : item.contentBackground || props.contentBackground;
  const color =
    type === "label"
      ? item.labelColor || props.labelColor
      : item.contentColor || props.contentColor;
  const lineHeight = resolveLineHeightCss(type);

  if (bg) style.backgroundColor = bg;
  if (color) style.color = color;
  if (lineHeight) style.lineHeight = lineHeight;

  return Object.keys(style).length ? style : undefined;
}

/** 自定义标签颜色时，冒号继承单元格颜色 */
function getColonClass(item: ParsedItem) {
  return cn(
    ui.value.colon(),
    (item.labelColor || props.labelColor) && "!text-inherit opacity-70",
  );
}

const borderedBorderColor = "border-gray-200 dark:border-gray-700/60";

/** 有边框模式单元格边框：末列不加 border-r，避免与表格外框叠成双边 */
function getBorderedCellBorder(isLastRow: boolean, isLastInRow: boolean) {
  return cn(
    borderedBorderColor,
    "border-b",
    !isLastInRow && "border-r",
    isLastRow && "!border-b-0",
  );
}

function getLabelCellClass(rowIndex: number, item: ParsedItem, isLastInRow: boolean) {
  const isLastRow = rowIndex === rows.value.length - 1;
  const mode = borderMode.value;
  const hasBg = !!(item.labelBackground || props.labelBackground);
  return cn(
    ui.value.label(),
    (item.labelBold ?? props.labelBold) && "font-bold",
    mode === "bordered" && !hasBg && "bg-gray-50/80 dark:bg-gray-800/50",
    isNarrow.value && "whitespace-normal min-w-0",
    mode === "bordered" && getBorderedCellBorder(isLastRow, isLastInRow),
    mode === "divider" && !isLastRow && "border-b border-gray-100 dark:border-gray-800/60",
    item.labelClass,
  );
}

function getContentCellClass(rowIndex: number, item: ParsedItem, isLastInRow: boolean) {
  const isLastRow = rowIndex === rows.value.length - 1;
  const mode = borderMode.value;
  return cn(
    ui.value.content(),
    (item.contentBold ?? props.contentBold) && "font-bold",
    mode === "bordered" && getBorderedCellBorder(isLastRow, isLastInRow),
    mode === "divider" && !isLastRow && "border-b border-gray-100 dark:border-gray-800/60",
    item.contentClass,
  );
}

function getVerticalLabelCellClass(item: ParsedItem, isLastInRow: boolean) {
  const mode = borderMode.value;
  const hasBg = !!(item.labelBackground || props.labelBackground);
  return cn(
    ui.value.label(),
    (item.labelBold ?? props.labelBold) && "font-bold",
    mode === "bordered" && !hasBg && "bg-gray-50/80 dark:bg-gray-800/50",
    isNarrow.value && "whitespace-normal min-w-0",
    mode === "bordered" && cn(borderedBorderColor, "border-b", !isLastInRow && "border-r"),
    mode === "divider" && "border-b border-gray-100 dark:border-gray-800/60",
    item.labelClass,
  );
}

function getVerticalContentCellClass(rowIndex: number, item: ParsedItem, isLastInRow: boolean) {
  const isLastRow = rowIndex === rows.value.length - 1;
  const mode = borderMode.value;
  return cn(
    ui.value.content(),
    (item.contentBold ?? props.contentBold) && "font-bold",
    mode === "bordered" && getBorderedCellBorder(isLastRow, isLastInRow),
    mode === "divider" && !isLastRow && "border-b border-gray-100 dark:border-gray-800/60",
    item.contentClass,
  );
}

const hasActions = computed(() => !!slots.actions);
const hasHeader = computed(() => !!(props.title || slots.title || hasActions.value));

// ─── 单元格内容渲染辅助 ──────────────────────────────────────────

/**
 * 返回标签单元格的渲染函数
 * 优先级：数据驱动 labelSlot 插槽 > VNode 子组件 labelSlotFn > 纯文本 label
 */
function renderLabelContent(item: ParsedItem): () => any {
  if (item.labelSlot && (slots as any)[`label-${item.labelSlot}`]) {
    return () => (slots as any)[`label-${item.labelSlot}`]({ item });
  }
  if (item.labelSlotFn) {
    return () => item.labelSlotFn!();
  }
  return () => item.label;
}

/**
 * 返回内容单元格的渲染函数
 * 优先级：数据驱动 slot 插槽 > VNode 子组件 contentSlotFn > 纯文本 value
 */
function renderContentValue(item: ParsedItem): () => any {
  if (item.slot && (slots as any)[`content-${item.slot}`]) {
    return () => (slots as any)[`content-${item.slot}`]({ item });
  }
  if (item.contentSlotFn) {
    return () => item.contentSlotFn!();
  }
  return () => item.value ?? "";
}

defineSlots<{
  /** 标题区（左上角），可覆盖 title prop */
  title: () => any;
  /** 操作区（右上角），用于放置按钮、链接等操作元素 */
  actions: () => any;
  /** 描述项列表（RebornDescriptionsItem 子组件） */
  default: () => any;
}>();
</script>

<template>
  <div
    ref="containerRef"
    :class="ui.root({ class: props.class })"
  >
    <!-- 头部：标题（左） + 操作区（右） -->
    <div
      v-if="hasHeader"
      :class="ui.header()"
    >
      <div :class="ui.titleWrapper()">
        <slot name="title">
          <span
            v-if="props.title"
            :class="ui.title()"
            >{{ props.title }}</span
          >
        </slot>
      </div>
      <div
        v-if="hasActions"
        :class="ui.actions()"
      >
        <slot name="actions" />
      </div>
    </div>

    <!-- 描述数据表格 -->
    <div :class="ui.tableWrapper({ class: props.responsive ? 'overflow-x-auto' : '' })">
      <table :class="ui.body()">
        <tbody>
          <!-- ── 水平方向（默认）：label 与 content 在同一行并排 ── -->
          <template v-if="props.direction === 'horizontal'">
            <tr
              v-for="(row, rowIndex) in rows"
              :key="rowIndex"
            >
              <template
                v-for="(item, itemIndex) in row"
                :key="itemIndex"
              >
                <!-- 标签单元格（水平模式 label 后必有 content，始终保留 border-r） -->
                <td
                  :class="getLabelCellClass(rowIndex, item, false)"
                  :style="buildCellStyle(item, 'label')"
                >
                  <component :is="renderLabelContent(item)" />
                  <span
                    v-if="props.colon"
                    :class="getColonClass(item)"
                    >：</span
                  >
                </td>
                <!-- 内容单元格（colspan 由 span 决定，补齐剩余标签+内容列） -->
                <td
                  :colspan="item.span * 2 - 1"
                  :class="getContentCellClass(rowIndex, item, itemIndex === row.length - 1)"
                  :style="buildCellStyle(item, 'content')"
                >
                  <component :is="renderContentValue(item)" />
                </td>
              </template>
            </tr>
          </template>

          <!-- ── 垂直方向：标签行在上，内容行在下 ── -->
          <template v-else>
            <template
              v-for="(row, rowIndex) in rows"
              :key="rowIndex"
            >
              <!-- 标签行 -->
              <tr>
                <td
                  v-for="(item, itemIndex) in row"
                  :key="`label-${itemIndex}`"
                  :colspan="item.span"
                  :class="getVerticalLabelCellClass(item, itemIndex === row.length - 1)"
                  :style="buildCellStyle(item, 'label')"
                >
                  <component :is="renderLabelContent(item)" />
                  <span
                    v-if="props.colon"
                    :class="getColonClass(item)"
                    >：</span
                  >
                </td>
              </tr>
              <!-- 内容行 -->
              <tr>
                <td
                  v-for="(item, itemIndex) in row"
                  :key="`content-${itemIndex}`"
                  :colspan="item.span"
                  :class="getVerticalContentCellClass(rowIndex, item, itemIndex === row.length - 1)"
                  :style="buildCellStyle(item, 'content')"
                >
                  <component :is="renderContentValue(item)" />
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
