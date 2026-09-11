<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { CSSProperties } from "vue";
import type { sliderColors, sliderSizes } from "./reborn-slider.config";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-slider.config";

/**
 * 刻度标记：key 必须是 [min, max] 闭区间内的数字（越界或非法的 key 会被忽略），
 * 值为标记文案，对象形式可为单个标记设置 style 与 label。
 */
export type SliderMarks = Record<number, string | { style?: CSSProperties; label?: string | number }>;

/** 气泡提示配置 */
export interface SliderTooltip {
    /** 强制常显（true）或强制隐藏（false）；缺省仅拖拽时显示 */
    open?: boolean;
    /** 格式化气泡内容；显式传 null 等同隐藏气泡 */
    formatter?: ((value: number) => string | number) | null;
}

export interface SliderProps {
    modelValue?: number;
    /** range 模式的节点值数组，editable 时长度可变 */
    values?: number[];
    min?: number;
    max?: number;
    /** 步长；传 "mark" 时取值只能落在 marks 定义的刻度上（此时必须设置 marks） */
    step?: number | "mark";
    /** 刻度标记，key 为 [min, max] 内的数字；对象形式可为单个标记设置样式 */
    marks?: SliderMarks;
    /** 是否按步长在轨道上显示间断点（仅数字步长时生效，间断点过多时自动不渲染） */
    showStops?: boolean;
    /**
     * 是否禁用。传数组时按下标单独禁用 range 模式下的特定滑块：
     * 被禁用的滑块不可拖动，并作为移动边界，其他滑块无法越过它。
     * 注意数组下标对应「排序后」的节点位置，editable 增删节点会使下标后移。
     */
    disabled?: boolean | boolean[];
    /**
     * 可编辑节点（仅 range 模式）：点击轨道空白处添加节点；
     * 拖拽节点垂直于滑轨方向离开超过 40px 时松手删除；聚焦节点后按 Delete / Backspace 删除。
     * 至少保留一个节点。
     */
    editable?: boolean;
    /**
     * range 模式下允许拖拽首尾节点之间的选区整体平移（仅当没有单独禁用的滑块时可用；
     * 与 editable 同开时，选区内的点击优先整体拖拽，添加节点请点选区之外）。
     */
    draggableTrack?: boolean;
    /** 反向：水平模式从右向左递增，垂直模式从上向下递增 */
    reverse?: boolean;
    /** 垂直模式，滑轨长度由 height 给出 */
    vertical?: boolean;
    /** 垂直模式的滑轨长度（数字按 px 处理），缺省 200px */
    height?: string | number;
    /** 气泡提示：默认拖拽时显示当前值，open 可强制常显/隐藏，formatter 格式化内容 */
    tooltip?: SliderTooltip;
    /** 滑轨左侧（垂直模式为上方）图标，#prefix 插槽可完全接管 */
    prefixIcon?: string;
    /** 滑轨右侧（垂直模式为下方）图标，#suffix 插槽可完全接管 */
    suffixIcon?: string;
    showValue?: boolean;
    range?: boolean;
    size?: (typeof sliderSizes)[number];
    color?: (typeof sliderColors)[number];
    /** 追加到根节点的自定义类名 */
    class?: any;
    ui?: Partial<{
        wrapper: ClassValue;
        inner: ClassValue;
        track: ClassValue;
        progress: ClassValue;
        thumb: ClassValue;
        thumbDot: ClassValue;
        stopDot: ClassValue;
        markDot: ClassValue;
        markLabel: ClassValue;
        tooltip: ClassValue;
        prefix: ClassValue;
        suffix: ClassValue;
        value: ClassValue;
    }>;
}

const props = withDefaults(defineProps<SliderProps>(), {
    modelValue: 0,
    values: () => [0, 0],
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    editable: false,
    showStops: false,
    draggableTrack: false,
    reverse: false,
    vertical: false,
    showValue: false,
    range: false,
    size: "md",
    color: "primary",
});

const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
    (e: "update:values", value: number[]): void;
    /** 值每次变化都会触发（拖拽过程实时触发，对齐 Ant Design 的 onChange） */
    (e: "change", value: number | number[]): void;
    /** 交互结束（松开指针 / 松开按键）时触发，对齐 Ant Design 的 onChangeComplete */
    (e: "changeComplete", value: number | number[]): void;
    /** 兼容保留：与 change 同时机触发 */
    (e: "changing", value: number | number[]): void;
}>();

