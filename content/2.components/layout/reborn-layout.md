---
title: Layout 布局
description: 由顶栏、侧边栏、主区域、底栏拼装后台页面骨架的容器组件，方向可自动推断，侧边栏支持收起与响应式断点。
category: 布局
platform: web
tags: [css, tailwind, layout, container, flex]
---

::ComponentViewer{demoFile="RebornLayoutDemo.vue" config="RebornLayoutConfig" componentId="reborn-layout" :componentFiles='["RebornLayout.vue", "RebornLayoutHeader.vue", "RebornLayoutAside.vue", "RebornLayoutMain.vue", "RebornLayoutFooter.vue", "reborn-layout.config.ts"]'}
::

## 简介

Layout 是一组仅 Web 端提供的页面骨架组件，由 `RebornLayout`、`RebornLayoutHeader`、`RebornLayoutAside`、`RebornLayoutMain`、`RebornLayoutFooter` 五个组件拼装而成，本身只负责 flex 排版，不带底色与边框。

`RebornLayout` 未传 `direction` 时会扫描默认插槽：子元素中出现 Header 或 Footer 即纵向堆叠，否则横向排列。「顶栏 + 左右」这类组合靠嵌套一个 `RebornLayout` 实现，嵌套层自带 `flex-auto`，会占满父级剩余空间。

Header / Footer 用 `height`、Aside 用 `width` 控制尺寸，值经 CSS 变量下发，因此接受任意合法 CSS 长度。Aside 额外提供 `collapsible` 收起、`collapsedWidth` 零宽收起、`breakpoint` 响应式断点与 `trigger` 插槽；Main 自带 `overflow-auto`，长内容只在主区内滚动。

### 何时使用

- 搭建后台管理页骨架：顶栏 + 侧边导航 + 内容区 + 底栏的任意组合。
- 侧边栏需要收起为图标栏，用 `collapsible` 配合 `v-model:collapsed`。
- 窄屏下侧边栏要自动收起，用 `breakpoint` 监听视口宽度。
- 希望顶栏与侧边栏固定、只让内容区滚动，直接利用 `RebornLayoutMain` 的独立滚动。
- 服务端渲染下想避免方向推断带来的首帧闪动，显式传 `direction` 或 `hasSider`。

### 何时不使用

- 文档或落地页正文只需要限宽居中 —— 改用 `RebornContainer`。
- 需要带交互的站点导航头（移动端抽屉、吸顶） —— 改用 `RebornHeader`。
- 只是把几个元素横向或纵向排开 —— 直接写 flex 类名，不必引入布局家族。

## 用法

### 基础用法

`RebornLayout` 的直接子元素为 Header / Aside / Main / Footer 中的一个或多个。出现 Header 或 Footer 时自动纵向排列，否则横向；「上 + 左右」「左 + 上下」通过嵌套一层 `RebornLayout` 完成。

```vue
<template>
  <!-- 上 + 左右：外层含 Header 推断为纵向，内层只有 Aside 与 Main 推断为横向 -->
  <RebornLayout class="h-screen">
    <RebornLayoutHeader>顶栏</RebornLayoutHeader>
    <RebornLayout>
      <RebornLayoutAside width="160px">侧边栏</RebornLayoutAside>
      <RebornLayoutMain>主区域</RebornLayoutMain>
    </RebornLayout>
  </RebornLayout>
</template>
```

### 顶部通栏 + 侧边子导航

顶栏放一级水平菜单，下方嵌套层放二级侧边菜单与内容区。内层显式写 `has-sider`，跳过子节点扫描，直接按横向排列。

```vue
<template>
  <RebornLayout class="h-full">
    <RebornLayoutHeader height="56px" class="flex items-center gap-6">
      <RebornMenu mode="horizontal" />
    </RebornLayoutHeader>
    <RebornLayout has-sider>
      <RebornLayoutAside :width="220" class="border-gray-2 border-r">
        <RebornMenu mode="vertical" />
      </RebornLayoutAside>
      <RebornLayoutMain>内容</RebornLayoutMain>
    </RebornLayout>
  </RebornLayout>
</template>
```

### 侧边布局：可收起侧栏

