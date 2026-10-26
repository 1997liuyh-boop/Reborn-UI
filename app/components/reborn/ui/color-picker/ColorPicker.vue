<script setup lang="ts">
import type { HexColor, HslaColor, HsvaColor, RgbaColor } from "@uiw/color-convert";
import {
  hexToHsva,
  hslaToHsva,
  hsvaToHex,
  hsvaToHsla,
  hsvaToRgba,
  rgbaToHsva,
} from "@uiw/color-convert";
import { useEventListener } from "@vueuse/core";
import { computed, shallowRef, useTemplateRef, watch } from "vue";
import ContrastRatio from "./ContrastRatio.vue";
import ObjectColorInput from "./ObjectColorInput.vue";

export interface ColorPickerValue {
  hex: string;
  hsl: HslaColor;
  hsla: HslaColor;
  rgb: RgbaColor;
  rgba: RgbaColor;
}

export interface ColorPickerProps {
  value?: `#${string}` | HsvaColor | HslaColor | RgbaColor;
  type?: "hsl" | "hsla" | "rgb" | "rgba" | "hex";
  swatches?: HexColor[];
  hideContrastRatio?: boolean;
  hideDefaultSwatches?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<ColorPickerProps>(), {
  type: "hsl",
  swatches: () => [],
  hideContrastRatio: false,
  hideDefaultSwatches: false,
});

const emit = defineEmits<{
  "value-change": [value: ColorPickerValue];
}>();

/** 弹层开关，支持 v-model:open；未绑定时由组件内部维护，undefined 视为关闭 */
const isOpen = defineModel<boolean>("open", { default: undefined });

type ColorType = "hsl" | "hsla" | "rgb" | "rgba" | "hex";

const colorType = shallowRef<ColorType>(props.type);
const isDropdownOpen = shallowRef(false);

// type 只是输入区的初始格式；父组件改了 type 时同步过来，用户仍可在面板里自由切换
watch(
  () => props.type,
  (type) => {
    colorType.value = type;
  },
);

const colorOptions = [
  { value: "hex", label: "HEX" },
  { value: "hsl", label: "HSL" },
  { value: "hsla", label: "HSLA" },
  { value: "rgb", label: "RGB" },
  { value: "rgba", label: "RGBA" },
];

function getColorAsHsva(color: ColorPickerProps["value"]): HsvaColor {
  if (!color) return { h: 0, s: 0, v: 0, a: 1 };

  if (typeof color === "string") {
    return hexToHsva(color);
  } else if ("h" in color && "s" in color && "v" in color) {
    return color;
  } else if ("r" in color) {
    return rgbaToHsva(color);
  } else {
    return hslaToHsva(color);
  }
}

// 颜色只会被整体替换，不就地修改
const colorHsv = shallowRef<HsvaColor>(getColorAsHsva(props.value));

watch(
  () => props.value,
  (newValue) => {
    if (newValue) {
      colorHsv.value = getColorAsHsva(newValue);
    }
  },
  { deep: true },
);

const hexValue = computed(() => hsvaToHex(colorHsv.value));
const hslValue = computed(() => hsvaToHsla(colorHsv.value));
const rgbValue = computed(() => hsvaToRgba(colorHsv.value));

// 色板数据源在 computed 里决定：hideDefaultSwatches 只去掉默认色，自定义色板照常显示
const defaultSwatches = ["#F8371A", "#F97C1B", "#FAC81C", "#3FD0B6", "#2CADF6", "#6462FC"];
const visibleSwatches = computed(() =>
  [...(props.hideDefaultSwatches ? [] : defaultSwatches), ...props.swatches]
    .sort((a, b) => hexToHsva(a).h - hexToHsva(b).h),
);

const saturationRef = useTemplateRef<HTMLElement>("saturationRef");
const hueRef = useTemplateRef<HTMLElement>("hueRef");
const alphaRef = useTemplateRef<HTMLElement>("alphaRef");

function handleValueChange(color: HsvaColor) {
  colorHsv.value = color;

  const hslColor = hsvaToHsla(color);
  const rgbColor = hsvaToRgba(color);

  emit("value-change", {
    hex: hsvaToHex(color),
    hsl: {
      ...hslColor,
      a: Math.round(hslColor.a * 100) / 100,
    },
    hsla: {
      ...hslColor,
      a: Math.round(hslColor.a * 100) / 100,
    },
    rgb: {
      ...rgbColor,
      a: Math.round(rgbColor.a * 100) / 100,
    },
    rgba: {
      ...rgbColor,
      a: Math.round(rgbColor.a * 100) / 100,
    },
  });
}