const b = tv(theme);

const {
    disabled: fieldGroupDisabled,
    size: fieldGroupSize,
    isError,
} = useFormInject(props);

/**
 * 整体禁用：表单注入禁用或 disabled 传布尔 true。
 * 注意必须用 === true 判断：disabled 传数组（单柄禁用）时数组本身是真值，
 * useFormInject 会原样透传，直接取真值会把整个组件误判为禁用。
 */
const isDisabled = computed(() => fieldGroupDisabled.value === true || props.disabled === true);
const resolvedSize = computed(() => fieldGroupSize.value || props.size);

/** 单个滑块是否禁用（数组下标对应排序后的节点位置） */
function handleDisabled(index: number): boolean {
    if (isDisabled.value) return true;
    return Array.isArray(props.disabled) ? !!props.disabled[index] : false;
}

/** 归一化后的刻度列表：过滤非法与越界 key，按值升序 */
const markList = computed(() => {
    if (!props.marks) return [];
    return Object.entries(props.marks)
        .map(([key, raw]) => {
            const val = Number(key);
            const entry = typeof raw === "object" && raw !== null ? raw : { label: raw };
            return { value: val, label: entry.label ?? key, style: entry.style };
        })
        .filter(m => Number.isFinite(m.value) && m.value >= props.min && m.value <= props.max)
        .sort((a, b2) => a.value - b2.value);
});

/** 刻度值序列（升序），step="mark" 的吸附与相邻跳转都基于它 */
const markValues = computed(() => markList.value.map(m => m.value));

/** 间断点位置：仅数字步长时有效；点数过多（>100）时不渲染，避免 DOM 爆炸 */
const stopValues = computed(() => {
    if (!props.showStops || typeof props.step !== "number" || props.step <= 0) return [];
    const count = Math.floor((props.max - props.min) / props.step) - 1;
    if (count <= 0 || count > 100) return [];
    const list: number[] = [];
    for (let i = 1; i <= count; i++) {
        list.push(props.min + i * props.step);
    }
    return list;
});

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
    const styles = b({
        size: resolvedSize.value,
        color: props.color,
        vertical: props.vertical,
        hasMarks: markList.value.length > 0,
        disabled: isDisabled.value,
        error: isError.value,
    });
    interface ThumbOpts { class?: any; active?: boolean; pressed?: boolean; handleDisabled?: boolean; removing?: boolean }
    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
        track: (opts?: { class?: any }) => styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
        progress: (opts?: { class?: any }) => styles.progress({ class: cn(opts?.class, uiOverrides.value.progress) }),
        // 激活 / 单柄禁用 / 删除预览态在调用处按滑块逐个传入，覆盖组合变体
        thumb: (opts?: ThumbOpts) =>
            styles.thumb({
                active: opts?.active ?? true,
                pressed: opts?.pressed ?? false,
                handleDisabled: opts?.handleDisabled ?? false,
                removing: opts?.removing ?? false,
                class: cn(opts?.class, uiOverrides.value.thumb),
            }),
        thumbDot: (opts?: ThumbOpts) =>
            styles.thumbDot({
                active: opts?.active ?? true,
                handleDisabled: opts?.handleDisabled ?? false,
                class: cn(opts?.class, uiOverrides.value.thumbDot),
            }),
        stopDot: (opts?: { class?: any }) => styles.stopDot({ class: cn(opts?.class, uiOverrides.value.stopDot) }),
        markDot: (opts?: { class?: any }) => styles.markDot({ class: cn(opts?.class, uiOverrides.value.markDot) }),
        markLabel: (opts?: { class?: any }) => styles.markLabel({ class: cn(opts?.class, uiOverrides.value.markLabel) }),
        tooltip: (opts?: { class?: any }) => styles.tooltip({ class: cn(opts?.class, uiOverrides.value.tooltip) }),
        prefix: (opts?: { class?: any }) => styles.prefix({ class: cn(opts?.class, uiOverrides.value.prefix) }),
        suffix: (opts?: { class?: any }) => styles.suffix({ class: cn(opts?.class, uiOverrides.value.suffix) }),
        value: (opts?: { class?: any }) => styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
    };
});

