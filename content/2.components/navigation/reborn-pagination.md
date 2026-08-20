---
title: 分页
description: 用于大数据量列表分页切换的双端分页组件，提供多页码与简洁两种模式。
category: 导航
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPaginationDemo.vue" config="RebornPaginationConfig" componentId="reborn-pagination" :componentFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]' :uniappFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]'}
::

## 简介

Pagination 是双端可用的分页组件：传入 `total` 与 `pageSize` 后自动计算总页数并渲染页码，`v-model` 绑定当前页码（默认 `1`）。`mode="multi"` 展示带省略号折叠的完整页码列表，`mode="simple"` 只显示「当前页 / 总页数」配合上下翻页，更适合移动端。组件还暴露 `prev` / `next` 方法支持命令式翻页。

适用场景：

- 表格、列表数据量大需要按页浏览时。
- 移动端需要简洁的上一页/下一页翻页（`mode="simple"`）时。
- 只有一页时希望自动隐藏分页器（`hideOnSinglePage`）时。

不适用场景：

- uniapp 滚动触底加载更多，改用 `reborn-loadmore`。
- 内容按类别切换，改用 `reborn-tabs`。

## 用法

### 基础用法

通过 `total` 与 `pageSize` 自动计算总页数，`v-model` 绑定当前页码；页码切换会触发 `change` 事件。

```vue
<script setup lang="ts">
import { ref } from "vue";

const page = ref(1);
</script>

<template>
  <RebornPagination
    v-model="page"
    :total="120"
    :page-size="10"
    @change="(p) => console.log('切换到第', p, '页')"
  />
</template>
```

### 简洁模式与按钮文字

`mode="simple"` 只显示「当前页 / 总页数」；`prevText` / `nextText` 可把箭头图标换成文字按钮。

```vue
<template>
  <RebornPagination
    v-model="page"
    mode="simple"
    :total="120"
    prev-text="上一页"
    next-text="下一页"
  />
</template>
```

### 插槽自定义

`page` 插槽自定义单个页码项（仅 `multi` 模式），`prev` / `next` 插槽自定义翻页按钮，`simpleContent` 插槽自定义简洁模式内容。

```vue
<template>
  <RebornPagination v-model="page" :total="60">
    <template #page="{ page: p, active, handlePageClick }">
      <button :class="active ? 'font-bold text-primary' : ''" @click="handlePageClick(p)">
        {{ p }}
      </button>
    </template>
  </RebornPagination>
</template>
```

## API

### Props

| 参数                   | 说明                                          | 类型      | 默认值      |
| ---------------------- | --------------------------------------------- | --------- | ----------- |
| `modelValue / v-model` | 当前页码                                      | `number`  | `1`         |
| `total`                | 数据总数                                      | `number`  | `0`         |
| `pageSize`             | 每页条目数                                    | `number`  | `10`        |
| `mode`                 | 显示模式 (`multi` / `simple`)                 | `string`  | `'multi'`   |
| `color`                | 主题颜色                                      | `string`  | `'primary'` |
| `size`                 | 尺寸 (`sm` / `md` / `lg`) **(仅 Web 端支持)** | `string`  | `'md'`      |
| `background`           | 是否为分页按钮添加背景色                      | `boolean` | `false`     |
| `prevText`             | 上一页按钮文字，不传时显示箭头图标            | `string`  | `-`         |
| `nextText`             | 下一页按钮文字，不传时显示箭头图标            | `string`  | `-`         |
| `disabled`             | 是否禁用                                      | `boolean` | `false`     |
| `hideOnSinglePage`     | 只有一页时是否隐藏                            | `boolean` | `false`     |
| `ui`                   | 细粒度样式覆盖对象，按内部结构键覆盖类名      | `object`  | `{}`        |

### Emits

| 名称                | 说明                                                     | 参数             |
| ------------------- | -------------------------------------------------------- | ---------------- |
| `change`            | 页码切换后触发；点击当前页、省略号或禁用时不触发         | `(page: number)` |
| `update:modelValue` | 当前页码变化时触发（v-model 双向同步）                   | `(page: number)` |

### Slots

| 名称            | 说明                         | 参数                                                           |
| --------------- | ---------------------------- | -------------------------------------------------------------- |
| `prev`          | 自定义上一页按钮             | `{ prev: Function, disabled: boolean, currentPage: number }`   |
| `next`          | 自定义下一页按钮             | `{ next: Function, disabled: boolean, currentPage: number }`   |
| `page`          | 自定义页码项 (仅 multi 模式) | `{ page: number, active: boolean, handlePageClick: Function }` |
| `simpleContent` | 自定义简单模式内容           | `{ currentPage: number, totalPages: number }`                  |

### Expose

| 方法   | 签名         | 说明                                                                     |
| ------ | ------------ | ------------------------------------------------------------------------ |
| `prev` | `() => void` | 翻到上一页（当前页 - 1）：禁用或已在第一页时无操作，成功时同步 v-model 并触发 change |
| `next` | `() => void` | 翻到下一页（当前页 + 1）：禁用或已在最后一页时无操作，成功时同步 v-model 并触发 change |

## 注意事项

- web、uniapp 双端可用，但 `size` 属性仅 web 端支持。
- `v-model` 绑定当前页码（默认 `1`），需配合 `total` 与 `pageSize` 计算页数；`total` 为 0 时按 1 页处理。
- `page` 插槽仅在 `multi` 模式下可用，`simple` 模式用 `simpleContent` 插槽。
- 组件暴露 `prev` / `next` 方法可命令式翻页，翻页成功会同步 `v-model` 并触发 `change`。
