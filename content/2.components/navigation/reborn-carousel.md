---
title: Carousel 走马灯
description: 用于循环展示多个内容项的轮播组件，支持多项显示、卡片模式与纵向布局，仅 web 端。
category: 数据展示
platform: web
tags: [css, tailwind, carousel, slider, motion]
---

::ComponentViewer{demoFile="RebornCarouselDemo.vue" config="RebornCarouselConfig" componentId="reborn-carousel" :componentFiles='["RebornCarousel.vue", "reborn-carousel.config.ts", "types.ts"]'}
::

## 简介

Carousel 是基于原生 CSS Scroll Snap 的 Web 轮播组件，不依赖第三方轮播库。默认插槽的每个有效直接子节点是一项；UniApp 端暂未提供同名实现。

布局维度独立组合：`slidesPerView` 控制每屏数量，`direction` 控制方向，`type` 控制平面或卡片形态；`centeredSlides`、`autoSize` 与 `breakpoints` 决定对齐、内容尺寸和响应式布局。

`v-model` 同步真实索引，`loop`、`autoplay`、`draggable`、`keyboard` 控制交互；`pagination` 与 `thumbs` 提供导航，`ui` 和导航插槽覆盖外观。实例提供导航、暂停和恢复方法。

### 何时使用

- 展示首页图片或专题卡片，通过 `loop` 和 `autoplay` 控制循环与停留时间。
- 一屏多项内容列表，通过 `slidesPerView`、`spaceBetween` 和 `breakpoints` 适配窗口宽度。
- 图库或商品图片，通过 `thumbs` 联动缩略图与主图索引。
- 可操作的内容面板，通过 `keyboard`、`draggable` 和导航插槽提供不同输入方式。

### 何时不使用

- UniApp 小程序轮播 —— 改用平台原生 `swiper`，当前组件仅支持 Web。
- 苹果卡片风格的展示型轮播 —— 改用 `apple-card-carousel`。
- 用户评价文案动画 —— 改用 `testimonial-slider` 或 `animated-testimonials`。

## 用法

### 基础用法

`initialSlide` 指定初始索引，`v-model` 非空时优先使用模型值，`pagination` 开启分页。

| 维度 | 取值 | 典型用途 |
| --- | --- | --- |
| 初始位置 | `initialSlide` / `v-model` | 默认展示指定内容 / 外部受控导航 |
| 循环 | `loop` | 双向滑入相邻克隆片，动画完成后静默归位；默认关闭 |

```vue
<RebornCarousel :initial-slide="1" :height="240" loop :pagination="{ type: 'dot' }">
  <img v-for="src in images" :key="src" :src="src" class="h-full w-full object-cover">
</RebornCarousel>
```

### 分页指示器

`pagination.type` 选择内置分页，`pagination.display` 控制显隐，`pagination.indicatorBackground` 控制背景；三者均放在 `pagination` 对象中。

| 维度 | 取值 / 默认值 | 典型用途 |
| --- | --- | --- |
| 类型 | `line`（默认） / `dot` / `progress` / `fraction` / `button` | 线段导航 / 圆点导航 / 页数比例 / 分数文字 / 序号按钮 |
| 显示模式 | `display: 'always'`（默认） / `'hover'` / `'never'` | 始终显示 / 悬停或键盘聚焦时显示 / 不渲染分页 |
| 容器背景 | `indicatorBackground: true`（默认） / `false` | 显示半透明背景、毛玻璃与阴影；line / dot 增加留白和内描边，便于辨认浅色图片上的底板 / 仅保留指示项；不影响 progress |
| 导航交互 | `clickable: true`（默认） / `false` | 控制 line、dot、button 的点击和悬停切换；progress、fraction 仅展示 |
| 偏移间距 | `indicatorOffset: 8`（默认，px） | 设置内部分页的边缘距离或外部分页与主图的间距；progress 始终贴边 |

