<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { SelectFieldUI } from "../reborn-select/reborn-select.config";
import type { TreeCheckedKeys, TreeDataNode, TreeKey } from "../reborn-tree/reborn-tree.config";
import type { RebornTreeProps } from "../reborn-tree/RebornTree.vue";
import type { treeSelectColors, treeSelectSizes, TreeSelectUI, TreeSelectValue, treeSelectVariants } from "./reborn-tree-select.config";
import { computed, nextTick, ref, useId, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornBadge from "../reborn-badge/RebornBadge.vue";
import { splitTriggerUi } from "../reborn-select-trigger/reborn-select-trigger.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import RebornTooltip from "../reborn-tooltip/RebornTooltip.vue";
import RebornTree from "../reborn-tree/RebornTree.vue";
import theme from "./reborn-tree-select.config";

export interface TreeSelectProps {
  /** 层级数据，节点 key 必须在整棵树内唯一 */
  treeData?: TreeDataNode[];
  /** 自定义标题、唯一标识与子节点字段 */
  fieldNames?: RebornTreeProps["fieldNames"];
  /** 多选时展示复选框，各节点独立勾选 */
  multiple?: boolean;
  /** 多选时将超出保留数量的标签折叠为 +N */
  collapseTags?: boolean;
  /** 悬浮展示被折叠的标签，需开启 collapseTags */
  collapseTagsTooltip?: boolean;
  /** 折叠前保留的标签数量，最少为 0 */
  maxCollapseTags?: number;
  /** 在触发器内搜索节点标题，保留命中节点的祖先路径 */
  allowSearch?: boolean;
  /** 空值时的提示文字 */
  placeholder?: string;
  /** 禁用选择与清空，并继承表单禁用状态 */
  disabled?: boolean;
  /** 显示清空按钮 */
  clearable?: boolean;
  /** 三档尺寸，继承表单尺寸 */
  size?: (typeof treeSelectSizes)[number];
  /** 选择框与树共用的语义色 */
  color?: (typeof treeSelectColors)[number];
  /** 选择框形态，与 reborn-select 一致 */
  variant?: (typeof treeSelectVariants)[number];
  /** 默认展开所有节点 */
  defaultExpandAll?: boolean;
  /** 默认展开的节点 */
  defaultExpandedKeys?: TreeKey[];
  /** 展示树节点连接线 */
  showLine?: RebornTreeProps["showLine"];
  /** 展示节点 icon 字段指定的图标 */
  showIcon?: boolean;
  /** 异步加载子节点，调用方更新 treeData */
  loadData?: RebornTreeProps["loadData"];
  /** 树滚动区高度，单位 px */
  height?: number;
  /** 开启树的定高虚拟滚动 */
  virtual?: boolean;
  /** 空数据提示 */
  emptyText?: string;
  /** 浮层传送到 body */
  portal?: boolean;
  /** 外部点击或按下时收起 */
  closeOn?: SelectTriggerProps["closeOn"];
  /** 空间不足时自动向上展开 */
  autoAdjustOverflow?: boolean;
  /** 根容器样式 */
  class?: ClassValue;
  /** 选择框与浮层样式，与 reborn-select 的同名入口一致 */
  triggerUi?: SelectTriggerProps["ui"] & SelectFieldUI;
  /** 下拉内容、空态与标签样式 */
  ui?: TreeSelectUI;
  /** 透传给 reborn-tree 的局部样式 */
  treeUi?: RebornTreeProps["ui"];
}

const props = withDefaults(defineProps<TreeSelectProps>(), {
  treeData: () => [], multiple: false, placeholder: "请选择", disabled: false,
  collapseTags: false, collapseTagsTooltip: false, maxCollapseTags: 1, allowSearch: false,
  clearable: false, size: "md", color: "primary", variant: "outlined",
  defaultExpandAll: false, defaultExpandedKeys: () => [], showLine: false,
  showIcon: false, height: 240, virtual: true, emptyText: "暂无数据",
  portal: true, closeOn: "click", autoAdjustOverflow: true,
});

const emit = defineEmits<{
  /** 用户修改选择时触发 */
  change: [value: TreeSelectValue];
  /** 用户输入搜索关键词时触发，关闭清理不重复触发 */
  search: [value: string];
  /** 点击清空按钮时触发 */
  clear: [];
  /** 浮层展开状态变化 */
  visibleChange: [open: boolean];
}>();
/** 单选为空时回写 null，多选为空时回写空数组。 */
const model = defineModel<TreeSelectValue>({ default: null });
/** 不传时由树自行维护展开状态。 */
const expandedKeys = defineModel<TreeKey[]>("expandedKeys");
const { disabled: isDisabled, size: fieldSize, isError, validate } = useFormInject(props);
const isOpen = ref(false);
const treeId = useId();
const searchValue = ref("");
const searchInput = ref<HTMLInputElement>();
const isSearching = computed(() => props.allowSearch && isOpen.value);
const keyword = computed(() => props.allowSearch ? searchValue.value.trim().toLowerCase() : "");
const searchExpandedKeys = ref<TreeKey[]>([]);
/** 搜索只裁剪展示数据，节点索引与已选值始终基于完整数据。 */
const filteredTree = computed(() => {
  const keys = new Set<TreeKey>();
  const ancestors: TreeKey[] = [];
  if (!keyword.value) return { data: props.treeData, keys, ancestors };
  const keyField = props.fieldNames?.key ?? "key";
  const titleField = props.fieldNames?.title ?? "title";
  const childrenField = props.fieldNames?.children ?? "children";
  function filter(nodes: TreeDataNode[]): TreeDataNode[] {
    return nodes.flatMap((node) => {
      const source = node[childrenField];
      const children = Array.isArray(source) ? filter(source) : [];
      if (!String(node[titleField] ?? "").toLowerCase().includes(keyword.value) && !children.length) return [];
      const key = node[keyField] as TreeKey;
      keys.add(key);
      if (children.length) ancestors.push(key);
      return [{ ...node, ...(Array.isArray(source) ? { [childrenField]: children } : {}) }];
    });
  }
  return { data: filter(props.treeData), keys, ancestors };
});
/** 搜索展开态独立维护，收起或清除搜索后恢复调用方原来的展开状态。 */
const displayedExpandedKeys = computed({
  get: () => keyword.value ? searchExpandedKeys.value : expandedKeys.value,
  set: (keys: TreeKey[] | undefined) => {
    if (keyword.value) searchExpandedKeys.value = keys ?? [];
    else expandedKeys.value = keys;
  },
});
watch(filteredTree, (tree) => { searchExpandedKeys.value = tree.ancestors; });
const trigger = ref<InstanceType<typeof RebornSelectTrigger>>();
const b = tv(theme);
const splitUi = computed(() => splitTriggerUi(props.triggerUi));
const fieldUi = computed(() => splitUi.value.field as SelectFieldUI);
const selectedKeys = computed<TreeKey[]>(() => {
  if (model.value === null) return [];
  const keys = Array.isArray(model.value) ? model.value : [model.value];
  return props.multiple ? keys : keys.slice(0, 1);
});

/** 一次遍历建立索引；保留尚未加载的 key，避免异步数据到达前丢失回显。 */
const nodeMap = computed(() => {
  const map = new Map<TreeKey, TreeDataNode>();
  const keyField = props.fieldNames?.key ?? "key";
  const childrenField = props.fieldNames?.children ?? "children";
  function visit(nodes: TreeDataNode[]) {
    for (const node of nodes) {
      map.set(node[keyField] as TreeKey, node);
      const children = node[childrenField];
      if (Array.isArray(children)) visit(children);
    }
  }
  visit(props.treeData);
  return map;
});
const selectedItems = computed(() => selectedKeys.value.map((key) => {
  const node = nodeMap.value.get(key);
  return { key, label: String(node?.[props.fieldNames?.title ?? "title"] ?? key),
    disabled: node?.disabled || node?.disableCheckbox };
}));
const visibleTags = computed(() => props.collapseTags
  ? selectedItems.value.slice(0, Math.max(0, props.maxCollapseTags)) : selectedItems.value);
const collapsedTags = computed(() => props.collapseTags
  ? selectedItems.value.slice(Math.max(0, props.maxCollapseTags)) : []);
const collapsedText = computed(() => collapsedTags.value.map(item => item.label).join("、"));
const searchPlaceholder = computed(() => selectedItems.value.length ? (props.multiple ? "" : selectedItems.value[0]?.label) : props.placeholder);
const showClear = computed(() => props.clearable && !isDisabled.value && selectedKeys.value.length > 0);
const ui = computed(() => b({
  size: fieldSize.value, color: props.color, variant: props.variant, multiple: props.multiple,
  wrapTags: props.multiple && !props.collapseTags && selectedKeys.value.length > 0, open: isOpen.value,
  clearable: showClear.value, disabled: isDisabled.value, error: isError.value,
}));

/** 统一用户操作出口，程序化回填不重复触发表单校验。 */
function updateValue(keys: TreeKey[]) {
  if (isDisabled.value) return;
  model.value = props.multiple ? keys : (keys[0] ?? null);
  emit("change", model.value);
  validate("change");
}
function selectNode(keys: TreeKey[]) {
  updateValue(keys);
  isOpen.value = false;
}
function checkNodes(keys: TreeCheckedKeys) {
  const checked = Array.isArray(keys) ? keys : keys.checked;
  const hidden = keyword.value ? selectedKeys.value.filter(key => !filteredTree.value.keys.has(key)) : [];
  updateValue([...new Set([...hidden, ...checked])]);
  if (props.allowSearch) {
    searchValue.value = "";
    nextTick(() => searchInput.value?.focus());
  }
}
function removeTag(key: TreeKey, event: MouseEvent) {
  event.stopPropagation();
  if (selectedItems.value.find(item => item.key === key)?.disabled) return;
  updateValue(selectedKeys.value.filter(value => value !== key));
}
function clear() {
  if (isDisabled.value) return;
  updateValue([]);
  emit("clear");
}
function toggle() {
  if (isDisabled.value) return;
  if (isSearching.value) searchInput.value?.focus();
  else isOpen.value = !isOpen.value;
}
function onKeydown(event: KeyboardEvent) {
  if (isDisabled.value) return;
  if (event.key === "Escape" || event.key === "Tab") isOpen.value = false;
  if (event.target !== event.currentTarget) return;
  if (["Enter", " ", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    isOpen.value = true;
  }
}
function onPanelKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  event.stopPropagation();
  isOpen.value = false;
  trigger.value?.$el.focus();
}
watch(isDisabled, (disabled) => { if (disabled) isOpen.value = false; });
/** 输入仅触发搜索事件，不改动选中值。 */
function onSearchInput(event: Event) {
  searchValue.value = (event.target as HTMLInputElement).value;
  emit("search", searchValue.value);
}
watch(isOpen, (open) => emit("visibleChange", open));
watch(isSearching, async (searching) => {
  if (searching) {
    await nextTick();
    searchInput.value?.focus();
  } else searchValue.value = "";
});
</script>

<template>
  <RebornSelectTrigger
    ref="trigger" :class="props.class" :is-open="isOpen" :disabled="isDisabled"
    :size="fieldSize" :ui="splitUi.overlay" :portal="portal" :close-on="closeOn"
    :auto-adjust-overflow="autoAdjustOverflow"
    @keydown="onKeydown" @close="isOpen = false"
  >
    <template #trigger>
      <div
        :class="ui.trigger({ class: cn(fieldUi.trigger) })" :data-state="isOpen ? 'open' : 'closed'" role="combobox" aria-haspopup="tree"
        :aria-expanded="isOpen" :aria-controls="isOpen ? treeId : undefined" :aria-disabled="isDisabled" :aria-label="placeholder" @click="toggle"
      >
        <div v-if="multiple && selectedItems.length" :class="ui.tagList({ class: cn(props.ui?.tagList) })">
          <RebornBadge
            v-for="item in visibleTags" :key="item.key" :label="item.label" color="neutral"
            variant="subtle" size="sm" :closable="!isDisabled && !item.disabled" close-icon="lucide:x"
            :ui="{ root: 'min-w-0 max-w-full', base: ui.tag({ class: cn(props.ui?.tag) }), label: ui.tagLabel(), closeButton: ui.tagClose(), closeIcon: ui.tagCloseIcon() }"
            @close="removeTag(item.key, $event)"
          />
          <RebornTooltip v-if="collapsedTags.length && collapseTagsTooltip" :content="collapsedText">
            <RebornBadge
              :label="`+${collapsedTags.length}`" color="neutral" variant="subtle" size="sm"
              :ui="{ root: 'shrink-0', base: ui.tag({ class: cn(ui.collapseTag(), props.ui?.collapseTag) }), label: ui.tagLabel() }"
            />
          </RebornTooltip>
          <RebornBadge
            v-else-if="collapsedTags.length" :label="`+${collapsedTags.length}`" color="neutral" variant="subtle" size="sm"
            :ui="{ root: 'shrink-0', base: ui.tag({ class: cn(ui.collapseTag(), props.ui?.collapseTag) }), label: ui.tagLabel() }"
          />
          <input
            v-if="isSearching" ref="searchInput" type="text" :value="searchValue" :placeholder="searchPlaceholder"
            :aria-label="placeholder" :class="ui.searchInput({ class: cn(fieldUi.searchInput) })" @input="onSearchInput"
          >
        </div>
        <input
          v-else-if="isSearching" ref="searchInput" type="text" :value="searchValue" :placeholder="searchPlaceholder"
          :aria-label="placeholder" :class="ui.searchInput({ class: cn(fieldUi.searchInput) })" @input="onSearchInput"
        >
        <span v-else-if="selectedItems.length" :class="ui.triggerText({ class: cn(fieldUi.triggerText) })">{{ selectedItems[0]?.label }}</span>
        <span v-else :class="ui.placeholder({ class: cn(fieldUi.placeholder) })">{{ placeholder }}</span>
        <div :class="ui.triggerIconWrapper({ class: cn(fieldUi.triggerIconWrapper) })">
          <Icon name="lucide:chevron-down" :class="ui.arrow({ class: cn(fieldUi.arrow) })" />
          <button
            v-if="showClear" type="button" aria-label="清空选择"
            :class="ui.clearBtn({ class: cn(fieldUi.clearBtn) })" @click.stop="clear"
          >
            <Icon name="lucide:x" class="size-full" />
          </button>
        </div>
      </div>
    </template>
    <template #content>
      <!-- 仅树自身滚动，避免选择器列表与虚拟树形成双滚动容器。 -->
      <div :class="ui.dropdown({ class: cn('max-h-none overflow-visible', props.ui?.dropdown) })" @keydown="onPanelKeydown">
        <RebornTree
          v-if="filteredTree.data.length" :id="treeId" :key="keyword" v-model:expanded-keys="displayedExpandedKeys"
          :tree-data="filteredTree.data" :field-names="fieldNames" :selected-keys="multiple ? [] : selectedKeys"
          :checked-keys="multiple ? selectedKeys : []" :checkable="multiple" check-strictly
          :selectable="!multiple" block-node :disabled="isDisabled" :color="color"
          :default-expand-all="defaultExpandAll" :default-expanded-keys="defaultExpandedKeys"
          :show-line="showLine" :show-icon="showIcon" :load-data="loadData"
          :height="height" :virtual="virtual" :ui="treeUi" @select="selectNode" @check="checkNodes"
        >
          <template v-if="$slots.title" #title="{ node, selected, expanded }">
            <slot name="title" :node="node" :selected="selected" :expanded="expanded" />
          </template>
        </RebornTree>
        <div v-else :id="treeId" :class="ui.empty({ class: cn(props.ui?.empty) })">
          <slot name="empty">{{ keyword ? "无匹配结果" : emptyText }}</slot>
        </div>
      </div>
    </template>
  </RebornSelectTrigger>
</template>
