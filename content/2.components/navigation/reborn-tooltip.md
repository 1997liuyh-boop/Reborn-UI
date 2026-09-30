---
title: Tooltip 文字提示
description: 仅 Web 端的文字提示气泡：12 种方位、四种触发方式、自动翻转与贴边偏移，可受控显隐。
category: 反馈
platform: web
tags: [tooltip, floating, hint]
---

::ComponentViewer{demoFile="RebornTooltipDemo.vue" config="RebornTooltipConfig" componentId="reborn-tooltip" :componentFiles='["RebornTooltip.vue", "reborn-tooltip.config.ts"]'}
::

## 简介

Tooltip 是锚定在触发元素上的深色文字气泡，用来补充说明按钮、图标或截断文字的含义，仅 Web 端提供。默认插槽放触发元素，文案用 `title`（未传时回落到 `content`）或 `content` 插槽传入。

方位由 `placement` 一个属性决定：方向（`top` / `bottom` / `left` / `right`）与对齐（`-start` / `-end`）组合出 12 种；主轴放不下时由 `autoAdjustOverflow` 翻到对侧。箭头用 `arrow` 控制显隐，对象形式 `{ pointAtCenter: true }` 让箭头指向触发元素中心。

其余 API 按用途分组：触发方式看 `trigger`（`hover` / `focus` / `click` / `contextMenu`，可组合）；延时看 `openDelay` / `closeDelay`（毫秒）或 `mouseEnterDelay` / `mouseLeaveDelay`（秒）；显隐控制看 `v-model:open`、`defaultOpen` 与暴露的 `open()` / `close()`；外观看 `color` 与 `ui`。

### 何时使用

- 图标按钮没有文字标签，需要悬停时说明用途：默认 `trigger="hover"` 即可。
- 表格或卡片里的文字被截断，需要悬停查看全文：`title` 传完整文案，超过 240px 自动换行。
- 键盘用户也要能看到提示：`trigger` 加上 `focus`，Tab 聚焦时立即显示。
- 提示需要多行、加粗或快捷键等结构：用 `content` 插槽。
- 提示颜色需要与业务状态对应（如警告色）：用 `color` 让面板和箭头同步着色。

### 何时不使用

- 气泡里要放按钮、表单等可交互内容 —— 改用 `reborn-popover`，它的面板为浅色卡片且支持点击触发与遮罩。
- 删除等操作需要二次确认 —— 改用 `reborn-popconfirm`，它内置确认 / 取消按钮。
- 信息必须让所有用户看到（包括触屏用户） —— 改用 `reborn-alert` 或页面内文字，悬停在移动端无法触发。

## 用法

### 基础用法

`title` 传入提示文字，鼠标移入显示、移出消失，用来代替浏览器原生的 `title` 提示。面板宽度上限 240px，长文字自动换行，文案里的换行符也会保留。

```vue
<template>
  <RebornTooltip title="这是一个文字提示">
    <RebornButton>悬停查看提示</RebornButton>
  </RebornTooltip>
</template>
```

### 方位：12 种 placement

`placement` 由方向与对齐组合而成，默认 `bottom`：

| 取值                                | 典型用途                                   |
| ----------------------------------- | ------------------------------------------ |
| `top` / `bottom` / `left` / `right` | 气泡与触发元素居中对齐，最常用             |
| `top-start` / `bottom-start`        | 触发元素靠左、气泡需要向右展开             |
| `top-end` / `bottom-end`            | 触发元素靠右（如工具栏末尾），避免气泡出界 |
| `left-start` / `right-start`        | 侧边导航项，气泡与项目顶部对齐             |
| `left-end` / `right-end`            | 贴近页面底部的触发元素                     |

主轴放不下时会自动翻到对侧，交叉轴贴边时沿交叉轴挪回视口并同步调整箭头位置；不想翻转时设 `:auto-adjust-overflow="false"`。

