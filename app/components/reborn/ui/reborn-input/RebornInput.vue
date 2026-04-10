<script setup lang="ts">
import { computed, nextTick, ref, toRef, useAttrs, useSlots, watch } from "vue";
import theme, { inputColors, inputSizes } from "./reborn-input.config";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";

const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

export interface InputUi {
  wrapper?: string;
  input?: string;
  leading?: string;
  iconBox?: string;
  icon?: string;
  trailing?: string;
  clear?: string;
  password?: string;
  separator?: string;
}

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
  separator?: boolean;
  autofocus?: boolean;
  as?: "input" | "textarea";
  rows?: number;
  class?: any;
  ui?: InputUi;
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
  separator: true,
  autofocus: false,
  as: "input",
  rows: 4,
  ui: () => ({}),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
  (e: "clear"): void;
}>();

const attrs = useAttrs();

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const slots = useSlots();
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

const {
  orientation,
  size: fieldGroupSize,
  disabled: fieldGroupDisabled,
  isError,
  validate
} = useFormInject(props);

const size = toRef(props, "size");

const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    fieldGroup: orientation.value,
    multiline: isMultiline.value,
    rounded: props.rounded || true,
    border: props.border,
    color: props.color,
    focus: isFocus.value,
    error: isError.value,
    hasLeading: !!slots.leading,
    hasTrailing: !!slots.trailing || showClear.value || props.password,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, props.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    leading: (opts?: { class?: any }) => styles.leading({ class: cn(opts?.class, uiOverrides.value.leading) }),
    iconBox: (opts?: { class?: any }) => styles.iconBox({ class: cn(opts?.class, uiOverrides.value.iconBox) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    trailing: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.trailing) }),
    clear: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.clear) }),
    password: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.password) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class, uiOverrides.value.separator) }),
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
  validate('change');
}

function onFocus(e: FocusEvent) {
  isFocus.value = true;
  emit("focus", e);
}

function onBlur(e: FocusEvent) {
  isFocus.value = false;
  emit("blur", e);
  validate('blur');
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
    <span v-if="$slots.leading" :class="ui.leading()" @click.stop>
      <slot name="leading" :ui="ui" />
    </span>

    <component :is="props.as" ref="inputRef" v-bind="inputAttrs"
      :type="props.as === 'textarea' ? undefined : (isPassword ? 'password' : props.type)"
      :rows="props.as === 'textarea' ? props.rows : undefined" :disabled="props.disabled" :readonly="props.readonly"
      :placeholder="props.placeholder" :value="inputValue" :class="ui.input()" @input="handleInput" @focus="onFocus"
      @blur="onBlur" />

    <div :class="ui.iconBox()" @click.stop>
      <Transition name="fade">
        <div v-if="showClear" :class="ui.clear()" @click.stop="clear">
          <Icon name="lucide:x-circle" :class="ui.icon()" />
        </div>
      </Transition>

      <div v-if="separator && showClear && (password || $slots.trailing)" :class="ui.separator()" />

      <div v-if="password" :class="ui.password()" @click.stop="togglePassword">
        <Icon :name="isPassword ? 'lucide:eye' : 'lucide:eye-off'" :class="ui.icon()" />
      </div>

      <div v-if="separator && password && $slots.trailing" :class="ui.separator()" />

      <div v-if="$slots.trailing" :class="ui.trailing()">
        <slot name="trailing" :ui="ui" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
