---
title: Layout布局容器
description: 由顶栏、侧边栏、主区域、底栏拼装后台页面骨架的容器组件，方向可自动推断。
category: 布局
platform: web
tags: [css, tailwind, layout, container, flex]
---

::ComponentViewer{demoFile="RebornLayoutDemo.vue" config="RebornLayoutConfig" componentId="reborn-layout" :componentFiles='["RebornLayout.vue", "RebornLayoutHeader.vue", "RebornLayoutAside.vue", "RebornLayoutMain.vue", "RebornLayoutFooter.vue", "reborn-layout.config.ts"]'}

#api

## API

### 结构约束

- `RebornLayout` 的直接子元素必须是 `RebornLayoutHeader`、`RebornLayoutAside`、`RebornLayoutMain`、`RebornLayoutFooter` 或嵌套的 `RebornLayout` 之一。
- 后四者的父元素必须是 `RebornLayout`，脱离容器单独使用时 flex 尺寸不生效。
- 未传 `direction` 时，容器会扫描默认插槽：命中 Header 或 Footer 即纵向排列，否则横向。

### RebornLayout

| 属性名      | 类型                         | 默认值    | 描述                                                                                                      |
| ----------- | ---------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `direction` | `'horizontal' \| 'vertical'` | `-`       | 排列方向。不传时由子元素自动推断。                                                                        |
| `hasSider`  | `boolean`                    | `false`   | 表示子元素里有 Aside（Sider），强制横向排列，一般不用指定。可用于服务端渲染时避免自动判定造成的样式闪动。 |
| `as`        | `string \| Component`        | `section` | 渲染的 HTML 元素或组件。                                                                                  |
| `class`     | `any`                        | `-`       | 根节点自定义类名。                                                                                        |
| `ui`        | `{ root?: ClassValue }`      | `-`       | 细粒度样式覆盖。                                                                                          |

### RebornLayoutHeader

| 属性名   | 类型                      | 默认值   | 描述                              |
| -------- | ------------------------- | -------- | --------------------------------- |
| `height` | `string`                  | `60px`   | 顶栏高度，接受任意合法 CSS 长度。 |
| `as`     | `string \| Component`     | `header` | 渲染的 HTML 元素或组件。          |
| `class`  | `any`                     | `-`      | 自定义类名。                      |
| `ui`     | `{ header?: ClassValue }` | `-`      | 细粒度样式覆盖。                  |

### RebornLayoutAside（Sider）

| 属性名                  | 类型                                                | 默认值  | 描述                                                                                           |
| ----------------------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `width`                 | `number \| string`                                  | `200`   | 展开宽度，数字视为 px，也接受任意合法 CSS 长度。                                               |
| `collapsible`           | `boolean`                                           | `false` | 是否可收起，开启后底部显示折叠触发器。                                                         |
| `collapsed`             | `boolean`                                           | `-`     | 当前收起状态，对应 `v-model:collapsed`。                                                       |
| `defaultCollapsed`      | `boolean`                                           | `false` | 非受控模式下是否默认收起。                                                                     |
| `collapsedWidth`        | `number`                                            | `80`    | 收起宽度（px）；设置为 `0` 时出现贴在侧边栏外缘的特殊触发器。                                  |
| `reverseArrow`          | `boolean`                                           | `false` | 翻转折叠箭头方向与零宽触发器贴边，Sider 在右边时可以使用。                                     |
| `trigger`               | `string \| null`                                    | `-`     | 自定义触发器文字；设置为 `null` 时隐藏所有触发器（含零宽触发器）。`trigger` 插槽优先于本属性。 |
| `zeroWidthTriggerStyle` | `CSSProperties`                                     | `-`     | 指定 `collapsedWidth` 为 `0` 时出现的特殊触发器的行内样式。                                    |
| `breakpoint`            | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'`     | `-`     | 响应式断点（480/576/768/992/1200/1600px），视口跨过断点时自动收起/展开。                       |
| `as`                    | `string \| Component`                               | `aside` | 渲染的 HTML 元素或组件。                                                                       |
| `class`                 | `any`                                               | `-`     | 自定义类名。                                                                                   |
| `ui`                    | `{ aside?, asideContent?, trigger?, zeroTrigger? }` | `-`     | 细粒度样式覆盖。                                                                               |

#### Aside 事件

