---
title: 面包屑
description: 用于展示当前页面层级路径并可逐级返回的面包屑导航组件，双端可用。
category: 导航
platform: both
tags: [navigation, breadcrumb]
badge: New
---

::ComponentViewer{demoFile="RebornBreadcrumbDemo.vue" config="RebornBreadcrumbConfig" componentId="reborn-breadcrumb" :componentFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]' :uniappFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]'}
::

## 简介

Breadcrumb 是双端可用的面包屑导航，由 `RebornBreadcrumb` 容器与若干 `RebornBreadcrumbItem` 条目组成。条目既可以手写在默认插槽里，也可以通过容器的 `routes` 属性由数据驱动渲染。分隔符支持容器级与条目级两层配置，条目可挂载下拉菜单，路径过长时可用 `max-count` 折叠为省略号。

::tip
**平台对齐情况**：容器 `RebornBreadcrumb` 的 Attributes / Slots / Events 两端逐字一致（含默认值），条目 `RebornBreadcrumbItem` 的 Slots / Events 与 `BreadcrumbRoute` 数据结构也一致，均按通用描述书写。**条目 Attributes 未对齐**（跳转模式取值、`target`、`dropdown-props` 支持度不同）与 **`ui` 结构键默认值**（px / rpx 体系）按 Web / UniApp 分开描述。
::

适用场景：

- 多层级页面结构中提示用户当前位置并支持返回上级。
- 后台管理、商城分类等需要层级导航的页面头部。
- 层级较深、需要折叠中间路径或在某一级展开同级页面下拉菜单的导航。

不适用场景：

- 平级页签切换场景，改用 `reborn-tabs`。
- 分页浏览列表数据，改用 `reborn-pagination`。

## 用法

### 基础用法

条目用 `RebornBreadcrumbItem` 包裹，`to` 指定跳转目标。末项会被识别为当前页，即使传了 `to` 也渲染为不可点击的文本。

```vue
<template>
  <RebornBreadcrumb>
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/channel">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

### 跳转模式

跳转模式是两端唯一需要区别对待的属性：Web 走浏览器 / 路由跳转，UniApp 走 `uni` 的四种路由 API。

::code-group

```vue [Web]
<template>
  <RebornBreadcrumb>
    <!-- push 入栈（默认） / replace 替换 / blank 新窗口 -->
    <RebornBreadcrumbItem to="/" replace="push">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/channel" replace="replace">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/docs" replace="blank">文档</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

```vue [UniApp]
<template>
  <RebornBreadcrumb>
    <!-- navigate 保留当前页（默认） / redirect 关闭当前页 / switchTab 切 tab / reLaunch 关闭所有页 -->
    <RebornBreadcrumbItem to="/pages/index/index" replace="switchTab">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/pages/channel/index" replace="navigate">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

::

### 自定义分隔符

分隔符按「条目插槽 > 条目属性 > 容器插槽 > 容器属性」的顺序生效，同名插槽优先级高于属性。图标分隔符的取值写法两端不同：Web 传 Iconify 名称或组件，UniApp 传图标类名。

::code-group

```vue [Web]
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

```vue [UniApp]
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

::

### 自定义尺寸

容器的 `ui` 会级联到所有子条目，条目自身的 `ui` 优先级更高。

::code-group

```vue [Web]
<template>
  <RebornBreadcrumb :ui="{ root: 'text-base', separator: 'text-sm' }">
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :ui="{ link: 'text-primary' }">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

```vue [UniApp]
<template>
  <RebornBreadcrumb :ui="{ root: 'text-32', separator: 'text-28' }">
    <RebornBreadcrumbItem to="/pages/index/index">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :ui="{ link: 'text-primary' }">频道</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

::

### routes 数据驱动

传入 `routes` 后由组件负责渲染条目，无需再手写子标签。`item-render` 插槽可接管单项内容，作用域参数包含 `route`、`routes` 和 `paths`；`custom-url` 可基于 `paths` 改写最终跳转地址。

```vue
<script setup lang="ts">
const routes = [
  { label: "首页", path: "/" },
  { label: "频道", path: "/channel" },
  { label: "新闻", path: "/channel/news" },
];
</script>

<template>
  <RebornBreadcrumb :routes="routes" />

  <RebornBreadcrumb :routes="routes" :custom-url="paths => `/site/${paths.join('/')}`">
    <template #item-render="{ route, paths }">
      {{ route.label }}（{{ paths.length }}）
    </template>
  </RebornBreadcrumb>
</template>
```

### 下拉菜单

`routes` 项的 `children` 或条目的 `droplist` 属性都会在该条目上渲染下拉菜单；`#droplist` 插槽可完全接管菜单内容。菜单项被点击时抛出 `select` 事件，若该项带 `path` 则同时跳转。

