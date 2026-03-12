<script setup lang="ts">
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import type { SwitchProps } from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import { switchColors, switchSizes } from "~/components/reborn/ui/reborn-switch/reborn-switch.config";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";

const sizes = ref([...switchSizes]);
const colors = ref([...switchColors]);
const size = ref<SwitchProps["size"]>("md");
const color = ref<SwitchProps["color"]>("primary");

const onValue = ref(true);
const disabledValue = ref(true);

// 自定义值示例
const customValue = ref("yes");

// before-change 示例
const beforeChangeValue = ref(false);
const handleBeforeChange = () => {
  return new Promise<boolean>((resolve) => {
    // 模拟异步验证
    setTimeout(() => {
      const confirmed = window.confirm("确认切换状态吗？");
      resolve(confirmed);
    }, 500);
  });
};

// 聚焦示例
const switchRef = ref<any>(null);
const focusSwitch = () => {
  switchRef.value?.focus();
};
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div
      class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">尺寸</span>
        <USelect v-model="size" :items="sizes" class="w-28" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">配色</span>
        <USelect v-model="color" :items="colors" class="w-32" />
      </div>
    </div>

    <div class="grid gap-8">
      <!-- 基础与标签 -->
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">基础 & 双端标签</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <span class="text-xs text-gray-400 uppercase font-bold">双端标签渲染</span>
            <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="开启" inactive-label="关闭" />
          </div>
          <div class="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <span class="text-xs text-gray-400 uppercase font-bold">禁用状态</span>
            <RebornSwitch v-model="disabledValue" :size="size" :color="color" inactive-label="不可点击" disabled />
          </div>
        </div>
      </div>

      <!-- 高级功能 -->
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">高级功能 (New)</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- 自定义值 -->

        </div>
      </div>


      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">插槽与样式定制</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-400 uppercase font-bold">自定义 Value ({{ customValue }})</span>
            </div>
            <RebornSwitch v-model="customValue" :size="size" :color="color" active-value="yes" inactive-value="no"
              active-label="Yes" inactive-label="No" />
          </div>

          <!-- 拦截切换 -->
          <div class="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <span class="text-xs text-gray-400 uppercase font-bold">拦截切换 (Promise + Confirm)</span>
            <RebornSwitch v-model="beforeChangeValue" :size="size" :color="color" :before-change="handleBeforeChange"
              active-label="需要确认" />
          </div>
          <!-- Loading State -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="加载中 (Loading)" loading />
          </div>

          <!-- Custom UI (Square) -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="方形 UI (Custom UI)"
              :ui="{ track: 'rounded-md', thumb: 'rounded-sm' }" />
          </div>

          <!-- Custom Thumb Content (Icon) -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="自定义图标 (Thumb Slot)"
              :ui="{ track: 'peer-checked:bg-orange-6 bg-blue-6' }">
              <template #thumb="{ checked }">
                <Icon :name="checked ? 'lucide:check' : 'lucide:x'" class="size-3.5 transition-colors"
                  :class="checked ? 'text-orange-6' : 'text-gray-400'" />
              </template>
            </RebornSwitch>
          </div>

          <!-- Custom Thumb + Loading -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="加载中 (Custom Icon)" loading>
              <template #thumb="{ loading }">
                <Icon v-if="loading" name="lucide:loader" class="size-full p-0.5 animate-spin text-primary" />
              </template>
            </RebornSwitch>
          </div>

          <!-- Custom Size (XL) -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornSwitch v-model="onValue" :color="color" active-label="自定义大小 (Custom XL)"
              :ui="{ track: 'h-8 w-14 peer-checked:[&>span]:translate-x-6', thumb: 'size-7' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
