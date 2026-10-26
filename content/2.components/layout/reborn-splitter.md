---
title: Splitter 分隔面板
description: 用于将区域按水平或垂直方向分隔、可拖动调整各面板大小的布局组件。
category: 布局
platform: web
tags: [css, tailwind, splitter, layout]
badge: New
---

::ComponentViewer{demoFile="RebornSplitterDemo.vue" config="RebornSplitterConfig" componentId="reborn-splitter" :componentFiles='["RebornSplitter.vue", "RebornSplitterPanel.vue", "reborn-splitter.config.ts", "reborn-splitter.context.ts"]'}

## 简介

Splitter 将区域分成可拖拽调整比例的面板，仅提供 Web 实现；使用 `RebornSplitter` 包裹多个 `RebornSplitterPanel`。

`layout` 控制水平或垂直排列，`lazy` 决定拖拽时实时更新还是只显示预览条；每个面板通过 `size`、`min`、`max` 设置尺寸和限制。

`resizable` 控制相邻拖拽条，`collapsible` 开启折叠按钮。插槽可替换面板、拖拽条和折叠按钮内容，`ui` 分别覆盖容器与面板样式。

### 何时使用

- 编辑器需要左右调整区域比例 —— 使用 `layout="horizontal"` 和面板 `size`。
- 上下排列的预览区 —— 使用 `layout="vertical"` 并给容器明确高度。
- 重绘成本高的面板 —— 开启 `lazy`，结束拖拽后提交尺寸。
- 侧栏需要折叠 —— 在对应面板开启 `collapsible`。
- 需要保存用户调整后的布局，或在拖到最小 / 最大尺寸时给出提示 —— 监听 `change` 与 `limit`。

### 何时不使用

- 固定比例且无需拖拽 —— 改用 `reborn-container` 或 CSS Grid。
- 小程序或 App 布局 —— 本组件仅 Web，改用平台 flex 布局。

## 用法

### 基础用法

`size` 的数字与字符串都按百分比解析；不传时平分剩余空间。

```vue
<template>
  <RebornSplitter class="h-64">
    <RebornSplitterPanel :size="30">导航</RebornSplitterPanel>
    <RebornSplitterPanel>内容</RebornSplitterPanel>
  </RebornSplitter>
</template>
```

### 排列方向与延迟提交

`layout` 默认水平排列，`lazy` 默认关闭。

| 配置 | 行为 | 典型用途 |
| --- | --- | --- |
| `layout="horizontal"` | 左右排列 | 导航与编辑区 |
| `layout="vertical"` | 上下排列 | 编辑与预览 |
| `lazy` | 拖拽时只移动预览条 | 内容重绘成本较高 |

```vue
<template>
  <RebornSplitter layout="vertical" lazy class="h-96">
    <RebornSplitterPanel :size="60">编辑</RebornSplitterPanel>
    <RebornSplitterPanel>预览</RebornSplitterPanel>
  </RebornSplitter>
</template>
```

### 尺寸限制与折叠

`min` / `max` 的数字按 px，字符串按百分比；折叠插槽只替换按钮内部内容，`collapsed` 是对应面板状态。

```vue
<template>
  <RebornSplitter class="h-64">
    <RebornSplitterPanel size="30%" :min="120" max="60%" collapsible>
      <template #start-collapsible="{ collapsed }">{{ collapsed ? '+' : '−' }}</template>
      侧栏
    </RebornSplitterPanel>
    <RebornSplitterPanel>内容</RebornSplitterPanel>
  </RebornSplitter>
</template>
```

### 尺寸变化与边界通知

`change` 在一次调整提交后派发一次，载荷是全部面板的最新尺寸；`limit` 在拖拽中面板进入 `min` / `max` 边界时派发一次，停在边界上不重复派发，离开后再回到才再派发。

| 事件 | 派发时机 | 典型用途 |
| --- | --- | --- |
| `resize` | 拖拽中逐帧派发，`lazy` 下不派发 | 同步预览、联动其他区域 |
| `change` | 拖拽松手、折叠 / 展开、调整过之后父级改写 `size`，尺寸确有变化时各一次 | 把布局保存到本地存储或服务端 |
| `limit` | 拖拽中某个面板进入 `min` / `max` 边界时一次 | 提示已到最小 / 最大尺寸 |