| 事件名             | 参数                                                         | 描述                                                    |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------- |
| `collapse`         | `(collapsed: boolean, type: 'clickTrigger' \| 'responsive')` | 展开-收起时触发，有点击触发器与响应式断点两种来源。     |
| `breakpoint`       | `(broken: boolean)`                                          | 视口跨过响应式断点时触发，`broken` 表示是否已低于断点。 |
| `update:collapsed` | `(collapsed: boolean)`                                       | 收起状态变化，对应 `v-model:collapsed`。                |

#### Aside 暴露方法

| 方法       | 描述                                                         |
| ---------- | ------------------------------------------------------------ |
| `toggle()` | 切换收起状态，等价于点击触发器（`type` 为 `clickTrigger`）。 |

### RebornLayoutMain

| 属性名  | 类型                    | 默认值 | 描述                     |
| ------- | ----------------------- | ------ | ------------------------ |
| `as`    | `string \| Component`   | `main` | 渲染的 HTML 元素或组件。 |
| `class` | `any`                   | `-`    | 自定义类名。             |
| `ui`    | `{ main?: ClassValue }` | `-`    | 细粒度样式覆盖。         |

### RebornLayoutFooter

| 属性名   | 类型                      | 默认值   | 描述                              |
| -------- | ------------------------- | -------- | --------------------------------- |
| `height` | `string`                  | `60px`   | 底栏高度，接受任意合法 CSS 长度。 |
| `as`     | `string \| Component`     | `footer` | 渲染的 HTML 元素或组件。          |
| `class`  | `any`                     | `-`      | 自定义类名。                      |
| `ui`     | `{ footer?: ClassValue }` | `-`      | 细粒度样式覆盖。                  |

### 插槽

| 插槽名    | 所属组件            | 参数                     | 描述                                                                        |
| --------- | ------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `default` | 全部五个组件        | `-`                      | 承载各自区块的内容。                                                        |
| `trigger` | `RebornLayoutAside` | `{ collapsed: boolean }` | 自定义底部折叠触发器内容（零宽特殊触发器同样使用），优先于 `trigger` 属性。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件家族仅 Web 端提供，**五个组件各有自己的 `ui`，且各自只有一个键**——键名与组件同名，传给谁就只影响谁的根节点。

| 键名           | 传给                 | 说明                                                                                                                                                 |
| -------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | `RebornLayout`       | 布局容器。默认 `box-border flex min-h-0 min-w-0 flex-auto basis-auto`，主轴方向由 `direction` 与子节点自动推导；整体高度、边框改这里。               |
| `header`       | `RebornLayoutHeader` | 顶栏。默认 `box-border shrink-0 px-5 h-[var(--reborn-layout-header-height)]`，高度走 CSS 变量，底色与分割线加在这里。                                |
| `aside`        | `RebornLayoutAside`  | 侧栏根节点。默认 `relative box-border flex shrink-0 flex-col w-[var(--reborn-layout-aside-width)] transition-[width]`，宽度走 CSS 变量并带折叠过渡。 |
| `asideContent` | `RebornLayoutAside`  | 侧栏内容滚动区。默认 `min-h-0 min-w-0 flex-1 overflow-auto`，滚动行为从根节点下放到这里。                                                            |
| `trigger`      | `RebornLayoutAside`  | 底部折叠触发器。**仅 `collapsible` 为真且 `collapsedWidth` 非 0 时渲染**，默认 48px 高通栏、顶部 `gray-2` 分隔线。                                   |
| `zeroTrigger`  | `RebornLayoutAside`  | 零宽特殊触发器。**仅 `collapsedWidth` 为 0 时渲染**，36×42 按钮贴在侧边栏外缘，贴边随 `reverseArrow` 翻转。                                          |
| `main`         | `RebornLayoutMain`   | 主区。默认 `box-border block min-w-0 flex-1 basis-auto overflow-auto p-5`，内容内边距与滚动行为改这里。                                              |
| `footer`       | `RebornLayoutFooter` | 底栏。默认 `box-border shrink-0 px-5 h-[var(--reborn-layout-footer-height)]`，高度走 CSS 变量。                                                      |

```vue
<template>
  <RebornLayout :ui="{ root: 'h-screen' }">
    <RebornLayoutHeader :ui="{ header: 'border-b border-gray-2' }">顶栏</RebornLayoutHeader>
    <RebornLayout>
      <RebornLayoutAside :ui="{ aside: 'bg-gray-1' }">侧栏</RebornLayoutAside>
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

::