```vue
<script setup lang="ts">
const droplist = [
  { label: "活动列表", path: "/promotion/list" },
  { label: "活动模板", path: "/promotion/template" },
];
</script>

<template>
  <RebornBreadcrumb>
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :droplist="droplist" @select="item => console.log(item)">
      活动管理
    </RebornBreadcrumbItem>
    <RebornBreadcrumbItem>活动详情</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

::warning
`dropdown-props` 的支持度两端相差很大：Web 端透传给底层浮层容器 `RebornSelectTrigger`（`portal` / `size` / `closeOn` / `ui` 等），且写在组件内置默认值之后，连 `close-on` 与 `ui` 都能覆盖；UniApp 端为组件内置的绝对定位面板、**仅支持 `hideOnClick`**（默认 `true`，即点菜单项后自动收起，传 `false` 可保持展开）。
::

### 超出折叠

`max-count` 指定最多展示的条目数量（`0` 表示不限制）。超出时保留首项与末尾 `max-count - 1` 项，中间折叠为省略号，可用 `#more-icon` 插槽替换省略号内容。

```vue
<template>
  <RebornBreadcrumb :routes="longRoutes" :max-count="3">
    <template #more-icon>
      <span>···</span>
    </template>
  </RebornBreadcrumb>
</template>
```

## API

### Breadcrumb Attributes

::tip
容器属性两端通用，属性名与默认值逐字一致。
::

| 属性名           | 说明                                             | 类型                       | 默认值 |
| ---------------- | ------------------------------------------------ | -------------------------- | ------ |
| `separator`      | 分隔符文字                                       | `string / number`          | `/`    |
| `separator-icon` | 图标分隔符，优先级高于 `separator`。取值写法分平台：Web 为 Iconify 名称或组件（`lucide:chevron-right`），UniApp 为图标类名（`i-lucide-chevron-right`） | `string / Component`       | —      |
| `routes`         | 路径数据，传入后由组件渲染条目                   | `BreadcrumbRoute[]`        | —      |
| `max-count`      | 最多展示的条目数量，`0` 表示不限制               | `number`                   | `0`    |
| `custom-url`     | 自定义链接地址，入参为当前条目及其祖先的 path    | `(paths: string[]) => string` | —   |
| `custom-class`   | 追加到面包屑根节点的自定义类名（两端同名，均非 `class`） | `string`                   | —      |
| `ui`             | 细粒度样式覆盖对象，会级联到所有子条目           | `BreadcrumbUI`             | `{}`   |

### Breadcrumb Slots

两端通用，插槽名与作用域参数一致。

| 插槽名        | 说明                                     | 参数                          |
| ------------- | ---------------------------------------- | ----------------------------- |
| `default`     | 手写条目，与 `routes` 互斥               | —                             |
| `item-render` | `routes` 设置时生效，自定义条目内容      | `route` / `routes` / `paths`  |
| `more-icon`   | 自定义折叠省略号内容                     | —                             |
| `separator`   | 自定义分隔符，`routes` 模式下级联到条目  | —                             |

### Breadcrumb Events

两端通用。

| 事件名   | 说明                             | 回调参数                                     |
| -------- | -------------------------------- | -------------------------------------------- |
| `select` | `routes` 模式下点击下拉菜单项    | `(item: BreadcrumbDroplistItem, index: number)` |

### BreadcrumbItem Attributes