侧边栏通高，右侧为顶栏 + 内容 + 底栏。开启 `collapsible` 后底部出现折叠触发器，宽度在 `width` 与 `collapsedWidth`（默认 `80`）之间过渡；把 `collapsed` 同步给菜单的 `collapse`，收起后菜单只显示图标。

```vue
<script setup lang="ts">
const collapsed = ref(false);
</script>

<template>
  <RebornLayout has-sider class="h-full">
    <RebornLayoutAside v-model:collapsed="collapsed" collapsible>
      <RebornMenu mode="vertical" :collapse="collapsed" />
    </RebornLayoutAside>
    <RebornLayout>
      <RebornLayoutHeader>顶栏</RebornLayoutHeader>
      <RebornLayoutMain>内容</RebornLayoutMain>
      <RebornLayoutFooter height="40px">底栏</RebornLayoutFooter>
    </RebornLayout>
  </RebornLayout>
</template>
```

### 折叠触发器：插槽与外部控制

`trigger` 插槽的参数 `collapsed` 可用来切换图标与文字，插槽优先于 `trigger` 属性。`:trigger="null"` 会隐藏所有触发器，此时改由外部按钮改写 `v-model:collapsed`。`collapse` 事件的第二个参数区分来源：`clickTrigger` 表示点击触发器，`responsive` 表示响应式断点。

```vue
<template>
  <!-- 插槽自定义触发器内容 -->
  <RebornLayoutAside v-model:collapsed="collapsed" collapsible @collapse="(c, type) => console.log(c, type)">
    菜单
    <template #trigger="{ collapsed }">
      <Icon :name="collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" />
    </template>
  </RebornLayoutAside>

  <!-- 隐藏触发器，由外部按钮控制 -->
  <RebornButton @click="collapsed = !collapsed">切换</RebornButton>
  <RebornLayoutAside v-model:collapsed="collapsed" collapsible :trigger="null">菜单</RebornLayoutAside>
</template>
```

::tip
外部按钮只改 `v-model:collapsed`，不会触发 `collapse` 事件——该事件只在点击内置触发器、调用 `toggle()` 或跨过断点时派发。
::

### 零宽收起与右侧侧栏

`collapsedWidth` 设为 `0` 时侧边栏可完全收起，底部触发器换成贴在侧边栏外缘的特殊触发器，行内样式用 `zeroWidthTriggerStyle` 定制。侧边栏放在右侧时加 `reverse-arrow`，特殊触发器改贴左外缘，底部触发器的箭头方向同步翻转。

```vue
<template>
  <RebornLayout has-sider class="h-full">
    <RebornLayoutMain>内容</RebornLayoutMain>
    <RebornLayoutAside v-model:collapsed="collapsed" collapsible reverse-arrow :collapsed-width="0">
      菜单
    </RebornLayoutAside>
  </RebornLayout>
</template>
```

配置 `breakpoint`（`xs` 480 / `sm` 576 / `md` 768 / `lg` 992 / `xl` 1200 / `xxl` 1600，单位 px）后，视口跨过断点时自动收起或展开，并派发 `breakpoint` 事件。

### 固定头部与侧栏：主区独立滚动

`RebornLayoutMain` 默认带 `overflow-auto`，只要外层容器高度固定（如 `h-screen`），长内容就只在主区内滚动，顶栏与侧边栏自然保持原位，无需额外写 `sticky` 或 `fixed`。

```vue
<template>
  <RebornLayout class="h-screen">
    <RebornLayoutHeader height="56px">固定头部</RebornLayoutHeader>
    <RebornLayout has-sider>
      <RebornLayoutAside :width="180">菜单</RebornLayoutAside>
      <RebornLayoutMain>
        <p v-for="k in 20" :key="k">长内容 {{ k }}</p>
      </RebornLayoutMain>
    </RebornLayout>
  </RebornLayout>
</template>
```

### 排列方向：显式覆盖推断

`direction` 会跳过子节点扫描、直接决定主轴方向。下例两组子元素相同：含 Header 时自动推断为纵向，传 `direction="horizontal"` 可强制横向。

