<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { ButtonProps } from "../reborn-button/RebornButton.vue";
import type { RadioAppearance, RadioColor, RadioType, RadioVariant } from "./reborn-radio.config";
import { computed, inject } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornButton from "../reborn-button/RebornButton.vue";
import theme, { resolveRadioAppearance, resolveRadioVariant } from "./reborn-radio.config";
import { radioGroupContextKey } from "./reborn-radio.context";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<RadioProps>(), {
  value: true,
  disabled: false,
});

const emit = defineEmits<{
  /** 值改变时触发 */
  (e: "change", value: string | number | boolean, ev: Event): void;
}>();

const slots = defineSlots<{
  /** 完全接管单选框的渲染 */
  radio?: (props: { checked: boolean; disabled: boolean }) => any;
  /** 选项文案 */
  default?: () => any;
}>();

const b = tv(theme);

export interface RadioProps {
  /** 选项的 value，与绑定值严格相等时呈选中态 */
  value?: string | number | boolean;
  /** @deprecated 请改用 variant 设置形态 */
  type?: RadioType;
  /** 语义色；不传时取 Group 下发值，默认 primary */
  color?: RadioColor;
  /** 单选形态：radio / button / pure-button；组内以 Group 为准，旧 filled/outlined 仅保留兼容 */
  variant?: RadioVariant | RadioAppearance;
  /** 选中态填充方式：outlined（默认）/ filled */
  appearance?: RadioAppearance;
  /** 是否禁用 */
  disabled?: boolean;
  /** 拼接按钮透传参数；variant/color 同时覆盖选中与未选中两态 */
  buttonProps?: ButtonProps;
  /** 追加到根节点的自定义类名 */
  class?: any;
  /** 覆盖内部各区域样式类：root 根节点、icon 圆形图标外圈、dot 实心圆点、label 标签 */
  ui?: Partial<{
    root: ClassValue;
    icon: ClassValue;
    dot: ClassValue;
    label: ClassValue;
  }>;
}

/** 绑定值（v-model）；显式 default: undefined 跳过 Boolean 类型未传时被强转为 false 的规则 */
const model = defineModel<string | number | boolean>({ default: undefined });

const radioGroup = inject(radioGroupContextKey, null);

/** 选中态：组内取 Group 绑定值，独立使用取自身 v-model */
const isChecked = computed(() => {
  if (radioGroup) return radioGroup.modelValue.value === props.value;
  return model.value === props.value;
});

const computedDisabled = computed(() => (radioGroup ? radioGroup.disabled.value || props.disabled : props.disabled));
const computedVariant = computed<RadioVariant>(() => radioGroup?.variant.value ?? resolveRadioVariant(props.variant, props.type));
const computedSize = computed(() => radioGroup?.size?.value ?? "md");
/** 语义色：自身 props 优先，便于组内做单项覆盖 */
const computedColor = computed<RadioColor>(() => props.color ?? radioGroup?.color?.value ?? "primary");
/** 填充方式允许单项覆盖，旧 variant="filled/outlined" 也参与回退 */
const computedAppearance = computed<RadioAppearance>(() => resolveRadioAppearance(props.appearance, props.variant) ?? radioGroup?.appearance.value ?? "outlined");
const isPureButton = computed(() => computedVariant.value === "pure-button");
const isError = computed(() => (radioGroup ? !!radioGroup.isError?.value : false));

/** 拼接按钮合并 Group 下发与自身的透传参数（自身优先） */
const mergedButtonProps = computed<ButtonProps>(() => ({
  ...(radioGroup?.buttonProps?.value ?? {}),
  ...(props.buttonProps ?? {}),
}));

/**
 * 拼接按钮未选中态使用灰色描边，禁用时使用灰底灰字；
 * 选中态由 appearance 与 color 决定。
 */
const pureButtonClass = computed(() => {
  if (isChecked.value) return "";
  // RebornButton 以 ui.base({ class }) 合并外部类名，tailwind-merge 会让这里的 bg-gray-2 压过变体底色，无需 ! 提权
  if (computedDisabled.value) return "border-gray-4 bg-gray-2 text-gray-5";
  return "border-gray-4 text-gray-9";
});

/** 按钮透传优先，其次根据选中态与填充方式决定外观 */
const buttonVariant = computed(() => mergedButtonProps.value.variant ?? (isChecked.value ? computedAppearance.value : "outlined"));

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    variant: computedVariant.value,
    size: computedSize.value,
    color: computedColor.value,
    appearance: computedAppearance.value,
    checked: isChecked.value,
    disabled: computedDisabled.value,
    error: isError.value,
    slider: !!radioGroup?.sliderReady?.value,
  });
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    dot: (opts?: { class?: any }) => styles.dot({ class: cn(opts?.class, uiOverrides.value.dot) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  };
});

/** 点击已选中项不再触发（单选框不能取消选中） */
function onTap(ev: Event) {
  if (computedDisabled.value || isChecked.value) return;
  if (radioGroup) {
    radioGroup.updateValue(props.value, ev);
  } else {
    model.value = props.value;
  }
  emit("change", props.value, ev);
}
</script>

<template>
  <div
    v-bind="$attrs"
    :class="ui.root({ class: props.class })"
    role="radio"
    :aria-checked="isChecked"
    :data-checked="isChecked"
    :data-disabled="computedDisabled"
    :data-color="computedColor"
    :data-variant="computedVariant"
    :data-appearance="computedAppearance"
    @click="onTap"
  >
    <!-- radio 插槽：完全接管单选框的渲染 -->
    <slot
      name="radio"
      :checked="isChecked"
      :disabled="computedDisabled"
    >
      <!-- 拼接按钮复用 RebornButton，选中态随 appearance 与 color 变化 -->
      <RebornButton
        v-if="isPureButton"
        v-bind="mergedButtonProps"
        :size="computedSize"
        :color="isChecked ? (mergedButtonProps.color ?? computedColor) : (mergedButtonProps.color ?? 'neutral')"
        :variant="buttonVariant"
        :disabled="computedDisabled || mergedButtonProps.disabled"
        :class="pureButtonClass"
      >
        <slot />
      </RebornButton>
      <template v-else>
        <span :class="ui.icon()">
          <span :class="ui.dot()" />
        </span>
        <span
          v-if="slots.default"
          :class="ui.label()"
        >
          <slot />
        </span>
      </template>
    </slot>
  </div>
</template>
