<script setup lang="ts">
/**
 * RebornCascaderPanel 级联面板
 *
 * 只负责「多列选项 + 选中逻辑」，不带触发器与浮层，可直接嵌在页面里当一块常驻面板用；
 * RebornCascader 的下拉内容也正是它。列与列之间用 1px 的 gray-2 竖线分隔，不再各自成卡片。
 */
import type {
  cascaderColors,
  CascaderFieldNames,
  CascaderOption,
  CascaderOptionValue,
  CascaderPanelUI,
  cascaderSizes,
  CascaderValue,
  VirtualListProps,
} from "./reborn-cascader.config";
import type { CascaderNode } from "./useCascaderTree";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornCheckbox from "../reborn-checkbox/RebornCheckbox.vue";
import theme from "./reborn-cascader.config";
import {
  buildCascaderTree,
  findNodeByValue,
  getCheckState,
  nodeToValue,
} from "./useCascaderTree";

export interface CascaderPanelProps {
  /** 绑定值是否为路径：开启后单选绑定值数组、多选绑定值数组的数组 */
  pathMode?: boolean;
  /** 是否为多选状态 */
  multiple?: boolean;
  /** 默认值（非受控状态），仅在未绑定 v-model 时生效 */
  defaultValue?: CascaderValue;
  /** 级联选择器的选项 */
  options?: CascaderOption[];
  /** 展开下一级的触发方式 */
  expandTrigger?: "click" | "hover";
  /**
   * 是否开启严格选择模式。
   * 单选下任意层级都可选中；多选下父子勾选互不影响，也就不存在半选。
   */
  checkStrictly?: boolean;
  /** 数据懒加载函数，传入时开启懒加载功能 */
  loadMore?: (option: CascaderOption, done: (children?: CascaderOption[]) => void) => void;
  /** 自定义 CascaderOption 中的字段 */
  fieldNames?: CascaderFieldNames;
  /** 用于确定选项键值的属性名，选项值为对象时按该属性判定同一性 */
  valueKey?: string;
  /** 是否展开子菜单：激活某一项后沿着它的第一个可用子项继续展开，直到叶子 */
  expandChild?: boolean;
  /** 尺寸规格，决定列宽下限 */
  size?: (typeof cascaderSizes)[number];
  /** 配色，决定选中项的底色与勾选框颜色 */
  color?: (typeof cascaderColors)[number];
  /** 是否绘制面板外框。嵌进 RebornCascader 浮层时由浮层提供外框，需关掉 */
  bordered?: boolean;
  /** 整体禁用，所有选项不可点击 */
  disabled?: boolean;
  /** 传递虚拟列表属性，传入此参数以开启虚拟滚动 */
  virtualListProps?: VirtualListProps;
  /** 自定义类名 */
  class?: any;
  /** 面板内部组件的 UI 微调配置 */
  ui?: CascaderPanelUI;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CascaderPanelProps>(), {
  pathMode: false,
  multiple: false,
  defaultValue: undefined,
  options: () => [],
  expandTrigger: "click",
  checkStrictly: false,
  valueKey: "value",
  expandChild: false,
  size: "md",
  color: "primary",
  bordered: true,
  disabled: false,
});

const emit = defineEmits<{
  /** 选中值改变时触发 */
  (e: "change", value: CascaderValue): void;
  /**
   * 完成一次选中动作时触发，无论绑定值是否真的改变。
   * 载荷是被点选项按 path-mode 折算出的值，RebornCascader 据此决定要不要收起浮层。
   */
  (e: "select", value: CascaderOptionValue | CascaderOptionValue[]): void;
}>();

const b = tv(theme);

/** 绑定值（v-model）。未绑定时由 defaultValue 起始，内部自行维护 */
const model = defineModel<CascaderValue>({ default: undefined });

/** 非受控状态下的内部值，与 RebornCheckbox 同一套写法 */
const innerValue = ref<CascaderValue>(props.defaultValue);

/** 当前实际生效的值：绑定了 v-model 取绑定值，否则取内部值 */
const currentValue = computed<CascaderValue>(() =>
  model.value === undefined ? innerValue.value : model.value,
);

/** 规范化后的选项树 */
const tree = computed(() =>
  buildCascaderTree(props.options, {
    fieldNames: props.fieldNames,
    valueKey: props.valueKey,
    lazy: !!props.loadMore,
  }),
);

