<template>
    <view class="re-form-item" :class="ui.root({ class: customClass })">
        <view v-if="label || $slots.label" :class="ui.label()" :style="labelStyle">
            <slot name="label">
                <text v-if="required && requireAsteriskPosition === 'left'" class="text-red-500 mr-1">*</text>
                {{ label }}
                <text v-if="required && requireAsteriskPosition === 'right'" class="text-red-500 ml-1">*</text>
            </slot>
        </view>

        <view :class="ui.wrapper()">
            <view :class="ui.content()">
                <slot></slot>
            </view>

            <view v-if="error" :class="ui.error()">
                {{ error }}
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, provide, type PropType } from 'vue';
import type { ClassValue } from "clsx";
import { tv } from "@/lib/tv";
import { cn } from "@/lib/utils";
import theme, { formItemLabelPositions } from "./reborn-form-item.config";
import { useFieldGroupItem } from '@/composables/useFieldGroup';

defineOptions({
    name: 're-form-item'
});

export interface FormItemProps {
    prop?: string;
    label?: string;
    required?: boolean;
    requireAsteriskPosition?: 'left' | 'right'; // 标签位置
    labelWidth?: string | number; // 标签宽度
    labelPosition?: typeof formItemLabelPositions[number]; // 标签位置
    trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'>; // 触发验证
    customClass?: ClassValue;
    ui?: Partial<{
        root: ClassValue;
        label: ClassValue;
        wrapper: ClassValue;
        content: ClassValue;
        error: ClassValue;
    }>;
}

const props = withDefaults(defineProps<FormItemProps>(), {
    prop: "",
    label: "",
    customClass: "",
    required: false,
    requireAsteriskPosition: 'right',
});


const {
    error,
    labelPosition,
    labelWidth,
    size,
    getBoundingClientRect,
    validate
} = useFieldGroupItem({
    prop: props.prop,
    labelPosition: props.labelPosition,
    labelWidth: props.labelWidth,
    trigger: props.trigger
});

provide('rebornFormItem', {
    isError: computed(() => !!error.value),
    validate
});

const labelStyle = computed(() => {
    return {
        width: labelWidth.value
    };
});

// Configure Component Styles
const b = tv(theme);
const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        error: !!error.value,
        labelPosition: labelPosition.value as any, // Cast to match config variants
        size: size.value as any
    });
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
        error: (opts?: { class?: any }) => styles.error({ class: cn(opts?.class, uiOverrides.value.error) }),
    };
});

defineExpose({
    prop: props.prop,
    getBoundingClientRect
});
</script>
