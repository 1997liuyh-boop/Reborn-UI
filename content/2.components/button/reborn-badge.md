---
title: Badge 徽章
description: 双端状态标签：支持四种风格、胶囊、可关闭与可选中；Web 额外支持独立圆形参数。
category: 按钮
platform: both
tags: [css, tailwind, badge, uniapp, cross-platform]
badge: New
---

::ComponentViewer{demoFile="RebornBadgeDemo.vue" config="RebornBadgeConfig" componentId="reborn-badge" :componentFiles='["RebornBadge.vue", "reborn-badge.config.ts"]' :uniappFiles='["RebornBadge.vue", "reborn-badge.config.ts"]'}
::

## 简介

Badge 用于展示条目的状态、数量或分类标识，Web 与 UniApp 两端提供同名同构组件。

`color` 决定语义色，`variant` 决定四种视觉风格，`size` 决定尺寸；`round` 单独控制胶囊圆角。Web 额外提供 `circle` 固定圆形轮廓，形状不会改变风格配色。

`check` 与 `v-model:checked` 支持可选中标签；`closable`、`v-model:show` 控制关闭和显隐；Web 的 `beforeClose` 可拦截关闭。图标及其他内容通过插槽扩展。

### 何时使用

- 用 `color` 标记成功、警告等状态，并通过 `label` 显示名称。
- 用 `check` 与 `v-model:checked` 实现多选筛选标签。
- 用 `closable` 移除条目，或用 Web 的 `beforeClose` 进行异步确认。
- 用 Web 的 `circle` 展示短数字或单个图标，用 `round` 展示较长文字。

### 何时不使用

- 独立的动作触发入口 —— 改用 `reborn-button`。
- 覆盖在头像角落的数字或圆点 —— 改用 `reborn-chip`。

## 用法

### 变体矩阵

`color` 与 `variant` 独立组合；下表说明 Web 数字色阶，UniApp 的 secondary 与 neutral 有调色板差异。

| 风格 | 背景 / 边框 / 文字 | 典型用途 |
| --- | --- | --- |
| `filled` | 6 阶背景 / 无 / gray-1 | 强调状态 |
| `outlined` | 透明 / 4 阶 / 6 阶 | 密集列表 |
| `soft` | 2 阶 / 无 / 6 阶 | 轻量分类 |
| `subtle` | 2 阶 / 4 阶 / 6 阶 | 需要边界的状态标签 |

Web 的 neutral 非实心文字使用 gray-9。`size` 三档高度为 18 / 24 / 32px，字号为 12 / 12 / 14px，水平内边距 6px；UniApp 尺寸按双倍 rpx 取值。

```vue
<template>
  <RebornBadge variant="filled" color="success" label="完成" />
  <RebornBadge variant="outlined" color="warning" label="待处理" />
  <RebornBadge variant="soft" color="info" label="处理中" />
  <RebornBadge variant="subtle" size="lg" label="分类" />
</template>
```

### 形状

`round` 与 `circle` 不占用风格变体，可叠加到四种 `variant` 上；`circle` 本轮仅 Web 支持。

| 参数 | 形状 | 典型用途 |
| --- | --- | --- |
| `round` | 胶囊，宽度随内容 | 文本标签 |
| `square` | 无内边距的正方形比例 | 单个图标 |
| `circle`（Web） | 固定等宽高，尺寸由 `size` 决定 | 短数字或单个图标 |
| `round circle`（Web） | 圆形优先，`square` 同样不改变结果 | 多个形状参数同时开启 |

```vue
<template>
  <RebornBadge variant="outlined" round label="描边胶囊" />
  <!-- 以下圆形示例仅适用于 Web -->
  <RebornBadge variant="soft" circle :label="8" />
  <RebornBadge variant="outlined" round circle :label="0" />
  <RebornBadge circle aria-label="收藏">
    <template #leading="{ ui }">
      <Icon name="lucide:star" :class="ui.leadingIcon()" />
    </template>
  </RebornBadge>
</template>
```

### 可选中标签

开启 `check` 后，点击切换 `v-model:checked` 并派发 `change`；未选中时退为灰阶，`disabled` 禁止交互。

```vue
<script setup lang="ts">
import { ref } from 'vue'
const checked = ref(false)
</script>
<template>
  <RebornBadge v-model:checked="checked" check round variant="soft" label="热销" />
  <RebornBadge check disabled label="不可选" />
</template>
```

### 图标集成

Web 使用 `leading` / `trailing` 插槽放置图标；UniApp 还提供 `icon` 参数。

```vue
<template>
  <RebornBadge variant="soft" label="收藏">
    <template #leading="{ ui }">
      <Icon name="lucide:star" :class="ui.leadingIcon()" />
    </template>
  </RebornBadge>
</template>
```

### 关闭交互

`closable` 显示关闭入口；`v-model:show` 同步显隐。Web 的 `beforeClose` 返回 false 或拒绝的 Promise 可阻止关闭。

