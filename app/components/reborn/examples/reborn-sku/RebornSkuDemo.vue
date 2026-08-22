<script setup lang="ts">
import { ref } from "vue";
import RebornSku from "../../ui/reborn-sku/RebornSku.vue";

// 选中结果：key 为属性组的 key，value 为选中项的 valueKey 值（多选时为数组）
const selected = ref<Record<string, any>>({
  color: "black",
  size: "M",
  services: [],
});

// 商品规格配置：颜色 / 尺码为单选，增值服务为多选
const options = [
  {
    title: "颜色",
    key: "color",
    labelKey: "label",
    valueKey: "value",
    children: [
      { label: "曜石黑", value: "black" },
      { label: "云雾白", value: "white" },
      { label: "远峰蓝", value: "blue" },
    ],
  },
  {
    title: "尺码",
    key: "size",
    labelKey: "label",
    valueKey: "value",
    children: [
      { label: "S", value: "S" },
      { label: "M", value: "M" },
      { label: "L", value: "L" },
      { label: "XL", value: "XL" },
    ],
  },
  {
    title: "增值服务（可多选）",
    key: "services",
    labelKey: "label",
    valueKey: "value",
    multiple: true,
    children: [
      { label: "延保一年", value: "warranty" },
      { label: "礼品包装", value: "gift" },
      { label: "碎屏险", value: "screen" },
    ],
  },
];

// 自定义渲染场景：通过 #item 插槽附带展示价格
const priceSelected = ref<Record<string, any>>({ plan: "pro" });
const priceOptions = [
  {
    title: "套餐版本",
    key: "plan",
    labelKey: "label",
    valueKey: "value",
    children: [
      { label: "基础版", value: "basic", price: 199 },
      { label: "专业版", value: "pro", price: 399 },
      { label: "旗舰版", value: "ultra", price: 699 },
    ],
  },
];

// 最近一次 change 事件的参数，展示在选中结果下方
const lastChange = ref("");

/** 单个属性组选中值变化时触发 */
function onChange(key: string, value: any) {
  lastChange.value = `${key} → ${JSON.stringify(value)}`;
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl space-y-6 p-6">
    <!-- 基础用法：单选 + 多选属性组，对象形式 v-model 收集选中结果 -->
    <div
      class="rounded-ui-lg border-gray-2 border bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 class="text-lg mb-4 font-semibold text-gray-900 dark:text-gray-100">
        商品规格选择
      </h2>
      <RebornSku
        v-model="selected"
        :options="options"
        @change="onChange"
      />
      <div
        class="rounded-ui-lg bg-gray-1 text-sm mt-6 p-4 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        当前选中：{{ selected }}
        <template v-if="lastChange"> <br />最近变化：{{ lastChange }} </template>
      </div>
    </div>

    <!-- 自定义选项渲染：#item 插槽拿到 item / option / selected，自行拼装内容 -->
    <div
      class="rounded-ui-lg border-gray-2 border bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 class="text-lg mb-4 font-semibold text-gray-900 dark:text-gray-100">
        自定义选项渲染
      </h2>
      <RebornSku
        v-model="priceSelected"
        :options="priceOptions"
      >
        <template #item="{ item }">
          <span>{{ item.label }}</span>
          <span class="ml-1 text-xs opacity-70">¥{{ item.price }}</span>
        </template>
      </RebornSku>
    </div>
  </div>
</template>
