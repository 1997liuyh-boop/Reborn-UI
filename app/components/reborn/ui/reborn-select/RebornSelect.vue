<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { selectColors, selectSizes } from "./reborn-select.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import { splitTriggerUi } from "../reborn-select-trigger/reborn-select-trigger.config";
import RebornFieldTrigger from "../reborn-field-trigger/RebornFieldTrigger.vue";
import type { FieldTriggerProps } from "../reborn-field-trigger/RebornFieldTrigger.vue";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

/**
 * 下拉选择选项定义
 */
export interface SelectOption {
  /** 选项展示文本 */
  label: string;
  /** 选项实际值 */
  value: any;
  /** 是否禁用该选项 */
  disabled?: boolean;
  /** 其他自定义属性 */
  [key: string]: any;
}

/**
 * 下拉选择属性定义
 */
export interface SelectProps {
  /** 选中值 */
  modelValue?: any;
  /** 是否开启多选模式 */
  multiple?: boolean;
  /** 数据源选项 */
  options?: SelectOption[];
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用组件 */
  disabled?: boolean;
  /** 是否显示清空按钮 */
  clearable?: boolean;
  /** 尺寸规格 */
  size?: (typeof selectSizes)[number];
  /** 颜色 */
  color?: (typeof selectColors)[number];
  /** 自定义类名 */
  class?: any;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 展开时箭头是否旋转 */
  arrowAnimation?: boolean;
  /**
   * 关闭下拉的时机（透传给 RebornSelectTrigger）：
   * - 'click'：在触发器外完成一次点击后才收起（默认）
   * - 'mousedown'：在触发器外发生任意按下类鼠标事件立即收起
   */
  closeOn?: SelectTriggerProps["closeOn"];
  /**
   * 浮层是否传送到 body（默认 true）。
   * 关掉后浮层留在触发器内，会随父容器一起滚动、也一起被 overflow 裁剪。
   */
  portal?: SelectTriggerProps["portal"];
  /** 触发器 UI 配置：触发器盒子与浮层的键混写在一起，组件内部自动拆分下发 */
  triggerUi?: SelectTriggerProps["ui"] & FieldTriggerProps["ui"];
  /** 下拉列表内部组件的 UI 微调配置 */
  ui?: Partial<{
    option: ClassValue;
    optionContent: ClassValue;
    optionLabel: ClassValue;
    optionActive: ClassValue;
    optionActiveIcon: ClassValue;
    optionHighlight: ClassValue;
    empty: ClassValue;
    dropdown: ClassValue;
  }>;
}

const props = withDefaults(defineProps<SelectProps>(), {
  modelValue: null,
  multiple: false,
  options: () => [],
  placeholder: "请选择",
  disabled: false,
  clearable: true,
  size: "md",
  color: "primary",
  bordered: true,
  showArrow: true,
  arrowAnimation: true,
  closeOn: "click",
  portal: true,
});

/**
 * 事件发送器
 */
const emit = defineEmits<{
  /** 绑定值更新事件 */
  (e: "update:modelValue", value: any): void;
  /** 选择变动事件 */
  (e: "change", value: any): void;
}>();

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props);

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);

/** 下拉框是否展开 */
const isOpen = ref(false);
/** 当前高亮（焦点）选项的索引 */
const highlightIndex = ref(-1);
/** 选项列表滚动容器 */
const listRef = ref<HTMLElement | null>(null);
/** 展开动画结束后才响应鼠标高亮 */
const dropdownReady = ref(false);

/** 外部传入的 UI 配置：浮层部分给 RebornSelectTrigger，触发器盒子部分给 RebornFieldTrigger */
const splitUi = computed(() => splitTriggerUi(props.triggerUi));
const overlayUi = computed(() => splitUi.value.overlay);
const fieldUi = computed(() => splitUi.value.field);
const uiOverrides = computed(() => props.ui || {});

/**
 * 生成符合 UI 规范的样式映射表
 */
