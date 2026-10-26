---
title: 悬浮按钮 (Fab)
description: 用于固定位置悬浮操作入口的按钮组件，支持拖拽吸边与展开动作面板，双端可用。
category: 导航
platform: both
tags: [vue, reborn-fab, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornFabDemo.vue" config="RebornFabConfig" componentId="reborn-fab" :componentFiles='["RebornFab.vue", "reborn-fab.config.ts"]' :uniappFiles='["RebornFab.vue", "reborn-fab.config.ts"]' dependencies="clsx, tailwind-variants"}
::

## 简介

Fab 是 Web 与 UniApp 均可用的悬浮操作入口，可固定在页面角落并展开动作面板。

`position` 提供预设位置，也可用 top / bottom / left / right 定位；`expandable` 开启后按 `direction` 展开，UniApp 推荐用 items 驱动动作。

`draggable` 允许拖动并吸附屏幕侧边，按剩余空间调整展开方向；Web 另有胶囊、环形变体和 `peekOnScroll` 滚动半隐藏，尺寸与插槽样式可独立定制。

### 何时使用

- 页面角落需要常驻操作——用 `position` 设置四角位置。
- 一个入口需要展开多项操作——用 `expandable` 配合 `direction`。
- 触屏上希望用户自由摆放入口——开启 `draggable`。

### 何时不使用

- 操作位于正常文档流中——改用 `reborn-button`。
- 只需要滚动后显示回顶入口——改用 `reborn-back-top`。

## 用法

### 基础用法（点击直触发）

`expandable` 为 `false` 时点击主按钮直接触发 `click` 事件，不展开面板；`position` 设定四角预设位置，`color` 控制主题色。

```vue
<template>
  <RebornFab
    position="right-bottom"
    color="primary"
    :expandable="false"
    @click="uni.showToast({ title: '点击了主按钮', icon: 'none' })"
  />
</template>
```

### 展开动作面板

开启 `expandable` 后点按切换展开，`v-model` 绑定展开状态，`direction` 控制展开方向。UniApp 端推荐传 `items` 由组件内渲染（多端样式一致），点击项触发 `action`；也可用 default 插槽自定义动作内容。

```vue
<script setup lang="ts">
const items = [
  { name: "分享", icon: "i-lucide-share-2", color: "primary" },
  { name: "收藏", icon: "i-lucide-star", color: "warning" },
];
</script>

<template>
  <RebornFab
    v-model="active"
    expandable
    direction="top"
    :items="items"
    @action="({ name }) => uni.showToast({ title: name, icon: 'none' })"
  />
</template>
```

### 拖拽吸边与滚动半隐藏

`draggable` 开启拖拽，松手后自动吸附最近的左右屏幕边（`attract` 默认开启）并按剩余空间自动切换展开方向；`gap` 控制吸附后与屏幕边缘的间距。Web 端 `peekOnScroll` 让按钮在页面滚动时贴边半隐藏，滚动停止约 1s 后复位。

```vue
<template>
  <RebornFab
    draggable
    attract
    peek-on-scroll
    :gap="{ top: 32, bottom: 32, left: 16, right: 16 }"
  />
</template>
```

### 变体与环形布局（Web）

`variant` 支持 `float`（默认纵横展开）、`capsule`（胶囊内嵌水平展开，可配 `divider` 分割线）、`circle`（子动作绕主按钮环形分布）三种形态；环形布局用 `radius` / `startAngle` / `totalAngle` 微调半径与角度。

```vue
<template>
  <RebornFab v-model="active" variant="circle" expandable :radius="90" :total-angle="360">
    <div v-for="i in 5" :key="i" class="flex size-10 items-center justify-center rounded-full bg-indigo-500 text-white">
      {{ i }}
    </div>
  </RebornFab>
</template>
```

## API
### Props

| 属性名         | 类型                                                                                     | 默认值                                           | 描述                                                                                                | 平台   |
| -------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------ |
| `modelValue` | `boolean`                                                                                | `undefined`                                          | 绑定值，控制展开状态（`v-model`）。                                                                 | 通用   |
| `active` | `boolean`                                                                                | `false`                                          | 是否默认展开。                                                                                      | 通用   |
| `position` | `'left-top' \| 'right-top' \| 'left-bottom' \| 'right-bottom'`                           | `'right-bottom'`                                 | 预设位置。                                                                                          | 通用   |
| `top` | `string \| number`                                                                       | -                                                | 自定义顶部距离。                                                                                    | 通用   |
| `bottom` | `string \| number`                                                                       | -                                                | 自定义底部距离。                                                                                    | 通用   |
| `left` | `string \| number`                                                                       | -                                                | 自定义左侧距离。                                                                                    | 通用   |
| `right` | `string \| number`                                                                       | -                                                | 自定义右侧距离。                                                                                    | 通用   |
| `trigger` | `'click' \| 'hover'`                                                                     | `'click'`                                        | 触发方式。                                                                                          | Web    |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'`                                                 | `'top'`                                          | 展开方向。                                                                                          | 通用   |
| `variant` | `'float' \| 'capsule' \| 'circle'`                                                       | `'float'`                                        | UI 变体：悬浮 / 胶囊 / 环形。                                                                       | Web    |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`   | `'primary'`                                      | 主题颜色。                                                                                          | 通用   |
| `disabled` | `boolean`                                                                                | `false`                                          | 是否禁用。                                                                                          | 通用   |
| `draggable` | `boolean`                                                                                | `false`                                          | 是否可拖拽。拖拽结束后自动吸附最近的左右屏幕边并按剩余空间调整展开方向。                            | 通用   |
| `attract` | `boolean`                                                                                | `true`                                           | 拖拽结束后是否自动吸附到最近的屏幕侧边。                                                            | Web    |
| `peekOnScroll` | `boolean`                                                                                | `false`                                          | 页面滚动时是否自动贴边半隐藏（滚动停止约 1s 后复位；点击、按下或悬停立即复位）。与 `attract` 独立。 | Web    |
| `expandable` | `boolean`                                                                                | Web `true` / UniApp `false`                      | 是否可展开动作面板；为 `false` 时点击直接触发 `click`。                                             | 通用   |
| `gap` | `{ top?: number; left?: number; right?: number; bottom?: number }`                       | Web `{ 32,32,32,32 }` / UniApp `{ 16,16,16,16 }` | 距屏幕边缘的间距，用于拖拽边界与预设定位计算。                                                      | 通用   |
| `items` | `FabActionItem[]`                                                                        | `[]`                                             | 动作列表：有数据时由组件内 v-for 渲染（推荐小程序端使用），无数据时回退为默认插槽。                 | UniApp |
| `inactiveIcon` | `string`                                                                                 | Web `'lucide:plus'` / UniApp `'i-lucide-plus'`   | 非激活状态图标。                                                                                    | 通用   |
| `activeIcon` | `string`                                                                                 | Web `'lucide:plus'` / UniApp `'i-lucide-plus'`   | 激活状态图标。                                                                                      | 通用   |
| `divider` | `boolean`                                                                                | -                                                | 胶囊变体下是否在动作区与触发按钮之间显示分割线。                                                    | Web    |
| `radius` | `number`                                                                                 | -                                                | 环形布局半径（px）。                                                                                | Web    |
| `startAngle` | `number`                                                                                 | -                                                | 环形布局起始角度（默认 -90，正上方）。                                                              | Web    |
| `totalAngle` | `number`                                                                                 | -                                                | 环形布局总角度（默认 360，一整圈）。                                                                | Web    |
| `zIndex` | `number`                                                                                 | `99`                                             | 组件层级 z-index。                                                                                  | 通用   |
| `customClass` | `string`                                                                                 | -                                                | 自定义根元素类名。                                                                                  | 通用   |
| `customStyle` | `string \| CSSProperties`                                                                | -                                                | 自定义根元素样式。                                                                                  | 通用   |
| `ui` | `object`                                                                                 | `{}`                                             | 按内部结构键覆盖类名，见下方「自定义样式（ui）」。                                                  | 通用   |

### Emits

| 事件名              | 参数                                | 描述                                                                     | 平台   |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------ | ------ |
| `update:modelValue` | `(value: boolean)`                  | 更新展开状态绑定值，点击或调用 `open()` / `close()` 时立即触发。         | 通用   |
| `click`             | `()`                                | 当组件非可展开（`expandable` 为假）状态下被点击时触发。                  | 通用   |
| `action`            | `({ name: string, index: number })` | 点击某条 `items` 动作时触发。                                            | UniApp |
| `open`              | `()`                                | 动作面板开始展开时立即触发（动画启动时刻）。                             | Web    |
| `opened`            | `()`                                | 展开动画结束后触发（约 400ms 后）。                                      | Web    |
| `close`             | `()`                                | 动作面板开始收起时立即触发（动画启动时刻）。                             | Web    |
| `closed`            | `()`                                | 收起动画结束后触发（约 400ms 后）。                                      | Web    |

### Slots

| 名称      | 参数                                                                          | 描述                                                       | 平台 |
| --------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | ---- |
| `default` | `{ isActive, isExpanded, isAnimating, isDragging, isAttracting, isPeeking }` | 动作面板内容。可解构获取展开与位移状态（UniApp 端仅 `isActive`）。 | 通用 |
| `trigger` | `{ isActive, isExpanded, isAnimating, isDragging, isAttracting, isPeeking }` | 自定义主触发按钮的渲染内容。                               | 通用 |
| `divider` | `-`                                                                           | 胶囊变体下自定义动作区与触发按钮之间的分割线内容。         | Web  |

### Expose

| 方法        | 描述                                              | 平台 |
| ----------- | ------------------------------------------------- | ---- |
| `open`    | 手动展开动作面板。                                | 通用 |
| `close`   | 手动收起动作面板。                                | 通用 |
| `restore` | 从 `peekOnScroll` 的半隐藏状态立即复位。          | Web  |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的类名：

| 键名                                             | 说明                                     | 平台   |
| ------------------------------------------------ | ---------------------------------------- | ------ |
| `root`                                           | 最外层固定位置的容器。                   | 通用   |
| `trigger` | 触发器主按钮。                           | 通用   |
| `icon`                                           | 触发器内部图标。                         | 通用   |
| `actions`                                        | 动作面板外层容器。                       | 通用   |
| `action`                                         | `items` 渲染的单个动作按钮。             | UniApp |
| `capsuleWrapper` / `capsuleActions` / `capsuleInner` | 胶囊变体的外层 / 动作区 / 内容区。   | Web    |
| `divider` | 胶囊变体的分割线。                       | Web    |

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 布局变体 | 支持胶囊与环形布局 | 通过 items 渲染动作 |
| 滚动半隐藏 | peekOnScroll | 无同名能力 |

## 注意事项

- **两端提供同名浮动按钮**。两端共享主要模型，但展开默认值和图标格式不同，迁移时需显式核对下列配置。
- **默认展开行为按平台区分**。`expandable` 默认值双端不同：Web 默认 `true`、UniApp 默认 `false`；为 `false` 时点击直接触发 `click` 事件，不展开动作面板。
- **间距与图标默认值不同**。`gap` 默认值双端不同（Web 32 / UniApp 16，单位 px）；图标默认值也不同：Web 版依赖 nuxt-icon 体系（`lucide:plus`），UniApp 版用 Uno 图标类名（`i-lucide-plus`）。
- **拖动改变方向时会收起菜单**。拖拽结束后按左右侧自动吸附并根据剩余空间决定展开方向；方向变化时菜单会自动收起。
- **`v-model` 是展开状态的唯一来源，点击即写回。** `update:modelValue` 与 `open` / `close` 在动画启动时立即触发，只有 `opened` / `closed` 等约 400ms 动画结束后才触发；父组件在 `@open` 里把值改回 `false` 会立刻收起。需要在动画结束后再联动的逻辑挂在 `opened` / `closed` 上。
- **两端 `active` 只提供非受控初值。** 未绑定模型时按 `active` 初始化，不发送 `update:modelValue`；显式 `false`、`undefined`、`null` 优先并按收起处理，之后改展开状态请使用 `v-model`。
- **Web 端显式坐标与变体可以在运行时修改。** 用户拖拽定位之前，修改 `top` / `bottom` / `left` / `right` 会立即按新坐标落位；拖拽过后以拖拽位置为准。`variant` 从 `circle` 切到其他形态时会清掉环形布局写在子元素上的内联样式。
- **部分形态和交互仅支持 Web**。`variant`（capsule/circle）、`trigger="hover"`、`peekOnScroll`、`divider`、环形布局参数均为 Web 端能力；UniApp 端展开菜单推荐用 `items` 渲染以保证多端一致。
- **UniApp 已合并重复点击事件**。UniApp 端拖拽至左右边缘会自动切换展开方向；小程序端 `tap`/`click` 双发已在组件内合并处理。