/** 当前展开路径上各节点的 key，列表由它推导 */
const activeKeys = ref<string[]>([]);
/** 鼠标悬停的选项 key，只影响高亮，不影响展开 */
const hoverKey = ref("");
/** 正在懒加载子节点的选项 key */
const loadingKeys = ref<Set<string>>(new Set());

/** 展开路径对应的节点。选项换了一批时，失效的 key 会在这里被自动丢弃 */
const activeNodes = computed(() => {
  const nodes: CascaderNode[] = [];
  for (const key of activeKeys.value) {
    const node = tree.value.nodeMap.get(key);
    if (!node) break;
    nodes.push(node);
  }
  return nodes;
});

/**
 * 要渲染的列。第一列恒为根节点，之后每有一个「展开路径上且有子节点」的节点就多一列。
 * 每列记下产出它的父节点 key，用作列表的 key：切换父节点时整列重建，
 * 列的滚动位置也随之归零，不会停在上一个父节点的偏移上。
 */
const columns = computed(() => {
  const list = [{ key: "__root__", nodes: tree.value.roots }];
  for (const node of activeNodes.value) {
    if (node.children.length > 0) list.push({ key: node.key, nodes: node.children });
  }
  return list;
});

/* ---------------- 选中状态 ---------------- */

/** 当前值折算出的条目数组：单选最多一条，多选逐条 */
const valueEntries = computed<(CascaderOptionValue | CascaderOptionValue[])[]>(() => {
  const value = currentValue.value;
  if (value === undefined || value === null || value === "") return [];
  if (props.multiple) return Array.isArray(value) ? [...value] : [value];
  // 单选 + 路径模式的绑定值本身就是一个数组，不能再被拆开
  if (props.pathMode) return Array.isArray(value) ? [value as CascaderOptionValue[]] : [value];
  return [value as CascaderOptionValue];
});

/** 命中的节点，未命中的值（如懒加载尚未到达的层级）直接忽略 */
const selectedNodes = computed(() => {
  const nodes: CascaderNode[] = [];
  for (const entry of valueEntries.value) {
    const node = findNodeByValue(tree.value, entry, props.pathMode, props.valueKey);
    if (node) nodes.push(node);
  }
  return nodes;
});

/**
 * 勾选集合。
 * 严格模式下记的是节点自身；关联模式下一律折算到叶子，
 * 这样父节点的选中 / 半选状态永远由叶子推导，不必再单独维护一份父节点状态。
 */
const checkedKeys = computed(() => {
  const set = new Set<string>();
  for (const node of selectedNodes.value) {
    if (props.checkStrictly) set.add(node.key);
    else for (const key of node.leafKeys) set.add(key);
  }
  return set;
});

/** 单选命中的节点 */
const selectedNode = computed(() => (props.multiple ? null : selectedNodes.value[0] ?? null));

/** 选项的勾选状态。严格模式没有半选：父子互不影响 */
function checkStateOf(node: CascaderNode) {
  if (!props.multiple) {
    return { checked: selectedNode.value?.key === node.key, indeterminate: false };
  }
  if (props.checkStrictly) {
    return { checked: checkedKeys.value.has(node.key), indeterminate: false };
  }
  return getCheckState(node, checkedKeys.value);
}

/** 选项是否在展开路径上或正被悬停，二者共用一套灰底高亮 */
function isHighlighted(node: CascaderNode) {
  return hoverKey.value === node.key || activeKeys.value.includes(node.key);
}

/* ---------------- 值的写回 ---------------- */

/** 写回绑定值：受控与非受控两份状态同时更新，非受控下才不会点一下弹回去 */
function commitValue(value: CascaderValue) {
  innerValue.value = value;
  model.value = value;
  emit("change", value);
}

/** 单选：直接落到被点节点 */
function selectSingle(node: CascaderNode) {
  const next = nodeToValue(node, props.pathMode);
  if (selectedNode.value?.key !== node.key) commitValue(next as CascaderValue);
  emit("select", next);
}

/**
 * 多选：按新的勾选集合重新拼出值数组。
 * 先保留仍然选中的旧条目（维持用户原来的顺序与外部传入的顺序），
 * 再把新增的按树的先后顺序追加到末尾，避免每勾一下标签就整体重排。
 */
