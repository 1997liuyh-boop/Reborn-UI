<script setup lang="ts">
import {
  selectColors,
  selectSizes,
} from "~/components/reborn/ui/reborn-select/reborn-select.config";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";

const size = ref<any>("md");
const color = ref<any>("primary");
const value1 = ref(null);
const value2 = ref("vue");
const customValue = ref("react");
const disabled = ref(false);

const options = [
  { label: "Vue.js", value: "vue" },
  { label: "React", value: "react" },
  { label: "Angular", value: "angular" },
  { label: "Svelte", value: "svelte" },
  { label: "Solid.js", value: "solid" },
];
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
          :items="[...selectSizes]"
          class="w-28"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
        <USelect
          v-model="color"
          :items="[...selectColors]"
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
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">基础</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <RebornSelect
            v-model="value1"
            :options="options"
            :size="size"
            :color="color"
            :disabled="disabled"
            placeholder="请选择框架"
          />
          <RebornSelect
            v-model="value2"
            :options="options"
            :size="size"
            :color="color"
          />
        </div>
        <p class="text-sm text-gray-500">选中: {{ value1 ?? "空" }} / {{ value2 }}</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">
          自定义触发器 + 下拉项
        </h3>
        <RebornSelect
          v-model="customValue"
          :options="options"
          :size="size"
          :color="color"
          class="max-w-sm"
        >
          <template #trigger="{ toggle, displayText, isOpen }">
            <button
              type="button"
              class="border-primary/40 bg-primary/5 flex w-full items-center justify-between rounded-xl border border-dashed px-3 py-2 text-sm"
              @click="toggle"
            >
              <span>{{ displayText || "自定义触发器：请选择" }}</span>
              <Icon
                :name="isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                class="size-4"
              />
            </button>
          </template>
          <template #option="{ option, active }">
            <div class="flex w-full items-center justify-between">
              <span>{{ option.label }}</span>
              <Icon
                v-if="active"
                name="lucide:check"
                class="text-primary size-4"
              />
            </div>
          </template>
        </RebornSelect>
        <p class="text-sm text-gray-500">选中: {{ customValue }}</p>
      </div>
    </div>
  </div>
</template>
