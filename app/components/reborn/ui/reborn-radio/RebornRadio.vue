<script setup lang="ts">
import { computed, useAttrs, useSlots, inject } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { radioColors, radioSizes } from "./reborn-radio.config";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

export interface RadioProps {
    modelValue?: any;
    value?: any;
    label?: string;
    disabled?: boolean;
    size?: (typeof radioSizes)[number];
    color?: (typeof radioColors)[number];
    variant?: "simple" | "circle";
    activeIcon?: string;
    inactiveIcon?: string;
    showIcon?: boolean;
    class?: any;
    ui?: Partial<{
        root: ClassValue;
        wrapper: ClassValue;
        activeIcon: ClassValue;
        inactiveIcon: ClassValue;
        innerDot: ClassValue;
        label: ClassValue;
    }>;
}

const props = withDefaults(defineProps<RadioProps>(), {
    disabled: false,
    size: "md",
    color: "primary",
    variant: "simple",
    activeIcon: "i-lucide-check",
    inactiveIcon: "",
    showIcon: true,
});

const emit = defineEmits<{
    (e: "update:modelValue", value: any): void;
    (e: "change", value: any): void;
}>();

const radioGroup = inject<any>("RebornRadioGroup", null);
const isGroup = computed(() => !!radioGroup);

const slots = useSlots();

const isChecked = computed(() => {
    if (isGroup.value) {
        return radioGroup.modelValue.value === props.value;
    }
    return props.modelValue === props.value;
});

const computedDisabled = computed(() => isGroup.value ? (radioGroup.disabled.value || props.disabled) : props.disabled);
const computedSize = computed(() => isGroup.value && radioGroup.size?.value ? radioGroup.size.value : props.size);
const computedColor = computed(() => isGroup.value && radioGroup.color?.value ? radioGroup.color.value : props.color);
const computedVariant = computed(() => isGroup.value && radioGroup.variant?.value ? radioGroup.variant.value : props.variant);
const computedActiveIcon = computed(() => isGroup.value && radioGroup.activeIcon?.value !== undefined ? radioGroup.activeIcon.value : props.activeIcon);
const computedInactiveIcon = computed(() => isGroup.value && radioGroup.inactiveIcon?.value !== undefined ? radioGroup.inactiveIcon.value : props.inactiveIcon);
const computedShowIcon = computed(() => isGroup.value && radioGroup.showIcon?.value !== undefined ? radioGroup.showIcon.value : props.showIcon);

const showLabel = computed(() => !!props.label || !!slots.default);

const uiOverrides = computed(() => props.ui || {});

const isError = computed(() => isGroup.value ? !!radioGroup.isError?.value : false);

const ui = computed(() => {
    const styles = b({
        size: computedSize.value,
        color: computedColor.value,
        variant: computedVariant.value,
        checked: isChecked.value,
        disabled: computedDisabled.value,
        error: isError.value,
    });
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        activeIcon: (opts?: { class?: any }) => styles.activeIcon({ class: cn(opts?.class, uiOverrides.value.activeIcon) }),
        inactiveIcon: (opts?: { class?: any }) => styles.inactiveIcon({ class: cn(opts?.class, uiOverrides.value.inactiveIcon) }),
        innerDot: (opts?: { class?: any }) => styles.innerDot({ class: cn(opts?.class, uiOverrides.value.innerDot) }),
        label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
    };
});

function onTap() {
    if (!computedDisabled.value && !isChecked.value) {
        if (isGroup.value) {
            radioGroup.updateValue(props.value);
        } else {
            emit("update:modelValue", props.value);
            emit("change", props.value);
        }
    }
}
</script>

<template>
    <div :class="ui.root({ class: props.class })" :data-disabled="computedDisabled" :data-checked="isChecked"
        @click="onTap">
        <div :class="ui.wrapper()">
            <template v-if="computedShowIcon">
                <slot v-if="isChecked" name="active-icon">
                    <div :class="ui.activeIcon()">
                        <!-- 实心圆点，通过 config 中的 variant 控制显示/隐藏 -->
                        <div :class="ui.innerDot()" />
                        <!-- 勾选图标，仅在非 circle 模式下显示 -->
                        <Icon v-if="computedVariant !== 'circle' && computedActiveIcon" :name="computedActiveIcon"
                            class="size-full" />
                    </div>
                </slot>
                <slot v-else name="inactive-icon">
                    <div :class="ui.inactiveIcon()">
                        <Icon v-if="computedInactiveIcon" :name="computedInactiveIcon" class="size-full" />
                    </div>
                </slot>
            </template>

            <div v-if="showLabel" :class="ui.label()" :data-checked="isChecked">
                <slot :isChecked="isChecked">{{ label }}</slot>
            </div>
        </div>
    </div>
</template>
