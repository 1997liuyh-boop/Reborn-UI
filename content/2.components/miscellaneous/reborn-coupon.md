---
title: 卡券 Coupon
description: 支持多种形态（缺口、撕线、邮票等）的高度可定制化卡券组件。
category: 杂项
navigation:
  badges:
    - label: WEB
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
| `splitWidth` | 撕拉线的宽度 / 孔洞直径 (仅对 perforated 生效，不设置则各取 size) | `Number` | — |
| `splitHeight` | 撕拉线的高度 / 孔洞直径 (仅对 perforated 生效，不设置则各取 size) | `Number` | — |
| `splitColor` | 撕拉线的颜色 (设置后将渲染可见的虚线/点线覆盖在遮罩之上) | `String` | — |
| `size` | **已废弃**。请使用 splitWidth/splitHeight，此属性目前仅作为兼容降级使用。 | `Number` | `4` |
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