const value = ref(props.modelValue);
/** range 模式的节点数组，始终保持升序 */
const rangeValue = ref([...props.values]);
const trackRef = ref<HTMLElement | null>(null);
const innerRef = ref<HTMLElement | null>(null);
const thumbRefs = ref<(HTMLElement | null)[]>([]);
/** 激活节点下标：默认最右侧，此后跟随用户最近一次按下的滑块 */
const activeThumbIndex = ref(Math.max(0, props.values.length - 1));
/** 是否处于拖拽中：用显式状态而非 e.buttons，后者在部分浏览器的捕获移动事件里不可靠 */
const dragging = ref(false);
/** 是否处于选区整体平移中（draggableTrack） */
const trackDragging = ref(false);
/** 选区平移的锚点值与起始节点快照 */
let trackDragStartValue = 0;
let trackDragBaseNodes: number[] = [];
/** 可编辑模式下正被拖离滑轨的节点下标，松手即删除；拖回则恢复 */
const removingIndex = ref<number | null>(null);
/** 本轮按键交互是否改过值，松键时据此触发 changeComplete */
const keyboardDirty = ref(false);

/** 按下位置距滑块中心多少像素内算「抓住滑块」 */
const GRAB_THRESHOLD = 12;
/** 垂直于滑轨方向拖离多少像素进入删除预览 */
const REMOVE_DISTANCE = 40;

function setThumbRef(el: any, index: number) {
    thumbRefs.value[index] = (el as HTMLElement) ?? null;
}

/** 激活滑块的外径，即交互带厚度（色晕不占布局空间，越界部分直接溢出绘制） */
const thumbSize = computed(() => {
    switch (resolvedSize.value) {
        case "sm": return 12;
        case "lg": return 16;
        default: return 14;
    }
});

/** 交互带厚度取滑块外径（色晕溢出不占位），长度水平自适应、垂直取 height */
const innerStyle = computed(() => {
    const thickness = `${thumbSize.value}px`;
    if (props.vertical) {
        const h = typeof props.height === "number" ? `${props.height}px` : (props.height || "200px");
        return { width: thickness, height: h };
    }
    return { height: thickness };
});

function toPct(val: number) {
    return ((val - props.min) / (props.max - props.min)) * 100;
}

/**
 * 值百分比 → 距定位起始边的显示百分比。
 * 水平以 left 定位（正向 min 在左），垂直以 top 定位（正向 min 在下），reverse 时各自翻转。
 */
function toDisplayPct(pctVal: number) {
    const fromStart = props.vertical ? 100 - pctVal : pctVal;
    return props.reverse ? 100 - fromStart : fromStart;
}

const percentage = computed(() => {
    if (props.range) return 0;
    return toPct(value.value);
});

const nodePercentages = computed(() => rangeValue.value.map(toPct));

/** 进度条覆盖选区（单滑块从 min 端到当前值），换算成显示轴上的起点与长度 */
const progressStyle = computed(() => {
    const startPct = props.range ? (nodePercentages.value[0] ?? 0) : 0;
    const endPct = props.range
        ? (nodePercentages.value[nodePercentages.value.length - 1] ?? 0)
        : percentage.value;
    const d1 = toDisplayPct(startPct);
    const d2 = toDisplayPct(endPct);
    const start = Math.min(d1, d2);
    const size = Math.abs(d2 - d1);
    return props.vertical
        ? { top: `${start}%`, height: `${size}%` }
        : { left: `${start}%`, width: `${size}%` };
});

/** 尺寸交由 size × active 变体类控制，这里只负责沿滑轨方向的定位（translate 已居中） */
function thumbStyle(pct: number) {
    const d = toDisplayPct(pct);
    return props.vertical ? { top: `${d}%` } : { left: `${d}%` };
}

const singleThumbStyle = computed(() => thumbStyle(percentage.value));

const displayValue = computed(() => {
    if (props.range) return rangeValue.value.join(" - ");
    return `${value.value}`;
});

/** 气泡内容：formatter 显式传 null 表示隐藏，缺省显示原始值 */
function tooltipContent(val: number): string | number | null {
    const formatter = props.tooltip?.formatter;
    if (formatter === null) return null;
    return formatter ? formatter(val) : val;
}

/** 该滑块是否处于按压拖拽中（整体平移与删除预览不算），色晕据此显示 */
function thumbPressed(index: number): boolean {
    if (!dragging.value || trackDragging.value) return false;
    if (!props.range) return true;
    return activeThumbIndex.value === index && removingIndex.value !== index;
}

