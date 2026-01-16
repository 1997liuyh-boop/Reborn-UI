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
const demoValue = ref(10);
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">尺寸</span>
        <USelect v-model="size" :items="sizes" class="w-28" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">配色</span>
        <USelect v-model="color" :items="colors" class="w-32" />
      </div>
    </div>

    <div>
      <RebornInputNumber v-model="minValue" :size="size" :color="color" :min="1" />
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
          <RebornInputNumber v-model="demoValue" color="primary" />
          <RebornInputNumber v-model="demoValue" color="success" />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">尺寸</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <RebornInputNumber v-model="demoValue" size="sm" />
          <RebornInputNumber v-model="demoValue" size="md" />
          <RebornInputNumber v-model="demoValue" size="lg" />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">自定义外观 (Custom UI)</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <div class="text-sm text-gray-500">直角 (Square)</div>
            <RebornInputNumber v-model="demoValue" :ui="{ wrapper: 'rounded-none' }" />
          </div>
          <div class="space-y-2">
            <div class="text-sm text-gray-500">圆角 (Rounded)</div>
            <RebornInputNumber v-model="demoValue" :ui="{ wrapper: 'rounded-md' }" />
          </div>
          <div class="space-y-2">
            <div class="text-sm text-gray-500">自定义主题 (Custom Theme)</div>
            <RebornInputNumber v-model="demoValue"
              :ui="{ wrapper: 'bg-blue-50 ring-blue-200 focus-within:ring-blue-500', button: 'text-blue-600 hover:text-blue-700', divider: 'bg-blue-200' }" />
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">宽度调整 (Width)</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <div class="text-sm text-gray-500">全宽 (Full Width)</div>
            <RebornInputNumber v-model="demoValue" class="w-full" />
          </div>
          <div class="space-y-2">
            <div class="text-sm text-gray-500">窄 (Narrow)</div>
            <RebornInputNumber v-model="demoValue" class="w-24" size="sm" />
          </div>
          <div class="space-y-2">
            <div class="text-sm text-gray-500">宽 (Wide)</div>
            <RebornInputNumber v-model="demoValue" class="w-56" />
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">完全自定义 (Fully Customized)</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <div class="text-sm text-gray-500">自定义按钮与图标大小</div>
            <RebornInputNumber v-model="demoValue" class="w-48" :ui="{
              wrapper: 'bg-indigo-50 dark:bg-indigo-800 ring-indigo-200 dark:ring-indigo-800 focus-within:ring-indigo-500 rounded-lg',
              input: 'text-indigo-700 dark:text-indigo-200 font-bold',
              divider: 'bg-indigo-200 dark:bg-indigo-200',
              button: 'w-12 hover:bg-indigo-100 dark:hover:bg-red-7/20 text-indigo-600 dark:text-indigo-200',
              icon: 'size-5'
            }">
              <template #decrement="{ iconClass }">
                <Icon name="line-md:arrow-left-circle" :class="iconClass" />
              </template>
              <template #increment="{ iconClass }">
                <Icon name="line-md:arrow-right-circle" :class="iconClass" />
              </template>
            </RebornInputNumber>
          </div>
          <div class="space-y-2">
            <div class="text-sm text-gray-500">紧凑深色主题</div>
            <RebornInputNumber v-model="demoValue" class="w-32" :ui="{
              wrapper: 'bg-gray-900 dark:bg-gray-800 ring-gray-700 dark:ring-gray-800 text-white rounded-md',
              input: 'text-white',
              divider: 'bg-gray-700',
              button: 'text-gray-400 hover:text-white px-2',
              icon: 'size-3.5'
            }" />
          </div>
          <div class="space-y-2">
            <div class="text-sm text-gray-500">超小高度主题 (h-7)</div>
            <RebornInputNumber v-model="demoValue" class="w-28" :ui="{
              wrapper: 'h-7 bg-emerald-50 dark:bg-emerald-800 ring-emerald-200 dark:ring-emerald-800 rounded text-xs',
              input: 'text-emerald-700 dark:text-emerald-200 font-medium',
              divider: 'bg-emerald-200 dark:bg-emerald-800',
              button: 'text-emerald-600 hover:text-emerald-700 px-1',
              icon: 'size-3'
            }">
              <template #decrement="{ iconClass }">
                <Icon name="lucide:heart-minus" :class="iconClass" />
              </template>
              <template #increment="{ iconClass }">
                <Icon name="lucide:heart-plus" :class="iconClass" />
              </template>
            </RebornInputNumber>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
