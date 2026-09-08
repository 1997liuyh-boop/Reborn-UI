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

SearchBox 是双端搜索框组件。Web 端是围绕 `RebornInput` 的**纯插槽基元**：内部输入框恒为 `borderless`，**外层边框**落在最外层的**控件行**上，把外置插槽一并囊括在内（默认 `gray-4`；输入框区的水平内边距同时充当与外置插槽的间距，按尺寸取 `sm` 为 `8px`、`md` / `lg` 为 `12px`）。激活高亮只由**输入框自身的焦点**驱动，且画在哪一层取决于有没有外置插槽：没有 `leading` / `trailing` 时整行就是输入框，直接把外层边框换成当前 `color` 色族 5 阶；一旦存在外置插槽，外层边框**恒为 `gray-4` 不变色**，改为只在**输入框区内另起一圈**描边（按尺寸内缩 2 / 3 / 4px），这样点外置插槽里的选择器、按钮时不会出现任何描边，外置插槽也不会跟着变色。外置插槽的高度与输入框区一样撑满整行。插槽分为两族：`input-leading` / `input-trailing` 转发到内部输入框的 `prefix` / `suffix`，内容落在**输入框内部**、贴着文本排布；`leading`（前置选择器区）、`trailing`（后置功能区）是搜索框自身的插槽，与输入框区并列排在控件行里。这些区域与 `dropdown`（下拉面板）一样不渲染任何默认内容，完全由插槽组合——左侧选择器自行放入 `RebornSelect`、相机与搜索按钮按需放进输入框内或外置区（`trailing` 作用域透出 `search` 方法）、历史/推荐/SKU 面板经 `dropdown` 拼装（作用域透出样式辅助键与历史操作方法）。`shape` 与 `RebornInput` 的同名 API 对齐（circle 胶囊 / square 令牌圆角），底色卡片圆角随之与输入框对齐、面板只保留下半圆角；`inputAttrs` 可向内部输入框 v-bind 透传任意属性（`variant` 除外，恒为 `borderless`）。UniApp 端为移动端形态：输入框 + 原/译切换 + 相机入口 + 站点选择弹层。历史记录默认写入本地存储（最多 10 条），可通过 `saveHistory` / `removeHistory` 自定义存取。

适用场景：

- 电商、文档站搜索框，需要历史记录与推荐搜索下拉面板时（经 `dropdown` 插槽构建）。
- 按商品属性筛选：把 `RebornSku` 放进 `dropdown` 插槽组合使用。
- 需要目录选择器、图片搜索等自定义入口时（经 `leading` / `trailing` 插槽提供并自行处理交互）。

不适用场景：

- 普通文本录入改用 `reborn-input`。
- 从固定选项集中选择改用 `reborn-select`。

## 用法

### 基础用法（Web）

Web 端 `v-model` 绑定的是对象 `{ inputValue, selectValue, ... }`：`inputValue` 为输入文本、`selectValue` 供 `leading` 插槽里的选择器使用。各区域全是插槽：`leading` 自行组合 `RebornSelect`（作用域透出 `ui`）、`trailing` 提供搜索按钮（作用域透出 `search` 方法）、`input-leading` / `input-trailing` 放输入框内的图标（作用域另透出内部输入框的 `inputUi`）、`dropdown` 拼面板内容（作用域透出 `ui` 与 `history` / `selectHistory` / `removeHistoryItem` / `clearHistory` / `selectRecommend`）。外层边框由控件行承担，四族插槽都在这层边框之内；有外置插槽时聚焦描边只画在输入框区内。

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
    @search="(val) => console.log('搜索:', val)"
  >
    <!-- 外置前置选择器区无默认内容：自行放入 RebornSelect，分隔线等装饰样式自行提供 -->
    <template #leading>
      <RebornSelect v-model="value.selectValue" :options="options" :bordered="false" @click.stop />
      <div class="w-px h-5 shrink-0 bg-[#D3D2D9]!" />
    </template>

    <!-- 输入框内置后置区：相机图标贴着输入文本排布 -->
    <template #input-trailing>
      <Icon name="lucide:camera" class="text-2xl text-gray-5 cursor-pointer" @click.stop="onCamera" />
    </template>

    <!-- 外置后置区无默认内容：搜索按钮自行提供，search 触发搜索 -->
    <template #trailing="{ search }">
      <RebornButton size="sm" @click.stop="search">
        <Icon name="lucide:search" class="size-5" />
      </RebornButton>
    </template>

    <!-- 面板内容完全由插槽构建，装饰样式自行提供 -->
    <template #dropdown="{ history, selectHistory, clearHistory }">
      <div class="flex flex-col gap-3">
        <div class="text-lg font-bold text-gray-8 flex items-center justify-between">
          <span>搜索历史</span>
          <div v-if="history.length" class="text-base text-gray-5 cursor-pointer hover:underline" @click="clearHistory">清空</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <RebornBadge v-for="h in history" :key="h" :label="h" @click="selectHistory(h)" />
        </div>
      </div>
    </template>
  </RebornSearchBox>
