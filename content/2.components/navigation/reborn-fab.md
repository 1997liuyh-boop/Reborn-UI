---
title: 悬浮按钮 (Fab)
description: 用于固定位置悬浮操作入口的按钮组件，支持拖拽吸边与展开动作面板，双端可用。
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

::ComponentViewer{demoFile="RebornFabDemo.vue" config="RebornFabConfig" componentId="reborn-fab" :componentFiles='["RebornFab.vue", "reborn-fab.config.ts"]' :uniappFiles='["RebornFab.vue", "reborn-fab.config.ts"]' dependencies="clsx, tailwind-variants"}
::

## 简介

Fab 是悬浮在页面固定位置的操作按钮，双端可用。`position` 预设四角位置或用 `top` / `bottom` / `left` / `right` 指定坐标；`expandable` 开启后点按可向 `direction` 方向展开动作面板（UniApp 端推荐用 `items` 数据渲染，Web 端另支持 `capsule` 胶囊与 `circle` 环形两种变体）。`draggable` 允许拖拽，拖拽结束自动吸附最近的屏幕侧边并按剩余空间调整展开方向；Web 端还支持 `peekOnScroll` 滚动时贴边半隐藏。

适用场景：

- 页面角落固定的快捷操作入口（客服、发布、回到顶部集合等）。
- 点击/悬停展开多个子动作（`items` 或 default 插槽），含环形布局（`radius` / `startAngle` / `totalAngle`）。
- 需要可拖拽并自动吸附屏幕左右边（`draggable` + `attract`）的悬浮球。
- 滚动时自动贴边半隐藏（`peekOnScroll`，仅 Web）的场景。

不适用场景：