```vue
<template>
  <RebornTooltip placement="top-start" title="Top Start">
    <RebornButton size="sm">TL</RebornButton>
  </RebornTooltip>
  <RebornTooltip placement="right-start" title="Right Start">
    <RebornButton size="sm">RT</RebornButton>
  </RebornTooltip>
</template>
```

### 颜色：自定义背景色

`color` 直接指定面板背景色，箭头同步着色，文字固定为白色。不传时面板用 `gray-10` 令牌，暗色主题下会自然反色为浅底深字；传了 `color` 则两种主题都用同一个颜色，需自行确认白字的对比度。

```vue
<template>
  <RebornTooltip title="#f50" color="#f50">
    <RebornButton size="sm">橙色提示</RebornButton>
  </RebornTooltip>
</template>
```

### 富内容插槽

`content` 插槽可以放任意 HTML 结构，优先级高于 `title` / `content` 属性。插槽内容始终实时渲染，不受 `fresh` 影响。

```vue
<template>
  <RebornTooltip placement="right">
    <template #content>
      <div class="flex flex-col gap-1">
        <b>快捷键</b>
        <span>按 <kbd>Ctrl</kbd> + <kbd>S</kbd> 保存</span>
      </div>
    </template>
    <RebornButton>富内容提示</RebornButton>
  </RebornTooltip>
</template>
```

### 触发方式

`trigger` 可传单个值或数组组合：

| 取值          | 打开                    | 关闭                                 | 典型用途                         |
| ------------- | ----------------------- | ------------------------------------ | -------------------------------- |
| `hover`       | 移入，经打开延时        | 移出，经关闭延时                     | 默认，桌面端说明图标与按钮       |
| `focus`       | 聚焦立即打开            | 失焦立即关闭                         | 输入框提示、照顾键盘用户         |
| `click`       | 点击切换                | 再次点击或点击外部区域               | 需要用户主动查看的说明           |
| `contextMenu` | 右键打开并拦截系统菜单  | 点击外部区域                         | 自定义右键提示                   |

无论哪种触发方式，显示期间按 Escape 都会关闭提示。

```vue
<template>
  <RebornTooltip title="悬停或聚焦都会显示" :trigger="['hover', 'focus']">
    <RebornButton>悬停 / 聚焦</RebornButton>
  </RebornTooltip>
  <RebornTooltip title="点击外部关闭" trigger="click">
    <RebornButton>点击</RebornButton>
  </RebornTooltip>
</template>
```

### 箭头：显隐与指向中心

`:arrow="false"` 隐藏箭头。`-start` / `-end` 方位下箭头默认停在对齐端，触发元素比气泡宽时箭头可能不在触发元素正中；`:arrow="{ pointAtCenter: true }"` 让箭头改为指向触发元素中心。

```vue
<template>
  <RebornTooltip title="无箭头文字提示" :arrow="false">
    <RebornButton>无箭头</RebornButton>
  </RebornTooltip>
  <RebornTooltip title="箭头指向元素中心" placement="top-start" :arrow="{ pointAtCenter: true }">
    <RebornButton>pointAtCenter</RebornButton>
  </RebornTooltip>
</template>
```

### 延时、禁用与初始展示

- 延时：`openDelay` / `closeDelay` 以毫秒计，默认都是 100；`mouseEnterDelay` / `mouseLeaveDelay` 以秒计，传入时优先。延时只作用于 hover 触发和 ref 调用的 `open()` / `close()`，`focus` / `click` / `contextMenu` 都是立即生效。
- 禁用：`disabled` 为 `true`，或 `title` 显式传 `null` / 空串时不会弹出；已显示的提示在禁用或文案变空时立即关闭。
- 初始展示：`defaultOpen` 让提示在挂载后立即显示；受控场景用 `v-model:open`。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const emptyTitle = ref(false);
</script>

