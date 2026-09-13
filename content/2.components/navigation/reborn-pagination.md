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
**两端 API 已对齐**：属性名、默认值、事件名、插槽名与作用域参数在 web 与 uniapp 端逐字一致（含 `class` 键名与 `v-model` / `v-model:page-size` 双向绑定），因此下方 Props / Events / Slots / ui 均为通用描述，无需分平台书写。两端仅在尺寸取值与内部依赖控件上有差异，见[视觉规格](#视觉规格)与[两端差异对照](#两端差异对照)。
::

Pagination 通过 `layout` 组合展示区块：翻页按钮、页码列表、跳转输入、总数文本、每页条数选择器可自由排列。页码超出 `pagerCount` 时自动折叠为省略号，省略号可点击向对应方向连跳。`simple` 简洁模式忽略 `layout`，只保留「上一页 + 当前页/总页数 + 下一页」。

适用场景：

- 列表、表格数据量较大需要分页加载。
- 需要让用户跳转到指定页或切换每页条数的后台管理页面。
- 移动端底部的轻量翻页（`simple` 简洁模式）。

不适用场景：

- 上拉加载更多、无限滚动的流式列表，分页器不适合此类交互。
- 层级路径导航，改用 `reborn-breadcrumb`。

## 用法

### 基础用法

`v-model` 绑定当前页，`total` 传数据总数，组件按 `page-size` 自行计算总页数。

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

### 布局组合

`layout` 为逗号分隔的 token，顺序即渲染顺序，未知 token 会被忽略。

```vue
<template>
  <!-- 完整形态：总数 + 每页条数 + 翻页 + 页码 + 跳转 -->
  <RebornPagination
    v-model="page"
    v-model:page-size="pageSize"
    :total="240"
    layout="total, sizes, prev, pager, next, jumper"
  />
</template>
```

| token    | 渲染内容                                       |
| -------- | ---------------------------------------------- |
| `prev`   | 上一页按钮（`prev-text` 为空时显示箭头图标）   |
| `pager`  | 页码列表（超出 `pager-count` 时折叠省略号）    |
| `next`   | 下一页按钮（`next-text` 为空时显示箭头图标）   |
| `jumper` | 「前往 __ 页」跳转输入区                       |
| `total`  | 「共 N 条」总数文本                            |
| `sizes`  | 每页条数选择器                                 |

### 简洁模式

`simple` 开启后 `layout` 不再生效，只渲染上一页、「当前页 / 总页数」文本与下一页，适合移动端。

```vue
<template>
  <RebornPagination v-model="page" :total="120" simple />
</template>
```

### 页码折叠

`pager-count` 指定页码按钮数量，不小于 3 的整数（奇偶均可），过小的值钳到 3。折叠后中间以省略号 `•••` 代替，点击省略号向该方向连跳。

```vue
<template>
  <!-- 3 即下限：只显示首页、当前页、末页 -->
  <RebornPagination v-model="page" :total="500" :pager-count="3" />
  <RebornPagination v-model="page" :total="500" :pager-count="7" />
</template>
```

::tip
`pager-count` 为偶数时，当前页在中间窗口里偏左一格——这是奇偶窗口不对称的必然结果，不是缺陷。
::

### 每页条数与受控

`page-size` 支持 `v-model:page-size` 双向绑定。切换条数会先钳制当前页，若页码因此变化再补发 `current-change`。

```vue
<script setup lang="ts">
const page = ref(1);
const pageSize = ref(10);

function onCurrentChange(p: number) {
  // 仅在页码实际变化时触发，不会因为重复赋同值而空跑
  fetchList(p, pageSize.value);
}
</script>

<template>
  <RebornPagination
    v-model="page"
    v-model:page-size="pageSize"
    :total="240"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next"
    @current-change="onCurrentChange"
    @size-change="size => fetchList(1, size)"
  />
</template>
```

### 按钮背景与尺寸

`background` 为页码按钮补底色（未激活 `bg-gray-2`，激活 `bg-primary/50`）；`size` 提供 `sm` / `md` / `lg` 三档。

```vue
<template>
  <RebornPagination v-model="page" :total="120" background size="sm" />
  <RebornPagination v-model="page" :total="120" background size="lg" />
</template>
```

### 插槽定制

翻页按钮、页码项、跳转区、总数、条数选择器均可用插槽接管。

```vue
<template>
  <RebornPagination v-model="page" :total="120" layout="prev, pager, next, total">
    <template #prev="{ disabled, prev }">
      <button :disabled="disabled" @click="prev">上一页</button>
    </template>

    <template #pager-item="{ page: p, active }">
      <span :class="active ? 'text-primary font-medium' : 'text-gray-5'">{{ p }}</span>
    </template>

    <template #total="{ total }"> 总计 {{ total }} 条记录 </template>
  </RebornPagination>
</template>
```

::warning
省略号不是 `pager-item`：折叠出现的 `•••` 走独立的 `ui.ellipsis` 节点，不会进入 `pager-item` 插槽。
::

## API

::tip
以下 Props / Events / Slots 两端通用。
::

### Props

| 参数                           | 说明                                                              | 类型                    | 默认值                |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------- | --------------------- |
| `modelValue / v-model`         | 当前页码                                                          | `number`                | `1`                   |
| `total`                        | 数据总数                                                          | `number`                | `0`                   |
| `pageSize / v-model:page-size` | 每页条数                                                          | `number`                | `10`                  |
| `pagerCount`                   | 页码按钮数量，不小于 3 的整数（奇偶均可），过小的值钳到 3         | `number`                | `3`                   |
| `layout`                       | 布局 token（逗号分隔）：prev/pager/next/jumper/total/sizes        | `string`                | `"prev, pager, next"` |
| `pageSizes`                    | 每页条数选项                                                      | `number[]`              | `[10, 20, 50, 100]`   |
| `size`                         | 尺寸规格                                                          | `sm / md / lg`          | `md`                  |
| `background`                   | 页码按钮是否显示背景。true 时非激活 bg-gray-2，激活 bg-primary/50 | `boolean`               | `false`               |
| `disabled`                     | 是否禁用                                                          | `boolean`               | `false`               |
| `hideOnSinglePage`             | 总页数不超过 1 时整组件隐藏                                       | `boolean`               | `false`               |
| `simple`                       | 简洁模式，忽略 layout，只渲染上一页 + 当前页/总页数文本 + 下一页  | `boolean`               | `false`               |
| `prevText`                     | 上一页按钮文字（空则显示箭头图标）                                | `string`                | `''`                  |
| `nextText`                     | 下一页按钮文字（空则显示箭头图标）                                | `string`                | `''`                  |
| `ui`                           | 各部分 UI 深度定制                                                | `Partial<PaginationUI>` | `{}`                  |
| `class`                        | 自定义类名（两端键名一致，均为 `class`）                          | `string`                | `-`                   |

### Events

| 事件名              | 说明                                                                | 回调参数         |
| ------------------- | ------------------------------------------------------------------- | ---------------- |
| `current-change`    | 当前页码实际变化时触发                                              | `(page: number)` |
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

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，**两端键位完全一致**，仅默认值的单位不同（Web 用 px 令牌 / UniApp 用 rpx）：

| 键名              | 说明                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`            | 根节点（Web 为 `<nav>`，UniApp 为 `<view>`）。默认 `reborn-pagination inline-flex items-center`，各区块之间的间距改这里（Web `gap-2` / UniApp `gap-[16rpx]`）；`class` prop 也并到该节点。Web 端另带 `flex-wrap`（窄容器自动折行），UniApp 端不换行。 |
| `prev`            | 上一页按钮。**仅在未填充 `prev` 插槽时渲染**，填充该插槽会替换掉按钮，`ui.prev` 随之失效；禁用态由内部 `disabled` 变体处理。                                                               |
| `next`            | 下一页按钮。**仅在未填充 `next` 插槽时渲染**，填充该插槽会使其失效。                                                                                                                       |
| `pager`           | 页码列表容器。**仅非简洁模式且 `layout` 含 `pager` 时渲染**，默认 `inline-flex items-center`（Web `gap-2` / UniApp `gap-[16rpx]`），页码之间的间距改这里。                                 |
| `pagerItem`       | 单个页码。**仅在未填充 `pager-item` 插槽时渲染**，填充该插槽会替换掉页码按钮，`ui.pagerItem` 随之失效；尺寸、圆角、底色由内部变体给出，覆盖写这里。                                        |
| `pagerItemActive` | **当前页**页码的追加类名——它不是独立节点，只在 `pagerItem` 处于激活态时并进去；选中底色、字重改这里。                                                                                      |
| `ellipsis`        | 省略号 `•••`（点击向对应方向连跳）。**仅页码折叠时渲染**，默认 `inline-flex items-center justify-center text-gray-5`，Web 端另带 `cursor-pointer select-none`。                             |
| `jumper`          | 跳转区容器。**仅 `layout` 含 `jumper` 时渲染**，默认 `inline-flex items-center text-gray-5`；「前往 / 页」两侧文案的间距改这里。填充 `jumper` 插槽只替换内部内容，容器仍生效。             |
| `input`           | 跳转输入框。**仅 `layout` 含 `jumper` 时渲染**；填充 `jumper` 插槽后这个输入框不再渲染。**两端落点不同**：Web 作用在 `RebornInputNumber` 的外层包裹 div（带 `disabled` 变体、按尺寸给出 `w-pagination-input-*` 宽度），UniApp 作用在 `RebornInput` 的 `custom-class`（无尺寸宽度变体，只有 `shrink-0`）。 |
| `simple`          | 简洁模式的「当前页 / 总页数」文本。**仅 `simple` 为真时渲染**，默认 `inline-flex items-center text-gray-5`。                                                                               |
| `total`           | 总数文本容器（默认「共 N 条」）。**仅 `layout` 含 `total` 时渲染**，默认 `text-gray-5`；文案由 `total` 插槽替换，容器类名仍生效。                                                          |
| `sizes`           | 每页条数选择器的容器。**仅 `layout` 含 `sizes` 时渲染**，默认无类名（Web 另带 `shrink-0`）。Web 端里面的 `RebornSelect` 固定 `w-[110px]`，UniApp 端不限宽、跟随 Select 自身默认；要改宽度请填充 `sizes` 插槽自行渲染。 |

## 视觉规格

按钮与省略号为方形控件（最小宽 = 高度，保证单数字页码为正方形）。Web 端尺寸走主题令牌（`app/assets/theme/typography.css`），UniApp 端直接写 rpx：

| 项目             | Web                                    | UniApp        | 是否等价      |
| ---------------- | -------------------------------------- | ------------- | ------------- |
| 控件高度 `sm`    | `24px`（`--height-pagination-sm`）     | `48rpx`       | 等价          |
| 控件高度 `md`    | `32px`（`--height-pagination-md`）     | `56rpx`       | 略小（≈28px） |
| 控件高度 `lg`    | `40px`（`--height-pagination-lg`）     | `64rpx`       | 略小（≈32px） |
| 页码最小宽       | 与高度同值（`--min-width-pagination-*`）| 与高度同值    | 等价          |
| 字号 `sm` / `md` | `text-sm`（12px）                      | `24rpx`       | 等价          |
| 字号 `lg`        | `text-base`（14px）                    | `28rpx`       | 等价          |
| 区块 / 页码间距  | `gap-2`（8px）                         | `gap-[16rpx]` | 等价          |
| 按钮内边距       | `px-1`（4px）                          | `px-[8rpx]`   | 等价          |
| 按钮圆角         | `rounded-md`                           | `rounded-md`  | 等价          |
| 跳转输入宽       | 控件高度 × 3（`--width-pagination-input-*`）| 未限宽   | **不等价**    |

::warning
`md` / `lg` 两档高度在 uniapp 端偏小一档（56rpx ≈ 28px、64rpx ≈ 32px，对应 Web 的 32px / 40px）。需要严格一致时请通过 `ui.pagerItem` / `ui.prev` / `ui.next` 显式指定高度。
::

## 两端差异对照

| 维度              | Web                                                                        | UniApp                                                              |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Props / 默认值    | 与 uniapp 端逐字一致                                                       | 与 web 端逐字一致                                                   |
| Events / Slots    | 与 uniapp 端一致（含作用域参数名）                                          | 与 web 端一致                                                       |
| 自定义类名 prop   | `class`                                                                    | `class`（**同名**，非 `custom-class`）                              |
| 根节点标签        | `<nav>`                                                                    | `<view>`                                                            |
| 换行行为          | `flex-wrap`，窄容器自动折行                                                | 不换行                                                              |
| 跳转输入内部控件  | `RebornInputNumber`（`hide-button`、`change-on-wheel`、内部按 `min`/`max` 钳制、`align="center"`、`variant="outlined"`），`@change` 提交 | `RebornInput`（`type="number"`），`@confirm` 与 `@blur` 提交        |
| 条数选择器宽度    | `RebornSelect` 固定 `w-[110px]`                                            | `RebornSelect` 不限宽                                               |
| 悬停反馈          | 未激活页码 `hover:text-primary`，按钮带 `cursor-pointer`                   | 无 hover 态（触屏无悬停），仅主色激活态                             |
| 禁用态            | `opacity-50 cursor-not-allowed pointer-events-none`                        | `opacity-50 pointer-events-none`（无 `cursor-*`）                   |
| 文本防压缩        | `jumper` / `total` / `simple` 带 `shrink-0 whitespace-nowrap`               | 无（rpx 布局下不需要）                                              |
| 尺寸来源          | CSS 主题令牌（`h-pagination-*` / `w-pagination-input-*`）                  | 硬编码 rpx 值                                                       |

## 注意事项

- `total` 为 `0` 时按 1 页显示且翻页按钮禁用，配合 `hideOnSinglePage` 可整组件隐藏。
- `pagerCount` 为不小于 3 的整数，奇偶均可，过小的值钳到 3；3 时只显示首页、当前页、末页，其余以省略号折叠，偶数时当前页在中间窗口里偏左一格。
- `layout` 使用逗号分隔的 token，未知 token 会被忽略；`simple` 开启后 `layout` 不生效。
- `current-change` 仅在页码实际变化时触发；`size-change` 触发后先钳制当前页，若页码变化再补发 `current-change`。
- `jumper` 输入回车或失焦时会将页码钳制在 `[1, totalPages]`，非法输入回退到当前页。
- 页码高亮刻意不做颜色过渡：折叠窗口切换时页码节点会瞬间重排，若高亮还在淡入淡出，旧激活项会在新位置上残留半程高亮，看起来像来回跳动。
