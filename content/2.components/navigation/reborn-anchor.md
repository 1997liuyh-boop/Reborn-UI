---
title: Anchor 锚点
description: Web 端锚点导航：滚动自动高亮链接，可指定容器、偏移量、水平排布与子链接嵌套。
category: 导航
platform: web
tags: [css, tailwind, anchor, navigation]
badge: New
---

::warning
仅 Web 端组件。小程序没有同步几何测量与 `href="#id"` 锚点语义，UniApp 端暂无对应实现；移动端的章节定位可用 `scroll-view` 的 `scroll-into-view` 自行实现。
::

::ComponentViewer{demoFile="RebornAnchorDemo.vue" config="RebornAnchorConfig" componentId="reborn-anchor" :componentFiles='["RebornAnchor.vue", "RebornAnchorLink.vue", "reborn-anchor.config.ts"]'}
::

## 简介

Anchor 是一份跟着滚动走的目录：链接的 `href` 指向页面里某个元素的 `id`，用户滚到哪一段，对应的链接就自动高亮；点链接则把那一段滚到视口里。API 对齐 Element Plus 的 Anchor（`RebornAnchor` + `RebornAnchorLink` 父子成对使用）。

判定逻辑是一条**触发线**：`container` 指到真正发生滚动的那一层（留空则监听整个窗口），组件在滚动时逐个量各目标元素的顶部距容器顶部还有多远，取最后一个越过触发线的链接作为选中项。触发线的位置由 `bound` 决定（默认 15px），开启 `select-scroll-top` 后阈值压到 0、`bound` 不再参与；容器滚到底时强制选中最后一项，末尾的短区块才有机会亮起来。

其余 API 按职责分三组：**外观**有 `marker` 决定跟随选中项滑动的标记长什么样（竖条 / 实心圆 / 空心圆 / 不显示）、`type` 决定画不画那条贯穿的轨道线、`direction` 决定链接竖排还是横排、`color` 换强调色，配合 `ui` 做细粒度覆盖；**行为**有 `offset` 控制滚完之后目标停在距顶多远、`duration` 控制滚动时长，实例方法 `scrollTo(href)` 供页面别处触发，`click` 事件在滚动前给出拦截时机；**结构**由 `RebornAnchorLink` 的 `title` / `href` 与 `default` / `sub-link` 两个插槽承担。

### 何时使用

- 长文档、详情页的章节导航——`container` 指向滚动层，每个 `href` 指到一个区块 `id`。
- 设置页、表单分组的侧边目录——默认的 `type="default"` 会画一条轨道线，把分组串成一条视觉主轴。
- 内容区上方的横排小节切换——用 `direction="horizontal"`，链接横排、标记移到底部。
- 页面有吸顶栏、滚动后区块不能贴着容器顶部——用 `offset` 留出吸顶栏的高度。
- 需要从页面别处（搜索结果、目录按钮）跳到某个区块——调实例方法 `scrollTo(href)`。

### 何时不使用

- 切换的是内容而不是滚动位置——改用 `reborn-tabs`，它按 key 换面板，不动滚动条。
- 跨页面 / 路由的导航——改用 `reborn-menu`，锚点只在当前容器内滚动，不做路由跳转。
- 只想平滑滚到某个元素、不需要目录和高亮——直接用 `element.scrollIntoView({ behavior: 'smooth' })`，不必引组件。

## 用法

### 基础用法

链接的 `href` 写成 `#区块id`，`container` 指到真正发生滚动的那一层（带 `overflow: auto` 的那个盒子，不是它的外层）。锚点不必放在容器里面，指得到就能联动。

```vue
<template>
  <div class="flex gap-6">
    <RebornAnchor container="#doc-body" class="w-32">
      <RebornAnchorLink href="#install" title="安装" />
      <RebornAnchorLink href="#usage" title="基础用法" />
    </RebornAnchor>

    <div id="doc-body" class="h-64 flex-1 overflow-y-auto">
      <section id="install">安装</section>
      <section id="usage">基础用法</section>
    </div>
  </div>
</template>
```

### 水平锚点

`direction` 决定链接怎么排、标记落在哪一边。它只改链接列表的排布，滚动判定始终按目标元素的垂直位置来算。

| `direction` | 排布与标记 | 典型用途 |
| --- | --- | --- |
| `vertical`（默认） | 链接竖排，标记在左侧轨道上，四种形态都支持 | 侧边目录，可容纳较长的章节标题 |
| `horizontal` | 链接横排，标记是底部随链接宽度伸缩的横线 | 压在内容区正上方的小节切换，标题要短 |

