<script setup lang="ts">
import RebornTimePicker from "~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue";
import {
  timePickerColors,
  timePickerSizes,
} from "~/components/reborn/ui/reborn-time-picker/reborn-time-picker.config";

const size = ref<any>("md");
const color = ref<any>("primary");
const disabled = ref(false);

const basicValue = ref("09:30:00");
const arrowValue = ref("12:15:30");
const limitedValue = ref("18:30:45");
const rangeValue = ref(["09:00:00", "18:00:00"]);
const rangeArrowValue = ref(["08:30:00", "20:15:00"]);

function disabledHours() {
  return [0, 1, 2, 3, 4, 5, 23];
}

function disabledMinutes(hour: number) {
  if (hour === 12) {
    return Array.from({ length: 30 }, (_, index) => index);
  }
  return [];
}

function disabledSeconds(hour: number, minute: number) {
  if (hour === 18 && minute === 30) {
    return Array.from({ length: 41 }, (_, index) => index);
  }
  return [];
}

function disabledRangeHours(role?: "start" | "end") {
  if (role === "start") return [0, 1, 2, 3, 4, 5];
  if (role === "end") return [0, 1, 2, 3, 4, 5, 6, 7];
  return [];
}
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div
      class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
        <USelect v-model="size" :items="[...timePickerSizes]" class="w-28" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
        <USelect v-model="color" :items="[...timePickerColors]" class="w-28" />
      </div>
      <UCheckbox v-model="disabled" label="禁用" />
    </div>

    <div class="grid gap-8">
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-700 dark:text-gray-200">默认滚轮选择</h3>
        <RebornTimePicker v-model="basicValue" :size="size" :color="color" :disabled="disabled" class="max-w-sm" />
        <p class="text-sm text-gray-500">当前值：{{ basicValue }}</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-700 dark:text-gray-200">Arrow Control 模式</h3>
        <RebornTimePicker v-model="arrowValue" :size="size" :color="color" :disabled="disabled" arrow-control
          class="max-w-sm" />
        <p class="text-sm text-gray-500">当前值：{{ arrowValue }}</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-700 dark:text-gray-200">限制可选时间</h3>
        <RebornTimePicker v-model="limitedValue" :size="size" :color="color" :disabled="disabled"
          :disabled-hours="disabledHours" :disabled-minutes="disabledMinutes" :disabled-seconds="disabledSeconds"
          class="max-w-sm" />
        <p class="text-sm text-gray-500">
          禁用 00:00-05:59、23 点；12 点禁用前 30 分钟；18:30 禁用前 41 秒
        </p>
        <p class="text-sm text-gray-500">当前值：{{ limitedValue }}</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-700 dark:text-gray-200">时间范围选择</h3>
        <RebornTimePicker v-model="rangeValue" :size="size" :color="color" :disabled="disabled" is-range
          class="max-w-4xl" />
        <p class="text-sm text-gray-500">当前范围：{{ rangeValue.join(" ~ ") }}</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-700 dark:text-gray-200">范围 + Arrow Control</h3>
        <RebornTimePicker v-model="rangeArrowValue" :size="size" :color="color" :disabled="disabled" is-range
          arrow-control :disabled-hours="disabledRangeHours" class="max-w-4xl" />
        <p class="text-sm text-gray-500">当前范围：{{ rangeArrowValue.join(" ~ ") }}</p>
      </div>
    </div>
  </div>
</template>
