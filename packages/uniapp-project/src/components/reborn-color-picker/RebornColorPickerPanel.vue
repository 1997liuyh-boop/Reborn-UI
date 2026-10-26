<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, shallowRef, watch } from "vue";
import {
    colorStringToHsva,
    hsvaToColorString,
    hsvaToHex,
    hsvaToRgba,
    rgbaToHsva,
    rgbaToHex,
} from "../../lib/color-utils";
import type { ColorFormat, HsvaColor } from "../../lib/color-utils";
import { tv } from "@/lib/tv";
import { cn } from "@/lib/utils";
import theme from "./reborn-color-picker-panel.config";

import RebornButton from "../reborn-button/RebornButton.vue";
import RebornInput from "../reborn-input/RebornInput.vue";

interface Props {
    /** 面板当前的颜色输出格式（'hex' | 'rgb' | 'rgba'），支持 v-model:format 双向绑定 */
    /** 追加到面板根节点的自定义类名 */
    class?: any;
    ui?: {
        root?: string
        saturation?: string
        saturationCursor?: string
        controls?: string
        preview?: string
        sliders?: string
        hueSlider?: string
        hueCursor?: string
        alphaSlider?: string
        alphaCursor?: string
        inputs?: string
        formatToggles?: string
        input?: string
        presets?: string
        presetTitle?: string
        presetGrid?: string
        presetSwatch?: string
    };
}

const props = defineProps<Props>();

const emit = defineEmits<{ change: [value: string] }>();
const model = defineModel<string>({ default: '#000000' });
const format = defineModel<ColorFormat>('format', { default: 'hex' });

const { proxy } = getCurrentInstance()!;

// --- 样式配置 ---
const b = tv(theme);
const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b();

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        saturation: (opts?: { class?: any }) => styles.saturation({ class: cn(opts?.class, uiOverrides.value.saturation) }),
        saturationCursor: (opts?: { class?: any }) => styles.saturationCursor({ class: cn(opts?.class, uiOverrides.value.saturationCursor) }),
        controls: (opts?: { class?: any }) => styles.controls({ class: cn(opts?.class, uiOverrides.value.controls) }),
        preview: (opts?: { class?: any }) => styles.preview({ class: cn(opts?.class, uiOverrides.value.preview) }),
        sliders: (opts?: { class?: any }) => styles.sliders({ class: cn(opts?.class, uiOverrides.value.sliders) }),
        hueSlider: (opts?: { class?: any }) => styles.hueSlider({ class: cn(opts?.class, uiOverrides.value.hueSlider) }),
        hueCursor: (opts?: { class?: any }) => styles.hueCursor({ class: cn(opts?.class, uiOverrides.value.hueCursor) }),
        alphaSlider: (opts?: { class?: any }) => styles.alphaSlider({ class: cn(opts?.class, uiOverrides.value.alphaSlider) }),
        alphaCursor: (opts?: { class?: any }) => styles.alphaCursor({ class: cn(opts?.class, uiOverrides.value.alphaCursor) }),
        inputs: (opts?: { class?: any }) => styles.inputs({ class: cn(opts?.class, uiOverrides.value.inputs) }),
        formatToggles: (opts?: { class?: any }) => styles.formatToggles({ class: cn(opts?.class, uiOverrides.value.formatToggles) }),
        input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
        presets: (opts?: { class?: any }) => styles.presets({ class: cn(opts?.class, uiOverrides.value.presets) }),
        presetTitle: (opts?: { class?: any }) => styles.presetTitle({ class: cn(opts?.class, uiOverrides.value.presetTitle) }),
        presetGrid: (opts?: { class?: any }) => styles.presetGrid({ class: cn(opts?.class, uiOverrides.value.presetGrid) }),
        presetSwatch: (opts?: { class?: any }) => styles.presetSwatch({ class: cn(opts?.class, uiOverrides.value.presetSwatch) }),
    }
});

// --- 状态 ---
const colorHsv = shallowRef<HsvaColor>(colorStringToHsva(model.value));
type Rect = { left: number; top: number; width: number; height: number };
let saturationRect: Rect | null = null;
let hueRect: Rect | null = null;
let alphaRect: Rect | null = null;
let disposed = false;
onBeforeUnmount(() => { disposed = true });
const presets = ['#ffebee', '#ff3d58', '#ff9711', '#16ae88', '#0d99e5', '#ffffff', '#eeeeee', '#333333'];
const formats: ColorFormat[] = ['hex', 'rgb', 'rgba'];
const hexValue = computed(() => hsvaToHex(colorHsv.value));
const rgbaValue = computed(() => hsvaToRgba(colorHsv.value));
const displayValue = computed(() => hsvaToColorString(colorHsv.value, format.value));
const draftText = shallowRef(displayValue.value);
const editing = shallowRef(false);
watch(displayValue, val => { if (!editing.value) draftText.value = val });

let changeBase = displayValue.value;
watch(model, val => {
  if (val !== displayValue.value) { colorHsv.value = colorStringToHsva(val); changeBase = displayValue.value; }
});
function commitColor(next: HsvaColor) {
  colorHsv.value = next;
  model.value = displayValue.value;
}

