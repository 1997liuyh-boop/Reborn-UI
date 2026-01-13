<script setup lang="ts">
import { computed, ref, toRef, useAttrs, watch } from "vue";
import theme, { inputSizes } from "./reborn-input.config";
import { useFieldGroup } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";

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
  as?: "input" | "textarea";
  rows?: number;
  class?: any;
}

const props = withDefaults(defineProps<InputProps>(), {
  disabled: false,
  readonly: false,
  type: "text",
  size: "md",
  as: "input",
  rows: 4,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();

const attrs = useAttrs();

const localValue = ref(props.defaultValue ?? "");
const inputValue = computed(() =>
  props.modelValue !== undefined ? props.modelValue : localValue.value,
);
const isMultiline = computed(() => props.as === "textarea");
const isFilled = computed(() => `${inputValue.value ?? ""}`.length > 0);

const { orientation, size: fieldGroupSize } = useFieldGroup(props);

const size = toRef(props, "size");

const ui = computed(() =>
  b({
    size: (fieldGroupSize.value || size.value) as any,
    fieldGroup: orientation.value,
    multiline: isMultiline.value,
  }),
);

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

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value;
    }
  },
);
</script>

<template>
  <div
    :class="ui.wrapper({ class: props.class })"
    :data-disabled="props.disabled"
    :data-filled="isFilled"
  >
    <span v-if="$slots.leading" :class="ui.leading()">
      <slot name="leading" :ui="ui" />
    </span>

    <component
      :is="props.as"
      v-bind="inputAttrs"
      :type="props.as === 'textarea' ? undefined : props.type"
      :rows="props.as === 'textarea' ? props.rows : undefined"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :placeholder="props.placeholder"
      :value="inputValue"
      :class="ui.input()"
      @input="handleInput"
    />

    <span v-if="$slots.trailing" :class="ui.trailing()">
      <slot name="trailing" :ui="ui" />
    </span>
  </div>
</template>
