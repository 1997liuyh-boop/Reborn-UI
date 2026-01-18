<template>
  <view :class="rootClass" @tap="onTap">
    <view :class="trackClass" :style="{ height: rect.height, width: rect.width }">
      <view
        :class="thumbClass"
        :style="{
          height: rect.size,
          width: rect.size,
          left: rect.left,
          transform: `translateX(${isChecked ? rect.translateX : 0})`,
        }"
      >
        <view v-if="loading" :class="spinnerClass"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from "vue";
import { parseClass, parsePt, type ClassValue } from "@/utils/tailwind";

type PassThrough = {
  className?: ClassValue;
  track?: { className?: ClassValue };
  thumb?: { className?: ClassValue };
  spinner?: { className?: ClassValue };
};

defineOptions({
  name: "reborn-switch",
});

const props = defineProps({
  pt: {
    type: Object as PropType<PassThrough>,
    default: () => ({}),
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  height: {
    type: Number,
    default: 48,
  },
  width: {
    type: Number,
    default: 80,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const pt = computed(() => parsePt<PassThrough>(props.pt));
const value = ref(props.modelValue);
const isDisabled = computed(() => props.disabled);
const isChecked = computed(() => value.value);

const rect = computed(() => {
  const height = props.height;
  const width = props.width;
  const size = height - 8;
  const left = 4;
  const translateX = width - height;

  return {
    height: `${height}rpx`,
    width: `${width}rpx`,
    size: `${size}rpx`,
    left: `${left}rpx`,
    translateX: `${translateX}rpx`,
  };
});

const rootClass = computed(() =>
  parseClass("inline-flex items-center transition-opacity duration-200", isDisabled.value && "opacity-50", pt.value.className),
);

const trackClass = computed(() =>
  parseClass(
    "relative rounded-full bg-[var(--color-gray-3)] transition-colors duration-200",
    isChecked.value && "bg-[var(--color-primary)]",
    pt.value.track?.className,
  ),
);

const thumbClass = computed(() =>
  parseClass(
    "absolute top-[4rpx] rounded-full bg-white flex items-center justify-center transition-transform duration-300",
    pt.value.thumb?.className,
  ),
);

const spinnerClass = computed(() =>
  parseClass(
    "h-[22rpx] w-[22rpx] rounded-full border-[3rpx] border-solid border-black/15 border-t-black/45 animate-spin",
    pt.value.spinner?.className,
  ),
);

function onTap() {
  if (!isDisabled.value && !props.loading) {
    const nextValue = !value.value;
    value.value = nextValue;
    emit("update:modelValue", nextValue);
    emit("change", nextValue);
  }
}

watch(
  () => props.modelValue,
  (val: boolean) => {
    value.value = val;
  },
);
</script>
