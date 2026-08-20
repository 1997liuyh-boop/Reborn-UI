---
title: 卡片 Card
description: 用于分组展示内容区块的基础卡片容器组件，带可选标题，仅 uniapp 端。
category: 卡片
tags: [uniapp, card, container]
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

## 基础用法

RebornCard 是 uniapp 端的基础卡片容器，由「标题 + 内容体」两部分组成：标题可通过 `title` 属性或 `title` 插槽二选一提供；内容体默认带圆角边框、白色背景与内边距，多个子元素之间自动保持间距。适合在 uniapp 页面中把内容按区块分组展示，常与 RebornPage 搭配组织演示页或设置页。

内容体默认 `overflow-hidden` 裁剪超出内容；当卡片内部有下拉浮层等需要溢出显示的内容时，设置 `overflowVisible` 放开裁剪。需要图片通铺等无留白布局时，将 `padding` 设为 `false` 去掉默认内边距。

::ComponentViewer{demoFile="RebornCardDemo.vue" config="RebornCardConfig" componentId="reborn-card" :componentFiles='[]' :uniappFiles='["RebornCard.vue", "index.ts"]'}
::

## API

### Props

| 属性名            | 类型      | 默认值  | 描述                                                    |
| :---------------- | :-------- | :------ | :------------------------------------------------------ |
| `title`           | `string`  | —       | 卡片标题文本，未提供 `title` 插槽时渲染为默认标题       |
| `padding`         | `boolean` | `true`  | 内容体是否保留默认内边距，设为 `false` 可让内容通铺卡片 |
| `customClass`     | `string`  | `''`    | 追加到内容体容器的自定义类名                            |
| `overflowVisible` | `boolean` | `false` | 是否允许内容溢出卡片显示，默认裁剪超出部分              |

### Emits

纯布局容器组件，无抛出事件。

### Slots

| 插槽名    | 描述                                                      |
| :-------- | :-------------------------------------------------------- |
| `title`   | 自定义标题区域，提供后完全替换 `title` 属性的默认标题渲染 |
| `default` | 卡片内容体                                                |

## 注意事项

- 仅 uniapp 端可用，web 端无此组件；web 项目请直接使用样式容器或 `reborn-container` 布局。
- 以键值对形式展示详情数据时不建议用卡片拼装，web 端应改用 `reborn-descriptions`。
- `padding` 默认开启；卡片内部有下拉浮层等超出内容被裁剪时，记得设置 `overflowVisible`。
