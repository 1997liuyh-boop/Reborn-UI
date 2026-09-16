---
title: Empty 空状态
description: 数据为空时的占位块：图片、标题与描述、操作区三段纵向居中，随组件附三张示例插画。
category: 数据展示
platform: both
tags: [css, tailwind, empty, placeholder, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornEmptyDemo.vue" config="RebornEmptyConfig" componentId="reborn-empty" :componentFiles='["RebornEmpty.vue", "reborn-empty.config.ts"]' :uniappFiles='["RebornEmpty.vue", "reborn-empty.config.ts"]'}
::

## 简介

列表、搜索、筛选、收藏夹这些区域拿不到数据时，用一块占位内容说明「为什么空」和「接下来能做什么」，而不是留一片白。两端同名同构，`image` / `image-size` / `title` / `description` 四个 props 与 `image` / `title` / `description` / `extra` 四个插槽逐一相同，只有根节点类名入口与图片标签按端分叉。

结构固定为三段纵向居中：**图片区**由 `image` / `image-size` 决定，**标题加描述**由 `title` / `description` 决定，**操作区**由 `extra` 插槽决定。三段互相独立、各自可缺省，段间距 24px（UniApp 48rpx），标题与描述之间 4px（UniApp 8rpx）。

不传 `image` 时用内置的 48×48 灰色空箱子，它以 base64 data URI 内联在配置文件里，组件被复制进别的工程也不用带资源。仓库另附三张示例插画（Web 在 `public/images/empty/`，UniApp 在 `src/static/empty/`），按需用 `image` 指过去。组件不派发事件，也不暴露实例方法。

### 何时使用

- 列表 / 表格 / 卡片流请求成功但返回 0 条——`title` 说明空的原因，`extra` 放「新建」。
- 搜索或筛选没有命中——`description` 写清当前条件，`extra` 放「重置筛选」，让用户能退回去。
- 尚未初始化的功能区（还没有收藏、还没有上传文件）——配大一点的插画加一个主操作，充当引导位。
- 需要整幅插画而非小图标——`image` 指向自带的 `empty-scene.svg`，或用 `image` 插槽塞任意节点。

### 何时不使用

- 请求失败、无权限、服务异常 —— 改用 `reborn-result`，它有 `error` / `403` / `500` 等状态与配套配色；Empty 只表达「查到了，但是没有」。
- 数据还在路上 —— 改用 `reborn-loading` 或骨架屏，先放 Empty 再切成有数据会闪一下。
- 页面内常驻的一行说明 —— 改用 `reborn-alert`，它是横向提示条，不占整块区域。
- 操作后的瞬时反馈（已删除、已清空）—— 改用 `reborn-toast`。

## 用法

### 内置插画与图片尺寸

不传 `image` 就用内置默认插画。`image-size` 只设**宽度**，高度按原图比例自适应：Web 端靠 `h-auto`，UniApp 端靠 `<image mode="widthFix">`，所以两端都不要给图片节点设高。数字在 Web 端按 px、UniApp 端按 rpx 处理；也可以传字符串，原样写进行内样式。

::code-group
```vue [Web]
<template>
  <!-- 默认 48px -->
  <RebornEmpty title="暂无数据" />

  <RebornEmpty :image-size="80" title="暂无数据" />
  <RebornEmpty image-size="8rem" title="暂无数据" />
</template>
```

```vue [UniApp]
<template>
  <!-- 默认 96rpx -->
  <RebornEmpty title="暂无数据" />

  <RebornEmpty :image-size="160" title="暂无数据" />
  <RebornEmpty image-size="80px" title="暂无数据" />
</template>
```
::

### 换一张插画

`image` 收任意图片地址：站内路径、CDN 链接或 data URI 都行。仓库附带三张示例插画，画幅差别很大，用之前先想好 `image-size`，不给的话宽度会停在默认的 48px（UniApp 96rpx）。

| 文件名 | 原始尺寸 | 建议 `image-size` | 适用位置 |
| --- | --- | --- | --- |
| `empty-box.svg` | 48×48 | 48（UniApp 96） | 表格内、卡片内的小块占位 |
| `empty-folder.svg` | 120×88 | 120（UniApp 240） | 列表区、抽屉、弹层里的中等占位 |
| `empty-scene.svg` | 320×253 | 240 起（UniApp 480 起） | 占满一屏的空页面 |

::code-group
```vue [Web]
<template>
  <RebornEmpty image="/images/empty/empty-folder.svg" :image-size="120" title="暂无文件" description="把文件拖进来，或者点下方按钮上传。" />
</template>
```

```vue [UniApp]
<template>
  <RebornEmpty image="/static/empty/empty-folder.svg" :image-size="240" title="暂无文件" description="把文件传上来，或者点下方按钮上传。" />
</template>
```
::

::warning
三张插画都是固定灰阶的 SVG，不随暗色模式变色。暗色背景下觉得偏亮，就换一张自己的图，或者用 `image` 插槽放图标字形——字形走 `currentColor`，会跟着色阶反转。
::

### 自定义图片与隐藏图片区

`image` 插槽接管整个图片区，此时 `image` 与 `image-size` 都不再生效，尺寸由插槽内容自己决定。`:image="null"` 则把整段去掉，连同它下面的 24px（UniApp 48rpx）间距一起消失；两者可以一起用，让插槽完全掌管这一段。

::code-group
```vue [Web]
<template>
  <RebornEmpty title="搜索无结果" description="换个关键词再试一次。">
    <template #image>
      <div class="flex size-18 items-center justify-center rounded-full bg-gray-2">
        <Icon name="lucide:search-x" class="size-8 shrink-0 text-gray-5" />
      </div>
    </template>
  </RebornEmpty>

  <!-- 整段不要图片 -->
  <RebornEmpty :image="null" title="暂无评论" description="成为第一个留言的人。" />
</template>
```

```vue [UniApp]
<template>
  <RebornEmpty title="搜索无结果" description="换个关键词再试一次。">
    <template #image>
      <view class="flex size-[144rpx] items-center justify-center rounded-full bg-gray-2">
        <view class="i-lucide-search-x size-[64rpx] shrink-0 text-gray-5" />
      </view>
    </template>
  </RebornEmpty>

  <RebornEmpty :image="null" title="暂无评论" description="成为第一个留言的人。" />
</template>
```
::

::tip
`withDefaults` 只在 prop 为 `undefined` 时填默认值，所以显式写 `:image="null"` 会原样传进组件；漏写 `image` 走的是默认空串，也就是内置插画，两者结果不同。
::

### 标题与描述

`title` 与 `description` **字号相同**，都是 14px / 行高 150%（UniApp 28rpx），区别只在字重与颜色：标题 500 字重配 `text-gray-10`，描述常规字重配 `text-gray-8`，两者之间 4px（UniApp 8rpx）。两个 prop 都只收纯文本，被插值进文本节点；要放链接、行内代码或多行排版，改用同名的 `title` / `description` 插槽，插槽存在时对应 prop 不再渲染。

```vue
<template>
  <RebornEmpty :image-size="80" title="没有匹配的订单">
    <template #description>
      当前筛选：<code>状态=已退款</code>
      <a href="#">清空全部筛选条件</a>
    </template>
  </RebornEmpty>
</template>
```

### 操作区

`extra` 插槽是第三段，内部 flex 横向排列、超宽自动换行、元素间距 12px（UniApp 24rpx），整体居中。组件本身不派发任何事件，所有交互由放进插槽的元素自己承担。

放两个按钮时按「次要动作在左、主要动作在右」排：左侧 `color="neutral" variant="outlined" size="md"`，右侧 `color="primary" variant="filled" size="md"`。这是排版约定不是组件行为，Empty 不会替你调整插槽内元素的样式。

::code-group
```vue [Web]
<template>
  <RebornEmpty :image-size="80" title="没有符合条件的结果" description="三个筛选条件同时生效，可能过滤得太紧了。">
    <template #extra>
      <RebornButton color="neutral" variant="outlined" size="md" @click="reset">重置筛选</RebornButton>
      <RebornButton color="primary" variant="filled" size="md" @click="create">新建记录</RebornButton>
    </template>
  </RebornEmpty>
</template>
```

```vue [UniApp]
<template>
  <RebornEmpty :image-size="160" title="没有符合条件的结果" description="三个筛选条件同时生效，可能过滤得太紧了。">
    <template #extra>
      <RebornButton color="neutral" variant="outlined" size="md" @tap="reset">重置筛选</RebornButton>
      <RebornButton color="primary" variant="filled" size="md" @tap="create">新建记录</RebornButton>
    </template>
  </RebornEmpty>
</template>
```
::

### 缺省段与间距

三段都带 `v-if`：图片区在 `image` 为 `null` 且无 `image` 插槽时不渲染，标题描述段在 `title` / `description` 与对应插槽全空时不渲染，操作区在没有 `extra` 插槽时不渲染。缺省的段连同它那一份段间距一起从 DOM 里消失，所以不会出现 48px 的双倍空隙。

```vue
<template>
  <!-- 只有图片：常见于表格行内，文字由外层自己排 -->
  <RebornEmpty :image-size="80" />

  <!-- 只有标题：整块高度就是一行文字 -->
  <RebornEmpty :image="null" title="没有更多内容了" />
</template>
```

::tip
不要靠 `title=" "` 之类的空白占位撑间距——空字符串会让整段跳过渲染，而空格会渲染成一行 21px 高的空标题。需要额外留白请用 `ui.root` 覆盖 `gap-*`。
::

## API

### Props

`image` / `image-size` / `title` / `description` / `ui` 两端一致，仅根节点类名入口与 `image-size` 的数字单位不同。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `image` | `string \| null` | `''` | 图片地址，可以是站内路径、URL 或 data URI。留空用内置的 48×48 灰色空箱子；传 `null` 时图片区整段不渲染（除非提供了 `image` 插槽）。 |
| `image-size` | `number \| string` | - | 图片宽度，高度按原图比例自适应。数字按 px 写进行内样式，字符串原样透传（如 `'6rem'`）。不传时用主题里的 `w-12`（48px）。提供 `image` 插槽时该属性不生效。 |
| `title` | `string` | `''` | 标题文本，渲染为 14px / 500 字重 / 行高 150% 的 `text-gray-10`。空字符串且无 `title` 插槽时整个标题节点不渲染。 |
| `description` | `string` | `''` | 描述文本，渲染为 14px / 常规字重 / 行高 150% 的 `text-gray-8`。空字符串且无 `description` 插槽时该节点不渲染。 |
| `class` | `any` | - | 追加到根元素的自定义类名。 |
| `ui` | `EmptyUI` | `{}` | 按语义化结构键覆盖各节点类名，键位见「自定义样式（ui）」。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `image` | `string \| null` | `''` | 图片地址，可以是 `/static` 路径、网络地址或 data URI。留空用内置的 48×48 灰色空箱子；传 `null` 时图片区整段不渲染（除非提供了 `image` 插槽）。 |
| `image-size` | `number \| string` | - | 图片宽度，高度按原图比例自适应（`mode="widthFix"`）。数字按 rpx 写进行内样式，字符串原样透传（如 `'80px'`）。不传时用主题里的 `w-[96rpx]`。提供 `image` 插槽时该属性不生效。 |
| `title` | `string` | `''` | 标题文本，渲染为 28rpx / 500 字重 / 行高 150% 的 `text-gray-8 dark:text-gray-1`。空字符串且无 `title` 插槽时整个标题节点不渲染。 |
| `description` | `string` | `''` | 描述文本，渲染为 28rpx / 常规字重 / 行高 150% 的 `text-gray-7 dark:text-gray-4`。空字符串且无 `description` 插槽时该节点不渲染。 |
| `custom-class` | `string` | `''` | 追加到根元素的自定义类名（避开小程序原生 `class`）。 |
| `ui` | `EmptyUI` | `{}` | 按语义化结构键覆盖各节点类名，键位见「自定义样式（ui）」。 |
:::

::

### Slots

四个插槽两端同名同义，均无作用域参数。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `image` | - | 图片区内容，存在时 `image` / `image-size` 都不再生效，尺寸由插槽内容自己决定。`image` 为 `null` 时该插槽是让图片区继续渲染的唯一途径。 |
| `title` | - | 标题内容，存在时 `title` prop 不再渲染。外层节点的 14px 字号、500 字重与 `text-gray-10` 仍然生效。 |
| `description` | - | 描述内容，存在时 `description` prop 不再渲染。外层节点的 14px 字号与 `text-gray-8` 仍然生效。 |
| `extra` | - | 第三段的内容，通常放按钮。不提供该插槽时第三段连同 24px 段间距一起不渲染。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，与 `class` / `custom-class` 一起走 `tailwind-merge`，冲突时后者覆盖前者。两端键位相同，只是默认类名的单位不同。

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器，默认 `flex w-full flex-col items-center gap-6 text-center`（UniApp `gap-[48rpx]`）。改段间距、改左对齐都在这里。 |
| `image` | 图片区外层容器，默认 `flex shrink-0 items-center justify-center`。它只负责居中，不限制尺寸。 |
| `imageGraphic` | 图片节点本身，默认 `h-auto w-12 max-w-full select-none`（UniApp `w-[96rpx] max-w-full`）。改默认宽度可以在这里，但单张覆盖用 `image-size` 更直接；**不要在这里设高**，会破坏按比例自适应。提供 `image` 插槽时该节点不渲染，此键随之失效。 |
| `content` | 标题与描述的包裹层，默认 `flex min-w-0 max-w-full flex-col items-center gap-1`（UniApp `gap-[8rpx]`）。标题与描述之间的 4px 在这里改。 |
| `title` | 标题节点，默认 `text-base font-medium leading-[1.5] text-gray-10`（UniApp `text-28 ... text-gray-8 dark:text-gray-1`）。 |
| `description` | 描述节点，默认 `text-base font-normal leading-[1.5] text-gray-8`（UniApp `text-28 ... text-gray-7 dark:text-gray-4`）。 |
| `extra` | 操作区，默认 `flex flex-wrap items-center justify-center gap-3`（UniApp `gap-[24rpx]`）。没有 `extra` 插槽时该节点不渲染，此键随之失效。 |

```vue
<template>
  <RebornEmpty
    title="暂无数据"
    description="换个条件再查。"
    :ui="{
      root: 'gap-4 items-start text-left',
      content: 'items-start',
    }"
  />
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 根节点 | `<div>` | `<view>`，开启 `virtualHost` / `addGlobalClass` / `styleIsolation: shared` |
| 自定义类名入口 | `class`（`any`） | `custom-class`（`string`，默认 `''`） |
| 图片标签 | `<img :src>`，`alt=""`（装饰性，语义由标题描述承担） | `<image :src mode="widthFix">` |
| 高度自适应方式 | `h-auto` | `mode="widthFix"` |
| `image-size` 数字单位 | px | rpx |
| 默认图片宽度 | 48px（`w-12`） | 96rpx（`w-[96rpx]`） |
| 示例插画目录 | `public/images/empty/` | `packages/uniapp-project/src/static/empty/` |
| 段间距 | 24px（`gap-6`） | 48rpx（`gap-[48rpx]`） |
| 标题与描述间距 | 4px（`gap-1`） | 8rpx（`gap-[8rpx]`） |
| 操作区元素间距 | 12px（`gap-3`） | 24rpx（`gap-[24rpx]`） |
| 标题 / 描述字号 | 都是 14px（`text-base`，本仓库把 `--text-base` 改写成 14px） | 都是 28rpx（`text-28`） |
| 文字颜色 | `text-gray-10` / `text-gray-8`，色阶随暗色模式反转，无需 `dark:` | `text-gray-8 dark:text-gray-1` / `text-gray-7 dark:text-gray-4`，色阶静态且止于 `gray-8` |

## 注意事项

- **标题和描述字号一样大**。两者都是 14px（UniApp 28rpx），只靠 500 字重与 `text-gray-10` / `text-gray-8` 的深浅拉开层次。这与 Result 不同，Result 的标题是 24px；Empty 常常嵌在卡片、表格、抽屉里，标题再大就压过了周围内容。
- **描述用的是 `text-base` 不是 `text-sm`**。本仓库在 `app/assets/theme/typography.css` 里把 `--text-sm` 改写成 12px、`--text-base` 改写成 14px，按 Tailwind 默认刻度的直觉写 `text-sm` 会小一号。
- **`image-size` 只管宽度**。高度由 Web 的 `h-auto` 与 UniApp 的 `mode="widthFix"` 按原图比例推出来，所以别在 `ui.imageGraphic` 里加 `h-*`；要裁剪或固定比例请改用 `image` 插槽自己放节点。
- **换大插画一定要同时给 `image-size`**。默认宽度是按内置的 48×48 定的，直接把 320×253 的 `empty-scene.svg` 填进 `image` 而不给尺寸，会得到一张缩到 48px 宽的小图。
- **内置插画与三张示例插画都是固定灰阶**，不随暗色模式变色。暗色下需要更柔和的观感，请换图或改用 `image` 插槽放图标字形。
- **`image` 传 `null` 与不传是两回事**。`withDefaults` 只在 prop 为 `undefined` 时填默认值，显式 `:image="null"` 会原样传入并整段去掉图片区；漏写 `image` 得到的是默认空串，也就是内置插画。
- **空段不进 DOM，间距不会翻倍**。三段各自带 `v-if`，某段无内容时连同它那份段间距一起消失，所以不必担心缺省时出现双倍空隙；反过来也意味着不能靠 `title=""` 占位来撑高度。
- **组件不派发任何事件，也不暴露实例方法**。`extra` 插槽里的交互由放进去的元素自己承担，别在 Empty 上找 `@click` / `@refresh`。
- **`title` / `description` 只收纯文本**。它们被插值进文本节点，写 HTML 不会被解析；要富文本改用同名插槽，插槽存在时对应 prop 不渲染。
- **描述属性叫 `description` 不是 `sub-title`**。与 Result 的命名不同，这里跟随 Empty 组件在各家库里的通用叫法；两个组件之间迁移时注意改名。
