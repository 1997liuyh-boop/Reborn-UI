<script setup lang="ts">
/**
 * RebornCascader 级联选择器
 * 用于多层级的数据选择，如省市区、分类层级等。
 */
import { ref, computed, watch, onBeforeUnmount } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import theme, { cascaderSizes, cascaderColors } from "./reborn-cascader.config";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

/**
 * 级联选项定义
 */
export interface CascaderOption {
  /** 选项展示文本 */
  label: string;
  /** 选项实际值 */
  value: any;
  /** 是否禁用该选项 */
  disabled?: boolean;
  /** 子选项 */
  children?: CascaderOption[];
  /** 是否为叶子节点 */
  leaf?: boolean;
  /** 其他自定义属性 */
  [key: string]: any;
}

/**
 * 级联组件属性定义
 */
export interface CascaderProps {
  /** 数据源选项 */
  options?: CascaderOption[];
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用组件 */
  disabled?: boolean;
  /** 尺寸规格 */
  size?: (typeof cascaderSizes)[number];
  /** 颜色 */
  color?: (typeof cascaderColors)[number];
  /** 是否显示清空按钮 */
  clearable?: boolean;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 展开时箭头是否旋转 */
  arrowAnimation?: boolean;
  /** 标签字段名 */
  labelKey?: string;
  /** 值字段名 */
  valueKey?: string;
  /** 子节点字段名 */
  childrenKey?: string;
  /** 文本分隔符 */
  textSeparator?: string;
  /** 叶子层级限制 */
  leafLevel?: number;
  /** 是否显示触发器 */
  showTrigger?: boolean;
  /** 自定义类名 */
  class?: any;
  /**
   * 浮层是否传送到 body（默认 true）。
   * 关掉后浮层留在触发器内，会随父容器一起滚动、也一起被 overflow 裁剪。
   */
  portal?: SelectTriggerProps["portal"];
  /** 触发器 UI 配置 */
  triggerUi?: SelectTriggerProps["ui"];
  /** 级联选择器内部组件的 UI 微调配置 */
  ui?: Partial<{
    wrapper: ClassValue;
    triggerText: ClassValue;
    placeholder: ClassValue;
    panel: ClassValue;
    column: ClassValue;
    option: ClassValue;
    optionActive: ClassValue;
    optionDisabled: ClassValue;
    optionLabel: ClassValue;
    optionIcon: ClassValue;
    empty: ClassValue;
  }>;
}

const props = withDefaults(defineProps<CascaderProps>(), {
  options: () => [],
  placeholder: "请选择",
  disabled: false,
  size: "md",
  color: "primary",
  clearable: true,
  bordered: true,
  showArrow: true,
  arrowAnimation: true,
  portal: true,
  labelKey: "label",
  valueKey: "value",
  childrenKey: "children",
  textSeparator: " / ",
  leafLevel: 0,
  showTrigger: true,
  triggerUi: () => ({}),
  ui: () => ({}),
});

/**
 * 选择变动事件
 */
const emit = defineEmits<{
  (e: "update:modelValue", value: any[]): void;
  (e: "change", value: any[], selectedOptions: CascaderOption[]): void;
}>();

/** 绑定值（路径数组） */
const modelValue = defineModel<any[]>({ default: () => [] });

/** 下拉是否展开 */
const isOpen = ref(false);
/** 当前 hover 的路径 */
const activePath = ref<CascaderOption[]>([]);
/** 已选中的路径 */
const selectedPath = ref<CascaderOption[]>([]);
/** hover 计时器 */
const hoverTimers = ref<Map<number, ReturnType<typeof setTimeout>>>(new Map());

/**
 * 生成及管理样式映射表
 */
const styles = computed(() =>
  b({
    size: props.size,
    color: props.color,
    disabled: props.disabled,
  }),
);

