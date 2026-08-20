---
title: PickerView 选择器视图
description: 用于内嵌页面滚动选择多列选项的 uniapp 选择器视图组件。
category: 表单与输入
tags: [uniapp, picker, picker-view, form]
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::warning
仅 UniApp 端组件。需要「触发器 + 弹层」的完整下拉选择请使用 `reborn-select`，日期选择请使用 `reborn-select-date`。
::
::ComponentViewer{demoFile="RebornPickerViewDemo.vue" config="RebornPickerViewConfig" componentId="reborn-picker-view" :componentFiles='[]' :uniappFiles='["RebornPickerView.vue", "reborn-picker-view.config.ts", "index.ts"]' dependencies="clsx, lodash-es"}
::

## 简介

PickerView 是基于 uni-app `picker-view` 封装的滚动选择视图：不带弹层，直接内嵌在页面或自定义弹层中使用。`columns` 传入 `SelectOption` 二维数组即可渲染多列，配合 `headers` 可为每列显示标题；绑定值为 `value`（各列选中项的索引数组），通过 `v-model:value` 双向同步。它也是 `reborn-select` 的底层选择视图，适合需要自行组织弹层或页面内联选择的定制场景。

适用场景：

- 需要直接内嵌在页面/弹层中的滚动选择列表（组件本身不带弹层）。
- 多列选择：`columns` 传 `SelectOption` 二维数组，并可配 `headers` 列标题。
- 作为 `reborn-select` 底层选择视图之外的独立定制场景。

不适用场景：

- 需要触发器加弹层的完整下拉选择，改用 `reborn-select`。
- 日期选择，改用 `reborn-select-date`。

## 用法

### 基础用法

`columns` 为二维选项数组（每个子数组是一列），`v-model:value` 绑定各列选中索引；`@change-value` 回调拿到各列选中项的 `value`。

```vue
<script setup lang="ts">
import { ref } from "vue";
import RebornPickerView from "@/components/reborn-picker-view/RebornPickerView.vue";

const columns = ref([
  [
    { label: "周一", value: 1 },
    { label: "周二", value: 2 },
    { label: "周三", value: 3 },
    { label: "周四", value: 4 },
    { label: "周五", value: 5 },
  ],
  [
    { label: "上午", value: 1 },
    { label: "下午", value: 2 },
  ],
]);

const value = ref([0, 0]); // 各列选中项的索引
const selectedValues = ref<any[]>([]);

function onChange(vals: any[]) {
  selectedValues.value = vals;
}
</script>

<template>
  <view class="w-full overflow-hidden rounded-lg bg-white">
    <RebornPickerView
      v-model:value="value"
      :columns="columns"
      :height="300"
      @change-value="onChange"
    />
  </view>
</template>
```

### 列标题与主题色

`headers` 依次对应每一列的标题（多余的会被截断）；`color` 控制选中指示器与高亮文字的主题色。

```vue
<template>
  <RebornPickerView
    v-model:value="value"
    :columns="columns"
    :headers="['星期', '时段']"
    color="success"
  />
</template>
```

### 自定义选项渲染

默认插槽提供 `{ item, index }` 作用域，可替换默认的文本渲染：

```vue
<template>
  <RebornPickerView
    v-model:value="value"
    :columns="columns"
  >
    <template #default="{ item }">
      <text class="text-28 font-medium">{{ item.label }}</text>
    </template>
  </RebornPickerView>
</template>
```

## API

### Props

| 属性名       | 类型                                                                                   | 默认值                 | 描述                                                      |
| :----------- | :------------------------------------------------------------------------------------- | :--------------------- | :-------------------------------------------------------- |
| `value`      | `number[]`                                                                             | `[]`                   | 各列选中项的索引数组，支持 `v-model:value` 双向绑定。     |
| `columns`    | `SelectOption[][]`（`{ label: string, value: any, children?, [key: string]: any }`）   | `[]`                   | 列数据，二维数组的每个子数组渲染为一列。                  |
| `headers`    | `string[]`                                                                             | `[]`                   | 各列顶部标题，超出列数的部分会被截断。                    |
| `color`      | `'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                | `'primary'`            | 主题色，作用于选中指示器背景与选中文字。                  |
| `itemHeight` | `number`                                                                               | `isAppIOS() ? 50 : 42` | 单个选项行高，单位 px；iOS App 默认 50，其余平台默认 42。 |
| `height`     | `number`                                                                               | `300`                  | 选择区域整体高度，单位 px。                               |
| `ui`         | `Partial<{ wrapper, header, headerText, pickerContainer, item, itemText, indicator }>` | `-`                    | 按内部结构键覆盖类名，见下方「自定义样式（ui）」。        |

### Emits

| 事件名         | 参数                  | 描述                                                       |
| :------------- | :-------------------- | :--------------------------------------------------------- |
| `update:value` | `(indexes: number[])` | 选中索引变化时触发（`v-model:value` 内部事件）。           |
| `change-value` | `(values: any[])`     | 选中项变化时触发，参数为各列选中项的 `value` 组成的数组。  |
| `change-index` | `(indexes: number[])` | 选中项变化时触发，参数为各列选中项的索引数组。             |
| `change-item`  | `(item: any)`         | 选中项变化时触发，参数为各列选中的完整选项对象组成的数组。 |

### Slots

| 插槽名    | 作用域参数        | 描述                                                   |
| :-------- | :---------------- | :----------------------------------------------------- |
| `default` | `{ item, index }` | 自定义每个选项的渲染内容，默认渲染 `item.label` 文本。 |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的 Tailwind/Uno 类名：

| 键名              | 说明                       |
| :---------------- | :------------------------- |
| `wrapper`         | 最外层容器。               |
| `header`          | 列标题行容器。             |
| `headerText`      | 单个列标题文本。           |
| `pickerContainer` | `picker-view` 外层容器。   |
| `item`            | 单个选项行。               |
| `itemText`        | 选项文本。                 |
| `indicator`       | 选中指示器（中间高亮条）。 |

## 注意事项

- 仅 UniApp 端可用。
- 绑定使用 `value` + `update:value`（即 `v-model:value`，值为各列选中索引的 `number[]`），而非 `modelValue`。
- `itemHeight` 默认值区分平台：iOS App 为 50，其余平台为 42；整体高度 `height` 默认 300，两者单位均为 px（非 rpx）。
- 变化事件有 `change-value` / `change-index` / `change-item` 三种粒度，分别拿到值、索引与完整选项对象，按需监听其一即可。
- App-Android 端列内容通过 canvas 绘制以优化性能，此时 `default` 插槽的自定义渲染不生效。
- 组件会拦截选择区域内的 touch 事件冒泡，嵌入可滚动弹层时无需额外处理滚动穿透。
