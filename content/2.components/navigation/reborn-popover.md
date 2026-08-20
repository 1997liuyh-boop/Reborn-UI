---
title: Popover
description: 用于点击或悬停触发气泡浮层的双端组件，可配置定位方向、箭头与遮罩。
category: 导航
badge: New
navigation:
  badges:
    - label: NEW
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPopoverDemo.vue" config="RebornPopoverConfig" componentId="reborn-popover" :componentFiles='["RebornPopover.vue", "reborn-popover.config.ts"]' :uniappFiles='["RebornPopover.vue", "reborn-popover.config.ts"]'}
::

## 简介

Popover 是锚定在触发元素上的小型气泡浮层，双端可用。默认插槽放触发器，`content` 插槽放气泡内容；由 `content` 属性对象（`side` / `align` / `sideOffset`）控制弹出方位与偏移，可选 `arrow` 箭头。Web 端支持 `mode="hover"` 悬停触发并用 `openDelay` / `closeDelay` 控制显隐延迟；UniApp 端额外提供 `title` + `displayMode="menu"` 的轻量菜单模式。支持 `v-model:open` 受控，也可通过 ref 调用暴露的 `open` / `close` 方法。

适用场景：

- 点击元素弹出操作项或补充说明的小型浮层。
- hover 展示提示内容且需要 `openDelay` / `closeDelay` 控制显隐延迟时（仅 Web）。
- 需要 `v-model:open` 受控开关或调用暴露的 `open` / `close` 方法时。

不适用场景：

- 纯文字提示改用 `reborn-tooltip`（仅 Web）。
- 右键呼出的菜单改用 `reborn-context-menu`（仅 Web）。
- 底部/侧边大面积面板改用 `reborn-popup`。

## 用法

### 定位与箭头

`content` 属性对象控制弹出方位：`side` 为主轴方向（`top` / `bottom` / `left` / `right`），`align` 为交叉轴对齐（`start` / `center` / `end`），`sideOffset` 为与触发器的间距（px）。`arrow` 控制是否显示指向触发器的小箭头。

```vue
<template>
  <RebornPopover :content="{ side: 'top', align: 'start', sideOffset: 12 }" arrow>
    <RebornButton>顶部弹出</RebornButton>
    <template #content>
      <div class="w-56 p-4 text-sm">锚定在按钮上方、起点对齐的气泡内容。</div>
    </template>
  </RebornPopover>
</template>
```

### 悬停触发与显隐延迟（Web）

Web 端 `mode="hover"` 改为悬停触发；`openDelay` 控制悬停多久后打开，`closeDelay` 控制移出后延迟多久关闭（默认 120ms，防止移向气泡途中意外关闭）。

```vue
<template>
  <RebornPopover mode="hover" :open-delay="150" :close-delay="200" arrow>
    <span class="cursor-help underline decoration-dotted">悬停查看</span>
    <template #content>
      <div class="w-48 p-3 text-sm">悬停 150ms 后打开，移出 200ms 后关闭。</div>
    </template>
  </RebornPopover>
</template>
```

### 受控模式与手动关闭

`v-model:open` 双向绑定显示状态；也可通过 ref 调用 `close()`（UniApp 端还提供 `open()`）在气泡内部手动关闭。

```vue
<script setup lang="ts">
import { ref } from "vue";

const show = ref(false);
const popoverRef = ref();
</script>

<template>
  <RebornPopover ref="popoverRef" v-model:open="show" :content="{ side: 'top' }">
    <RebornButton>{{ show ? "已打开" : "点击打开" }}</RebornButton>
    <template #content>
      <RebornButton size="sm" @click="popoverRef.close()">手动关闭</RebornButton>
    </template>
  </RebornPopover>
</template>
```

### 菜单模式（UniApp）

UniApp 端不传 `content` 插槽时，可用 `title` + `displayMode` 快速渲染内容：`normal` 模式 `title` 为字符串直接显示；`menu` 模式 `title` 为数组渲染成可点击菜单，点击项触发 `menuclick`。

```vue
<template>
  <RebornPopover
    display-mode="menu"
    :title="[{ content: '编辑' }, { content: '分享' }, { content: '删除' }]"
    @menuclick="({ item, index }) => uni.showToast({ title: item.content, icon: 'none' })"
  >
    <RebornButton size="sm">操作菜单</RebornButton>
  </RebornPopover>
</template>
```

## API

### Props

