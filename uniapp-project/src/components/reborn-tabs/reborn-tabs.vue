<template>
  <view :class="rootClass" :style="{ height: parseRpx(height) }">
    <scroll-view
      :class="scrollClass"
      scroll-with-animation
      scroll-x
      :scroll-into-view="activeId"
      :show-scrollbar="false"
    >
      <view :class="innerClass">
        <view
          v-for="(item, index) in list"
          :key="item.value ?? index"
          :id="`rb-tab-${index}`"
          :class="itemClass(item)"
          :style="{ padding: `0 ${parseRpx(gutter)}` }"
          @tap="change(index)"
        >
          <slot name="item" :item="item" :active="item.isActive">
            <text :class="textClass(item)" :style="getTextStyle(item)">
              {{ item.label }}
            </text>
          </slot>
          <view v-if="showLine && item.isActive" :class="lineClass"></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from "vue";
import { parseClass, parsePt, type ClassValue } from "@/utils/tailwind";

type TabsItem = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

type RenderItem = TabsItem & {
  isActive: boolean;
  disabled: boolean;
};

type PassThrough = {
  className?: ClassValue;
  scroll?: { className?: ClassValue };
  inner?: { className?: ClassValue };
  item?: { className?: ClassValue };
  text?: { className?: ClassValue };
  line?: { className?: ClassValue };
};

const props = defineProps({
  pt: {
    type: Object as PropType<PassThrough>,
    default: () => ({}),
  },
  modelValue: {
    type: [String, Number] as PropType<string | number>,
    default: "",
  },
  height: {
    type: [String, Number] as PropType<string | number>,
    default: 80,
  },
  list: {
    type: Array as PropType<TabsItem[]>,
    default: () => [],
  },
  fill: {
    type: Boolean,
    default: false,
  },
  gutter: {
    type: Number,
    default: 30,
  },
  color: {
    type: String,
    default: "",
  },
  unColor: {
    type: String,
    default: "",
  },
  showLine: {
    type: Boolean,
    default: true,
  },
  showSlider: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const pt = computed(() => parsePt<PassThrough>(props.pt));
const active = ref(props.modelValue);

const list = computed<RenderItem[]>(() =>
  props.list.map((item) => ({
    ...item,
    disabled: item.disabled ?? false,
    isActive: item.value === active.value,
  })),
);

const parseRpx = (val: number | string) => (typeof val === "number" ? `${val}rpx` : val);

const activeId = computed(() => {
  const index = list.value.findIndex((item) => item.isActive);
  if (index === -1) return "";
  return `rb-tab-${index}`;
});

const rootClass = computed(() =>
  parseClass(
    "flex items-center w-full",
    props.disabled && "opacity-60",
    pt.value.className,
  ),
);

const scrollClass = computed(() => parseClass("w-full h-full", pt.value.scroll?.className));

const innerClass = computed(() =>
  parseClass("flex items-center h-full", props.fill && "w-full", pt.value.inner?.className),
);

const itemClass = (item: RenderItem) =>
  parseClass(
    "flex items-center justify-center h-full text-[26rpx] text-[var(--color-gray-6)] relative",
    item.isActive && "text-[var(--color-primary)]",
    props.showSlider && item.isActive && "bg-[var(--color-primary)] text-white rounded-[16rpx]",
    props.fill && "flex-1",
    item.disabled && "opacity-40",
    pt.value.item?.className,
  );

const textClass = (item: RenderItem) =>
  parseClass(
    "transition-colors duration-200",
    props.showSlider && item.isActive && "text-white",
    pt.value.text?.className,
  );

const lineClass = computed(() =>
  parseClass(
    "absolute bottom-[6rpx] left-1/2 h-[4rpx] w-[32rpx] -translate-x-1/2 rounded-full bg-[var(--color-primary)]",
    pt.value.line?.className,
  ),
);

function change(index: number) {
  if (props.disabled) return;
  const { value, disabled } = list.value[index];
  if (disabled) return;
  active.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}

function getTextStyle(item: RenderItem) {
  const color = item.isActive ? props.color : props.unColor;
  return color ? { color } : {};
}

watch(
  () => props.modelValue,
  (val) => {
    active.value = val;
  },
  { immediate: true },
);
</script>