- 普通文档流中的操作按钮，改用 `reborn-button`。
- 把一组操作折叠为下拉菜单（Web），改用 `reborn-dropdown`。

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
| `modelValue`   | `boolean`                                                                                | `false`                                          | 绑定值，控制展开状态（`v-model`）。                                                                 | 通用   |
| `active`       | `boolean`                                                                                | `false`                                          | 是否默认展开。                                                                                      | 通用   |
| `position`     | `'left-top' \| 'right-top' \| 'left-bottom' \| 'right-bottom'`                           | `'right-bottom'`                                 | 预设位置。                                                                                          | 通用   |
| `top`          | `string \| number`                                                                       | -                                                | 自定义顶部距离。                                                                                    | 通用   |
| `bottom`       | `string \| number`                                                                       | -                                                | 自定义底部距离。                                                                                    | 通用   |
| `left`         | `string \| number`                                                                       | -                                                | 自定义左侧距离。                                                                                    | 通用   |
| `right`        | `string \| number`                                                                       | -                                                | 自定义右侧距离。                                                                                    | 通用   |
| `trigger`      | `'click' \| 'hover'`                                                                     | `'click'`                                        | 触发方式。                                                                                          | Web    |
| `direction`    | `'top' \| 'bottom' \| 'left' \| 'right'`                                                 | `'top'`                                          | 展开方向。                                                                                          | 通用   |
| `variant`      | `'float' \| 'capsule' \| 'circle'`                                                       | `'float'`                                        | UI 变体：悬浮 / 胶囊 / 环形。                                                                       | Web    |
| `color`        | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`   | `'primary'`                                      | 主题颜色。                                                                                          | 通用   |
| `disabled`     | `boolean`                                                                                | `false`                                          | 是否禁用。                                                                                          | 通用   |
| `draggable`    | `boolean`                                                                                | `false`                                          | 是否可拖拽。拖拽结束后自动吸附最近的左右屏幕边并按剩余空间调整展开方向。                            | 通用   |
| `attract`      | `boolean`                                                                                | `true`                                           | 拖拽结束后是否自动吸附到最近的屏幕侧边。                                                            | Web    |
| `peekOnScroll` | `boolean`                                                                                | `false`                                          | 页面滚动时是否自动贴边半隐藏（滚动停止约 1s 后复位；点击、按下或悬停立即复位）。与 `attract` 独立。 | Web    |
| `expandable`   | `boolean`                                                                                | Web `true` / UniApp `false`                      | 是否可展开动作面板；为 `false` 时点击直接触发 `click`。                                             | 通用   |
| `gap`          | `{ top?: number; left?: number; right?: number; bottom?: number }`                       | Web `{ 32,32,32,32 }` / UniApp `{ 16,16,16,16 }` | 距屏幕边缘的间距，用于拖拽边界与预设定位计算。                                                      | 通用   |
| `items`        | `FabActionItem[]`                                                                        | `[]`                                             | 动作列表：有数据时由组件内 v-for 渲染（推荐小程序端使用），无数据时回退为默认插槽。                 | UniApp |
| `inactiveIcon` | `string`                                                                                 | Web `'lucide:plus'` / UniApp `'i-lucide-plus'`   | 非激活状态图标。                                                                                    | 通用   |
| `activeIcon`   | `string`                                                                                 | Web `'lucide:plus'` / UniApp `'i-lucide-plus'`   | 激活状态图标。                                                                                      | 通用   |
| `divider`      | `boolean`                                                                                | -                                                | 胶囊变体下是否在动作区与触发按钮之间显示分割线。                                                    | Web    |
| `radius`       | `number`                                                                                 | -                                                | 环形布局半径（px）。                                                                                | Web    |
| `startAngle`   | `number`                                                                                 | -                                                | 环形布局起始角度（默认 -90，正上方）。                                                              | Web    |
| `totalAngle`   | `number`                                                                                 | -                                                | 环形布局总角度（默认 360，一整圈）。                                                                | Web    |
| `zIndex`       | `number`                                                                                 | `99`                                             | 组件层级 z-index。                                                                                  | 通用   |
| `customClass`  | `string`                                                                                 | -                                                | 自定义根元素类名。                                                                                  | 通用   |
| `customStyle`  | `string \| CSSProperties`                                                                | -                                                | 自定义根元素样式。                                                                                  | 通用   |
| `ui`           | `object`                                                                                 | `{}`                                             | 按内部结构键覆盖类名，见下方「自定义样式（ui）」。                                                  | 通用   |

### Emits

| 事件名              | 参数                                | 描述                                                                     | 平台   |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------ | ------ |
| `update:modelValue` | `(value: boolean)`                  | 更新展开状态绑定值。                                                     | 通用   |
| `click`             | `()`                                | 当组件非可展开（`expandable` 为假）状态下被点击时触发。                  | 通用   |
| `action`            | `({ name: string, index: number })` | 点击某条 `items` 动作时触发。                                            | UniApp |
| `open`              | `()`                                | 动作面板开始展开时立即触发（动画启动时刻）。                             | Web    |
| `opened`            | `()`                                | 展开动画结束后触发（约 400ms 后，此时 `v-model` 已同步为 `true`）。      | Web    |
| `close`             | `()`                                | 动作面板开始收起时立即触发（动画启动时刻）。                             | Web    |
| `closed`            | `()`                                | 收起动画结束后触发（约 400ms 后，此时 `v-model` 已同步为 `false`）。     | Web    |

### Slots

| 名称      | 参数                                                                          | 描述                                                       | 平台 |
| --------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | ---- |
| `default` | `{ isActive, isExpanded, isAnimating, isDragging, isAttracting, isPeeking }` | 动作面板内容。可解构获取展开与位移状态（UniApp 端仅 `isActive`）。 | 通用 |
| `trigger` | `{ isActive, isExpanded, isAnimating, isDragging, isAttracting, isPeeking }` | 自定义主触发按钮的渲染内容。                               | 通用 |
| `divider` | `-`                                                                           | 胶囊变体下自定义动作区与触发按钮之间的分割线内容。         | Web  |

### Expose

| 方法        | 描述                                              | 平台 |
| ----------- | ------------------------------------------------- | ---- |
| `open()`    | 手动展开动作面板。                                | 通用 |
| `close()`   | 手动收起动作面板。                                | 通用 |
| `restore()` | 从 `peekOnScroll` 的半隐藏状态立即复位。          | Web  |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的类名：

| 键名                                             | 说明                                     | 平台   |
| ------------------------------------------------ | ---------------------------------------- | ------ |
| `root`                                           | 最外层固定位置的容器。                   | 通用   |
| `trigger`                                        | 触发器主按钮。                           | 通用   |
| `icon`                                           | 触发器内部图标。                         | 通用   |
| `actions`                                        | 动作面板外层容器。                       | 通用   |
| `action`                                         | `items` 渲染的单个动作按钮。             | UniApp |
| `capsuleWrapper` / `capsuleActions` / `capsuleInner` | 胶囊变体的外层 / 动作区 / 内容区。   | Web    |
| `divider`                                        | 胶囊变体的分割线。                       | Web    |

## 注意事项

- web 与 uniapp 双端可用。
- `expandable` 默认值双端不同：Web 默认 `true`、UniApp 默认 `false`；为 `false` 时点击直接触发 `click` 事件，不展开动作面板。
- `gap` 默认值双端不同（Web 32 / UniApp 16，单位 px）；图标默认值也不同：Web 版依赖 nuxt-icon 体系（`lucide:plus`），UniApp 版用 Uno 图标类名（`i-lucide-plus`）。
- 拖拽结束后按左右侧自动吸附并根据剩余空间决定展开方向；方向变化时菜单会自动收起。
- `open` / `close` 在动画启动时立即触发，`opened` / `closed` 与 `update:modelValue` 在约 400ms 动画结束后才触发——依赖 `v-model` 值做联动时注意这段延迟。
- `variant`（capsule/circle）、`trigger="hover"`、`peekOnScroll`、`divider`、环形布局参数均为 Web 端能力；UniApp 端展开菜单推荐用 `items` 渲染以保证多端一致。
- UniApp 端拖拽至左右边缘会自动切换展开方向；小程序端 `tap`/`click` 双发已在组件内合并处理。
