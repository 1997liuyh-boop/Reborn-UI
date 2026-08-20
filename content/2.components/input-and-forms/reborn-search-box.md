---
title: 搜索框
description: 用于带下拉面板的双端搜索框组件，支持历史记录、推荐词与 SKU 属性筛选。
category: 表单与输入
tags: [css, tailwind, input, search, reborn]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSearchBoxDemo.vue" config="RebornSearchBoxConfig" componentId="reborn-search-box" :componentFiles='["RebornSearchBox.vue", "reborn-search-box.config.ts"]' :uniappFiles='["RebornSearchBox.vue", "reborn-search-box.config.ts"]'}
::

## 简介

SearchBox 是双端搜索框组件。Web 端内部组合了 `RebornInput`、`RebornSelect` 与 `RebornSku`：左侧为目录选择器，右侧含相机图标与搜索按钮，聚焦时展开下拉面板展示历史记录、推荐搜索或 SKU 属性筛选（`mode="sku"`）。UniApp 端为移动端形态：输入框 + 原/译切换 + 相机入口 + 站点选择弹层。历史记录默认写入本地存储（最多 10 条），可通过 `saveHistory` / `removeHistory` 自定义存取。

适用场景：

- 电商、文档站搜索框，需要历史记录与推荐搜索下拉面板时。
- SKU 模式按商品属性筛选（`mode="sku"` + `skuAttributes`，配合 `select-sku` 事件）。
- 需要图片搜索入口时（`trailing` 默认含相机图标，`click-camera` / `clickCamera` 事件）。

不适用场景：

- 普通文本录入改用 `reborn-input`。
- 从固定选项集中选择改用 `reborn-select`。

## 用法

### 基础用法（Web）

Web 端 `v-model` 绑定的是对象 `{ inputValue, selectValue, ...sku }`：`inputValue` 为输入文本、`selectValue` 为左侧选择器的值。`selectAttrs` 透传选择器配置，`recommendKeywords` 提供推荐搜索词。

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref({ inputValue: "", selectValue: "1" });
const options = [
  { label: "Mercari", value: "1" },
  { label: "Yahoo", value: "2" },
];
</script>

<template>
  <RebornSearchBox
    v-model="value"
    placeholder="搜索您感兴趣的内容..."
    :select-attrs="{ options }"
    :recommend-keywords="['iPhone 15 Pro', 'MacBook Air M3']"
    @search="(val) => console.log('搜索:', val)"
    @click-camera="() => console.log('图片搜索')"
  />
</template>
```

### SKU 属性搜索模式

`mode="sku"` 时下拉面板渲染 `skuAttributes` 属性筛选区，各属性的选中值合并进 `modelValue`（以属性 `key` 为字段名）；属性变化触发 `select-sku` 事件，参数为 `{ label, value }`。

```vue
<template>
  <RebornSearchBox
    v-model="skuValue"
    mode="sku"
    :sku-attributes="[
      {
        title: '发货地', key: 'origin', multiple: true,
        labelKey: 'label', valueKey: 'value',
        children: [
          { label: '日本', value: 'jp' },
          { label: '美国', value: 'us' },
        ],
      },
    ]"
    @select-sku="(attr) => console.log(attr.label, attr.value)"
  />
</template>
```

### 历史记录存取

历史记录默认存于本地存储（key 为 `reborn-search-history`，最多 10 条）。传入 `saveHistory` / `removeHistory` 可改为自定义存取（如同步到服务端）；`showHistory` 可关闭历史区块。

```vue
<template>
  <RebornSearchBox
    v-model="value"
    :save-history="(list) => api.saveHistory(list)"
    :remove-history="() => api.clearHistory()"
  />
</template>
```

### UniApp 端用法

UniApp 端 `v-model` 绑定字符串，`search` 事件在键盘确认键触发；`rounded` / `clearable` / `border` / `disabled` 控制外观与交互，默认插槽可替换右侧相机图标。

```vue
<template>
  <RebornSearchBox
    v-model="keyword"
    placeholder="关键词/商品ID/网址"
    size="sm"
    color="primary"
    :rounded="true"
    @search="handleSearch"
    @click-camera="handleCamera"
  >
    <view class="i-lucide-scan-line text-[48rpx]" />
  </RebornSearchBox>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | Web `SearchBoxModelValue` / UniApp `string` | Web `{ inputValue: "", selectValue: "" }` / UniApp `""` | 绑定值，支持 `v-model`；Web 端为对象（见下方 SearchBoxModelValue），UniApp 端为输入文本字符串。 |
