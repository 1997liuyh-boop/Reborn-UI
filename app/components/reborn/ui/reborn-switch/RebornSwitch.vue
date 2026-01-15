<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";
import theme, { switchColors, switchSizes } from "./reborn-switch.config";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

export interface SwitchProps {
  modelValue?: boolean;
  defaultValue?: boolean;
  label?: string;
  disabled?: boolean;
  size?: typeof switchSizes[number];
  color?: typeof switchColors[number];
  class?: any;
}

const props = withDefaults(defineProps<SwitchProps>(), {
  disabled: false,
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const attrs = useAttrs();

const localValue = ref(props.defaultValue ?? false);
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value));

const ui = computed(() =>
  b({
    size: props.size,
    color: props.color,
  }),
);

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function updateValue(nextValue: boolean) {
  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }
  emit("update:modelValue", nextValue);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  updateValue(target.checked);
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
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="props.disabled">
    <input
      v-bind="inputAttrs"
      type="checkbox"
      :checked="currentValue"
      :disabled="props.disabled"
      :class="ui.input()"
      @change="handleChange"
    />

    <span :class="ui.track()">
      <span :class="ui.thumb()" />
    </span>

    <span v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </span>
  </label>
</template>
