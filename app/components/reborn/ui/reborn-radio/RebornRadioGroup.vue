<script setup lang="ts">
import type { ButtonProps } from "../reborn-button/RebornButton.vue";
import type { RadioAppearance, RadioColor, RadioDirection, RadioFieldNames, RadioOption, RadioSize, RadioType, RadioVariant } from "./reborn-radio.config";
import { useMutationObserver, useResizeObserver } from "@vueuse/core";
import { computed, nextTick, onMounted, provide, shallowRef, toRef, useTemplateRef, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { useLiquidSlider } from "~/composables/useLiquidSlider";
import { tv } from "~/lib/tv";
import theme, { resolveRadioAppearance, resolveRadioVariant } from "./reborn-radio.config";
import { radioGroupContextKey } from "./reborn-radio.context";
import RebornRadio from "./RebornRadio.vue";

const props = withDefaults(defineProps<RadioGroupProps>(), {
  defaultValue: "",
  color: "primary",
  direction: "horizontal",
  disabled: false,
});

const emit = defineEmits<{
  /** 值改变时触发 */
  (e: "change", value: string | number | boolean): void;
}>();

const slots = defineSlots<{
  /** 未传 options 时手写的 RebornRadio 子项 */
  default?: () => any;
  /** 传 options 时透传给每个 RebornRadio 的 radio 插槽，完全接管单选框的渲染 */
  radio?: (props: { checked: boolean; disabled: boolean }) => any;
  /** 传 options 时自定义选项文案，data 为归一化后的选项对象 */
  label?: (props: { data: RadioOption }) => any;
}>();

const b = tv(theme);

export interface RadioGroupProps {
  /** 默认值（非受控状态，未绑定 v-model 时生效） */
  defaultValue?: string | number | boolean;
  /** @deprecated 请改用 variant 设置形态 */
  type?: RadioType;
  /** 语义色，作用于选中态 */
  color?: RadioColor;
  /** 单选形态：radio（默认）/ button / pure-button；旧 filled/outlined 仅保留兼容 */
  variant?: RadioVariant | RadioAppearance;
  /** 选中态填充方式：outlined（默认）/ filled */
  appearance?: RadioAppearance;
  /** 单选框组的尺寸 */
  size?: RadioSize;
  /** 选项列表；传入后组件内部渲染选项，可省略默认插槽。字段名与默认不一致时配合 fieldNames 使用 */
  options?: Array<string | number | RadioOption | Record<string, any>>;
  /** options 对象项的字段别名配置：按这里给出的字段名去数据里取 label / value / disabled */
  fieldNames?: RadioFieldNames;
  /** 单选框组的方向 */
  direction?: RadioDirection;
  /** 是否禁用 */
  disabled?: boolean;
  /** 拼接按钮透传参数；variant/color 同时覆盖选中与未选中两态 */
  buttonProps?: ButtonProps;
  /** 追加到根节点的自定义类名 */
  class?: any;
}

/**
 * 绑定值（v-model）；显式 default: undefined 跳过 Boolean 类型未传时被强转为 false 的规则，保住非受控判断。
 * 未绑定时由 defineModel 自己持有选中值，组件里不再另存一份内部值。
 */
const model = defineModel<string | number | boolean>({ default: undefined });

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props);

/**
 * 当前选中值：绑定值为 undefined（未绑定且尚未选择，或被父级置回 undefined）时回到 defaultValue。
 * 此前受控时也会写一份内部值，父级重置为 undefined 后组件仍显示上一次选中的项。
 */
const currentValue = computed(() => (model.value !== undefined ? model.value : props.defaultValue));

/** 尺寸回退链：FormItem/Form > 自身 props > md */
const computedSize = computed<RadioSize>(() => fieldGroupSize.value || props.size || "md");

const computedDisabled = computed(() => fieldGroupDisabled.value || props.disabled);
const computedVariant = computed(() => resolveRadioVariant(props.variant, props.type));
const computedAppearance = computed(() => resolveRadioAppearance(props.appearance, props.variant) ?? "outlined");

/** 归一化为 RadioOption：简写项以自身作文案与值，对象项按 fieldNames 取字段，原有字段随展开保留 */
const normalizedOptions = computed<RadioOption[]>(() => {
  const label = props.fieldNames?.label ?? "label";
  const value = props.fieldNames?.value ?? "value";
  const disabled = props.fieldNames?.disabled ?? "disabled";
  return (props.options ?? []).map((opt) =>
    typeof opt === "object" && opt !== null
      ? { ...opt, label: opt[label], value: opt[value], disabled: opt[disabled] }
      : { label: String(opt), value: opt },
  );
});

const updateValue = (value: string | number | boolean, _ev: Event) => {
  model.value = value;
  emit("change", value);
  validate("change");
};

// ============ 分段按钮滑块 ============

