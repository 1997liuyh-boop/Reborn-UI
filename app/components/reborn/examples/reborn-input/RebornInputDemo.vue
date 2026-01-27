<script setup lang="ts">
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import type { InputProps } from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import { inputSizes } from "~/components/reborn/ui/reborn-input/reborn-input.config";

const sizes = ref([...inputSizes]);
const size = ref<InputProps["size"]>("md");
const disabled = ref(false);
const filledValue = ref("已输入");
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div
      class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
        <USelect v-model="size" :items="sizes" class="w-28" />
      </div>

      <div class="flex items-center gap-4">
        <UCheckbox v-model="disabled" label="禁用" />
      </div>
    </div>

    <div class="grid gap-8">
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">基础</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <RebornInput :size="size" placeholder="请输入内容" />
          <RebornInput v-model="filledValue" :size="size" placeholder="请输入内容" />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">功能</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <RebornInput :size="size" placeholder="请输入内容">
            <template #leading>
              <Icon name="lucide:search" class="size-4" />
            </template>
          </RebornInput>

          <RebornInput :size="size" placeholder="请输入内容">
            <template #trailing>
              <span class="text-xs text-gray-500 dark:text-gray-400">已输入</span>
            </template>
          </RebornInput>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">状态</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <RebornInput :size="size" placeholder="默认" />
          <RebornInput :size="size" placeholder="已输入" v-model="filledValue" />
          <RebornInput :size="size" placeholder="禁用" :disabled="disabled" />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">多行输入框</h3>
        <RebornInput as="textarea" :rows="4" size="lg" placeholder="请输入更多内容" />
      </div>
    </div>
  </div>
</template>