| `placeholder` | `string` | `"请输入搜索内容"` | 占位文本。 |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 主题颜色，作用于聚焦边框与搜索按钮。 |
| `mode` | `"associate" \| "sku"` | `"associate"` | 下拉面板模式：联想/历史 或 SKU 属性筛选（仅 Web 端实现）。 |
| `showDropdown` | `boolean` | `true` | 聚焦时是否展开下拉面板（仅 Web 端实现）。 |
| `showHistory` | `boolean` | `true` | 是否显示历史记录区块（仅 Web）。 |
| `skuAttributes` | `SkuAttribute[]` | `[]` | SKU 模式下的属性列表（仅 Web 端实现）。 |
| `saveHistory` | `(history: string[]) => void` | `undefined` | 自定义保存历史记录的方法，不传时写入本地存储。 |
| `removeHistory` | `() => void` | `undefined` | 自定义清空历史记录的方法，不传时清除本地存储。 |
| `recommendKeywords` | `string[]` | `[]` | 推荐搜索关键词列表（仅 Web）。 |
| `historyTitle` | `string` | `"历史记录"` | 历史记录区块标题（仅 Web）。 |
| `emptyHistoryLabel` | `string` | `"暂无最近的搜索记录"` | 空历史记录提示文字（仅 Web）。 |
| `recommendTitle` | `string` | `"推荐搜索"` | 推荐搜索区块标题（仅 Web）。 |
| `clearAllLabel` | `string` | `"清空全部"` | 清空全部历史记录按钮文字（仅 Web）。 |
| `class` | `any` | `undefined` | 追加到根节点的自定义类名（仅 Web）。 |
| `ui` | `SearchBoxUi` | `{}` | 组件自身 UI 覆盖，见下方「自定义样式（ui）」（仅 Web）。 |
| `inputUi` | `InputUi` | `{}` | 内部 `RebornInput` 的 UI 覆盖（仅 Web）。 |
| `selectUi` | `SelectUi` | `{}` | 内部 `RebornSelect` 的 UI 覆盖（仅 Web）。 |
| `selectAttrs` | `SelectProps` | `undefined` | 透传给左侧下拉选择器的属性（如 `options`）（仅 Web）。 |
| `customClass` | `any` | `undefined` | 追加到根节点的自定义类名（仅 UniApp）。 |
| `placeholderClass` | `string` | `"text-gray-5"` | 透传给内部输入框的占位符样式类（仅 UniApp）。 |
| `disabled` | `boolean` | `false` | 是否禁用输入（仅 UniApp）。 |
| `rounded` | `boolean` | `true` | 是否使用圆角（药丸形）外观（仅 UniApp）。 |
| `clearable` | `boolean` | `true` | 是否显示一键清空按钮（仅 UniApp）。 |
| `border` | `boolean` | `false` | 是否显示输入框边框（仅 UniApp）。 |

