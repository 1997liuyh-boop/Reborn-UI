---
title: 引导 Guide
description: 用于按步骤高亮页面元素并弹出说明的新手引导组件，仅 web 端。
category: 反馈
tags: [css, tailwind, guide, tour]
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornGuideDemo.vue" config="RebornGuideConfig" componentId="reborn-guide" :componentFiles='["RebornGuide.vue", "reborn-guide.config.ts"]'}
::

## 简介

Guide 是 web 端的新手引导组件：传入 `steps` 步骤数组后，按 `v-model:current` 指定的步骤索引依次高亮页面元素（遮罩挖洞 + 平滑过渡），并在其旁弹出带「上一步 / 下一步 / 跳过 / 完成」按钮的说明框。`current` 为 `-1` 表示未开始，设为 `0` 即启动引导；滚动或缩放窗口时高亮位置自动跟随。每一步可用 CSS 选择器或函数定位目标元素，并支持步骤级覆盖 `mode`、`placement`、按钮文案等配置。

适用场景：

- 新功能上线或用户首次进入页面时的分步操作指引。
- 需要遮罩高亮目标元素并配上一步/下一步/跳过按钮的引导流程。
- 需要 `v-model:current` 受控步骤、监听 `finish` / `skip` 事件上报引导完成情况的场景。

不适用场景：

- uniapp 端不可用（仅 web）。
- 单个元素的悬浮提示说明，改用 `reborn-tooltip` 或 `reborn-popover`。

## 用法

### 基础用法

`steps` 定义每一步的目标元素与文案，把 `current` 从 `-1` 置为 `0` 启动引导；引导结束（完成/跳过）后组件会把 `current` 写回 `-1`。

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { GuideStep } from "~/components/reborn/ui/reborn-guide/RebornGuide.vue";

const current = ref(-1);

const steps: GuideStep[] = [
  { element: "#search", title: "搜索", body: "在这里输入关键词。", placement: "bottom" },
  { element: "#create-btn", title: "新建", body: "点击创建你的第一个项目。", placement: "right" },
];
</script>

<template>
  <RebornButton @click="current = 0">开始引导</RebornButton>
  <RebornGuide v-model:current="current" :steps="steps" @finish="current = -1" />
</template>
```

### 对话框模式与步骤级配置

`mode` 支持 `popup`（贴靠高亮元素，默认）与 `dialog`（居中对话框）两种形态；步骤对象里的 `mode`、`placement`、`nextButtonProps` 等字段可覆盖组件级配置。

```vue
<template>
  <RebornGuide
    v-model:current="current"
    mode="dialog"
    :steps="[
      { element: '#panel', title: '专注阅读', body: '对话框模式适合需要用户专注阅读的说明。', placement: 'center' },
      { element: '#panel', title: '混合模式', body: '该步骤单独切回 popup。', mode: 'popup', placement: 'top', nextButtonProps: { label: '知道了' } },
    ]"
  />
</template>
```

### 自定义计数器与步骤内容插槽

`counter` 插槽（作用域 `{ current, total }`）替换默认的「n / m」计数器。步骤对象的 `content` / `highlightContent` 字段声明的是**插槽名**：为某步骤设置 `content: 'stepFeature'` 后，提供同名插槽即可完全自定义该步骤的弹框正文（`highlightContent` 同理，渲染在高亮框内部）。

```vue
<template>
  <RebornGuide
    v-model:current="current"
    :steps="[{ element: '#panel', title: '富文本步骤', content: 'stepFeature' }]"
  >
    <template #counter="{ current, total }">
      <span class="text-xs">第 {{ current }} 步，共 {{ total }} 步</span>
    </template>
    <template #stepFeature>
      <img src="/guide/feature.png" class="rounded-lg" />
      <p>支持任意富内容作为步骤说明。</p>
    </template>
  </RebornGuide>