/** 气泡可见性：open 强制显隐，缺省仅在拖拽该滑块（非整体平移、非删除预览）时显示 */
function thumbTooltipVisible(index: number): boolean {
    if (tooltipContent(0) === null) return false;
    const open = props.tooltip?.open;
    if (open === true) return true;
    if (open === false) return false;
    if (!props.range) return dragging.value && !trackDragging.value;
    return dragging.value && !trackDragging.value
        && activeThumbIndex.value === index && removingIndex.value !== index;
}

/** 指针坐标（rAF 合帧时只暂存坐标，不持有会被浏览器复用的事件对象） */
interface PointerCoords {
    clientX: number;
    clientY: number;
}

/** 指针坐标 → 滑轨上的值：按轴取坐标，reverse 时翻转，再按 step 量化 */
function calculateValue(e: PointerCoords): number {
    if (!trackRef.value) return props.min ?? 0;
    const rect = trackRef.value.getBoundingClientRect();
    let pct = props.vertical
        ? (rect.height === 0 ? 0 : (rect.bottom - e.clientY) / rect.height)
        : (rect.width === 0 ? 0 : (e.clientX - rect.left) / rect.width);
    if (props.reverse) pct = 1 - pct;
    pct = Math.max(0, Math.min(1, pct));
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    let val = min + pct * (max - min);
    if (props.step === "mark") {
        // 刻度模式：取值吸附到最近刻度
        val = snapToMark(val);
    } else if (typeof props.step === "number" && props.step > 0) {
        val = Math.round((val - min) / props.step) * props.step + min;
    }
    return Math.max(min, Math.min(max, val));
}

/** 吸附到最近的刻度值；未提供有效 marks 时原样返回 */
function snapToMark(val: number): number {
    const values = markValues.value;
    if (!values.length) return val;
    let best = values[0]!;
    for (const v of values) {
        if (Math.abs(v - val) < Math.abs(best - val)) best = v;
    }
    return best;
}

/** 相邻刻度：dir=1 取右侧最近、-1 取左侧最近；没有更多刻度时原地不动 */
function adjacentMark(current: number, dir: number): number {
    const values = markValues.value;
    if (!values.length) return current;
    if (dir > 0) {
        for (const v of values) {
            if (v > current) return v;
        }
        return current;
    }
    for (let i = values.length - 1; i >= 0; i--) {
        if (values[i]! < current) return values[i]!;
    }
    return current;
}

/** 按值距离选出最近的可用滑块（跳过禁用）；距离相等时取靠后的，重合场景点击数值大侧应抓大值滑块 */
function nearestEnabledThumb(touch: number): number {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < rangeValue.value.length; i++) {
        if (handleDisabled(i)) continue;
        const d = Math.abs(touch - rangeValue.value[i]!);
        if (d < bestD || (d === bestD && touch >= rangeValue.value[i]!)) {
            best = i;
            bestD = d;
        }
    }
    return best;
}

function determineActiveThumb(e: PointerCoords): number {
    return nearestEnabledThumb(calculateValue(e));
}

/** 点击刻度文字：单值直接跳转，范围模式移动最近的可用滑块，并视为一次完整交互 */
function onMarkClick(markValue: number) {
    if (isDisabled.value) return;
    if (props.range) {
        const idx = nearestEnabledThumb(markValue);
        if (idx === -1) return;
        activeThumbIndex.value = idx;
        moveActiveThumb(markValue);
    } else {
        updateValue(markValue);
    }
    emitChangeComplete();
}

/** 按像素距离找按下位置正压着的滑块，超出抓取阈值返回 -1 */
function findGrabbableThumb(e: PointerCoords): number {
    if (!trackRef.value) return -1;
    const rect = trackRef.value.getBoundingClientRect();
    const cursor = props.vertical ? e.clientY : e.clientX;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < rangeValue.value.length; i++) {
        if (handleDisabled(i)) continue;
        const d100 = toDisplayPct(toPct(rangeValue.value[i]!)) / 100;
        const px = props.vertical ? rect.top + d100 * rect.height : rect.left + d100 * rect.width;
        const d = Math.abs(cursor - px);
        if (d < bestD || (d === bestD && cursor >= px)) {
            best = i;
            bestD = d;
        }
    }
    return best !== -1 && bestD <= GRAB_THRESHOLD ? best : -1;
}