| 类型 | 尺寸与状态 | 典型用途 |
| --- | --- | --- |
| `line` | 全部项 24×2px，间距 8px；无背景时容器为 `p-0.5 rounded-sm`，开启背景后为 `p-2` 胶囊；inside 激活 gray-1、outside 激活 gray-5，未激活均为 gray-4 | 图片底部的线段导航 |
| `dot` | 普通项 6×6px、gray-10；激活项 10×6px、透明底与 1px gray-10 描边；间距 8px，容器为胶囊，开启背景时 `p-2`、关闭时 `p-0.5` | 紧凑圆点导航 |
| `progress` | 复用 `RebornProgress`，通过 ui 将轨道高度设为 2px、两端去圆角；比例为 `(当前索引 + 1) / 总数` | 显示当前第几张 / 总张数，不表示自动播放倒计时 |
| `fraction` | `index / total`、`text-base`，容器 `px-4 py-1 rounded-full`；当前页文字自身悬停时使用 `color` 对应色，容器悬停时总数 `font-bold` | 需要明确页数的图库 |
| `button` | 保留 20×20px 数字按钮与内描边，容器 `px-2 py-1`（左右 8px、上下 4px） | 直接按序号选择内容 |

| 开启容器背景 | inside | outside | 典型用途 |
| --- | --- | --- | --- |
| `line` | `bg-gray-10/30` + `ring-gray-1/20` 内描边 + 24px 毛玻璃 + 阴影 | `bg-gray-1/80` + `ring-gray-10/15` 内描边 + 24px 毛玻璃 + 阴影 | 8px 留白的胶囊底板，衬托对应位置的激活项 |
| `dot` | `bg-gray-1/80` + `ring-gray-10/15` 内描边 + 24px 毛玻璃 + 阴影 | `bg-gray-1/80` + `ring-gray-10/15` 内描边 + 24px 毛玻璃 + 阴影 | 8px 留白的胶囊底板，保留圆点与图片间的可见边界 |
| `fraction` / `button` | `bg-gray-1/30` + 24px 毛玻璃 + 阴影 | `bg-gray-1/30` + 24px 毛玻璃 + 阴影 | 文字与数字按钮的胶囊底板 |
| `progress` | 贴主图内部顶部 | 贴主图外部底部，无间隙 | 满宽页数进度，不使用容器背景和 indicatorOffset |

`fraction` 没有固定宽度或最小宽度，由文字自然撑开。纵向轮播的 `fraction` 和 `progress` 仍横向显示；其他类型沿纵向排列。`color` 取对应色板第 6 阶：`line` 可点击的激活项悬停时改变填充色，`dot` 可点击的激活项悬停时改变描边色，未悬停和未激活项仍使用上述灰阶；`button` 激活项与 `progress` 填充直接使用该色，`fraction` 仅当前页文字自身悬停时变色。`clickable: false` 时，线段和圆点的悬停配色不生效。

`display="hover"` 同时支持悬停与轮播内的键盘焦点，内外分页及自定义 `indicators` 插槽遵循同一规则；隐藏时不拦截点击或焦点，外部分页仍保留占位，避免页面上下跳动。无悬停能力的触屏设备降级为始终显示。`display` 只控制显隐，`trigger` 决定指示项通过点击还是悬停切页。

演练场将参数分为布局、指示器、操作、自动播放、缩略图五组；快捷预设从默认配置开始，切页按钮同步模型与 `change` 回显，未启用的关联控件自动收起。传参明细与预览共用同一配置。

```vue
<RebornCarousel :height="240" loop
  :pagination="{ type: 'line', display: 'hover', clickable: true, indicatorBackground: false }">
  <div v-for="item in items" :key="item.id" class="h-full">{{ item.title }}</div>
</RebornCarousel>
<RebornCarousel :height="240" indicator-position="outside" :pagination="{ type: 'progress' }">
  <div v-for="item in items" :key="item.id" class="h-full">{{ item.title }}</div>
</RebornCarousel>
```

### 多项显示与响应式

`slidesPerView` 为推荐拼写，旧参数 `slidesPerview` 继续兼容；`breakpoints` 按最小窗口宽度累计覆盖。

| 维度 | 取值 | 典型用途 |
| --- | --- | --- |
| 每屏数量 | 数字（至少 1，支持小数） / `auto` | 等宽多卡 / 内容决定宽度 |
| 间距 | `spaceBetween`，非负 px | 多项、卡片或自动尺寸的内容分隔；平面单项占满视口时为 0px |
| 断点 | `Record<number, RebornCarouselBreakpoint>` | 由窄屏单卡切换为宽屏多卡 |

```vue
<RebornCarousel :slides-per-view="1" :space-between="16"
  :breakpoints="{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }"
  :height="200" arrow="always">
  <div v-for="item in items" :key="item.id">{{ item.title }}</div>
</RebornCarousel>
```

### 卡片与自动尺寸