```vue
<template>
  <RebornLayout direction="horizontal">
    <RebornLayoutHeader height="auto" class="w-32">Header</RebornLayoutHeader>
    <RebornLayoutMain>Main</RebornLayoutMain>
  </RebornLayout>
</template>
```

### 尺寸：顶栏高度与侧栏宽度

Header / Footer 的 `height` 为字符串，默认 `60px`；Aside 的 `width` 数字视为 px，字符串原样使用，默认 `200`。三者都经 CSS 变量下发，可以写 `px`、`rem`、百分比或 `auto`。

```vue
<template>
  <RebornLayout class="h-full">
    <RebornLayoutHeader height="80px">Header · 80px</RebornLayoutHeader>
    <RebornLayout>
      <RebornLayoutAside width="25%">Aside · 25%</RebornLayoutAside>
      <RebornLayoutMain>Main</RebornLayoutMain>
    </RebornLayout>
    <RebornLayoutFooter height="40px">Footer · 40px</RebornLayoutFooter>
  </RebornLayout>
</template>
```

### 自定义样式：class 与 ui

五个组件都接受 `class` 与 `ui`。`class` 与 `ui` 中对应根节点的键合并到同一节点；Aside 的内容滚动区与触发器只能经 `ui` 覆盖。完整键位见 API 中的「自定义样式（ui）」。

```vue
<template>
  <RebornLayout class="h-full" :ui="{ root: 'gap-2 p-2' }">
    <RebornLayoutHeader :ui="{ header: 'rounded-lg bg-primary text-inverted' }">自定义顶栏</RebornLayoutHeader>
    <RebornLayout>
      <RebornLayoutAside width="140px" :ui="{ aside: 'rounded-lg bg-elevated' }">自定义侧边栏</RebornLayoutAside>
      <RebornLayoutMain :ui="{ main: 'rounded-lg bg-muted/40' }">自定义主区域</RebornLayoutMain>
    </RebornLayout>
  </RebornLayout>
</template>
```

## API

### Props

#### RebornLayout

| 属性名      | 类型                         | 默认值    | 描述                                                                                                      |
| ----------- | ---------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `direction` | `'horizontal' \| 'vertical'` | `-`       | 排列方向。不传时由子元素自动推断：出现 Header 或 Footer 为纵向，否则横向。                                |
| `hasSider`  | `boolean`                    | `false`   | 表示子元素里有 Aside（Sider），强制横向排列，一般不用指定。可用于服务端渲染时避免自动判定造成的样式闪动。 |
| `as`        | `string \| Component`        | `section` | 渲染的 HTML 元素或组件。                                                                                  |
| `class`     | `any`                        | `-`       | 根节点自定义类名，与 `ui.root` 合并。                                                                     |
| `ui`        | `{ root?: ClassValue }`      | `-`       | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                              |

#### RebornLayoutHeader

| 属性名   | 类型                      | 默认值   | 描述                                         |
| -------- | ------------------------- | -------- | -------------------------------------------- |
| `height` | `string`                  | `60px`   | 顶栏高度，接受任意合法 CSS 长度。            |
| `as`     | `string \| Component`     | `header` | 渲染的 HTML 元素或组件。                     |
| `class`  | `any`                     | `-`      | 自定义类名，与 `ui.header` 合并。            |
| `ui`     | `{ header?: ClassValue }` | `-`      | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

#### RebornLayoutAside（Sider）