横向下标记只有贴底的滑块一种形态，传 `dot` / `hollow` 会被收敛成 `bar` 渲染——圆点是骑在竖轨道上的形态，压到横轨道上没有对应的画法。

```vue
<template>
  <RebornAnchor direction="horizontal" container="#doc-body">
    <RebornAnchorLink href="#install" title="安装" />
    <RebornAnchorLink href="#usage" title="基础用法" />
  </RebornAnchor>
</template>
```

### 标记样式

`marker` 决定跟随选中项滑动的那个标记长什么样。它只影响视觉，不影响选中判定。

| `marker` | 表现 | 典型用途 |
| --- | --- | --- |
| `bar`（默认） | 2×21 的竖条，压在轨道线上 | 侧边目录，标记像是轨道被逐段点亮 |
| `dot` | 6px 实心圆，骑在轨道中线上 | 链接较稀疏时，圆点比竖条更像一串节点 |
| `hollow` | 同尺寸的圆但中间挖空 2px | 同上，视觉重量更轻，适合浅色背景 |
| `none` | 不渲染标记，只靠文字颜色区分选中项 | 已有别的选中提示，不想再加一层图形 |

布尔值仍然可用，与 Element Plus 保持一致：`true` 等价于 `bar`，`false` 等价于 `none`。

```vue
<template>
  <RebornAnchor marker="dot" container="#doc-body">
    <RebornAnchorLink href="#install" title="安装" />
    <RebornAnchorLink href="#usage" title="基础用法" />
  </RebornAnchor>
</template>
```

### 轨道线类型

`type` 只管画不画那条贯穿列表的灰色轨道线，和 `marker` 各管一头。

| `type` | 表现 | 典型用途 |
| --- | --- | --- |
| `default`（默认） | 列表上常驻一条 `gray-2` 轨道线 | 侧边目录，轨道线本身就是章节的视觉主轴 |
| `underline` | 不画轨道，只剩标记本身 | 链接稀疏、或标记用圆点时，少一条常驻线更干净 |

`type="default"` 配 `marker="none"` 会留下一条永远不亮的轨道线，想彻底去掉标记请同时把 `type` 设为 `underline`。

```vue
<template>
  <RebornAnchor type="underline" container="#doc-body">
    <RebornAnchorLink href="#install" title="安装" />
    <RebornAnchorLink href="#usage" title="基础用法" />
  </RebornAnchor>
</template>
```

### 强调色

`color` 同时改选中链接的文字色与标记的颜色，取的是各色阶的 `-6` 档；轨道线不跟着变，它是背景而非强调色。七个可选值：`primary`（默认）、`secondary`、`success`、`info`、`warning`、`error`、`neutral`。其中 `neutral` 用的是 `gray-9` 而不是 `gray-6`——后者是浅灰，当强调色看不清。

```vue
<template>
  <RebornAnchor color="success" marker="dot" container="#doc-body">
    <RebornAnchorLink href="#install" title="安装" />
    <RebornAnchorLink href="#usage" title="基础用法" />
  </RebornAnchor>
</template>
```

### 指定滚动容器

`container` 收三种形态：选择器字符串（挂载后用 `document.querySelector` 解析）、`HTMLElement`、`Window`；留空即监听整个窗口。传元素引用时要确保元素已挂载——父组件渲染这一帧模板 ref 还是 `undefined`，得用 `v-if` 等它有值。

```vue
<script setup lang="ts">
const boxRef = ref<HTMLElement>();
</script>

<template>
  <!-- v-if 让锚点首帧拿到的就是元素本身，否则这一帧的 container 是 undefined -->
  <RebornAnchor v-if="boxRef" :container="boxRef">
    <RebornAnchorLink href="#install" title="安装" />
  </RebornAnchor>

  <div ref="boxRef" class="h-64 overflow-y-auto">…</div>
</template>
```

### 偏移量与触发线

两个数值管的是不同环节：`offset` 管**滚完之后**目标停在距容器顶部多远（页面有吸顶栏时填吸顶栏高度）；`bound` 管**什么时候换选中**，目标顶部进到这条线以内即视为选中。`select-scroll-top` 把阈值压到 0，目标顶部真正越过容器顶部才换选中，此时 `bound` 不参与判定。

```vue
<template>
  <!-- 滚完之后区块停在距容器顶部 64px 处，正好避开吸顶栏 -->
  <RebornAnchor :offset="64" :bound="30" container="#doc-body">
    <RebornAnchorLink href="#install" title="安装" />
    <RebornAnchorLink href="#usage" title="基础用法" />
  </RebornAnchor>
</template>
```

### 子链接嵌套

