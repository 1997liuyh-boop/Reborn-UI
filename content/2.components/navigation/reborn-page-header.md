---
title: PageHeader 页头
description: 页面顶部的返回区 + 标题 + 内容 + 操作栏，可在上方叠面包屑；路径较浅时代替面包屑提供返回入口。
category: 导航
platform: web
tags: [page-header, header, navigation, breadcrumb]
badge: New
---

::warning
仅 Web 端组件，UniApp 端暂无对应实现，页面顶部请使用 `pages.json` 配置的原生导航栏。
::

::ComponentViewer{demoFile="RebornPageHeaderDemo.vue" config="RebornPageHeaderConfig" componentId="reborn-page-header" :componentFiles='["RebornPageHeader.vue", "reborn-page-header.config.ts"]'}
::

## 简介

PageHeader 是页面顶部的标题栏：左侧是可点击的返回区（图标 + 标题），之后用竖线隔开一段内容，右侧放操作按钮。页面路径比较简单时，用它提供「返回」入口比面包屑更直接；API 与 Element Plus 的 `el-page-header` 对齐，仅 Web 端实现。

数据驱动只有三个字符串：`icon` 决定返回区的图标（默认左箭头，传空字符串不显示），`title` 是主标题（为空时显示「返回」），`content` 是标题右侧的补充说明（为空时连分割线一起不渲染）。点击返回区派发 `back`，组件本身不做任何跳转。

其余能力都在插槽里：`#breadcrumb` 叠在标题行上方（间隔 24px），`#extra` 放右侧操作，`#icon` / `#title` / `#content` 替换对应节点的内容，默认插槽放在标题行下方作为正文。间距与配色取自设计稿：外边距 24px，图标、标题、分割线、内容之间 16px，标题 20px 中粗 gray-10，内容 16px gray-8，描边 gray-2。

### 何时使用

- 详情页、编辑页需要返回上一级 —— `title` 写当前页面名，`@back` 里调用 `router.back()`。
- 页面层级较深、既要返回又要交代路径 —— `#breadcrumb` 放 `RebornBreadcrumb`，标题行保持不变。
- 页面级操作（编辑、删除、发布）要固定在标题旁 —— 放进 `#extra`，按钮自动靠右并保持 8px 间距。
- 标题旁要显示状态 —— 在 `#title` 插槽里把标题文字和 `RebornBadge` 排在一起。

### 何时不使用

- 只需要展示层级路径、没有返回动作 —— 改用 `reborn-breadcrumb`。
- 整站共用的顶部导航栏（Logo、菜单、用户头像）—— 改用 `reborn-header` 或 `reborn-layout` 的页头区域。
- 弹窗、抽屉自己的标题栏 —— 用 `reborn-dialog` / `reborn-drawer` 自带的 `title` 与 `#header` 插槽。

## 用法

### 标准页头

`title` 是主标题，`content` 是右侧的补充说明，两者之间自动加一条竖线；没有 `content` 时分割线不渲染。

```vue
<template>
  <RebornPageHeader title="重塑控件库" content="PC端企业级控件库V1.0" @back="router.back()" />
</template>
```

### 带面包屑页头

`#breadcrumb` 插槽放在标题行上方，间隔 24px，同时交代层级路径与当前页面：

```vue
<template>
  <RebornPageHeader title="重塑控件库" content="PC端企业级控件库V1.0">
    <template #breadcrumb>
      <RebornBreadcrumb :routes="[{ label: '首页', path: '/' }, { label: '组件', path: '/components' }, { label: '页头' }]" />
    </template>
  </RebornPageHeader>
</template>
```

### 组合示例

面包屑 + 标题 + 状态标签 + 操作按钮的完整页头。默认四周都有 1px 描边（设计稿的组件样式），直接作为页面顶部时用 `ui.root` 只保留底边，下方接内容区：

```vue
<template>
  <RebornPageHeader content="下单时间 2026-10-16 10:24" :ui="{ root: 'border-x-0 border-t-0' }">
    <template #breadcrumb>
      <RebornBreadcrumb :routes="routes" />
    </template>
    <template #title>
      <span class="flex items-center gap-2">
        订单 #20261016001
        <RebornBadge label="待发货" color="warning" variant="soft" />
      </span>
    </template>
    <template #extra>
      <RebornButton variant="outlined" color="neutral">
        打印
      </RebornButton>
      <RebornButton>发货</RebornButton>
    </template>
  </RebornPageHeader>
</template>
```

| 区域 | 由谁提供 | 间距 |
| --- | --- | --- |
| 面包屑 | `#breadcrumb` | 与标题行间隔 24px |
| 返回区 | `icon` / `#icon` + `title` / `#title` | 图标与标题间隔 16px |
| 内容 | `content` / `#content` | 与标题之间是 16px + 竖线 + 16px |
| 扩展操作 | `#extra` | 靠右，按钮之间 8px |
| 正文 | 默认插槽 | 与标题行间隔 24px |

### 图标与插槽

`icon` 接受 Iconify 图标名或组件，传空字符串不显示图标；`#icon` / `#title` / `#content` 插槽分别替换对应节点的内容，24px 图标盒子、标题字号等样式容器保留。