/** 传给 Trigger 的 UI 配置 */
const triggerUi = computed(() => {
  const ui = { ...(props.triggerUi || {}) };
  ui.dropdown = cn(styles.value.dropdown(), ui.dropdown);
  return ui;
});

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const s = styles.value;

  return {
    wrapper: (opts?: { class?: any }) =>
      s.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    triggerText: (opts?: { class?: any }) =>
      s.triggerText({ class: cn(opts?.class, uiOverrides.value.triggerText) }),
    placeholder: (opts?: { class?: any }) =>
      s.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    panel: (opts?: { class?: any }) =>
      s.panel({ class: cn(opts?.class, uiOverrides.value.panel) }),
    column: (opts?: { class?: any }) =>
      s.column({ class: cn(opts?.class, uiOverrides.value.column) }),
    option: (opts?: { class?: any }) =>
      s.option({ class: cn(opts?.class, uiOverrides.value.option) }),
    optionActive: (opts?: { class?: any }) =>
      s.optionActive({ class: cn(opts?.class, uiOverrides.value.optionActive) }),
    optionDisabled: (opts?: { class?: any }) =>
      s.optionDisabled({ class: cn(opts?.class, uiOverrides.value.optionDisabled) }),
    optionLabel: (opts?: { class?: any }) =>
      s.optionLabel({ class: cn(opts?.class, uiOverrides.value.optionLabel) }),
    optionIcon: (opts?: { class?: any }) =>
      s.optionIcon({ class: cn(opts?.class, uiOverrides.value.optionIcon) }),
    empty: (opts?: { class?: any }) =>
      s.empty({ class: cn(opts?.class, uiOverrides.value.empty) }),
  };
});

const hasValue = computed(() => selectedPath.value.length > 0);

const displayText = computed(() => {
  if (!hasValue.value) return "";
  return selectedPath.value.map((item) => item[props.labelKey]).join(props.textSeparator);
});

// 根据当前 hover 路径计算要显示的列
const displayColumns = computed(() => {
  const columns: CascaderOption[][] = [props.options];

  for (const option of activePath.value) {
    const children = option[props.childrenKey];
    if (children && children.length > 0) {
      columns.push(children);
    }
  }

  return columns;
});

/**
 * 判断是否为叶子节点
 */
function isLeafNode(item: CascaderOption, listIndex: number) {
  return (
    item.leaf === true ||
    (!item[props.childrenKey] || item[props.childrenKey].length === 0) ||
    (props.leafLevel > 0 && listIndex + 1 >= props.leafLevel)
  );
}

function isSameOption(option: CascaderOption | undefined, target: CascaderOption | undefined) {
  if (!option || !target) return false;
  return option[props.valueKey] === target[props.valueKey];
}

function isOptionHighlighted(option: CascaderOption, level: number) {
  return (
    isSameOption(activePath.value[level], option) ||
    isSameOption(selectedPath.value[level], option)
  );
}

/**
 * 切换下拉展开状态
 */
function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    activePath.value = selectedPath.value.slice();
  }
}

/**
 * 清除选中内容
 */
function clear() {
  selectedPath.value = [];
  activePath.value = [];
  modelValue.value = [];
  emit("change", [], []);
}

/**
 * 处理选项 hover
 */
function onOptionMouseEnter(option: CascaderOption, level: number) {
  if (option.disabled) return;

  // 清除所有计时器
  hoverTimers.value.forEach((timer) => clearTimeout(timer));
  hoverTimers.value.clear();

  // 更新当前 hover 路径
  activePath.value = [...activePath.value.slice(0, level), option];
}

/**
 * 处理选项离开
 */
function onOptionMouseLeave(level: number) {
  // 延迟清除，避免快速移动时闪烁
  const timer = setTimeout(() => {
    // 如果鼠标移到了下一级，不清除当前级
    if (activePath.value.length > level + 1) return;
    const shouldKeepCurrentLevel = isSameOption(activePath.value[level], selectedPath.value[level]);
    activePath.value = activePath.value.slice(0, shouldKeepCurrentLevel ? level + 1 : level);
  }, 100);

  hoverTimers.value.set(level, timer);
}

/**
 * 处理选项点击
 */
function onOptionClick(option: CascaderOption, level: number) {
  if (option.disabled) return;

  // 更新选中路径 - 确保路径连续
  const newPath = activePath.value.slice(0, level);
  newPath.push(option);

  const isLeaf = isLeafNode(option, level);

  // 如果是叶子节点，完成选择
  if (isLeaf) {
    selectedPath.value = newPath;
    const valuePath = selectedPath.value.map((item) => item[props.valueKey]);
    modelValue.value = valuePath;
    emit("change", valuePath, [...selectedPath.value]);
    isOpen.value = false;
    activePath.value = [];
  } else {
    activePath.value = newPath;
    return;
    // 有子选项，展开下一级
    activePath.value = selectedPath.value.slice();
  }
}

