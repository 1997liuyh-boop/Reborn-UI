<template>
    <view :class="ui.root({ class: props.customClass })" @tap="onTap" :data-disabled="isDisabled"
        :data-checked="isChecked">
        <view :class="ui.wrapper()">
            <template v-if="showIcon">
                <slot v-if="isChecked" name="active-icon">
                    <view :class="ui.activeIcon()">
                        <view :class="activeIcon"></view>
                    </view>
                </slot>
                <slot v-else name="inactive-icon">
                    <view :class="ui.inactiveIcon()">
                        <view :class="inactiveIcon"></view>
                    </view>
                </slot>
            </template>

            <view v-if="showLabel" :class="ui.label()" :data-checked="isChecked">
                <slot>{{ label }}</slot>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import { tv } from "@/lib/tv";
import { cn } from "@/lib/utils";
import theme, { radioColors, radioSizes } from "./reborn-radio.config";
import { useFormInject } from "@/composables/useFieldGroup";

defineOptions({
    name: "RebornRadio",
    // inheritAttrs: false // Usually good for custom form components, but maybe not if we want standard attributes on root
});

interface Props {
    modelValue?: any;
    value?: any;
    label?: string;
    disabled?: boolean;
    size?: typeof radioSizes[number];
    color?: typeof radioColors[number];
    activeIcon?: string;
    inactiveIcon?: string;
    showIcon?: boolean;
    isRound?: boolean;
    ui?: {
        root?: string;
        wrapper?: string;
        activeIcon?: string;
        inactiveIcon?: string;
        label?: string;
    };
    customClass?: any;
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    size: "md",
    color: "primary",
    activeIcon: "i-lucide-check", // Default checked icon
    inactiveIcon: "", // Default unchecked icon
    showIcon: true,
    isRound: true,
    ui: () => ({}),
});

const emit = defineEmits(["update:modelValue", "change"]);
const slots = useSlots();

// Form Context
const { disabled: formDisabled, size: formSize } = useFormInject(props);

// Computed State
const isDisabled = computed(() => props.disabled || formDisabled.value);
const isChecked = computed(() => props.modelValue === props.value);
const showLabel = computed(() => !!props.label || !!slots.default);

// Styles
const b = tv(theme);
const ui = computed(() => {
    const styles = b({
        size: props.size || formSize.value,
        color: props.color,
        disabled: isDisabled.value,
        isRound: props.isRound,
    });

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.ui?.root) }),
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, props.ui?.wrapper) }),
        activeIcon: (opts?: { class?: any }) => styles.activeIcon({ class: cn(opts?.class, props.ui?.activeIcon) }),
        inactiveIcon: (opts?: { class?: any }) => styles.inactiveIcon({ class: cn(opts?.class, props.ui?.inactiveIcon) }),
        label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, props.ui?.label) }),
    };
});

// Event Handlers
function onTap() {
    if (!isDisabled.value && !isChecked.value) {
        emit("update:modelValue", props.value);
        emit("change", props.value);
    }
}
</script>
