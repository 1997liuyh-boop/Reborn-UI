<script setup lang="ts">
import { computed, ref, watch, getCurrentInstance, onMounted } from "vue";
import {
    hexToHsva,
    hsvaToHex,
    hsvaToRgba,
    rgbaToHsva,
    hexToRgba,
    rgbaToHex,
} from "../../lib/color-utils";
import type { HsvaColor } from "../../lib/color-utils";
import { tv } from "@/lib/tv";
import { cn } from "@/lib/utils";
import theme from "./reborn-color-picker-panel.config";

import RebornButton from "../reborn-button/RebornButton.vue";
import RebornInput from "../reborn-input/RebornInput.vue";

interface Props {
    modelValue?: string;
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
const colorHsv = ref<HsvaColor>(hexToHsva(props.modelValue || "#000000"));
const format = ref<"hex" | "rgb" | "rgba">("hex");

// --- 来自 base.css 的预设颜色 ---
const presets = [
    "#ffebee", "#ff3d58", "#ff9711", "#16ae88", "#0d99e5", "#ffffff", "#eeeeee", "#333333",
];

// --- 计算属性 ---
const hexValue = computed(() => hsvaToHex(colorHsv.value));
const rgbaValue = computed(() => hsvaToRgba(colorHsv.value));

const displayValue = computed({
    get: () => {
        if (format.value === "hex") return hexValue.value.toUpperCase();
        if (format.value === "rgb") return `rgb(${rgbaValue.value.r}, ${rgbaValue.value.g}, ${rgbaValue.value.b})`;
        return `rgba(${rgbaValue.value.r}, ${rgbaValue.value.g}, ${rgbaValue.value.b}, ${rgbaValue.value.a.toFixed(2)})`;
    },
    set: (val: string) => {
        try {
            if (val.startsWith("#")) {
                colorHsv.value = hexToHsva(val);
            } else if (val.startsWith("rgb")) {
                const matches = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                if (matches) {
                    const [_, r, g, b, a] = matches;
                    colorHsv.value = rgbaToHsva({
                        r: parseInt(r || "0"),
                        g: parseInt(g || "0"),
                        b: parseInt(b || "0"),
                        a: a ? parseFloat(a) : 1,
                    });
                }
            }
        } catch (e) {
            // 忽略无效输入
        }
    },
});

// --- 监听器 ---
watch(() => props.modelValue, (val: string | undefined) => {
    if (!val) return;
    // Auto detect format from incoming string if it's not clear
    if (val.startsWith('rgba')) format.value = 'rgba';
    else if (val.startsWith('rgb')) format.value = 'rgb';
    else if (val.startsWith('#')) format.value = 'hex';

    const hsv = hexToHsva(val.startsWith('#') ? val : rgbaToHex(parseRgba(val)));
    if (JSON.stringify(hsv) !== JSON.stringify(colorHsv.value)) {
        colorHsv.value = hsv;
    }
});

function parseRgba(val: string) {
    const matches = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (matches) {
        return {
            r: parseInt(matches[1]),
            g: parseInt(matches[2]),
            b: parseInt(matches[3]),
            a: matches[4] ? parseFloat(matches[4]) : 1
        };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
}

watch(displayValue, (val: string) => {
    emit("update:modelValue", val);
});

// --- 交互逻辑 ---
function handleSaturationTouch(e: any) {
    const touch = e.touches[0];
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-saturation")
        .boundingClientRect((rect: any) => {
            if (!rect) return;
            const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

            colorHsv.value = {
                ...colorHsv.value,
                s: x * 100,
                v: (1 - y) * 100,
            };
        })
        .exec();
}

function handleHueTouch(e: any) {
    const touch = e.touches[0];
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-hue-slider")
        .boundingClientRect((rect: any) => {
            if (!rect) return;
            const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
            colorHsv.value = { ...colorHsv.value, h: x * 360 };
        })
        .exec();
}

function handleAlphaTouch(e: any) {
    const touch = e.touches[0];
    uni.createSelectorQuery()
        .in(proxy)
        .select(".reborn-alpha-slider")
        .boundingClientRect((rect: any) => {
            if (!rect) return;
            const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
            colorHsv.value = { ...colorHsv.value, a: x };
        })
        .exec();
}

function selectPreset(color: string) {
    colorHsv.value = hexToHsva(color);
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
                    :variant="format === f ? 'solid' : 'soft'" :color="format === f ? 'primary' : 'neutral'"
                    class="px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors" @tap="format = f">
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