</template>
```

### 外置插槽：leading / trailing

`leading` / `trailing` 是搜索框自身的插槽，与输入框区并列排在**控件行**里，因此同样被外层边框囊括在内，高度也与输入框区一样撑满整行。存在外置插槽时外层边框恒为 `gray-4` 不变色，激活高亮改为**只在输入框区内另起一圈**（按尺寸内缩 2 / 3 / 4px，圆角与外形对齐）——点左侧选择器、右侧按钮时不会出现任何描边，只有点进输入框才会。输入框区的水平内边距（同时充当与外置插槽的间距）按尺寸给出：`sm` 为 8px，`md` / `lg` 为 12px。

```vue
<template>
  <RebornSearchBox v-model="value" size="md" shape="square" :show-dropdown="false">
    <!-- 外置前置：搜索源选择器 + 分隔线（分隔线样式自行提供） -->
    <template #leading>
      <RebornSelect v-model="value.selectValue" :options="options" :bordered="false" @click.stop />
      <div class="w-px h-5 shrink-0 bg-[#D3D2D9]!" />
    </template>

    <!-- 外置后置：搜索按钮，作用域透出 search 直接触发搜索 -->
    <template #trailing="{ search }">
      <RebornButton size="md" @click.stop="search">
        <Icon name="lucide:search" class="size-5" />
      </RebornButton>
    </template>
  </RebornSearchBox>
</template>
```

### 内置插槽：input-leading / input-trailing

`input-leading` / `input-trailing` 会转发到内部 `RebornInput` 的 `prefix` / `suffix`，内容落在**输入框内部**、贴着文本排布，随输入框一起进入激活态；作用域除 `ui` 外还额外透出 `inputUi`，可直接套用输入框自身的样式键。

```vue
<template>
  <RebornSearchBox v-model="value" size="md" shape="square" :show-dropdown="false">
    <!-- 内置前置：放大镜 -->
    <template #input-leading>
      <Icon name="lucide:search" class="size-5" />
    </template>

    <!-- 内置后置：相机入口 -->
    <template #input-trailing>
      <Icon name="lucide:camera" class="text-2xl text-gray-5 cursor-pointer" @click.stop="onCamera" />
    </template>
  </RebornSearchBox>
</template>
```

### 圆角与属性透传

`shape` 与 `RebornInput` 对齐：`circle`（默认）为胶囊；`square` 统一取 `rounded-ui-xs`（6px）令牌、不分尺寸，底色卡片的上半圆角随之和输入框对齐，下拉面板只保留下半圆角（上半被底色卡片覆盖、无缝衔接）。`inputAttrs` 会 v-bind 透传给内部 `RebornInput`（`size` / `color` / `shape` / `placeholder` 等显式 prop 优先级更高）。

```vue
<template>
  <RebornSearchBox
    v-model="value"
    shape="square"
    :input-attrs="{ maxlength: 20 }"
  />
</template>
```

### 组合 SKU 属性筛选

把 `RebornSku` 直接放进 `dropdown` 插槽即可组合出属性筛选面板；属性变化时自行合并进绑定值并按需触发业务逻辑。

```vue
<template>
  <RebornSearchBox v-model="skuValue" placeholder="搜索商品属性...">
    <template #dropdown>
      <RebornSku
        :model-value="skuValue"
        :options="skuAttributes"
        @update:model-value="(val) => (skuValue = val)"
        @click.stop
      />
    </template>
  </RebornSearchBox>
