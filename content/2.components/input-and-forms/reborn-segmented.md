---
title: Segmented 分段控制器
description: 一组互斥选项排成一条、选中块滑动切换的分段控制器，三档尺寸，可带图标、撑满宽度或竖排，参与表单校验。
category: 表单与输入
platform: web
tags: [segmented, radio, tabs, form]
badge: New
---

::warning
仅 Web 端组件，UniApp 端暂无对应实现。UniApp 端的分段切换请使用 `reborn-radio` 的 `type="button"`。
::

::ComponentViewer{demoFile="RebornSegmentedDemo.vue" config="RebornSegmentedConfig" componentId="reborn-segmented" :componentFiles='["RebornSegmented.vue", "reborn-segmented.config.ts"]'}
::

## 简介

Segmented 把一组互斥选项排成一条：灰色底槽里有一块白色选中块，点击或用方向键切换时选中块滑到新的选项上。每个选项是隐藏的原生 radio，键盘导航、表单 `name` 都是原生行为；API 与 Element Plus 的 `el-segmented` 对齐，仅 Web 端实现。

数据驱动方式是 `options` + `v-model`：`options` 可以是字符串 / 数字 / 布尔的简写（自身同时作为文案与值），也可以是 `{ value, label, disabled, icon }` 对象，字段名不同时用 `props` 映射；`v-model` 按全等比较选中哪一项。默认插槽可以整体替换每一项的内容。

其余 API 分三组：外观由 `size`（sm / md / lg 三档）、`direction`（横排 / 竖排）、`block`（撑满宽度）控制；状态由 `disabled`（整组）与选项的 `disabled` 字段（单项）控制；表单与无障碍由 `validateEvent`、`name`、`id`、`ariaLabel` 控制。切换后派发 `change`。

### 何时使用

- 列表 / 看板 / 日历这类视图切换 —— 对象选项带 `icon`，`size="lg"`。
- 图表的统计周期（日 / 周 / 月）这类 2~5 个短选项的筛选 —— `options` 直接传字符串数组。
- 表单里的少量互斥选项、希望一眼看到全部取值 —— 放进 `RebornFormItem`，选中即触发校验。
- 卡片、面板顶部撑满一行的切换 —— 开 `block`，各选项等分宽度。

### 何时不使用

- 切换的是整块内容面板、需要标签页语义 —— 改用 `reborn-tabs`。
- 选项多于 5~6 个或文案较长 —— 改用 `reborn-select`，一排放不下时分段控制器会被挤出容器。
- 需要语义色（成功 / 警告）或实底选中态的分段按钮 —— 改用 `reborn-radio` 的 `type="button"` + `color` / `variant`。

## 用法

### 基础用法

`options` 传字符串数组时，每一项同时作为文案与值；`v-model` 绑定选中值，切换后派发 `change`。

```vue
<script setup lang="ts">
const value = ref("周");
</script>

<template>
  <RebornSegmented v-model="value" :options="['日', '周', '月', '季度', '年']" aria-label="统计周期" />
</template>
```

| 按键 | 行为 |
| --- | --- |
| `Tab` | 聚焦到当前选中项（没有选中项时聚焦第一个可用项） |
| `←` `→` / `↑` `↓` | 在同组内移动并选中，跳过禁用项，到头后从另一端继续 |

### 尺寸

`size` 三档，容器内边距与圆角跟着收放；选中块的圆角 = 容器圆角 − 内边距，始终与容器边缘同心。处于 `RebornForm` 内时被表单的尺寸覆盖，都没有时为 `md`。

| `size` | 选项高度 | 字号 | 选项水平内边距 | 容器内边距 / 圆角 | 选中块圆角 | 典型用途 |
| --- | --- | --- | --- | --- | --- | --- |
| `sm` | 20px | 14px | 8px | 2px / 4px | 2px | 表格工具栏、卡片角落 |
| `md`（默认） | 28px | 14px | 12px | 3px / 6px | 4px | 表单、筛选栏 |
| `lg` | 36px | 16px | 12px | 4px / 8px | 6px | 页面级视图切换 |

```vue
<template>
  <RebornSegmented v-model="value" :options="options" size="lg" />
</template>
```

### 图标

对象选项的 `icon` 字段接受 Iconify 图标名，显示在文字前面，间隔 4px；图标尺寸为 `1em`，随 `size` 的字号缩放。

```vue
<script setup lang="ts">
const options = [
  { label: "列表", value: "list", icon: "lucide:list" },
  { label: "看板", value: "board", icon: "lucide:kanban" },
  { label: "日历", value: "calendar", icon: "lucide:calendar" },
];
</script>

<template>
  <RebornSegmented v-model="view" :options="options" size="lg" />
</template>
```

### 禁用

