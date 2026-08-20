<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
    hexToHsva,
    hsvaToHex,
    hsvaToRgba,
    rgbaToHsva,
} from "@uiw/color-convert";
import type { HsvaColor } from "@uiw/color-convert";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-color-picker-panel.config";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornInput from "../reborn-input/RebornInput.vue";

interface Props {
    modelValue?: string;
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
}>();

// --- 样式配置 ---
const b = tv(theme);
const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b() as any;

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
    // 红色系
    "#ffebee", "#ffe0e4", "#ffb1bc", "#ff8b9b", "#ff6675", "#ff3d58", "#d92946", "#b31938", "#8c0d2a", "#660821",
    // 橙色系
    "#fff7df", "#ffe9c9", "#ffd5a0", "#ffc370", "#ffb03b", "#ff9711", "#bf7c2a", "#995c1a", "#733d0e", "#522601",
    // 绿色系
    "#f1faf8", "#e7f6f3", "#a2dfcf", "#5fcfad", "#3ac29e", "#16ae88", "#0b876c", "#036150", "#003b32", "#001412",
    // 蓝色系
    "#ecf9ff", "#dff4ff", "#9ed6f5", "#61ccff", "#35b6f2", "#0d99e5", "#0277bf", "#005999", "#003f73", "#00284d",
    // 灰色系
    "#ffffff", "#f5f5f5", "#eeeeee", "#cccccc", "#aaaaaa", "#999999", "#666666", "#333333",
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
    if (val && val !== hexValue.value) {
        colorHsv.value = hexToHsva(val);
    }
});

watch(hexValue, (val: string) => {
    emit("update:modelValue", val);
});

// --- 交互逻辑 ---
const saturationRef = ref<HTMLElement | undefined>();
const isDraggingSaturation = ref(false);

function handleSaturationDrag(event: MouseEvent | TouchEvent) {
    if (!saturationRef.value) return;
    const rect = saturationRef.value.getBoundingClientRect();
    const isTouch = "touches" in event;
    const clientX = isTouch ? (event as TouchEvent).touches[0]?.clientX : (event as MouseEvent).clientX;
    const clientY = isTouch ? (event as TouchEvent).touches[0]?.clientY : (event as MouseEvent).clientY;

    if (clientX === undefined || clientY === undefined) return;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    colorHsv.value = {
        ...colorHsv.value,
        s: x * 100,
        v: (1 - y) * 100,
    };
}

function startSaturationDrag(event: MouseEvent | TouchEvent) {
    isDraggingSaturation.value = true;
    handleSaturationDrag(event);
    const up = () => {
        isDraggingSaturation.value = false;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", up);
    };
    const move = (e: MouseEvent | TouchEvent) => handleSaturationDrag(e);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
}

const hueRef = ref<HTMLElement | undefined>();
function handleHueDrag(event: MouseEvent | TouchEvent) {
    if (!hueRef.value) return;
    const rect = hueRef.value.getBoundingClientRect();
    const isTouch = "touches" in event;
    const clientX = isTouch ? (event as TouchEvent).touches[0]?.clientX : (event as MouseEvent).clientX;

    if (clientX === undefined) return;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    colorHsv.value = { ...colorHsv.value, h: x * 360 };
}

function startHueDrag(event: MouseEvent | TouchEvent) {
    handleHueDrag(event);
    const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", up);
    };
    const move = (e: MouseEvent | TouchEvent) => handleHueDrag(e);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
}

const alphaRef = ref<HTMLElement | undefined>();
function handleAlphaDrag(event: MouseEvent | TouchEvent) {
    if (!alphaRef.value) return;
    const rect = alphaRef.value.getBoundingClientRect();
    const isTouch = "touches" in event;
    const clientX = isTouch ? (event as TouchEvent).touches[0]?.clientX : (event as MouseEvent).clientX;

    if (clientX === undefined) return;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    colorHsv.value = { ...colorHsv.value, a: x };
}

function startAlphaDrag(event: MouseEvent | TouchEvent) {
    handleAlphaDrag(event);
    const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", up);
    };
    const move = (e: MouseEvent | TouchEvent) => handleAlphaDrag(e);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
}

function selectPreset(color: string) {
    colorHsv.value = hexToHsva(color);
}
</script>

<template>
    <div :class="ui.root({ class: props.class })">
        <!-- 饱和度/明度 画布 -->
        <div ref="saturationRef" :class="ui.saturation()"
            :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${colorHsv.h}, 100%, 50%))` }"
            @mousedown="startSaturationDrag" @touchstart="startSaturationDrag">
            <div :class="ui.saturationCursor()" :style="{ left: `${colorHsv.s}%`, top: `${100 - colorHsv.v}%` }" />
        </div>

        <div :class="ui.controls()">
            <!-- 预览 -->
            <div :class="ui.preview()" :style="{ backgroundColor: hexValue }" />

            <div :class="ui.sliders()">
                <!-- 色相滑块 -->
                <div ref="hueRef" :class="ui.hueSlider()"
                    style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
                    @mousedown="startHueDrag" @touchstart="startHueDrag">
                    <div :class="ui.hueCursor()" :style="{ left: `${(colorHsv.h / 360) * 100}%` }" />
                </div>

                <!-- 透明度滑块 -->
                <div ref="alphaRef" :class="ui.alphaSlider()" :style="{
                    background: `linear-gradient(to right, transparent, ${hexValue}), url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBIREFUGF5jYmBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGAEAAAgAAB9vNcCAAAAAElFTkSuQmCC')`
                }" @mousedown="startAlphaDrag" @touchstart="startAlphaDrag">
                    <div :class="ui.alphaCursor()" :style="{ left: `${colorHsv.a * 100}%` }" />
                </div>
            </div>
        </div>

        <!-- 输入框与格式 -->
        <div :class="ui.inputs()">
            <div :class="ui.formatToggles()">
                <RebornButton v-for="f in (['hex', 'rgb', 'rgba'] as const)" :key="f" size="xs"
                    :variant="format === f ? 'solid' : 'ghost'" :color="format === f ? 'primary' : 'neutral'"
                    class="px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors" @click="format = f">
                    {{ f }}
                </RebornButton>
            </div>
            <RebornInput v-model="displayValue" size="sm" :class="ui.input()" spellcheck="false" />
        </div>

        <!-- 预设颜色 -->
        <div :class="ui.presets()">
            <div :class="ui.presetTitle()">主题预设</div>
            <div :class="ui.presetGrid()">
                <RebornButton v-for="color in presets" :key="color" size="xs" square :class="ui.presetSwatch()"
                    :style="{ backgroundColor: color }" @click="selectPreset(color)" />
            </div>
        </div>
    </div>
</template>
