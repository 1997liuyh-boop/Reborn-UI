<script setup lang="ts">
import { ref } from "vue";
import RebornSearchBox from "@/components/reborn-search-box/RebornSearchBox.vue";

const searchQuery = ref("");
const selectedCategory = ref("全部");

const skuSearchQuery = ref("");
const skuAttributes = ref([
  { label: "品牌", value: "Apple" },
  { label: "分类", value: "手机" },
  { label: "颜色", value: "深空灰" },
  { label: "存储", value: "256GB" },
]);

const handleSearch = (val: string) => {
  uni.showToast({
    title: `搜索: ${val}\n目录: ${selectedCategory.value}`,
    icon: 'none'
  });
};

const handleCategoryClick = () => {
  const categories = ["全部", "商品", "店铺", "用户"] as const;
  const currentIndex = categories.indexOf(selectedCategory.value as any);
  selectedCategory.value = categories[(currentIndex + 1) % categories.length];
};

const handleCameraClick = () => {
  uni.showToast({
    title: '点击了相机图标',
    icon: 'none'
  });
};

const handleSelectSku = (attr: any) => {
  uni.showToast({
    title: `选择 SKU: ${attr.label}=${attr.value}`,
    icon: 'none'
  });
};

// Custom history simulation
const customHistory = ref(["Vue", "Uni-app", "Tailwind"]);
const onSaveHistory = (newHistory: string[]) => {
  customHistory.value = newHistory;
};
const onRemoveHistory = () => {
  customHistory.value = [];
};
</script>

<template>
  <view class="p-4 flex flex-col gap-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
    <view>
      <text class="text-32 font-bold mb-4 block">关联搜索模式 (Associate)</text>
      <RebornSearchBox v-model="searchQuery" :category="selectedCategory" placeholder="搜索商品/店铺..."
        @search="handleSearch" @click-category="handleCategoryClick" @click-camera="handleCameraClick">
        <template #associate-list="{ ui }">
          <view :class="ui.section()">
            <text :class="ui.sectionTitle()">为您推荐</text>
            <view :class="ui.associateList()">
              <view v-for="item in ['Switch OLED', 'PlayStation 5', 'RTX 4090']" :key="item" :class="ui.associateItem()"
                @tap="searchQuery = item; handleSearch(item)">
                <view class="i-lucide-trending-up size-4 text-orange-500 mr-2" />
                <text>{{ item }}</text>
              </view>
            </view>
          </view>
        </template>
      </RebornSearchBox>
    </view>

    <view>
      <text class="text-32 font-bold mb-4 block">SKU 属性模式 & 蓝色主题</text>
      <RebornSearchBox v-model="skuSearchQuery" mode="sku" color="blue" placeholder="搜索规格属性..."
        :sku-attributes="skuAttributes" @select-sku="handleSelectSku" />
    </view>

    <view>
      <text class="text-32 font-bold mb-4 block">颜色变体</text>
      <view class="flex flex-col gap-4">
        <view class="flex flex-col gap-2">
          <text class="text-24 text-gray-500">PRIMARY (RED)</text>
          <RebornSearchBox color="primary" placeholder="Primary Search" />
        </view>
        <view class="flex flex-col gap-2">
          <text class="text-24 text-gray-500">GREEN (EMERALD)</text>
          <RebornSearchBox color="green" placeholder="Green Search" />
        </view>
        <view class="flex flex-col gap-2">
          <text class="text-24 text-gray-500">ORANGE</text>
          <RebornSearchBox color="orange" placeholder="Orange Search" />
        </view>
      </view>
    </view>

    <view>
      <text class="text-32 font-bold mb-4 block">自定义存储 (Mock)</text>
      <RebornSearchBox placeholder="搜索词将存储在下方列表" :save-history="onSaveHistory" :remove-history="onRemoveHistory" />
      <view class="mt-4 p-4 bg-white dark:bg-gray-900 rounded-16 border border-gray-100 dark:border-gray-800">
        <text class="text-24 font-bold block mb-2">当前自定义存储内容:</text>
        <view class="flex flex-row flex-wrap gap-2">
          <view v-for="h in customHistory" :key="h"
            class="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-8 border border-gray-100 dark:border-gray-700">
            <text class="text-24 text-gray-600 dark:text-gray-400">{{ h }}</text>
          </view>
          <text v-if="customHistory.length === 0" class="text-24 text-gray-400 italic">暂无历史</text>
        </view>
      </view>
    </view>

    <view class="pb-20">
      <text class="text-32 font-bold mb-4 block">禁用下拉框</text>
      <RebornSearchBox :show-dropdown="false" placeholder="这个搜索框不会弹出面板" />
    </view>
  </view>
</template>


<style scoped>
/* Page specific styles */
</style>