/**
 * 选区整体平移是否可用：任一滑块被单独禁用即整体不可动（禁用滑块是不可移动边界）；
 * step="mark" 时平移量无法保证所有节点同时落在刻度上，一并禁用。
 */
function canDragTrack(): boolean {
    if (!props.draggableTrack || !props.range || rangeValue.value.length < 2) return false;
    if (props.step === "mark") return false;
    for (let i = 0; i < rangeValue.value.length; i++) {
        if (handleDisabled(i)) return false;
    }
    return true;
}

/** 提交节点数组：写内部状态并向外发 update:values + change（changing 兼容保留） */
function commitNodes(arr: number[]) {
    rangeValue.value = arr;
    emit("update:values", [...arr]);
    emit("change", [...arr]);
    emit("changing", [...arr]);
}

function updateValue(newValue: number) {
    if (value.value !== newValue) {
        const minVal = props.min ?? 0;
        const maxVal = props.max ?? 100;
        value.value = Math.max(minVal, Math.min(maxVal, newValue));
        emit("update:modelValue", newValue);
        emit("change", newValue);
        emit("changing", newValue);
    }
}

function emitChangeComplete() {
    emit("changeComplete", props.range ? [...rangeValue.value] : value.value);
}

/**
 * 移动激活节点：
 * 1. 先按左右最近的禁用节点钳制取值——禁用滑块是移动边界，任何滑块无法越过；
 * 2. 越过普通相邻节点时把改动值冒泡到正确的排序位置，激活下标跟着换位，
 *    否则继续拖动时移动的是错误的滑块（表现为「不跟手」）。
 */
function moveActiveThumb(raw: number) {
    const idx = activeThumbIndex.value;
    if (idx < 0 || handleDisabled(idx)) return;

    let lo = props.min;
    let hi = props.max;
    for (let j = 0; j < rangeValue.value.length; j++) {
        if (j === idx || !handleDisabled(j)) continue;
        if (j < idx) lo = Math.max(lo, rangeValue.value[j]!);
        else hi = Math.min(hi, rangeValue.value[j]!);
    }
    const val = Math.max(lo, Math.min(hi, raw));
    if (val === rangeValue.value[idx]) return;

    const arr = [...rangeValue.value];
    arr[idx] = val;
    let ni = idx;
    while (ni > 0 && arr[ni]! < arr[ni - 1]!) {
        [arr[ni], arr[ni - 1]] = [arr[ni - 1]!, arr[ni]!];
        ni--;
    }
    while (ni < arr.length - 1 && arr[ni]! > arr[ni + 1]!) {
        [arr[ni], arr[ni + 1]] = [arr[ni + 1]!, arr[ni]!];
        ni++;
    }
    activeThumbIndex.value = ni;
    commitNodes(arr);
}

/** 在点击位置插入新节点并立即激活、聚焦（便于随后按键删除） */
function addNode(val: number) {
    const arr = [...rangeValue.value];
    let idx = arr.findIndex(n => n > val);
    if (idx === -1) idx = arr.length;
    arr.splice(idx, 0, val);
    activeThumbIndex.value = idx;
    commitNodes(arr);
    nextTick(() => thumbRefs.value[idx]?.focus());
}

/** 删除节点（至少保留一个），并收敛激活下标；changeComplete 由交互结束方（松指针/松按键）触发 */
function removeNode(index: number) {
    if (rangeValue.value.length <= 1) return;
    const arr = [...rangeValue.value];
    arr.splice(index, 1);
    commitNodes(arr);
    activeThumbIndex.value = Math.min(activeThumbIndex.value, arr.length - 1);
}

function onThumbKeydown(e: KeyboardEvent, index: number) {
    if (isDisabled.value) return;

    // 方向键步进：→/↑ 增、←/↓ 减；reverse 时视觉方向不变、数值方向翻转
    let dir = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") dir = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") dir = -1;
    if (dir !== 0) {
        if (props.reverse) dir = -dir;
        e.preventDefault();
        const current = props.range ? rangeValue.value[index]! : value.value;
        // step="mark" 时跳到相邻刻度，否则按数字步长步进
        const target = props.step === "mark"
            ? adjacentMark(current, dir)
            : current + dir * (typeof props.step === "number" && props.step > 0 ? props.step : 1);
        if (props.range) {
            if (handleDisabled(index)) return;
            activeThumbIndex.value = index;
            moveActiveThumb(target);
        } else {
            updateValue(Math.max(props.min, Math.min(props.max, target)));
        }
        keyboardDirty.value = true;
        return;
    }

    if (!props.editable || !props.range || handleDisabled(index)) return;
    if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeNode(index);
        keyboardDirty.value = true;
    }
}