</template>
```

## Props 属性

| 属性名              | 类型                  | 默认值    | 说明                        | 必传 |
| :------------------ | :-------------------- | :-------- | :-------------------------- | :--- |
| `v-model:current`   | `number`              | `-1`      | 当前步骤索引，`-1` 隐藏引导 | N    |
| `defaultCurrent`    | `number`              | `-1`      | 非受控模式下的初始步骤      | N    |
| `steps`             | `GuideStep[]`         | `[]`      | 引导步骤数组                | Y    |
| `mode`              | `'popup' \| 'dialog'` | `'popup'` | 引导框类型                  | N    |
| `hideCounter`       | `boolean`             | `false`   | 隐藏计数器                  | N    |
| `hidePrev`          | `boolean`             | `false`   | 隐藏上一步按钮              | N    |
| `hideSkip`          | `boolean`             | `false`   | 隐藏跳过按钮                | N    |
| `finishButtonProps` | `ButtonProps`         | `{}`      | 完成按钮属性                | N    |
| `nextButtonProps`   | `ButtonProps`         | `{}`      | 下一步按钮属性              | N    |
| `prevButtonProps`   | `ButtonProps`         | `{}`      | 上一步按钮属性              | N    |
| `skipButtonProps`   | `ButtonProps`         | `{}`      | 跳过按钮属性                | N    |
| `showOverlay`       | `boolean`             | `true`    | 是否出现遮罩层              | N    |
| `highlightPadding`  | `number`              | `8`       | 高亮框内边距（px）          | N    |
| `zIndex`            | `number`              | `999999`  | 提示框层级                  | N    |
| `class`             | `any`                 | -         | 追加到引导框的自定义类名    | N    |
| `ui`                | `object`              | `{}`      | 按内部结构键覆盖样式类      | N    |

## Events 事件

| 事件名            | 参数                                                                         | 说明               |
| :---------------- | :--------------------------------------------------------------------------- | :----------------- |
| `change`          | `(current: number, context?: { e: MouseEvent, total: number })`              | 当前步骤变化时触发 |
| `finish`          | `(context: { e: MouseEvent, current: number, total: number })`               | 点击完成按钮时触发 |
| `next-step-click` | `(context: { e: MouseEvent, next: number, current: number, total: number })` | 点击下一步时触发   |
| `prev-step-click` | `(context: { e: MouseEvent, prev: number, current: number, total: number })` | 点击上一步时触发   |
| `skip`            | `(context: { e: MouseEvent, current: number, total: number })`               | 点击跳过按钮时触发 |

## Slots 插槽

| 插槽名                    | 插槽参数                             | 说明                                                                                             |
| :------------------------ | :----------------------------------- | :----------------------------------------------------------------------------------------------- |
| `counter`                 | `{ current: number, total: number }` | 自定义计数器                                                                                     |
| `[step.content]`          | -                                    | 动态具名插槽：步骤对象 `content` 字段声明插槽名，命中该步骤时渲染此插槽作为弹框正文（替代 `body`） |
| `[step.highlightContent]` | -                                    | 动态具名插槽：步骤对象 `highlightContent` 字段声明插槽名，渲染在该步骤的高亮框内（popup 模式）     |

## Expose 方法

| 方法名     | 说明                                 |
| :--------- | :----------------------------------- |
| `next()`   | 进入下一步（已是最后一步时不动作）   |
| `prev()`   | 退回上一步（已是第一步时不动作）     |
| `finish()` | 完成引导（`current` 置为 `-1`）      |
| `skip()`   | 跳过引导（`current` 置为 `-1`）      |

## GuideStep 步骤类型

| 属性名             | 类型                               | 默认值     | 说明                                     | 必传 |
| :----------------- | :--------------------------------- | :--------- | :--------------------------------------- | :--- |
| `element`          | `string \| () => Element \| null`  | -          | 高亮的节点选择器或函数                   | Y    |
| `body`             | `string`                           | -          | 步骤提示框内容                           | N    |
| `title`            | `string`                           | -          | 步骤标题                                 | N    |
| `content`          | `string`                           | -          | 自定义弹框正文的插槽名（优先于 `body`）  | N    |
| `highlightContent` | `string`                           | -          | 自定义高亮框内容的插槽名                 | N    |
| `placement`        | `string`                           | `'bottom'` | 引导框位置（12种popup + 2种dialog）      | N    |
| `offset`           | `[number\|string, number\|string]` | `[0, 0]`   | 相对 placement 的偏移                    | N    |
| `mode`             | `'popup' \| 'dialog'`              | -          | 步骤级模式覆盖                           | N    |
| `highlightPadding` | `number`                           | -          | 步骤级高亮内边距                         | N    |
| `showOverlay`      | `boolean`                          | -          | 步骤级遮罩覆盖                           | N    |
| `nextButtonProps`  | `ButtonProps`                      | -          | 步骤级下一步按钮配置（如自定义文案）     | N    |
| `prevButtonProps`  | `ButtonProps`                      | -          | 步骤级上一步按钮配置                     | N    |
| `skipButtonProps`  | `ButtonProps`                      | -          | 步骤级跳过按钮配置                       | N    |
| `stepOverlayClass` | `string`                           | -          | 覆盖该步骤遮罩/高亮框的类名              | N    |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供；键分三组：**popup 模式专属**、**dialog 模式专属**、**两种模式共用**。

| 键名            | 生效模式 | 说明                                                                                                                                                     |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overlay`       | popup    | 全屏遮罩层。**仅 `showOverlay` 为真时渲染**，默认 `fixed inset-0 z-[--guide-z]`；它本身透明，实际的暗色来自 `highlightMask` 的巨型 `box-shadow`。          |
| `highlightMask` | popup    | 高亮挖洞框（贴合目标元素）。默认 `absolute rounded-lg transition-all duration-300 pointer-events-none`；圆角与移动过渡改这里。步骤级 `stepOverlayClass` 也会并到该节点。 |
| `guideBox`      | popup    | 贴靠目标元素的指引框。默认 `fixed z-[--guide-box-z] bg-white rounded-ui-lg shadow-xl border min-w-[260px] max-w-[360px]`，宽度、底色、圆角改这里；`class` prop 也并到该节点。 |
| `guideArrow`    | popup    | 指引框的箭头。**仅命中目标元素且箭头方向不为 `none` 时渲染**，默认 `absolute w-3 h-3 rotate-45 bg-white border-gray-2`；改底色时要与 `guideBox` 一起改。   |
| `dialogOverlay` | dialog   | 居中对话框的遮罩兼定位层，默认 `fixed inset-0 z-[--guide-z] bg-gray-900/60 flex items-center justify-center p-4`，遮罩深浅改这里。步骤级 `stepOverlayClass` 也会并到该节点。 |
| `dialogBox`     | dialog   | 对话框面板，默认 `bg-white rounded-ui-lg shadow-xl w-full max-w-[480px]`，宽度与圆角改这里；`class` prop 也并到该节点。                                    |
| `guideHeader`   | 共用     | 标题条。**仅该步骤配了 `title` 时渲染**，默认 `flex items-center justify-between px-5 pt-5 pb-2`。                                                         |
| `guideTitle`    | 共用     | 标题 `<h3>`，默认 `text-base font-semibold text-gray-9`。                                                                                                 |
| `guideBody`     | 共用     | 正文容器，默认 `px-5 py-2 text-sm text-gray-6 leading-relaxed`；步骤的 `content` 插槽渲染在它内部，容器本身始终生效。                                     |
| `guideFooter`   | 共用     | 底部条，默认 `flex items-center justify-between px-5 pb-5 pt-3 gap-2`；计数器与按钮组的两端对齐改这里。                                                    |
| `counter`       | 共用     | 步骤计数文本（如 `2 / 5`），默认 `text-xs text-gray-4`。**仅 `hideCounter` 为假且未填充 `counter` 插槽时渲染**，填充该插槽会替换掉这个节点，`ui.counter` 随之失效。 |
| `buttonGroup`   | 共用     | 上一步 / 下一步 / 跳过按钮的容器，默认 `flex items-center gap-2`；按钮间距改这里，按钮本身请用 `nextButtonProps` 等步骤级配置。                            |

```vue
<template>
  <RebornGuide
    v-model:current="current"
    :steps="steps"
    :ui="{
      guideBox: 'max-w-[320px] rounded-xl',
      guideTitle: 'text-sm',
      dialogOverlay: 'bg-black/70',
      counter: 'text-gray-5',
    }"
  />
</template>
```

## 注意事项

- 仅 web 端可用。
- `current` 默认 `-1` 表示未开始，启动引导需将其设为步骤索引（通常 `0`）；完成或跳过后组件会写回 `-1`。
- `mode` 支持 `popup`（贴靠高亮元素）与 `dialog`（居中对话框）两种展示形态，步骤级 `mode` 优先于组件级。
- `zIndex` 默认 `999999`，注意与其他弹层的层级关系；`highlightPadding` 控制高亮框内边距（默认 8px）。
- 步骤的 `content` / `highlightContent` 声明的是插槽名而非内容本身，需要在组件标签内提供同名 `<template #名称>`。
- 步骤目标元素未找到时不会报错，引导框回退到屏幕中央显示（无箭头）。