```vue
<script setup lang="ts">
import { ref } from 'vue'
const show = ref(true)
const confirmClose = () => window.confirm('确认关闭标签？')
</script>
<template>
  <RebornBadge v-model:show="show" round closable label="可关闭标签" :before-close="confirmClose" />
</template>
```

### 插槽扩展

默认插槽覆盖 `label`，可通过 `ui` 覆盖标签内层样式，而不改变整个徽章的配色。

```vue
<template>
  <RebornBadge variant="outlined" :ui="{ label: 'tracking-wide' }">
    <span>自定义内容</span>
  </RebornBadge>
</template>
```

## API

### Props

`show` 与 `checked` 分别通过 `v-model:show` / `v-model:checked` 双向绑定。

| 属性名            | 类型               | 默认值      | 平台差异        | 说明                                                          |
| :---------------- | :----------------- | :---------- | :-------------- | :------------------------------------------------------------ |
| `show`    | `boolean`          | `true`      | -               | 控制徽标显示/隐藏，支持动画。                                 |
| `label`           | `string \| number` | -           | -               | 徽标显示的文本内容。                                          |
| `color`           | `BadgeColor`       | `'primary'` | -               | 语义化颜色，详见下方配置。                                    |
| `variant`         | `BadgeVariant`     | `'filled'`  | -               | 视觉风格：`filled`, `outlined`, `soft`, `subtle` 等。         |
| `size`            | `BadgeSize`        | `'md'`      | -               | 尺寸规格：`sm`, `md`, `lg`。                                  |
| `icon`            | `string`           | -           | **UniApp 专用** | 直接传入图标类名。Web 端建议使用插槽。                        |
| `square`          | `boolean`          | `false`     | -               | 是否为正方形（等宽高）。                                      |
| `round`           | `boolean`          | `false`     | -               | 圆角标签：与按钮组件一致变为全圆角胶囊。                      |
| `circle` | `boolean` | `false` | **Web 专用** | 固定等宽高的圆形，优先于 `round` 与 `square`，不改变配色。 |
| `check`           | `boolean`          | `false`     | -               | 可选中模式：作为类复选框的 Check Tag 使用。                   |
| `checked` | `boolean`          | `false`     | -               | 可选中模式下的选中态；未选中时徽标退为灰阶。                  |
| `disabled`        | `boolean`          | `false`     | -               | 是否禁用（屏蔽选中切换与关闭交互）。                          |
| `closable`        | `boolean`          | `false`     | -               | 是否显示关闭按钮。                                            |
| `closeIcon`       | `string`           | -           | **默认值差异**  | Web 默认为 `i-lucide-x`；UniApp 默认为 `i-mdi-close-circle`。 |
| `as`              | `any`              | `'span'`    | **Web 专用**    | 指定渲染的 HTML 标签或组件。                                  |
| `beforeClose`     | `Function`         | -           | **Web 专用**    | 关闭前的钩子函数，支持异步阻断。                              |
| `gap`             | `boolean`          | `false`     | -               | 多个徽标并排时是否自动添加左间距。                            |
| `class`           | `any`              | -           | **Web 专用**    | 容器类名。                                                    |
| `customClass`     | `any`              | -           | **UniApp 专用** | 容器类名（避免 UniApp 原生 class 冲突）。                     |
| `ui`              | `object`           | `{}`        | -               | 深度定制内部各组件样式的对象。                                |

### Emits

| 事件名           | 参数                  | 平台说明                                              |
| :--------------- | :-------------------- | :---------------------------------------------------- |
| `close`          | `(event: MouseEvent)` | 点击关闭按钮时触发；徽标以 200ms 的缩放淡出动画收起。 |
| `click`          | `(event: Event)`      | 点击整个徽标时触发（双端一致）。                      |
| `change`         | `(checked: boolean)`  | 可选中模式下点击切换选中态时触发。                    |
| `update:show`    | `(value: boolean)`    | `v-model:show` 同步事件。                             |
| `update:checked` | `(value: boolean)`    | `v-model:checked` 同步事件。                          |

### Slots

| 插槽名     | 作用域（双端一致） | 说明                             |
| :--------- | :----------------- | :------------------------------- |
| `default`  | `{ ui }`           | 徽标主体内容，覆盖 `label`。     |
| `leading`  | `{ ui }`           | 前置内容，通常用于图标、小头像。 |
| `trailing` | `{ ui }`           | 后置内容。                       |
| `close`    | `{ ui, close }`    | 自定义关闭按钮。                 |

### Expose