| 属性名           | 类型                                                                                  | 默认值                                             | 说明                                                                                                | 平台   |
| ---------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| `mode`           | `'click' \| 'hover'`                                                                  | `'click'`                                          | 触发方式；UniApp 端仅支持点击触发                                                                   | Web    |
| `content`        | `{ side?: 'top' \| 'bottom' \| 'left' \| 'right', align?: 'start' \| 'center' \| 'end', sideOffset?: number }` | `{ side: 'bottom', align: 'center' }`              | 内容位置与偏移配置；`sideOffset` 默认 Web `8` / UniApp `0`                                          | 通用   |
| `arrow`          | `boolean`                                                                             | Web `false` / UniApp `true`                        | 是否显示指向触发器的小箭头                                                                          | 通用   |
| `open`           | `boolean`                                                                             | `false`                                            | 受控显示状态，对应 `v-model:open`                                                                   | 通用   |
| `defaultOpen`    | `boolean`                                                                             | `false`                                            | 非受控默认显示状态                                                                                  | 通用   |
| `modal`          | `boolean`                                                                             | `false`                                            | 是否显示遮罩层并捕获焦点；UniApp 端仅保留属性，无遮罩效果                                           | Web    |
| `dismissible`    | `boolean`                                                                             | `true`                                             | 点击外部区域时是否关闭                                                                              | 通用   |
| `portal`         | `boolean \| string`                                                                   | Web `true` / UniApp `false`                        | 是否用 Teleport 挂载到 `body` 或指定选择器节点；UniApp 端保留作 API 一致性，无实际效果              | 通用   |
| `openDelay`      | `number`                                                                              | `0`                                                | hover 模式下悬停多久后打开（ms）                                                                    | 通用   |
| `closeDelay`     | `number`                                                                              | Web `120` / UniApp `0`                             | hover 模式下移出多久后关闭（ms），防止移向气泡途中意外关闭                                          | 通用   |
| `disabled`       | `boolean`                                                                             | `false`                                            | 是否禁用（点击触发器不再弹出）                                                                      | UniApp |
| `title`          | `string \| Record<string, any>[]`                                                     | `''`                                               | 未使用 `content` 插槽时的气泡内容：normal 模式传字符串，menu 模式传数组                             | UniApp |
| `useContentSlot` | `boolean`                                                                             | `true`                                             | 是否用 `content` 插槽渲染内容；组件按插槽是否传入自动判定，通常无需手动设置                         | UniApp |
| `displayMode`    | `'normal' \| 'menu'`                                                                  | `'normal'`                                         | 内容展示模式：`normal` 直接显示 `title` 文本，`menu` 将 `title` 数组渲染为可点击菜单                | UniApp |
| `class`          | `any`                                                                                 | -                                                  | 追加到根元素的自定义类名                                                                            | Web    |
| `customClass`    | `any`                                                                                 | `''`                                               | 追加到根元素的自定义类名                                                                            | UniApp |
| `ui`             | `object`                                                                              | `{}`                                               | 按内部结构键覆盖类名，见下方「自定义样式（ui）」                                                    | 通用   |

### Emits

| 事件名              | 回调参数            | 说明                                              | 平台   |
| ------------------- | ------------------- | ------------------------------------------------- | ------ |
| `update:open`       | `(value: boolean)`  | 显隐状态变化时触发，对应 `v-model:open`           | 通用   |
| `update:modelValue` | `(value: boolean)`  | 显隐状态变化时触发（`v-model` 同步）              | UniApp |
| `change`            | `({ show })`        | 显隐状态切换时触发                                | UniApp |
| `open`              | `-`                 | 气泡打开时触发                                    | UniApp |
| `close`             | `-`                 | 气泡关闭时触发                                    | UniApp |
| `menuclick`         | `({ item, index })` | menu 模式下点击菜单项时触发                       | UniApp |

### Slots

| 插槽名    | 作用域参数          | 说明                                                                  |
| --------- | ------------------- | --------------------------------------------------------------------- |
| `default` | `{ open: boolean }` | 触发器区域；Web 端提供作用域参数 `open` 表示当前显隐状态              |
| `content` | `-`                 | 气泡内容区域；UniApp 端传入后优先于 `title` / `displayMode` 渲染      |

### Expose

| 方法      | 说明                 | 平台   |
| --------- | -------------------- | ------ |
| `open()`  | 手动打开当前 Popover | UniApp |
| `close()` | 手动关闭当前 Popover | 通用   |

### 自定义样式（ui）

`ui` 属性按内部结构键覆盖对应节点的类名，双端键位不同：

| 端     | 可用键                                                                                  |
| ------ | --------------------------------------------------------------------------------------- |
| Web    | `wrapper`、`trigger`、`contentWrapper`、`content`、`arrow`、`bridge`、`mask`             |
| UniApp | `base`、`target`、`pos`、`hidden`、`container`、`inner`、`arrow`、`closeIcon`、`menu`、`menuInner` |

## 注意事项

- web、uniapp 双端可用；额外类名 Web 端用 `class`，UniApp 端用 `customClass`。
- 定位由 `content` 对象配置；`sideOffset` 默认值双端不同（Web 8 / UniApp 0），`arrow` 默认值也不同（Web 关 / UniApp 开）。
- `mode="hover"` 仅 Web 端有效；Web 端 hover 模式在气泡与触发器之间渲染透明「桥接层」防止移动途中关闭，`closeDelay` 默认 120ms。
- Web 端使用 Teleport 挂载（`portal` 默认 `true`），带边缘越界翻转与位置修正；UniApp 端保持一致的定位思路，但不提供完整的越界翻转能力。
- Web 端会根据 `side` 方向叠加 `fade-*` 位移与 `zoom-in` 缩放动画（如底部弹出为 fade-up + zoom-in）。
- UniApp 端多个 Popover 同时使用时会自动互斥：打开一个会关闭其他已打开的实例。
- UniApp 端 `displayMode="menu"` 时 `title` 必须传对象数组（每项含 `content` 或 `title` 字段），`normal` 模式必须传字符串，类型不符控制台会报错。
