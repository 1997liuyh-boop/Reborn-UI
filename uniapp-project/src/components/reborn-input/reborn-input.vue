<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";
import { tv } from '@/lib/tv';
import { cn } from '@/lib/utils';
import theme, { inputSizes, inputVariants } from "./reborn-input.config";

defineOptions({
  name: "reborn-input",
  inheritAttrs: false,
});

const b = tv(theme);

export interface InputProps {
  modelValue?: string | number;
  type?: string;
  password?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  size?: typeof inputSizes[number];
  variant?: typeof inputVariants[number];
  error?: boolean;
  maxlength?: number;
  confirmType?: string;
  class?: any;
}

const props = withDefaults(defineProps<InputProps>(), {
  modelValue: "",
  type: "text",
  placeholder: "",
  disabled: false,
  readonly: false,
  clearable: false,
  size: "md",
  variant: "outline",
  error: false,
  maxlength: 140,
  confirmType: "done",
});

const emit = defineEmits([
  "update:modelValue",
  "input",
  "change",
  "focus",
  "blur",
  "confirm",
  "clear",
]);

const attrs = useAttrs();
const isFocus = ref(false);
const showPassword = ref(false);

const localValue = ref(props.modelValue);

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit("update:modelValue", val);
    localValue.value = val;
  }
});

const isPasswordVisible = computed(() => {
  if (!props.password) return false;
  return showPassword.value;
});

const inputType = computed(() => {
  if (props.password) {
    return showPassword.value ? "text" : "password";
  }
  return props.type;
});

const ui = computed(() => {
  const styles = b({
    size: props.size,
    variant: props.variant,
    error: props.error
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class) }),
    leading: (opts?: { class?: any }) => styles.leading({ class: cn(opts?.class) }),
    trailing: (opts?: { class?: any }) => styles.trailing({ class: cn(opts?.class) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class) }),
  };
});

// Event Handlers
const onInput = (e: any) => {
  const val = e.detail.value;
  emit("update:modelValue", val);
  emit("input", val);
};

const onFocus = (e: any) => {
  isFocus.value = true;
  emit("focus", e);
};

const onBlur = (e: any) => {
  isFocus.value = false;
  emit("blur", e);
};

const onConfirm = (e: any) => {
  emit("confirm", e);
};

const onClear = () => {
  emit("update:modelValue", "");
  emit("clear");
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

</script>

<template>
  <view :class="ui.wrapper({ class: props.class })">
    <!-- Prefix Icon / Slot -->
    <view v-if="props.prefixIcon || $slots.prefix" :class="ui.leading()">
      <slot name="prefix">
        <!-- Assuming a generic icon component or icon font class is used. 
                  Since cl-icon is not guaranteed, we use a simple text or view for now, 
                  or user can pass specific icon components via slot. 
                  If prefixIcon string is passed, we assume it's a class or name for library. 
                  We'll use a placeholder view with class. -->
        <view v-if="props.prefixIcon" :class="props.prefixIcon" />
      </slot>
    </view>

    <input :class="ui.input()" :value="inputValue" :type="inputType" :password="props.password && !showPassword"
      :placeholder="props.placeholder" :disabled="props.disabled" :maxlength="props.maxlength"
      :confirm-type="props.confirmType" placeholder-class="text-muted-foreground opacity-50" @input="onInput"
      @focus="onFocus" @blur="onBlur" @confirm="onConfirm" />

    <!-- Suffix Actions: Clear, Password Toggle, Suffix Icon -->
    <view v-if="props.clearable && inputValue && !props.disabled" :class="ui.trailing()" @tap.stop="onClear">
      <view class="i-lucide-x-circle w-4 h-4 cursor-pointer" />
      <!-- Using standard icon class convention from unocss/tailwind if available, or text -->
    </view>

    <view v-if="props.password" :class="ui.trailing()" @tap.stop="togglePassword">
      <view :class="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4 cursor-pointer" />
    </view>

    <view v-if="props.suffixIcon || $slots.suffix" :class="ui.trailing()">
      <slot name="suffix">
        <view v-if="props.suffixIcon" :class="props.suffixIcon" />
      </slot>
    </view>

  </view>
</template>

<style scoped></style>
