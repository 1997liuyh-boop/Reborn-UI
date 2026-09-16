<script setup lang="ts">
import type { SearchBoxModelValue } from "~/components/reborn/ui/reborn-search-box/RebornSearchBox.vue";
import type { SkuOption } from "~/components/reborn/ui/reborn-sku/RebornSku.vue";
import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { inputColors, inputShapes } from "~/components/reborn/ui/reborn-input/reborn-input.config";
import RebornRadio from "~/components/reborn/ui/reborn-radio/RebornRadio.vue";
import RebornRadioGroup from "~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue";
import { searchBoxSizes } from "~/components/reborn/ui/reborn-search-box/reborn-search-box.config";
import RebornSearchBox from "~/components/reborn/ui/reborn-search-box/RebornSearchBox.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornSku from "~/components/reborn/ui/reborn-sku/RebornSku.vue";

const colorOptions = inputColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }));
const sizeOptions = searchBoxSizes.map(s => ({ label: s.toUpperCase(), value: s as typeof searchBoxSizes[number] }));
const shapeOptions = inputShapes.map(sp => ({
  label: sp === "circle" ? "胶囊 Circle" : "方形 Square",
  value: sp as typeof inputShapes[number],
}));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  size: "sm",
  color: "primary",
  shape: "circle",
  placeholder: "搜索您感兴趣的内容...",
  showDropdown: true,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场绑定值 */
const playgroundValue = ref<SearchBoxModelValue>({
  inputValue: "",
  selectValue: "1",
});

/** 最近一次触发的事件，让预览区的交互「有回应」 */
const lastEvent = ref("暂无");

function onSearch(val: SearchBoxModelValue) {
  lastEvent.value = `search · 关键词「${val.inputValue || "空"}」`;
}

