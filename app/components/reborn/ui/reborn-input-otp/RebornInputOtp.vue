<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { inputOtpColors, inputOtpSizes } from "./reborn-input-otp.config";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-input-otp.config";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputOtpProps>(), {
  modelValue: "",
  autofocus: false,
  length: 4,
  disabled: false,
  inputType: "number",
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "done", value: string): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
}>();

const b = tv(theme);

export interface InputOtpProps {
  modelValue?: string;
  autofocus?: boolean;
  length?: number;
  disabled?: boolean;
  inputType?: "text" | "number";
  size?: (typeof inputOtpSizes)[number];
  color?: (typeof inputOtpColors)[number];
  class?: any;
  ui?: Partial<{
    root: ClassValue;
    inner: ClassValue;
    list: ClassValue;
    item: ClassValue;
    value: ClassValue;
    cursor: ClassValue;
  }>;
}

const inputRef = ref<HTMLInputElement | null>(null);
const isFocus = ref(false);
const value = ref(props.modelValue);

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    color: props.color,
    size: props.size,
    disabled: props.disabled,
  });
  return {
    root: (opts?: { class?: any }) =>
      styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    inner: (opts?: { class?: any }) =>
      styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
    list: (opts?: { class?: any }) =>
      styles.list({ class: cn(opts?.class, uiOverrides.value.list) }),
    item: (opts?: { class?: any }) =>
      styles.item({ class: cn(opts?.class, uiOverrides.value.item) }),
    value: (opts?: { class?: any }) =>
      styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
    cursor: (opts?: { class?: any }) =>
      styles.cursor({ class: cn(opts?.class, uiOverrides.value.cursor) }),
  };
});

const list = computed<string[]>(() => {
  const arr: string[] = [];
  for (let i = 0; i < props.length; i++) {
    arr.push(value.value.charAt(i));
  }
  return arr;
});

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  let val = target.value;
  if (props.inputType === "number") {
    val = val.replace(/\D/g, "");
  }
  val = val.slice(0, props.length);
  value.value = val;
  target.value = val;
  emit("update:modelValue", val);
  if (val.length === props.length) {
    emit("done", val);
    inputRef.value?.blur();
  }
}

function onFocus(e: FocusEvent) {
  isFocus.value = true;
  emit("focus", e);
}

function onBlur(e: FocusEvent) {
  isFocus.value = false;
  emit("blur", e);
}

function onClick() {
  inputRef.value?.focus();
}

onMounted(() => {
  if (props.autofocus) {
    nextTick(() => inputRef.value?.focus());
  }
});

watch(
  () => props.modelValue,
  (val) => {
    value.value = val;
  },
);
</script>

<template>
  <div
    :class="ui.root({ class: props.class })"
    @click="onClick"
  >
    <div :class="ui.inner()">
      <input
        ref="inputRef"
        :value="value"
        :type="inputType === 'number' ? 'tel' : 'text'"
        :maxlength="length"
        :disabled="disabled"
        :autofocus="autofocus"
        autocomplete="one-time-code"
        inputmode="numeric"
        class="h-full w-full opacity-0"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      >
    </div>
    <div :class="ui.list()">
      <div
        v-for="(item, index) in list"
        :key="index"
        :class="ui.item()"
        :data-active="(value.length === index || value.length - 1 === index) && isFocus"
        :data-disabled="disabled"
        @click="onClick"
      >
        <span :class="ui.value()">{{ item }}</span>
        <span
          v-if="value.length === index && isFocus && item === ''"
          class="otp-cursor"
          :class="ui.cursor()"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.otp-cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>