const ui = computed(() => {
  const styles = b({
    size: fieldGroupSize.value || props.size,
    color: props.color,
    open: isOpen.value,
    disabled: isDisabled.value,
    error: isError.value,
  });
  return {
    option: (opts?: { class?: any }) =>
      styles.option({ class: cn(opts?.class, uiOverrides.value.option) }),
    optionContent: (opts?: { class?: any }) =>
      styles.optionContent({ class: cn(opts?.class, uiOverrides.value.optionContent) }),
    optionLabel: (opts?: { class?: any }) =>
      styles.optionLabel({ class: cn(opts?.class, uiOverrides.value.optionLabel) }),
    optionActive: (opts?: { class?: any }) =>
      styles.optionActive({ class: cn(opts?.class, uiOverrides.value.optionActive) }),
    optionActiveIcon: (opts?: { class?: any }) =>
      styles.optionActiveIcon({ class: cn(opts?.class, uiOverrides.value.optionActiveIcon) }),
    optionHighlight: (opts?: { class?: any }) =>
      styles.optionHighlight({ class: cn(opts?.class, uiOverrides.value.optionHighlight) }),
    empty: (opts?: { class?: any }) =>
      styles.empty({ class: cn(opts?.class, uiOverrides.value.empty) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
  };
});

/**
 * 校验某个值是否处于选中状态
 */
const isSelected = (value: any) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value);
  }
  return value === props.modelValue;
};

const showClearButton = computed(() => {
  const isEmpty = props.modelValue === null || props.modelValue === undefined || props.modelValue === "";
  return props.clearable && (props.multiple ? props.modelValue?.length > 0 : !isEmpty);
});


/**
 * 获取当前已选中的选项对象列表
 */
const selectedOptions = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.options.filter((o) => props.modelValue.includes(o.value));
  }
  const opt = props.options.find((o) => o.value === props.modelValue);
  return opt ? [opt] : [];
});

/**
 * 拼装显示在触发器上的标签文本
 */
const displayText = computed(() => selectedOptions.value.map((o) => o.label).join(", ") || "");

/**
 * 获取锚点位置（用于开启下拉时默认定位到已选项）
 */
function getAnchorIndex() {
  if (props.multiple && Array.isArray(props.modelValue) && props.modelValue.length > 0) {
    const anchorValue = props.modelValue[0];
    return props.options.findIndex((o) => o.value === anchorValue);
  }

  if (!props.multiple && props.modelValue !== null) {
    return props.options.findIndex((o) => o.value === props.modelValue);
  }

  return -1;
}

/**
 * 切换下拉列表的展开与收起
 */
function toggle() {
  if (isDisabled.value) return;
  const opening = !isOpen.value;
  dropdownReady.value = false;
  if (opening) highlightIndex.value = getAnchorIndex();
  isOpen.value = opening;
}

/** 展开动画一开始列表就已可见，此后才允许鼠标接管高亮，避免展开瞬间指针位置抢走锚点 */
function onDropdownEnter() {
  dropdownReady.value = true;
}

function onOptionMouseEnter(index: number) {
  if (!dropdownReady.value) return;
  highlightIndex.value = index;
}

function moveHighlight(delta: number) {
  const next = Math.min(
    Math.max(highlightIndex.value + delta, 0),
    props.options.length - 1,
  );
  if (next === highlightIndex.value) return;
  highlightIndex.value = next;
  nextTick(() => scrollToActive(false));
}

/**
 * 执行选择操作
 */
function selectOption(option: SelectOption) {
  if (option.disabled) return;

  if (props.multiple) {
    const newValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = newValue.indexOf(option.value);
    if (index > -1) {
      newValue.splice(index, 1);
    } else {
      newValue.push(option.value);
    }
    emit("update:modelValue", newValue);
    emit("change", newValue);
    validate("change");
  } else {
    emit("update:modelValue", option.value);
    emit("change", option.value);
    validate("change");
    isOpen.value = false;
  }
}