`disabled` 禁用整组；单个选项用对象里的 `disabled` 字段禁用，点击无效，方向键导航跳过它。禁用项文字为 `gray-5`，选中项被禁用时选中块保留，只有文字变灰。

```vue
<template>
  <RebornSegmented v-model="value" :options="[{ label: '日', value: '日' }, { label: '月', value: '月', disabled: true }]" />
  <RebornSegmented v-model="value" :options="options" disabled />
</template>
```

### 撑满宽度

`block` 让组件撑满父元素宽度：横排时各选项等分宽度，文案过长时截断。

```vue
<template>
  <RebornSegmented v-model="value" :options="options" block />
</template>
```

### 竖向排列

`direction="vertical"` 竖排，选中块沿纵向滑动。宽度默认取最宽的选项，配合 `block` 撑满容器宽度。

| `direction` | 排列 | `block` 的效果 |
| --- | --- | --- |
| `'horizontal'`（默认） | 横排 | 撑满父元素宽度，各选项等分 |
| `'vertical'` | 竖排 | 撑满父元素宽度，选项高度不变 |

```vue
<template>
  <RebornSegmented v-model="value" :options="options" direction="vertical" />
</template>
```

### 自定义选项

默认插槽替换每一项的内容（图标与文字都不再渲染），作用域里有 `item`（原始选项数据，简写选项就是那个字符串）、`checked`、`disabled`。内容超过选项高度时用 `ui.item` 改高度，选中块按选项实际尺寸落位。

```vue
<template>
  <RebornSegmented v-model="plan" :options="plans" size="lg" :ui="{ item: 'h-auto py-2' }">
    <template #default="{ item, checked }">
      <span class="flex flex-col items-center leading-tight">
        <span>{{ item.label }}</span>
        <span class="text-sm" :class="checked ? 'text-primary' : 'text-gray-5'">{{ item.price }}</span>
      </span>
    </template>
  </RebornSegmented>
</template>
```

### 字段映射与值类型

后端字段不叫 `value` / `label` / `disabled` 时用 `props` 映射，只覆盖传入的键；值可以是字符串、数字或布尔，`v-model` 按全等（`===`）比较，`'1'` 与 `1` 不是同一项。

```vue
<template>
  <RebornSegmented
    v-model="level"
    :options="[{ id: 1, name: '低' }, { id: 2, name: '中' }, { id: 3, name: '高', locked: true }]"
    :props="{ value: 'id', label: 'name', disabled: 'locked' }"
  />
</template>
```

### 定制配色

`ui` 按结构键追加类名，与默认类名合并、同类冲突时以 `ui` 为准：`slider` 改选中块，`item` 改选项，`root` 改底槽。`item` 作用于每一个选项，只改选中项时加 `data-[checked=true]:` 前缀，只改禁用项时加 `data-[disabled=true]:` 前缀。

| 想要的效果 | 写法 |
| --- | --- |
| 主题色实底选中 | `{ slider: 'bg-primary', item: 'data-[checked=true]:text-white' }` |
| 浅色主题底 + 主题色文字 | `{ slider: 'bg-brand-1', item: 'data-[checked=true]:text-primary' }` |
| 胶囊描边 | `{ root: 'rounded-full border border-gray-3 bg-transparent', slider: 'rounded-full bg-brand-1', item: 'rounded-full' }` |
| 选中块带阴影 | `{ slider: 'shadow-sm' }` |

```vue
<template>
  <RebornSegmented
    v-model="view"
    :options="options"
    :ui="{ slider: 'bg-primary', item: 'data-[checked=true]:text-white' }"
  />
</template>
```

::tip
选中块就位前（服务端渲染、首帧）由选中项自己画底色，`ui.slider` 会同时挂到选中项上，覆盖了选中块颜色时首屏不会先闪一下默认的白底。
::

## API

### Props