function onThumbKeyup() {
    if (!keyboardDirty.value) return;
    keyboardDirty.value = false;
    emitChangeComplete();
}

function onPointerDown(e: PointerEvent) {
    if (isDisabled.value) return;
    e.preventDefault();
    // 捕获指针：拖出交互带甚至窗口后 move / up 仍会派发到本元素
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const val = calculateValue(e);
    if (props.range) {
        const grabbed = findGrabbableThumb(e);
        if (grabbed !== -1) {
            dragging.value = true;
            activeThumbIndex.value = grabbed;
            thumbRefs.value[grabbed]?.focus();
        } else if (
            canDragTrack()
            && val >= rangeValue.value[0]!
            && val <= rangeValue.value[rangeValue.value.length - 1]!
        ) {
            // 按在选区内且没压着滑块：整体平移选区
            dragging.value = true;
            trackDragging.value = true;
            trackDragStartValue = val;
            trackDragBaseNodes = [...rangeValue.value];
        } else if (props.editable) {
            // 没按在滑块上：在点击位置添加节点并直接进入拖拽
            dragging.value = true;
            addNode(val);
        } else {
            const idx = determineActiveThumb(e);
            if (idx === -1) return; // 所有滑块都被禁用
            dragging.value = true;
            activeThumbIndex.value = idx;
            moveActiveThumb(val);
        }
    } else {
        dragging.value = true;
        updateValue(val);
    }
}

/** 处理一次指针移动（已合帧）：整体平移 → 删除预览 → 常规拖动 */
function processMove(e: PointerCoords) {
    // 选区整体平移：位移量对首尾节点双向钳制，节点间距保持不变
    if (trackDragging.value) {
        const val = calculateValue(e);
        let delta = val - trackDragStartValue;
        const first = trackDragBaseNodes[0]!;
        const last = trackDragBaseNodes[trackDragBaseNodes.length - 1]!;
        delta = Math.max(props.min - first, Math.min(props.max - last, delta));
        commitNodes(trackDragBaseNodes.map(n => n + delta));
        return;
    }

    // 可编辑模式：垂直于滑轨方向拖离进入删除预览，拖回则恢复；预览期间冻结取值
    if (props.range && props.editable && rangeValue.value.length > 1 && innerRef.value) {
        const rect = innerRef.value.getBoundingClientRect();
        const off = props.vertical
            ? (e.clientX < rect.left ? rect.left - e.clientX : Math.max(0, e.clientX - rect.right))
            : (e.clientY < rect.top ? rect.top - e.clientY : Math.max(0, e.clientY - rect.bottom));
        removingIndex.value = off > REMOVE_DISTANCE ? activeThumbIndex.value : null;
        if (removingIndex.value !== null) return;
    }

    const val = calculateValue(e);
    if (props.range) {
        moveActiveThumb(val);
    } else {
        updateValue(val);
    }
}

/** rAF 合帧暂存：高刷设备 pointermove 频率高于帧率，逐事件处理会带着页面级重渲染掉帧 */
let pendingMove: PointerCoords | null = null;
let moveRaf = 0;

function onPointerMove(e: PointerEvent) {
    if (!dragging.value) return;
    // 每帧只处理最后一次指针位置；事件对象会被浏览器复用，只留坐标
    pendingMove = { clientX: e.clientX, clientY: e.clientY };
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        if (!pendingMove || !dragging.value) return;
        processMove(pendingMove);
        pendingMove = null;
    });
}

function onPointerUp(e: PointerEvent) {
    if (!dragging.value) return;
    // 结算前先冲刷未处理的合帧移动，保证落点与松手位置一致
    if (moveRaf) {
        cancelAnimationFrame(moveRaf);
        moveRaf = 0;
    }
    if (pendingMove) {
        processMove(pendingMove);
        pendingMove = null;
    }
    dragging.value = false;
    trackDragging.value = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (removingIndex.value !== null) {
        const idx = removingIndex.value;
        removingIndex.value = null;
        removeNode(idx);
    }
    emitChangeComplete();
}

