---
title: Pagination 分页
description: 用于大数据量列表分页切换的分页组件，支持布局组合、简洁模式与页码折叠。
category: 导航
platform: both
badge: New
---

::ComponentViewer{demoFile="RebornPaginationDemo.vue" config="RebornPaginationConfig" componentId="reborn-pagination" :componentFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]' :uniappFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]'}
::

## 简介

::tip
**Props / Events / Slots 与 `ui` 键位两端对齐**：属性名、默认值、事件名、插槽名与作用域参数逐字一致（含 `class` 键名与 `v-model` / `v-model:page-size` 双向绑定），按通用描述书写。**`ui` 各键的默认类名未对齐**（px 令牌与 rpx 两套体系，Web 端另有换行、悬停与防压缩类名），「自定义样式（ui）」按 Web / UniApp 分开描述；其余差异见[视觉规格](#视觉规格)与[两端差异对照](#两端差异对照)。
::

Pagination 通过 `layout` 组合展示区块：翻页按钮、页码列表、跳转输入、总数文本、每页条数选择器按 token 顺序排列。页码超出 `pager-count` 时自动折叠为省略号，点击省略号向对应方向连跳。`simple` 简洁模式忽略 `layout`，只保留「上一页 + 当前页/总页数 + 下一页」。

适用场景：

- 列表、表格数据量较大需要分页加载。
- 需要让用户跳转到指定页或切换每页条数的后台管理页面。
- 移动端底部的轻量翻页（`simple` 简洁模式）。

不适用场景：

- 上拉加载更多、无限滚动的流式列表，分页器不适合此类交互。
- 层级路径导航，改用 `reborn-breadcrumb`。

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

### 按钮背景：background

`background` 为页码按钮补底色：未激活 `bg-gray-2 text-gray-5`，激活 `bg-primary/50 text-primary`，折叠出现的省略号同样带 `bg-gray-2`。`size` 提供 `sm` / `md` / `lg` 三档，可与 `background` 组合。

```vue
<template>
  <RebornPagination v-model="page" :total="120" background />
  <RebornPagination v-model="page" :total="120" background size="sm" />
</template>
```

### 简洁模式：simple 与翻页文字

`simple` 开启后 `layout` 不再生效，只渲染上一页、「当前页 / 总页数」文本与下一页。`prev-text` / `next-text` 为空时显示箭头图标，传入文字后改为文字按钮。

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
| `total`  | 「共 N 条」总数文本                          |
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

    <template #pager-item="{ page: p, active }">
      <span :class="active ? 'text-primary font-medium' : 'text-gray-5'" @click="page = p">{{ p }}</span>
    </template>

    <template #total="{ total }"> 总计 {{ total }} 条记录 </template>
  </RebornPagination>
</template>
```

::warning
接管 `pager-item` 后点击行为也由插槽负责：默认页码按钮上的点击跳页随按钮一起被替换，需要在插槽里自行给 `v-model` 赋值。折叠出现的 `•••` 不是 `pager-item`，走独立的 `ui.ellipsis` 节点，不会进入该插槽。
::

## API

::tip
以下 Props / Events / Slots 两端通用。
::

### Props

| 参数                           | 说明                                                                 | 类型                        | 默认值                |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------- | --------------------- |
| `modelValue / v-model`         | 当前页码，超出 `[1, 总页数]` 时会被钳制并回写                        | `number`                    | `1`                   |
| `total`                        | 数据总数                                                             | `number`                    | `0`                   |
| `pageSize / v-model:page-size` | 每页条数                                                             | `number`                    | `10`                  |
| `pagerCount`                   | 页码按钮数量，不小于 3 的整数（奇偶均可），过小的值钳到 3            | `number`                    | `3`                   |
| `layout`                       | 布局 token（逗号分隔）：prev/pager/next/jumper/total/sizes           | `string`                    | `"prev, pager, next"` |
| `pageSizes`                    | 每页条数选项                                                         | `number[]`                  | `[10, 20, 50, 100]`   |
| `size`                         | 尺寸规格                                                             | `'sm' \| 'md' \| 'lg'`      | `md`                  |
| `background`                   | 页码按钮是否显示背景。true 时非激活 bg-gray-2，激活 bg-primary/50    | `boolean`                   | `false`               |
| `disabled`                     | 是否禁用                                                             | `boolean`                   | `false`               |
| `hideOnSinglePage`             | 总页数不超过 1 时整组件隐藏                                          | `boolean`                   | `false`               |
| `simple`                       | 简洁模式，忽略 layout，只渲染上一页 + 当前页/总页数文本 + 下一页     | `boolean`                   | `false`               |
| `prevText`                     | 上一页按钮文字（空则显示箭头图标）                                   | `string`                    | `''`                  |
| `nextText`                     | 下一页按钮文字（空则显示箭头图标）                                   | `string`                    | `''`                  |
| `ui`                           | 细粒度样式覆盖，键位见「自定义样式（ui）」。                         | `Partial<PaginationUI>`     | `{}`                  |
| `class`                        | 自定义类名，并入根节点（两端键名一致，均为 `class`）                 | `string`                    | `-`                   |

### Events

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
| `pager-item` | 页码项（省略号不是 pager-item） | `{ page, active, disabled }`      |
| `jumper`     | 跳转输入区                      | `{ current, totalPages, jump }`   |
| `total`      | 总数文本                        | `{ total }`                       |
| `sizes`      | 每页条数选择器                  | `{ pageSize, pageSizes, change }` |

### Exposes

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
| `prev`            | 上一页 `<button>`                     | `button` 槽：`reborn-pagination-button px-1 inline-flex items-center justify-center rounded-md cursor-pointer select-none`，外加尺寸类 `h-pagination-* min-w-pagination-*` 与 `text-sm`（`lg` 为 `text-base`） | 简洁模式或 `layout` 含 `prev` 时渲染；填充 `prev` 插槽后按钮被替换，该键失效。首页或禁用时追加 `opacity-50 cursor-not-allowed pointer-events-none` |
| `next`            | 下一页 `<button>`                     | 同 `prev`                                                                                                                        | 简洁模式或 `layout` 含 `next` 时渲染；填充 `next` 插槽后失效。末页或禁用时追加禁用类名                     |
| `pager`           | 页码列表 `<div>`                      | `reborn-pagination-pager inline-flex items-center gap-2`                                                                         | 非简洁模式且 `layout` 含 `pager` 时渲染；填充 `pager-item` 插槽不影响该容器                                |
| `pagerItem`       | 单个页码 `<button>`                   | `button` 槽默认类名；未激活追加 `text-gray-5`（无背景时再加 `hover:text-primary`，有背景时为 `bg-gray-2 text-gray-5`），激活追加 `font-medium text-primary`（有背景时为 `bg-primary/50 text-primary`） | 同 `pager`；填充 `pager-item` 插槽后失效。禁用或总页数为 1 时追加禁用类名                                  |
| `pagerItemActive` | 当前页的页码 `<button>`               | 无（不是独立节点）                                                                                                               | 只在页码处于激活态时追加到 `pagerItem` 之后；填充 `pager-item` 插槽后失效                                  |
| `ellipsis`        | 省略号 `<span>`（`•••`）              | `reborn-pagination-ellipsis inline-flex items-center justify-center select-none text-gray-5`，外加与按钮相同的尺寸类；有背景时加 `bg-gray-2` | 仅页码折叠时渲染；禁用时追加 `opacity-50 cursor-not-allowed pointer-events-none`                           |
| `jumper`          | 跳转区 `<div>`                        | `reborn-pagination-jumper inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5`，外加 `text-sm`（`lg` 为 `text-base`） | 非简洁模式且 `layout` 含 `jumper` 时渲染；填充 `jumper` 插槽只替换内部内容，容器仍生效                     |
| `input`           | 包裹 `RebornInputNumber` 的 `<div>`   | `shrink-0 w-pagination-input-*`（宽度按 `size` 取值）                                                                            | 同 `jumper`；填充 `jumper` 插槽后输入框不再渲染，该键失效                                                  |
| `total`           | 总数 `<span>`                         | `reborn-pagination-total shrink-0 whitespace-nowrap text-gray-5`，外加 `text-sm`（`lg` 为 `text-base`）                          | 非简洁模式且 `layout` 含 `total` 时渲染；填充 `total` 插槽只替换文案，容器仍生效                           |
| `sizes`           | 条数选择器外层 `<div>`                | `reborn-pagination-sizes shrink-0`                                                                                               | 非简洁模式且 `layout` 含 `sizes` 时渲染；内部 `RebornSelect` 固定 `w-[110px]`，改宽度需填充 `sizes` 插槽   |
| `simple`          | 「当前页 / 总页数」`<span>`           | `reborn-pagination-simple inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5`，外加 `text-sm`（`lg` 为 `text-base`） | 仅 `simple` 为真时渲染                                                                                     |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名              | 节点                                  | 默认类名                                                                                                                         | 渲染 / 失效条件                                                                                            |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `root`            | 根 `<view>`                           | `reborn-pagination inline-flex items-center gap-[16rpx]`（不换行）                                                               | 始终渲染；`class` prop 也并到该节点。区块间距改这里                                                        |
| `prev`            | 上一页 `<view>`                       | `button` 槽：`reborn-pagination-button px-[8rpx] inline-flex items-center justify-center rounded-md`，外加尺寸类（`sm` `h-[48rpx] min-w-[48rpx] text-[24rpx]`、`md` `h-[56rpx] min-w-[56rpx] text-[24rpx]`、`lg` `h-[64rpx] min-w-[64rpx] text-[28rpx]`） | 简洁模式或 `layout` 含 `prev` 时渲染；填充 `prev` 插槽后失效。首页或禁用时追加 `opacity-50 pointer-events-none` |
| `next`            | 下一页 `<view>`                       | 同 `prev`                                                                                                                        | 简洁模式或 `layout` 含 `next` 时渲染；填充 `next` 插槽后失效。末页或禁用时追加禁用类名                     |
| `pager`           | 页码列表 `<view>`                     | `reborn-pagination-pager inline-flex items-center gap-[16rpx]`                                                                   | 非简洁模式且 `layout` 含 `pager` 时渲染                                                                    |
| `pagerItem`       | 单个页码 `<view>`                     | `button` 槽默认类名；未激活追加 `text-gray-5`（有背景时为 `bg-gray-2 text-gray-5`），激活追加 `font-medium text-primary`（有背景时为 `bg-primary/50 text-primary`）；无悬停态 | 同 `pager`；填充 `pager-item` 插槽后失效。禁用或总页数为 1 时追加禁用类名                                  |
| `pagerItemActive` | 当前页的页码 `<view>`                 | 无（不是独立节点）                                                                                                               | 只在页码处于激活态时追加到 `pagerItem` 之后；填充 `pager-item` 插槽后失效                                  |
| `ellipsis`        | 省略号 `<view>`（`•••`）              | `reborn-pagination-ellipsis inline-flex items-center justify-center text-gray-5`，外加与按钮相同的尺寸类；有背景时加 `bg-gray-2` | 仅页码折叠时渲染；禁用时追加 `opacity-50 pointer-events-none`                                              |
| `jumper`          | 跳转区 `<view>`                       | `reborn-pagination-jumper inline-flex items-center gap-[16rpx] text-gray-5`，外加 `text-[24rpx]`（`lg` 为 `text-[28rpx]`）       | 非简洁模式且 `layout` 含 `jumper` 时渲染；填充 `jumper` 插槽只替换内部内容，容器仍生效                     |
| `input`           | `RebornInput` 的 `custom-class`       | `shrink-0`（无按尺寸的宽度类）                                                                                                   | 同 `jumper`；填充 `jumper` 插槽后输入框不再渲染，该键失效                                                  |
| `total`           | 总数 `<view>`                         | `reborn-pagination-total text-gray-5`，外加 `text-[24rpx]`（`lg` 为 `text-[28rpx]`）                                             | 非简洁模式且 `layout` 含 `total` 时渲染；填充 `total` 插槽只替换文案，容器仍生效                           |
| `sizes`           | 条数选择器外层 `<view>`               | `reborn-pagination-sizes`                                                                                                        | 非简洁模式且 `layout` 含 `sizes` 时渲染；内部 `RebornSelect` 不限宽，改宽度需填充 `sizes` 插槽             |
| `simple`          | 「当前页 / 总页数」`<text>`           | `reborn-pagination-simple inline-flex items-center gap-[16rpx] text-gray-5`，外加 `text-[24rpx]`（`lg` 为 `text-[28rpx]`）       | 仅 `simple` 为真时渲染                                                                                     |

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

按钮与省略号为方形控件（最小宽 = 高度，保证单数字页码为正方形）。Web 端尺寸走主题令牌（`app/assets/theme/typography.css`），UniApp 端直接写 rpx：

| 项目             | Web                                         | UniApp        | 是否等价      |
| ---------------- | ------------------------------------------- | ------------- | ------------- |
| 控件高度 `sm`    | `24px`（`--height-pagination-sm`）          | `48rpx`       | 等价          |
| 控件高度 `md`    | `32px`（`--height-pagination-md`）          | `56rpx`       | 略小（≈28px） |
| 控件高度 `lg`    | `40px`（`--height-pagination-lg`）          | `64rpx`       | 略小（≈32px） |
| 页码最小宽       | 与高度同值（`--min-width-pagination-*`）    | 与高度同值    | 等价          |
| 字号 `sm` / `md` | `text-sm`（12px）                           | `24rpx`       | 等价          |
| 字号 `lg`        | `text-base`（14px）                         | `28rpx`       | 等价          |
| 区块 / 页码间距  | `gap-2`（8px）                              | `gap-[16rpx]` | 等价          |
| 按钮内边距       | `px-1`（4px）                               | `px-[8rpx]`   | 等价          |
| 按钮圆角         | `rounded-md`                                | `rounded-md`  | 等价          |
| 跳转输入宽       | 控件高度 × 3（`--width-pagination-input-*`）| 未限宽        | **不等价**    |

::warning
`md` / `lg` 两档高度在 uniapp 端偏小一档（56rpx ≈ 28px、64rpx ≈ 32px，对应 Web 的 32px / 40px）。需要严格一致时请通过 `ui.pagerItem` / `ui.prev` / `ui.next` 显式指定高度。
::

## 两端差异对照

| 维度              | Web                                                                                                                  | UniApp                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 根节点标签        | `<nav aria-label="分页导航">`，按钮为原生 `<button>`                                                                 | `<view>`，按钮为 `<view>`                                                              |
| 换行行为          | `flex-wrap`，窄容器自动折行                                                                                          | 不换行                                                                                 |
| 跳转输入内部控件  | `RebornInputNumber`（`hide-button`、`change-on-wheel`、`align="center"`、`variant="outlined"`，按 `min=1` / `max=总页数` 钳制），`@change` 提交，空值不跳转 | `RebornInput`（`type="number"`），`@confirm` 与 `@blur` 提交；非数字或小于 1 时清空不跳转，大于总页数时跳到末页 |
| `ui.input` 落点   | 包裹输入框的 `<div>`，带按尺寸的 `w-pagination-input-*` 宽度                                                         | `RebornInput` 的 `custom-class`，只有 `shrink-0`                                       |
| 条数选择器宽度    | `RebornSelect` 固定 `w-[110px]`                                                                                      | `RebornSelect` 不限宽                                                                  |
| 悬停反馈          | 无背景时未激活页码 `hover:text-primary`，按钮带 `cursor-pointer`                                                     | 无 hover 态（触屏无悬停），仅主色激活态                                                |
| 禁用态            | `opacity-50 cursor-not-allowed pointer-events-none`，按钮同时带原生 `disabled`                                        | `opacity-50 pointer-events-none`（无 `cursor-*`）                                      |
| 文本防压缩        | `jumper` / `total` / `simple` / `sizes` 带 `shrink-0`，前三者另带 `whitespace-nowrap`                                | 无                                                                                     |
| 尺寸来源          | CSS 主题令牌（`h-pagination-*` / `w-pagination-input-*`）                                                            | 硬编码 rpx 值                                                                          |

## 注意事项

- `total` 为 `0` 时按 1 页显示且翻页按钮禁用，配合 `hideOnSinglePage` 可整组件隐藏。
- `pagerCount` 为不小于 3 的整数，奇偶均可，过小的值钳到 3；3 时只显示首页、当前页、末页，其余以省略号折叠，偶数时当前页在中间窗口里偏左一格。
- `layout` 使用逗号分隔的 token，未知 token 会被忽略；`simple` 开启后 `layout` 不生效。
- `current-change` 仅在页码实际变化时触发；外部把 `v-model` 设为越界值、或 `page-size` 变化导致当前页越界时，组件会钳制并回写，同时触发 `current-change`；只改 `total` 不会回写 `v-model`，界面按钳制后的页码显示。
- 跳转输入提交后会清空输入框，目标页始终落在 `[1, 总页数]` 内；两端对非法输入的处理见[两端差异对照](#两端差异对照)。
- 页码高亮刻意不做颜色过渡：折叠窗口切换时页码节点会瞬间重排，若高亮还在淡入淡出，旧激活项会在新位置上残留半程高亮，看起来像来回跳动。