条目属性两端**未对齐**（跳转模式取值与默认值不同、`target` 仅 UniApp 端声明、`dropdown-props` 支持度不同），按平台分开描述：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 属性名           | 说明                                                                                                                                              | 类型                       | 默认值 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------ |
| `to`             | 路由跳转目标，同 vue-router 的 to 属性                                                                                                            | `string / object`          | —      |
| `replace`        | 跳转方式：`push` 入栈 / `replace` 替换 / `blank` 新窗口                                                                                           | `'push' / 'replace' / 'blank'` | `push` |
| `separator`      | 分隔符文字，优先级高于容器的 `separator`                                                                                                          | `string / number`          | —      |
| `separator-icon` | 图标分隔符（Iconify 名称或组件），优先级高于本条目的 `separator`                                                                                   | `string / Component`       | —      |
| `droplist`       | 下拉菜单数据                                                                                                                                      | `BreadcrumbDroplistItem[]` | —      |
| `dropdown-props` | 下拉菜单属性，透传给底层浮层容器 `RebornSelectTrigger`（如 `portal` / `autoAdjustOverflow` / `size` / `closeOn` / `ui`，写在组件默认值之后，可覆盖） | `object`                   | —      |
| `custom-class`   | 追加到条目链接节点的自定义类名                                                                                                                    | `string`                   | —      |
| `ui`             | 细粒度样式覆盖对象，优先级高于容器的 `ui`                                                                                                         | `BreadcrumbUI`             | `{}`   |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 属性名           | 说明                                                                                     | 类型                       | 默认值     |
| ---------------- | ---------------------------------------------------------------------------------------- | -------------------------- | ---------- |
| `to`             | 跳转目标，字符串页面路径或含 `path` 字段的对象                                           | `string / object`          | —          |
| `replace`        | 跳转方式，对应 uni 的四种路由 API：`navigate` 保留当前页 / `redirect` 关闭当前页 / `switchTab` 切 tab / `reLaunch` 关闭所有页 | `'navigate' / 'redirect' / 'switchTab' / 'reLaunch'` | `navigate` |
| `target`         | 预留的链接打开方式属性，**仅 UniApp 端声明**，当前不参与跳转逻辑（打开方式由 `replace` 决定） | `string`                   | —          |
| `separator`      | 分隔符文字，优先级高于容器的 `separator`                                                 | `string / number`          | —          |
| `separator-icon` | 图标分隔符（图标类名，如 `i-lucide-chevron-right`），优先级高于本条目的 `separator`        | `string`                   | —          |
| `droplist`       | 下拉菜单数据                                                                             | `BreadcrumbDroplistItem[]` | —          |
| `dropdown-props` | 下拉菜单属性，**仅支持 `hideOnClick`**（面板为组件内置的绝对定位实现，无浮层容器可透传）  | `object`                   | —          |
| `custom-class`   | 追加到条目链接节点的自定义类名                                                           | `string`                   | —          |
| `ui`             | 细粒度样式覆盖对象，优先级高于容器的 `ui`                                                | `BreadcrumbUI`             | `{}`       |

:::

::

### BreadcrumbItem Slots

两端通用。

| 插槽名      | 说明             |
| ----------- | ---------------- |
| `default`   | 自定义条目内容   |
| `droplist`  | 自定义下拉菜单   |
| `separator` | 自定义分隔符内容 |

### BreadcrumbItem Events

两端通用。

| 事件名   | 说明               | 回调参数                          |
| -------- | ------------------ | --------------------------------- |
| `select` | 点击下拉菜单项时   | `(item: BreadcrumbDroplistItem)`  |

### BreadcrumbRoute

两端通用的数据结构。