function commitChecked(nextKeys: Set<string>) {
  const kept: (CascaderOptionValue | CascaderOptionValue[])[] = [];
  const keptKeys = new Set<string>();

  // 关联模式下只认叶子：外部传进来的父节点值会在下一轮里被摊平成它名下的叶子
  const isEligible = (node: CascaderNode) =>
    props.checkStrictly ? nextKeys.has(node.key) : node.isLeaf && nextKeys.has(node.key);

  for (const node of selectedNodes.value) {
    if (isEligible(node) && !keptKeys.has(node.key)) {
      kept.push(nodeToValue(node, props.pathMode));
      keptKeys.add(node.key);
    }
  }

  for (const node of tree.value.flat) {
    if (keptKeys.has(node.key)) continue;
    if (isEligible(node)) {
      kept.push(nodeToValue(node, props.pathMode));
      keptKeys.add(node.key);
    }
  }

  commitValue(kept as CascaderValue);
}

/** 切换某个选项的勾选。关联模式写它名下全部未禁用的叶子，严格模式只写它自己 */
function toggleCheck(node: CascaderNode, checked: boolean) {
  if (node.disabled || props.disabled) return;

  const next = new Set(checkedKeys.value);
  const targets = props.checkStrictly ? [node.key] : node.enabledLeafKeys;
  for (const key of targets) {
    if (checked) next.add(key);
    else next.delete(key);
  }

  commitChecked(next);
  emit("select", nodeToValue(node, props.pathMode));
}

/* ---------------- 展开 ---------------- */

/** 懒加载子节点。done 回传的数据直接写回原选项对象，交由响应式驱动重建 */
function loadChildren(node: CascaderNode) {
  if (!props.loadMore || node.isLeaf || node.children.length > 0) return;
  if (loadingKeys.value.has(node.key)) return;

  const childrenField = props.fieldNames?.children ?? "children";
  loadingKeys.value = new Set(loadingKeys.value).add(node.key);

  props.loadMore(node.raw, (children) => {
    if (children?.length) node.raw[childrenField] = children;
    else node.raw[props.fieldNames?.isLeaf ?? "isLeaf"] = true;
    const next = new Set(loadingKeys.value);
    next.delete(node.key);
    loadingKeys.value = next;
  });
}

/** 展开到某个节点；开启 expand-child 时继续沿第一个可用子项一路展开 */
function expandTo(node: CascaderNode) {
  const keys = node.path.map((item) => item.key);

  if (props.expandChild) {
    let cursor: CascaderNode | undefined = node;
    while (cursor && cursor.children.length > 0) {
      const next: CascaderNode | undefined =
        cursor.children.find((child) => !child.disabled) ?? cursor.children[0];
      if (!next) break;
      keys.push(next.key);
      cursor = next;
    }
  }

  activeKeys.value = keys;
  loadChildren(node);
}

function onOptionMouseEnter(node: CascaderNode) {
  if (props.disabled) return;
  hoverKey.value = node.key;
  if (props.expandTrigger !== "hover" || node.disabled) return;
  expandTo(node);
}

function onPanelMouseLeave() {
  hoverKey.value = "";
}

/**
 * 点击选项。
 * 单选：叶子（或严格模式下的任意节点）即完成选中；非叶子同时展开下一级。
 * 多选：叶子切换勾选，非叶子只展开——父节点的勾选交给行首的勾选框，
 * 否则「想往下看一层」和「把整棵子树勾上」会共用同一次点击，谁也说不清该发生哪个。
 */
function onOptionClick(node: CascaderNode) {
  if (node.disabled || props.disabled) return;

  if (props.multiple) {
    if (node.isLeaf) toggleCheck(node, !checkStateOf(node).checked);
    else expandTo(node);
    return;
  }

  if (node.isLeaf || props.checkStrictly) selectSingle(node);
  if (!node.isLeaf) expandTo(node);
}

/** 把展开路径同步到当前选中项，浮层每次打开时由 RebornCascader 调用 */
function syncActivePath() {
  const node = selectedNode.value ?? selectedNodes.value[0] ?? null;
  activeKeys.value = node ? node.path.map((item) => item.key) : [];
  hoverKey.value = "";
}

/* ---------------- 虚拟滚动 ---------------- */

/** 单项占位高度：33 = 选项行 29px + 行间距 4px，与 reborn-select 同一口径 */
const itemHeight = computed(() => props.virtualListProps?.height ?? 33);
const itemBuffer = computed(() => props.virtualListProps?.buffer ?? 4);
const virtualThreshold = computed(() => props.virtualListProps?.threshold ?? 0);

/**
 * 每列的滚动距离与可视高度，按「产出该列的父节点 key」记账。
 * 不走模板 ref 回调：内联箭头函数每次重渲染都会被 Vue 当成新的 ref 重新调用一遍，
 * 而回调里要写的正是 columnViews 依赖的这两个 ref，会绕成「渲染 → 写 ref → 再渲染」的死循环。
 */
