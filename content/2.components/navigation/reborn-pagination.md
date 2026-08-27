---
title: Pagination 分页
description: 用于大数据量列表分页切换的分页组件，支持布局组合、简洁模式与页码折叠。
category: 导航
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPaginationDemo.vue" config="RebornPaginationConfig" componentId="reborn-pagination" :componentFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]' :uniappFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]'}
::

## 简介

Pagination 是双端可用的分页组件：传入 `total` 与 `pageSize` 后自动计算总页数并渲染页码，`v-model` 绑定当前页码（默认 `1`）。`layout` 通过逗号分隔的 token（`prev` / `pager` / `next` / `jumper` / `total` / `sizes`）自由组合布局；`simple` 开启后忽略 `layout`，只保留「上一页 / 当前页-总页数 / 下一页」。页码过多时按 `pagerCount` 折叠并显示省略号，点击省略号可向对应方向跳页。

适用场景：

- 表格、列表数据量大需要按页浏览时。
- 需要自定义翻页控件布局（组合 `total` / `jumper` / `sizes`）时。
- 移动端或窄屏需要简洁的上一页/下一页翻页（`simple`）时。
- 只有一页时希望自动隐藏分页器（`hideOnSinglePage`）时。

不适用场景：

- 滚动触底加载更多，改用 `reborn-loadmore`。
- 内容按类别切换，改用 `reborn-tabs`。

## 用法

### 基础用法

通过 `total` 与 `pageSize` 自动计算总页数，`v-model` 绑定当前页码；页码实际变化时触发 `current-change`。

```vue
<script setup lang="ts">
import { ref } from "vue";

const page = ref(1);
</script>

<template>
  <RebornPagination
    v-model="page"
    :total="120"
    :page-size="10"
    @current-change="(p) => console.log('切换到第', p, '页')"
  />
</template>
```

### 简洁模式

`simple` 忽略 `layout`，只渲染上一页、当前页/总页数与下一页；`prevText` / `nextText` 可把箭头图标换成文字。

```vue
<template>
  <RebornPagination
    v-model="page"
    simple
    :total="120"
    prev-text="上一页"
    next-text="下一页"
  />
</template>
```

### 布局组合

`layout` 使用逗号分隔的 token 自由组合区块，未知 token 会被忽略；`sizes` 区块通过 `pageSizes` 提供每页条数选项，切换后触发 `size-change` 并自动钳制当前页。

```vue
<template>
  <RebornPagination
    v-model="page"
    v-model:page-size="pageSize"
    :total="200"
    :page-sizes="[10, 20, 50, 100]"
    layout="prev, pager, next, jumper, total, sizes"
    @size-change="(s) => console.log('每页', s, '条')"
  />
</template>
```

### 主题颜色

`color` 控制激活页码文字与悬停高亮，取值与按钮/徽章同一套语义色：`primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`。配合 `background` 时激活页码使用对应主题色浅底；`jumper` 与 `sizes` 的聚焦色也会跟随当前主题色。

```vue
<template>
  <RebornPagination
    v-model="page"
    :total="60"
    color="success"
    background
  />
</template>
```

### 页码折叠

`pagerCount` 控制页码按钮数量（必须是不小于 5 的奇数，非法值自动钳制到最近的奇数），总页数超出时自动折叠并显示省略号，点击省略号向对应方向跳 `pagerCount - 2` 页。

```vue
<template>
  <RebornPagination
    v-model="page"
    :total="200"
    :pager-count="9"
    background
  />
</template>
```

### 单页隐藏

`hideOnSinglePage` 在总页数不超过 1 时整组件不渲染，适合只有一页时希望不占位。

```vue
<template>
  <RebornPagination
    v-model="page"
    :total="5"
    hide-on-single-page
  />
</template>
```

### 插槽自定义

组件提供 `prev` / `next` / `pager-item` / `jumper` / `total` / `sizes` 六个作用域插槽，可完全接管默认内容（省略号不是 `pager-item`）。

```vue
<script setup lang="ts">
import { ref } from "vue";

const page = ref(1);

function goTo(p: number) {
  page.value = p;
}
</script>

<template>
  <RebornPagination
    v-model="page"
    :total="50"
    background
  >
    <template #pager-item="{ page: p, active, disabled }">
      <button
        type="button"
        :disabled="disabled"
        :class="active ? 'text-primary font-bold' : 'text-gray-5'"
        @click="goTo(p)"
      >
        {{ p }}
      </button>
    </template>
  </RebornPagination>
</template>
```

## API

### Props

