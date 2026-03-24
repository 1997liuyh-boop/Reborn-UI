<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { selectColors, selectSizes, selectAnimations } from "./reborn-select.config";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

export interface SelectOption {
    label: string;
    value: any;
    disabled?: boolean;
    [key: string]: any;
}

export interface SelectProps {
    modelValue?: any;
    multiple?: boolean;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    size?: (typeof selectSizes)[number];
    color?: (typeof selectColors)[number];
    class?: any;
    ui?: Partial<{
        wrapper: ClassValue;
        trigger: ClassValue;
        triggerText: ClassValue;
        placeholder: ClassValue;
        arrow: ClassValue;
        dropdown: ClassValue;
        option: ClassValue;
        optionActive: ClassValue;
        optionHighlight: ClassValue;
        empty: ClassValue;
        clearBtn: ClassValue;
    }>;
}

const props = withDefaults(defineProps<SelectProps>(), {
    modelValue: null,
    multiple: false,
    options: () => [],
    placeholder: "请选择",
    disabled: false,
    clearable: true,
    size: "md",
    color: "primary",
});

const emit = defineEmits<{
    (e: "update:modelValue", value: any): void;
    (e: "change", value: any): void;
}>();

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const highlightIndex = ref(-1);

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
    const styles = b({
        size: props.size,
        color: props.color,
        open: isOpen.value,
        disabled: props.disabled,
    });
    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        trigger: (opts?: { class?: any }) => styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
        triggerText: (opts?: { class?: any }) => styles.triggerText({ class: cn(opts?.class, uiOverrides.value.triggerText) }),
        placeholder: (opts?: { class?: any }) => styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
        arrow: (opts?: { class?: any }) => styles.arrow({ class: cn(opts?.class, uiOverrides.value.arrow) }),
        dropdown: (opts?: { class?: any }) => styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
        option: (opts?: { class?: any }) => styles.option({ class: cn(opts?.class, uiOverrides.value.option) }),
        optionActive: (opts?: { class?: any }) => styles.optionActive({ class: cn(opts?.class, uiOverrides.value.optionActive) }),
        optionHighlight: (opts?: { class?: any }) => styles.optionHighlight({ class: cn(opts?.class, uiOverrides.value.optionHighlight) }),
        empty: (opts?: { class?: any }) => styles.empty({ class: cn(opts?.class, uiOverrides.value.empty) }),
        clearBtn: (opts?: { class?: any }) => styles.clearBtn({ class: cn(opts?.class, uiOverrides.value.clearBtn) }),
    };
});

const isSelected = (value: any) => {
    if (props.multiple && Array.isArray(props.modelValue)) {
        return props.modelValue.includes(value);
    }
    return value === props.modelValue;
};

const selectedOptions = computed(() => {
    if (props.multiple && Array.isArray(props.modelValue)) {
        return props.options.filter(o => props.modelValue.includes(o.value));
    }
    const opt = props.options.find(o => o.value === props.modelValue);
    return opt ? [opt] : [];
});

const displayText = computed(() => selectedOptions.value.map(o => o.label).join(', ') || "");

function toggle() {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value && !props.multiple) {
        highlightIndex.value = props.options.findIndex((o) => o.value === props.modelValue);
        nextTick(() => scrollToActive());
    }
}

function selectOption(option: SelectOption) {
    if (option.disabled) return;

    if (props.multiple) {
        const newValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        const index = newValue.indexOf(option.value);
        if (index > -1) {
            newValue.splice(index, 1);
        } else {
            newValue.push(option.value);
        }
        emit("update:modelValue", newValue);
        emit("change", newValue);
    } else {
        emit("update:modelValue", option.value);
        emit("change", option.value);
        isOpen.value = false;
    }
}

function clear(e: Event) {
    e.stopPropagation();
    const newValue = props.multiple ? [] : null;
    emit("update:modelValue", newValue);
    emit("change", newValue);
}

function onClickOutside(e: MouseEvent) {
    if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
}

function onKeydown(e: KeyboardEvent) {
    if (!isOpen.value) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
        }
        return;
    }

    switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            highlightIndex.value = Math.min(highlightIndex.value + 1, props.options.length - 1);
            break;
        case "ArrowUp":
            e.preventDefault();
            highlightIndex.value = Math.max(highlightIndex.value - 1, 0);
            break;
        case "Enter":
        case " ":
            e.preventDefault();
            if (highlightIndex.value >= 0 && highlightIndex.value < props.options.length) {
                const opt = props.options[highlightIndex.value];
                if (opt) selectOption(opt);
            }
            break;
        case "Escape":
            e.preventDefault();
            isOpen.value = false;
            break;
    }
}

function scrollToActive() {
    if (dropdownRef.value && highlightIndex.value >= 0) {
        const el = dropdownRef.value.children[highlightIndex.value] as HTMLElement;
        el?.scrollIntoView?.({ block: "nearest" });
    }
}

watch(highlightIndex, () => nextTick(scrollToActive));

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
    <div ref="wrapperRef" :class="ui.wrapper({ class: props.class })" @keydown="onKeydown" tabindex="0">
        <div :class="ui.trigger()" @click="toggle" :data-state="isOpen ? 'open' : 'closed'">
            <span v-if="displayText" :class="ui.triggerText()">{{ displayText }}</span>
            <span v-else :class="ui.placeholder()">{{ placeholder }}</span>

            <div class="flex items-center gap-1">
                <span v-if="clearable && (multiple ? modelValue?.length > 0 : modelValue != null)"
                    :class="ui.clearBtn()" @click="clear">
                    <Icon name="lucide:x" class="size-full" />
                </span>
                <Icon v-else name="lucide:chevron-down" :class="ui.arrow()" />
            </div>
        </div>

        <Transition :enter-active-class="selectAnimations.enterActiveClass"
            :enter-from-class="selectAnimations.enterFromClass" :enter-to-class="selectAnimations.enterToClass"
            :leave-active-class="selectAnimations.leaveActiveClass" :leave-from-class="selectAnimations.leaveFromClass"
            :leave-to-class="selectAnimations.leaveToClass">
            <div v-if="isOpen" ref="dropdownRef" :class="ui.dropdown()">
                <div v-for="(option, index) in options" :key="index" :class="[
                    ui.option(),
                    isSelected(option.value) ? ui.optionActive() : '',
                    highlightIndex === index ? ui.optionHighlight() : '',
                ]" :data-disabled="option.disabled ? 'true' : 'false'" @click="selectOption(option)"
                    @mouseenter="highlightIndex = index">
                    <slot name="option" :option="option" :active="isSelected(option.value)">
                        <div class="flex w-full items-center justify-between gap-2">
                            <span class="flex-1 truncate">{{ option.label }}</span>
                            <Icon v-if="multiple && isSelected(option.value)" name="lucide:check"
                                class="size-4 opacity-75 shrink-0" />
                        </div>
                    </slot>
                </div>

                <div v-if="options.length === 0" :class="ui.empty()">
                    暂无数据
                </div>
            </div>
        </Transition>
    </div>
</template>