const scrollTops = ref<Record<string, number>>({});
const viewHeights = ref<Record<string, number>>({});

function onColumnScroll(key: string, event: Event) {
  const el = event.target as HTMLElement;
  scrollTops.value = { ...scrollTops.value, [key]: el.scrollTop };
  if (el.clientHeight) viewHeights.value = { ...viewHeights.value, [key]: el.clientHeight };
}

/**
 * 每列真正进入 v-for 的行，勾选状态一并在此算好：
 * 关联模式下每算一次都要遍历该节点名下的全部叶子，放进模板里会被反复求值。
 * 虚拟模式下只切出可视区间，上下各多留 buffer 项抵消快速滚动时的白屏。
 */
const columnViews = computed(() =>
  columns.value.map((column) => {
    const total = column.nodes.length;
    const virtual = !!props.virtualListProps && total > virtualThreshold.value;
    const toRow = (node: CascaderNode) => ({ node, ...checkStateOf(node) });

    if (!virtual) {
      return {
        key: column.key,
        virtual,
        offset: 0,
        totalHeight: 0,
        rows: column.nodes.map(toRow),
      };
    }

    const h = itemHeight.value;
    const start = Math.max(0, Math.floor((scrollTops.value[column.key] ?? 0) / h) - itemBuffer.value);
    const visible = Math.ceil((viewHeights.value[column.key] ?? 240) / h) + itemBuffer.value * 2;
    const end = Math.min(total, start + visible);

    return {
      key: column.key,
      virtual,
      offset: start * h,
      totalHeight: total * h,
      rows: column.nodes.slice(start, end).map(toRow),
    };
  }),
);

// 列被收起后丢掉它的滚动记录：同一个父节点再次展开时，列是重新挂载的、滚动条本就在顶部，
// 留着旧偏移会让虚拟窗口停在一个 DOM 里并不存在的位置上。
watch(columns, (list) => {
  const alive = new Set(list.map((column) => column.key));
  const pick = (source: Record<string, number>) =>
    Object.fromEntries(Object.entries(source).filter(([key]) => alive.has(key)));
  scrollTops.value = pick(scrollTops.value);
  viewHeights.value = pick(viewHeights.value);
});

/* ---------------- 样式 ---------------- */

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    bordered: props.bordered,
    disabled: props.disabled,
  });

  return {
    panel: (opts?: { class?: any }) =>
      styles.panel({ class: cn(opts?.class, uiOverrides.value.panel) }),
    column: (opts?: { class?: any }) =>
      styles.column({ class: cn(opts?.class, uiOverrides.value.column) }),
    columnDivider: (opts?: { class?: any }) =>
      styles.columnDivider({ class: cn(opts?.class, uiOverrides.value.columnDivider) }),
    option: (opts?: { class?: any; active?: boolean }) =>
      styles.option({ active: opts?.active, class: cn(opts?.class, uiOverrides.value.option) }),
    optionContent: (opts?: { class?: any }) =>
      styles.optionContent({ class: cn(opts?.class, uiOverrides.value.optionContent) }),
    optionLabel: (opts?: { class?: any }) =>
      styles.optionLabel({ class: cn(opts?.class, uiOverrides.value.optionLabel) }),
    optionActive: (opts?: { class?: any }) =>
      styles.optionActive({ class: cn(opts?.class, uiOverrides.value.optionActive) }),
    optionHighlight: (opts?: { class?: any }) =>
      styles.optionHighlight({ class: cn(opts?.class, uiOverrides.value.optionHighlight) }),
    optionCheckbox: (opts?: { class?: any }) =>
      styles.optionCheckbox({ class: cn(opts?.class, uiOverrides.value.optionCheckbox) }),
    optionArrow: (opts?: { class?: any }) =>
      styles.optionArrow({ class: cn(opts?.class, uiOverrides.value.optionArrow) }),
    optionLoading: (opts?: { class?: any }) =>
      styles.optionLoading({ class: cn(opts?.class, uiOverrides.value.optionLoading) }),
    optionList: (opts?: { class?: any }) =>
      styles.optionList({ class: cn(opts?.class, uiOverrides.value.optionList) }),
    virtualPhantom: (opts?: { class?: any }) =>
      styles.virtualPhantom({ class: cn(opts?.class, uiOverrides.value.virtualPhantom) }),
    virtualWindow: (opts?: { class?: any }) =>
      styles.virtualWindow({ class: cn(opts?.class, uiOverrides.value.virtualWindow) }),
    empty: (opts?: { class?: any }) =>
      styles.empty({ class: cn(opts?.class, uiOverrides.value.empty) }),
  };
});