| 属性名     | 说明                 | 类型                       |
| ---------- | -------------------- | -------------------------- |
| `label`    | 面包屑名称           | `string`                   |
| `path`     | 跳转路径             | `string`                   |
| `children` | 下拉菜单展示项       | `BreadcrumbDroplistItem[]` |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。容器（`RebornBreadcrumb`）上的 `ui` 会向下注入给所有条目；条目自身的 `ui` 优先级更高，两者按键合并。**结构键在两端基本一致**（UniApp 端多一个 `droplistMask`），但默认类名分属 px / rpx 两套体系，故分平台描述：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名           | 说明                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 根节点 `<nav>`，默认 `flex items-center flex-wrap gap-x-1.5 text-sm leading-none`；整条面包屑的字号、换行、条目间距改这里；`custom-class` prop 也并到该节点。**折叠依赖 flex `order`，覆盖时请保留 `flex`。** |
| `item`         | 单个条目外层（折叠出现的省略号节点也用这个键），默认 `reborn-breadcrumb-item flex items-center gap-x-1.5 group/breadcrumb`。文字与分隔符之间的间距改这里。**分组名固定为 `group/breadcrumb`（具名而非匿名），覆盖时请保留。** |
| `link`         | 条目的文本/链接节点，默认 `text-gray-9 transition-colors flex items-center gap-1`。**所有条目一视同仁**：同一个文字颜色 `text-gray-9`、同一个字重，首项与末项都不加粗；视觉上的唯一变化来自 hover（可跳转与带下拉的条目变 `text-primary`）。要给首项/末项做区分可自行补 `group-first/breadcrumb:` / `group-last/breadcrumb:` 修饰。条目上的 `custom-class` prop 也并到该节点。**带下拉菜单的条目同样只有这一层样式，不会额外套边框或底色。** |
| `separator`    | 分隔符容器，默认 `text-gray-4 select-none flex items-center justify-center text-xs group-last/breadcrumb:hidden`（末项自动隐藏）。填充 `separator` 插槽只替换里面的内容，容器类名仍生效。 |
| `more`         | 折叠省略号的容器。**仅 `max-count` 触发折叠时渲染**，默认 `text-gray-9 flex items-center`（与条目同色）。                                                |
| `moreIcon`     | 省略号图标，默认 `size-4`。**仅在未填充 `more-icon` 插槽时渲染**，填充该插槽会替换掉图标，`ui.moreIcon` 随之失效。                                       |
| `dropIcon`     | 下拉箭头图标，默认 `size-3.5 shrink-0 transition-transform duration-200`。**仅该条目有下拉菜单时渲染。**                                                |
| `droplist`     | 下拉面板的内容区，默认 `min-w-32 max-h-60 overflow-y-auto px-[4px] py-[6px] space-y-[4px] scrollbar-hide`。面板宽度、内边距、最大高度改这里。**内边距必须留在这一层**：外层浮层壳的展开动画走 `height: 0 → scrollHeight`，内边距放到壳上会在收起时露出一条残留色块。浮层外壳（描边、底色、阴影、圆角）由 `RebornSelectTrigger` 提供，需要改用 `dropdown-props` 的 `ui.dropdown`。 |
| `droplistItem` | 下拉菜单项，默认 `flex cursor-pointer select-none items-center gap-1 whitespace-nowrap rounded-sm px-[6px] py-[4px] text-base leading-[1.5] text-gray-7 transition-colors hover:bg-gray-2 hover:text-primary data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50`。**字号必须自带**：浮层默认传送到 body，拿不到面包屑根节点的 `text-sm`。**颜色只用灰阶 token**（暗色由主题整条翻转），不要写 `dark:` 前缀。填充 `droplist` 插槽时该键仍生效——插槽里的 `RebornDropdownItem` 会自动套用这份样式。 |
| `droplistDivider` | 下拉菜单项之间的分隔线，默认 `my-[4px] border-t border-gray-3`。**仅 `droplist` 插槽里的 `RebornDropdownItem` 带 `divided` 时渲染。**                 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名           | 说明                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 根节点 `<view>`，默认 `flex flex-row items-center flex-wrap gap-x-[12rpx] text-28 leading-none`；尺寸全走 rpx 体系，整体间距改这里；`custom-class` prop 也并到该节点。**折叠依赖 flex `order`，覆盖时请保留 `flex`。** |
| `item`         | 单个条目外层（折叠省略号节点同用），默认 `reborn-breadcrumb-item flex flex-row items-center gap-x-[12rpx] relative group`；`relative` 是下拉面板的定位基准，勿移除。 |
| `link`         | 条目的文本节点，默认 `text-gray-8 transition-colors flex flex-row items-center gap-[8rpx]`。**与 Web 端一致，所有条目一视同仁**：同一个文字颜色、同一个字重，首项与末项都不加粗（本端灰阶只到 8，`gray-8` 对应 Web 的 `gray-9`）；视觉变化只来自按压反馈（可跳转与带下拉的条目按压变 `text-primary`）。条目上的 `custom-class` 也并到该节点。**不可跳转的条目会被加上 `pointer-events-none`**（Web 端只是 `cursor-default`），带下拉时再由变体补回 `pointer-events-auto`；若要给末项绑自定义点击，需在 `ui.link` 里覆盖回 `pointer-events-auto`。 |
| `separator`    | 分隔符容器，默认 `text-gray-4 select-none flex flex-row items-center justify-center text-24`（末项由索引判定自动隐藏）。填充 `separator` 插槽只替换内容，容器类名仍生效。 |
| `more`         | 折叠省略号的容器。**仅 `max-count` 触发折叠时渲染**，默认 `text-gray-8 flex flex-row items-center`（与条目同色）。                                          |
| `moreIcon`     | 省略号图标，默认 `w-[32rpx] h-[32rpx]`。**仅在未填充 `more-icon` 插槽时渲染**，填充该插槽会使其失效。                                                      |
| `dropIcon`     | 下拉箭头图标，默认 `w-[28rpx] h-[28rpx] shrink-0 transition-transform duration-200`（与 Web 端 `size-3.5` 对齐）。**仅该条目有下拉菜单时渲染。**            |
| `droplist`     | 下拉面板（组件内置的绝对定位面板），默认 `absolute left-0 top-full z-[999] mt-[8rpx] min-w-[200rpx] rounded-2xl bg-white dark:bg-gray-8 border border-gray-2 dark:border-gray-7 shadow-lg py-[8rpx]`。**仅面板展开时渲染**，宽度、层级、底色改这里。 |
| `droplistItem` | 下拉菜单项，默认 `px-[24rpx] py-[16rpx] text-28 leading-normal text-gray-7 dark:text-gray-2 active:bg-gray-2 dark:active:bg-gray-7`（配色与 Web 端一致，hover 换为按压反馈）。**仅在未填充 `droplist` 插槽时渲染**，填充该插槽会使其失效。 |
| `droplistMask` | 面板展开时铺满全屏的点击遮罩（用于点击外部收起），默认 `fixed inset-0 z-[998]`。**仅面板展开时渲染**，层级要与 `droplist` 配套调整。**该键仅 UniApp 端存在**（Web 端的收起由浮层容器接管）。 |