/**
 * 清空所有已选项
 */
function clear(e: Event) {
  e.stopPropagation();
  const newValue = props.multiple ? [] : null;
  emit("update:modelValue", newValue);
  emit("change", newValue);
  validate("change");
}

/**
 * 触发器外部事件（由 RebornSelectTrigger 按 closeOn 时机上报）关闭下拉列表
 */
function onOutsideClose() {
  if (isOpen.value) {
    isOpen.value = false;
    validate("blur");
  }
}

/**
 * 键盘快捷键支持：上下切换选项、确认选择、关闭
 */
function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      moveHighlight(1);
      break;
    case "ArrowUp":
      e.preventDefault();
      moveHighlight(-1);
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      if (highlightIndex.value >= 0 && highlightIndex.value < props.options.length) {
        const opt = props.options[highlightIndex.value];
        if (opt) selectOption(opt);
      }
      break;
    case "Escape":
      e.preventDefault();
      isOpen.value = false;
      break;
  }
}

/**
 * 滚动逻辑：将目标选项滚动至可视区域
 * @param instant 是否立即发生滚动（无平滑动画），常用于开启瞬时的初始定位
 */
function scrollToActive(instant = false) {
  const container = listRef.value;
  if (!container || highlightIndex.value < 0) return;

  const el = container.children[highlightIndex.value] as HTMLElement;
  if (!el) return;

  if (instant) {
    const viewportHeight = container.clientHeight || 240;
    const targetTop = el.offsetTop - viewportHeight / 2 + el.offsetHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - viewportHeight);
    container.scrollTop = Math.min(Math.max(0, targetTop), maxScrollTop);
  } else {
    el.scrollIntoView({ block: "nearest" });
  }
}

</script>

<template>
  <RebornSelectTrigger :class="props.class" :is-open="isOpen" :disabled="isDisabled" :size="fieldGroupSize || size"
    :ui="overlayUi" :scroll-to-active="scrollToActive" :close-on="closeOn" :portal="portal" @keydown="onKeydown"
    @enter="onDropdownEnter" @close="onOutsideClose">
    <template #trigger>
      <RebornFieldTrigger :display-text="displayText" :placeholder="placeholder" :is-open="isOpen"
        :disabled="isDisabled" :size="fieldGroupSize || size" :color="color" :clearable="showClearButton" :ui="fieldUi"
        :bordered="bordered" :show-arrow="showArrow" :arrow-animation="arrowAnimation" :error="isError" @click="toggle"
        @clear="clear">
        <template #cover="{ displayText, placeholder, isOpen, ui: triggerUi }" v-if="$slots.cover">
          <slot name="cover" :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="triggerUi" />
        </template>

        <template #default="{ displayText, placeholder, isOpen, ui: triggerUi }">
          <slot :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="triggerUi">
            <span :class="triggerUi.triggerText()">{{ displayText }}</span>
          </slot>
        </template>
      </RebornFieldTrigger>
    </template>

    <template #content>
      <div ref="listRef" :class="ui.dropdown()">
        <div v-for="(option, index) in options" :key="index" :class="[
          ui.option(),
          isSelected(option.value) ? ui.optionActive() : '',
          highlightIndex === index ? ui.optionHighlight() : '',
        ]" :data-disabled="option.disabled ? 'true' : 'false'" @click="selectOption(option)"
          @mouseenter="onOptionMouseEnter(index)">
          <slot name="option" :option="option" :active="isSelected(option.value)">
            <div :class="ui.optionContent()">
              <span :class="ui.optionLabel()">{{ option.label }}</span>
              <Icon v-if="multiple && isSelected(option.value)" name="lucide:check" :class="ui.optionActiveIcon()" />
            </div>
          </slot>
        </div>

        <div v-if="options.length === 0" :class="ui.empty()">
          暂无数据
        </div>
      </div>
    </template>
  </RebornSelectTrigger>
</template>
