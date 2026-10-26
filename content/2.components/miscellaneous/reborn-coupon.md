---
title: 卡券 Coupon
description: 用于渲染缺口、撕线、邮票等形态优惠券外观的卡券组件，仅 web 端。
category: 数据展示
platform: web
tags: [vue, reborn-coupon]
---

::ComponentViewer{demoFile="RebornCouponDemo.vue" config="RebornCouponConfig" componentId="reborn-coupon" :componentFiles='["RebornCoupon.vue", "reborn-coupon.config.ts"]'}
::

## 简介

Coupon 是仅 Web 的卡券外观容器，通过遮罩生成缺口、锯齿和撕线。

`type` 决定券面形态，`direction` 决定内容排列，`radius` / `corner` / `gap` 调整不同形态的几何关系。

`width` / `height` 与响应式覆盖控制尺寸，`left` / `right` 插槽承载券面内容，`hoverable` 开启悬停反馈，`ui` 覆盖区域样式。

### 何时使用

- 优惠券需要缺口、邮票或撕线外形——用 `type` 选择形态。
- 卡券在不同布局中需要改变主轴——用 `direction` 选择方向。
- 同一卡券需要响应不同屏宽——用 `sm` / `md` / `lg` 覆盖对应参数。

### 何时不使用

- 普通信息容器不需要缺口——改用 `reborn-card`。
- 只需显示优惠状态标签——改用 `reborn-chip`。

## 用法

### 响应式尺寸

`sm` / `md` / `lg` 在对应断点覆盖基础参数，`type` 仍决定卡券形态。

| 配置 | 典型用途 |
| --- | --- |
| `md` | 桌面断点调整尺寸 |
| `type` | 选择券面形态 |

```vue
<template>
  <RebornCoupon type="notch" :md="{ width: 480 }">
    <template #left>优惠券</template>
    <template #right>
      满额可用
    </template>
  </RebornCoupon>
</template>
```

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

### 交互说明

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

## 注意事项

- **响应式覆盖项（`sm` / `md` / `lg` / `xl` / `xxl`）在组件挂载后才生效。** 服务端没有媒体查询，断点一律按未命中处理；为了让水合首帧与服务端输出一致（水合不会修正内联 `style`），组件挂载前只按基础 props 渲染，挂载后再叠加当前断点的覆盖项。走服务端渲染的页面在宽屏下会于挂载后切换一次尺寸；纯客户端渲染时这次切换发生在首帧之后，通常察觉不到。