/**
 * 处理面板 hover
 */
function onPanelMouseEnter() {
  // 清除所有计时器
  hoverTimers.value.forEach((timer) => clearTimeout(timer));
  hoverTimers.value.clear();
}

/**
 * 处理面板离开
 */
function onPanelMouseLeave() {
  // 延迟关闭面板
  const timer = setTimeout(() => {
    activePath.value = [];
  }, 150);

  hoverTimers.value.set(-1, timer);
}

/**
 * 收起面板。外部点击的判定归 RebornSelectTrigger：
 * 级联面板已随浮层传送到 body，本组件根节点不再包含它，
 * 自己判 $el.contains 会把「点击某一级选项」误判成外部点击、导致选到一半就收起。
 */
function onOutsideClose() {
  if (!isOpen.value) return;
  isOpen.value = false;
  activePath.value = [];
}

/**
 * 打开面板
 */
function open() {
  if (props.disabled) return;
  isOpen.value = true;
  activePath.value = selectedPath.value.slice();
}

/**
 * 关闭面板
 */
function close() {
  isOpen.value = false;
  activePath.value = [];
}

// 监听 modelValue 变化，更新选中路径
watch(
  modelValue,
  (value) => {
    if (value && value.length > 0) {
      // 根据 value 路径找到对应的选项
      let currentOptions = props.options;
      const path: CascaderOption[] = [];

      for (const val of value) {
        const option = currentOptions.find((opt) => opt[props.valueKey] === val);
        if (option) {
          path.push(option);
          currentOptions = option[props.childrenKey] || [];
        } else {
          break;
        }
      }

      selectedPath.value = path;
    } else {
      selectedPath.value = [];
    }
  },
  { immediate: true },
);

watch(
  selectedPath,
  (path) => {
    if (!isOpen.value || path.length === 0) return;

    const currentOption = path[path.length - 1];
    if (!currentOption) return;

    const currentLevel = path.length - 1;
    if (!isLeafNode(currentOption, currentLevel)) {
      activePath.value = path.slice();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  hoverTimers.value.forEach((timer) => clearTimeout(timer));
  hoverTimers.value.clear();
});

defineExpose({ open, close, clear });
</script>

<template>
  <RebornSelectTrigger v-if="showTrigger" :class="ui.wrapper({ class: props.class })" :is-open="isOpen"
    :disabled="disabled" :clearable="clearable && hasValue" :size="size" :color="color" :bordered="bordered"
    :show-arrow="showArrow" :arrow-animation="arrowAnimation" :ui="triggerUi" :portal="portal" @toggle="toggle" @clear="clear"
    @close="onOutsideClose">
    <template #default>
      <slot :isOpen="isOpen" :toggle="toggle" :clear="clear" :hasValue="hasValue" :displayText="displayText">
        <span v-if="displayText" :class="ui.triggerText()">{{ displayText }}</span>
        <span v-else :class="ui.placeholder()">{{ placeholder }}</span>
      </slot>
    </template>

    <template #content>
      <div :class="ui.panel()" @mouseenter="onPanelMouseEnter" @mouseleave="onPanelMouseLeave">
        <div v-if="props.options.length > 0" class="flex items-stretch gap-2">
          <!-- 渲染每一列 -->
          <div v-for="(column, columnIndex) in displayColumns" :key="columnIndex" :class="ui.column()">
            <div v-for="option in column" :key="option[valueKey]" :class="cn(
              ui.option(),
              isOptionHighlighted(option, columnIndex) && ui.optionActive(),
              option.disabled && ui.optionDisabled(),
            )" @mouseenter="onOptionMouseEnter(option, columnIndex)" @mouseleave="onOptionMouseLeave(columnIndex)"
              @click="onOptionClick(option, columnIndex)">
              <slot name="option" :option="option" :columnIndex="columnIndex">
                <span :class="ui.optionLabel()">{{ option[labelKey] }}</span>
                <Icon v-if="!isLeafNode(option, columnIndex)" name="lucide:chevron-right" :class="ui.optionIcon()" />
              </slot>
            </div>
          </div>
        </div>

        <div v-if="props.options.length === 0" :class="ui.empty()">暂无数据</div>
      </div>
    </template>
  </RebornSelectTrigger>

  <slot v-else :isOpen="isOpen" :open="open" :close="close" :clear="clear" />
</template>