`type="card"` 缩放当前项与非当前项；内容应声明宽度，避免自动尺寸时所有项铺满视口。

| 维度 | 取值 | 典型用途 |
| --- | --- | --- |
| 形态 | `default` / `card` | 平面图片 / 聚焦卡片 |
| 对齐 | `centeredSlides` | 当前内容居中 |
| 尺寸 | `autoSize` / `slidesPerView="auto"` | 按内容宽高排布 |

```vue
<RebornCarousel type="card" slides-per-view="auto" :space-between="16" centered-slides loop :height="260">
  <div v-for="item in items" :key="item.id" class="h-full w-72 rounded-xl p-6">
    {{ item.title }}
  </div>
</RebornCarousel>
```

### 纵向轮播

`direction="vertical"` 将滚动轴、箭头和键盘方向改为纵向，需设置明确高度。

| 方向 | 键盘 | 典型用途 |
| --- | --- | --- |
| `horizontal` | 左 / 右 | 图片、内容卡片 |
| `vertical` | 上 / 下 | 分阶段说明 |

```vue
<RebornCarousel direction="vertical" :height="240" arrow="always" :pagination="{ type: 'button' }">
  <div v-for="item in items" :key="item.id" class="h-full">{{ item.title }}</div>
</RebornCarousel>
```

### 缩略图导航

`thumbs` 的位置决定缩略图方向，主图索引变化后只滚动缩略图容器，不带动页面。

| 维度 | 取值 | 典型用途 |
| --- | --- | --- |
| 位置 | `top` / `bottom` / `left` / `right` | 上下预览栏 / 侧边图库 |
| 箭头 | `hover` / `always` / `never` | 桌面悬停 / 常驻操作 / 隐藏 |
| 导航循环 | `thumbs.loop` | 缩略图箭头越界回绕，不改变主轨道 `loop` |

```vue
<RebornCarousel :height="320" :thumbs="{ position: 'left', arrow: 'hover' }" loop>
  <img v-for="src in images" :key="src" :src="src" class="h-full w-full object-contain">
</RebornCarousel>
```

### 自动播放与实例控制

`autoplay` 的暂停策略默认开启；`pause()` 不会因点击导航而失效，`resume()` 才恢复手动暂停。

| 控制 | 默认行为 | 典型用途 |
| --- | --- | --- |
| `delay` | 3000ms，最小 800ms | 调整阅读时间 |
| `pauseOnHover` / `pauseOnFocus` | `true` | 悬停或键盘阅读时停留 |
| `pause()` / `resume()` | 持续暂停 / 恢复计时 | 外部播放控制 |

```vue
<script setup lang="ts">
import type { CarouselExpose } from '~/components/reborn/ui/reborn-carousel';
const carousel = ref<CarouselExpose>();
</script>
<template>
  <RebornCarousel ref="carousel" loop :autoplay="{ delay: 3000, pauseOnHover: true }">
    <div v-for="item in items" :key="item.id">{{ item.title }}</div>
  </RebornCarousel>
  <RebornButton @click="carousel?.pause()">暂停</RebornButton>
  <RebornButton @click="carousel?.resume()">继续</RebornButton>
</template>
```

### 动态内容与交互

运行时增删默认插槽节点会重新计算数量，删除当前末项时同步合法索引；输入框保留原生方向键行为。

| 维度 | 行为 | 典型用途 |
| --- | --- | --- |
| `draggable` | 鼠标拖动，未传时跟随 `grabCursor` | 桌面手势浏览 |
| `grabCursor` | 抓取光标 | 提示可拖动区域 |
| `keyboard` | 方向键和 Home / End | 键盘导航；可显式关闭 |

```vue
<RebornCarousel v-model="index" draggable grab-cursor :height="240" :pagination="{ type: 'button' }">
  <div v-for="item in items" :key="item.id" class="h-full">
    {{ item.title }}
    <input aria-label="内容备注">
  </div>
</RebornCarousel>
```

### 自定义导航与样式

导航插槽透出操作函数和状态；`ui` 以配置键覆盖样式，分数分页同样使用 `ui.indicators`。

| 入口 | 作用 | 典型用途 |
| --- | --- | --- |
| `prev` / `next` | 导航函数与 `disabled` | 自定义按钮 |
| `indicators` | `activeIndex`、`count`、`goTo` | 业务分页 |
| `ui` | 样式键覆盖 | 圆角、箭头与分页样式 |

