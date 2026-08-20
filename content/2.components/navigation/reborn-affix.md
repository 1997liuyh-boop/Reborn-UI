---
title: Affix 悬浮
description: 用于固定悬浮元素并支持拖拽、自动吸附屏幕边缘的跨端悬浮组件。
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

::ComponentViewer{demoFile="RebornAffixDemo.vue" config="RebornAffixConfig" componentId="reborn-affix" :componentFiles='["RebornAffix.vue", "reborn-affix.config.ts"]' :uniappFiles='["RebornAffix.vue", "reborn-affix.config.ts"]'}
::

## 简介

Affix 是一个 `fixed` 定位的可拖拽悬浮容器：内容通过默认插槽放入，用户可以按住拖动到屏幕任意位置，松手后自动吸附到左右屏幕边缘（可用 `noSnapping` 关闭），并默认避让刘海屏/底部黑条等安全区域。

与 `reborn-sticky` 的定位差异与选型建议：

- **Affix 与滚动无关**——元素始终 `fixed` 悬浮在屏幕上，核心能力是「可拖拽 + 边缘吸附」，适合悬浮球、快捷入口这类用户可自行挪位置的元素。
- **Sticky 由滚动驱动**——元素先在文档流中正常排布，滚动到阈值后才吸附在顶部/底部，适合分组标题、筛选栏、底部操作条。
- 固定位置、无需拖拽的悬浮操作按钮（含展开菜单），改用 `reborn-fab`；滚动一定距离后出现的返回顶部按钮，改用 `reborn-back-top`。

适用场景：

- 悬浮球、客服入口、快捷操作按钮等需要用户可拖拽调整位置时。
- 需要拖到边缘后自动吸附、避免遮挡内容的悬浮元素。

## 用法

### 基础用法

默认插槽放入悬浮内容，`left` / `right` / `top` / `bottom` 控制初始位置（px）。指定 `right` 时优先于 `left`；未指定 `top` 时以 `bottom`（默认 10）为垂直基准：

```vue
<template>
  <RebornAffix :right="20" :bottom="100">
    <view class="size-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg">
      <view class="i-lucide-plus size-5" />
    </view>
  </RebornAffix>
</template>
```

### 禁用拖拽与取消吸附

`disabled` 禁用拖拽交互（元素仍显示在初始位置）；`noSnapping` 保留拖拽但取消松手后的边缘吸附，元素停在松手位置：

```vue
<template>
  <!-- 固定不可拖 -->
  <RebornAffix disabled :right="20" :bottom="200">
    <view class="size-10 rounded-full bg-gray-400" />
  </RebornAffix>

  <!-- 可拖拽但不吸附边缘 -->
  <RebornAffix :left="20" :bottom="100" :no-snapping="true">
    <view class="size-10 rounded-full bg-blue-500" />
  </RebornAffix>
</template>
```

### 尺寸、吸附边距与安全区

`size` 声明浮动元素的宽高（默认 40px），用于拖拽边界与吸附位置计算，内容尺寸应与其一致；`gap` 为吸附到边缘后的留边（默认 10px）；`safeArea` 默认开启，UniApp 端会避让顶部刘海与底部黑条：

```vue
<template>
  <RebornAffix :size="56" :gap="16" :right="16" :bottom="120" :safe-area="true">
    <view class="size-14 flex items-center justify-center rounded-full bg-primary text-white">
      客服
    </view>
  </RebornAffix>
</template>
```

## API

### Props

| 属性名       | 类型      | 默认值      | 描述                                                                 |
| :----------- | :-------- | :---------- | :------------------------------------------------------------------- |
| `zIndex`     | `number`  | `500`       | 浮动元素的层级。                                                     |
| `size`       | `number`  | `40`        | 浮动元素的尺寸（宽/高，单位 px），参与拖拽边界与吸附位置计算。       |
| `left`       | `number`  | `10`        | 初始左边距 (px)。未指定 `right` 时作为水平位置依据。                 |
| `right`      | `number`  | `undefined` | 初始右边距 (px)。指定后优先级高于 `left`。                           |
| `top`        | `number`  | `undefined` | 初始上边距 (px)。指定后垂直位置按「屏幕高度 − size − top」计算。     |
| `bottom`     | `number`  | `10`        | 初始下边距 (px)。未指定 `top` 时作为垂直位置依据。                   |
| `gap`        | `number`  | `10`        | 吸附到屏幕边缘后的留边距离 (px)。                                    |
| `disabled`   | `boolean` | `false`     | 是否禁用拖拽交互；元素仍会显示。                                     |
| `noSnapping` | `boolean` | `false`     | 是否禁用松手后的自动边缘吸附。                                       |
| `safeArea`   | `boolean` | `true`      | 是否避让屏幕安全区域（刘海屏/底部黑条）；Web 端保留 API 但按 0 处理。 |

### Slots

| 插槽名    | 描述                       |
| :-------- | :------------------------- |
| `default` | 自定义悬浮内容。           |

## 注意事项

- 组件无事件与 expose，位置完全由内部拖拽逻辑维护，业务侧无法读取或受控设置当前位置。
- 松手吸附规则：距左/右边缘 60px 内直接吸附对应侧，否则按屏幕中线判断吸附到较近一侧，最终停靠位置留 `gap` 边距。
- `size` 决定边界与吸附计算使用的元素宽高，插槽内容尺寸与 `size` 不一致时会出现吸附位置偏移或可拖出屏幕的问题。
- UniApp 端屏幕尺寸与安全区在组件初始化时读取一次，旋转屏幕后不会自动修正；Web 端会响应窗口 `resize` 重新吸附。
- Web 端安全区简化为 0（非 PWA 场景通常无安全区），`safeArea` 仅保留 API 兼容。
- UniApp 端拖拽有 5px 的移动阈值，小于该距离视为点击，不会触发拖动，因此插槽内可正常绑定 `@tap` / `@click`。
