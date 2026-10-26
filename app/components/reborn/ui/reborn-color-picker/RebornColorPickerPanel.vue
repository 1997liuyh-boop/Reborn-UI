<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, useTemplateRef, watch } from "vue";
import {
    hexToHsva,
    hsvaToHex,
    hsvaToHexa,
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

const emit = defineEmits<{
    /** 一次交互结束且颜色确实变化时触发：松开拖拽、点选预设色、输入框提交合法色值 */
    (e: "change", value: string): void;
}>();

/**
 * 绑定的色值。不透明时输出 #rrggbb，带透明度时输出 #rrggbbaa；
 * 未绑定 v-model 时退化为面板自己的本地状态，取色照样生效
 */
const model = defineModel<string>({ default: "#000000" });
const colorFormats = ["hex", "rgb", "rgba"] as const;

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

/**
 * 解析完整的色值文本：#rgb / #rgba / #rrggbb / #rrggbbaa 与 rgb() / rgba()。
 * 不完整或不合法（输入到一半的 `#12`、颜色名 `red`）一律返回 null，调用方据此决定是否提交
 */
function parseColor(text: string | null | undefined): HsvaColor | null {
    if (!text) return null;
    const value = text.trim();
    const hex = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hex) {
        let digits = hex[1]!;
        // 缩写逐位翻倍；@uiw/color-convert 只认 3 / 6 / 8 位，4 位缩写要先展开
        if (digits.length <= 4) digits = [...digits].map(ch => ch + ch).join("");
        return hexToHsva(`#${digits}`);
    }
    const rgb = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?\)$/i);
    if (rgb) {
        const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number) as [number, number, number];
        const a = rgb[4] === undefined ? 1 : Number(rgb[4]);
        if (r > 255 || g > 255 || b > 255 || a > 1) return null;
        return rgbaToHsva({ r, g, b, a });
    }
    return null;
}

// --- 状态 ---
/** 面板内部以 HSVA 保存颜色，避免拖拽时反复经十六进制往返丢精度；只整体替换，不就地修改 */
const colorHsv = shallowRef<HsvaColor>(parseColor(model.value) ?? hexToHsva("#000000"));
const format = shallowRef<"hex" | "rgb" | "rgba">("hex");

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
/** 不含透明度的十六进制，只用于透明度滑块的渐变终点 */
const opaqueHex = computed(() => hsvaToHex(colorHsv.value));
const rgbaValue = computed(() => hsvaToRgba(colorHsv.value));

/**
 * 对外输出的色值：不透明时为 #rrggbb，带透明度时为 #rrggbbaa（与 UniApp 端 hex 格式的输出一致）。
 * 透明度按 8 位量化后仍为 255 的视为不透明，避免输出 #rrggbbff
 */
const outputValue = computed(() => {
    const hsva = colorHsv.value;
    return Math.round(hsva.a * 255) < 255 ? hsvaToHexa(hsva) : hsvaToHex(hsva);
});

/** 输入框按当前格式显示的文本 */
const displayValue = computed(() => {
    if (format.value === "hex") return outputValue.value.toUpperCase();
    const { r, g, b, a } = rgbaValue.value;
    if (format.value === "rgb") return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
});

// --- 提交 ---
/** 交互入口统一从这里写回：先改本地 HSVA，再把派生的输出值写进 v-model */
function commit(next: HsvaColor) {
    colorHsv.value = next;
    model.value = outputValue.value;
}

/** 上一次派发 change（或与外部同步）时的色值，用来判断一次交互是否真的改了颜色 */
let changeBase = outputValue.value;

function emitChange() {
    const value = outputValue.value;
    if (value === changeBase) return;
    changeBase = value;
    emit("change", value);
}

/**
 * 外部改值只同步面板显示，不回写 v-model：大小写不同、#f00 缩写、rgb() 写法都原样保留在父组件；
 * 无法解析的值（如颜色名）不改面板
 */
watch(model, (val) => {
    if (!val || val === outputValue.value) return;
    const next = parseColor(val);
    if (next) colorHsv.value = next;
    changeBase = outputValue.value;
});

// --- 输入框草稿 ---
/** 输入框绑定独立的草稿文本：输入到一半的值不是合法颜色，不能边输边回写 */
const draftText = shallowRef(displayValue.value);
/** 聚焦期间不让派生值覆盖草稿，否则拖拽、点预设之外的重算会冲掉用户正在输入的文本 */
const editing = shallowRef(false);

watch(displayValue, (text) => {
    if (!editing.value) draftText.value = text;
});

/** 失焦或回车时提交：合法则写回并派发 change，不合法则恢复为当前色值 */
function commitDraft() {
    const next = parseColor(draftText.value);
    if (next) {
        commit(next);
        emitChange();
    }
    draftText.value = displayValue.value;
}

function endEditing() {
    editing.value = false;
    draftText.value = displayValue.value;
}

// --- 拖拽 ---
/**
 * 拖拽句柄：Pointer Events 统一鼠标、触控笔与触屏，setPointerCapture 让指针拖出元素后仍能收到移动事件；
 * 松手（pointerup）、被系统手势打断（pointercancel / lostpointercapture）与组件卸载都会结束拖拽并移除监听。
 * onMove 收到的是指针在元素内的相对位置（0~1），onEnd 在一次拖拽结束时调用一次
 */