// HEX 输入框持有本地草稿：输入过程中不回填规范化值，只在凑够 6 / 8 位合法十六进制时提交；
// hexToHsva 会把 #000～#00000 这类不完整输入当作 #000000，直接提交会覆盖用户正在输入的内容
const hexDraft = shallowRef(hexValue.value);
const editingHex = shallowRef(false);
const HEX_PATTERN = /^#?(?:[\da-f]{6}|[\da-f]{8})$/i;

watch(hexValue, (value) => {
  if (!editingHex.value) hexDraft.value = value;
});

function onHexInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  hexDraft.value = value;
  if (HEX_PATTERN.test(value)) {
    handleValueChange(hexToHsva(value.startsWith("#") ? value : `#${value}`));
  }
}

function onHexFocus() {
  editingHex.value = true;
}

// 失焦时与外部值对齐，未完成的草稿被丢弃
function onHexBlur() {
  editingHex.value = false;
  hexDraft.value = hexValue.value;
}

function updateFromObject(value: HslaColor | RgbaColor) {
  try {
    const newColor = "r" in value ? rgbaToHsva(value) : hslaToHsva(value);
    handleValueChange(newColor);
  } catch {
    // 非法的颜色对象，忽略
  }
}

function setColorFromHex(hex: string) {
  handleValueChange(hexToHsva(hex));
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function selectColorType(value: string) {
  colorType.value = value as ColorType;
  isDropdownOpen.value = false;
}

type PointerLikeEvent = MouseEvent | TouchEvent;

function getClientPoint(event: PointerLikeEvent) {
  const point = "touches" in event ? event.touches[0] : event;
  return { x: point?.clientX ?? 0, y: point?.clientY ?? 0 };
}

/**
 * 拖拽：按下时开始，移动时调用 onMove，松手结束。
 * document 上的监听只在拖拽期间存在，由 useEventListener 管理，拖拽中关闭面板或卸载组件时自动移除
 */
function usePointerDrag(onMove: (event: PointerLikeEvent) => void) {
  const dragging = shallowRef(false);
  const target = () => (dragging.value ? document : undefined);

  useEventListener(target, ["mousemove", "touchmove"], (event: Event) => {
    onMove(event as PointerLikeEvent);
  });
  useEventListener(target, ["mouseup", "touchend"], () => {
    dragging.value = false;
  });

  function start(event: PointerLikeEvent) {
    event.preventDefault();
    dragging.value = true;
    onMove(event);
  }

  return { start };
}

function updateSaturation(event: PointerLikeEvent) {
  if (!saturationRef.value) return;

  const rect = saturationRef.value.getBoundingClientRect();
  const { x: clientX, y: clientY } = getClientPoint(event);

  const relativeX = (clientX - rect.left) / rect.width;
  const relativeY = (clientY - rect.top) / rect.height;

  const x = Math.max(0.01, Math.min(0.99, relativeX));
  const y = Math.max(0.01, Math.min(0.99, relativeY));

  handleValueChange({
    ...colorHsv.value,
    s: x * 100,
    v: (1 - y) * 100,
  });
}

function updateHue(event: PointerLikeEvent) {
  if (!hueRef.value) return;

  const rect = hueRef.value.getBoundingClientRect();
  const { x: clientX } = getClientPoint(event);

  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

  handleValueChange({
    ...colorHsv.value,
    h: x * 360,
  });
}

function updateAlpha(event: PointerLikeEvent) {
  if (!alphaRef.value) return;

  const rect = alphaRef.value.getBoundingClientRect();
  const { x: clientX } = getClientPoint(event);

  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

  handleValueChange({
    ...colorHsv.value,
    a: x,
  });
}

const { start: startSaturationDrag } = usePointerDrag(updateSaturation);
const { start: startHueDrag } = usePointerDrag(updateHue);
const { start: startAlphaDrag } = usePointerDrag(updateAlpha);

function handleHueClick(event: MouseEvent) {
  updateHue(event);
}
</script>

<template>
  <div class="relative">
    <div @click="isOpen = !isOpen">
      <slot />
    </div>

    <div
      v-if="isOpen"
      class="bg-popover absolute top-full left-1/2 z-50 mt-2 w-80 -translate-x-1/2 transform rounded-md border p-4 shadow-md"
    >
      <div class="space-y-4">
        <div
          ref="saturationRef"
          class="relative aspect-[4/2] w-full cursor-crosshair rounded border"
          :style="{
            background: `linear-gradient(to right, #fff, hsl(${colorHsv.h}, 100%, 50%)), linear-gradient(to top, #000, transparent)`,
          }"
          @mousedown="startSaturationDrag"
          @touchstart="startSaturationDrag"
        >
          <div
            class="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
            :style="{
              left: `${colorHsv.s}%`,
              top: `${100 - colorHsv.v}%`,
              transform: 'translate(-50%, -50%)',
            }"
          />
        </div>

        <div
          ref="hueRef"
          class="relative h-4 w-full cursor-pointer rounded"
          :style="{
            background:
              'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }"
          @mousedown="startHueDrag"
          @touchstart="startHueDrag"
          @click="handleHueClick"
        >
          <div
            class="border-foreground pointer-events-none absolute h-4 w-4 rounded-full border-2 bg-white"
            :style="{
              left: `${(colorHsv.h / 360) * 100}%`,
              transform: 'translate(-50%, -50%)',
              top: '50%',
            }"
          />
        </div>

        <div class="flex items-center gap-2">
          <div class="relative">
            <button
              type="button"
              class="border-input bg-background inline-flex h-8 w-20 items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm font-medium uppercase"
              @click="toggleDropdown"
            >
              <span>{{ colorType }}</span>
              <Icon
                name="lucide:chevron-down"
                :size="14"
              />
            </button>

            <div
              v-if="isDropdownOpen"
              class="border-input bg-popover absolute top-full left-0 z-50 mt-1 w-full rounded-md border shadow-md"
            >
              <div class="p-1">
                <button
                  v-for="option in colorOptions"
                  :key="option.value"
                  type="button"
                  class="hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm font-medium uppercase select-none"
                  @click="selectColorType(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="flex grow">
            <input
              v-if="colorType === 'hex'"
              :value="hexDraft"
              type="text"
              class="border-input bg-background placeholder:text-muted-foreground flex h-8 w-full rounded-md border px-3 py-1 text-sm focus:outline-none"
              placeholder="#000000"
              @input="onHexInput"
              @focus="onHexFocus"
              @blur="onHexBlur"
            />

            <ObjectColorInput
              v-else
              :value="colorType === 'hsl' || colorType === 'hsla' ? hslValue : rgbValue"
              :label="colorType"
              @value-change="updateFromObject"
            />
          </div>
        </div>

        <div
          v-if="colorType === 'rgba' || colorType === 'hsla'"
          class="space-y-2"
        >
          <div
            ref="alphaRef"
            class="relative h-4 w-full cursor-pointer rounded"
            :style="{
              background: `linear-gradient(to right, rgba(${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}, 0) 0%, rgba(${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}, 1) 100%), repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px`,
            }"
            @mousedown="startAlphaDrag"
            @touchstart="startAlphaDrag"
          >
            <div
              class="border-foreground pointer-events-none absolute h-4 w-4 rounded-full border-2 bg-white"
              :style="{
                left: `${colorHsv.a * 100}%`,
                transform: 'translate(-50%, -50%)',
                top: '50%',
              }"
            />
          </div>
        </div>

        <div v-if="visibleSwatches.length > 0">
          <div class="bg-border h-px" />
          <div class="flex flex-wrap justify-start gap-2 pt-2">
            <button
              v-for="color in visibleSwatches"
              :key="`${color}-swatch`"
              type="button"
              class="ring-offset-background size-5 cursor-pointer rounded ring-2 ring-transparent ring-offset-1 transition-all duration-100 hover:ring-current"
              :style="{ backgroundColor: color }"
              :aria-label="`Set color to ${color}`"
              @click="setColorFromHex(color)"
              @keydown.enter="setColorFromHex(color)"
            />
          </div>
        </div>

        <div v-if="!hideContrastRatio">
          <div class="bg-border h-px" />
          <ContrastRatio :color="colorHsv" />
        </div>
      </div>
    </div>

    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    />
  </div>
</template>
