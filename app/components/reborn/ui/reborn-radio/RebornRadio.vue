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
    activeIcon?: string;
    inactiveIcon?: string;
    showIcon?: boolean;
    class?: any;
    ui?: Partial<{
        root: ClassValue;
        wrapper: ClassValue;
        activeIcon: ClassValue;
        inactiveIcon: ClassValue;
        label: ClassValue;
    }>;
}

const props = withDefaults(defineProps<RadioProps>(), {
    disabled: false,
    size: "md",
    color: "primary",
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
const attrs = useAttrs();

const isChecked = computed(() => {
    if (isGroup.value) {
        return radioGroup.modelValue.value === props.value;
    }
    return props.modelValue === props.value;
});

const computedDisabled = computed(() => isGroup.value ? (radioGroup.disabled.value || props.disabled) : props.disabled);
const computedSize = computed(() => isGroup.value && radioGroup.size?.value ? radioGroup.size.value : props.size);
const computedColor = computed(() => isGroup.value && radioGroup.color?.value ? radioGroup.color.value : props.color);

const showLabel = computed(() => !!props.label || !!slots.default);

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        size: computedSize.value,
        color: computedColor.value,
        disabled: computedDisabled.value,
    });
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        activeIcon: (opts?: { class?: any }) => styles.activeIcon({ class: cn(opts?.class, uiOverrides.value.activeIcon) }),
        inactiveIcon: (opts?: { class?: any }) => styles.inactiveIcon({ class: cn(opts?.class, uiOverrides.value.inactiveIcon) }),
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
            <template v-if="showIcon">
                <slot v-if="isChecked" name="active-icon">
                    <div :class="ui.activeIcon()">
                        <Icon v-if="activeIcon" :name="activeIcon" class="size-full" />
                    </div>
                </slot>
                <slot v-else name="inactive-icon">
                    <div :class="ui.inactiveIcon()">
                        <Icon v-if="inactiveIcon" :name="inactiveIcon" class="size-full" />
                    </div>
                </slot>
            </template>

            <div v-if="showLabel" :class="ui.label()" :data-checked="isChecked">
                <slot :isChecked="isChecked">{{ label }}</slot>
            </div>
        </div>
    </div>
</template>