/** 相机入口由插槽自行渲染，点击也由使用方自行处理 */
function onCameraClick() {
  lastEvent.value = "插槽 · 点击了拍照搜索";
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  playgroundValue.value = { inputValue: "", selectValue: "1" };
  lastEvent.value = "暂无";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "尺寸规格", key: "size", component: "select" as const, defaultValue: "sm", props: { options: sizeOptions } },
      { label: "配色方案", key: "color", component: "select" as const, defaultValue: "primary", props: { options: colorOptions } },
      { label: "外形轮廓（与 RebornInput 的 shape 对齐）", key: "shape", component: "select" as const, defaultValue: "circle", props: { options: shapeOptions } },
      { label: "占位文本", key: "placeholder", component: "input" as const, defaultValue: "搜索您感兴趣的内容..." },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "聚焦展开下拉面板", key: "showDropdown", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const searchBoxCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    `v-model="value"`,
    `size="${s.size}"`,
    `color="${s.color}"`,
    `shape="${s.shape}"`,
    `placeholder="${s.placeholder}"`,
    `:show-dropdown="${s.showDropdown}"`,
  ];
  return `<RebornSearchBox\n  ${props.join("\n  ")}\n>\n  <template #leading>...</template>\n  <template #input-trailing>...</template>\n  <template #trailing>...</template>\n  <template #dropdown>...</template>\n</RebornSearchBox>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 左侧选择器的搜索源（由 leading 插槽自行组合 RebornSelect 提供） */
const selectOptions = [
  { label: "Mercari", value: "1" },
  { label: "JDirectltems Auction", value: "2" },
  { label: "駿河屋", value: "3" },
  { label: "Animate", value: "5" },
];

/** 让插槽内的 RebornSelect 融入搜索框：去边框、限宽截断 */
const selectTriggerUi = {
  wrapper: "h-full!",
  trigger: "border-0! bg-transparent! h-full! overflow-hidden",
  triggerText: "min-w-15 truncate text-gray-9",
  dropdown: "min-w-30!",
};

/** 推荐搜索词（面板无默认内容，由 dropdown 插槽渲染） */
const recommendKeywords = ["iPhone 15 Pro", "MacBook Air M3", "AirPods Pro", "Apple Watch Ultra"];

/** 外置插槽示例绑定值 */
const outerSlotValue = ref<SearchBoxModelValue>({ inputValue: "", selectValue: "1" });

/** 内置插槽示例绑定值 */
const innerSlotValue = ref<SearchBoxModelValue>({ inputValue: "", selectValue: "" });

/** 方形圆角示例绑定值 */
const squareValue = ref<SearchBoxModelValue>({ inputValue: "", selectValue: "" });

/** 纯输入框（无前后插槽/无面板）示例绑定值 */
const pureValue = ref<SearchBoxModelValue>({ inputValue: "", selectValue: "" });

/** SKU 搜索绑定值 */
const skuSearchValue = ref<SearchBoxModelValue>({
  inputValue: "",
  selectValue: "",
  language: "cn",
  origin: ["jp", "us"],
  platform: "mercari",
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
]);
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground v-model="state" :controls="controls" :code="searchBoxCode" component-name="RebornSearchBox"
      title="交互演练场"
      description="调节左侧参数，实时查看搜索框表现；所有区域全是插槽、无任何默认内容。外层边框把外置插槽一并囊括进来并恒为 gray-4，输入框聚焦时只在输入框区内另起一圈 color 对应色的描边——点左侧选择器或右侧按钮都不会点亮任何描边。">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col gap-8 pb-40">
        <RebornSearchBox v-model="playgroundValue" :size="state.size" :color="state.color" :shape="state.shape"
          :placeholder="state.placeholder" :show-dropdown="state.showDropdown" @search="onSearch">
          <!-- 外置前置插槽（在边框内、输入框之外，聚焦不点亮边框）：自行组合 RebornSelect，分隔线等装饰样式自行提供 -->
          <template #leading>
            <!-- 贴边色块需自带与外形一致的端部圆角，否则会被控件行的 overflow-hidden 裁出弧形缺口 -->
            <div
              class="bg-gray-2 text-gray-8 text-md px-[12px] h-full border-r border-r-gray-4 flex items-center justify-center"
              :class="state.shape === 'circle' ? 'rounded-l-full pl-[16px]' : 'rounded-l-md'">
              http://
            </div>
          </template>

          <!-- 内置后置插槽（落在输入框内部，随输入框一起进入激活态）：拍照搜索入口 -->
          <template #input-trailing>
            <Icon name="lucide:camera"
              class="text-2xl text-gray-5 cursor-pointer hover:text-gray-7/80 transition-colors"
              @click.stop="onCameraClick" />
          </template>

          <!-- 外置后置插槽：搜索按钮，点击调用作用域的 search 触发搜索 -->
          <template #trailing>
            <!-- 同 leading：贴边色块自带端部圆角，避免被胶囊外形裁出弧形缺口 -->
            <div
              class="text-md bg-brand-6 text-white px-[12px] flex items-center justify-center h-full border-l border-l-brand-5"
              :class="state.shape === 'circle' ? 'rounded-r-full pr-[16px]' : 'rounded-r-md'">
              <Icon name="lucide:search" />
            </div>
          </template>

          <!-- 下拉面板：历史 + 推荐，全部由插槽拼装 -->
          <template #dropdown="{ history, selectHistory, removeHistoryItem, clearHistory, selectRecommend }">
            <div class="flex flex-col gap-3">
              <div class="text-lg font-bold text-gray-8 flex items-center justify-between">
                <span>搜索历史</span>
                <div v-if="history.length > 0"
                  class="text-base font-normal text-gray-5 cursor-pointer hover:underline flex items-center gap-1"
                  @click="clearHistory">
                  <Icon name="lucide:trash-2" />
                  清空
                </div>
              </div>
              <div v-if="history.length > 0" class="flex flex-wrap gap-2">
                <RebornBadge v-for="h in history" :key="h" :label="h" closable variant="soft" color="neutral" size="md"
                  :ui="{ label: 'text-gray-7' }" @click="selectHistory(h)" @close="removeHistoryItem(h)" />
              </div>
              <div v-else class="text-sm text-gray-4 py-2">
                暂无最近的搜索记录
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <div class="text-lg font-bold text-gray-8 flex items-center justify-between">
                热门搜索
              </div>
              <div class="flex flex-col">
                <div v-for="item in recommendKeywords" :key="item"
                  class="flex items-center gap-3 py-3 px-2 cursor-pointer hover:bg-gray-1 rounded-lg transition-colors text-base text-gray-8"
                  @click="selectRecommend(item)">
                  <Icon name="lucide:trending-up" class="size-4 text-gray-4 shrink-0" />
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>
          </template>
        </RebornSearchBox>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          绑定值: {{ playgroundValue }} · 最近事件: {{ lastEvent }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection class="relative z-40" title="外置插槽：leading / trailing">
      <template #description>
        <code>leading</code> / <code>trailing</code> 是搜索框自身的插槽，与输入框区并列排在<strong>控件行</strong>里，
        因此同样被外层边框囊括在内，高度也与输入框区一样撑满整行。存在外置插槽时，外层边框恒为 <code>gray-4</code> 不变色，
        激活高亮改为<strong>只在输入框区内另起一圈</strong>——点左侧选择器、右侧按钮时不会出现任何描边，只有点进输入框才会。
        输入框区的水平内边距（同时充当与外置插槽的间距）按尺寸给出：<code>sm</code> 为 8px，<code>md</code> /
        <code>lg</code> 为 12px。
      </template>
      <DemoBlock layout="stack">
        <RebornSearchBox v-model="outerSlotValue" size="md" shape="square" :show-dropdown="false"
          placeholder="点选择器不会出现描边，点这里才会">
          <!-- 外置前置：搜索源选择器 + 分隔线（分隔线样式自行提供） -->
          <template #leading>
            <RebornSelect v-model="outerSlotValue.selectValue" :options="selectOptions" size="md" :clearable="false"
              :bordered="false" :trigger-ui="selectTriggerUi" @click.stop />
            <div class="w-px h-5 shrink-0 bg-[#D3D2D9]!" />
          </template>

          <!-- 外置后置：搜索按钮，作用域透出 search 直接触发搜索 -->
          <template #trailing="{ search }">
            <RebornButton size="md" color="primary" @click.stop="search">
              <Icon name="lucide:search" class="size-5" />
            </RebornButton>
          </template>
        </RebornSearchBox>
      </DemoBlock>
    </DemoSection>

    <DemoSection class="relative z-30" title="内置插槽：input-leading / input-trailing">
      <template #description>
        <code>input-leading</code> / <code>input-trailing</code> 会转发到内部 <code>RebornInput</code> 的
        <code>prefix</code> / <code>suffix</code>，内容落在<strong>输入框内部</strong>、贴着文本排布，
        随输入框一起进入激活态；作用域除 <code>ui</code> 外还额外透出 <code>inputUi</code>，可直接套用输入框自身的样式键。
      </template>
      <DemoBlock layout="stack">
        <RebornSearchBox v-model="innerSlotValue" size="md" shape="square" :show-dropdown="false"
          placeholder="放大镜与相机都在输入框里" @search="onSearch">
          <!-- 内置前置：放大镜 -->
          <template #input-leading>
            <Icon name="lucide:search" class="size-5" />
          </template>

          <!-- 内置后置：相机入口 -->
          <template #input-trailing>
            <Icon name="lucide:camera"
              class="text-2xl text-gray-5 cursor-pointer hover:text-gray-7/80 transition-colors"
              @click.stop="onCameraClick" />
          </template>
        </RebornSearchBox>
      </DemoBlock>
    </DemoSection>

    <DemoSection class="relative z-20" title="方形圆角与属性透传">
      <template #description>
        <code>shape="square"</code> 统一取 <code>rounded-md</code> 令牌（不分尺寸），底色卡片上半圆角与输入框对齐、面板只保留下半圆角；
        <code>input-attrs</code> 会 v-bind 透传给内部 <code>RebornInput</code>（显式 prop 优先）。
      </template>
      <DemoBlock layout="stack">
        <RebornSearchBox v-model="squareValue" shape="square" size="md" placeholder="方形圆角 + maxlength 透传..."
          :input-attrs="{ maxlength: 20 }" @search="onSearch">
          <template #input-trailing="{ search }">
            <RebornButton size="sm" color="primary" @click.stop="search">
              <Icon name="lucide:search" class="size-5" />
            </RebornButton>
          </template>
          <template #dropdown="{ selectRecommend }">
            <div class="flex flex-col gap-3">
              <div class="text-lg font-bold text-gray-8 flex items-center justify-between">
                热门搜索
              </div>
              <div class="flex flex-col">
                <div v-for="item in recommendKeywords" :key="item"
                  class="flex items-center gap-3 py-3 px-2 cursor-pointer hover:bg-gray-1 rounded-lg transition-colors text-base text-gray-8"
                  @click="selectRecommend(item)">
                  <Icon name="lucide:trending-up" class="size-4 text-gray-4 shrink-0" />
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>
          </template>
        </RebornSearchBox>
      </DemoBlock>
    </DemoSection>

    <DemoSection class="relative z-10" title="纯搜索框形态"
      description="不填任何插槽并关闭 show-dropdown，即为一只只剩输入能力的搜索框；回车仍会触发 search 并写入历史。">
      <DemoBlock layout="stack">
        <RebornSearchBox v-model="pureValue" :show-dropdown="false" placeholder="无插槽 + 不展开面板，回车触发搜索"
          @search="onSearch" />
      </DemoBlock>
    </DemoSection>

    <DemoSection class="relative z-1" title="SKU 属性搜索">
      <template #description>
        面板即插槽：把 <code>RebornSku</code> 直接放进 <code>dropdown</code> 插槽即可组合出属性筛选面板，
        带 <code>slots</code> 的属性项可用 <code>RebornSku</code> 的同名插槽自定义选择方式。
      </template>
      <DemoBlock layout="stack">
        <RebornSearchBox v-model="skuSearchValue" placeholder="搜索商品属性..." @search="onSearch" size="lg">
          <template #input-trailing="{ search }">
            <RebornButton size="sm" color="primary" @click.stop="search" variant="round">
              <Icon name="lucide:search" class="size-5" />
            </RebornButton>
          </template>
          <template #dropdown>
            <RebornSku :model-value="skuSearchValue" :options="skuAttributes"
              @update:model-value="(val: any) => (skuSearchValue = val)"
              @change="(key: string, val: any) => (lastEvent = `sku change · ${key} → ${JSON.stringify(val)}`)"
              @click.stop>
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
            </RebornSku>
          </template>
        </RebornSearchBox>

        <DemoNote tone="dimmed">
          当前绑定值：<code>{{ skuSearchValue }}</code>
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>