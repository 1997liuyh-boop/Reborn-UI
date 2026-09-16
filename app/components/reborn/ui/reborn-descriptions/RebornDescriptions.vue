<script setup lang="ts">
import type { VNode } from "vue";
import type {
  DescriptionsAlign,
  DescriptionsLayout,
  DescriptionsResponsive,
  DescriptionsSize,
  DescriptionsSpan,
} from "./reborn-descriptions.config";
import { useResizeObserver } from "@vueuse/core";
import { computed, Fragment, onMounted, ref, useSlots } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { descriptionsBreakpointOrder, descriptionsBreakpoints } from "./reborn-descriptions.config";

defineOptions({
  name: "RebornDescriptions",
});

const props = withDefaults(defineProps<DescriptionsProps>(), {
  bordered: false,
  colon: true,
  column: 3,
  layout: "horizontal",
  size: "md",
  labelAlign: "left",
  contentAlign: "left",
});

defineSlots<{
  /** 自定义标题内容，优先于 title 属性 */
  title?: (props: Record<string, never>) => any;
  /** 自定义右上方操作区，优先于 extra 属性 */
  extra?: (props: Record<string, never>) => any;
  /** 放置 RebornDescriptionsItem 子组件 */
  default?: (props: Record<string, never>) => any;
  /** 由 item 的 slot / labelSlot 指向的 `content-{name}`、`label-{name}` 具名插槽 */
  [name: string]: ((props: any) => any) | undefined;
}>();

export interface DescriptionsItem {
  /** 内容的描述，即左侧标签文字 */
  label?: string;
  /** 标签对应的内容，复杂内容请改用 slot 指定具名插槽 */
  value?: string | number | null;
  /** 包含列的数量，'filled' 表示铺满当前行剩余部分 */
  span?: DescriptionsSpan;
  /** 单独覆盖本项的冒号显隐，不传时跟随父级 colon */
  colon?: boolean;
  /** 追加到本项标签节点的类名 */
  labelClass?: string;
  /** 追加到本项内容节点的类名 */
  contentClass?: string;
  /** 内容改由具名插槽 `content-{slot}` 渲染 */
  slot?: string;
  /** 标签改由具名插槽 `label-{labelSlot}` 渲染 */
  labelSlot?: string;
}

export interface DescriptionsProps {
  /** 描述列表的标题，显示在最顶部 */
  title?: string;
  /** 描述列表的操作区域，显示在右上方；复杂内容用同名插槽 */
  extra?: string;
  /** 是否展示边框，开启后标签单元格带底色 */
  bordered?: boolean;
  /** 是否显示 label 后面的冒号，可被单项的 colon 覆盖 */
  colon?: boolean;
  /** 一行的列数，可写成按断点取值的对象 */
  column?: number | DescriptionsResponsive;
  /** 描述布局 */
  layout?: DescriptionsLayout;
  /** 列表的大小，对应单元格行高 36 / 48 / 56px */
  size?: DescriptionsSize;
  /** 描述列表项内容，与默认插槽二选一 */
  items?: DescriptionsItem[];
  /** 标签单元格的最小宽度，如 '120px' */
  labelWidth?: string;
  /** 标签水平对齐 */
  labelAlign?: DescriptionsAlign;
  /** 内容水平对齐 */
  contentAlign?: DescriptionsAlign;
  /** 追加到根元素的自定义类名 */
  class?: any;
  /** 按内部结构键覆盖各节点类名，键位见文档「自定义样式（ui）」 */
  ui?: Partial<{
    root?: any;
    header?: any;
    titleWrapper?: any;
    title?: any;
    extra?: any;
    tableWrapper?: any;
    body?: any;
    cell?: any;
    label?: any;
    content?: any;
    colon?: any;
  }>;
}

const slots = useSlots();

// ─── 容器宽度与列数解析 ───────────────────────────────────────────────

const containerRef = ref<HTMLElement | null>(null);
// 测量前按「足够宽」处理：宁可首帧多列再收窄，也好过宽屏下先闪一帧单列
const containerWidth = ref(9999);

/**
 * ResizeObserver 的回调挂在浏览器的渲染步骤上，页面不可见（后台标签页、display:none 的祖先）时不会派发，
 * 只靠它会一直停在兜底宽度上。挂载后主动量一次，这条路径不依赖渲染步骤，任何情况下都能拿到真实宽度。
 * 这里刻意扣掉内边距与边框，与 contentRect 取同一套盒模型，避免两个来源给出不同值导致列数跳变。
 */
function measureContainer() {
  const el = containerRef.value;
  if (!el) return;
  const style = getComputedStyle(el);
  const inset
    = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
      + Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth);
  containerWidth.value = Math.max(0, el.getBoundingClientRect().width - inset);
}

onMounted(measureContainer);

useResizeObserver(containerRef, (entries) => {
  const entry = entries[0];
  if (entry) containerWidth.value = entry.contentRect.width;
});

/**
 * 解析响应式取值：先取容器宽度命中的最宽档位，逐级往窄处找第一个已定义值；
 * 容器比所有已定义档位都窄时退回最窄的那个已定义值，对象为空则用 fallback。
 */