往 `sub-link` 插槽里再放 `RebornAnchorLink` 就是下一级链接：缩进一层，但和上级共用同一套滚动判定与同一个标记。子链接始终竖排，横向锚点下不适用。

```vue
<template>
  <RebornAnchor container="#doc-body">
    <RebornAnchorLink href="#start" title="开始使用">
      <template #sub-link>
        <RebornAnchorLink href="#install" title="安装" />
        <RebornAnchorLink href="#import" title="引入" />
      </template>
    </RebornAnchorLink>
  </RebornAnchor>
</template>
```

### 手动滚动

组件实例暴露 `scrollTo(href)`，不点链接也能滚到指定区块，选中态同步跟上。适合从页面别处触发跳转，比如目录按钮或搜索结果。

```vue
<script setup lang="ts">
const anchorRef = ref<InstanceType<typeof RebornAnchor>>();
</script>

<template>
  <RebornButton @click="anchorRef?.scrollTo('#usage')">
    跳到「基础用法」
  </RebornButton>

  <RebornAnchor ref="anchorRef" container="#doc-body">
    <RebornAnchorLink href="#usage" title="基础用法" />
  </RebornAnchor>
</template>
```

## API

### Props

`RebornAnchor` 的属性：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `container` | `string \| HTMLElement \| Window` | - | 滚动的容器。传选择器字符串时在客户端挂载后才查询 DOM，查不到就不监听；留空监听整个窗口。 |
| `offset` | `number` | `0` | 锚点滚动的偏移量：滚动结束后目标元素距容器顶部的距离，页面有吸顶栏时填吸顶栏高度。 |
| `bound` | `number` | `15` | 触发锚点的元素的位置偏移量：目标顶部进到这条线以内即视为选中。`selectScrollTop` 为 `true` 时不生效。 |
| `duration` | `number` | `300` | 容器滚动持续时间（毫秒）。小于等于 0、或系统开启「减少动态效果」时直接跳转。 |
| `marker` | `boolean \| 'bar' \| 'dot' \| 'hollow' \| 'none'` | `true` | 标记形态：`bar` 竖条、`dot` 实心圆、`hollow` 空心圆、`none` 不显示；`true` 等价于 `bar`、`false` 等价于 `none`。横向锚点只支持 `bar` 与 `none`，传圆点会按 `bar` 渲染。 |
| `type` | `'default' \| 'underline'` | `'default'` | 锚点类型：`default` 画一条贯穿的轨道线；`underline` 不画轨道，只剩标记本身。 |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | 锚点方向。只影响链接列表的排布与标记落点，滚动判定始终是纵向的。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 强调色，同时决定选中链接的文字色与标记颜色；轨道线不受影响。`neutral` 取 `gray-9`。 |
| `selectScrollTop` | `boolean` | `false` | 滚动时链接是否选中位于顶部：开启后触发线阈值压到 0，`bound` 不再参与判定。 |
| `class` | `any` | - | 追加到根元素的自定义类名。 |
| `ui` | `AnchorUI` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

### AnchorLink Props

`RebornAnchorLink` 的属性：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | - | 链接的文本内容。写了 `default` 插槽时以插槽为准。 |
| `href` | `string` | - | 链接的地址，形如 `#section-id`，按井号之后的部分查 `id`。留空的链接不参与滚动判定。 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `change` | `(href: string \| undefined)` | 选中的链接改变时触发。滚到首个锚点之前为 `undefined`；组件没有 `v-model`，当前选中项只能从这里读。 |
| `click` | `(event: MouseEvent, href: string \| undefined)` | 用户点击链接时触发，在滚动之前。在回调里 `event.preventDefault()` 即接管跳转，组件不再滚动也不改选中态。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | `RebornAnchorLink` 组件列表。链接的先后顺序即滚动判定的顺序（挂载后按 DOM 位置自动校正）。 |

### AnchorLink Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 链接的内容，填了它则忽略 `title` prop。 |
| `sub-link` | - | 子链接的槽位，里面继续放 `RebornAnchorLink`；缩进一层，判定与标记仍由最外层的锚点统一承担。 |

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| `scrollTo` | `(href: string) => void` | 手动滚动到指定链接对应的位置，`href` 形如 `#section-id`。选中态在滚动开始时就落到目标链接上，不等补间结束。目标 `id` 不存在、或容器未解析成功时静默返回。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名：

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器，默认只有一条 `min-w-0`。 |
| `list` | 链接列表；标记的定位基准，`type="default"` 的轨道线画在它的 `before` 伪元素上。 |
| `marker` | 标记本体。位置由组件测量后写成行内样式，这里只改形态、颜色与过渡。 |
| `item` | 单个链接与它的子链接共用的外层容器。 |
| `link` | 链接盒子（`a`），选中态的文字色与悬浮反馈落在这里。 |
| `linkTitle` | 链接文字，默认 `truncate`。 |
| `sublist` | 子链接容器（`sub-link` 插槽的外层），只负责缩进。 |