<template>
  <RebornTooltip title="mouseEnterDelay 1 秒" :mouse-enter-delay="1">
    <RebornButton>延时 1s</RebornButton>
  </RebornTooltip>
  <RebornTooltip :title="emptyTitle ? '' : '再次点击按钮把 title 置空即禁用'">
    <RebornButton @click="emptyTitle = !emptyTitle">title 禁用演示</RebornButton>
  </RebornTooltip>
  <RebornTooltip title="defaultOpen 初始展示" default-open>
    <RebornButton>初始展示</RebornButton>
  </RebornTooltip>
</template>
```

## API

### Props

| 属性名               | 类型                                                      | 默认值       | 描述                                                                                     |
| -------------------- | --------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `title`              | `string \| null`                                          | -            | 提示文字。显式传 `null` 或空串可禁用；未传时回落到 `content`。                           |
| `content`            | `string`                                                  | `''`         | 提示内容，`title` 未传时使用。                                                           |
| `placement`          | `TooltipPlacement`                                        | `'bottom'`   | 出现方向与对齐方式，12 种取值见「方位：12 种 placement」。                               |
| `color`              | `string`                                                  | -            | 自定义背景颜色，面板与箭头同步着色，文字固定为白色。                                     |
| `arrow`              | `boolean \| { pointAtCenter?: boolean }`                  | `true`       | 箭头显隐；对象形式的 `pointAtCenter` 让箭头指向触发元素中心而非对齐端。                  |
| `autoAdjustOverflow` | `boolean`                                                 | `true`       | 主轴放不下时自动翻转到对侧。                                                             |
| `trigger`            | `'hover' \| 'focus' \| 'click' \| 'contextMenu'` 或其数组 | `'hover'`    | 触发行为，可传数组组合多种触发方式。                                                     |
| `open`               | `boolean`                                                 | -            | 受控显隐，对应 `v-model:open`；不绑定时组件内部自管理显隐。                              |
| `defaultOpen`        | `boolean`                                                 | `false`      | 非受控模式下的初始显隐。                                                                 |
| `destroyOnHidden`    | `boolean`                                                 | `false`      | 关闭后是否销毁提示层 DOM；默认隐藏保留。                                                 |
| `fresh`              | `boolean`                                                 | `false`      | 关闭期间文案是否保持实时更新；默认关闭时缓存最后一次显示的文案（`content` 插槽始终实时）。 |
| `getPopupContainer`  | `(triggerNode: HTMLElement) => HTMLElement`               | -            | 浮层渲染父节点，未传时渲染到 `body`。                                                    |
| `openDelay`          | `number`                                                  | `100`        | 打开延时（毫秒）。                                                                       |
| `closeDelay`         | `number`                                                  | `100`        | 关闭延时（毫秒）。                                                                       |
| `mouseEnterDelay`    | `number`                                                  | -            | 鼠标移入后延时多少才显示，单位：秒；传入时优先于 `openDelay`。                           |
| `mouseLeaveDelay`    | `number`                                                  | -            | 鼠标移出后延时多少才隐藏，单位：秒；传入时优先于 `closeDelay`。                          |
| `zIndex`             | `number`                                                  | -            | 提示层 z-index，未传时用 `contentWrapper` 的 `z-[9999]`。                                |
| `disabled`           | `boolean`                                                 | `false`      | 是否禁用。                                                                               |
| `class`              | `any`                                                     | -            | 追加到根节点（`wrapper`）的自定义类名。                                                  |
| `ui`                 | `TooltipUI`                                               | -            | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                             |

### Emits

| 事件名        | 回调参数           | 描述                                 |
| ------------- | ------------------ | ------------------------------------ |
| `open`        | -                  | 提示层显示后触发（经打开延时）。     |
| `close`       | -                  | 提示层关闭后触发（经关闭延时）。     |
| `openChange`  | `(open: boolean)`  | 显示隐藏变化时触发。                 |
| `update:open` | `(value: boolean)` | 显隐变化时触发，对应 `v-model:open`。 |

### Slots

| 插槽名    | 作用域参数 | 描述                                               |
| --------- | ---------- | -------------------------------------------------- |
| `default` | -          | 触发提示的元素。                                   |
| `content` | -          | 自定义提示内容（可承载 HTML 富内容），优先级最高。 |

### Expose

| 方法名  | 签名         | 描述                                                          |
| ------- | ------------ | ------------------------------------------------------------- |
| `open`  | `() => void` | 手动打开提示层（仍受 `disabled` 与打开延时约束，无内容时不生效）。 |
| `close` | `() => void` | 手动关闭提示层（经关闭延时后隐藏）。                          |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，与默认类通过 tailwind-merge 合并（同属性后者胜出）：

| 键名             | 说明                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`        | 根节点 `<span>`（触发器外层容器），默认无类名，`class` prop 也并到这里；hover / focus / click 等事件都绑定在它身上，整体占位改这里。                              |
| `trigger`        | 触发元素的外框，默认 `inline-flex max-w-full`，包住 `default` 插槽。                                                                                              |
| `contentWrapper` | 浮层定位外壳（Teleport 之后的过渡容器），默认 `fixed left-0 top-0 z-[9999] pointer-events-none flex`；层级改这里，传了 `zIndex` 时以内联样式为准。                 |
| `content`        | 提示面板，默认 `relative inline-flex max-w-60 items-center p-2 text-base rounded-lg whitespace-pre-line break-words bg-gray-10 text-gray-1`，另按方位追加 `origin-*` 作为动画原点；底色、文字、内边距、圆角、最大宽度改这里。传了 `color` 时底色与文字色由内联样式决定，这里的 `bg-*` / `text-*` 不生效。 |
| `arrow`          | 箭头容器，默认 `absolute text-gray-10`。**仅 `arrow` 不为 `false` 时渲染**；箭头是 `fill="currentColor"` 的 SVG，颜色随 `text-*` 类，改面板底色时要一起改。       |

