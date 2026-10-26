---
title: Draggable 拖拽排序
description: 用于列表项拖拽排序并同步 v-model 数据顺序的容器组件，双端可用。
category: 通用
platform: both
tags: [拖拽, 排序, 列表]
---

::ComponentViewer{demoFile="RebornDraggableDemo.vue" config="RebornDraggableConfig" componentId="reborn-draggable" :componentFiles='["RebornDraggable.vue", "reborn-draggable.config.ts"]' :uniappFiles='["RebornDraggable.vue", "reborn-draggable.config.ts"]'}
::

## 简介

`RebornDraggable` 为数组提供拖拽排序，Web 与 UniApp 均通过 `v-model` 提交新顺序，通过 `item` 插槽渲染内容。

`disabled` 控制整体交互；Web 的多列布局通过 `className` 指定，UniApp 通过 `columns` 指定列数、`longPress` 指定触发方式。

`start`、`end` 用于观察手势过程，`change` 用于接收排序结果。UniApp 的 `gap` 控制项目间距，`ui.root` 和 `ui.item` 分别覆盖容器与列表项。

### 何时使用

- 通过 `v-model` 保存用户调整后的快捷入口顺序。
- 用 `item` 插槽渲染需要排序的图片、卡片或其他同类项目。
- UniApp 通过 `columns` 配置多列排序，通过 `longPress` 区分滚动与拖拽意图。

### 何时不使用

- 需要左滑删除等操作——改用 `reborn-swiper-action`。
- 需要分页查看大量记录——改用 `reborn-table`，排序由业务规则处理。

## 用法

### 基础用法

用 `v-model` 绑定数组，`item` 插槽接收原始元素和当前索引。

| 维度 | 配置 | 典型用途 |
| --- | --- | --- |
| 数据 | `v-model` | 保存顺序，元素引用保持不变 |
| 内容 | `#item` | 根据业务字段渲染项目 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
const list = ref([{ id: 1, label: '项目一' }, { id: 2, label: '项目二' }])
</script>
<template>
  <RebornDraggable v-model="list">
    <template #item="{ item }"><div class="rounded-lg bg-white p-3">{{ item.label }}</div></template>
  </RebornDraggable>
</template>
```

### 禁用部分项目

两端对象项的 `disabled: true` 会阻止从该项开始拖拽，整体 `disabled` 则停用整组排序。

| 维度 | 配置 | 典型用途 |
| --- | --- | --- |
| 单项 | `item.disabled` | 阻止从该项开始拖动 |
| 整体 | `disabled` | 停用整个列表排序 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
const list = ref([{ id: 1, label: '固定项', disabled: true }, { id: 2, label: '可拖动项' }])
</script>
<template>
  <RebornDraggable v-model="list">
    <template #item="{ item }"><div class="p-3">{{ item.label }}</div></template>
  </RebornDraggable>
</template>
```

### 整体禁用

`disabled` 为真时保留内容展示并停止拖拽。

| 维度 | 配置 | 典型用途 |
| --- | --- | --- |
| 交互 | `disabled` | 保存中、无编辑权限时冻结顺序 |

```vue
<template>
  <RebornDraggable v-model="list" disabled>
    <template #item="{ item }"><div class="p-3">{{ item.label }}</div></template>
  </RebornDraggable>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `any[]` | `[]` | 排序数组，支持 `v-model` |
| `disabled` | `boolean` | `false` | 禁用整体排序 |
| `className` | `string` | `''` | 根容器类名 |
| `columns` | `number` | `1` | 仅 UniApp，网格列数 |
| `longPress` | `boolean` | `true` | 仅 UniApp，长按后开始排序 |
| `gap` | `number` | `4` | 仅 UniApp，间距按 `gap × 0.25rem` 计算 |
| `ui` | `{ root?: string; item?: string }` | `{}` | 仅 UniApp，结构样式覆盖 |

### Emits

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `list: any[]` | 提交排序后的新数组 |
| `change` | `list: any[]` | 排序提交时通知业务层 |
| `start` | Web：`{ index, item }`；UniApp：`index: number` | 拖拽开始；UniApp 先派发再测量 |
| `end` | Web：无；UniApp：`index: number` | 手势结束或取消 |

### Slots

| 插槽名 | 作用域参数 | 说明 |
| --- | --- | --- |
| `item` | `{ item, index, dragging }`；UniApp 另有 `dragIndex`、`insertIndex` | 项目内容；Web 的 `dragging` 表示当前项，UniApp 表示整组正在拖动 |

### Expose

无公开实例方法。

### 自定义样式（ui）

仅 UniApp 支持 `ui`；Web 通过 `className` 覆盖根节点。

| 键名 | 作用节点 | 说明 |
| --- | --- | --- |
| `root` | 根容器 | 控制容器布局，不影响项目样式 |
| `item` | 每个列表项 | 控制项目外观，不影响容器布局 |

`ui.base` 已移除，容器样式改放 `ui.root`，项目样式改放 `ui.item`。

### CSS 变量

无组件专属 CSS 变量。样式定义分别位于 `app/components/reborn/ui/reborn-draggable/reborn-draggable.config.ts` 与 `packages/uniapp-project/src/components/reborn-draggable/reborn-draggable.config.ts`。

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 输入 | HTML5 drag/drop | touch/longpress 与 WXS |
| 多列 | `className` 配置网格 | `columns` 配置列数 |
| 禁用 | 整体 `disabled` 或对象项的 `disabled` | 整体 `disabled` 或对象项的 `disabled` |
| 提交 | 落在项目上提交；列表外或间隙松手取消 | 有效手势结束时提交；touchcancel 回滚 |
| 样式 | `className` | `className`、`ui.root`、`ui.item` |
| key | 对象优先 `id`、`key`，否则引用 | H5/App：对象引用或原始值出现次序；小程序：位置索引 |

## 注意事项

- **提交后需接收新数组。** 受控父级拒绝更新 `v-model` 时，组件回读原模型并恢复显示顺序；项目对象不会被复制或注入 `uid`。
- **原始值和重复值可直接使用。** 字符串、数字等按值与出现次序生成 key；对象建议保持引用稳定，Web 也可提供稳定 `id` 或 `key`。
- **UniApp 普通滑动应保留页面滚动。** 根节点没有无条件阻止 `touchmove`，列表项的 `touchstart` 也不阻止默认行为，只有进入拖拽后（`longPress` 为真时即长按判定成功后）才拦截页面滚动；H5 长按模式另外屏蔽浏览器长按菜单（`contextmenu`）。小程序与 App 的实际滚动表现需在目标设备验证。
- **跟手更新按平台处理。** UniApp H5 用 `v-memo` 缓存未变化的项目；小程序与 App 由 WXS 直接更新当前拖动项的 `transform`，逻辑层在插入位置变化时更新其他项目。小程序仍按位置复用插槽内容，复杂项目的局部状态应由业务数据持有。
- **UniApp 间距沿用 rem 刻度。** `gap` 同时参与项目宽度计算，不能只覆盖容器间距而忽略多列几何关系。
