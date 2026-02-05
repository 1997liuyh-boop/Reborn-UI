<template>
    <view :class="ui.wrapper({ class: props.customClass })" :data-disabled="fieldGroupDisabled">
        <view :class="ui.button()" @touchstart="onMinus" @touchend="longPress.stop" @touchcancel="longPress.stop">
            <slot name="decrease-icon">
                <view :class="ui.icon()" class="i-lucide-minus" />
            </slot>
        </view>

        <view :class="ui.divider()" />

        <input :class="ui.input()" :type="inputType" :value="value" :disabled="fieldGroupDisabled" :readonly="!readonly"
            :placeholder="placeholder" @input="onInput" @blur="onBlur" />

        <view :class="ui.divider()" />

        <view :class="ui.button()" @touchstart="onPlus" @touchend="longPress.stop" @touchcancel="longPress.stop">
            <slot name="increase-icon">
                <view :class="ui.icon()" class="i-lucide-plus" />
            </slot>
        </view>
    </view>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, useAttrs, toRef } from "vue";
import type { ClassValue } from "clsx";
import theme, { inputNumberColors, inputNumberSizes, inputNumberShapes } from "./reborn-input-number.config";

import { useFormInject } from "@/composables/useFieldGroup";
import { useLongPress } from "./long-press";
import { cn } from "@/lib/utils";
import { tv } from "@/lib/tv";

defineOptions({
    name: "re-input-number",
    inheritAttrs: false
});

export interface InputNumberProps {
    modelValue?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    size?: typeof inputNumberSizes[number];
    color?: typeof inputNumberColors[number];
    shape?: typeof inputNumberShapes[number];
    ui?: Partial<{
        wrapper: ClassValue;
        button: ClassValue;
        input: ClassValue;
        divider: ClassValue;
        icon: ClassValue;
    }>;
    readonly?: boolean;
    placeholder?: string;
    inputType?: "digit" | "number";
    customClass?: any;
}

const props = withDefaults(defineProps<InputNumberProps>(), {
    modelValue: 0,
    defaultValue: 0,
    min: 0,
    max: 200,
    step: 1,
    disabled: false,
    ui: () => ({}),
    size: "md",
    color: "primary",
    shape: "square",
    placeholder: "",
    inputType: "number",
    readonly: true,
});

const emit = defineEmits(["update:modelValue", "change", "input", "blur", "focus"]);

const longPress = useLongPress();
const { orientation, size: fieldGroupSize, disabled: fieldGroupDisabled } = useFormInject(props);

const uiOverrides = computed(() => props.ui || {});
const b = tv(theme);
const size = toRef(props, "size");
const ui = computed(() => {
    const styles = b({
        size: (fieldGroupSize.value || size.value) as any,
        color: props.color,
        shape: props.shape,
        fieldGroup: orientation.value,
    })

    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        button: (opts?: { class?: any }) => styles.button({ class: cn(opts?.class, uiOverrides.value.button) }),
        input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
        divider: (opts?: { class?: any }) => styles.divider({ class: cn(opts?.class, uiOverrides.value.divider) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    };
});

const value = ref(props.modelValue);

const isPlus = computed(() => !fieldGroupDisabled.value && value.value < props.max);
const isMinus = computed(() => !fieldGroupDisabled.value && value.value > props.min);

function update() {
    nextTick(() => {
        let val = value.value;

        if (val < props.min) val = props.min;
        if (val > props.max) val = props.max;
        if (props.min > props.max) val = props.max;

        if (props.inputType == "digit") {
            val = parseFloat(val.toFixed(2));
        }

        value.value = val;

        if (val != props.modelValue) {
            emit("update:modelValue", val);
            emit("change", val);
        }
    });
}

function onInput(e: any) {
    const val = parseFloat(e.detail.value);
    if (!isNaN(val)) {
        // We update local value but don't force emit update:modelValue instantly 
        // to allow typing (e.g. typing "10" not being clamped to max "5" immediately if undesired)
        // However, for strict input number checks, we might want to clamp or just update local ref.
        value.value = val;
    }
    emit("input", e);
}

function onPlus() {
    if (fieldGroupDisabled.value || !isPlus.value) return;

    longPress.start(() => {
        if (isPlus.value) {
            const val = props.max - value.value;
            value.value += val > props.step ? props.step : val;
            update();
        }
    });
}

function onMinus() {
    if (fieldGroupDisabled.value || !isMinus.value) return;

    longPress.start(() => {
        if (isMinus.value) {
            const val = value.value - props.min;
            value.value -= val > props.step ? props.step : val;
            update();
        }
    });
}

function onBlur(e: any) {
    if (e.detail.value == "") {
        value.value = props.min || 0;
    } else {
        value.value = parseFloat(e.detail.value);
    }
    update();
    emit("blur", e);
}

watch(
    () => props.modelValue,
    (val) => {
        if (val !== undefined && val !== value.value) {
            value.value = val;
        }
    },
    { immediate: true }
);

watch(() => props.max, update);
watch(() => props.min, update);
</script>