```vue
<RebornCarousel :pagination="{ type: 'fraction' }" :ui="{ root: 'rounded-xl' }">
  <div v-for="item in items" :key="item.id">{{ item.title }}</div>
  <template #prev="{ prev, disabled }">
    <RebornButton class="pointer-events-auto" :disabled="disabled" @click="prev">上一项</RebornButton>
  </template>
</RebornCarousel>
```

## API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `number \| null` | `null` | 当前真实索引，从 0 起；非空时优先于 initialSlide。 |
| `slidesPerView` | `number \| "auto"` | 回退到 slidesPerview | 推荐的每屏数量参数；同层新旧参数并存时此项优先。 |
| `slidesPerview` | `number \| "auto"` | `1` | 兼容旧拼写，新代码推荐 slidesPerView。 |
| `spaceBetween` | `number` | `0` | 间距（px），负值归零；平面单项占满视口时忽略，不影响多项、卡片与自动尺寸。 |
| `centeredSlides` | `boolean` | `false` | 当前项居中，非循环首尾受滚动范围约束。 |
| `loop` | `boolean` | `false` | 使用相邻克隆片双向衔接首尾；箭头、指示器和外部模型更新共用循环路径。 |
| `autoplay` | `boolean \| CarouselAutoplay` | `false` | true 为 3000ms；对象支持 delay、pauseOnHover、pauseOnFocus。 |
| `pagination` | `CarouselPagination \| null` | `null` | type：line / dot / progress / fraction / button；display：hover / always / never，默认 always；clickable、indicatorBackground 默认 true。null 时不渲染分页。 |
| `trigger` | `"hover" \| "click"` | `"hover"` | hover 增加悬停切换，点击与键盘原生激活始终可用。 |
| `indicatorPosition` | `"inside" \| "outside" \| "none"` | `"inside"` | 内部、外部或隐藏分页。 |
| `arrow` | `"hover" \| "always" \| "never"` | `"hover"` | hover 同时支持键盘聚焦显示。 |
| `motionBlur` | `boolean` | `false` | 非激活项增加模糊。 |
| `height` | `string \| number` | `"auto"` | 数字为 px，字符串支持 CSS 高度；auto 按当前项计算高度。 |
| `type` | `"default" \| "card"` | `"default"` | 卡片模式按内容自身尺寸布局。 |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | 主滚动轴。 |
| `initialSlide` | `number` | `0` | 未指定非空模型时的初始项。 |
| `breakpoints` | `Record<number, RebornCarouselBreakpoint>` | `{}` | 最小窗口宽度（px），由小到大累计覆盖。 |
| `grabCursor` | `boolean` | `false` | 抓取光标；未传 draggable 时同时控制鼠标拖动。 |
| `draggable` | `boolean` | `undefined` | 鼠标拖动开关，未传时跟随 grabCursor；触屏仍使用原生滚动。 |
| `keyboard` | `boolean` | `true` | 方向键、Home、End；输入与可编辑区域不拦截。 |
| `autoSize` | `boolean` | `false` | 不强行分配子项尺寸。 |
| `indicatorOffset` | `number` | `8` | 指示器偏移（px），支持 0；横向内部为底边距离、外部为顶部间距，纵向为右侧或外部左侧间距。progress 固定贴边，此参数不生效。 |
| `thumbs` | `CarouselThumbs \| null` | `null` | position 默认 bottom，arrow 默认 never，loop 默认 false。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 分页配色，使用对应色板第 6 阶；控制可点击的 line / dot 激活项悬停色、fraction 当前页文字自身悬停色，以及 button 激活项和 progress 填充色。 |
| `class` | `ClassValue` | — | 合并到最外层 wrapper。 |
| `ui` | `CarouselUI` | `{}` | 与主题 slots 同源的 ClassValue 覆盖。 |

#### RebornCarouselBreakpoint

支持 `slidesPerView`、兼容 `slidesPerview`、`spaceBetween`、`centeredSlides`、`arrow`、`indicatorPosition`、`motionBlur`、`height`、`type`、`direction`、`grabCursor`、`autoSize`。类型与同名主参数一致；同一断点层内推荐拼写优先于旧拼写。

### Emits

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `number` | 内部导航或动态内容修正时同步索引。 |
| `change` | `number` | 真实索引发生变化时触发，不表示动画完成；初始化和外部模型更新不触发。 |

### Slots

