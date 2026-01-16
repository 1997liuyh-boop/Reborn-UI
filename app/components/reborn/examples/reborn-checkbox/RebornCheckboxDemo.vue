<script setup lang="ts">
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import type { CheckboxProps } from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import { checkboxColors, checkboxSizes } from "~/components/reborn/ui/reborn-checkbox/reborn-checkbox.config";

const sizes = ref([...checkboxSizes]);
const colors = ref([...checkboxColors]);
const size = ref<CheckboxProps["size"]>("md");
const color = ref<CheckboxProps["color"]>("primary");

const defaultValue = ref(false);
const checkedValue = ref(true);
const disabledValue = ref(true);

const selectedGroup = ref<string[]>(["系统更新"]);
const groupOptions = ["系统更新", "产品迭代", "活动通知"];

const selectedPlans = ref<string[]>(["标准版"]);
const plans = [
  {
    value: "基础版",
    title: "基础版",
    description: "适合快速接入的轻量配置。",
  },
  {
    value: "标准版",
    title: "标准版",
    description: "涵盖常用场景的均衡方案。",
  },
  {
    value: "旗舰版",
    title: "旗舰版",
    description: "完整能力组合，满足复杂业务。",
  },
];
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

    <div class="grid gap-8">
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">状态</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <RebornCheckbox v-model="defaultValue" :size="size" :color="color" label="默认" />
          <RebornCheckbox v-model="checkedValue" :size="size" :color="color" label="选中" />
          <RebornCheckbox v-model="disabledValue" :size="size" :color="color" label="禁用" disabled />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">基础用法</h3>
        {{ selectedGroup }}
        <div class="grid gap-4 md:grid-cols-3">
          <RebornCheckbox v-for="option in groupOptions" :key="option" v-model="selectedGroup" :size="size"
            :color="color" :value="option" :label="option" />
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">组合视图</h3>
        {{ selectedPlans }}
        <div class="grid gap-4 md:grid-cols-2">
          <label v-for="plan in plans" :key="plan.value"
            class="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-100 bg-white dark:bg-gray-800 p-4 transition-colors hover:border-gray-200 dark:hover:border-gray-700">
            <RebornCheckbox v-model="selectedPlans" :size="size" :color="color" :value="plan.value" />
            <div class="space-y-1">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ plan.title }}</p>
              <p class="text-xs text-gray-500">{{ plan.description }}</p>
            </div>
          </label>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400">高级定制</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Custom UI Style -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornCheckbox v-model="checkedValue" :size="size" :color="color" label="完全圆角 (Custom UI)"
              :ui="{ control: 'rounded-full', label: 'font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent' }" />
          </div>

          <!-- Custom Icon Slot -->
          <div class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
            <RebornCheckbox v-model="checkedValue" :size="size" :color="color" label="自定义图标、大小 (Slot)"
              :ui="{ control: 'size-8' }">
              <template #icon="{ checked }">
                <Icon :name="checked ? 'lucide:heart' : 'lucide:heart-crack'" class="size-6 transition-all duration-300"
                  :class="checked ? 'fill-current scale-100' : 'scale-100 text-black opacity-100'" />
              </template>
            </RebornCheckbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