function emitChange(value = displayValue.value) {
  if (value === changeBase) return;
  changeBase = value;
  emit('change', value);
}
function commitDraft() {
  const text = draftText.value.trim();
  const hex = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(text);
  const rgb = text.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?\)$/i);
  if (hex || (rgb && [rgb[1], rgb[2], rgb[3]].every(n => Number(n) <= 255) && Number(rgb[4] ?? 1) <= 1)) {
    // 颜色工具只接收完整透明度十六进制，先展开四位简写。
    const color = /^#[\da-f]{4}$/i.test(text) ? `#${text.slice(1).split('').map(value => value + value).join('')}` : text;
    commitColor(colorStringToHsva(color));
    emitChange();
  }
  editing.value = false;
  draftText.value = displayValue.value;
}
function changeFormat(next: ColorFormat) {
  commitDraft();
  format.value = next;
  const value = hsvaToColorString(colorHsv.value, next);
  model.value = value;
  draftText.value = value;
  emitChange(value);
}

// --- 交互逻辑：touchstart 预热 rect 缓存，touchmove 用缓存同步计算，避免异步 query 导致不跟手 ---
function updateSaturationFromRect(rect: Rect, clientX: number, clientY: number) {
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    commitColor({
        ...colorHsv.value,
        s: x * 100,
        v: (1 - y) * 100,
    });
}

function handleSaturationTouch(e: any) {
    const touch = e.touches[0];
    if (!touch) return;
    if (e.type === "touchstart") saturationRect = null;
    const rect = saturationRect;
    if (rect) {
        updateSaturationFromRect(rect, touch.clientX, touch.clientY);
        return;
    }
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-saturation")
        .boundingClientRect((r: any) => {
            if (!r || disposed) return;
            saturationRect = { left: r.left, top: r.top, width: r.width, height: r.height };
            updateSaturationFromRect(saturationRect, touch.clientX, touch.clientY);
        })
        .exec();
}

function handleHueTouch(e: any) {
    const touch = e.touches[0];
    if (!touch) return;
    if (e.type === "touchstart") hueRect = null;
    const rect = hueRect;
    if (rect) {
        const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        commitColor({ ...colorHsv.value, h: x * 360 });
        return;
    }
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-hue-slider")
        .boundingClientRect((r: any) => {
            if (!r || disposed) return;
            hueRect = { left: r.left, top: r.top, width: r.width, height: r.height };
            const x = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
            commitColor({ ...colorHsv.value, h: x * 360 });
        })
        .exec();
}

function handleAlphaTouch(e: any) {
    const touch = e.touches[0];
    if (!touch) return;
    if (e.type === "touchstart") alphaRect = null;
    const rect = alphaRect;
    if (rect) {
        const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        commitColor({ ...colorHsv.value, a: x });
        return;
    }
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-alpha-slider")
        .boundingClientRect((r: any) => {
            if (!r || disposed) return;
            alphaRect = { left: r.left, top: r.top, width: r.width, height: r.height };
            const x = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
            commitColor({ ...colorHsv.value, a: x });
        })
        .exec();
}

function selectPreset(color: string) {
    commitColor(colorStringToHsva(color));
    emitChange();
}
</script>

<template>
    <view :class="ui.root({ class: props.class })" @touchmove.stop.prevent="">
        <!-- 饱和度/明度 画布 -->
        <view :class="[ui.saturation(), 'reborn-saturation']"
            :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${colorHsv.h}, 100%, 50%))` }"
            @touchstart="handleSaturationTouch" @touchmove="handleSaturationTouch" @touchend="emitChange()" @touchcancel="emitChange()">
            <view :class="ui.saturationCursor()" :style="{ left: `${colorHsv.s}%`, top: `${100 - colorHsv.v}%` }" />
        </view>

        <view :class="ui.controls()">
            <!-- 预览 -->
            <view :class="ui.preview()" :style="{ backgroundColor: hexValue }" />

            <view :class="ui.sliders()">
                <!-- 色相滑块 -->
                <view :class="[ui.hueSlider(), 'reborn-hue-slider']"
                    style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
                    @touchstart="handleHueTouch" @touchmove="handleHueTouch" @touchend="emitChange()" @touchcancel="emitChange()">
                    <view :class="ui.hueCursor()" :style="{ left: `${(colorHsv.h / 360) * 100}%` }" />
                </view>

                <!-- 透明度滑块 -->
                <view :class="[ui.alphaSlider(), 'reborn-alpha-slider']" :style="{
                    background: `linear-gradient(to right, transparent, ${hexValue})`
                }" @touchstart="handleAlphaTouch" @touchmove="handleAlphaTouch" @touchend="emitChange()" @touchcancel="emitChange()">
                    <view :class="ui.alphaCursor()" :style="{ left: `${colorHsv.a * 100}%` }" />
                </view>
            </view>
        </view>

        <!-- 输入框与格式 -->
        <view :class="ui.inputs()">
            <view :class="ui.formatToggles()">
                <RebornButton v-for="f in formats" :key="f" size="sm"
                    :variant="format === f ? 'filled' : 'soft'" :color="format === f ? 'primary' : 'neutral'"
                    class="px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors"
                    @tap="changeFormat(f)">
                    {{ f }}
                </RebornButton>
            </view>
            <RebornInput v-model="draftText" size="sm" :class="ui.input()" spellcheck="false" @focus="editing = true" @blur="commitDraft" @confirm="commitDraft" />
        </view>

        <!-- 预设颜色 -->
        <view :class="ui.presets()">
            <view :class="ui.presetTitle()">主题预设</view>
            <view :class="ui.presetGrid()">
                <view v-for="color in presets" :key="color" :class="ui.presetSwatch()"
                    :style="{ backgroundColor: color }" @tap="selectPreset(color)" />
            </view>
        </view>
    </view>
</template>