:::

::

```vue
<template>
  <RebornBreadcrumb
    separator="/"
    :ui="{
      root: 'text-base gap-x-2',
      link: 'text-gray-6',
      separator: 'text-gray-3',
    }"
  >
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem :ui="{ link: 'text-primary' }">当前页</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

## 两端差异对照

| 维度               | Web                                                                              | UniApp                                                                |
| ------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 容器 Attributes    | 与 uniapp 端逐字一致（含默认值 `separator='/'`、`maxCount=0`）                   | 与 web 端逐字一致                                                     |
| 条目 Slots / Events| 与 uniapp 端一致                                                                 | 与 web 端一致                                                         |
| 跳转模式 `replace` | `push` / `replace` / `blank`，默认 `push`                                        | `navigate` / `redirect` / `switchTab` / `reLaunch`，默认 `navigate`    |
| `target`           | 未声明；新窗口打开用 `replace="blank"`                                           | 已声明但不参与跳转逻辑（预留属性）                                    |
| 图标取值写法       | Iconify 名称或组件，如 `lucide:chevron-right`                                    | 图标类名，如 `i-lucide-chevron-right`                                 |
| 下拉菜单实现       | 借 `RebornSelectTrigger` 做浮层容器，默认传送到 body，支持完整 `dropdown-props`  | 组件内置的绝对定位面板 + 全屏点击遮罩，`dropdown-props` 仅 `hideOnClick` |
| 下拉菜单关闭时机   | 内置 `close-on="mousedown"`，面板外按下任意鼠标键或页面滚动即收起，可用 `dropdown-props` 覆盖 | 点击 `droplistMask` 全屏遮罩收起；`hideOnClick`（默认 `true`）时点菜单项也收起 |
| 交互反馈           | hover 变 `text-primary`                                                          | 按压（`active:`）变 `text-primary`，触屏无 hover                      |
| 不可跳转条目的命中 | 仅 `cursor-default`，节点仍可接收点击                                            | 追加 `pointer-events-none`，节点收不到点击（带下拉时补回 `pointer-events-auto`） |
| 暗色适配           | 只用灰阶 token，暗色由主题整条翻转，**禁写 `dark:` 前缀**                         | 下拉面板与菜单项显式写 `dark:` 变体                                   |
| 键盘操作           | 浮层锚点 `tabindex=0`，`Enter` / `空格` 开合、`Esc` 收起，带 `role="menu"` 语义   | 触屏环境，无键盘操作                                                  |
| 文字色             | `text-gray-9`                                                                    | `text-gray-8`（本端灰阶只到 8，与 Web 的 gray-9 对应）                |
| 首尾判定           | 折叠时靠容器下发的首项标记 + CSS `:last-child`                                    | 首尾均由容器按注册索引下发，不依赖 `:first-child` / `:last-child`     |
| 尺寸体系           | `text-sm` / `gap-x-1.5` / `size-4` 等 px 体系                                    | `text-28` / `gap-x-[12rpx]` / `w-[32rpx]` 等 rpx 体系                 |
| `ui` 结构键        | 含 `droplistDivider`（配合 `RebornDropdownItem` 的 `divided`）                   | 含 `droplistMask`（全屏点击遮罩）                                     |

## 注意事项

- 同名的自定义插槽优先级高于属性，条目级配置优先级高于容器级配置。
- 末项会被识别为当前页，即使传了 `to` 也不会渲染成链接。
- `routes` 与默认插槽互斥：传了 `routes` 时默认插槽不再渲染。
- 首尾状态与 `max-count` 折叠依赖条目在挂载时向容器登记的顺序。使用 `v-if` / `v-for` 动态增删条目时，推荐改用 `routes` 数据驱动，避免顺序错位。
- 折叠时省略号节点在文档结构上位于最前，靠 flex `order` 归位；若自行覆盖 `ui.root` 请勿移除 `flex` 布局。
- 自定义类名两端同名，容器与条目都用 `custom-class`（不是 `class`）。
- 下拉菜单的开合是「点击」触发，不是悬停：点条目本体展开，再点一次收起；Web 端 `Enter` / `空格` 同样开合，`Esc` 收起。