```vue
<template>
  <RebornTooltip
    content="最大宽度放宽到 320px，改用主色底"
    :ui="{
      content: 'max-w-80 bg-primary text-white',
      arrow: 'text-primary',
    }"
  >
    <RebornButton label="自定义样式" />
  </RebornTooltip>
</template>
```

## 注意事项

- **仅 Web 端可用。** UniApp 端没有同名组件，需要轻量气泡时可用 `reborn-popover` 的 `title` 属性。
- **箭头是 7×18 的圆头曲线，与面板同色实色填充。** 面板沿箭头排布方向（`top` / `bottom` 看宽度，`left` / `right` 看高度）短到装不下 18px 底边时，箭头底边按可用直边收缩、最短 12px，用来拉开 `start` / `center` / `end` 三档的位置差；厚度恒为 7px，连接处仍然无缝。单行文字的 `left` / `right` 提示会走到这条规则。
- **没有可显示内容时不会弹出。** `disabled` 为 `true`、`title` 为 `null` / 空串、或既无文案也无 `content` 插槽时都不会打开；文案中途变为空会立即关闭提示，避免出现一个空气泡。
- **关闭期间文案默认被冻结。** 提示层 DOM 默认隐藏保留，冻结文案可以避免隐藏期间外部数据变化引起内容抖动；需要关闭期间也实时更新时设 `fresh`。
- **提示层默认 Teleport 到 `body`。** 不受父容器 `overflow: hidden` 裁剪；用 `getPopupContainer` 改挂载点时，若容器带 CSS `transform`，fixed 定位会以该容器为参照而错位。
- **`trigger` 含 `click` / `contextMenu` 时，点击触发器与提示层以外的区域会关闭提示。** 判断在 `mousedown` 捕获阶段完成，所以即使外部元素阻止了冒泡也能关闭。
- **提示层默认不响应鼠标。** `contentWrapper` 默认带 `pointer-events-none`，鼠标会直接穿过提示层，移出触发元素后经关闭延时就会隐藏，`content` 插槽里的链接也点不到。组件在提示层上同样绑定了 hover 进出事件，需要让用户移进提示层选中文字或点击链接时，用 `:ui="{ contentWrapper: 'pointer-events-auto' }"` 打开鼠标响应。
