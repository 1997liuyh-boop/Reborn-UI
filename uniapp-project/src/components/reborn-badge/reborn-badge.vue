<template>
  <view v-if="!isHidden" :class="rootClass">
    <view v-if="hasIconSlot" :class="iconWrapperClass">
      <slot name="icon"></slot>
    </view>
    <text v-else-if="icon" :class="iconClass">{{ icon }}</text>

    <text :class="textClass">
      <slot></slot>
    </text>

    <text v-if="closable" :class="closeClass" @tap.stop="close">×</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, type PropType } from "vue";
import { parseClass, parsePt, type ClassValue } from "@/utils/tailwind";

type PassThrough = {
  className?: ClassValue;
  iconWrapper?: { className?: ClassValue };
  icon?: { className?: ClassValue };
  text?: { className?: ClassValue };
  close?: { className?: ClassValue };
};

defineOptions({
  name: "reborn-badge",
});

const props = defineProps({
  pt: {
    type: Object as PropType<PassThrough>,
    default: () => ({}),
  },
  type: {
    type: String as PropType<"primary" | "success" | "warn" | "error" | "info" | "neutral">,
    default: "primary",
  },
  icon: {
    type: String,
    default: "",
  },
  rounded: {
    type: Boolean,
    default: false,
  },
  closable: {
    type: Boolean,
    default: false,
  },
  plain: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const isHidden = ref(false);
const slots = useSlots();
const pt = computed(() => parsePt<PassThrough>(props.pt));
const hasIconSlot = computed(() => Boolean(slots.icon));

const typeClass = computed(() => {
  switch (props.type) {
    case "success":
      return props.plain
        ? "text-[var(--color-success)] border-current"
        : "bg-[var(--color-success)]";
    case "warn":
      return props.plain
        ? "text-[var(--color-warning)] border-current"
        : "bg-[var(--color-warning)]";
    case "error":
      return props.plain
        ? "text-[var(--color-error)] border-current"
        : "bg-[var(--color-error)]";
    case "info":
      return props.plain
        ? "text-[var(--color-info)] border-current"
        : "bg-[var(--color-info)]";
    case "neutral":
      return props.plain
        ? "text-[var(--color-neutral)] border-current"
        : "bg-[var(--color-neutral)]";
    default:
      return props.plain
        ? "text-[var(--color-primary)] border-current"
        : "bg-[var(--color-primary)]";
  }
});

const rootClass = computed(() =>
  parseClass(
    "inline-flex items-center gap-[8rpx] px-[20rpx] py-[8rpx] rounded-[12rpx] text-[24rpx] leading-[1.2] text-white border-[2rpx] border-transparent",
    props.rounded && "rounded-full",
    props.plain && "bg-transparent",
    typeClass.value,
    pt.value.className,
  ),
);

const iconWrapperClass = computed(() =>
  parseClass("flex items-center", pt.value.iconWrapper?.className),
);

const iconClass = computed(() => parseClass("text-[22rpx]", pt.value.icon?.className));

const textClass = computed(() =>
  parseClass("font-medium", pt.value.text?.className),
);

const closeClass = computed(() =>
  parseClass("text-[24rpx] leading-none", pt.value.close?.className),
);

function close() {
  isHidden.value = true;
  emit("close");
}
</script>
