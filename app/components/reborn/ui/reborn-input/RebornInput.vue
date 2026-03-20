<script setup lang="ts">
import { computed, nextTick, ref, toRef, useAttrs, watch } from "vue";
import theme, { inputColors, inputSizes } from "./reborn-input.config";
import { useFieldGroup } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";

const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

export interface InputProps {
  modelValue?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  type?: string;
  size?: typeof inputSizes[number];
  color?: typeof inputColors[number];
  rounded?: boolean;
  border?: boolean;
  password?: boolean;
  clearable?: boolean;
  autofocus?: boolean;
  as?: "input" | "textarea";
  rows?: number;
  class?: any;
}

const props = withDefaults(defineProps<InputProps>(), {
  disabled: false,
  readonly: false,
  type: "text",
  size: "sm",
  color: "neutral",
  rounded: true,
  border: true,
  password: false,
  clearable: false,
  autofocus: false,
  as: "input",
  rows: 4,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
  (e: "clear"): void;
}>();

const attrs = useAttrs();

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const localValue = ref(props.defaultValue ?? "");

// 聚焦状态
const isFocus = ref(props.autofocus);
const isPassword = ref(props.password);

const inputValue = computed(() =>
  props.modelValue !== undefined ? props.modelValue : localValue.value,
);
const isMultiline = computed(() => props.as === "textarea");
const isFilled = computed(() => `${inputValue.value ?? ""}`.length > 0);

const showClear = computed(() => {
  return props.clearable && !props.disabled && !props.readonly && `${inputValue.value}` !== "";
});

const { orientation, size: fieldGroupSize } = useFieldGroup(props);

const size = toRef(props, "size");

const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    fieldGroup: orientation.value,
    multiline: isMultiline.value,
    rounded: props.rounded,
    border: props.border,
    color: props.color,
    focus: isFocus.value,
    hasLeading: !!useSlots().leading,
    hasTrailing: !!useSlots().trailing || showClear.value || props.password,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, props.class) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class) }),
    leading: (opts?: { class?: any }) => styles.leading({ class: cn(opts?.class) }),
    iconBox: (opts?: { class?: any }) => styles.iconBox({ class: cn(opts?.class) }),
    trailing: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class) }),
    clear: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class) }),
    password: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (props.modelValue === undefined) {
    localValue.value = target.value;
  }
  emit("update:modelValue", target.value);
}

function onFocus(e: FocusEvent) {
  isFocus.value = true;
  emit("focus", e);
}

function onBlur(e: FocusEvent) {
  isFocus.value = false;
  emit("blur", e);
}

function clear() {
  if (props.modelValue === undefined) {
    localValue.value = "";
  }
  emit("update:modelValue", "");
  emit("clear");
  nextTick(() => inputRef.value?.focus());
}

function togglePassword() {
  isPassword.value = !isPassword.value;
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value;
    }
  },
);

defineExpose({
  inputRef,
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear,
});
</script>

<template>
  <div :class="ui.wrapper()" :data-disabled="props.disabled" :data-filled="isFilled" @click="inputRef?.focus()">
    <span v-if="$slots.leading" :class="ui.leading()">
      <slot name="leading" :ui="ui" />
    </span>

    <component :is="props.as" ref="inputRef" v-bind="inputAttrs"
      :type="props.as === 'textarea' ? undefined : (isPassword ? 'password' : props.type)"
      :rows="props.as === 'textarea' ? props.rows : undefined" :disabled="props.disabled" :readonly="props.readonly"
      :placeholder="props.placeholder" :value="inputValue" :class="ui.input()" @input="handleInput" @focus="onFocus"
      @blur="onBlur" />

    <div :class="ui.iconBox()" @click.stop>
      <div v-if="showClear" :class="ui.clear()" @click.stop="clear">
        <Icon name="lucide:x-circle" class="size-[1em]" style="width: var(--icon-size); height: var(--icon-size);" />
      </div>

      <div v-if="showClear && (password || $slots.trailing)" :class="ui.separator()" />

      <div v-if="password" :class="ui.password()" @click.stop="togglePassword">
        <Icon :name="isPassword ? 'lucide:eye' : 'lucide:eye-off'" class="size-[1em]"
          style="width: var(--icon-size); height: var(--icon-size);" />
      </div>

      <div v-if="password && $slots.trailing" :class="ui.separator()" />

      <div v-if="$slots.trailing" :class="ui.trailing()">
        <slot name="trailing" :ui="ui" />
      </div>
    </div>
  </div>
</template>
