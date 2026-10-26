<script setup lang="ts">
import type { HslaColor, RgbaColor } from "@uiw/color-convert";
import { computed } from "vue";

interface ObjectColorInputProps {
  /** 数字输入组的颜色格式：hsl/hsla 显示 H/S/L 通道，rgb/rgba 显示 R/G/B 通道；带 a 的格式追加透明度输入（0-100） */
  label: "hsl" | "hsla" | "rgb" | "rgba";
  value: HslaColor | RgbaColor;
}

const props = defineProps<ObjectColorInputProps>();
const emit = defineEmits<{ "value-change": [value: HslaColor | RgbaColor] }>();

function getInputClass(index: number, totalInputs: number): string {
  const baseClass =
    "flex-1 w-0 h-8 px-2 py-1 text-sm border border-input bg-background text-center overflow-hidden focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0";

  const isFirst = index === 0;
  const isLast = index === totalInputs - 1;
  const isMiddle = !isFirst && !isLast;

  let positionClasses = "";
  if (isFirst) {
    positionClasses = "rounded-l-md -mr-px";
  } else if (isLast) {
    positionClasses = "rounded-r-md";
  } else if (isMiddle) {
    positionClasses = "rounded-none -mr-px";
  }

  return `${baseClass} ${positionClasses}`;
}

interface ChannelInput {
  key: string;
  /** 输入框显示的值：透明度按 0-100 显示 */
  value: number;
  min: number;
  max: number;
  prop: string;
  class: string;
}

// 各通道的显示值与取值范围只算一次，模板与事件处理共用
const inputs = computed<ChannelInput[]>(() => {
  const isHsl = props.label === "hsl" || props.label === "hsla";
  const hasAlpha = props.label === "hsla" || props.label === "rgba";

  let inputsData: Omit<ChannelInput, "class">[];
  if (isHsl) {
    const hsl = props.value as HslaColor;
    inputsData = [
      { key: "h", value: Math.round(hsl.h), min: 0, max: 360, prop: "h" },
      { key: "s", value: Math.round(hsl.s), min: 0, max: 100, prop: "s" },
      { key: "l", value: Math.round(hsl.l), min: 0, max: 100, prop: "l" },
    ];
    if (hasAlpha) {
      inputsData.push({ key: "a", value: Math.round(hsl.a * 100), min: 0, max: 100, prop: "a" });
    }
  } else {
    const rgb = props.value as RgbaColor;
    inputsData = [
      { key: "r", value: Math.round(rgb.r), min: 0, max: 255, prop: "r" },
      { key: "g", value: Math.round(rgb.g), min: 0, max: 255, prop: "g" },
      { key: "b", value: Math.round(rgb.b), min: 0, max: 255, prop: "b" },
    ];
    if (hasAlpha) {
      inputsData.push({ key: "a", value: Math.round(rgb.a * 100), min: 0, max: 100, prop: "a" });
    }
  }

  return inputsData.map((input, index) => ({
    ...input,
    class: getInputClass(index, inputsData.length),
  }));
});

function emitChannel(input: ChannelInput, value: number) {
  const finalValue = input.prop === "a" ? value / 100 : value;
  emit("value-change", { ...props.value, [input.prop]: finalValue } as HslaColor | RgbaColor);
}

// 输入过程中：空串（正在删除重输）、非数字与超出范围的中间值都不提交，避免立刻回写覆盖输入
function handleInput(idx: number, event: Event) {
  const input = inputs.value[idx];
  if (!input) return;
  const raw = (event.target as HTMLInputElement).value.trim();
  if (raw === "") return;
  const value = Number(raw);
  if (Number.isNaN(value) || value < input.min || value > input.max) return;
  emitChannel(input, value);
}

// 失焦或回车时：夹取到合法范围后提交，空串或非法输入恢复为当前值
function handleChange(idx: number, event: Event) {
  const input = inputs.value[idx];
  if (!input) return;
  const target = event.target as HTMLInputElement;
  const value = Number(target.value.trim());
  if (target.value.trim() === "" || Number.isNaN(value)) {
    target.value = String(input.value);
    return;
  }
  const clampedValue = Math.max(input.min, Math.min(input.max, value));
  target.value = String(clampedValue);
  if (clampedValue !== input.value) emitChannel(input, clampedValue);
}
</script>

<template>
  <div class="flex w-full min-w-0">
    <input
      v-for="(input, idx) in inputs"
      :key="input.key"
      :value="input.value"
      :min="input.min"
      :max="input.max"
      :class="input.class"
      step="1"
      @input="handleInput(idx, $event)"
      @change="handleChange(idx, $event)"
    >
  </div>
</template>