### SearchBoxModelValue（Web）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `inputValue` | `string` | 输入框文本。 |
| `selectValue` | `string \| number` | 左侧下拉选择器选中值。 |
| `[key: string]` | `any` | SKU 属性选中值，仅 `mode="sku"` 时存在，字段名为属性 `key`。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | Web `(value: SearchBoxModelValue)` / UniApp `(value: string)` | 输入、选择器或 SKU 值变化时触发，同步 `v-model`。 |
| `search` | Web `(value: SearchBoxModelValue)` / UniApp `(value: string)` | Web 端点击搜索按钮、按下回车或选中历史记录时触发；UniApp 端键盘确认键触发。非空关键字会写入历史记录。 |
| `click-camera` | `-` | 点击相机图标时触发（Web 端短横线命名）。 |
| `clickCamera` | `-` | 点击相机区域时触发（UniApp 端驼峰命名）。 |
| `select-sku` | `(attr: { label: string, value: string \| number })` | 左侧选择器或 SKU 属性变化时触发，`label` 为属性 `key`（选择器变更时为 `"selectValue"`）、`value` 为选中值（Web 端短横线命名）。 |
| `selectSku` | `(attr)` | `select-sku` 的 UniApp 端驼峰命名；当前 UniApp 实现为预留声明，尚未触发。 |
| `focus` | `(event)` | 输入框获得焦点时触发；Web 端在 `showDropdown` 开启时同时展开下拉面板。 |
| `blur` | `(event)` | 输入框失去焦点时触发；Web 端若焦点仍在组件内部则不收起面板。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `-` | UniApp 端：自定义右侧相机区域内容（默认为相机图标）。 |
| `select-trigger` | `{ displayText, ui }` | 自定义左侧选择器触发区域的显示内容（仅 Web）。 |
| `trailing` | `{ ui }` | 自定义后置图标区域（默认包含相机图标，仅 Web）。 |
| `search-button` | `{ ui }` | 自定义搜索按钮内容（默认包含搜索图标，仅 Web）。 |
| `dropdown` | `{ ui, history }` | 完全接管下拉面板内容（仅 Web）。 |
| `sku-list` | `{ ui, attributes }` | 自定义 SKU 属性筛选区块（仅 Web，`mode="sku"` 时）。 |
| `history` | `{ history, ui }` | 自定义历史记录标签列表（仅 Web）。 |
| `recommend-list` | `{ ui, selectRecommend }` | 自定义推荐搜索区块，`selectRecommend(keyword)` 可将词写入输入框（仅 Web）。 |

### 自定义样式（ui）

Web 端 `ui` 属性按 `SearchBoxUi` 的键覆盖对应节点类名，常用键：

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `backdropCard` | 展开状态下的底色卡片。 |
| `inputWrapper` / `input` | 输入框包裹层 / 输入框。 |
| `cameraIcon` | 相机图标。 |
| `dropdownOuter` / `dropdown` | 下拉面板外层 / 内容容器。 |
| `section` / `sectionTitle` | 面板区块 / 区块标题。 |
| `historyTags` / `historyTag` / `deleteIcon` / `clearAll` | 历史标签列表 / 单个标签 / 删除图标 / 清空按钮。 |
| `associateList` / `associateItem` / `recommendIcon` | 推荐列表 / 推荐项 / 推荐图标。 |
| `leadingWrapper` / `trailingWrapper` / `separator` | 前置区 / 后置区 / 分隔线。 |
| `searchIconInner` / `emptyText` | 搜索按钮图标 / 空历史提示。 |

另有 `inputUi`（键见 `RebornInput`）与 `selectUi`（含 `internalDropdown`、`internalOption` 等内部选项键）用于覆盖内部组件样式。

## 注意事项

- Web、UniApp 双端可用，但 `modelValue` 类型不同：Web 端为 `{ inputValue, selectValue, ...sku }` 对象，UniApp 端为字符串，跨端复用时需分别处理。
- 相机与 SKU 事件同时存在两种命名：Web 端短横线（`click-camera` / `select-sku`），UniApp 端驼峰（`clickCamera` / `selectSku`）；其中 UniApp 端 `selectSku` 当前为预留声明、尚未触发。
- 下拉面板（历史记录 / 推荐搜索 / SKU 筛选）仅 Web 端实现；UniApp 端的 `mode`、`showDropdown`、`skuAttributes` 暂不生效。
- `showDropdown` 与 `showHistory` 默认开启；历史记录默认写入 `localStorage`（Web）/ `uni.setStorageSync`（UniApp），key 为 `reborn-search-history`、最多保留 10 条，可用 `saveHistory` / `removeHistory` 自定义存取。
- Web 端内部组合了 `RebornInput` / `RebornSelect` / `RebornSku`，可通过 `inputUi` / `selectUi` / `selectAttrs` 透传定制；传给 SearchBox 的具名插槽会穿透转发给 SKU 面板（如属性自定义插槽 `#price`）。
- UniApp 端内置「原/译」切换按钮与站点选择入口（图标为内置图片地址），业务中如不需要可自行覆盖样式隐藏。
