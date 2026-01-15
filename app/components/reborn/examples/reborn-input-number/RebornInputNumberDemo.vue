<script setup lang="ts">
import RebornInputNumber from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";
import type { InputNumberProps } from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";
import {
  inputNumberColors,
  inputNumberSizes,
} from "~/components/reborn/ui/reborn-input-number/reborn-input-number.config";

const sizes = ref([...inputNumberSizes]);
const colors = ref([...inputNumberColors]);
const size = ref<InputNumberProps["size"]>("md");
const color = ref<InputNumberProps["color"]>("primary");

const minValue = ref(1);
const stepValue = ref(3);
const maxValue = ref(50);
const disabledValue = ref(1);
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">尺寸</span>
        <USelect v-model="size!" :items="sizes" class="w-28" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">配色</span>
        <USelect v-model="color!" :items="colors" class="w-32" />
      </div>
    </div>

    <div class="grid gap-8">
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">状态</h3>
        <div class="grid gap-4 md:grid-cols-4">
          <RebornInputNumber v-model="minValue" :size="size" :color="color" :min="1" />
          <RebornInputNumber v-model="stepValue" :size="size" :color="color" :step="3" />
          <RebornInputNumber v-model="maxValue" :size="size" :color="color" :max="50" />
          <RebornInputNumber v-model="disabledValue" :size="size" :color="color" disabled />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">配色</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <RebornInputNumber :model-value="12" color="primary" />
          <RebornInputNumber :model-value="12" color="success" />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">尺寸</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <RebornInputNumber :model-value="3" size="sm" />
          <RebornInputNumber :model-value="3" size="md" />
          <RebornInputNumber :model-value="3" size="lg" />
        </div>
      </div>
    </div>
  </div>
</template>
