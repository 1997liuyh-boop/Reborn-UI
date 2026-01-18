<template>
  <view :class="rootClass">
    <view v-if="$slots.prepend" :class="prependClass">
      <slot name="prepend"></slot>
    </view>

    <view v-if="prefixIcon" :class="iconClass">
      <text :class="iconTextClass">{{ prefixIcon }}</text>
    </view>

    <!-- @vue-ignore -->
    <input
      :class="innerClass"
      :style="inputStyle"
      :value="value"
      :disabled="readonly ?? isDisabled"
      :type="type"
      :password="isPassword"
      :focus="isFocusing"
      :placeholder="placeholder"
      :placeholder-class="placeholderClass"
      :placeholder-style="placeholderStyle"
      :maxlength="maxlength"
      :cursor-spacing="cursorSpacing"
      :confirm-type="confirmType"
      :confirm-hold="confirmHold"
      :adjust-position="adjustPosition"
      :hold-keyboard="holdKeyboard"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @confirm="onConfirm"
      @keyboardheightchange="onKeyboardheightchange"
    />

    <view v-if="suffixIcon" :class="iconClass">
      <text :class="iconTextClass">{{ suffixIcon }}</text>
    </view>

    <view v-if="showClear" :class="iconClass" @tap="clear">
      <text :class="iconTextClass">×</text>
    </view>

    <view v-if="password" :class="iconClass" @tap="togglePassword">
      <text :class="iconTextClass">{{ isPassword ? '👁' : '🙈' }}</text>
    </view>

    <view v-if="$slots.append" :class="appendClass">
      <slot name="append"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type PropType } from "vue";
import { parseClass, parsePt, type ClassValue } from "@/utils/tailwind";

type PassThrough = {
  className?: ClassValue;
  inner?: { className?: ClassValue };
  icon?: { className?: ClassValue };
  iconText?: { className?: ClassValue };
  prepend?: { className?: ClassValue };
  append?: { className?: ClassValue };
};

defineOptions({
  name: "reborn-input",
});

const props = defineProps({
  pt: {
    type: Object as PropType<PassThrough>,
    default: () => ({}),
  },
  modelValue: {
    type: String,
    default: "",
  },
  type: {
    type: String as PropType<
      "text" | "number" | "idcard" | "digit" | "tel" | "safe-password" | "nickname"
    >,
    default: "text",
  },
  prefixIcon: {
    type: String,
    default: "",
  },
  suffixIcon: {
    type: String,
    default: "",
  },
  password: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: null,
  },
  placeholder: {
    type: String,
    default: "请输入",
  },
  placeholderClass: {
    type: String,
    default: "text-[var(--color-gray-5)]",
  },
  placeholderStyle: {
    type: String,
    default: "",
  },
  border: {
    type: Boolean,
    default: true,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  cursorSpacing: {
    type: Number,
    default: 5,
  },
  confirmHold: {
    type: Boolean,
    default: false,
  },
  confirmType: {
    type: String as PropType<"done" | "go" | "next" | "search" | "send">,
    default: "done",
  },
  adjustPosition: {
    type: Boolean,
    default: true,
  },
  maxlength: {
    type: Number,
    default: 140,
  },
  holdKeyboard: {
    type: Boolean,
    default: false,
  },
  precision: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "input",
  "change",
  "focus",
  "blur",
  "confirm",
  "clear",
  "keyboardheightchange",
]);

const pt = computed(() => parsePt<PassThrough>(props.pt));
const isDisabled = computed(() => props.disabled);
const isError = computed(() => props.error);

const inputStyle = computed(() => {
  const style: Record<string, string> = {};
  return style;
});

const value = ref("" as string);
const isFocus = ref(props.autofocus);
const isFocusing = ref(props.autofocus);
const showClear = computed(() => props.clearable && value.value !== "");
const isPassword = ref(props.password);

const isExceed = computed(() => {
  if (props.type === "digit" && props.precision >= 0 && value.value !== "") {
    const parts = value.value.split(".");
    return parts.length > 1 && parts[1].length > props.precision;
  }
  return false;
});

const rootClass = computed(() =>
  parseClass(
    "flex items-center bg-white rounded-[16rpx] h-[72rpx] px-[24rpx] transition-[border-color,background-color] duration-200",
    props.border && "border-[2rpx] border-solid border-[var(--color-gray-3)]",
    isFocus.value && props.border && "border-[var(--color-primary)]",
    isDisabled.value && "bg-[var(--color-gray-2)] opacity-70",
    isError.value && "border-[var(--color-error)]",
    pt.value.className,
  ),
);

const innerClass = computed(() =>
  parseClass(
    "flex-1 h-full text-[28rpx] text-[var(--color-gray-8)]",
    isDisabled.value && "opacity-70",
    isExceed.value && "text-[var(--color-error)]",
    pt.value.inner?.className,
  ),
);

const iconClass = computed(() =>
  parseClass("flex items-center justify-center h-full pl-[16rpx]", pt.value.icon?.className),
);

const iconTextClass = computed(() =>
  parseClass("text-[26rpx] text-[var(--color-gray-6)]", pt.value.iconText?.className),
);

const prependClass = computed(() => parseClass("mr-[12rpx]", pt.value.prepend?.className));

const appendClass = computed(() => parseClass("ml-[12rpx]", pt.value.append?.className));

function togglePassword() {
  isPassword.value = !isPassword.value;
}

function onFocus(e: UniInputFocusEvent) {
  isFocus.value = true;
  emit("focus", e);
}

function onBlur(e: UniInputBlurEvent) {
  emit("blur", e);

  if (props.type === "digit" && props.precision > 0 && value.value !== "") {
    const numValue = parseFloat(value.value);
    if (!Number.isNaN(numValue)) {
      const formattedValue = numValue.toFixed(props.precision);
      value.value = formattedValue;
      emit("update:modelValue", formattedValue);
      emit("change", formattedValue);
    }
  }

  setTimeout(() => {
    isFocus.value = false;
  }, 0);
}

function onInput(e: UniInputEvent) {
  const nextValue = e.detail.value;
  const currentValue = value.value;

  value.value = nextValue;

  emit("update:modelValue", nextValue);
  emit("input", e);

  if (nextValue !== currentValue) {
    emit("change", nextValue);
  }
}

function onConfirm(e: UniInputConfirmEvent) {
  emit("confirm", e);
}

function onKeyboardheightchange(e: UniInputKeyboardHeightChangeEvent) {
  emit("keyboardheightchange", e);
}

function focus() {
  setTimeout(() => {
    isFocusing.value = false;

    nextTick(() => {
      isFocusing.value = true;
    });
  }, 0);
}

function clear() {
  value.value = "";

  emit("update:modelValue", "");
  emit("change", "");
  emit("clear");

  // #ifdef H5
  focus();
  // #endif
}

watch(
  () => props.modelValue,
  (val: string) => {
    value.value = val;
  },
  {
    immediate: true,
  },
);

defineExpose({
  isFocus,
  focus,
  clear,
});
</script>
