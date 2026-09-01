<script setup lang="ts">
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
  language: "cn",
  origin: ["jp", "us"],
  platform: "mercari",
  price: [1000, 5000],
});

/** SKU 属性列表：slots 指定用插槽自定义该属性的选择区 */
const skuAttributes = ref<SkuOption[]>([
  {
    key: "language",
    title: "语言",
    slots: "language",
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
    ],
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
    ],
  },
  {
    title: "价格区间",
    key: "price",
    labelKey: "label",
    valueKey: "value",
    multiple: false,
    slots: "price",
    slotsCover: false,
    children: [
      { label: "1000-5000 JPY", value: [1000, 5000] },
      { label: "5000-10000 JPY", value: [5000, 10000] },
    ],
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
    ],
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
    ],
  },
]);

/** 下拉选择的搜索源 */
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

/** 最近一次触发的事件，用于替代 console 输出 */
const lastEvent = ref("暂无");

function handleSearch(val: SearchBoxModelValue) {
  lastEvent.value = `search · 关键词「${val.inputValue || "空"}」`;
}

function handleCameraClick() {
  lastEvent.value = "click-camera · 点击了拍照搜索";
}

function handleSelectSku(attr: any) {
  lastEvent.value = `select-sku · ${attr?.title ?? JSON.stringify(attr)}`;
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <!-- 提升层级，避免下拉面板被后一个分组遮挡 -->
    <DemoSection
      class="relative z-10"
      title="基础用法"
      description="左侧下拉切换搜索源，输入框聚焦后展示历史与推荐词；绑定值是一个包含 inputValue 与 selectValue 的对象。"
    >
      <DemoBlock layout="stack">
        <RebornSearchBox
          v-model="searchValue"
          placeholder="搜索您感兴趣的内容..."
          :select-attrs="{ options: selectOptions }"
          :recommend-keywords="recommendKeywords"
          history-title="搜索历史"
          recommend-title="热门搜索"
          clear-all-label="清空"
          @search="handleSearch"
          @click-camera="handleCameraClick"
        />

        <pre class="border-default rounded-ui-sm text-muted w-full overflow-auto border p-4 font-mono text-xs leading-relaxed">{{ JSON.stringify(searchValue, null, 2) }}</pre>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      class="relative z-1"
      title="SKU 属性搜索"
      description="mode 设为 sku 后，下方展开属性筛选区；sku-attributes 中带 slots 的项可用同名插槽完全自定义选择方式。"
    >
      <DemoBlock layout="stack">
        <RebornSearchBox
          v-model="skuSearchValue"
          mode="sku"
          placeholder="搜索商品属性..."
          :select-attrs="{ options: selectOptions }"
          :sku-attributes="skuAttributes"
          :show-history="true"
          @search="handleSearch"
          @select-sku="handleSelectSku"
        >
          <template #language>
            <RebornRadioGroup v-model="skuSearchValue.language">
              <RebornRadio value="cn">
                直接搜索
              </RebornRadio>
              <RebornRadio value="en">
                翻译成日文搜索
              </RebornRadio>
            </RebornRadioGroup>
          </template>

          <template #price>
            <div class="flex w-full items-center gap-2">
              <RebornInput
                v-model="skuSearchValue.price[0]"
                placeholder="最低价"
                size="sm"
              />
              <span class="text-muted text-xs">~</span>
              <RebornInput
                v-model="skuSearchValue.price[1]"
                placeholder="最高价"
                size="sm"
              />
            </div>
          </template>
        </RebornSearchBox>

        <pre class="border-default rounded-ui-sm text-muted w-full overflow-auto border p-4 font-mono text-xs leading-relaxed">{{ JSON.stringify(skuSearchValue, null, 2) }}</pre>

        <DemoNote tone="dimmed">
          最近事件：<code>{{ lastEvent }}</code>
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
