---
title: Pagination 分页
description: 用于大数据量列表分页切换的分页组件，支持布局组合、简洁模式与页码折叠。
category: 导航
platform: both
tags: [vue, reborn-pagination, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornPaginationDemo.vue" config="RebornPaginationConfig" componentId="reborn-pagination" :componentFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]' :uniappFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]'}
::

## 简介

Pagination 是 Web 与 UniApp 均可用的页码导航组件，通过 `total`、`pageSize` 与当前页组织数据分页。

`layout` 按顺序组合翻页按钮、页码、跳转输入、总数与每页条数选择器；超出 `pagerCount` 时折叠为省略号，点击省略号可向对应方向连跳。Web 端另可通过 `color` 设置激活页码的语义色。

`simple` 忽略 `layout`，仅保留上一页、当前页 / 总页数及下一页；Web 端当前页可输入，UniApp 端显示文本。两端主要 props、事件、插槽和 ui 键位对齐，默认样式、px / rpx 尺寸与类名入口的差异见下方对照。

### 何时使用

- 服务端列表需要页码切换——用 `total` / `pageSize` 计算页数。
- 列表工具栏需要组合分页区块——用 `layout` 指定顺序。
- 移动窄屏只保留前后翻页——开启 `simple`。

### 何时不使用

- 内容是章节导航而非数据分页——改用 `reborn-anchor`。
- 页面之间是固定主导航——改用 `reborn-tabs`。

## 用法

### 基础用法

`v-model` 绑定当前页，`total` 传数据总数，组件按 `page-size` 自行计算总页数；页码实际变化时触发 `current-change`。

::code-group

```vue [Web]
<script setup lang="ts">
const page = ref(1);
</script>

<template>
  <RebornPagination v-model="page" :total="120" :page-size="10" />
</template>
```

```vue [UniApp]
<script setup lang="ts">
const page = ref(1)
</script>

<template>
  <RebornPagination v-model="page" :total="120" :page-size="10" />
</template>
```

::

### 按钮背景与语义色：background 与 color

`background` 为页码按钮补底色，未激活为 `bg-gray-2 text-gray-5`，省略号同样带 `bg-gray-2`。Web 端 `color` 默认 `primary`，支持 `primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`，控制激活页码和无背景可用按钮的悬停文字色。UniApp 暂不支持 `color`，激活页码保持 `bg-primary/50 text-primary`。`size` 提供 `sm` / `md` / `lg` 三档，可与 `background` 组合。

| Web 激活状态 | 样式 | 典型用途 |
| --- | --- | --- |
| `background=false` | `text-{color}`，无底色 | 列表底部的文字分页 |
| `background=true`，六种彩色 | 与按钮 `soft` 一致：`bg-{color}/10 text-{color}`，可用时悬停底色为 20% | 需要突出当前页的分页 |
| `background=true`，`color="neutral"` | `bg-gray-2 text-gray-10`，可用时悬停为 `bg-gray-5/20` | 灰阶界面的分页 |

Web 端 `simple=false` 且 `background=false` 时，未激活页码和可点击翻页按钮使用 `text-gray-9`，禁用按钮与页码使用 `text-gray-5`，不再叠加透明度；可点击省略号同样使用 `text-gray-9`。

```vue
<template>
  <RebornPagination v-model="page" :total="120" background />
  <RebornPagination v-model="page" :total="120" background color="success" />
  <RebornPagination v-model="page" :total="120" color="error" />
</template>
```

### 简洁模式：simple 与翻页文字

`simple` 开启后 `layout` 不再生效。Web 端依次显示上一页按钮、当前页输入框、`/`、总页数、下一页按钮，各项间距为 8px；输入框固定宽 40px，使用 `variant="outlined"`、`size="sm"`，回车或失焦时提交页码，清空后恢复当前页。UniApp 端中间仍显示「当前页 / 总页数」文本。`prev-text` / `next-text` 为空时显示箭头图标，传入文字后改为文字按钮。

```vue
<template>
  <RebornPagination v-model="page" :total="80" simple />
  <RebornPagination v-model="page" :total="80" simple prev-text="上一页" next-text="下一页" />
</template>
```

### 布局组合：layout 与每页条数

`layout` 为逗号分隔的 token，顺序即渲染顺序，未知 token 会被忽略。含 `sizes` 时配合 `v-model:page-size` 双向绑定每页条数；切换条数会先触发 `size-change`，再钳制当前页，若页码因此变化再补发 `current-change`。

```vue
<script setup lang="ts">
const page = ref(1);
const pageSize = ref(10);

function onCurrentChange(p: number) {
  // 仅在页码实际变化时触发，重复赋同值不会触发
  fetchList(p, pageSize.value);
}
</script>

<template>
  <RebornPagination
    v-model="page"
    v-model:page-size="pageSize"
    :total="200"
    :page-sizes="[5, 10, 20, 50]"
    layout="prev, pager, next, jumper, total, sizes"
    @current-change="onCurrentChange"
    @size-change="size => fetchList(page, size)"
  />
</template>
```

| token    | 渲染内容                                     |
| -------- | -------------------------------------------- |
| `prev`   | 上一页按钮（`prev-text` 为空时显示箭头图标） |
| `pager`  | 页码列表（超出 `pager-count` 时折叠省略号）  |
| `next`   | 下一页按钮（`next-text` 为空时显示箭头图标） |
| `jumper` | 「前往 __ 页」跳转输入区                     |
| `total` | 「共 N 条」总数文本                          |
| `sizes`  | 每页条数选择器，选项文案为「N 条/页」        |

### 页码折叠：pager-count

`pager-count` 指定页码按钮数量，取不小于 3 的整数（奇偶均可），过小的值钳到 3。总页数超过该值时，首页与末页常驻，中间以省略号 `•••` 折叠；点击省略号向该方向跳 `pager-count - 2` 页。

```vue
<template>
  <!-- 3 即下限：只显示首页、当前页、末页 -->
  <RebornPagination v-model="page" :total="200" :pager-count="3" />
  <RebornPagination v-model="page" :total="200" :pager-count="9" background />
</template>
```

::tip
`pager-count` 为偶数时，当前页在中间窗口里偏左一格：中间窗口的格数为偶数，左右无法均分。
::

### 单页隐藏：hide-on-single-page

`hide-on-single-page` 为真时，总页数不超过 1 页（含 `total` 为 `0`）整个组件不渲染；数据量增长到多页后重新出现。

```vue
<template>
  <RebornPagination v-model="page" :total="total" hide-on-single-page />
</template>
```

### 插槽定制：接管翻页、页码与附加区

`prev` / `next` / `pager-item` / `jumper` / `total` / `sizes` 六个插槽均可接管默认内容，作用域参数提供翻页与跳转所需的状态和方法。

```vue
<template>
  <RebornPagination v-model="page" :total="120" layout="prev, pager, next, total">
    <template #prev="{ disabled, prev }">
      <button :disabled="disabled" @click="prev">上一页</button>
    </template>

    <template #pager-item="{ page: p, active, disabled, select }">
      <button :disabled="disabled" :class="active ? 'text-primary font-medium' : 'text-gray-5'" @click="select">{{ p }}</button>
    </template>

    <template #total="{ total }"> 总计 {{ total }} 条记录 </template>
  </RebornPagination>
</template>
```

::warning
接管 `pager-item` 后，在自定义控件上调用 `select()` 选择该页，并绑定 `disabled` 保留禁用状态。`select()` 会检查禁用状态、同步模型并派发 `current-change`。折叠出现的 `•••` 不是 `pager-item`，走独立的 `ui.ellipsis` 节点，不会进入该插槽。
::

## API
::tip
除自定义类名（Web 用 `class`、UniApp 用 `customClass`）与仅 Web 支持的 `color` 外，以下 Props / Events / Slots 两端通用。
::

### Props

| 参数                           | 说明                                                                 | 类型                        | 默认值                |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------- | --------------------- |
| `modelValue` | 当前页码，超出 `[1, 总页数]` 时会被钳制并回写                        | `number`                    | `1`                   |
| `total` | 数据总数                                                             | `number`                    | `0`                   |
| `pageSize` | 每页条数                                                             | `number`                    | `10`                  |
| `pagerCount` | 页码按钮数量，不小于 3 的整数（奇偶均可），过小的值钳到 3            | `number`                    | `3`                   |
| `layout` | 布局 token（逗号分隔）：prev/pager/next/jumper/total/sizes           | `string`                    | `"prev, pager, next"` |
| `pageSizes` | 每页条数选项                                                         | `number[]`                  | `[10, 20, 50, 100]`   |
| `size` | 尺寸规格                                                             | `'sm' \| 'md' \| 'lg'`      | `md`                  |
| `color` | **仅 Web**：激活页码的语义色，有背景时参考按钮 soft 配色 | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `primary` |
| `background` | 页码按钮是否显示背景，Web 激活项采用对应 color 的 soft 配色，UniApp 为 bg-primary/50 | `boolean` | `false` |
| `disabled` | 是否禁用                                                             | `boolean`                   | `false`               |
| `hideOnSinglePage` | 总页数不超过 1 时整组件隐藏                                          | `boolean`                   | `false`               |
| `simple` | 简洁模式，忽略 layout，显示上一页、当前页/总页数、下一页；Web 当前页可输入 | `boolean`                   | `false`               |
| `prevText` | 上一页按钮文字（空则显示箭头图标）                                   | `string`                    | `''`                  |
| `nextText` | 下一页按钮文字（空则显示箭头图标）                                   | `string`                    | `''`                  |
| `ui` | 细粒度样式覆盖，键位见「自定义样式（ui）」。                         | `Partial<PaginationUI>`     | `{}`                  |
| `class` | **仅 Web**：自定义类名，并入根节点（UniApp 使用 `customClass`）         | `string`                    | `-`                   |
| `customClass` | **仅 UniApp**：追加到根节点的类名（Web 使用 `class`） | `any` | `undefined` |

### Emits

| 事件名              | 说明                                                                | 回调参数         |
| ------------------- | ------------------------------------------------------------------- | ---------------- |
| `current-change`    | 当前页码实际变化时触发（含越界值被钳制的情况）                      | `(page: number)` |
| `size-change`       | 每页条数变化时触发，随后钳制当前页，若页码变化再补发 current-change | `(size: number)` |
| `update:modelValue` | 当前页码双向绑定更新                                                | `(page: number)` |
| `update:pageSize`   | 每页条数双向绑定更新                                                | `(size: number)` |

### Slots

| 插槽名       | 说明                            | 作用域参数                        |
| ------------ | ------------------------------- | --------------------------------- |
| `prev`       | 上一页按钮                      | `{ disabled, prev }`              |
| `next`       | 下一页按钮                      | `{ disabled, next }`              |
| `pager-item` | 页码项（省略号不是 pager-item）；`select()` 选择该页 | `{ page, active, disabled, select: () => void }` |
| `jumper`     | 跳转输入区                      | `{ current, totalPages, jump }`   |
| `total` | 总数文本                        | `{ total }`                       |
| `sizes`      | 每页条数选择器                  | `{ pageSize, pageSizes, change }` |

### Expose

| 方法名 | 说明                               | 参数 |
| ------ | ---------------------------------- | ---- |
| `prev` | 翻到上一页，禁用或已在首页时不生效 | —    |
| `next` | 翻到下一页，禁用或已在末页时不生效 | —    |

### 自定义样式（ui）

`ui` 按 `PaginationUI` 的 12 个键覆盖对应节点的类名，两端键位一致。`prev` / `next` / `pagerItem` 三个键没有各自的样式槽：它们都渲染配置里的 `button` 槽（尺寸、圆角、激活与禁用状态都在这里），传入的类名追加在其后；`button` 本身不是 `ui` 键，无法直接覆盖。整个组件在 `hide-on-single-page` 为真且总页数不超过 1 时不渲染，下列节点随之全部失效。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名              | 节点                                  | 默认类名                                                                                                                         | 渲染 / 失效条件                                                                                            |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `root`            | 根 `<nav aria-label="分页导航">`      | `reborn-pagination inline-flex flex-wrap items-center gap-2`                                                                     | 始终渲染；`class` prop 也并到该节点。区块间距改这里                                                        |
| `prev`            | 上一页 `<button>`                     | `button` 槽：`reborn-pagination-button px-1 inline-flex items-center justify-center rounded-md cursor-pointer select-none`，外加尺寸类 `h-6 min-w-6` / `h-8 min-w-8` / `h-10 min-w-10` 与 `text-sm`（`lg` 为 `text-base`） | 简洁模式或 `layout` 含 `prev` 时渲染；填充 `prev` 插槽后按钮被替换，该键失效。普通无背景模式可点击时 `text-gray-9`，首页或禁用时 `text-gray-5 opacity-100 cursor-not-allowed`；其余模式禁用时为 `opacity-50 cursor-not-allowed` |
| `next`            | 下一页 `<button>`                     | 同 `prev`                                                                                                                        | 简洁模式或 `layout` 含 `next` 时渲染；填充 `next` 插槽后失效。末页或禁用时追加禁用类名                     |
| `pager`           | 页码列表 `<div>`                      | `reborn-pagination-pager inline-flex items-center gap-2`                                                                         | 非简洁模式且 `layout` 含 `pager` 时渲染；填充 `pager-item` 插槽不影响该容器                                |
| `pagerItem`       | 单个页码 `<button>`                   | `button` 槽默认类名；无背景未激活为 `text-gray-9`，可用时悬停文字跟随 `color`；有背景未激活为 `bg-gray-2 text-gray-5`。激活为 `font-medium text-{color}`，有背景时采用同色按钮的 `soft` 配色（neutral 为 `bg-gray-2 text-gray-10`） | 同 `pager`；填充 `pager-item` 插槽后失效。禁用或总页数为 1 时，无背景为 `text-gray-5 opacity-100 cursor-not-allowed`，有背景追加 `opacity-50 cursor-not-allowed` |
| `pagerItemActive` | 当前页的页码 `<button>`               | 无（不是独立节点）                                                                                                               | 只在页码处于激活态时追加到 `pagerItem` 之后；填充 `pager-item` 插槽后失效                                  |
| `ellipsis`        | 省略号 `<span>`（`•••`）              | `reborn-pagination-ellipsis inline-flex items-center justify-center select-none`，外加与按钮相同的尺寸类；无背景可点击时 `text-gray-9`，有背景时 `bg-gray-2 text-gray-5` | 仅页码折叠时渲染；无背景禁用时为 `text-gray-5 opacity-100 cursor-not-allowed`，有背景禁用时追加 `opacity-50 cursor-not-allowed` |
| `jumper`          | 跳转区 `<div>`                        | `reborn-pagination-jumper inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5`，外加 `text-sm`（`lg` 为 `text-base`） | 非简洁模式且 `layout` 含 `jumper` 时渲染；填充 `jumper` 插槽只替换内部内容，容器仍生效                     |
| `input`           | 包裹 `RebornInputNumber` 的 `<div>`   | `shrink-0`；简洁模式固定 `w-10`，普通跳转区按 `size` 追加 `w-18` / `w-24` / `w-30` | 简洁模式或默认 `jumper` 输入框渲染时生效；填充 `jumper` 插槽仅替换普通跳转区 |
| `total` | 总数 `<span>`                         | `reborn-pagination-total shrink-0 whitespace-nowrap text-gray-5`，外加 `text-sm`（`lg` 为 `text-base`）                          | 非简洁模式且 `layout` 含 `total` 时渲染；填充 `total` 插槽只替换文案，容器仍生效                           |
| `sizes`           | 条数选择器外层 `<div>`                | `reborn-pagination-sizes shrink-0`                                                                                               | 非简洁模式且 `layout` 含 `sizes` 时渲染；内部 `RebornSelect` 固定 `w-[110px]`，改宽度需填充 `sizes` 插槽   |
| `simple` | 包含当前页输入框、`/` 和总页数的 `<div>` | `reborn-pagination-simple inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5`，外加 `text-sm`（`lg` 为 `text-base`）；内部输入框固定 `size="sm" variant="outlined"` | 仅 `simple` 为真时渲染 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名              | 节点                                  | 默认类名                                                                                                                         | 渲染 / 失效条件                                                                                            |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `root`            | 根 `<view>`                           | `reborn-pagination inline-flex items-center gap-[16rpx]`（不换行）                                                               | 始终渲染；`customClass` 也并到该节点。区块间距改这里                                                        |
| `prev`            | 上一页 `<view>`                       | `button` 槽：`reborn-pagination-button px-[8rpx] inline-flex items-center justify-center rounded-md`，外加尺寸类（`sm` `h-[48rpx] min-w-[48rpx] text-[24rpx]`、`md` `h-[56rpx] min-w-[56rpx] text-[24rpx]`、`lg` `h-[64rpx] min-w-[64rpx] text-[28rpx]`） | 简洁模式或 `layout` 含 `prev` 时渲染；填充 `prev` 插槽后失效。首页或禁用时追加 `opacity-50 pointer-events-none` |
| `next`            | 下一页 `<view>`                       | 同 `prev`                                                                                                                        | 简洁模式或 `layout` 含 `next` 时渲染；填充 `next` 插槽后失效。末页或禁用时追加禁用类名                     |
| `pager`           | 页码列表 `<view>`                     | `reborn-pagination-pager inline-flex items-center gap-[16rpx]`                                                                   | 非简洁模式且 `layout` 含 `pager` 时渲染                                                                    |
| `pagerItem`       | 单个页码 `<view>`                     | `button` 槽默认类名；未激活追加 `text-gray-5`（有背景时为 `bg-gray-2 text-gray-5`），激活追加 `font-medium text-primary`（有背景时为 `bg-primary/50 text-primary`）；无悬停态 | 同 `pager`；填充 `pager-item` 插槽后失效。禁用或总页数为 1 时追加禁用类名                                  |
| `pagerItemActive` | 当前页的页码 `<view>`                 | 无（不是独立节点）                                                                                                               | 只在页码处于激活态时追加到 `pagerItem` 之后；填充 `pager-item` 插槽后失效                                  |
| `ellipsis`        | 省略号 `<view>`（`•••`）              | `reborn-pagination-ellipsis inline-flex items-center justify-center text-gray-5`，外加与按钮相同的尺寸类；有背景时加 `bg-gray-2` | 仅页码折叠时渲染；禁用时追加 `opacity-50 pointer-events-none`                                              |
| `jumper`          | 跳转区 `<view>`                       | `reborn-pagination-jumper inline-flex items-center gap-[16rpx] text-gray-5`，外加 `text-[24rpx]`（`lg` 为 `text-[28rpx]`）       | 非简洁模式且 `layout` 含 `jumper` 时渲染；填充 `jumper` 插槽只替换内部内容，容器仍生效                     |
| `input`           | `RebornInput` 的 `custom-class`       | `shrink-0`（无按尺寸的宽度类）                                                                                                   | 同 `jumper`；填充 `jumper` 插槽后输入框不再渲染，该键失效                                                  |
| `total` | 总数 `<view>`                         | `reborn-pagination-total text-gray-5`，外加 `text-[24rpx]`（`lg` 为 `text-[28rpx]`）                                             | 非简洁模式且 `layout` 含 `total` 时渲染；填充 `total` 插槽只替换文案，容器仍生效                           |
| `sizes`           | 条数选择器外层 `<view>`               | `reborn-pagination-sizes`                                                                                                        | 非简洁模式且 `layout` 含 `sizes` 时渲染；内部 `RebornSelect` 不限宽，改宽度需填充 `sizes` 插槽             |
| `simple` | 「当前页 / 总页数」`<text>`           | `reborn-pagination-simple inline-flex items-center gap-[16rpx] text-gray-5`，外加 `text-[24rpx]`（`lg` 为 `text-[28rpx]`）       | 仅 `simple` 为真时渲染                                                                                     |

:::

::

```vue
<template>
  <RebornPagination
    v-model="page"
    :total="200"
    layout="total, prev, pager, next, jumper"
    :ui="{
      root: 'gap-3',
      prev: 'rounded-full',
      next: 'rounded-full',
      pagerItem: 'rounded-full',
      pagerItemActive: 'bg-primary text-white',
      ellipsis: 'text-gray-4',
      total: 'text-gray-7',
    }"
  />
</template>
```

## 视觉规格

按钮与省略号为方形控件（最小宽 = 高度，保证单数字页码为正方形）。Web 端尺寸使用 Tailwind 原生刻度，随 `--spacing` 缩放；下表 px 值为默认根字号 16px 时的参考值，字号仍取 `app/assets/theme/typography.css` 的固定 px 令牌。UniApp 端直接写 rpx：

| 项目             | Web                                         | UniApp        | 是否等价      |
| ---------------- | ------------------------------------------- | ------------- | ------------- |
| 控件高度 `sm`    | `h-6`（24px）                              | `48rpx`       | 等价          |
| 控件高度 `md`    | `h-8`（32px）                              | `56rpx`       | 略小（≈28px） |
| 控件高度 `lg`    | `h-10`（40px）                             | `64rpx`       | 略小（≈32px） |
| 页码最小宽       | 与高度同值（`min-w-6` / `min-w-8` / `min-w-10`） | 与高度同值 | 等价          |
| 字号 `sm` / `md` | `text-sm`（12px）                           | `24rpx`       | 等价          |
| 字号 `lg`        | `text-base`（14px）                         | `28rpx`       | 等价          |
| 区块 / 页码间距  | `gap-2`（8px）                              | `gap-[16rpx]` | 等价          |
| 按钮内边距       | `px-1`（4px）                               | `px-[8rpx]`   | 等价          |
| 按钮圆角         | `rounded-md`                                | `rounded-md`  | 等价          |
| 跳转输入宽       | `w-18` / `w-24` / `w-30`（72 / 96 / 120px），为控件高度 × 3 | 未限宽 | **不等价** |

::warning
`md` / `lg` 两档高度在 uniapp 端偏小一档（56rpx ≈ 28px、64rpx ≈ 32px，对应 Web 的 32px / 40px）。需要严格一致时请通过 `ui.pagerItem` / `ui.prev` / `ui.next` 显式指定高度。
::

## 两端差异对照

::tip
**主要 Props / Emits / Slots 与 `ui` 键位两端对齐**：除仅 Web 支持的 `color`、自定义类名 Web 用 `class` 而 UniApp 用 `customClass` 外，属性名、默认值、事件名、插槽名与作用域参数逐字一致，并支持 `v-model` / `v-model:page-size` 双向绑定。**`ui` 各键的默认类名未对齐**（px 令牌与 rpx 两套体系，Web 端另有换行、悬停与防压缩类名），「自定义样式（ui）」按 Web / UniApp 分开描述；其余差异见[视觉规格](#视觉规格)与[两端差异对照](#两端差异对照)。
::

| 维度              | Web                                                                                                                  | UniApp                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 自定义根类名 | `class` | `customClass` |
| 激活语义色 | `color` 支持七种语义色；有背景时采用按钮 `soft` 配色 | 暂不支持 `color`，保持主色 |
| 根节点标签        | `<nav aria-label="分页导航">`，按钮为原生 `<button>`                                                                 | `<view>`，按钮为 `<view>`                                                              |
| 换行行为          | `flex-wrap`，窄容器自动折行                                                                                          | 不换行                                                                                 |
| 简洁模式当前页    | 40px 宽的 `RebornInputNumber`，`size="sm" variant="outlined"`，回车或失焦提交，清空恢复当前页 | 「当前页 / 总页数」文本 |
| 跳转输入内部控件  | `RebornInputNumber`（`hide-button`、`change-on-wheel`、`align="center"`、`variant="outlined"`，按 `min=1` / `max=总页数` 钳制），`@change` 提交，空值不跳转 | `RebornInput`（`type="number"`），`@confirm` 与 `@blur` 提交；非数字或小于 1 时清空不跳转，大于总页数时跳到末页 |
| `ui.input` 落点   | 包裹输入框的 `<div>`，普通跳转区按尺寸带 `w-18` / `w-24` / `w-30`，简洁模式固定 `w-10` | `RebornInput` 的 `custom-class`，只有 `shrink-0` |
| 条数选择器宽度    | `RebornSelect` 固定 `w-[110px]`                                                                                      | `RebornSelect` 不限宽                                                                  |
| 悬停反馈          | 无背景可用按钮的悬停文字色跟随 `color`，有背景激活页码使用按钮 `soft` 的悬停底色，按钮带 `cursor-pointer` | 无 hover 态（触屏无悬停），仅主色激活态 |
| 禁用态            | 普通无背景模式为 `text-gray-5 opacity-100 cursor-not-allowed`，其余模式为 `opacity-50 cursor-not-allowed`；按钮由原生 `disabled` 拦下点击 | `opacity-50 pointer-events-none`（无 `cursor-*`） |
| 文本防压缩        | `jumper` / `total` / `simple` / `sizes` 带 `shrink-0`，前三者另带 `whitespace-nowrap`                                | 无                                                                                     |
| 尺寸来源          | Tailwind 原生尺寸刻度（高度 `h-6` / `h-8` / `h-10`，输入宽 `w-18` / `w-24` / `w-30`）                              | 硬编码 rpx 值                                                                          |

## 注意事项

- **空数据默认仍显示一页**。`total` 为 `0` 时按 1 页显示且翻页按钮禁用，配合 `hideOnSinglePage` 可整组件隐藏。
- **页码数量有最小限制**。`pagerCount` 为不小于 3 的整数，奇偶均可，过小的值钳到 3；3 时只显示首页、当前页、末页，其余以省略号折叠，偶数时当前页在中间窗口里偏左一格。
- **简洁模式会忽略布局配置**。`layout` 使用逗号分隔的 token，未知 token 会被忽略；`simple` 开启后 `layout` 不生效。
- **越界回写可能触发页码事件**。`current-change` 仅在页码实际变化时触发；外部把 `v-model` 设为越界值、`page-size` 变化或 `total` 变小导致当前页越界时，组件会钳制并回写，同时触发 `current-change`。`total` 变为 `0` 时不钳制（多半处在加载期），界面按第 1 页显示，`v-model` 保持原值。
- **Web 端未声明的属性透传到根 `<nav>`**。`id`、`style`、`data-*` 与原生事件监听器（如 `@click`）都落在根节点上；`class` 是声明的 prop，同样并到根节点。
- **跳转值会被限制在有效页内**。普通 `jumper` 输入提交后会清空输入框，Web 简洁模式输入框保留当前页，目标页始终落在 `[1, 总页数]` 内；两端对非法输入的处理见[两端差异对照](#两端差异对照)。
- **高亮不使用颜色过渡**。页码高亮刻意不做颜色过渡：折叠窗口切换时页码节点会瞬间重排，若高亮还在淡入淡出，旧激活项会在新位置上残留半程高亮，看起来像来回跳动。
