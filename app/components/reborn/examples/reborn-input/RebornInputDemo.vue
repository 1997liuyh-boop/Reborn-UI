<script setup lang="ts">
import { ref } from "vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import { inputColors, inputSizes } from "~/components/reborn/ui/reborn-input/reborn-input.config";
import RebornRadio from "~/components/reborn/ui/reborn-radio/RebornRadio.vue";
import RebornRadioGroup from "~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import RebornText from "~/components/reborn/ui/reborn-text/RebornText.vue";

const input1 = ref("");
const input2 = ref("五条悟");

const colors = ref<typeof inputColors[number]>("neutral");
const currentSize = ref<typeof inputSizes[number]>("sm");
const disabled = ref(false);
const rounded = ref(false);
const password = ref(false);
const clearable = ref(true);
const border = ref(true);
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">输入框</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">用于接收用户输入的数据。</p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Example Card -->
      <div
        class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:col-span-8">
        <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider">示例</h2>
        <div class="flex flex-col gap-4">
          <RebornInput v-model="input1" :size="currentSize" :color="colors" :password="password" :disabled="disabled"
            :rounded="rounded" :clearable="clearable" :border="border" placeholder="基础用法..." />

          <RebornInput v-model="input2" :size="currentSize" :color="colors" :password="password" :disabled="disabled"
            :rounded="rounded" :clearable="clearable" :border="border" placeholder="插槽">
            <template #leading>
              <Icon name="lucide:search" class="size-4 text-gray-400" />
            </template>
            <template #trailing>
              <Icon name="lucide:calendar" class="size-4 text-gray-400" />
            </template>
          </RebornInput>
        </div>
      </div>

      <!-- Config Card -->
      <div
        class="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:col-span-4">
        <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider">配置</h2>

        <div class="grid gap-6">
          <div class="space-y-3">
            <RebornText color="neutral" class="text-xs font-semibold uppercase">尺寸</RebornText>
            <RebornRadioGroup v-model="currentSize" class="flex flex-wrap gap-2">
              <RebornRadio v-for="size in inputSizes" :key="size" :value="size" :label="size" />
            </RebornRadioGroup>
          </div>

          <div class="space-y-3">
            <RebornText color="neutral" class="text-xs font-semibold uppercase">激活边框颜色</RebornText>
            <RebornRadioGroup v-model="colors" class="flex flex-wrap gap-3">
              <RebornRadio v-for="item in inputColors" :key="item" :value="item" :showIcon="false">
                <template #default="{ isChecked }">
                  <div class="relative flex size-6 items-center justify-center">
                    <div v-if="isChecked"
                      class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" :class="[
                        item === 'primary' && 'bg-primary',
                        item === 'secondary' && 'bg-secondary',
                        item === 'success' && 'bg-success',
                        item === 'info' && 'bg-info',
                        item === 'warning' && 'bg-warning',
                        item === 'error' && 'bg-error',
                        item === 'neutral' && 'bg-gray-400',
                      ]"></div>
                    <div
                      class="relative inline-flex size-5 rounded-full shadow-inner ring-2 ring-white dark:ring-gray-900"
                      :class="[
                        item === 'primary' && 'bg-primary',
                        item === 'secondary' && 'bg-secondary',
                        item === 'success' && 'bg-success',
                        item === 'info' && 'bg-info',
                        item === 'warning' && 'bg-warning',
                        item === 'error' && 'bg-error',
                        item === 'neutral' && 'bg-gray-400',
                      ]"></div>
                  </div>
                </template>
              </RebornRadio>
            </RebornRadioGroup>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <RebornText color="neutral" class="text-xs block">是否密码</RebornText>
              <RebornSwitch v-model="password" />
            </div>

            <div class="space-y-1">
              <RebornText color="neutral" class="text-xs block">是否禁用</RebornText>
              <RebornSwitch v-model="disabled" />
            </div>

            <div class="space-y-1">
              <RebornText color="neutral" class="text-xs block">是否圆角</RebornText>
              <RebornSwitch v-model="rounded" />
            </div>

            <div class="space-y-1">
              <RebornText color="neutral" class="text-xs block">是否可清空</RebornText>
              <RebornSwitch v-model="clearable" />
            </div>

            <div class="space-y-1">
              <RebornText color="neutral" class="text-xs block">有边框</RebornText>
              <RebornSwitch v-model="border" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
