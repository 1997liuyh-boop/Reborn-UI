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
});

/** SKU 属性列表 */
const skuAttributes = ref<SkuOption[]>([
  {
    title: "发货地",
    key: "origin",
    labelKey: "label",
    valueKey: "value",
    multiple: false,
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
    key: "price_range",
    labelKey: "label",
    valueKey: "value",
    multiple: false,
    children: [
      { label: "1000-5000 JPY", value: "1000-5000" },
      { label: "5000-10000 JPY", value: "5000-10000" },
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
  <div class="flex flex-col gap-12 p-8 max-w-3xl mx-auto">

    <!-- 基础用法 -->
    <section class="flex flex-col gap-4  relative z-10">
      <h2 class="text-2xl font-bold">基础用法</h2>
      <RebornSearchBox v-model="searchValue" placeholder="搜索您感兴趣的内容..." :select-attrs="{ options: selectOptions }"
        :recommend-keywords="recommendKeywords" history-title="Search History" recommend-title="Popular Searches"
        clear-all-label="Clear All" @search="handleSearch" @click-camera="handleCameraClick">
        <!-- <template #recommend-list="{ ui, selectRecommend }">
          <div :class="ui.sectionTitle()">推荐搜索</div>
          <div :class="ui.associateList()">
            <div v-for="item in recommendKeywords" :key="item" :class="ui.associateItem()"
              @click="selectRecommend(item)">
              <Icon name="lucide:trending-up" class="size-4 text-gray-4 shrink-0" />
              <span>{{ item }}</span>
            </div>
          </div>
        </template> -->
      </RebornSearchBox>

      <!-- 当前绑定值展示 -->
      <div class="rounded-xl bg-gray-1 dark:bg-gray-8 px-4 py-3 text-24 text-gray-6 dark:text-gray-3 font-mono">
        <span class="text-gray-4">modelValue: </span>{{ JSON.stringify(searchValue) }}
      </div>
    </section>

    <!-- SKU 属性搜索模式 -->
    <section class="flex flex-col gap-4 relative z-1">
      <h2 class="text-2xl font-bold">SKU 属性搜索模式</h2>
      <RebornSearchBox v-model="skuSearchValue" mode="sku" placeholder="搜索商品属性..."
        :select-attrs="{ options: selectOptions }" :sku-attributes="skuAttributes" :show-history="false"
        @search="handleSearch" @select-sku="handleSelectSku" />
      <div class="rounded-xl bg-gray-1 dark:bg-gray-8 px-4 py-3 text-24 text-gray-6 dark:text-gray-3 font-mono">
        <span class="text-gray-4">modelValue: </span>{{ JSON.stringify(skuSearchValue) }}
      </div>
    </section>

  </div>
</template>
