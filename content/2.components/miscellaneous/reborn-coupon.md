---
title: 卡券 Coupon
description: 用于渲染缺口、撕线、邮票等形态优惠券外观的卡券组件，仅 web 端。
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

RebornCoupon 提供强大的 CSS Mask 遮罩能力，仅通过配置属性即可渲染出市面上多数形式的优惠券形态。组件默认提供 `left` 和 `right` 两个插槽供内容分发。

::ComponentViewer{demoFile="RebornCouponDemo.vue" config="RebornCouponConfig" componentId="reborn-coupon" :componentFiles='["RebornCoupon.vue", "reborn-coupon.config.ts"]'}
::

## API 

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `type` | 优惠券形态：<br>`notch` (单侧缺口)<br>`ticket` (四角缺口)<br>`stamp` (邮票锯齿)<br>`perforated` (单缺口+撕拉线)<br>`combined` (四角 + 单缺口) | `CouponType` | `'notch'` |
| `width` | 宽度 | `String / Number` | `'100%'` |
| `height` | 高度 | `String / Number` | `'auto'` |
| `radius` | 缺口圆角半径大小 (适用于除 ticket 外的形态) | `Number` | `10` |
| `direction` | 布局方向：`horizontal` (水平), `vertical` (垂直) | `CouponDirection` | `'horizontal'` |
| `position` | 缺口位置：`start` (顶部/左侧), `center` (居中), `end` (底部/右侧) | `CouponPosition` | `'start'` |
| `offset` | 缺口相对起点偏移量 (position 不为 center 时生效) | `Number` | `50` |
| `corner` | 四个角的缺口直角半径大小 (对 ticket / combined 生效) | `Number` | `20` |
| `gap` | 连续半圆缺口/锯齿的间距 (对 stamp / combined 生效) | `Number` | `14` |
| `split` | 撕拉线的类型：`dotted` (点状), `dashed` (虚线) (仅对 perforated 生效) | `CouponSplit` | `'dotted'` |
| `splitColor` | 撕拉线的颜色 (设置后将渲染可见的虚线/点线覆盖在遮罩之上) | `String` | — |
| `size` | 撕拉线尺寸：为数字时表示孔洞直径 / 虚线粗细；为 `[宽, 高]` 数组时专供 dashed 模式精准控制虚线段的长宽 (仅对 perforated 生效) | `Number / [Number, Number]` | `4` |
| `hoverable` | 开启悬停交互动画 (scale-101 + shadow-lg) | `Boolean` | `false` |
| `sm` | 小屏幕 (sm: 640px+) 响应式覆盖参数 | `RebornCouponBaseProps` | — |
| `md` | 中屏幕 (md: 768px+) 响应式覆盖参数 | `RebornCouponBaseProps` | — |
| `lg` | 大屏幕 (lg: 1024px+) 响应式覆盖参数 | `RebornCouponBaseProps` | — |
| `xl` | 特大屏幕 (xl: 1280px+) 响应式覆盖参数 | `RebornCouponBaseProps` | — |
| `xxl` | 2xl 屏幕 (1536px+) 响应式覆盖参数 | `RebornCouponBaseProps` | — |
| `ui` | 深度定制各插槽容器的类名 (root, left, right, center) | `Object` | `{}` |
| `class` | 传递给根容器的额外类名 | `Any` | — |

### Slots

| 名称 | 说明 |
| --- | --- |
| `left` | 优惠券左侧/顶部内容插槽区 |
| `right` | 优惠券右侧/底部内容插槽区 |

### Emits

该纯 UI 布局组件目前没有特殊的抛出事件。你可以直接在其内部的插槽结构中添加对应的点击或业务事件。

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供：

| 键名     | 说明                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`   | 根元素。默认 `flex overflow-hidden bg-[#f5f5f5] cursor-pointer`，`direction` 决定主轴方向，`hoverable` 的悬浮位移与阴影也叠加在这里。缺口形状由内联 `mask` 生成，覆盖背景色时请改这里而非子节点。 |
| `left`   | 左侧（`direction="horizontal"` 时为上方）区块，包裹 `left` 插槽。默认 `shrink-0`，尺寸由 `size` 相关内联样式控制，改这里可加内边距与文字颜色。 |
| `center` | 分割线所在的中间区块。默认 `py-2`，内部还有一个由 `split` 决定虚线/点线样式的内层元素；改虚线颜色需覆盖内层，这里只负责该区块的留白与宽高。   |
| `right`  | 右侧（`direction="horizontal"` 时为下方）区块，包裹 `right` 插槽。默认 `grow flex-1`，主内容区的内边距、排版加在这里。                         |

```vue
<template>
  <RebornCoupon
    :ui="{
      root: 'bg-white shadow-sm',
      left: 'flex items-center px-4 text-error',
      right: 'p-3',
    }"
  >
    <template #left>￥50</template>
    <template #right>满 200 元可用</template>
  </RebornCoupon>
</template>
```