| 属性名                  | 类型                                                | 默认值  | 描述                                                                                                 |
| ----------------------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `width`                 | `number \| string`                                  | `200`   | 展开宽度，数字视为 px，也接受任意合法 CSS 长度。                                                     |
| `collapsible`           | `boolean`                                           | `false` | 是否可收起，开启后底部显示折叠触发器。未开启时 `collapsed` 不影响宽度。                              |
| `collapsed`             | `boolean`                                           | `-`     | 当前收起状态，对应 `v-model:collapsed`；不传时走非受控，初始值取 `defaultCollapsed`。                |
| `defaultCollapsed`      | `boolean`                                           | `false` | 非受控模式下是否默认收起。                                                                           |
| `collapsedWidth`        | `number`                                            | `80`    | 收起宽度（px）；设置为 `0` 时底部触发器替换为贴在侧边栏外缘的特殊触发器。                            |
| `reverseArrow`          | `boolean`                                           | `false` | 翻转折叠箭头方向与零宽触发器贴边，Sider 在右边时使用。                                               |
| `trigger`               | `string \| null`                                    | `-`     | 自定义触发器文字；设置为 `null` 时隐藏所有触发器（含零宽触发器）。`trigger` 插槽优先于本属性。       |
| `zeroWidthTriggerStyle` | `CSSProperties`                                     | `-`     | `collapsedWidth` 为 `0` 时特殊触发器的行内样式。                                                     |
| `breakpoint`            | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'`     | `-`     | 响应式断点（480 / 576 / 768 / 992 / 1200 / 1600px），视口跨过断点时自动收起或展开。                  |
| `as`                    | `string \| Component`                               | `aside` | 渲染的 HTML 元素或组件。                                                                             |
| `class`                 | `any`                                               | `-`     | 自定义类名，与 `ui.aside` 合并到根节点。                                                             |
| `ui`                    | `{ aside?, asideContent?, trigger?, zeroTrigger? }` | `-`     | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                         |

#### RebornLayoutMain

| 属性名  | 类型                    | 默认值 | 描述                                         |
| ------- | ----------------------- | ------ | -------------------------------------------- |
| `as`    | `string \| Component`   | `main` | 渲染的 HTML 元素或组件。                     |
| `class` | `any`                   | `-`    | 自定义类名，与 `ui.main` 合并。              |
| `ui`    | `{ main?: ClassValue }` | `-`    | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

#### RebornLayoutFooter

| 属性名   | 类型                      | 默认值   | 描述                                         |
| -------- | ------------------------- | -------- | -------------------------------------------- |
| `height` | `string`                  | `60px`   | 底栏高度，接受任意合法 CSS 长度。            |
| `as`     | `string \| Component`     | `footer` | 渲染的 HTML 元素或组件。                     |
| `class`  | `any`                     | `-`      | 自定义类名，与 `ui.footer` 合并。            |
| `ui`     | `{ footer?: ClassValue }` | `-`      | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

### Emits

仅 `RebornLayoutAside` 派发事件。

| 事件名             | 参数                                                         | 描述                                                                    |
| ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `collapse`         | `(collapsed: boolean, type: 'clickTrigger' \| 'responsive')` | 收起状态经触发器、`toggle()` 或响应式断点改变时触发；状态未变时不派发。 |
| `breakpoint`       | `(broken: boolean)`                                          | 视口跨过响应式断点时触发，`broken` 表示是否已低于断点。                 |
| `update:collapsed` | `(collapsed: boolean)`                                       | 收起状态变化，对应 `v-model:collapsed`。                                |

### Slots

| 插槽名    | 所属组件            | 参数                     | 描述                                                                        |
| --------- | ------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `default` | 全部五个组件        | `-`                      | 承载各自区块的内容。                                                        |
| `trigger` | `RebornLayoutAside` | `{ collapsed: boolean }` | 自定义底部折叠触发器内容（零宽特殊触发器同样使用），优先于 `trigger` 属性。 |

### Expose

仅 `RebornLayoutAside` 暴露方法。

| 方法       | 描述                                                         |
| ---------- | ------------------------------------------------------------ |
| `toggle()` | 切换收起状态，等价于点击触发器（`type` 为 `clickTrigger`）。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。**五个组件各有自己的 `ui`，只认自己的键**：传给 `RebornLayout` 的 `header` 不会作用到子组件。