// 拖拽中被卸载时取消未执行的合帧回调，避免向已卸载组件提交
onBeforeUnmount(() => {
    if (moveRaf) {
        cancelAnimationFrame(moveRaf);
        moveRaf = 0;
    }
    pendingMove = null;
});

watch(() => props.modelValue, (v) => { if (v !== value.value) value.value = Math.max(props.min, Math.min(props.max, v)); }, { immediate: true });
watch(() => props.values, (v) => {
    rangeValue.value = v.map(n => Math.max(props.min, Math.min(props.max, n)));
    activeThumbIndex.value = Math.min(activeThumbIndex.value, Math.max(0, v.length - 1));
    thumbRefs.value.length = v.length;
}, { immediate: true });
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })">
    <!-- 起始端业务图标（水平在左、垂直在上） -->
    <slot name="prefix">
      <span v-if="prefixIcon" :class="ui.prefix()">
        <Icon :name="prefixIcon" />
      </span>
    </slot>

    <!-- 指针事件绑在整个交互带上：滑块比轨道条粗，按在滑块任意位置都要能命中 -->
    <div
      ref="innerRef" :class="ui.inner()" :style="innerStyle" @pointerdown="onPointerDown"
      @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp"
    >
      <div ref="trackRef" :class="ui.track()">
        <div :class="ui.progress()" :style="progressStyle" />
        <!-- 间断点：按步长撒点 -->
        <div
          v-for="v in stopValues" :key="`stop-${v}`" :class="ui.stopDot()"
          :style="thumbStyle(toPct(v))"
        />
        <!-- 刻度点：位置与滑块共用显示轴换算 -->
        <div
          v-for="m in markList" :key="`dot-${m.value}`" :class="ui.markDot()"
          :style="thumbStyle(toPct(m.value))"
        />
      </div>

      <!-- 刻度文字：单个标记的 style 以内联样式叠加；截停 pointerdown 避免触发轨道拖拽，点击精确跳转 -->
      <div
        v-for="m in markList" :key="`label-${m.value}`" :class="ui.markLabel()"
        :style="[thumbStyle(toPct(m.value)), m.style ?? {}]" @pointerdown.stop
        @click.stop="onMarkClick(m.value)"
      >
        {{ m.label }}
      </div>

      <!-- 单滑块：恒为激活态，可聚焦以支持方向键步进 -->
      <template v-if="!range">
        <slot name="thumb" :value="{ value: displayValue, style: singleThumbStyle }">
          <div
            :ref="(el) => setThumbRef(el, 0)" :class="ui.thumb({ pressed: thumbPressed(0) })" :style="singleThumbStyle"
            :tabindex="isDisabled ? undefined : 0" @keydown="onThumbKeydown($event, 0)" @keyup="onThumbKeyup"
          >
            <div :class="ui.thumbDot()" />
            <div v-if="thumbTooltipVisible(0)" :class="ui.tooltip()">{{ tooltipContent(value) }}</div>
          </div>
        </slot>
      </template>

      <!-- 多滑块：最近一次按下的为激活态（默认最右侧），未激活的小一号且无色晕；
           可聚焦以支持方向键步进，editable 时按 Delete / Backspace 删除 -->
      <template v-if="range">
        <div
          v-for="(pct, i) in nodePercentages" :key="i" :ref="(el) => setThumbRef(el, i)" :class="ui.thumb({
            active: i === activeThumbIndex && !handleDisabled(i),
            pressed: thumbPressed(i),
            handleDisabled: handleDisabled(i),
            removing: removingIndex === i,
          })" :style="thumbStyle(pct)" :tabindex="handleDisabled(i) ? undefined : 0"
          @keydown="onThumbKeydown($event, i)" @keyup="onThumbKeyup"
        >
          <div
            :class="ui.thumbDot({
              active: i === activeThumbIndex && !handleDisabled(i),
              handleDisabled: handleDisabled(i),
            })"
          />
          <div v-if="thumbTooltipVisible(i)" :class="ui.tooltip()">{{ tooltipContent(rangeValue[i]!) }}</div>
        </div>
      </template>
    </div>

    <!-- 末尾端业务图标（水平在右、垂直在下） -->
    <slot name="suffix">
      <span v-if="suffixIcon" :class="ui.suffix()">
        <Icon :name="suffixIcon" />
      </span>
    </slot>

    <slot name="value" :value="displayValue">
      <span v-if="showValue" :class="ui.value()">{{ displayValue }}</span>
    </slot>
  </div>
</template>