const groupRef = useTemplateRef<HTMLElement>("groupRef");
const sliderRef = useTemplateRef<HTMLElement>("sliderRef");
const isButton = computed(() => computedVariant.value === "button");
/**
 * 选中底色是否已交给滑块。挂载并量好位置后才置 true：
 * 服务端渲染与首帧仍由选中项自己画底色，滑块就位的同一帧再交接，页面不会先闪一下未选中的样子
 */
const sliderReady = shallowRef(false);
/** 滑块的落位与液体形变交给 useLiquidSlider，与 RebornTabs 胶囊型底板共用一套节奏 */
const { style: sliderStyle, move: moveSlider, hide: hideSlider } = useLiquidSlider(sliderRef);
/** 滑块底色跟随选中项自身的 appearance / color，禁用时一起淡化 */
const sliderTone = shallowRef<{ color?: RadioColor; appearance?: RadioAppearance; disabled: boolean }>({ disabled: false });
/** 上一次量到的选中项；只有它换了才算一次切换 */
let lastChecked: HTMLElement | null = null;

function updateSlider() {
  const group = groupRef.value;
  if (!group || !isButton.value) return;
  const item = group.querySelector<HTMLElement>(".reborn-radio[data-checked=\"true\"]");
  if (!item) {
    lastChecked = null;
    hideSlider();
    return;
  }
  // 只有切换选中项才跑液体形变；首次落位、换行、字体加载等尺寸变化都直接到位（instant），
  // 否则页面一加载滑块就会从组的左上角飘到选中项上。
  // 选中项加粗引起的宽度变化会紧跟着切换再触发一次重量，useLiquidSlider 会把它并进正在进行的形变
  const switching = lastChecked !== null && lastChecked !== item;
  lastChecked = item;
  const groupRect = group.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  sliderTone.value = {
    color: item.dataset.color as RadioColor | undefined,
    appearance: item.dataset.appearance as RadioAppearance | undefined,
    disabled: item.dataset.disabled === "true",
  };
  moveSlider(
    {
      left: rect.left - groupRect.left - group.clientLeft,
      top: rect.top - groupRect.top - group.clientTop,
      width: rect.width,
      height: rect.height,
    },
    { switching, liquid: true, vertical: props.direction === "vertical", instant: true },
  );
  sliderReady.value = true;
}

/** 只有分段按钮才有滑块要量，其他类型不挂观察器，避免每次子树变动都白跑一遍 */
const sliderTarget = () => (isButton.value ? groupRef.value : undefined);

// 选中项切换、选项增删、文案变化都会改动这几个属性或子树，统一在 DOM 更新后重量
useMutationObserver(sliderTarget, updateSlider, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["data-checked", "data-color", "data-appearance", "data-disabled"],
});
useResizeObserver(sliderTarget, updateSlider);
onMounted(updateSlider);

// 在 button 与其他类型间切换时重置，换回 button 再重新落位
watch(isButton, (value) => {
  lastChecked = null;
  sliderReady.value = false;
  hideSlider();
  if (value) nextTick(updateSlider);
});

provide(radioGroupContextKey, {
  modelValue: currentValue,
  disabled: computedDisabled,
  size: computedSize,
  color: toRef(props, "color"),
  variant: computedVariant,
  appearance: computedAppearance,
  buttonProps: toRef(props, "buttonProps"),
  isError,
  sliderReady: computed(() => isButton.value && sliderReady.value),
  updateValue,
});

/** 选项的 key：带类型前缀，避免 1 与 "1"、true 与 "true" 撞成同一个 key */
function optionKeyOf(value: string | number | boolean) {
  return `${typeof value}:${String(value)}`;
}

const groupClass = computed(() =>
  b({
    variant: computedVariant.value,
    direction: props.direction,
    size: computedSize.value,
  }).group({ class: props.class }),
);

const sliderClass = computed(() =>
  b({
    variant: "button",
    color: sliderTone.value.color ?? props.color,
    appearance: sliderTone.value.appearance ?? computedAppearance.value,
    disabled: sliderTone.value.disabled,
  }).slider(),
);
</script>

<template>
  <div
    ref="groupRef"
    :class="groupClass"
    role="radiogroup"
  >
    <!-- 分段按钮的选中滑块：放在最前，配合 z-0 / z-[1] 垫在所有选项下面 -->
    <span
      v-if="isButton"
      ref="sliderRef"
      aria-hidden="true"
      :class="sliderClass"
      :style="sliderStyle"
    />
    <template v-if="normalizedOptions.length">
      <RebornRadio
        v-for="opt in normalizedOptions"
        :key="optionKeyOf(opt.value)"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        <!-- radio 插槽透传：自定义每个单选框的整体渲染 -->
        <template
          v-if="slots.radio"
          #radio="scope"
        >
          <slot
            name="radio"
            v-bind="scope"
          />
        </template>
        <!-- label 插槽：自定义选项文案，作用域参数为选项对象 -->
        <slot
          name="label"
          :data="opt"
        >
          {{ opt.label }}
        </slot>
      </RebornRadio>
    </template>
    <slot v-else />
  </div>
</template>