</template>
```

### 历史记录存取

历史记录默认存于本地存储（key 为 `reborn-search-history`，最多 10 条）。传入 `saveHistory` / `removeHistory` 可改为自定义存取（如同步到服务端）；面板里如何呈现历史由 `dropdown` 插槽决定。

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
| `shape` | `"circle" \| "square"` | `"circle"` | 外形轮廓，与 `RebornInput` 的同名 API 对齐：circle 胶囊 / square 统一取 `rounded-ui-xs` 令牌（不分尺寸）；底色卡片圆角随之与输入框对齐，下拉面板只保留下半圆角（仅 Web）。 |
| `showDropdown` | `boolean` | `true` | 聚焦时是否展开下拉面板（面板内容完全由 `dropdown` 插槽提供，仅 Web 端实现）。 |
| `saveHistory` | `(history: string[]) => void` | `undefined` | 自定义保存历史记录的方法，不传时写入本地存储。 |
| `removeHistory` | `() => void` | `undefined` | 自定义清空历史记录的方法，不传时清除本地存储。 |
| `class` | `any` | `undefined` | 追加到根节点的自定义类名（仅 Web）。 |
| `ui` | `SearchBoxUi` | `{}` | 组件自身 UI 覆盖，见下方「自定义样式（ui）」（仅 Web）。 |
| `inputUi` | `InputUi` | `{}` | 内部 `RebornInput` 的 UI 覆盖（仅 Web）。 |
| `inputAttrs` | `Partial<InputProps>` | `undefined` | v-bind 透传给内部 `RebornInput` 的属性；`variant` 不可覆盖（恒为 `borderless`，外层边框统一由控件行承担），`size` / `color` / `shape` / `placeholder` 等显式 prop 优先级更高（仅 Web）。 |
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
| `selectValue` | `string \| number` | 供 `leading` 插槽里的选择器使用的选中值（组件本身不再内置选择器，由插槽内容自行读写）。 |
| `[key: string]` | `any` | 扩展字段：在 `dropdown` 插槽中组合 `RebornSku` 等筛选内容时可自行并入。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | Web `(value: SearchBoxModelValue)` / UniApp `(value: string)` | 输入值变化时触发，同步 `v-model`（Web 端由 `defineModel` 生成）。 |
| `search` | Web `(value: SearchBoxModelValue)` / UniApp `(value: string)` | Web 端按下回车、调用 `trailing` 作用域的 `search` 方法或经 `dropdown` 作用域 `selectHistory` 选中历史时触发；UniApp 端键盘确认键触发。非空关键字会写入历史记录。 |
| `clickCamera` | `-` | 点击相机区域时触发（仅 UniApp；Web 端后置区域无默认内容，相机入口经 `trailing` 插槽提供并自行处理点击）。 |
| `selectSku` | `(attr)` | 仅 UniApp 的预留声明，尚未触发；Web 端已无内置选择器，选择器变化由 `leading` 插槽内容自行处理。 |
| `focus` | `(event)` | 输入框获得焦点时触发；Web 端在 `showDropdown` 开启时同时展开下拉面板。 |
| `blur` | `(event)` | 输入框失去焦点时触发；Web 端若焦点仍在组件内部则不收起面板。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `-` | UniApp 端：自定义右侧相机区域内容（默认为相机图标）。 |
| `input-leading` | `{ ui, inputUi, search }` | 输入框内置前置插槽，转发到内部 `RebornInput` 的 `prefix`，**内容落在输入框内部、贴着文本排布并随输入框一起进入激活态**，无默认内容；`inputUi` 为输入框自身的样式辅助键（仅 Web）。 |
| `input-trailing` | `{ ui, inputUi, search }` | 输入框内置后置插槽，转发到内部 `RebornInput` 的 `suffix`，**内容落在输入框内部、贴着文本排布并随输入框一起进入激活态**，无默认内容（仅 Web）。 |
| `leading` | `{ ui }` | 搜索框外置前置插槽，**与输入框区并列排在控件行里（被外层边框囊括在内、高度撑满整行），获得焦点时不出现描边，无默认内容**：自行放入 `RebornSelect` 等内容；包裹层点击会收起面板并阻止冒泡；分隔线等装饰样式由插槽内容自行提供（仅 Web）。 |
| `trailing` | `{ ui, search }` | 搜索框外置后置插槽，**与输入框区并列排在控件行里（被外层边框囊括在内、高度撑满整行），获得焦点时不出现描边，无默认内容**：搜索按钮、相机图标等自行提供（样式也由内容自带），`search()` 调用即触发搜索（仅 Web）。 |
| `dropdown` | `{ ui, history, selectHistory, removeHistoryItem, clearHistory, selectRecommend }` | 下拉面板内容，**无默认内容、完全由该插槽提供**：`history` 为历史记录列表，`selectHistory(kw)` 选中并搜索、`removeHistoryItem(kw)` 删除单条、`clearHistory()` 清空、`selectRecommend(kw)` 回填输入框；面板内容的装饰样式由插槽内容自行提供（仅 Web）。 |

### 自定义样式（ui）

Web 端 `ui` 属性按 `SearchBoxUi` 的键覆盖对应节点类名，常用键：

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `backdropCard` | 展开状态下的底色卡片。 |
| `control` | 控件行：横向排布「外置前置插槽 + 输入框区 + 外置后置插槽」，承担**外层边框**；无外置插槽时聚焦高亮也落在这一层。 |
| `inputWrapper` | 输入框区（结构层，承担水平内边距；有外置插槽时聚焦描边以 `::before` 覆盖层画在这一层内）。 |
| `dropdownOuter` / `dropdown` | 下拉面板外层 / 内容容器。 |
| `leadingWrapper` / `trailingWrapper` | 外置前置区 / 外置后置区（高度均撑满整行，内容自身居中）。 |

另有 `inputUi`（键见 `RebornInput`）用于覆盖内部输入框样式。外层边框落在 `control`（控件行）这一层，默认 `border-gray-4`；激活态由组件内部的 `focus` / `blur` 事件维护，而非 CSS `focus-within`，因此点中 `leading` 里的 `RebornSelect` 等可聚焦元素不会点亮任何描边。聚焦描边画在哪一层由**有无外置插槽**决定：无外置插槽时直接把 `control` 的边框换成 `color` 对应色族 5 阶（primary→brand-5、success→green-5 …）；有外置插槽时 `control` 恒为 `gray-4`，改由 `inputWrapper` 的 `::before` 覆盖层在输入框区内画一圈同色描边（绝对定位、不参与布局，按尺寸内缩 `2px` / `3px` / `4px`，圆角随 `shape` 对齐：circle 胶囊 / square 统一 `rounded-ui-xs`）。输入框区的水平内边距（兼作与外置插槽的间距）按尺寸取 `8px`（sm）/ `12px`（md、lg），可用 `inputWrapper` 键覆盖。组件样式统一走浅色令牌，不再内置 `dark:` 前缀样式；需要深色适配时经 `ui` / `inputUi` 覆盖。

## 注意事项

- Web、UniApp 双端可用，但 `modelValue` 类型不同：Web 端为 `{ inputValue, selectValue, ... }` 对象，UniApp 端为字符串，跨端复用时需分别处理。
- **Web 端所有插槽区域均无默认内容**：选择器经 `leading` 插槽放入、搜索按钮经 `trailing` 插槽提供（作用域 `search()` 触发搜索）、输入框内的图标经 `input-leading` / `input-trailing` 放入、面板由 `dropdown` 插槽拼装；不填插槽则对应区域不渲染，仅剩输入框本体（回车仍可搜索）。
- **外层边框由控件行承担、把外置插槽囊括在内**：内部 `RebornInput` 恒为 `variant: 'borderless'`（`inputAttrs` 不可覆盖，避免双层描边），外层边框统一落在控件行（`ui.control`）上，`leading` / `trailing` 与输入框区一同被围在里面，且高度都撑满整行。
- **激活高亮只认输入框的焦点，且分两种画法**：组件内部以 `focus` / `blur` 维护激活态（而非 CSS `focus-within`）。无外置插槽时聚焦换掉控件行的边框色；有外置插槽时控件行恒为 `gray-4`，改在输入框区内用 `::before` 覆盖层另起一圈——两种情况下点中 `leading` 里的 `RebornSelect`、`trailing` 里的按钮都不会出现描边。
- **插槽分两族、决定内容落在输入框内还是外**：`input-leading` / `input-trailing` 转发到 `RebornInput` 的 `prefix` / `suffix`，内容贴着输入文本排布；`leading` / `trailing` 与输入框区并列排在控件行里，间距按尺寸取 8px / 12px。
- `selectSku` 事件双端声明均为驼峰（模板可用 `@select-sku` 监听）：Web 端仅左侧选择器触发；UniApp 端为预留声明、尚未触发。UniApp 端另有 `clickCamera` 事件。
- 下拉面板仅 Web 端实现；UniApp 端的 `showDropdown` / `shape` / `inputAttrs` 暂不生效。
- 历史记录默认写入 `localStorage`（Web）/ `uni.setStorageSync`（UniApp），key 为 `reborn-search-history`、最多保留 10 条，可用 `saveHistory` / `removeHistory` 自定义存取；即便面板不展示历史，`search` 仍会把非空关键字写入历史。
- Web 端内部只组合 `RebornInput`，可通过 `inputUi` / `inputAttrs` 透传定制；选择器等内容一律经 `leading` 插槽由使用方组合。
- UniApp 端内置「原/译」切换按钮与站点选择入口（图标为内置图片地址），业务中如不需要可自行覆盖样式隐藏。
