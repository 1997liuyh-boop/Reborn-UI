<script setup lang="ts">
import type { TimeRangeRole, TimeUnit } from './reborn-time-panel.config';
import { computed } from 'vue';

interface Props {
  panelId: string;
  role: TimeRangeRole;
  unit: TimeUnit;
  max: number;
  value: number;
  available: ReadonlySet<number>;
  disabled: boolean;
  classes: { disabled: string; active: string; idle: string };
}
const props = defineProps<Props>();
const emit = defineEmits<{ select: [value: number] }>();
// 每列独立维护选项缓存，避免多层循环共用同一个 v-memo 编译位置。
const options = computed(() => Array.from({ length: props.max + 1 }, (_, value) => value));
/** 规则禁用：只看禁用规则，决定选项的禁用样式 */
function isRuleDisabled(value: number) { return !props.available.has(value); }
/** 交互禁用：整面板禁用也算在内，决定 aria-disabled 与能否点选 */
function isDisabled(value: number) { return props.disabled || isRuleDisabled(value); }
/** 整面板禁用时仍保留选中项的高亮，否则独立使用的禁用面板看不出当前选的是哪一项 */
function itemClass(value: number) {
  return isRuleDisabled(value) ? props.classes.disabled : props.value === value ? props.classes.active : props.classes.idle;
}
</script>

<template>
  <div
    v-for="option in options"
    :id="`${props.panelId}-${props.role}-${props.unit}-${option}`"
    :key="option"
    v-memo="[props.value === option, isRuleDisabled(option), props.disabled, props.classes]"
    role="option"
    :data-value="option"
    :aria-selected="props.value === option"
    :aria-disabled="isDisabled(option)"
    :class="itemClass(option)"
    @click="emit('select', option)"
  >
    {{ String(option).padStart(props.unit === 'millisecond' ? 3 : 2, '0') }}
  </div>
</template>