| 参数                           | 说明                                                       | 类型                                                               | 默认值                |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ | --------------------- |
| `modelValue / v-model`         | 当前页码                                                   | `number`                                                           | `1`                   |
| `total`                        | 数据总数                                                   | `number`                                                           | `0`                   |
| `pageSize / v-model:page-size` | 每页条数                                                   | `number`                                                           | `10`                  |
| `pagerCount`                   | 页码按钮数量，需为不小于 5 的奇数，非法值自动钳制          | `number`                                                           | `7`                   |
| `layout`                       | 布局 token（逗号分隔）：prev/pager/next/jumper/total/sizes | `string`                                                           | `"prev, pager, next"` |
| `pageSizes`                    | 每页条数选项                                               | `number[]`                                                         | `[10, 20, 50, 100]`   |
| `size`                         | 尺寸规格                                                   | `sm / md / lg`                                                     | `md`                  |
| `color`                        | 主题色，控制激活页码与悬停高亮                             | `primary / secondary / success / info / warning / error / neutral` | `primary`             |
| `background`                   | 页码按钮是否显示背景                                       | `boolean`                                                          | `false`               |
| `disabled`                     | 是否禁用                                                   | `boolean`                                                          | `false`               |
| `hideOnSinglePage`             | 总页数不超过 1 时整组件隐藏                                | `boolean`                                                          | `false`               |
| `simple`                       | 简洁模式，忽略 layout                                      | `boolean`                                                          | `false`               |
| `prevText`                     | 上一页按钮文字（空则显示箭头图标）                         | `string`                                                           | `''`                  |
| `nextText`                     | 下一页按钮文字（空则显示箭头图标）                         | `string`                                                           | `''`                  |
| `ui`                           | 各部分 UI 深度定制                                         | `Partial<PaginationUI>`                                            | `{}`                  |
| `class`                        | 自定义类名                                                 | `string`                                                           | `-`                   |

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

`ui` 按内部结构键覆盖对应节点的类名，两端键位一致：

| 键名              | 平台 | 说明                                                                                                                                                                                       |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`            | 通用 | 根节点（Web 为 `<nav>`，UniApp 为 `<view>`）。默认 `reborn-pagination inline-flex items-center`，各区块之间的间距改这里（Web `gap-2` / UniApp `gap-[16rpx]`）；`class` prop 也并到该节点。 |
| `prev`            | 通用 | 上一页按钮。**仅在未填充 `prev` 插槽时渲染**，填充该插槽会替换掉按钮，`ui.prev` 随之失效；禁用态由内部 `disabled` 变体处理。                                                               |
| `next`            | 通用 | 下一页按钮。**仅在未填充 `next` 插槽时渲染**，填充该插槽会使其失效。                                                                                                                       |
| `pager`           | 通用 | 页码列表容器。**仅非简洁模式且 `layout` 含 `pager` 时渲染**，默认 `inline-flex items-center`（Web `gap-1` / UniApp `gap-[8rpx]`），页码之间的间距改这里。                                  |
| `pagerItem`       | 通用 | 单个页码。**仅在未填充 `pager-item` 插槽时渲染**，填充该插槽会替换掉页码按钮，`ui.pagerItem` 随之失效；尺寸、圆角、底色由内部变体给出，覆盖写这里。                                        |
| `pagerItemActive` | 通用 | **当前页**页码的追加类名——它不是独立节点，只在 `pagerItem` 处于激活态时并进去；选中底色、字重改这里。                                                                                      |
| `ellipsis`        | 通用 | 省略号 `•••`（点击向对应方向连跳）。**仅页码折叠时渲染**，默认 `inline-flex items-center justify-center text-gray-5`，Web 端另带 `cursor-pointer`。                                        |
| `jumper`          | 通用 | 跳转区容器。**仅 `layout` 含 `jumper` 时渲染**，默认 `inline-flex items-center text-gray-5`；「前往 / 页」两侧文案的间距改这里。填充 `jumper` 插槽只替换内部内容，容器仍生效。             |
| `input`           | 通用 | 跳转输入框（Web 为内部 `RebornInputNumber` 容器，UniApp 为内部 `RebornInput` 的 `custom-class`）。简洁模式下的当前页输入框也用这个键；输入框宽度改这里。**填充 `jumper` 插槽后布局模式下的这个输入框不再渲染。**                                |
| `simple`          | 通用 | 简洁模式的「当前页 / 总页数」容器。**仅 `simple` 为真时渲染**，默认 `inline-flex items-center text-gray-5`。                                                                               |
| `total`           | 通用 | 总数文本容器（默认「共 N 条」）。**仅 `layout` 含 `total` 时渲染**，默认 `text-gray-5`；文案由 `total` 插槽替换，容器类名仍生效。                                                          |
| `sizes`           | 通用 | 每页条数选择器的容器。**仅 `layout` 含 `sizes` 时渲染**，默认无类名；里面的 `RebornSelect` 固定 `w-[110px]`，要改宽度请填充 `sizes` 插槽自行渲染。                                         |

```vue
<template>
  <RebornPagination
    v-model="page"
    :total="200"
    layout="total,prev,pager,next,jumper"
    :ui="{
      root: 'gap-3',
      pagerItem: 'rounded-lg',
      pagerItemActive: 'bg-primary text-white',
      total: 'text-xs',
    }"
  />
</template>
```

## 注意事项

- `total` 为 `0` 时按 1 页显示且翻页按钮禁用，配合 `hideOnSinglePage` 可整组件隐藏。
- `pagerCount` 必须是不小于 5 的奇数，非法值（如偶数或过小）会被钳制到最近的奇数。
- `layout` 使用逗号分隔的 token，未知 token 会被忽略；`simple` 开启后 `layout` 不生效。
- `current-change` 仅在页码实际变化时触发；`size-change` 触发后先钳制当前页，若页码变化再补发 `current-change`。
- `jumper` 输入回车或失焦时会将页码钳制在 `[1, totalPages]`，非法输入回退到当前页。