| 属性名                 | 类型                                                    | 默认值                                                     | 描述                                                                                         |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `modelValue` / v-model | `string \| number \| boolean`                           | -                                                          | 选中值，按全等比较；未绑定时组件内部维护。                                                   |
| `options`              | `Array<string \| number \| boolean \| SegmentedOption>` | `[]`                                                       | 选项数据；简写项自身同时作为文案与值，对象项含 `value` / `label` / `disabled` / `icon`。     |
| `props`                | `{ value?: string, label?: string, disabled?: string }` | `{ value: 'value', label: 'label', disabled: 'disabled' }` | 对象选项的字段映射，只覆盖传入的键；`icon` 固定读 `icon` 字段。                              |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                  | -                                                          | 尺寸，选项高度 20 / 28 / 36px；处于表单内时被表单尺寸覆盖，都没有时为 `md`。                 |
| `block`                | `boolean`                                               | `false`                                                    | 是否撑满父元素宽度；横排时各选项等分宽度。                                                   |
| `disabled`             | `boolean`                                               | `false`                                                    | 是否禁用全部选项；处于禁用的表单内时同样禁用。                                               |
| `validateEvent`        | `boolean`                                               | `true`                                                     | 选中值变化时是否触发所在表单项的 `change` 校验。                                             |
| `name`                 | `string`                                                | -                                                          | 原生 radio 的 `name`；不传时自动生成唯一值，方向键只在同名 radio 之间移动。                  |
| `id`                   | `string`                                                | -                                                          | 根容器的原生 `id`。                                                                          |
| `ariaLabel`            | `string`                                                | -                                                          | 根容器（`role="radiogroup"`）的 `aria-label`，读屏软件据此念出这组选项的用途。               |
| `direction`            | `'horizontal' \| 'vertical'`                            | `'horizontal'`                                             | 排列方向，选中块沿同一方向滑动。                                                             |
| `class`                | `any`                                                   | -                                                          | 追加到根容器的类名。                                                                         |
| `ui`                   | `SegmentedUI`                                           | `{}`                                                       | 按结构键覆盖各节点样式，键位见「自定义样式（ui）」。                                         |

### Emits

| 事件名              | 回调参数                                | 描述                                                       |
| ------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `update:modelValue` | `(value: string \| number \| boolean)`  | 选中值变化（由 `defineModel` 生成）。                      |
| `change`            | `(value: string \| number \| boolean)`  | 选中值变化时触发，参数为新的选中值；点击已选中项不触发。   |

### Slots

| 插槽名    | 作用域参数                                                                           | 描述                                                   |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `default` | `{ item: string \| number \| boolean \| SegmentedOption, checked: boolean, disabled: boolean }` | 替换每一项的内容，`item` 是原始选项数据。     |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名：

| 键名     | 说明                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`   | 容器，默认 `inline-flex bg-gray-2 text-gray-8`，内边距、圆角、字号随 `size`；`class` 也合并到这里。                                                     |
| `slider` | 选中块，默认 `bg-gray-1`，圆角随 `size`。位置与尺寸由脚本写成行内样式，不要在这里改 `left` / `width`；没有选中项时隐藏。就位前同时挂在选中项上作兜底。 |
| `item`   | 单个选项，高度与水平内边距随 `size`，图标与文字间隔 `gap-1`；选中时 `text-gray-10`，禁用时 `text-gray-5`。键盘聚焦的描边也画在这里。作用于所有选项，只改选中项用 `data-[checked=true]:` 前缀。 |
| `icon`   | 选项图标，默认 `size-[1em]`。**仅在对象选项带 `icon` 且未使用默认插槽时渲染**。                                                                          |
| `label`  | 选项文本，默认 `truncate`。**用了默认插槽后不渲染**，`ui.label` 随之失效。                                                                               |

```vue
<template>
  <RebornSegmented
    v-model="value"
    :options="options"
    :ui="{ root: 'bg-gray-3', slider: 'shadow-sm', item: 'px-4' }"
  />
</template>
```

## 注意事项

- **按全等比较选中值**。`v-model` 与选项值用 `===` 比较，数字 `1` 与字符串 `'1'` 不会互相选中；`v-model` 的值不在选项里时选中块隐藏，没有任何一项被选中。
- **点击已选中项不派发 `change`**。只有值真的变了才更新 `v-model`、派发 `change` 并触发表单校验。
- **选中块滑动、文字不加粗**。切换时选中块沿排列方向滑过去（与 `reborn-radio` 分段按钮、`reborn-tabs` 胶囊底板同一套液体形变）；选中项只变色不加粗，宽度不会跳动。系统开启「减少动态效果」时直接落位。
- **服务端渲染时由选中项自己画底色**。选中块要挂载后量出选中项的位置才显示，首屏由选中项自带 `bg-gray-1` 兜底，就位后同一帧交接，不会闪一下空白。
- **`name` 决定键盘导航的范围**。方向键在同名 radio 之间移动；页面上两组分段控制器手动传了相同的 `name`，方向键会跨组移动、表单提交也会混在一起。
- **没有 `color` 属性**。默认选中态是白底（`bg-gray-1`）+ `gray-10` 文字；需要主题色时用 `ui.slider` + `ui.item` 的 `data-[checked=true]:` 前缀覆盖（见「定制配色」），或改用 `reborn-radio` 的分段按钮。
- **放进纵向 flex 容器会被拉宽**。根节点是 `inline-flex`，作为 `flex-col` 的子项时会被默认的 `align-items: stretch` 拉到容器宽度，底槽变长、选项仍靠左；给容器加 `items-start`，或者干脆开 `block` 让选项等分。
- **选项不会换行**。横排时一排放不下会撑出父元素，文案只有在 `block` 等分宽度时才会截断；选项多时改用 `reborn-select`。
