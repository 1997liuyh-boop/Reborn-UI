---
title: BackTop 返回顶部
description: 双端返回顶部按钮：滚动超过阈值后淡入；Web 端另有去底部、方形与顺/逆时针滚动进度环。
category: 导航
platform: both
tags: [css, tailwind, back-top, scroll, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornBackTopDemo.vue" config="RebornBackTopConfig" componentId="reborn-back-top" :componentFiles='["RebornBackTop.vue", "reborn-back-top.config.ts"]' :uniappFiles='["RebornBackTop.vue", "reborn-back-top.config.ts"]'}
::

## 简介

BackTop 是固定在视口右下角的滚动直达按钮：滚动距离越过 `threshold`（默认 300px）后从右侧滑入，点击后平滑滚动并派发 `click`。两端同名，基础 API（`threshold` / `bottom` / `color` / `size` / 默认插槽）对齐；Web 端默认自动监听 `window` 滚动，UniApp 端需要把 `onPageScroll` 拿到的 `scrollTop` 传进来。

Web 端有两条互相独立的轴：`direction` 决定去哪（`top` 回到顶部 / `bottom` 去底部），`shape` 决定外形（`circle` 圆形 / `square` 圆角方形）。两者自由组合；需要「回到顶部 + 去底部」一对按钮时放两个实例，用 `bottom` 上下错开。

其余 API 分三组：外观由 `color`（7 种语义色）、`size`、`icon` 控制；进度由 `showProgress` 与 `scrollRange` 控制（仅 Web），环的走向随 `direction` 变化；位置由 `bottom`、`isTab`（UniApp TabBar 页抬高 50px）、`safeArea` 控制。默认插槽可以整体替换按钮。

### 何时使用

- 长文档、长列表需要一键回到顶部 —— 默认 `direction="top"`，`threshold` 按首屏高度调整。
- 长页面同时需要直达页尾（页脚链接、评论区）—— 再放一个 `direction="bottom"` 的实例，`bottom` 比回到顶部小一个按钮高度加间距。
- 想在按钮上顺带展示阅读进度 —— 开启 `show-progress`，回到顶部顺时针、去底部逆时针，两个按钮并排时左右对称（仅 Web）。
- 页面右侧空间紧张、按钮要贴着内容边缘 —— 用 `size="xs"`（24px）配 `shape="square"`（仅 Web）。

### 何时不使用

- 需要可拖拽的悬浮入口 —— 改用 `reborn-affix`。
- 常驻的悬浮操作按钮（新建、展开菜单）—— 改用 `reborn-fab`。
- 跳到页面内的某一节而不是页首页尾 —— 改用 `reborn-anchor`。

## 用法

### 基础用法

滚动超过 `threshold` 后按钮出现，点击平滑回到顶部。Web 端不传 `scrollTop` 时自动监听 `window`；UniApp 端必须在页面里监听 `onPageScroll` 并传入，否则按钮不会随滚动显示。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

```vue
<template>
  <RebornBackTop :threshold="300" />
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

```vue
<script setup lang="ts">
import { onPageScroll } from "@dcloudio/uni-app";
import { ref } from "vue";

const scrollTop = ref(0);
onPageScroll((e) => {
  scrollTop.value = e.scrollTop;
});
</script>

<template>
  <RebornBackTop :scroll-top="scrollTop" :threshold="300" />
</template>
```

:::

::

### 回到顶部与去底部

`direction` 决定点击后滚到哪里，显隐的依据也随之不同：

| `direction` | 点击后 | 何时显示 | 默认图标 |
| --- | --- | --- | --- |
| `'top'`（默认） | 滚到页首 | 已滚动距离 > `threshold` | `↑` |
| `'bottom'` | 滚到页尾 | 离页尾的剩余距离 > `threshold` | `↓` |

一个实例只负责一个方向。要成对出现时放两个实例，回到顶部放在上面：

```vue
<template>
  <RebornBackTop :bottom="68" />
  <RebornBackTop direction="bottom" :bottom="20" />
</template>
```

::tip
两个实例各自显隐、位置固定：页首只露出去底部，页尾只露出回到顶部，一个消失时另一个不会挪位，指针下的按钮不会突然换成另一个。
::

::warning
`direction` 仅 Web 端可用。去底部需要知道页面总高度才能判断还剩多少，UniApp 端目前只拿得到 `scrollTop`。
::

### 形状与尺寸

`shape` 决定外形，开启进度环时环的形状跟着变：

| `shape` | 外观 | 典型用途 |
| --- | --- | --- |
| `'circle'`（默认） | 圆形，进度是一圈圆环 | 独立的回顶按钮 |
| `'square'` | 圆角方形，圆角为边长的 25%，进度是贴边的圆角方框 | 与方形工具栏、侧边按钮并排 |

`size` 的档位两端不同：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| `size` | 边长 | 图标字号 | 进度线宽 |
| --- | --- | --- | --- |
| `xs` | 24px | 12px | 约 2.4px |
| `sm` | 32px | 14px | 约 2.9px |
| `md`（默认） | 40px | 16px | 约 3.2px |
| `lg` | 48px | 18px | 约 3.4px |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| `size` | 尺寸类 | 图标字号 |
| --- | --- | --- |
| `sm` | `size-8` | `text-26` |
| `md`（默认） | `size-10` | `text-28` |
| `lg` | `size-12` | `text-30` |

:::

::

```vue
<template>
  <RebornBackTop size="xs" shape="square" />
</template>
```

### 滚动进度环

`showProgress` 在按钮边缘画进度：进度 = 已滚动距离 / 可滚动总距离，从 12 点方向出发。回到顶部顺时针长出，去底部逆时针长出，两者表达同一个进度，并排时左右对称。

| `direction` | 环的走向 | 滚到页尾时 |
| --- | --- | --- |
| `'top'` | 顺时针 | 画满一圈 |
| `'bottom'` | 逆时针 | 按钮已隐藏（剩余距离不足 `threshold`） |

```vue
<template>
  <RebornBackTop :bottom="68" show-progress />
  <RebornBackTop direction="bottom" :bottom="20" show-progress />
</template>
```

可滚动总距离默认按 `document` 实测（文档高度 − 视口高度），并用 `ResizeObserver` 跟踪图片、懒加载撑高页面；用 `scrollTop` 接管滚动数值时要一并传 `scrollRange`，否则百分比与去底部的显隐都按错误的总距离计算。

::warning
`showProgress` / `scrollRange` 仅 Web 端可用：UniApp 端缺少页面总高的来源，需要另用 `createSelectorQuery` 测量，暂未实现。
::

### 图标与自定义内容

`icon` 接受 Iconify 图标名，替换默认的文字箭头，颜色与字号跟随 `ui.icon`；进度环、形状、颜色都保留。默认插槽则整体替换按钮主体，此时 `color` / `size` / `shape` / `icon` / `showProgress` 都不再生效。

```vue
<template>
  <RebornBackTop :bottom="52" size="xs" shape="square" icon="lucide:arrow-big-up" show-progress />
  <RebornBackTop direction="bottom" :bottom="20" size="xs" shape="square" icon="lucide:arrow-big-down" show-progress />
</template>
```

```vue
<template>
  <RebornBackTop :bottom="100">
    <div class="bg-success flex size-12 items-center justify-center rounded-lg text-xs font-bold text-white">
      TOP
    </div>
  </RebornBackTop>
</template>
```

::warning
`icon` 仅 Web 端可用，依赖项目里的 `@nuxt/icon`。UniApp 端用默认插槽替换箭头。
::

### TabBar 页面与安全区

`isTab` 为 `true` 时按钮额外抬高 50px 避开 TabBar；`safeArea` 默认开启，UniApp 端会再加上底部安全区高度（Web 端视为 0）。最终距底部 = `bottom` + 安全区 + TabBar。

```vue
<template>
  <RebornBackTop :scroll-top="scrollTop" is-tab />
</template>
```

## API

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名         | 类型                                                                                   | 默认值      | 描述                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `scrollTop`    | `number`                                                                               | -           | 外部接管的滚动距离 (px)；不传时自动监听 `window` 滚动。                                                                        |
| `threshold`    | `number`                                                                               | `300`       | 显示阈值 (px)：回到顶部在已滚动距离超过它后显示，去底部在离页尾的剩余距离超过它时显示。                                        |
| `bottom`       | `number`                                                                               | `20`        | 距视口底部的距离 (px)，再叠加 `isTab` 的 50px。                                                                                |
| `duration`     | `number`                                                                               | `300`       | 兼容保留：Web 端用浏览器的平滑滚动，时长由浏览器决定。                                                                         |
| `isTab`        | `boolean`                                                                              | `false`     | 是否 TabBar 页面，为 `true` 时额外抬高 50px。                                                                                  |
| `safeArea`     | `boolean`                                                                              | `true`      | 是否适配底部安全区；Web 端安全区高度视为 0。                                                                                   |
| `direction`    | `'top' \| 'bottom'`                                                                    | `'top'`     | 点击后滚到页首还是页尾，显隐依据与进度环走向随之变化；成对使用时放两个实例。                                                   |
| `shape`        | `'circle' \| 'square'`                                                                 | `'circle'`  | 按钮形状；`square` 圆角为边长的 25%，进度环随之变成贴边的圆角方框。                                                            |
| `icon`         | `string`                                                                               | -           | Iconify 图标名，替换默认的 `↑` / `↓` 文字箭头。                                                                                |
| `showProgress` | `boolean`                                                                              | `false`     | 是否在按钮边缘画滚动进度：回到顶部顺时针、去底部逆时针，均从 12 点出发；传了默认插槽时不渲染。                                 |
| `scrollRange`  | `number`                                                                               | -           | 可滚动总距离 (px)，用于换算进度与判断去底部的显隐；不传时按 `document` 实测，用 `scrollTop` 接管滚动时应一并传入。             |
| `color`        | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 按钮背景的语义色。                                                                                                             |
| `size`         | `'xs' \| 'sm' \| 'md' \| 'lg'`                                                         | `'md'`      | 边长 24 / 32 / 40 / 48px，进度线宽随之换算。                                                                                   |
| `ui`           | `object`                                                                               | -           | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                                                   |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名      | 类型                                                                                   | 默认值      | 描述                                                                          |
| ----------- | -------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `scrollTop` | `number`                                                                               | `0`         | 当前页面的滚动距离，必须由页面的 `onPageScroll` 传入。                        |
| `threshold` | `number`                                                                               | `300`       | 已滚动距离超过它后显示按钮 (px)。                                             |
| `bottom`    | `number`                                                                               | `20`        | 距视口底部的距离 (px)，再叠加安全区与 `isTab` 的 50px。                       |
| `duration`  | `number`                                                                               | `300`       | 回到顶部的滚动动画时长 (ms)，传给 `uni.pageScrollTo`。                        |
| `isTab`     | `boolean`                                                                              | `false`     | 是否 TabBar 页面，为 `true` 时额外抬高 50px。                                 |
| `safeArea`  | `boolean`                                                                              | `true`      | 是否叠加底部安全区高度（`uni.getWindowInfo().safeAreaInsets.bottom`）。       |
| `color`     | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 按钮背景的语义色。                                                            |
| `size`      | `'sm' \| 'md' \| 'lg'`                                                                 | `'md'`      | 按钮尺寸，对应 `size-8` / `size-10` / `size-12`。                             |
| `ui`        | `object`                                                                               | -           | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                  |

:::

::

### Emits

两端通用：

| 事件名  | 回调参数 | 描述                                                                         |
| ------- | -------- | ---------------------------------------------------------------------------- |
| `click` | -        | 点击按钮时触发；组件已先发起滚动（回到顶部或去底部），无需在回调中重复处理。 |

### Slots

两端通用：

| 插槽名    | 作用域参数 | 描述                                                                                         |
| --------- | ---------- | -------------------------------------------------------------------------------------------- |
| `default` | -          | 整体替换按钮主体；替换后 `color` / `size` 以及 Web 端的 `shape` / `icon` / 进度环都不再生效。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名            | 说明                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`       | 外层定位容器，默认 `fixed right-0 z-50`。显隐用行内的 `opacity` / `pointer-events` 控制，在这里改透明度不会生效；需要避让侧栏时在这里改 `right`。             |
| `base`          | 按钮主体，背景色、边长、圆角都在这里；键盘聚焦时的描边也画在这里。显隐时的横向滑动是额外绑定的 `translate-x` 类。                                             |
| `icon`          | 图标或文字箭头，默认 `text-white`，字号随 `size`。**传了默认插槽时不渲染**，`ui.icon` 随之失效。                                                               |
| `progress`      | 进度 SVG 根节点，默认 `absolute inset-0`。仅 `showProgress` 开启且未传默认插槽时渲染。                                                                       |
| `progressTrack` | 进度底环，默认 `stroke-white/25`，线宽随 `size`。                                                                                                              |
| `progressBar`   | 进度本体，默认 `stroke-white` 圆头线帽；长度由行内的 `stroke-dashoffset` 驱动，进度为 0 时不渲染。                                                            |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名      | 说明                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `wrapper` | 外层定位容器，默认 `fixed right-0 z-50`，显隐用行内的 `opacity` 控制。 |
| `base`    | 按钮主体，背景色、尺寸、圆角都在这里。                                  |
| `icon`    | 文字箭头，默认 `text-white`。传了默认插槽时不渲染。                    |

:::

::

```vue
<template>
  <RebornBackTop
    show-progress
    shape="square"
    :ui="{ wrapper: 'right-4', base: 'shadow-none', progressBar: 'stroke-yellow-300' }"
  />
</template>
```

## 两端差异对照

| 维度         | Web                                                 | UniApp                                       |
| ------------ | --------------------------------------------------- | -------------------------------------------- |
| 滚动来源     | 默认自动监听 `window`，传 `scrollTop` 时以它为准    | 必须由 `onPageScroll` 传入 `scrollTop`        |
| 方向         | `direction` 支持回到顶部与去底部                    | 只有回到顶部                                 |
| 形状         | `shape` 圆形 / 圆角方形                              | 固定圆形                                     |
| 尺寸档位     | `xs` / `sm` / `md` / `lg`（24 ~ 48px）              | `sm` / `md` / `lg`                           |
| 图标         | `icon` 接受 Iconify 图标名                          | 用默认插槽替换                               |
| 滚动进度     | `showProgress` / `scrollRange`                      | 不支持                                       |
| 滚动动画     | 浏览器平滑滚动，`duration` 不生效                   | `uni.pageScrollTo`，时长取 `duration`        |
| 安全区       | 视为 0                                              | 读 `safeAreaInsets.bottom`                   |
| `ui` 键位    | `wrapper` / `base` / `icon` / `progress` / `progressTrack` / `progressBar` | `wrapper` / `base` / `icon` |
| 键盘与读屏   | `role="button"`，可 Tab 聚焦，Enter / 空格触发，读出「回到顶部」/「去底部」 | 无                         |

## 注意事项

- **UniApp 端必须传 `scrollTop`**。组件拿不到页面滚动，不传时 `scrollTop` 恒为 0，按钮永远不会出现；在页面的 `onPageScroll` 里同步即可。
- **一对按钮要放两个实例**。一个实例只负责一个方向，两个实例各自显隐、位置固定，`bottom` 至少差一个按钮边长加间距，否则会叠在一起。
- **去底部按钮在服务端渲染时隐藏**。它要等挂载后测出文档高度才知道离页尾还有多远，首屏会在水合后才出现；内容不足一屏时始终隐藏。
- **`scrollTop` 与 `scrollRange` 要成对传**。只接管 `scrollTop` 时，可滚动总距离仍按 `window` 的文档高度算，进度百分比与去底部的显隐都会错。
- **点击仍然滚动 `window`**。即使用 `scrollTop` 接管了数值，回到顶部与去底部滚的都是整页，滚动容器需要自己在 `click` 里处理。
- **默认插槽接管的是整个按钮**。进度环、形状、图标都画在内置按钮里，传了插槽就全部失效，只剩定位与显隐。
- **`duration` 在 Web 端不生效**。Web 端走浏览器的 `behavior: 'smooth'`，时长由浏览器决定，这个 prop 只为与 UniApp 端对齐而保留。
- **隐藏时整体 `inert`**。Web 端按钮隐藏时外层加 `inert`，Tab 键不会停在看不见的按钮上，读屏也读不到它。点击后按钮会持有焦点，滚到页首 / 页尾后随即隐藏，浏览器此时把焦点移回页面；不用 `aria-hidden` 是因为它落在仍持有焦点的元素上会被浏览器拦截。