```vue
<script setup lang="ts">
const hint = ref('')

function onChange(sizes: number[]) {
  localStorage.setItem('layout', JSON.stringify(sizes))
}

function onLimit(index: number, boundary: 'min' | 'max') {
  if (index === 0) hint.value = boundary === 'min' ? '侧栏已是最窄' : '侧栏已是最宽'
}
</script>

<template>
  <RebornSplitter class="h-64" @change="onChange" @limit="onLimit">
    <RebornSplitterPanel :min="160" max="60%">侧栏 {{ hint }}</RebornSplitterPanel>
    <RebornSplitterPanel>内容</RebornSplitterPanel>
  </RebornSplitter>
</template>
```

::tip
`limit` 用的边界与拖拽夹取完全相同：未设置 `min` 按 0、未设置 `max` 按 100% 判断，所以没设 `min` 的面板被压到 0 也会派发；两个面板同时触及边界时按面板顺序各派发一次。`lazy` 模式按预览条位置对应的尺寸判断，松手前就会派发。
::

## API

### Props

容器 `RebornSplitter`：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | 面板排列方向。 |
| `lazy` | `boolean` | `false` | 拖拽结束后才提交尺寸。 |
| `class` | `ClassValue` | - | 根容器追加类名。 |
| `ui` | `SplitterProps['ui']` | - | 内部样式覆盖。 |

面板 `RebornSplitterPanel`：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `size` | `string \| number` | - | 百分比尺寸，支持 `v-model:size`。 |
| `min` | `string \| number` | - | 最小尺寸；数字为 px，字符串为百分比。 |
| `max` | `string \| number` | - | 最大尺寸；数字为 px，字符串为百分比。 |
| `resizable` | `boolean` | `true` | 本面板与相邻面板都允许时可拖拽。 |
| `collapsible` | `boolean` | `false` | 是否提供折叠按钮。 |
| `class` | `ClassValue` | - | 面板追加类名。 |
| `ui` | `SplitterPanelProps['ui']` | - | 面板、拖拽条和按钮样式。 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `resize-start` | `(index: number)` | 开始拖拽，index 为拖拽条后方的面板下标。 |
| `resize` | `(index: number)` | 实时拖拽，或外部改写 size 引起相邻面板补偿；lazy 拖拽中不触发。 |
| `resize-end` | `(index: number)` | 用户结束拖拽。 |
| `collapse` | `(index: number, collapsed: boolean)` | 面板折叠或展开，index 为该面板下标，collapsed 为操作之后是否处于折叠状态。 |
| `change` | `(sizes: number[], index: number)` | 布局提交后派发一次：拖拽松手、折叠 / 展开、调整过之后父级改写 `size` 引起相邻补偿，且尺寸确有变化时才派发；拖拽过程中不派发。sizes 为全部面板按顺序的百分比尺寸，index 为尺寸发生变化的拖拽条下标（与 `resize-start` 同义）。 |
| `limit` | `(index: number, boundary: 'min' \| 'max', size: number)` | 拖拽中面板进入 `min` / `max` 边界时派发一次，停在边界上不重复；未设置 `min` 按 0、未设置 `max` 按 100% 判断。index 为面板下标，size 为当前百分比尺寸。 |
| `update:size` | `(value: string \| number)` | 面板实际尺寸变化时触发：拖拽、折叠、父级改值引起相邻补偿，以及调整过之后增删面板引起相邻补偿；挂载与新插入的面板不触发，字符串输入回写 `xx%`，数字输入回写数字。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 容器中放面板；面板中放内容，不暴露内部 ui。 |
| `bar` | - | 面板后方拖拽条内部内容。 |
| `start-collapsible` | `{ collapsed: boolean }` | 当前面板折叠按钮内部内容。 |
| `end-collapsible` | `{ collapsed: boolean }` | 后一个面板折叠按钮内部内容。 |

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| `splitterRef` | `HTMLElement \| null` | 容器根元素。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供，且**两个组件各有自己的 `ui`**：容器键传给 `Splitter`，面板与拖拽条的键传给 `SplitterPanel`。