| 名称 | 作用域参数 | 说明 |
| --- | --- | --- |
| `default` | — | 每个有效直接子节点为一项，Fragment 展开，注释与空文本忽略。 |
| `prev` | `{ prev, disabled }` | 替换上一项按钮；需自行应用 disabled。 |
| `next` | `{ next, disabled }` | 替换下一项按钮；需自行应用 disabled。 |
| `indicators` | `{ activeIndex, count, goTo }` | 替换默认分页；仍需 pagination 非空、位置非 none、display 非 never；hover 显隐同样生效。 |

### Expose

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `next` | `() => void` | 下一项；非循环达到末个可视组时不再推进。 |
| `prev` | `() => void` | 上一项；loop 首尾衔接。 |
| `goTo` | `(index: number) => void` | 指定真实索引，loop 取模；小数取整数，非有限值回到 0。 |
| `pause` | `() => void` | 持续暂停自动播放。 |
| `resume` | `() => void` | 解除手动暂停，仍遵循 hover、focus 和页面可见性。 |
| `activeIndex` | `number`（只读） | 当前真实索引。 |
| `isPlaying` | `boolean`（只读） | 自动播放计时器是否运行。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。本组件仅 Web 端提供。节点自外向内是：`wrapper` → `thumbsShell` →（左/上侧的缩略图面板 + 主轮播 `root`）。

#### 外层与轨道

