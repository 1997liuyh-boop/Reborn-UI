<script setup lang="ts">
import { ref } from "vue";
import type { SearchBoxModelValue } from "~/components/reborn/ui/reborn-search-box/RebornSearchBox.vue";
import type { SkuOption } from "~/components/reborn/ui/reborn-sku/RebornSku.vue";

/** 基础搜索绑定值 */
const searchValue = ref<SearchBoxModelValue>({
  inputValue: "",
  selectValue: "1",
});

/** SKU 搜索绑定值 */
const skuSearchValue = ref<SearchBoxModelValue>({
  inputValue: "",
  selectValue: "1",
  language: 'cn',
  origin: ['jp', 'us'],
  platform: 'mercari',
  price: [1000, 5000],
});

/** SKU 属性列表 */
const skuAttributes = ref<SkuOption[]>([
  {
    key: 'language',
    title: '语言',
    slots: 'language',
    slotsCover: true,
  },
  {
    title: "发货地",
    key: "origin",
    labelKey: "label",
    valueKey: "value",
    multiple: true,
    children: [
      { label: "日本", value: "jp" },
      { label: "美国", value: "us" },
    ]
  },
  {
    title: "平台",
    key: "platform",
    labelKey: "label",
    valueKey: "value",
    multiple: false,
    children: [
      { label: "Mercari", value: "mercari" },
      { label: "Yahoo", value: "yahoo" },
    ]
  },
  {
    title: "价格区间",
    key: "price",
    labelKey: "label",
    valueKey: "value",
    multiple: false,
    slots: 'price',
    slotsCover: false,
    children: [
      { label: "1000-5000 JPY", value: [1000, 5000] },
      { label: "5000-10000 JPY", value: [5000, 10000] },
    ]
  },
  {
    title: "型号",
    key: "model",
    labelKey: "label",
    valueKey: "value",
    multiple: false,
    children: [
      { label: "iPhone 15 Pro", value: "iphone15pro" },
      { label: "iPhone 15", value: "iphone15" },
    ]
  },
  {
    title: "操作系统",
    key: "os",
    labelKey: "label",
    valueKey: "value",
    multiple: true,
    children: [
      { label: "iOS 17", value: "ios17" },
      { label: "Android 14", value: "android14" },
    ]
  }
]);

/** 下拉选择配置 */
const selectOptions = [
  { label: "Mercari", value: "1" },
  { label: "JDirectltems Auction", value: "2" },
  { label: "駿河屋", value: "3" },
  { label: "JDirectltems Fleamarket", value: "4" },
  { label: "Animate", value: "5" },
  { label: "Lashinbang", value: "6" },
];

/** 推荐搜索词 */
const recommendKeywords = ["iPhone 15 Pro", "MacBook Air M3", "AirPods Pro", "Apple Watch Ultra"];

const handleSearch = (val: SearchBoxModelValue) => {
  console.log("搜索:", val);
};

const handleCameraClick = () => {
  console.log("点击相机");
};

const handleSelectSku = (attr: any) => {
  console.log("选择 SKU:", attr);
};
</script>

<template>
  <div class="flex flex-col gap-12 p-8 w-full">

    <!-- 基础用法 -->
    <section class="flex flex-col gap-4 relative z-10">
      <h2 class="text-2xl font-bold">基础用法</h2>
      <RebornSearchBox v-model="searchValue" placeholder="搜索您感兴趣的内容..." :select-attrs="{ options: selectOptions }"
        :recommend-keywords="recommendKeywords" history-title="Search History" recommend-title="Popular Searches"
        clear-all-label="Clear All" @search="handleSearch" @click-camera="handleCameraClick">
      </RebornSearchBox>

      <div class="rounded-xl bg-gray-1 dark:bg-gray-8 px-4 py-3 text-xs text-gray-6 dark:text-gray-3 font-mono">
        <span class="text-gray-4">modelValue: </span>{{ JSON.stringify(searchValue) }}
      </div>
    </section>

    <!-- SKU 属性搜索模式 -->
    <section class="flex flex-col gap-4 relative z-1">
      <h2 class="text-2xl font-bold">SKU 属性搜索模式</h2>
      <RebornSearchBox v-model="skuSearchValue" mode="sku" placeholder="搜索商品属性..."
        :select-attrs="{ options: selectOptions }" :sku-attributes="skuAttributes" :show-history="true"
        @search="handleSearch" @select-sku="handleSelectSku">
        <template #language>
          <RebornRadioGroup v-model="skuSearchValue.language" variant="circle">
            <RebornRadio value="cn">直接搜索</RebornRadio>
            <RebornRadio value="en">翻译成日文搜索</RebornRadio>
          </RebornRadioGroup>
        </template>
        <template #price>
          <div class="flex gap-2 w-full">
            <RebornInput v-model="skuSearchValue.price[0]" placeholder="价格区间" size="sm" />
            <div
              class="relative content:'~' before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-2 before:h-px before:bg-gray-6 dark:before:bg-gray-3">
            </div>
            <RebornInput v-model="skuSearchValue.price[1]" placeholder="价格区间" size="sm" />
          </div>
        </template>
      </RebornSearchBox>
      <div class="rounded-xl bg-gray-1 dark:bg-gray-8 px-4 py-3 text-xs text-gray-6 dark:text-gray-3 font-mono">
        <span class="text-gray-4">modelValue: </span>{{ JSON.stringify(skuSearchValue) }}
      </div>
    </section>

  </div>
</template>