function useDragHandle(
    elRef: { readonly value: HTMLElement | null },
    onMove: (ratioX: number, ratioY: number) => void,
    onEnd: () => void,
) {
    let activeId: number | null = null;
    let target: HTMLElement | null = null;

    function update(event: PointerEvent) {
        const el = elRef.value;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = rect.width ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0;
        const y = rect.height ? Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) : 0;
        onMove(x, y);
    }

    function onPointerMove(event: PointerEvent) {
        if (event.pointerId === activeId) update(event);
    }

    function stop(event?: PointerEvent) {
        if (activeId === null) return;
        if (event && event.pointerId !== activeId) return;
        const el = target;
        const pointerId = activeId;
        activeId = null;
        target = null;
        if (el) {
            el.removeEventListener("pointermove", onPointerMove);
            el.removeEventListener("pointerup", stop);
            el.removeEventListener("pointercancel", stop);
            el.removeEventListener("lostpointercapture", stop);
            if (el.hasPointerCapture?.(pointerId)) el.releasePointerCapture(pointerId);
        }
        onEnd();
    }

    function start(event: PointerEvent) {
        // 只响应鼠标主键；触屏与触控笔的 button 恒为 0
        if (event.button !== 0) return;
        const el = elRef.value;
        if (!el) return;
        stop();
        // 阻止默认行为，避免拖动时选中面板里的文字；默认行为里「让当前焦点失焦」随之丢失，手动补上，
        // 否则正在编辑的色值输入框不会失焦，拖拽后的颜色同步不到输入框
        const active = document.activeElement;
        if (active instanceof HTMLElement && active !== document.body) active.blur();
        event.preventDefault();
        activeId = event.pointerId;
        target = el;
        el.setPointerCapture?.(event.pointerId);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", stop);
        el.addEventListener("pointercancel", stop);
        el.addEventListener("lostpointercapture", stop);
        update(event);
    }

    onBeforeUnmount(() => stop());

    return start;
}

const saturationRef = useTemplateRef<HTMLElement>("saturationRef");
const hueRef = useTemplateRef<HTMLElement>("hueRef");
const alphaRef = useTemplateRef<HTMLElement>("alphaRef");

const startSaturationDrag = useDragHandle(
    saturationRef,
    (x, y) => commit({ ...colorHsv.value, s: x * 100, v: (1 - y) * 100 }),
    emitChange,
);
const startHueDrag = useDragHandle(hueRef, x => commit({ ...colorHsv.value, h: x * 360 }), emitChange);
const startAlphaDrag = useDragHandle(alphaRef, x => commit({ ...colorHsv.value, a: x }), emitChange);

function selectPreset(color: string) {
    const next = parseColor(color);
    if (!next) return;
    commit(next);
    emitChange();
}
</script>

<template>
    <div :class="ui.root({ class: props.class })">
        <!-- 饱和度/明度 画布；touch-action: none 让触屏拖动不再同时滚动页面 -->
        <div ref="saturationRef" :class="ui.saturation()"
            :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${colorHsv.h}, 100%, 50%))`, touchAction: 'none' }"
            @pointerdown="startSaturationDrag">
            <div :class="ui.saturationCursor()" :style="{ left: `${colorHsv.s}%`, top: `${100 - colorHsv.v}%` }" />
        </div>

        <div :class="ui.controls()">
            <!-- 预览：带透明度时如实显示 -->
            <div :class="ui.preview()" :style="{ backgroundColor: outputValue }" />

            <div :class="ui.sliders()">
                <!-- 色相滑块 -->
                <div ref="hueRef" :class="ui.hueSlider()"
                    style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%); touch-action: none"
                    @pointerdown="startHueDrag">
                    <div :class="ui.hueCursor()" :style="{ left: `${(colorHsv.h / 360) * 100}%` }" />
                </div>

                <!-- 透明度滑块 -->
                <div ref="alphaRef" :class="ui.alphaSlider()" :style="{
                    background: `linear-gradient(to right, transparent, ${opaqueHex}), url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBIREFUGF5jYmBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGAEAAAgAAB9vNcCAAAAAElFTkSuQmCC')`,
                    touchAction: 'none'
                }" @pointerdown="startAlphaDrag">
                    <div :class="ui.alphaCursor()" :style="{ left: `${colorHsv.a * 100}%` }" />
                </div>
            </div>
        </div>

        <!-- 输入框与格式 -->
        <div :class="ui.inputs()">
            <div :class="ui.formatToggles()">
                <!-- 格式切换按钮：10px 低于 7 级字号令牌的下限（--text-sm 12px），无对应档位，只能写字面量 -->
                <RebornButton v-for="f in colorFormats" :key="f" size="sm"
                    :variant="format === f ? 'filled' : 'soft'" :color="format === f ? 'primary' : 'neutral'"
                    class="px-2 py-1 text-[10px] uppercase font-bold rounded-sm transition-colors" @click="format = f">
          {{ f }}
                </RebornButton>
            </div>
            <!-- 草稿文本：聚焦期间自由输入，失焦或回车（change）时才解析提交 -->
            <RebornInput v-model="draftText" size="sm" :class="ui.input()" spellcheck="false" @focus="editing = true" @change="commitDraft" @blur="endEditing" />
        </div>

        <!-- 预设颜色 -->
        <div :class="ui.presets()">
            <div :class="ui.presetTitle()">主题预设</div>
            <div :class="ui.presetGrid()">
                <RebornButton v-for="color in presets" :key="color" size="sm" square :class="ui.presetSwatch()"
                    :style="{ backgroundColor: color }" @click="selectPreset(color)" />
      </div>
        </div>
    </div>
</template>
