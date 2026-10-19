<script setup lang="ts">
import type { segmentedDirections, segmentedSizes, SegmentedUI } from "./reborn-segmented.config";
import { useMutationObserver, useResizeObserver } from "@vueuse/core";
import { computed, nextTick, onMounted, ref, useId, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { useLiquidSlider } from "~/composables/useLiquidSlider";
import { cn } from "~/lib/utils";
import { segmentedTheme } from "./reborn-segmented.config";

/** 选项的值类型 */
export type SegmentedValue = string | number | boolean;

/** 对象形式的选项；icon 是 Iconify 图标名，显示在文字前面 */
export interface SegmentedOption {
  value?: SegmentedValue;
  label?: string | number;
  disabled?: boolean;
  icon?: string;
  [key: string]: any;
}

/** options 的字段映射：后端数据字段名不叫 value / label / disabled 时用它对齐 */
export interface SegmentedOptionProps {
  value?: string;
  label?: string;
  disabled?: string;
}

export interface SegmentedProps {
  /**
   * 选项数据：可以是字符串 / 数字 / 布尔的简写（自身同时作为文案与值），也可以是对象
   * @defaultValue []
   */
  options?: Array<SegmentedValue | SegmentedOption>;
  /**
   * 对象选项的字段映射
   * @defaultValue { value: 'value', label: 'label', disabled: 'disabled' }
   */
  props?: SegmentedOptionProps;
  /** 尺寸；处于表单内时被表单的尺寸覆盖，都没有时为 md */
  size?: (typeof segmentedSizes)[number];
  /**
   * 是否撑满父元素宽度：横排时各选项等分宽度，竖排时选项撑满容器宽度
   * @defaultValue false
   */
  block?: boolean;
  /**
   * 是否禁用全部选项
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * 选中值变化时是否触发所在表单项的校验
   * @defaultValue true
   */
  validateEvent?: boolean;
  /** 原生 radio 的 name；不传时自动生成，保证同一组内方向键切换 */
  name?: string;
  /** 根容器的原生 id */
  id?: string;
  /** 根容器的 aria-label，读屏软件据此念出这组选项的用途 */
  ariaLabel?: string;
  /**
   * 排列方向
   * @defaultValue 'horizontal'
   */
  direction?: (typeof segmentedDirections)[number];
  /** 追加到根容器的类名 */
  class?: any;
  /** 按结构键覆盖各节点样式 */
  ui?: SegmentedUI;
}

defineOptions({
  name: "RebornSegmented",
});

const props = withDefaults(defineProps<SegmentedProps>(), {
  options: () => [],
  props: () => ({}),
  block: false,
  disabled: false,
  validateEvent: true,
  direction: "horizontal",
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 选中值变化时触发，参数为新的选中值 */
  change: [value: SegmentedValue];
}>();

/** 绑定值；显式 default: undefined，否则类型含 boolean 时未绑定会被强转成 false，误选中值为 false 的选项 */
const model = defineModel<SegmentedValue>({ default: undefined });

const { size: formSize, disabled: formDisabled, validate } = useFormInject(props);

const computedSize = computed(() => (formSize.value || props.size || "md") as (typeof segmentedSizes)[number]);
const computedDisabled = computed(() => formDisabled.value === true || props.disabled);

/** 同一组 radio 共享的 name：方向键在同名 radio 之间移动选中 */
const autoName = `reborn-segmented-${useId()}`;
const groupName = computed(() => props.name || autoName);

// ─── 选项 ───────────────────────────────────────────────────────

/** 归一化后的选项：source 保留原始数据，供默认插槽的 item 使用 */
interface NormalizedOption {
  value: SegmentedValue;
  label: string | number;
  disabled: boolean;
  icon?: string;
  source: SegmentedValue | SegmentedOption;
}

const normalizedOptions = computed<NormalizedOption[]>(() => {
  const keys = { value: "value", label: "label", disabled: "disabled", ...props.props };
  return props.options.map((option) => {
    if (typeof option !== "object" || option === null)
      return { value: option, label: String(option), disabled: false, source: option };
    const value = option[keys.value] as SegmentedValue;
    return {
      value,
      label: option[keys.label] ?? String(value),
      disabled: Boolean(option[keys.disabled]),
      icon: option.icon,
      source: option,
    };
  });
});

const isChecked = (option: NormalizedOption) => option.value === model.value;
const isOptionDisabled = (option: NormalizedOption) => computedDisabled.value || option.disabled;

function handleSelect(option: NormalizedOption) {
  if (isOptionDisabled(option) || isChecked(option))
    return;
  // 受控绑定下 model 要等父组件回写才更新，事件载荷用本地的新值
  const next = option.value;
  model.value = next;
  emit("change", next);
  if (props.validateEvent)
    validate("change");
}

// ─── 选中块 ─────────────────────────────────────────────────────

const rootRef = ref<HTMLElement>();
/**
 * 选中底色是否已交给选中块。挂载并量好位置后才置 true：
 * 服务端渲染与首帧由选中项自己画底色，选中块就位的同一帧再交接，页面不会先闪一下没有选中的样子
 */
const sliderReady = ref(false);
/** 落位与液体形变交给 useLiquidSlider，与 RebornRadioGroup 的分段按钮、RebornTabs 的胶囊底板同一套节奏 */
const { style: sliderStyle, move: moveSlider, hide: hideSlider } = useLiquidSlider();
/** 上一次量到的选中项；只有它换了才算一次切换 */
let lastChecked: HTMLElement | null = null;

function updateSlider() {
  const root = rootRef.value;
  if (!root)
    return;
  const item = root.querySelector<HTMLElement>("[data-checked=\"true\"]");
  if (!item) {
    lastChecked = null;
    sliderReady.value = false;
    hideSlider();
    return;
  }
  // 只有切换选中项才跑液体形变；首次落位、尺寸变化（撑满宽度、字体加载）都直接到位
  const switching = lastChecked !== null && lastChecked !== item;
  lastChecked = item;
  const rootRect = root.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  moveSlider(
    {
      left: rect.left - rootRect.left - root.clientLeft,
      top: rect.top - rootRect.top - root.clientTop,
      width: rect.width,
      height: rect.height,
    },
    { switching, liquid: true, vertical: props.direction === "vertical", instant: true },
  );
  sliderReady.value = true;
}

// 选中项切换、选项增删、文案变化都会改动这些属性或子树，统一在 DOM 更新后重量
useMutationObserver(rootRef, updateSlider, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["data-checked"],
});
useResizeObserver(rootRef, updateSlider);
onMounted(updateSlider);

// 换方向、换尺寸后重新落位，不跑形变
watch([() => props.direction, computedSize, () => props.block], () => {
  lastChecked = null;
  nextTick(updateSlider);
});

// ─── 样式 ───────────────────────────────────────────────────────

const ui = computed(() => {
  const base = {
    size: computedSize.value,
    direction: props.direction,
    block: props.block,
    sliderReady: sliderReady.value,
  };
  const o = props.ui;
  return {
    root: () => segmentedTheme(base).root({ class: cn(o.root, props.class) }),
    slider: () => segmentedTheme(base).slider({ class: o.slider }),
    // 选中块就位前由选中项自己画底色，ui.slider 也一并挂上，否则覆盖了选中块颜色时首屏会先闪一下默认的白底
    item: (option: NormalizedOption) =>
      segmentedTheme({ ...base, checked: isChecked(option), disabled: isOptionDisabled(option) }).item({
        class: cn(isChecked(option) && !sliderReady.value && o.slider, o.item),
      }),
    input: () => segmentedTheme(base).input(),
    icon: () => segmentedTheme(base).icon({ class: o.icon }),
    label: () => segmentedTheme(base).label({ class: o.label }),
  };
});
</script>

<template>
  <div
    :id="id" ref="rootRef" :class="ui.root()" role="radiogroup" :aria-label="ariaLabel"
    :aria-disabled="computedDisabled || undefined" :aria-orientation="direction"
  >
    <span aria-hidden="true" :class="ui.slider()" :style="sliderStyle" />

    <label
      v-for="(option, index) in normalizedOptions" :key="`${index}-${String(option.value)}`" :class="ui.item(option)"
      :data-checked="isChecked(option)" :data-disabled="isOptionDisabled(option)"
    >
      <input
        type="radio" :class="ui.input()" :name="groupName" :value="String(option.value)" :checked="isChecked(option)"
        :disabled="isOptionDisabled(option)" @change="handleSelect(option)"
      >
      <slot :item="option.source" :checked="isChecked(option)" :disabled="isOptionDisabled(option)">
        <Icon v-if="option.icon" :name="option.icon" :class="ui.icon()" />
        <span :class="ui.label()">{{ option.label }}</span>
      </slot>
    </label>
  </div>
</template>
