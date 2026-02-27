<script setup lang="ts">
import {
  selectDateColors,
  selectDateSizes,
} from "~/components/reborn/ui/reborn-select-date/reborn-select-date.config";
import RebornSelectDate from "~/components/reborn/ui/reborn-select-date/RebornSelectDate.vue";

const size = ref<any>("md");
const color = ref<any>("primary");
const value1 = ref("");
const value2 = ref("");
const value3 = ref("");
const customDate = ref("");
const disabled = ref(false);
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div
      class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
        <USelect
          v-model="size"
          :items="[...selectDateSizes]"
          class="w-28"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
        <USelect
          v-model="color"
          :items="[...selectDateColors]"
          class="w-28"
        />
      </div>
      <UCheckbox
        v-model="disabled"
        label="禁用"
      />
    </div>

    <div class="grid gap-8">
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">日期 / 月份 / 年份</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <RebornSelectDate
            v-model="value1"
            type="date"
            :size="size"
            :color="color"
            :disabled="disabled"
          />
          <RebornSelectDate
            v-model="value2"
            type="month"
            :size="size"
            :color="color"
            placeholder="选择月份"
          />
          <RebornSelectDate
            v-model="value3"
            type="year"
            :size="size"
            :color="color"
            placeholder="选择年份"
          />
        </div>
        <p class="text-sm text-gray-500">
          选中: {{ value1 || "空" }} / {{ value2 || "空" }} / {{ value3 || "空" }}
        </p>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">
          自定义触发器 + 自定义下拉容器
        </h3>
        <RebornSelectDate
          v-model="customDate"
          type="date"
          :size="size"
          :color="color"
          class="max-w-sm"
        >
          <template #trigger="{ toggle, displayText }">
            <button
              type="button"
              class="border-info/40 bg-info/5 flex w-full items-center justify-between rounded-xl border border-dashed px-3 py-2 text-sm"
              @click="toggle"
            >
              <span>{{ displayText || "自定义日期触发器" }}</span>
              <Icon
                name="lucide:calendar-days"
                class="size-4"
              />
            </button>
          </template>
          <template #dropdown="{ isOpen }">
            <div
              v-if="isOpen"
              class="border-info/30 mt-1 rounded-xl border bg-white p-4 text-xs text-gray-500 shadow dark:bg-gray-900"
            >
              这里演示了可自定义下拉容器（可用于组合业务面板）。
            </div>
          </template>
        </RebornSelectDate>
        <p class="text-sm text-gray-500">选中: {{ customDate || "空" }}</p>
      </div>
    </div>
  </div>
</template>