未暴露命令式方法；显隐通过 `v-model:show` 控制。

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端键名相同，但个别键的生效条件不同：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名           | 说明                                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 最外层动画容器（`RebornTransition`）。默认 `reborn-badge cursor-pointer`，显隐过渡与外边距、定位加在这里。                                                                                |
| `base`         | 徽标主体（标签名由 `as` 决定）。默认 `inline-flex items-center justify-center font-medium whitespace-nowrap overflow-hidden`，底色、圆角、内边距、字号都在这里，尺寸/配色变体也作用于它。 |
| `label`        | 文本包裹层，默认 `inline-flex items-center justify-center truncate max-w-full min-w-0`。**仅有 label（包括数字 0）或 default 插槽时渲染，节点在 default 插槽外层**，因此填充 default 插槽后它依然存在，`ui.label` 仍生效。             |
| `leadingIcon`  | 前置图标类名。模板本身不渲染前置图标，需要在 `leading` 插槽里自行取用：`<template #leading="{ ui }">`，再把 `ui.leadingIcon()` 挂到你的图标上。                                           |
| `trailingIcon` | 后置图标类名，用法同 `leadingIcon`，通过 `trailing` 插槽的作用域参数取用。                                                                                                                |
| `closeButton`  | 关闭按钮容器。**仅 `closable` 为真时渲染**，默认 `inline-flex items-center justify-center rounded-full hover:bg-black/10`。                                                               |
| `closeIcon`    | 关闭图标。**仅 `closable` 为真且未填充 `close` 插槽时渲染**，填充该插槽会替换掉图标节点，`ui.closeIcon` 随之失效（插槽作用域里可拿到 `ui` 自行套用）。                                    |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名           | 说明                                                                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 最外层动画容器（`RebornTransition` 的 `custom-class`）。默认 `reborn-badge inline`。                                                                                              |
| `base`         | 徽标主体 `<view>`。默认 `inline-flex items-center justify-center font-medium whitespace-nowrap overflow-hidden`，底色、圆角、内边距、字号在这里；`customClass` 也会并到同一节点。 |
| `label`        | 文本包裹 `<view>`，默认 `truncate`。**仅在传了 `label` 或填充了 default 插槽时渲染**；该节点在插槽外层，填充插槽不影响它生效。                                                    |
| `leadingIcon`  | 前置图标 `<view>`（类名图标）。**仅在传了 `icon` 且未填充 `leading` 插槽时渲染**，填充该插槽会替换掉图标节点，`ui.leadingIcon` 随之失效。                                         |
| `trailingIcon` | 后置图标类名。UniApp 端模板本身不渲染后置图标，需在 `trailing` 插槽的作用域参数中取 `ui.trailingIcon()` 挂到自定义图标上（用法与 Web 端一致）。                                   |
| `closeButton`  | 关闭按钮容器 `<view>`。**仅 `closable` 为真时渲染**，默认 `inline-flex items-center justify-center rounded-full hover:bg-black/10`。                                              |
| `closeIcon`    | 关闭图标 `<view>`（与 `closeIcon` prop 的类名一起作用）。**仅 `closable` 为真且未填充 `close` 插槽时渲染**，填充该插槽会使其失效。                                                |

:::

::

```vue
<template>
  <RebornBadge
    label="新"
    closable
    :ui="{
      base: 'bg-error/10 text-error',
      label: 'tracking-wide',
      closeButton: 'hover:bg-error/20',
    }"
  />
</template>
```


### CSS 变量

Web 高度令牌定义在 `app/assets/theme/typography.css`，圆形的宽高复用同一令牌。

| 变量 | Web 值 | 作用 |
| --- | --- | --- |
| `--height-badge-sm` | 18px | 小尺寸高度与圆形宽度 |
| `--height-badge-md` | 24px | 中尺寸高度与圆形宽度 |
| `--height-badge-lg` | 32px | 大尺寸高度与圆形宽度 |

UniApp 的高度与圆角令牌独立定义在 `packages/uniapp-project/src/styles/theme.css`，使用 rpx，不跟随本次 Web 形状参数调整。

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 形状 | `square` / `round` / `circle` | `square` / `round`，暂无 `circle` |
| 图标 | 插槽 | `icon` 或插槽 |
| 高度 | 18 / 24 / 32px | 36 / 48 / 64rpx |
| 关闭前确认 | `beforeClose` | 不支持 |
| 关闭图标默认值 | `i-lucide-x` | `i-mdi-close-circle` |
| 自定义容器 | `as` 与 `class` | `customClass` |
| 调色板 | secondary 独立色阶，neutral 文字 gray-9 | secondary 使用灰阶，neutral 文字 gray-8 |

## 注意事项

- **圆形有固定容量**。Web `circle` 按尺寸令牌固定宽高，长文本可能被裁切；需要长文本或关闭按钮时使用普通形状或 `round`，不要通过圆形容纳多项内容。
- **形状不决定配色**。`round` 和 `circle` 只改变轮廓，选中与禁用仍遵循原有风格规则；两者同时启用时 `circle` 优先。
- **两端 API 不完全相同**。`circle` 与 `beforeClose` 仅 Web 支持，不能直接传给 UniApp 组件期待相同行为。
- **禁用会阻止交互**。`disabled` 屏蔽选中切换及关闭，`check` 未选中态退为灰阶，不会保留彩色背景。
- **零也是有效内容**。Web `label=0` 会正常显示，纯图标且无默认内容时不渲染空文本节点，避免额外间距。