function resolveResponsive(
  value: number | DescriptionsResponsive | undefined,
  width: number,
  fallback: number,
): number {
  if (typeof value === "number") return value;
  if (!value) return fallback;

  const matched = descriptionsBreakpointOrder.filter((bp) => width >= descriptionsBreakpoints[bp]);
  for (let i = matched.length - 1; i >= 0; i--) {
    const hit = value[matched[i]!];
    if (typeof hit === "number") return hit;
  }

  for (const bp of descriptionsBreakpointOrder) {
    const hit = value[bp];
    if (typeof hit === "number") return hit;
  }

  return fallback;
}

const effectiveColumn = computed(() => {
  return Math.max(1, Math.round(resolveResponsive(props.column, containerWidth.value, 3)));
});

// ─── 子组件解析与分行 ────────────────────────────────────────────────

interface ParsedItem extends DescriptionsItem {
  /** 子组件 label 插槽的渲染函数 */
  labelSlotFn?: () => any;
  /** 子组件默认插槽的渲染函数 */
  contentSlotFn?: () => any;
}

/** 实际落到表格里的一格，colSpan 是分行后确定的真实跨列数 */
interface RowCell extends ParsedItem {
  colSpan: number;
}

/** 从默认插槽的 VNode 树里挑出 RebornDescriptionsItem，Fragment（v-for / template）需要摊平一层 */
function extractItems(vnodes: VNode[]): ParsedItem[] {
  const result: ParsedItem[] = [];

  for (const vnode of vnodes) {
    if (vnode.type === Fragment) {
      result.push(...extractItems((vnode.children as VNode[]) ?? []));
      continue;
    }

    if ((vnode.type as any)?.__name !== "RebornDescriptionsItem") continue;

    const itemProps = (vnode.props ?? {}) as Record<string, any>;
    const children = (vnode.children ?? {}) as Record<string, any>;

    result.push({
      label: itemProps.label,
      span: itemProps.span,
      colon: itemProps.colon,
      labelClass: itemProps.labelClass ?? itemProps["label-class"],
      contentClass: itemProps.contentClass ?? itemProps["content-class"],
      labelSlotFn: typeof children.label === "function" ? children.label : undefined,
      contentSlotFn: typeof children.default === "function" ? children.default : undefined,
    });
  }

  return result;
}

const allItems = computed<ParsedItem[]>(() => {
  if (props.items?.length) return props.items;
  return extractItems(slots.default?.() ?? []);
});

const rows = computed<RowCell[][]>(() => {
  const column = effectiveColumn.value;
  const result: RowCell[][] = [];

  let row: RowCell[] = [];
  let used = 0;

  /** 未填满的行把末项延伸补齐，否则带边框时会缺格、边线断在半路 */
  const flush = () => {
    if (!row.length) return;
    const last = row[row.length - 1]!;
    last.colSpan += column - used;
    result.push(row);
    row = [];
    used = 0;
  };

  for (const item of allItems.value) {
    if (item.span === "filled") {
      // 显式铺满当前行剩余列：当前行已满就另起一行独占整行
      if (used >= column) flush();
      row.push({ ...item, colSpan: column - used });
      used = column;
      flush();
      continue;
    }

    const want = Math.min(
      Math.max(1, Math.round(resolveResponsive(item.span, containerWidth.value, 1))),
      column,
    );

    if (used + want > column) flush();

    row.push({ ...item, colSpan: want });
    used += want;

    if (used >= column) flush();
  }

  flush();
  return result;
});

// ─── 渲染辅助 ────────────────────────────────────────────────────────

/** 标签渲染优先级：具名插槽 > 子组件 label 插槽 > label 文本 */
function renderLabel(cell: RowCell) {
  const named = cell.labelSlot ? slots[`label-${cell.labelSlot}`] : undefined;
  if (named) return () => named({ item: cell });
  if (cell.labelSlotFn) return cell.labelSlotFn;
  return () => cell.label ?? "";
}

/** 内容渲染优先级：具名插槽 > 子组件默认插槽 > value 文本 */
function renderContent(cell: RowCell) {
  const named = cell.slot ? slots[`content-${cell.slot}`] : undefined;
  if (named) return () => named({ item: cell });
  if (cell.contentSlotFn) return cell.contentSlotFn;
  return () => (cell.value === null || cell.value === undefined ? "" : String(cell.value));
}

/**
 * 冒号只在「无边框 + 水平」下渲染：
 * 带边框时标签独占带底色的单元格、垂直布局时标签独占一行，边界已经表达清楚，再加冒号是重复表达。
 */
function showColon(cell: RowCell) {
  if (props.bordered || props.layout === "vertical") return false;
  return cell.colon ?? props.colon;
}

/** bordered 下的单元格分隔线：最后一行不画下边线，行内最后一格不画右边线 */
function cellBorder(isLastRow: boolean, isLastInRow: boolean) {
  if (!props.bordered) return undefined;
  return [!isLastRow && "border-b border-gray-3", !isLastInRow && "border-r border-gray-3"];
}