| 写法 | 效果 |
| --- | --- |
| 不传 `icon` | 默认 `lucide:arrow-left` 左箭头 |
| `icon="lucide:chevron-left"` | 换成任意 Iconify 图标 |
| `:icon="HomeIcon"` | 传组件，按 24px 渲染 |
| `icon=""` | 不显示图标，返回区只剩标题（仍可点击） |

```vue
<template>
  <RebornPageHeader icon="" title="不显示图标" />
  <RebornPageHeader>
    <template #icon>
      <Icon name="lucide:circle-arrow-left" class="size-6 text-primary" />
    </template>
  </RebornPageHeader>
</template>
```

### 返回事件

点击返回区（图标 + 标题）派发 `back`，回调参数是原生事件；返回区可以用 Tab 聚焦，按 Enter / 空格同样触发。组件不做跳转，返回上一页、关闭抽屉等行为都在回调里决定：

```vue
<script setup lang="ts">
const router = useRouter();
</script>

<template>
  <RebornPageHeader title="返回列表" @back="router.back()" />
</template>
```

## API

### Props

| 属性名    | 类型                  | 默认值                | 描述                                                                     |
| --------- | --------------------- | --------------------- | ------------------------------------------------------------------------ |
| `icon`    | `string \| Component` | `'lucide:arrow-left'` | 返回区的图标：Iconify 图标名或组件，按 24px 渲染；传空字符串不显示图标。 |
| `title`   | `string`              | `''`                  | 主标题；为空且未传 `#title` 插槽时显示「返回」。                         |
| `content` | `string`              | `''`                  | 标题右侧的内容，前面带一条竖线；为空且未传 `#content` 插槽时都不渲染。   |
| `class`   | `any`                 | -                     | 追加到根容器的类名。                                                     |
| `ui`      | `PageHeaderUI`        | `{}`                  | 按结构键覆盖各节点样式，键位见「自定义样式（ui）」。                     |

### Emits

| 事件名 | 回调参数                                 | 描述                                                       |
| ------ | ---------------------------------------- | ---------------------------------------------------------- |
| `back` | `(event: MouseEvent \| KeyboardEvent)`   | 点击返回区，或返回区聚焦时按下 Enter / 空格时触发。        |

### Slots

| 插槽名       | 作用域参数 | 描述                                                       |
| ------------ | ---------- | ---------------------------------------------------------- |
| `icon`       | -          | 替换图标内容，24px 图标盒子保留。                          |
| `title`      | -          | 替换标题内容，可与标签等组合。                             |
| `content`    | -          | 替换内容；传了它即使 `content` 为空也会渲染分割线。        |
| `extra`      | -          | 标题行右侧的扩展操作。                                     |
| `breadcrumb` | -          | 标题行上方的面包屑。                                       |
| `default`    | -          | 标题行下方的正文。                                         |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名：

| 键名         | 说明                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `root`       | 根容器，默认 `flex flex-col gap-6 border border-gray-2 p-6`；`class` 也合并到这里。只要底边写 `border-x-0 border-t-0`。 |
| `breadcrumb` | 面包屑区，仅传了 `#breadcrumb` 时渲染。                                                                |
| `header`     | 标题行，默认 `flex items-center justify-between gap-4`。                                               |
| `left`       | 标题行左半部分（返回区 + 分割线 + 内容），默认 `gap-4`。                                                |
| `back`       | 返回区（图标 + 标题），整块可点击；键盘聚焦时的描边画在这里。                                         |
| `icon`       | 24px 图标盒子，默认 `text-gray-8`，悬停返回区时转为主色。`icon=""` 且未传 `#icon` 时不渲染。          |
| `title`      | 标题，默认 `text-xl font-medium text-gray-10`。                                                        |
| `divider`    | 竖分割线，默认 `h-[26px] w-px bg-gray-2`，仅有内容时渲染。                                             |
| `content`    | 内容，默认 `text-lg text-gray-8`，过长时截断。                                                         |
| `extra`      | 扩展区，默认 `gap-2`，仅传了 `#extra` 时渲染。                                                         |
| `main`       | 正文区，仅传了默认插槽时渲染。                                                                         |

```vue
<template>
  <RebornPageHeader title="标题" :ui="{ root: 'border-0 px-0', title: 'text-2xl' }" />
</template>
```

## 注意事项

- **默认带四周描边**。这是设计稿里页头组件本身的样式；放在页面最顶部、下方紧接内容时，通常用 `ui.root` 改成只留底边（`border-x-0 border-t-0`），或去掉描边与水平内边距贴齐页面栅格。
- **组件不做跳转**。`back` 只是通知，返回上一页、回到列表、关闭抽屉都要在回调里自己写；不监听 `back` 时点击返回区什么也不会发生。
- **标题永远可点击**。返回区是图标与标题的整体，即使 `icon=""` 不显示图标，点击标题仍会派发 `back`；不需要返回动作的页面标题请改用普通标题元素。
- **空标题显示「返回」**。`title` 为空且没有 `#title` 插槽时，返回区读作「返回」，保证读屏软件与键盘用户知道这个可聚焦区域的用途。
- **内容过长时截断，标题不截断**。标题与扩展区不收缩，空间不够时只有 `content` 显示省略号；标题本身很长时请自行缩短或换到 `#title` 插槽里控制换行。