| 键名           | 传给                 | 说明                                                                                                                                                                         |
| -------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | `RebornLayout`       | 布局容器。默认 `box-border flex min-h-0 min-w-0 flex-auto basis-auto`，主轴方向类 `flex-row` / `flex-col` 由 `direction` 或自动推断决定；整体高度、间距、边框改这里。        |
| `header`       | `RebornLayoutHeader` | 顶栏。默认 `box-border shrink-0 px-5 h-[var(--reborn-layout-header-height)]`，高度走 CSS 变量，底色与分割线加在这里。                                                        |
| `aside`        | `RebornLayoutAside`  | 侧栏根节点。默认 `relative box-border flex shrink-0 flex-col w-[var(--reborn-layout-aside-width)] transition-[width]`，宽度走 CSS 变量并带折叠过渡。                         |
| `asideContent` | `RebornLayoutAside`  | 侧栏内容滚动区，始终渲染。默认 `min-h-0 min-w-0 flex-1 overflow-auto`，滚动行为从根节点下放到这里。                                                                          |
| `trigger`      | `RebornLayoutAside`  | 底部折叠触发器。**仅 `collapsible` 为真、`trigger` 不为 `null` 且 `collapsedWidth` 非 0 时渲染**，默认 `h-[48px]` 通栏、顶部 `border-gray-2` 分隔线。                        |
| `zeroTrigger`  | `RebornLayoutAside`  | 零宽特殊触发器。**仅 `collapsible` 为真、`collapsedWidth` 为 0 且 `trigger` 不为 `null` 时渲染**，36×42 的 `absolute top-[64px]` 按钮贴在侧边栏外缘，贴边随 `reverseArrow` 翻转。 |
| `main`         | `RebornLayoutMain`   | 主区。默认 `box-border block min-w-0 flex-1 basis-auto overflow-auto p-5`，内容内边距与滚动行为改这里。                                                                      |
| `footer`       | `RebornLayoutFooter` | 底栏。默认 `box-border shrink-0 px-5 h-[var(--reborn-layout-footer-height)]`，高度走 CSS 变量。                                                                              |

```vue
<template>
  <RebornLayout :ui="{ root: 'h-screen' }">
    <RebornLayoutHeader :ui="{ header: 'border-b border-gray-2' }">顶栏</RebornLayoutHeader>
    <RebornLayout>
      <RebornLayoutAside
        collapsible
        :ui="{ aside: 'bg-gray-1', asideContent: 'py-2', trigger: 'border-gray-3' }"
      >
        侧栏
      </RebornLayoutAside>
      <RebornLayoutMain :ui="{ main: 'p-6' }">内容</RebornLayoutMain>
    </RebornLayout>
  </RebornLayout>
</template>
```

### 与相似组件的区别

| 组件                | 用途                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `RebornLayout` 家族 | 后台页面骨架拼装，纯 flex 布局，无视觉样式。                     |
| `RebornContainer`   | 限宽居中的内容容器（`max-w` + `mx-auto`），用于文档/落地页正文。 |
| `RebornHeader`      | 带交互的站点导航头，内置移动端抽屉与吸顶模式。                   |
| `RebornMain`        | 语义化 `<main>` 包装，不参与 flex 拼版。                         |

## 注意事项

- **Header / Aside / Main / Footer 必须放在 `RebornLayout` 里。** 它们的 `shrink-0`、`flex-1` 等尺寸类依赖父级是 flex 容器，脱离容器单独使用时尺寸不生效。
- **方向推断只认组件名。** `RebornLayout` 按子节点的组件名 `RebornLayoutHeader` / `RebornLayoutFooter` 判断，会展开 `v-for` 与 `<template>` 产生的 Fragment；但把 Header 包进自定义组件后就识别不到，此时请显式传 `direction`。
- **方向每次渲染都重新判定。** 插槽节点不是响应式数据，组件刻意不做缓存，所以 `v-if` 增删 Header 时方向会跟着变；服务端渲染下若首帧判定与预期不同，用 `direction` 或 `hasSider` 固定。
- **外层要有确定高度，Main 才会独立滚动。** Main 的 `overflow-auto` 只在父级高度受限时生效，最外层 `RebornLayout` 通常需要 `h-screen` 或固定高度。
- **收起宽度只在 `collapsible` 为真时生效。** 未开启时即使 `collapsed` 为 `true`，宽度仍取 `width`；零宽触发器同样要求 `collapsible`。
- **`breakpoint` 挂载时只会收起、不会展开。** 挂载时视口已低于断点才收起，否则保留 `defaultCollapsed` 或受控值；之后跨过断点才会双向切换。
- **`trigger` 传 `null` 与不传是两回事。** 不传显示默认箭头，`null` 隐藏底部与零宽两种触发器，此时只能通过 `v-model:collapsed` 或 `toggle()` 控制。