/**
 * 无边框时的行距。这一形态没有网格线，层级全靠留白，所以单元格不吃 size 的行高与上下内边距，
 * 改由行位置给固定值：垂直布局下标签行与紧随其后的内容行隔 4px，项与项之间隔 16px，末行不留尾距。
 * 水平布局下标签与内容在同一格里，那 4px 由格内 flex 的 gap 负责，这里只给项与项的 16px。
 */
function cellGap(isLabelRow: boolean, isLastRow: boolean) {
  if (props.bordered) return undefined;
  if (isLabelRow) return "pb-[4px]";
  return isLastRow ? undefined : "pb-[16px]";
}

/** 标签单元格的底色只在 bordered 下出现，对应设计规格的 bg-gray-2 */
const labelFill = computed(() => (props.bordered ? "bg-gray-2" : undefined));

const labelStyle = computed(() => (props.labelWidth ? { minWidth: props.labelWidth } : undefined));

const hasExtra = computed(() => !!(props.extra || slots.extra));
const hasHeader = computed(() => !!(props.title || slots.title || hasExtra.value));

const b = tv(theme);
const ui = computed(() => {
  const s = b({
    size: props.size,
    bordered: props.bordered,
    labelAlign: props.labelAlign,
    contentAlign: props.contentAlign,
  });
  const ov: any = props.ui ?? {};
  // 把 ui 传入的类名并进对应槽位，未传时行为与默认完全一致
  const slot =
    <K extends keyof typeof s>(key: K) =>
      (opts?: { class?: any }) =>
        s[key]({ class: [opts?.class, ov[key]] });

  return {
    root: slot("root"),
    header: slot("header"),
    titleWrapper: slot("titleWrapper"),
    title: slot("title"),
    extra: slot("extra"),
    tableWrapper: slot("tableWrapper"),
    body: slot("body"),
    cell: slot("cell"),
    label: slot("label"),
    content: slot("content"),
    colon: slot("colon"),
  };
});
</script>

<template>
  <div ref="containerRef" :class="ui.root({ class: props.class })">
    <div v-if="hasHeader" :class="ui.header()">
      <div :class="ui.titleWrapper()">
        <div :class="ui.title()">
          <slot name="title">{{ props.title }}</slot>
        </div>
      </div>
      <div v-if="hasExtra" :class="ui.extra()">
        <slot name="extra">{{ props.extra }}</slot>
      </div>
    </div>

    <div :class="ui.tableWrapper()">
      <table :class="ui.body()">
        <tbody>
          <!-- 水平 + 边框：标签与内容各占一格，标签格带底色 -->
          <template v-if="props.layout === 'horizontal' && props.bordered">
            <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
              <template v-for="(cell, cellIndex) in row" :key="cellIndex">
                <td
                  :class="cn(ui.cell(), ui.label(), labelFill, cellBorder(rowIndex === rows.length - 1, false), cell.labelClass)"
                  :style="labelStyle"
                >
                  <component :is="renderLabel(cell)" />
                </td>
                <td
                  :colspan="cell.colSpan * 2 - 1"
                  :class="cn(ui.cell(), ui.content(), cellBorder(rowIndex === rows.length - 1, cellIndex === row.length - 1), cell.contentClass)"
                >
                  <component :is="renderContent(cell)" />
                </td>
              </template>
            </tr>
          </template>

          <!-- 水平 + 无边框：标签与内容同格相邻，冒号在此承担分隔职责 -->
          <template v-else-if="props.layout === 'horizontal'">
            <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                :colspan="cell.colSpan"
                :class="cn(ui.cell(), cellGap(false, rowIndex === rows.length - 1))"
              >
                <div class="flex items-baseline gap-[4px]">
                  <span :class="cn(ui.label(), cell.labelClass)" :style="labelStyle">
                    <component :is="renderLabel(cell)" /><span v-if="showColon(cell)" :class="ui.colon()">：</span>
                  </span>
                  <span :class="cn(ui.content(), cell.contentClass)">
                    <component :is="renderContent(cell)" />
                  </span>
                </div>
              </td>
            </tr>
          </template>

          <!-- 垂直：标签行在上、内容行在下，两行共用同一套跨列 -->
          <template v-else>
            <template v-for="(row, rowIndex) in rows" :key="rowIndex">
              <tr>
                <td
                  v-for="(cell, cellIndex) in row"
                  :key="cellIndex"
                  :colspan="cell.colSpan"
                  :class="cn(ui.cell(), ui.label(), labelFill, cellBorder(false, cellIndex === row.length - 1), cellGap(true, false), cell.labelClass)"
                  :style="labelStyle"
                >
                  <component :is="renderLabel(cell)" />
                </td>
              </tr>
              <tr>
                <td
                  v-for="(cell, cellIndex) in row"
                  :key="cellIndex"
                  :colspan="cell.colSpan"
                  :class="cn(ui.cell(), ui.content(), cellBorder(rowIndex === rows.length - 1, cellIndex === row.length - 1), cellGap(false, rowIndex === rows.length - 1), cell.contentClass)"
                >
                  <component :is="renderContent(cell)" />
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
