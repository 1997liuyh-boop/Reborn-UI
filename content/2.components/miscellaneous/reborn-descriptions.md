---
title: 描述列表
description: 用于以键值对多列布局展示详情信息的描述列表组件，仅 web 端。
category: 杂项
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

## 基础用法

::ComponentViewer{demoFile="RebornDescriptionsDemo.vue" config="RebornDescriptionsConfig" componentId="reborn-descriptions" :componentFiles='["RebornDescriptions.vue", "reborn-descriptions.config.ts"]'}
::

## API

### RebornDescriptions

支持两种数据来源：`items` 数组（数据驱动）或 `RebornDescriptionsItem` 子组件（声明式）。

### Props

| 属性名                | 类型                                | 默认值         | 说明                                                                                                               |
| :-------------------- | :---------------------------------- | :------------- | :----------------------------------------------------------------------------------------------------------------- |
| `title`               | `string`                            | `-`            | 标题文字；也可通过 `title` 插槽完全自定义                                                                          |
| `column`              | `number`                            | `3`            | 每行显示的列数（一项占一列，含标签 + 内容）                                                                        |
| `responsive`          | `boolean`                           | `true`         | 是否根据容器宽度自适应列数。`true`：< 480px 为 1 列，< 640px 最多 2 列，否则使用 `column`                          |
| `size`                | `'sm' \| 'md' \| 'lg'`              | `'md'`         | 单元格内边距与字号                                                                                                 |
| `border`              | `'bordered' \| 'divider' \| 'none'` | `'divider'`    | 边框样式：`bordered` 表格外框 + 单元格网格线；`divider` 仅行分割线（默认）；`none` 无边线                          |
| `direction`           | `'horizontal' \| 'vertical'`        | `'horizontal'` | 排列方向：水平为标签与内容同一行并排；垂直为标签行在上、内容行在下                                                 |
| `colon`               | `boolean`                           | `true`         | 标签后是否显示中文冒号                                                                                             |
| `rounded`             | `boolean`                           | `true`         | 表格外层是否圆角                                                                                                   |
| `label-background`    | `string`                            | `-`            | 标签列背景色（CSS 颜色值），可被单项覆盖                                                                           |
| `content-background`  | `string`                            | `-`            | 内容列背景色（CSS 颜色值），可被单项覆盖                                                                           |
| `label-color`         | `string`                            | `-`            | 标签列字体颜色，可被单项覆盖                                                                                       |
| `content-color`       | `string`                            | `-`            | 内容列字体颜色，可被单项覆盖                                                                                       |
| `label-bold`          | `boolean`                           | `false`        | 标签列字体加粗，可被单项覆盖                                                                                       |
| `content-bold`        | `boolean`                           | `false`        | 内容列字体加粗，可被单项覆盖                                                                                       |
| `label-width`         | `string`                            | `-`            | 标签单元格最小宽度，如 `'120px'`                                                                                   |
| `label-align`         | `'left' \| 'center' \| 'right'`     | `'left'`       | 标签单元格水平对齐                                                                                                 |
| `content-align`       | `'left' \| 'center' \| 'right'`     | `'left'`       | 内容单元格水平对齐                                                                                                 |
| `label-line-height`   | `DescriptionsLineHeight \| string`  | `'relaxed'`    | 标签行高。预设：`none` / `tight` / `snug` / `normal` / `relaxed` / `loose`；也可传自定义 CSS，如 `'1.8'`、`'28px'` |
| `content-line-height` | `DescriptionsLineHeight \| string`  | `'relaxed'`    | 内容行高，规则同 `label-line-height`                                                                               |
| `items`               | `DescriptionsItem[]`                | `-`            | 数据驱动模式，见下方 [items 数据驱动](#items-数据驱动)                                                             |
| `class`               | `any`                               | `-`            | 根节点自定义类名                                                                                                   |
| `ui`                  | `Record<string, string>`            | `{}`           | 内部区域追加 class，见下方 [自定义样式](#自定义样式ui-属性)                                                        |

### Slots

| 插槽名           | 说明                                              | 作用域参数                   |
| :--------------- | :------------------------------------------------ | :--------------------------- |
| `title`          | 标题区（左上角），可覆盖 `title` prop             | -                            |
| `actions`        | 操作区（右上角），如按钮、链接                    | -                            |
| `default`        | 描述项列表（放置 `RebornDescriptionsItem`）       | -                            |
| `content-[name]` | `items` 模式下，对应 `items[].slot` 的富内容      | `{ item: DescriptionsItem }` |
| `label-[name]`   | `items` 模式下，对应 `items[].labelSlot` 的富标签 | `{ item: DescriptionsItem }` |

### items 数据驱动

通过 `items` 传入描述项数组，适合接口数据直接渲染。有 `slot` / `labelSlot` 时走命名插槽。

```vue
<script setup lang="ts">
const items = [
  { label: "用户名", value: "张三" },
  { label: "实付金额", value: "¥ 1,199.00", contentColor: "#dc2626", contentBold: true },
  { label: "订单状态", slot: "status" },
];
</script>

<template>
  <RebornDescriptions :items="items">
    <template #content-status>
      <span class="text-success">已完成</span>
    </template>
  </RebornDescriptions>
</template>
```

`items` 中单项字段与 [RebornDescriptionsItem](#reborndescriptionsitem) Props 一致（数组用驼峰命名，如 `labelBackground`），额外支持：

| 字段        | 类型                       | 说明                              |
| :---------- | :------------------------- | :-------------------------------- |
| `value`     | `string \| number \| null` | 内容文本，`null` 为空             |
| `slot`      | `string`                   | 内容插槽，写 `#content-[slot]`    |
| `labelSlot` | `string`                   | 标签插槽，写 `#label-[labelSlot]` |

### 自定义样式（`ui` 属性）

`ui` 用于**只改内部某一块**，值为要**追加**的 class（与默认合并，非整段替换）。

```vue
<RebornDescriptions
  :items="items"
  :ui="{
    root: 'shadow-sm',
    title: 'text-primary text-lg',
    label: 'min-w-32',
    content: 'font-mono',
  }"
/>
```

| 键名           | 对应区域                     |
| :------------- | :--------------------------- |
| `root`         | 最外层容器                   |
| `header`       | 标题 + 操作区整行            |
| `titleWrapper` | 标题包裹容器                 |
| `title`        | 标题文字                     |
| `actions`      | 右上角操作区                 |
| `tableWrapper` | 表格外层（含圆角、边框变体） |
| `body`         | `<table>` 本体               |
| `label`        | 标签单元格                   |
| `content`      | 内容单元格                   |
| `colon`        | 标签后的冒号                 |

### RebornDescriptionsItem

作为 `RebornDescriptions` 的子组件，用于声明式地逐项定义标签与内容。

### Props

| 属性名               | 类型      | 默认值 | 说明                                     |
| :------------------- | :-------- | :----- | :--------------------------------------- |
| `label`              | `string`  | `-`    | 标签文字                                 |
| `span`               | `number`  | `1`    | 占据列数；末项自动延伸以填满当前行剩余列 |
| `label-class`        | `string`  | `-`    | 标签单元格追加 CSS 类                    |
| `content-class`      | `string`  | `-`    | 内容单元格追加 CSS 类                    |
| `label-background`   | `string`  | `-`    | 标签背景色，优先于父组件全局设置         |
| `content-background` | `string`  | `-`    | 内容背景色，优先于父组件全局设置         |
| `label-color`        | `string`  | `-`    | 标签字体颜色，优先于父组件全局设置       |
| `content-color`      | `string`  | `-`    | 内容字体颜色，优先于父组件全局设置       |
| `label-bold`         | `boolean` | `-`    | 标签加粗，优先于父组件全局设置           |
| `content-bold`       | `boolean` | `-`    | 内容加粗，优先于父组件全局设置           |

### Slots

| 插槽名    | 说明             |
| :-------- | :--------------- |
| `default` | 内容区自定义渲染 |
| `label`   | 标签区自定义渲染 |