**Splitter（容器）**

| 键名   | 说明                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `root` | 根容器。默认 `relative flex w-full h-full overflow-hidden select-none`，整体尺寸、边框、圆角改这里。 |

**SplitterPanel（每个面板自行传入）**

| 键名             | 说明                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `panel`          | 单个面板的外层。默认 `relative flex shrink-0 hover:z-50`，实际宽高由 `size` 内联注入；面板背景、内边距加在这里。                                                                                                                 |
| `bar`            | 该面板后面的拖拽条。默认 `flex items-center justify-center shrink-0 bg-gray-200 hover:bg-primary-500 z-20`，宽度/颜色/悬浮态改这里；仅在需要显示拖拽条时渲染。                                                                   |
| `collapseButton` | 拖拽条上的折叠按钮（起始、结束两个按钮共用此键）。默认 `absolute size-5 rounded-full bg-white border shadow-sm opacity-20 group-hover:opacity-100`；定位类由布局方向与折叠状态动态追加，覆盖时注意别和 `left-*` / `top-*` 打架。 |

```vue
<template>
  <Splitter :ui="{ root: 'rounded-lg border border-gray-2' }">
    <SplitterPanel
      :size="30"
      collapsible
      :ui="{ panel: 'bg-white', bar: 'w-1 bg-gray-1', collapseButton: 'shadow-md' }"
    >
      左侧
    </SplitterPanel>
    <SplitterPanel :ui="{ panel: 'p-4' }">右侧</SplitterPanel>
  </Splitter>
</template>
```

::


### CSS 变量

没有组件专用 CSS 变量，字号和圆角由 `app/assets/theme/typography.css` 与 `app/assets/theme/base.css` 提供。

## 注意事项

- **`size` 始终表示百分比**。数字 `30` 和字符串 `'30%'` 都表示 30%，需要像素限制请用数字 `min` / `max`。
- **动态面板需要稳定 key**。面板顺序来自渲染期插槽，增删时保留已有调整，只补偿相邻面板；`v-for` 应提供稳定业务 key。
- **挂载不派发尺寸更新**。拖拽、折叠或父级改值引起相邻补偿后才触发 `update:size`，不会在水合时回写初值。
- **`change` 只在提交时派发，且尺寸没变不派发**。一次拖拽无论经过多少帧都只在松手时派发一次，拖回原位或只点了一下拖拽条不派发；拖拽进行中父级改写 `size`（例如把回写值取整）也不单独派发，由松手时的 `change` 带出最终尺寸。保存布局应监听 `change`，监听 `resize` 会逐帧写入。
- **从未调整过时父级改 `size` 不派发 `change`**。此时布局完全由各面板 `size` 推导，改值等于换一套配置，自动平分的面板随之重算，与 `resize` 一样不派发；拖拽或折叠过一次之后，父级改值由相邻面板补偿，才派发 `resize` 与 `change`。增删面板属于结构变化，也不派发 `change`，被补偿的面板通过 `update:size` 同步。
- **按下时已停在边界上不派发 `limit`**。`limit` 只在「进入」边界时派发：上一次拖到 `min` 后再朝 `min` 方向拖，尺寸不变也不派发，先离开边界再回到才派发；折叠 / 展开走 `collapse`，不派发 `limit`。
- **增删面板会补发相邻面板的 `update:size`**。拖拽或折叠过之后再插入、移除面板，被扣出或补回份额的相邻面板会在渲染完成后收到新尺寸，`v-model:size` 与界面保持一致；从未调整过时布局按各面板 `size` 推导，显式尺寸不变，不触发。
- **面板必须是 Splitter 的直接子节点**。可以经过 `v-for`、`v-if`、`<template>`；外面包一层元素或其他组件时，该面板拿不到位置信息，降级为普通容器、不参与尺寸分配，开发环境控制台给出警告。默认插槽里的非面板组件原样渲染，不分配尺寸。
- **折叠插槽只放按钮内容**。组件始终保留按钮、键盘语义和点击处理，避免自行再嵌套 button。
- **默认插槽不再提供 ui**。通过容器或面板的 `ui` prop 覆盖样式。
