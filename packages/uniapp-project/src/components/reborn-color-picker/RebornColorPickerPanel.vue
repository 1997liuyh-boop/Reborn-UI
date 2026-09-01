<script setup lang="ts">
import { computed, ref, watch, getCurrentInstance, onMounted } from "vue";
import {
    colorStringToHsva,
    detectColorFormat,
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
    modelValue?: string;
    /** 面板当前的颜色输出格式（'hex' | 'rgb' | 'rgba'），支持 v-model:format 双向绑定 */
    format?: ColorFormat;
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

const props = withDefaults(defineProps<Props>(), {
    modelValue: "#000000",
});

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    /** 用户点击格式切换按钮时触发（v-model:format 同步），参数为新的输出格式 */
    (e: "update:format", value: ColorFormat): void;
}>();

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
const colorHsv = ref<HsvaColor>(colorStringToHsva(props.modelValue || "#000000"));
const format = ref<ColorFormat>(props.format || detectColorFormat(props.modelValue));

// 画布/滑块区域 rect 缓存，touchmove 时用缓存同步计算位置，避免每次异步 query 导致不跟手
type Rect = { left: number; top: number; width: number; height: number };
const saturationRect = ref<Rect | null>(null);
const hueRect = ref<Rect | null>(null);
const alphaRect = ref<Rect | null>(null);

// --- 来自 base.css 的预设颜色 ---
const presets = [
    "#ffebee", "#ff3d58", "#ff9711", "#16ae88", "#0d99e5", "#ffffff", "#eeeeee", "#333333",
];

// --- 计算属性 ---
const hexValue = computed(() => hsvaToHex(colorHsv.value));
const rgbaValue = computed(() => hsvaToRgba(colorHsv.value));

const displayValue = computed({
    get: () => {
        const value = hsvaToColorString(colorHsv.value, format.value);
        return format.value === "hex" ? value.toUpperCase() : value;
    },
    set: (val: string) => {
        try {
            colorHsv.value = colorStringToHsva(val);

            if (!props.format) {
                format.value = detectColorFormat(val);
            }
        } catch (e) {
            // 忽略无效输入
        }
    },
});

// --- 监听器 ---
watch(() => props.modelValue, (val: string | undefined) => {
    if (!val) return;

    if (props.format) {
        format.value = props.format;
    } else {
        format.value = detectColorFormat(val);
    }

    const hsv = colorStringToHsva(val);
    const cur = colorHsv.value;
    if (
        cur.h !== hsv.h || cur.s !== hsv.s || cur.v !== hsv.v || cur.a !== hsv.a
    ) {
        colorHsv.value = hsv;
    }
});

watch(() => props.format, (val) => {
    if (val) {
        format.value = val;
    }
}, { immediate: true });

watch(displayValue, (val: string) => {
    emit("update:modelValue", val);
});

watch(format, (val) => {
    emit("update:format", val);
});

// --- 交互逻辑：touchstart 预热 rect 缓存，touchmove 用缓存同步计算，避免异步 query 导致不跟手 ---
function updateSaturationFromRect(rect: Rect, clientX: number, clientY: number) {
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    colorHsv.value = {
        ...colorHsv.value,
        s: x * 100,
        v: (1 - y) * 100,
    };
}

function handleSaturationTouch(e: any) {
    const touch = e.touches[0];
    if (!touch) return;
    if (e.type === "touchstart") saturationRect.value = null;
    const rect = saturationRect.value;
    if (rect) {
        updateSaturationFromRect(rect, touch.clientX, touch.clientY);
        return;
    }
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-saturation")
        .boundingClientRect((r: any) => {
            if (!r) return;
            saturationRect.value = { left: r.left, top: r.top, width: r.width, height: r.height };
            updateSaturationFromRect(saturationRect.value, touch.clientX, touch.clientY);
        })
        .exec();
}

function handleHueTouch(e: any) {
    const touch = e.touches[0];
    if (!touch) return;
    if (e.type === "touchstart") hueRect.value = null;
    const rect = hueRect.value;
    if (rect) {
        const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        colorHsv.value = { ...colorHsv.value, h: x * 360 };
        return;
    }
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-hue-slider")
        .boundingClientRect((r: any) => {
            if (!r) return;
            hueRect.value = { left: r.left, top: r.top, width: r.width, height: r.height };
            const x = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
            colorHsv.value = { ...colorHsv.value, h: x * 360 };
        })
        .exec();
}

function handleAlphaTouch(e: any) {
    const touch = e.touches[0];
    if (!touch) return;
    if (e.type === "touchstart") alphaRect.value = null;
    const rect = alphaRect.value;
    if (rect) {
        const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        colorHsv.value = { ...colorHsv.value, a: x };
        return;
    }
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-alpha-slider")
        .boundingClientRect((r: any) => {
            if (!r) return;
            alphaRect.value = { left: r.left, top: r.top, width: r.width, height: r.height };
            const x = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
            colorHsv.value = { ...colorHsv.value, a: x };
        })
        .exec();
}

function selectPreset(color: string) {
    colorHsv.value = colorStringToHsva(color);
}
</script>

<template>
    <view :class="ui.root({ class: props.class })" @touchmove.stop.prevent="">
        <!-- 饱和度/明度 画布 -->
        <view :class="[ui.saturation(), 'reborn-saturation']"
            :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${colorHsv.h}, 100%, 50%))` }"
            @touchstart="handleSaturationTouch" @touchmove="handleSaturationTouch">
            <view :class="ui.saturationCursor()" :style="{ left: `${colorHsv.s}%`, top: `${100 - colorHsv.v}%` }" />
        </view>

        <view :class="ui.controls()">
            <!-- 预览 -->
            <view :class="ui.preview()" :style="{ backgroundColor: hexValue }" />

            <view :class="ui.sliders()">
                <!-- 色相滑块 -->
                <view :class="[ui.hueSlider(), 'reborn-hue-slider']"
                    style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
                    @touchstart="handleHueTouch" @touchmove="handleHueTouch">
                    <view :class="ui.hueCursor()" :style="{ left: `${(colorHsv.h / 360) * 100}%` }" />
                </view>

                <!-- 透明度滑块 -->
                <view :class="[ui.alphaSlider(), 'reborn-alpha-slider']" :style="{
                    background: `linear-gradient(to right, transparent, ${hexValue})`
                }" @touchstart="handleAlphaTouch" @touchmove="handleAlphaTouch">
                    <view :class="ui.alphaCursor()" :style="{ left: `${colorHsv.a * 100}%` }" />
                </view>
            </view>
        </view>

        <!-- 输入框与格式 -->
        <view :class="ui.inputs()">
            <view :class="ui.formatToggles()">
                <RebornButton v-for="f in (['hex', 'rgb', 'rgba'] as const)" :key="f" size="xs"
                    :variant="format === f ? 'filled' : 'soft'" :color="format === f ? 'primary' : 'neutral'"
                    class="px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors"
                    @tap="format = f as ColorFormat">
                    {{ f }}
                </RebornButton>
            </view>
            <RebornInput v-model="displayValue" size="sm" :class="ui.input()" spellcheck="false" />
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
