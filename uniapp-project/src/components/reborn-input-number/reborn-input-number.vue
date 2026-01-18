<template>
  <view :class="rootClass" :style="{ height: parseRpx(size) }">
    <view
      :class="minusClass"
      :style="{ height: parseRpx(size), width: parseRpx(size) }"
      @touchstart="onMinus"
      @touchend="stopLongPress"
      @touchcancel="stopLongPress"
    >
      <text :class="opTextClass">-</text>
    </view>

    <view :class="valueClass">
      <input
        :class="inputClass"
        :type="inputType"
        :disabled="isDisabled"
        :readonly="inputable === false"
        :placeholder="placeholder"
        :value="`${value}`"
        @blur="onBlur"
      />
    </view>

    <view
      :class="plusClass"
      :style="{ height: parseRpx(size), width: parseRpx(size) }"
      @touchstart="onPlus"
      @touchend="stopLongPress"
      @touchcancel="stopLongPress"
    >
      <text :class="opTextClass">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type PropType } from "vue";
import { parseClass, parsePt, type ClassValue } from "@/utils/tailwind";

type PassThrough = {
  className?: ClassValue;
  op?: { className?: ClassValue; plus?: { className?: ClassValue }; minus?: { className?: ClassValue } };
  value?: { className?: ClassValue };
  input?: { className?: ClassValue };
  text?: { className?: ClassValue };
};

defineOptions({
  name: "reborn-input-number",
});

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  pt: {
    type: Object as PropType<PassThrough>,
    default: () => ({}),
  },
  placeholder: {
    type: String,
    default: "",
  },
  step: {
    type: Number,
    default: 1,
  },
  max: {
    type: Number,
    default: 100,
  },
  min: {
    type: Number,
    default: 0,
  },
  inputType: {
    type: String as PropType<"digit" | "number">,
    default: "number",
  },
  inputable: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  size: {
    type: [Number, String] as PropType<number | string>,
    default: 50,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const pt = computed(() => parsePt<PassThrough>(props.pt));
const value = ref(props.modelValue);
const isDisabled = computed(() => props.disabled);

const isPlus = computed(() => !isDisabled.value && value.value < props.max);
const isMinus = computed(() => !isDisabled.value && value.value > props.min);

let longPressTimer: ReturnType<typeof setInterval> | null = null;

const parseRpx = (val: number | string) => (typeof val === "number" ? `${val}rpx` : val);

const rootClass = computed(() =>
  parseClass("flex items-center", isDisabled.value && "opacity-50", pt.value.className),
);

const opBaseClass = "flex items-center justify-center rounded-[12rpx] bg-[var(--color-gray-2)] text-[var(--color-gray-8)]";

const minusClass = computed(() =>
  parseClass(
    opBaseClass,
    !isMinus.value && "opacity-50",
    pt.value.op?.className,
    pt.value.op?.minus?.className,
  ),
);

const plusClass = computed(() =>
  parseClass(
    opBaseClass,
    "bg-[var(--color-primary)] text-white",
    !isPlus.value && "opacity-50",
    pt.value.op?.className,
    pt.value.op?.plus?.className,
  ),
);

const opTextClass = computed(() => parseClass("text-[28rpx]", pt.value.text?.className));

const valueClass = computed(() =>
  parseClass("flex items-center justify-center h-full mx-[16rpx]", pt.value.value?.className),
);

const inputClass = computed(() =>
  parseClass(
    "w-[160rpx] text-center text-[28rpx] text-[var(--color-gray-8)] h-full",
    pt.value.input?.className,
  ),
);

function update() {
  nextTick(() => {
    let nextValue = value.value;

    if (nextValue < props.min) {
      nextValue = props.min;
    }

    if (nextValue > props.max) {
      nextValue = props.max;
    }

    if (props.min > props.max) {
      nextValue = props.max;
    }

    if (props.inputType === "digit") {
      nextValue = parseFloat(nextValue.toFixed(2));
    }

    value.value = nextValue;

    if (nextValue !== props.modelValue) {
      emit("update:modelValue", nextValue);
      emit("change", nextValue);
    }
  });
}

function startLongPress(callback: () => void) {
  stopLongPress();
  callback();
  longPressTimer = setInterval(callback, 200);
}

function stopLongPress() {
  if (longPressTimer) {
    clearInterval(longPressTimer);
    longPressTimer = null;
  }
}

function onPlus() {
  if (isDisabled.value || !isPlus.value) return;
  startLongPress(() => {
    if (!isPlus.value) return;
    const delta = props.max - value.value;
    value.value += delta > props.step ? props.step : delta;
    update();
  });
}

function onMinus() {
  if (isDisabled.value || !isMinus.value) return;
  startLongPress(() => {
    if (!isMinus.value) return;
    const delta = value.value - props.min;
    value.value -= delta > props.step ? props.step : delta;
    update();
  });
}

function onBlur(e: UniInputBlurEvent) {
  if (e.detail.value === "") {
    value.value = 0;
  } else {
    value.value = parseFloat(e.detail.value);
  }
  update();
}

watch(
  () => props.modelValue,
  (val: number) => {
    value.value = val;
    update();
  },
  { immediate: true },
);

watch(
  () => props.max,
  () => {
    update();
  },
);

watch(
  () => props.min,
  () => {
    update();
  },
);
</script>
