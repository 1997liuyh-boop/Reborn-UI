---
title: Breadcrumb 面包屑
description: 用于展示当前页面层级路径并可逐级返回的面包屑导航组件，双端可用。
category: 导航
platform: both
tags: [css, tailwind, navigation, breadcrumb, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornBreadcrumbDemo.vue" config="RebornBreadcrumbConfig" componentId="reborn-breadcrumb" :componentFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]' :uniappFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]'}
::

## 简介

Breadcrumb 展示当前页面的层级路径，Web 与 UniApp 两端均由同名的 `RebornBreadcrumb` 容器和 `RebornBreadcrumbItem` 条目组成，支持手写条目与 `routes` 数据驱动。

`routes` 决定路径数据，`maxCount` 决定是否折叠中间层级，两者可独立组合。手写条目通过 `to` 指定目标；`order` 在整组均为有限数值时决定顺序，混传或无效值则整组回退，UniApp 小程序动态列表须逐项传入序位。

`separator` / `separatorIcon` 与分隔符插槽控制路径分隔，`droplist` / 路由项的 `children` 提供同级菜单，`customUrl` 改写数据路径，`ui` 从容器级联到条目。两端事件与插槽对齐；图标写法、跳转方式、`dropdownProps` 与部分样式键位存在差异，见下方完整 API 表。

### 何时使用

- 依据页面路径数据生成层级导航——用 `routes`，由容器计算每项链接与当前页。
- 页面路径较深、需要压缩中间层级——用 `maxCount` 保留首项与末尾路径。
- 某一级需要切换同级页面——用条目的 `droplist` 或 `routes` 项的 `children` 提供菜单。
- 路径与实际地址需要拼接规则——用 `customUrl` 根据当前项及祖先的 `path` 生成地址。
- UniApp 小程序路径条目动态增删或换序——为每项传稳定 Vue `key` 与完整有限数值 `order`，保留实例身份并更新首尾与折叠。

### 何时不使用

- 同层内容面板之间切换，没有祖先路径关系——改用 `reborn-tabs`。
- 列表按页浏览与跳页——改用 `reborn-pagination`。

## 用法

### 基础用法

条目用 `RebornBreadcrumbItem` 包裹，`to` 指定跳转目标。手写条目的当前页应省略 `to`，否则仍会跳转；`routes` 模式会自动忽略末项的 `path`，将其显示为当前页。

```vue
<template>
  <RebornBreadcrumb>
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/channel">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

### 分隔符：文本、图标与插槽

分隔符按「条目插槽 > 条目属性 > 容器插槽 > 容器属性」的顺序生效，同名插槽优先级高于属性。图标分隔符的取值写法两端不同：Web 传 Iconify 名称或组件，UniApp 传图标类名。

| 配置 | 行为 | 典型用途 |
| --- | --- | --- |
| `separator` | 直接显示文本或数字 | 斜杠、箭头字符分隔 |
| `separatorIcon` | 覆盖同级文本分隔符 | 保持图标形状一致 |
| `separator` 插槽 | 覆盖同级 prop | 彩色或组合内容分隔 |

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

```vue
<template>
  <RebornBreadcrumb separator-icon="lucide:chevron-right">
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem separator="»">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>
      新闻
      <template #separator>
        <span class="text-primary">~</span>
      </template>
    </RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

```vue
<template>
  <RebornBreadcrumb separator-icon="i-lucide-chevron-right">
    <RebornBreadcrumbItem to="/pages/index/index">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem separator="»">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>
      新闻
      <template #separator>
        <text class="text-primary">~</text>
      </template>
    </RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

:::

::

### 自定义样式：ui 级联与覆盖

容器的 `ui` 会级联到所有子条目，条目自身的 `ui` 优先级更高。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

```vue
<template>
  <RebornBreadcrumb :ui="{ root: 'text-base', separator: 'text-sm' }">
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :ui="{ link: 'text-primary' }">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

```vue
<template>
  <RebornBreadcrumb :ui="{ root: 'text-32', separator: 'text-28' }">
    <RebornBreadcrumbItem to="/pages/index/index">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :ui="{ link: 'text-primary' }">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

:::

::

### 数据驱动：routes 与 item-render

传入非空 `routes` 后由组件负责渲染条目，无需再手写子标签。`item-render` 插槽可接管单项内容，作用域参数包含 `route`、`routes` 和 `paths`；`custom-url` 可基于 `paths` 改写最终跳转地址。

```vue
<script setup lang="ts">
const routes = [{ label: "首页", path: "home" }, { label: "频道", path: "channel" }, { label: "新闻" }];
</script>

<template>
  <RebornBreadcrumb :routes="routes" :custom-url="paths => '/site/' + paths.join('/')">
    <template #item-render="{ route, paths }">
      {{ route.label }}（{{ paths.length }}）
    </template>
  </RebornBreadcrumb>
</template>
```

### 下拉菜单：droplist 与 children

`routes` 项的 `children` 或条目的 `droplist` 属性都会在该条目上渲染下拉菜单；`#droplist` 插槽可完全接管菜单内容。默认菜单项被点击时抛出 `select` 事件，若该项带 `path` 则同时跳转；自定义 `droplist` 插槽替换默认菜单项后，选择交互由插槽内容处理。

```vue
<script setup lang="ts">
const droplist = [{ label: "活动列表", path: "/promotion/list" }, { label: "活动模板", path: "/promotion/template" }];
</script>

<template>
  <RebornBreadcrumb>
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :droplist="droplist" @select="item => console.log(item)">活动管理</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>活动详情</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

::warning
`dropdown-props` 的支持度两端相差很大：Web 端透传给底层浮层容器 `RebornSelectTrigger`（`portal` / `size` / `closeOn` / `ui` 等），且写在组件内置默认值之后，连 `ui` 都能覆盖，`closeOn` 默认沿用 `RebornSelectTrigger` 的 `mousedown`，可改为 `click`；UniApp 端为组件内置的绝对定位面板、**仅支持 `hideOnClick`**（默认 `true`，即点菜单项后自动收起，传 `false` 可保持展开）。
::

### 超出折叠：max-count

`max-count` 指定最多展示的条目数量（`0` 表示不限制）。超出时保留首项与末尾 `max-count - 1` 项，中间折叠为省略号，可用 `#more-icon` 插槽替换省略号内容。

```vue
<script setup lang="ts">
const longRoutes = ["首页", "频道", "分类", "专题", "当前页"].map(label => ({ label }));
</script>

<template>
  <RebornBreadcrumb :routes="longRoutes" :max-count="3">
    <template #more-icon>···</template>
  </RebornBreadcrumb>
</template>
```

### 跳转方式：to 与 replace

`to` 指定跳转目标，`replace` 决定打开方式，取值两端不同：Web 走浏览器 / 路由跳转，UniApp 走 `uni` 的四种路由 API。

| 平台与 `replace` | 行为 | 典型用途 |
| --- | --- | --- |
| Web `push` / UniApp `navigate` | 保留当前页面历史 | 逐级进入路径 |
| Web `replace` / UniApp `redirect` | 替换当前页面 | 当前层级不再需要返回 |
| Web `blank` | 新窗口打开 | 保留当前页面并查看文档 |
| UniApp `switchTab` | 跳到 tabBar 页面 | 返回应用底部入口 |
| UniApp `reLaunch` | 关闭全部页面后打开 | 重建页面栈 |

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

```vue
<template>
  <RebornBreadcrumb>
    <RebornBreadcrumbItem to="/" replace="push">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/channel" replace="replace">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/docs" replace="blank">文档</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

```vue
<template>
  <RebornBreadcrumb>
    <RebornBreadcrumbItem to="/pages/index/index" replace="switchTab">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/pages/channel/index" replace="navigate">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

:::

::

## API

### Props

#### RebornBreadcrumb

两端只有 `separator-icon` 的取值类型不同：Web 端既能传 Iconify 名称也能直接传组件，UniApp 端把它当作类名挂到 `<view>` 上，只能传图标类名。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `separator` | `string \| number` | `/` | 分隔符文字 |
| `separatorIcon` | `string \| Component` | — | 图标分隔符，优先级高于 `separator`。字符串按 Iconify 名称渲染（如 `lucide:chevron-right`），也可直接传组件 |
| `routes` | `BreadcrumbRoute[]` | — | 路径数据，非空时由组件渲染条目并替换默认插槽；空数组仍用默认插槽 |
| `maxCount` | `number` | `0` | 最多展示的条目数量，`0` 表示不限制；超出时保留首项与末尾 `max-count - 1` 项 |
| `customUrl` | `(paths: string[]) => string` | — | 自定义链接地址，入参为当前条目及其祖先的 path，优先级高于 `path` |
| `customClass` | `string` | — | 追加到面包屑根节点的自定义类名（两端同名，均非 `class`） |
| `ui` | `BreadcrumbUI` | `{}` | 细粒度样式覆盖，键位见「自定义样式（ui）」。会级联到所有子条目 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `separator` | `string \| number` | `/` | 分隔符文字 |
| `separatorIcon` | `string` | — | 图标分隔符，优先级高于 `separator`。取值为图标类名（如 `i-lucide-chevron-right`），直接作为 `<view>` 的 class |
| `routes` | `BreadcrumbRoute[]` | — | 路径数据，非空时由组件渲染条目并替换默认插槽；空数组仍用默认插槽 |
| `maxCount` | `number` | `0` | 最多展示的条目数量，`0` 表示不限制；超出时保留首项与末尾 `max-count - 1` 项 |
| `customUrl` | `(paths: string[]) => string` | — | 自定义链接地址，入参为当前条目及其祖先的 path，优先级高于 `path` |
| `customClass` | `string` | — | 追加到面包屑根节点的自定义类名（两端同名，均非 `class`） |
| `ui` | `BreadcrumbUI` | `{}` | 细粒度样式覆盖，键位见「自定义样式（ui）」。会级联到所有子条目 |

:::

::

#### RebornBreadcrumbItem

条目属性两端**未对齐**（跳转模式取值与默认值不同、`target` 仅 UniApp 端声明、`separator-icon` 取值类型与 `dropdown-props` 支持度不同），按平台分开描述：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `order` | `number` | — | 显式序位；所有条目为有限数值时升序排列，小程序动态插槽必须逐项传下标；混传或无效值忽略整组排序，同值保留相对次序 |
| `to` | `string \| object` | — | 路由跳转目标，同 vue-router 的 to 属性 |
| `replace` | `'push' \| 'replace' \| 'blank'` | `push` | 跳转方式：`push` 入栈 / `replace` 替换 / `blank` 新窗口 |
| `separator` | `string \| number` | — | 分隔符文字，优先级高于容器的 `separator` |
| `separatorIcon` | `string \| Component` | — | 图标分隔符（Iconify 名称或组件），优先级高于本条目的 `separator` |
| `droplist` | `BreadcrumbDroplistItem[]` | — | 下拉菜单数据 |
| `dropdownProps` | `object` | — | 下拉菜单属性，透传给底层浮层容器 `RebornSelectTrigger`（如 `portal` / `autoAdjustOverflow` / `size` / `closeOn` / `ui`，写在组件默认值之后，可覆盖） |
| `customClass` | `string` | — | 追加到条目链接节点的自定义类名 |
| `ui` | `BreadcrumbUI` | `{}` | 细粒度样式覆盖，键位见「自定义样式（ui）」。优先级高于容器的 `ui` |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `order` | `number` | — | 显式序位；所有条目为有限数值时升序排列，小程序动态插槽必须逐项传下标；混传或无效值忽略整组排序，同值保留相对次序 |
| `to` | `string \| object` | — | 跳转目标，字符串页面路径或含 `path` 字段的对象 |
| `replace` | `'navigate' \| 'redirect' \| 'switchTab' \| 'reLaunch'` | `navigate` | 跳转方式，对应 uni 的四种路由 API：`navigate` 保留当前页 / `redirect` 关闭当前页 / `switchTab` 切 tab / `reLaunch` 关闭所有页 |
| `target` | `string` | — | 预留的链接打开方式属性，**仅 UniApp 端声明**，当前不参与跳转逻辑（打开方式由 `replace` 决定） |
| `separator` | `string \| number` | — | 分隔符文字，优先级高于容器的 `separator` |
| `separatorIcon` | `string` | — | 图标分隔符（图标类名，如 `i-lucide-chevron-right`），优先级高于本条目的 `separator` |
| `droplist` | `BreadcrumbDroplistItem[]` | — | 下拉菜单数据 |
| `dropdownProps` | `object` | — | 下拉菜单属性，**仅支持 `hideOnClick`**（面板为组件内置的绝对定位实现，无浮层容器可透传） |
| `customClass` | `string` | — | 追加到条目链接节点的自定义类名 |
| `ui` | `BreadcrumbUI` | `{}` | 细粒度样式覆盖，键位见「自定义样式（ui）」。优先级高于容器的 `ui` |

:::

::

### Emits

#### RebornBreadcrumb

两端通用。

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `select` | `(item: BreadcrumbDroplistItem, index: number)` | `routes` 模式下点击下拉菜单项 |

#### RebornBreadcrumbItem

两端通用。

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `select` | `(item: BreadcrumbDroplistItem)` | 点击下拉菜单项时 |

### Slots

#### RebornBreadcrumb

两端通用，插槽名与作用域参数一致。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | — | 手写条目，非空 `routes` 时不渲染 |
| `item-render` | `route` / `routes` / `paths` | `routes` 设置时生效，自定义条目内容 |
| `more-icon` | — | 自定义折叠省略号内容 |
| `separator` | — | 自定义分隔符，`routes` 模式下级联到条目 |

#### RebornBreadcrumbItem

两端通用。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | — | 自定义条目内容 |
| `droplist` | — | 自定义下拉菜单 |
| `separator` | — | 自定义分隔符内容 |

### 数据结构

#### BreadcrumbRoute

两端通用的数据结构。

| 属性名     | 说明           | 类型                       |
| ---------- | -------------- | -------------------------- |
| `label`    | 面包屑名称     | `string`                   |
| `path`     | 可选跳转路径；末项不生成链接 | `string`                   |
| `children` | 可选下拉菜单展示项 | `BreadcrumbDroplistItem[]` |

#### BreadcrumbDroplistItem

| 属性名 | 类型 | 描述 |
| --- | --- | --- |
| `label` | `string` | 菜单项文案 |
| `path` | `string` | 可选跳转地址；未传时默认菜单项只派发 `select` |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。容器（`RebornBreadcrumb`）上的 `ui` 会向下注入给所有条目；条目自身的 `ui` 优先级更高，两者按键合并。两端各有 10 个键，其中 Web 端多 `droplistDivider`、UniApp 端多 `droplistMask`，默认类名分属 px / rpx 两套体系，故分平台描述：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名              | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`            | 根节点 `<nav>`，默认 `flex items-center flex-wrap gap-x-1.5 text-sm leading-none`；整条面包屑的字号、换行、条目间距改这里；`custom-class` prop 也并到该节点。折叠时省略号直接插在首项之后，DOM 顺序即视觉顺序，不依赖 flex `order`。                                                                                                                                                                                                                                                                                                                         |
| `item`            | 单个条目外层（折叠出现的省略号节点也用这个键），默认 `reborn-breadcrumb-item flex items-center gap-x-1.5 group/breadcrumb`。文字与分隔符之间的间距改这里。**分组名固定为 `group/breadcrumb`（具名而非匿名），覆盖时请保留。**                                                                                                                                                                                                                                                                                                         |
| `link`            | 条目的文本/链接节点，默认 `text-gray-9 transition-colors flex items-center gap-1`。**所有条目一视同仁**：同一个文字颜色 `text-gray-9`、同一个字重，首项与末项都不加粗；视觉上的唯一变化来自 hover（可跳转与带下拉的条目变 `text-primary`）。要给首项/末项做区分可自行补 `group-first/breadcrumb:` / `group-last/breadcrumb:` 修饰。条目上的 `custom-class` prop 也并到该节点。**带下拉菜单的条目同样只有这一层样式，不会额外套边框或底色。**                                                                                          |
| `separator`       | 分隔符容器，默认 `text-gray-4 select-none flex items-center justify-center text-sm group-last/breadcrumb:hidden`（末项自动隐藏）。填充 `separator` 插槽只替换里面的内容，容器类名仍生效。                                                                                                                                                                                                                                                                                                                                             |
| `more`            | 折叠省略号的容器。**仅 `max-count` 触发折叠时渲染**，默认 `text-gray-9 flex items-center`（与条目同色）。                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `moreIcon`        | 省略号图标，默认 `size-4`。**仅在未填充 `more-icon` 插槽时渲染**，填充该插槽会替换掉图标，`ui.moreIcon` 随之失效。                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `dropIcon`        | 下拉箭头图标，默认 `size-3.5 shrink-0 transition-transform duration-200`。**仅该条目有下拉菜单时渲染。**                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `droplist`        | 下拉面板的内容区，默认 `min-w-32 max-h-60 overflow-y-auto px-[4px] py-[6px] space-y-[4px] scrollbar-hide`。面板宽度、内边距、最大高度改这里。**内边距必须留在这一层**：外层浮层壳的展开动画走 `height: 0 → scrollHeight`，内边距放到壳上会在收起时露出一条残留色块。浮层外壳（描边、底色、阴影、圆角）由 `RebornSelectTrigger` 提供，需要改用 `dropdown-props` 的 `ui.dropdown`。                                                                                                                                                     |
| `droplistItem`    | 下拉菜单项，默认 `flex cursor-pointer select-none items-center gap-1 whitespace-nowrap rounded-sm px-[6px] py-[4px] text-base text-gray-7 transition-colors hover:bg-gray-2 hover:text-primary data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:hover:bg-transparent data-[disabled=true]:hover:text-gray-7`。**字号必须自带**：浮层默认传送到 body，拿不到面包屑根节点的 `text-sm`。**颜色只用灰阶 token**（暗色由主题整条翻转），不要写 `dark:` 前缀。填充 `droplist` 插槽时该键仍生效——插槽里的 `RebornDoption` 会通过组件注入的上下文自动套用这份样式。 |
| `droplistDivider` | 下拉菜单项之间的分隔线，默认 `my-[4px] border-t border-gray-3`。**该键目前不生效**：类型与默认值已声明、条目也把它并入了 `ui`，但模板里没有任何节点使用它，传入不会产生效果。                                                                                                                                                                                                                                                                                                                                                         |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名           | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 根节点 `<view>`，默认 `flex flex-row items-center flex-wrap gap-x-[12rpx] text-28 leading-none`；尺寸全走 rpx 体系，整体间距改这里；`custom-class` prop 也并到该节点。**折叠依赖 flex `order`，覆盖时请保留 `flex`。**                                                                                                                                                                                                                                                                                                                            |
| `item`         | 单个条目外层（折叠省略号节点同用），默认 `reborn-breadcrumb-item flex flex-row items-center gap-x-[12rpx] relative group`；`relative` 是下拉面板的定位基准，勿移除。                                                                                                                                                                                                                                                                                                                                                                              |
| `link`         | 条目的文本节点，默认 `text-gray-8 transition-colors flex flex-row items-center gap-[8rpx]`。**与 Web 端一致，所有条目一视同仁**：同一个文字颜色、同一个字重，首项与末项都不加粗（本端灰阶只到 8，`gray-8` 对应 Web 的 `gray-9`）；视觉变化只来自按压反馈（可跳转与带下拉的条目按压变 `text-primary`）。条目上的 `custom-class` 也并到该节点。**不可跳转的条目会被加上 `pointer-events-none`**（Web 端只是 `cursor-default`），带下拉时再由变体补回 `pointer-events-auto`；若要给末项绑自定义点击，需在 `ui.link` 里覆盖回 `pointer-events-auto`。 |
| `separator`    | 分隔符容器，默认 `text-gray-4 select-none flex flex-row items-center justify-center text-24`（末项由索引判定自动隐藏）。填充 `separator` 插槽只替换内容，容器类名仍生效。                                                                                                                                                                                                                                                                                                                                                                         |
| `more`         | 折叠省略号的容器。**仅 `max-count` 触发折叠时渲染**，默认 `text-gray-8 flex flex-row items-center`（与条目同色）。                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `moreIcon`     | 省略号图标，默认 `w-[32rpx] h-[32rpx]`。**仅在未填充 `more-icon` 插槽时渲染**，填充该插槽会使其失效。                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `dropIcon`     | 下拉箭头图标，默认 `w-[28rpx] h-[28rpx] shrink-0 transition-transform duration-200`（与 Web 端 `size-3.5` 对齐）。**仅该条目有下拉菜单时渲染。**                                                                                                                                                                                                                                                                                                                                                                                                  |
| `droplist`     | 下拉面板（组件内置的绝对定位面板），默认 `absolute left-0 top-full z-[999] mt-[8rpx] min-w-[200rpx] rounded-ui-base bg-white dark:bg-gray-8 border border-gray-2 dark:border-gray-7 shadow-lg py-[8rpx]`。**仅面板展开时渲染**，宽度、层级、底色改这里。                                                                                                                                                                                                                                                                                          |
| `droplistItem` | 下拉菜单项，默认 `px-[24rpx] py-[16rpx] text-28 leading-normal text-gray-7 dark:text-gray-2 active:bg-gray-2 dark:active:bg-gray-7`（配色与 Web 端一致，hover 换为按压反馈）。**仅在未填充 `droplist` 插槽时渲染**，填充该插槽会使其失效。                                                                                                                                                                                                                                                                                                        |
| `droplistMask` | 面板展开时铺满全屏的点击遮罩（用于点击外部收起），默认 `fixed inset-0 z-[998]`。**仅面板展开时渲染**，层级要与 `droplist` 配套调整。**该键仅 UniApp 端存在**（Web 端的收起由浮层容器接管）。                                                                                                                                                                                                                                                                                                                                                      |

:::

::

```vue
<template>
  <RebornBreadcrumb :ui="{ root: 'text-base gap-x-2', link: 'text-gray-6', separator: 'text-gray-3' }">
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :ui="{ link: 'text-primary' }">当前页</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

## 两端差异对照

| 维度               | Web                                                                                                                                              | UniApp                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 跳转模式 `replace` | `push` / `replace` / `blank`，默认 `push`                                                                                                        | `navigate` / `redirect` / `switchTab` / `reLaunch`，默认 `navigate`              |
| `target`           | 未声明；新窗口打开用 `replace="blank"`                                                                                                           | 已声明但不参与跳转逻辑（预留属性）                                               |
| `separatorIcon`   | Iconify 名称或组件，如 `lucide:chevron-right`                                                                                                    | 仅图标类名，如 `i-lucide-chevron-right`                                          |
| 下拉菜单实现       | 借 `RebornSelectTrigger` 做浮层容器，默认传送到 body，支持完整 `dropdown-props`                                                                  | 组件内置的绝对定位面板 + 全屏点击遮罩，`dropdown-props` 仅 `hideOnClick`         |
| 下拉菜单关闭时机   | 沿用 `RebornSelectTrigger` 默认的 `mousedown`，面板外按下任意鼠标键或页面滚动即收起；`dropdown-props` 传 `closeOn: 'click'` 可改为点击完成后收起 | 点击 `droplistMask` 全屏遮罩收起；`hideOnClick`（默认 `true`）时点菜单项也收起   |
| 交互反馈           | hover 变 `text-primary`                                                                                                                          | 按压（`active:`）变 `text-primary`，触屏无 hover                                 |
| 不可跳转条目的命中 | 仅 `cursor-default`，节点仍可接收点击                                                                                                            | 追加 `pointer-events-none`，节点收不到点击（带下拉时补回 `pointer-events-auto`） |
| 暗色适配           | 只用灰阶 token，暗色由主题整条翻转，**禁写 `dark:` 前缀**                                                                                        | 下拉面板与菜单项显式写 `dark:` 变体                                              |
| 键盘操作           | 浮层锚点 `tabindex=0`，`Enter` / `空格` 开合、`Esc` 收起，带 `role="menu"` 语义                                                                  | 触屏环境，无键盘操作                                                             |
| 文字色             | `text-gray-9`                                                                                                                                    | `text-gray-8`（本端灰阶只到 8，与 Web 的 gray-9 对应）                           |
| 首尾判定           | 完整有效 `order` 优先，否则按插槽顺序编号；省略号插在首项之后，服务端首屏即折叠结果                         | 首尾均由容器按注册索引下发，不依赖 `:first-child` / `:last-child`                |
| 尺寸体系           | `text-sm` / `gap-x-1.5` / `size-4` 等 px 体系                                                                                                    | `text-28` / `gap-x-[12rpx]` / `w-[32rpx]` 等 rpx 体系                            |
| `ui` 结构键        | 含 `droplistDivider`（已声明但模板未使用，当前不生效）                                                                                           | 含 `droplistMask`（全屏点击遮罩）                                                |

## 注意事项

- **分隔符先取插槽，再取 prop，条目级高于容器级。** 四级优先级会覆盖低级配置，局部定制时应从条目级开始检查。
- **`routes` 末项自动作为当前页，手写末项须省略 `to`。** 数据模式不为末项生成链接；手写条目仍根据自身 `to` 跳转，传入地址不会自动失效。
- **非空 `routes` 与默认插槽互斥。** 两端在 `routes.length > 0` 时渲染数据条目，空数组或未传时仍渲染默认插槽，不能用空数组隐藏手写条目。
- **Web 端完整有效的 `order` 优先，默认插槽里的每个组件节点都算一项。** 容器在渲染时展开默认插槽；整组 `order` 都是有限数值时按其排序，同值保留相对次序，否则 `v-for` / `v-if` / `<template>` 内按插槽顺序编号，中途插入的条目不会排到末尾。条目按「是不是组件节点」识别而不比较组件身份，所以全局注册经运行时解析得到的异步包装（站内 Playground、`resolveComponent`、`<component is>`）照样参与计数与折叠；普通元素、文本不计数，原位保留。序号与折叠结果以属性写进节点：自己封装的条目组件须是单根且不关 `inheritAttrs`，属性才会透传到内部的 `RebornBreadcrumbItem` 上；默认插槽里也不要混放图标等其他组件，否则会被当成一项。
- **UniApp 动态插槽逐项传 `order`。** 小程序不提供 VNode 树，条目按完整有限数值 `order` 升序登记，头/中插入、删除与重排据此更新首尾和折叠；静态缺省保留登记次序，H5 缺省仍按 VNode。`routes` 模式内部传入下标。混传或无效值忽略整组显式排序，同值保留相对次序；根节点仍需 flex 布局以放置省略号。小程序开发态下，挂载后新增条目而并非每项都传了 `order` 时，控制台会提示一次 `[RebornBreadcrumb]` 警告。
- **自定义类名使用 `customClass`。** 容器合并到根节点，条目合并到链接节点；模板写作 `custom-class`，需要覆盖内部结构时用 `ui`。
- **下拉菜单由点击开合。** 点条目本体展开，再点一次收起；Web 端 `Enter` / `空格` 同样开合，`Esc` 收起，悬停不会打开菜单。
- **UniApp 的 `target` 当前是预留 prop。** 跳转逻辑只读取 `replace`，传 `target` 不会改变打开方式；Web 新窗口使用 `replace="blank"`。
- **Web 的 `ui.droplistDivider` 当前不生效。** 类型与默认类名已声明，但模板没有消费该键，传入不会出现菜单分隔线。