// 选项整体换了一批时，旧的展开路径可能已经不存在，重新对齐到当前选中项。
// 只认「换了一批」（引用变化），不认深层改动：懒加载往选项里补子节点也会动到这棵树，
// 那时把展开路径拽回选中项，用户刚点开的那一列会当场收起来。
watch(
  () => props.options,
  () => {
    nextTick(syncActivePath);
  },
);

// 首屏也要对齐一次：独立使用的面板没有「打开浮层」这个时机去同步展开路径，
// 不同步的话，带着初始值渲染出来只有第一列，看不到选中的是哪一项。
onMounted(syncActivePath);

/**
 * 按 key 直接完成一次选中，供 RebornCascader 的搜索结果列表复用：
 * 搜索结果是一张拍平的列表，点中后不该再按「非叶子就展开」那套走。
 */
function pick(key: string) {
  const node = tree.value.nodeMap.get(key);
  if (!node || node.disabled || props.disabled) return;
  if (props.multiple) toggleCheck(node, !checkStateOf(node).checked);
  else selectSingle(node);
}

defineExpose({
  /** 把展开路径同步到当前选中项 */
  syncActivePath,
  /** 按节点 key 完成一次选中（多选为切换勾选） */
  pick,
  /** 当前展开路径上的节点，调试与外部联动用 */
  activeNodes,
});
</script>

<template>
  <div :class="ui.panel({ class: props.class })" @mouseleave="onPanelMouseLeave">
    <template v-if="tree.roots.length">
      <template v-for="(column, columnIndex) in columnViews" :key="column.key">
        <!-- 列分割线：1px 的 gray-2 竖线，第一列之前不画 -->
        <div v-if="columnIndex > 0" :class="ui.columnDivider()" />

        <div :class="ui.column()" @scroll="onColumnScroll(column.key, $event)">
          <!-- 占位层 + 窗口层：非虚拟模式下两层不带任何样式，纯粹是透明的结构层 -->
          <div
            :class="column.virtual ? ui.virtualPhantom() : undefined"
            :style="column.virtual ? { height: `${column.totalHeight}px` } : undefined"
          >
            <div
              :class="[ui.optionList(), column.virtual ? ui.virtualWindow() : '']"
              :style="column.virtual ? { transform: `translateY(${column.offset}px)` } : undefined"
            >
              <!-- 选中态优先于高亮态：两者都是 bg-*，同时挂上只能靠 CSS 顺序定胜负 -->
              <div
                v-for="row in column.rows" :key="row.node.key" :class="[
                  ui.option({ active: row.checked }),
                  row.checked ? ui.optionActive() : '',
                  !row.checked && isHighlighted(row.node) ? ui.optionHighlight() : '',
                ]" :style="column.virtual ? { height: `${itemHeight - 4}px` } : undefined"
                :data-disabled="row.node.disabled || disabled ? 'true' : 'false'"
                @click="onOptionClick(row.node)" @mouseenter="onOptionMouseEnter(row.node)"
              >
                <slot
                  name="option" :data="row.node.raw" :level="row.node.level"
                  :checked="row.checked" :indeterminate="row.indeterminate"
                >
                  <div :class="ui.optionContent()">
                    <!-- 多选：勾选框只管切换勾选，点击不再冒泡给整行，免得顺带把子菜单也展开 -->
                    <span v-if="multiple" :class="ui.optionCheckbox()" @click.stop>
                      <RebornCheckbox
                        size="sm" :color="color" :model-value="row.checked"
                        :indeterminate="row.indeterminate"
                        :disabled="row.node.disabled || disabled"
                        @change="toggleCheck(row.node, $event === true)"
                      />
                    </span>

                    <component :is="row.node.render" v-if="row.node.render" />
                    <span v-else :class="ui.optionLabel()">{{ row.node.label }}</span>

                    <Icon
                      v-if="loadingKeys.has(row.node.key)" name="lucide:loader-2"
                      :class="ui.optionLoading()"
                    />
                    <Icon
                      v-else-if="!row.node.isLeaf" name="lucide:chevron-right"
                      :class="ui.optionArrow()"
                    />
                  </div>
                </slot>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <div v-else :class="ui.empty()">
      <slot name="empty">暂无数据</slot>
    </div>
  </div>
</template>
