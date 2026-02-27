<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { sliderColors, sliderSizes } from "./reborn-slider.config";
import { tv } from "~/lib/tv";

const b = tv(theme);

export interface SliderProps {
    modelValue?: number;
    values?: number[];
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    showValue?: boolean;
    range?: boolean;
    size?: (typeof sliderSizes)[number];
    color?: (typeof sliderColors)[number];
    class?: any;
    ui?: Partial<{
        wrapper: ClassValue;
        inner: ClassValue;
        track: ClassValue;
        progress: ClassValue;
        thumb: ClassValue;
        thumbActive: ClassValue;
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
    showValue: false,
    range: false,
    size: "md",
    color: "primary",
});

const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
    (e: "update:values", value: number[]): void;
    (e: "change", value: number | number[]): void;
    (e: "changing", value: number | number[]): void;
}>();

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
    const styles = b({ size: props.size, color: props.color, disabled: props.disabled });
    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
        track: (opts?: { class?: any }) => styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
        progress: (opts?: { class?: any }) => styles.progress({ class: cn(opts?.class, uiOverrides.value.progress) }),
        thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
        thumbActive: (opts?: { class?: any }) => styles.thumbActive({ class: cn(opts?.class, uiOverrides.value.thumbActive) }),
        value: (opts?: { class?: any }) => styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
    };
});

const value = ref(props.modelValue);
const rangeValue = ref([...props.values]);
const trackRef = ref<HTMLElement | null>(null);
const activeThumbIndex = ref(0);

const blockSize = computed(() => {
    switch (props.size) {
        case "sm": return 16;
        case "lg": return 24;
        default: return 20;
    }
});

const percentage = computed(() => {
    if (props.range) return 0;
    return ((value.value - props.min) / (props.max - props.min)) * 100;
});

const rangePercentage = computed(() => {
    if (!props.range) return { min: 0, max: 0 };
    const range = props.max - props.min;
    return {
        min: ((rangeValue.value[0] - props.min) / range) * 100,
        max: ((rangeValue.value[1] - props.min) / range) * 100,
    };
});

const progressStyle = computed(() => {
    if (props.range) {
        return {
            left: `${rangePercentage.value.min}%`,
            width: `${rangePercentage.value.max - rangePercentage.value.min}%`,
        };
    }
    return { left: "0%", width: `${percentage.value}%` };
});

function thumbStyle(pct: number) {
    return {
        left: `calc(${pct}% - ${blockSize.value / 2}px)`,
        width: `${blockSize.value}px`,
        height: `${blockSize.value}px`,
    };
}

const singleThumbStyle = computed(() => thumbStyle(percentage.value));
const minThumbStyle = computed(() => thumbStyle(rangePercentage.value.min));
const maxThumbStyle = computed(() => thumbStyle(rangePercentage.value.max));

const displayValue = computed(() => {
    if (props.range) return `${rangeValue.value[0]} - ${rangeValue.value[1]}`;
    return `${value.value}`;
});

function calculateValue(clientX: number): number {
    if (!trackRef.value) return props.min;
    const rect = trackRef.value.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let val = props.min + pct * (props.max - props.min);
    if (props.step > 0) {
        val = Math.round((val - props.min) / props.step) * props.step + props.min;
    }
    return Math.max(props.min, Math.min(props.max, val));
}

function determineActiveThumb(clientX: number): number {
    if (!props.range) return 0;
    const touchValue = calculateValue(clientX);
    const d0 = Math.abs(touchValue - rangeValue.value[0]);
    const d1 = Math.abs(touchValue - rangeValue.value[1]);
    return d0 <= d1 ? 0 : 1;
}

function updateValue(newValue: number | number[]) {
    if (props.range) {
        const arr = newValue as number[];
        const sorted = [Math.min(arr[0], arr[1]), Math.max(arr[0], arr[1])];
        rangeValue.value = sorted;
        emit("update:values", sorted);
        emit("changing", sorted);
    } else {
        const n = newValue as number;
        if (value.value !== n) {
            value.value = n;
            emit("update:modelValue", n);
            emit("changing", n);
        }
    }
}

function onPointerDown(e: PointerEvent) {
    if (props.disabled) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const val = calculateValue(e.clientX);
    if (props.range) {
        activeThumbIndex.value = determineActiveThumb(e.clientX);
        const updated = [...rangeValue.value];
        updated[activeThumbIndex.value] = val;
        updateValue(updated);
    } else {
        updateValue(val);
    }
}

function onPointerMove(e: PointerEvent) {
    if (props.disabled || !e.buttons) return;
    const val = calculateValue(e.clientX);
    if (props.range) {
        const updated = [...rangeValue.value];
        updated[activeThumbIndex.value] = val;
        updateValue(updated);
    } else {
        updateValue(val);
    }
}

function onPointerUp() {
    if (props.disabled) return;
    emit("change", props.range ? rangeValue.value : value.value);
}

watch(() => props.modelValue, (v) => { if (v !== value.value) value.value = Math.max(props.min, Math.min(props.max, v)); }, { immediate: true });
watch(() => props.values, (v) => { rangeValue.value = v.map(n => Math.max(props.min, Math.min(props.max, n))); }, { immediate: true });
</script>

<template>
    <div :class="ui.wrapper({ class: props.class })">
        <div :class="ui.inner()" :style="{ height: `${blockSize + 4}px` }">
            <div ref="trackRef" :class="ui.track()" @pointerdown="onPointerDown" @pointermove="onPointerMove"
                @pointerup="onPointerUp" @pointercancel="onPointerUp">
                <div :class="ui.progress()" :style="progressStyle" />
            </div>

            <!-- Single thumb -->
            <template v-if="!range">
                <slot name="thumb" :value="{ value: displayValue, style: singleThumbStyle }">
                    <div :class="ui.thumb()" :style="singleThumbStyle" />
                </slot>
            </template>

            <!-- Range thumbs -->
            <template v-if="range">
                <div :class="[ui.thumb(), ui.thumbActive()]" :style="minThumbStyle" />
                <div :class="[ui.thumb(), ui.thumbActive()]" :style="maxThumbStyle" />
            </template>
        </div>

        <slot name="value" :value="displayValue">
            <span v-if="showValue" :class="ui.value()">{{ displayValue }}</span>
        </slot>
    </div>
</template>
