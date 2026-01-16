<script setup lang="ts">
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import type { SwitchProps } from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import { switchColors, switchSizes } from "~/components/reborn/ui/reborn-switch/reborn-switch.config";

const sizes = ref([...switchSizes]);
const colors = ref([...switchColors]);
const size = ref<SwitchProps["size"]>("md");
const color = ref<SwitchProps["color"]>("primary");

const onValue = ref(true);
const disabledValue = ref(true);
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div
      class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800">
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
        <div class="grid gap-4 md:grid-cols-3">
          <RebornSwitch v-model="onValue" :size="size" :color="color" label="关" />
          <RebornSwitch v-model="onValue" :size="size" :color="color" label="开" />
          <RebornSwitch v-model="disabledValue" :size="size" :color="color" label="禁用" disabled />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">Loading & Customization</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Loading State -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" label="加载中 (Loading)" loading />
          </div>

          <!-- Custom UI (Square) -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" label="方形 UI (Custom UI)"
              :ui="{ track: 'rounded-md', thumb: 'rounded-sm' }" />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Custom Thumb Content (Icon) -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" label="自定义图标 (Thumb Slot)"
              :ui="{ track: 'peer-checked:bg-orange-6 bg-blue-6' }">
              <template #thumb="{ checked }">
                <Icon :name="checked ? 'lucide:check' : 'lucide:x'" class="size-3.5 transition-colors"
                  :class="checked ? 'text-orange-6' : 'text-gray-400'" />
              </template>
            </RebornSwitch>
          </div>

          <!-- Custom Thumb + Loading -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" label="加载中 (Custom Icon)" loading>
              <template #thumb="{ loading }">
                <Icon v-if="loading" name="lucide:loader" class="size-full p-0.5 animate-spin text-primary" />
              </template>
            </RebornSwitch>
          </div>

          <!-- Custom Size (XL) -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :color="color" label="自定义大小 (Custom XL)"
              :ui="{ track: 'h-8 w-14 peer-checked:[&>span]:translate-x-6', thumb: 'size-7' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
