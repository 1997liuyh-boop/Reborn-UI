---
title: Pagination
description: 当数据量过多时，使用分页分解数据。
category: 导航
badge: New
navigation:
  badges:
    - label: 通
      color: primary
  chip:
    label: NEW
    color: primary
---

# RebornPagination 分页

分页组件用于在多个页面之间进行导航。

## 基础用法

通过 `total` 和 `pageSize` 自动计算分页。

::ComponentViewer{demoFile="RebornPaginationDemo.vue" config="RebornPaginationConfig" componentId="reborn-pagination" :componentFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]' :uniappFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]'}

# API

## Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `modelValue / v-model` | 当前页码 | `number` | `1` |
| `total` | 数据总数 | `number` | `0` |
| `pageSize` | 每页条目数 | `number` | `10` |
| `mode` | 显示模式 (`multi` / `simple`) | `string` | `'multi'` |
| `color` | 主题颜色 | `string` | `'primary'` |
| `size` | 尺寸 (`sm` / `md` / `lg`) **(仅 Web 端支持)** | `string` | `'md'` |
| `background` | 是否为分页按钮添加背景色 | `boolean` | `false` |
| `prevText` | 上一页按钮文字 | `string` | `-` |
| `nextText` | 下一页按钮文字 | `string` | `-` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `hideOnSinglePage` | 只有一页时是否隐藏 | `boolean` | `false` |

## Slots

| 名称 | 说明 | 参数 |
|---|---|---|
| `prev` | 自定义上一页按钮 | `{ prev: Function, disabled: boolean, currentPage: number }` |
| `next` | 自定义下一页按钮 | `{ next: Function, disabled: boolean, currentPage: number }` |
| `page` | 自定义页码项 (仅 multi 模式) | `{ page: number, active: boolean, handlePageClick: Function }` |
| `simpleContent` | 自定义简单模式内容 | `{ currentPage: number, totalPages: number }` |

## Events

| 名称 | 说明 | 参数 |
|---|---|---|
| `change` | 页码改变时触发 | `(page: number)` |
| `update:modelValue` | 双向绑定页码 | `(page: number)` |

::