| 键名            | 说明                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`       | 最外层节点，默认 `group/carousel-shell w-full max-w-full min-w-0 overflow-visible`，允许外部分页的阴影绘制在容器外；轮播内容仍由 root / viewport 裁剪。命名分组为内外指示器提供悬停和聚焦范围；`class` prop 也并到该节点，整体外边距、宽度改这里。 |
| `thumbsShell`   | 「缩略图面板 + 主轮播」的 flex 外壳，默认 `flex gap-4 md:gap-5`；两者之间的间距、排列方向（受 `thumbs.position` 控制）改这里。                                          |
| `root`          | 主轮播根节点，默认 `group/reborn-carousel relative isolate w-full min-w-0 max-w-full overflow-hidden`；圆角、阴影、外框改这里（箭头与 `inside` 指示器都定位在它内部）。 |
| `viewport`      | 滚动视口，默认 `relative w-full min-w-0 max-w-full overflow-auto` 并隐藏滚动条；`grabCursor` 生效时会追加 `cursor-grab`。                                               |
| `track`         | 轨道，默认 `flex w-full min-w-full items-start`；轨道使用原生滚动，间距由内联 `style` 驱动。                                                              |
| `slide`         | 单个轮播项外层，默认 `relative min-w-0 max-w-full shrink-0 transition-all duration-500`；宽度由 `slidesPerView` 计算成内联样式，这里适合改圆角、间距。                  |
| `slideActive`   | **当前项**的追加类名——不是独立节点，激活时并入 `slide`。                                                                                                                |
| `slideInactive` | **非当前项**的追加类名，同样并入 `slide`（默认 `opacity-80`，可覆盖未激活项透明度）。                                                                                 |
| `slideInner`    | 轮播项内层容器（default 插槽内容的直接父级），默认 `relative w-full overflow-hidden isolate rounded-[inherit]`。                                                        |

#### 箭头与指示器

| 键名                | 说明                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `arrowGroup`        | 左右箭头的定位容器。**仅 `arrow` 判定为显示时渲染**，默认 `pointer-events-none absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 justify-between`；箭头离边距离改这里。                                              |
| `arrow`             | 单个箭头按钮，默认 `size-10 rounded-full inline-flex items-center justify-center bg-[#000000]/45 backdrop-blur-3xl border`。**仅在未填充 `prev` / `next` 插槽时渲染**，填充这两个插槽会替换掉按钮，`ui.arrow` 随之失效。 |
| `indicatorWrapper`  | 指示器定位与显隐容器，默认 `flex justify-center`；`indicatorPosition` 为 `inside` 时在 `root` 内绝对定位，为 `outside` 时在 `root` 下方常规排列；偏移由 indicatorOffset 设置，优先于该键的边缘距离 / 间距类名；`pagination.display` 对内置分页与自定义插槽均生效。 |
| `indicators`        | 五种内置分页的容器；基础为 `flex w-max items-center gap-2 p-0.5`。line / dot 开启背景时使用 `p-2`，button 使用 `px-2 py-1`，fraction 使用 `px-4 py-1`，progress 为满宽无内边距。背景由 `pagination.indicatorBackground` 控制：line / dot 使用 `bg-gray-1/80 ring-1 ring-inset ring-gray-10/15`，其中 inside line 改用 `bg-gray-10/30 ring-gray-1/20`，衬托 gray-1 激活项；fraction / button 保留 `bg-gray-1/30`。开启背景的四种分页均使用 `backdrop-blur-xl shadow-[0_0_8px_rgb(0_0_0/0.18)] rounded-full`：24px 背景模糊，阴影横纵偏移均为 0、模糊半径为 8px，均匀环绕四周；progress 不使用底板。自定义 `indicators` 插槽时此键及以下分页内容样式键失效，`indicatorWrapper` 仍有效。 |
| `indicator`         | line / dot / button 的导航按钮；line 为 24×2px，dot 普通项 6×6px、激活项 10×6px，button 为 20×20px。fraction / progress 不渲染此节点。 |
| `indicatorActive`   | 当前按钮的追加类名，line 默认依位置使用 gray-1 / gray-5，可点击时悬停为 `bg-(--carousel-color)`；dot 默认透明底与 gray-10 描边，可点击时悬停为 `border-(--carousel-color)`；button 使用 `bg-(--carousel-color)`。仅 line / dot / button 生效。 |
| `indicatorInactive` | 非当前按钮的追加类名，line 为 bg-gray-4，dot 为 bg-gray-10，button 保留 gray-2 与内描边；仅 line / dot / button 生效。 |
| `indicatorCurrent` | fraction 的当前页文字，默认 `hover:text-(--carousel-color)`，仅该文字自身悬停时变色；其他类型不渲染。 |
| `indicatorTotal` | fraction 的总数文字，默认容器悬停时 font-bold；其他类型不渲染。 |
| `progress` | RebornProgress 根节点，默认满宽、无间距、`text-(--carousel-color)`；填充通过 `currentColor` 继承该配色，仅 progress 生效。 |
| `progressTrack` | 传给 RebornProgress 的 ui.step，默认 h-0.5 rounded-none；仅 progress 生效。 |
| `progressFill` | 传给 RebornProgress 的 ui.fill，默认 rounded-none；仅 progress 生效。 |

> `pagination.type="fraction"` 的容器也使用 `ui.indicators`，可直接覆盖分数分页样式。自定义 `indicators` 插槽会替换默认分页。

#### 缩略图

以下键仅在传入 `thumbs` 配置后渲染：

| 键名               | 说明                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `thumbsPanel`      | 缩略图面板根节点，默认 `group/reborn-carousel-thumbs relative flex min-w-0 shrink-0 gap-3`；面板尺寸由 `thumbs` 配置算成内联样式。                              |
| `thumbsViewport`   | 缩略图滚动视口，默认 `min-w-0 min-h-0` 并隐藏滚动条。                                                                                                           |
| `thumbsTrack`      | 缩略图轨道，默认 `flex gap-3`；缩略图之间的间距改这里。                                                                                                         |
| `thumb`            | 单张缩略图外层，默认 `group/thumb relative overflow-hidden transition-all duration-300`；宽高由 `thumbs` 配置给出。                                             |
| `thumbActive`      | **当前**缩略图的追加类名，默认 `border border-gray-10 rounded-xl`——并入 `thumb`，选中描边改这里。                                                             |
| `thumbInactive`    | **非当前**缩略图的追加类名，默认带 `opacity-70` 与 hover 提亮，同样并入 `thumb`。                                                                               |
| `thumbPreview`     | 缩略图内的预览容器（复用 default 插槽内容并强制铺满），默认 `pointer-events-none h-full w-full overflow-hidden rounded-[inherit]`。                             |
| `thumbOverlay`     | 缩略图上的渐变蒙层，默认 `pointer-events-none absolute inset-0 bg-linear-to-t …`；组件按选中态给它 `opacity-40` / `opacity-10`，写在这里的类名会追加在后面。    |
| `thumbsArrowGroup` | 缩略图箭头的定位容器。**仅存在多项且 `thumbs.arrow` 允许显示时渲染**，默认 `pointer-events-none absolute z-10 flex items-center gap-2`。                    |
| `thumbsArrow`      | 缩略图箭头按钮，默认 `size-8 rounded-full inline-flex items-center justify-center bg-[#000000]/45 backdrop-blur-3xl border`；该按钮没有对应插槽，覆盖一定生效。 |


```vue
<RebornCarousel :pagination="{ type: 'fraction' }" :ui="{ root: 'rounded-xl', indicators: 'bg-gray-1/50 px-4' }">
  <img v-for="src in images" :key="src" :src="src" class="h-60 w-full object-cover">
</RebornCarousel>
```

### CSS 变量

局部变量 `--carousel-color` 由 `app/components/reborn/ui/reborn-carousel/reborn-carousel.config.ts` 的 `color` 变体通过 Tailwind 类写入 `indicators` 节点。其引用的色板定义在 `app/assets/theme/base.css`，字号定义在 `app/assets/theme/typography.css`；局部样式优先通过 `ui` 覆盖。

| 变量名 | 用途 | 默认值 |
| --- | --- | --- |
| `--color-gray-1` / `--color-gray-2` / `--color-gray-4` / `--color-gray-5` / `--color-gray-10` | 线段、圆点与分页底板 | 随浅色 / 深色主题切换 |
| `--carousel-color` | 可点击的 line / dot 激活项悬停色、fraction 当前页文字自身悬停色，以及 button 激活项和 progress 填充色 | 默认 `var(--color-brand-6)`；随 `color` 映射，见下表 |
| `--text-base` / `--text-base--line-height` | 分数分页字号与行高 | 14px / 22px |

| `color` | `--carousel-color` 引用 |
| --- | --- |
| `primary` | `var(--color-brand-6)` |
| `secondary` | `var(--color-secondary-6)` |
| `success` | `var(--color-green-6)` |
| `info` | `var(--color-blue-6)` |
| `warning` | `var(--color-orange-6)` |
| `error` | `var(--color-red-6)` |
| `neutral` | `var(--color-gray-6)` |

## 注意事项

- **新代码使用 slidesPerView。** 旧拼写继续兼容；断点优先于基础参数，同一配置层内推荐拼写优先，避免两种拼写混用。
- **纵向布局需要明确高度。** auto 依赖内容测量，没有纵向滚动参照高度时不能保证滚动范围。
- **自动尺寸内容要声明宽度。** card、autoSize 或 slidesPerView="auto" 不分配等宽尺寸，未声明时可能铺满视口。
- **自动播放默认关闭。** 非循环到末个可视组时停止；悬停、键盘焦点、拖动或后台页面暂停计时，页面恢复不会解除手动 pause。
- **克隆片会重复挂载内容。** loop 和 thumbs 复用节点快照但仍创建不同实例，避免重复 DOM id 或挂载时产生业务副作用；克隆片和缩略预览均阻止键盘聚焦。
- **change 不是动画完成事件。** 索引更新时立即触发，外部模型更新不触发；循环转场校验实际目标，忽略旧 scrollend，原生事件缺失时有有界超时解锁兜底。
- **拖拽期间不提前归位。** 按住鼠标时由指针独占滚动位置，松手后才同步索引、吸附并处理循环归位；交互控件不启动拖动，触屏保留原生滚动。
- **分数和进度条仅展示。** clickable 只控制 line / dot / button；progress 显示当前页比例，不是自动播放倒计时，且不响应 indicatorOffset 和背景开关。
- **背景开关位于 `pagination` 内。** `indicatorBackground` 默认 true；line / dot 通过 8px 留白、80% 不透明度的 gray-1 底色和内描边区分浅色图片，其中 inside line 使用 30% 不透明度的 gray-10 底色衬托 gray-1 激活项。fraction / button 保留 30% 不透明度的 gray-1 底色。false 移除底色、内描边、毛玻璃与阴影，line / dot 留白恢复为 2px，指示项颜色不变；自定义 `indicators` 插槽与 `ui` 覆盖需自行控制外观。
- **外部分页的阴影不应由外层裁剪。** 组件 wrapper 保留可见溢出，root / viewport 独立限制轮播内容；业务父容器若设置 overflow-hidden，仍需为投影预留内边距，或将裁剪下移到内容区域，增加 z-index 不能突破祖先裁剪。
- **显示模式位于 pagination 内。** display 默认 always，hover 在轮播悬停或键盘聚焦时显示，无悬停能力的设备保持可见；never 不挂载分页及 indicators 插槽。pagination=null、indicatorPosition="none" 或内容不足两项仍优先隐藏分页；不影响箭头、模型或自动播放。
