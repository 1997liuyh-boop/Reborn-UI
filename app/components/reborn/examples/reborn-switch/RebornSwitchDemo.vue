<script setup lang="ts">
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import type { SwitchProps } from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import { switchColors, switchSizes } from "~/components/reborn/ui/reborn-switch/reborn-switch.config";

const sizes = ref([...switchSizes]);
const colors = ref([...switchColors]);
const size = ref<SwitchProps["size"]>("md");
const color = ref<SwitchProps["color"]>("primary");

const offValue = ref(false);
const onValue = ref(true);
const disabledValue = ref(true);
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
        <div class="grid gap-4 md:grid-cols-3">
          <RebornSwitch v-model="offValue" :size="size" :color="color" label="关" />
          <RebornSwitch v-model="onValue" :size="size" :color="color" label="开" />
          <RebornSwitch v-model="disabledValue" :size="size" :color="color" label="禁用" disabled />
        </div>
      </div>
    </div>
  </div>
</template>