```vue
<template>
  <RebornAnchor
    container="#doc-body"
    :ui="{ link: 'text-sm', sublist: 'pl-6' }"
  >
    <RebornAnchorLink href="#install" title="安装" />
  </RebornAnchor>
</template>
```

`color` 只能取七个预设色阶，强调色最终落成 `bg-primary` / `text-primary` 这类语义类名，组件不再额外定义自己的 CSS 变量。需要色板之外的任意颜色时，在锚点上局部改写对应的色板变量：

```vue
<template>
  <RebornAnchor class="[--color-primary:#7c3aed]" container="#doc-body">
    <RebornAnchorLink href="#install" title="安装" />
  </RebornAnchor>
</template>
```

`type="default"` 的轨道线固定用 `bg-gray-2`，不跟随 `color`——它是背景而非强调色。要改轨道颜色请用 `ui.list` 覆盖 `before:bg-*`。空心标记中间那个 2px 的「洞」同理，固定用 `bg-gray-1`（与浅色面板底色一致），换深色底时需要用 `ui.marker` 覆盖 `after:bg-*`。

## 注意事项

- **`duration` 走的是 JS 补间，不是原生 `scroll-behavior: smooth`**。原生平滑滚动不提供时长控制，组件改用 rAF 逐帧写 `scrollTop`，并显式传 `behavior: 'instant'`——容器若在 CSS 里写了 `scroll-behavior: smooth`，不这样写会叠两层动画互相打架。系统开启「减少动态效果」（`prefers-reduced-motion: reduce`）时直接跳转，`duration` 不生效：行内写入的滚动位置没法被 CSS 的 `transition-none` 取消，减弱动画必须在 JS 里分支。
- **`select-scroll-top` 与 `bound` 不叠加**。触发线阈值取的是 `selectScrollTop ? 0 : bound`，开启前者后 `bound` 完全不参与判定。想微调换选中的时机就只调 `bound`，两个一起改只会让人以为 `bound` 失灵。
- **容器滚到底时强制选中最后一项**。末尾区块不足一屏高时，它的顶部永远越不过触发线，按常规判定会停在倒数第二项。因此触底（`scrollTop >= maxScroll - 1`）时直接选中最后一个链接——这是有意为之，不是判定失灵。
- **没有 `v-model`，选中态只能从 `change` 事件读**。与 Element Plus 一致：选中项是由滚动位置算出来的结果，从外部写回去没有意义。需要在别处显示当前章节，就在 `change` 回调里把 `href` 存下来。
- **`click` 在滚动之前触发，`event.preventDefault()` 可以接管**。组件先外发 `click`，再检查 `defaultPrevented`：被拦下就既不滚动也不改选中态，跳转完全交给使用方（比如改成路由跳转）。未被拦下时组件会自行 `preventDefault()`，不让浏览器再做一次原生锚点跳转。
- **`container` 传选择器时在客户端挂载后才解析，查不到就什么都不监听**。SSR 阶段不查询 DOM；挂载后 `document.querySelector` 落空时组件不会回落到窗口——宁可不动，也好过监听错对象。点了链接没反应，先确认这个选择器、以及 `href` 指向的 `id` 是否真的存在于页面上。
- **`direction` 只改链接排布，滚动判定始终是纵向的**。`horizontal` 把链接横排、标记移到底部，算的仍是目标元素的垂直位置。子链接（`sub-link`）在横向锚点下不适用：嵌套层会把标记的横向测量基准打乱。横向下 `marker` 只认 `bar` 与 `none`，`dot` / `hollow` 会被收敛成 `bar`——不是传参失效，是圆点在贴底的横轨道上没有对应画法。
- **根元素带 `data-reborn-anchor` 标记**。组件自己管着滚动容器与偏移量，页面若另有全局的「同页 hash 链接跳转」逻辑（本文档站就有一个挂在 `document` 上的捕获阶段监听），必须靠这个属性把锚点内的链接放行。否则外层的 `stopPropagation()` 会让点击根本到不了组件，表现是点了链接页面整体跳走、目标容器纹丝不动。
- **仅 Web 端**。组件依赖 `getBoundingClientRect()` 同步测量与 `href="#id"` 锚点语义，小程序两者都没有，UniApp 端未提供对应实现；移动端的章节定位请用 `scroll-view` 的 `scroll-into-view` 自行实现。
