---
title: Tabbar 底部标签栏
description: 用于 uniapp 页面底部导航的自定义标签栏，配合 RebornTabbarTrigger 子项使用，支持球形凸起动画与安全区适配。
category: 导航
tags: [uniapp, tabbar, navigation]
navigation:
  badges:
    - label: UniApp
      color: success
---
::warning
仅 UniApp 端组件，Web 端无对应实现。页面内的内容区切换请改用 `reborn-tabs`。
::
::ComponentViewer{demoFile="RebornTabbarDemo.vue" config="RebornTabbarConfig" componentId="reborn-tabbar" :componentFiles='[]' :uniappFiles='["RebornTabbar.vue", "RebornTabbarTrigger.vue", "reborn-tabbar.config.ts", "reborn-tabbar-trigger.config.ts", "types.ts", "index.ts"]'}
::

## 简介

Tabbar 是用于替代原生 tabBar 的自定义底部标签栏：`RebornTabbar` 作为容器管理选中状态与动画，`RebornTabbarTrigger` 作为子项放在默认插槽内，通过 `title` / `icon` / `inactive` 配置每个标签。`v-model` 绑定当前激活项（对应子项 `name`），支持 `normal` / `round` 两种形状、六种切换动画（含 `drop` 凸起指示球与 `fly-balls` 彩色小球飞跃），并内置吸底、占位与 iOS 底部安全区适配。

适用场景：

- 原生 tabBar 无法满足样式需求，需要自定义形状、动画、主题色的底部导航。
- 需要固定吸底并处理 iOS 底部安全区（`fixed` + `safeAreaInsetBottom`，`placeholder` 自动占位）。
- 切换前需要拦截校验（`beforeChange` 支持返回 boolean / Promise 或调用 `done` 回调）。

不适用场景：

- Web 端项目：组件仅有 UniApp 实现。
- 页面内的内容区切换，改用 `reborn-tabs`。

## 用法

### 基础用法

`v-model` 绑定当前激活项，与子项 `name` 对应（子项未设 `name` 时按索引匹配）。`icon` 支持图标类名或图片链接（带 `/`、`.`、`http`、`data:image` 的值按图片处理），图片模式下可再配 `inactive` 指定未选中图与 `image-size`（单位 rpx）。`color` 设置主题色，或用 `active-color` / `inactive-color` 直接指定颜色值。

```vue
<script setup lang="ts">
import { ref } from "vue";

const active = ref("home");
</script>

<template>
  <RebornTabbar v-model="active" color="primary" @change="({ value }) => console.log(value)">
    <RebornTabbarTrigger name="home" title="首页" icon="i-lucide-home" />
    <RebornTabbarTrigger name="cart" title="购物车" icon="i-lucide-shopping-cart" />
    <RebornTabbarTrigger
      name="my"
      title="我的"
      icon="/static/my_active.png"
      inactive="/static/my.png"
      :image-size="52"
    />
  </RebornTabbar>
</template>
```

### 固定底部与安全区适配

`fixed` 使标签栏吸底（z-index 提升至 150），并由 `placeholder`（默认开启）自动生成等高占位元素防止内容被遮挡；全面屏 iPhone 建议同时开启 `safe-area-inset-bottom` 为底部安全区追加内边距。

```vue
<template>
  <RebornTabbar v-model="active" fixed safe-area-inset-bottom :z-index="99">
    <RebornTabbarTrigger name="home" title="首页" icon="i-lucide-home" />
    <RebornTabbarTrigger name="my" title="我的" icon="i-lucide-user" />
  </RebornTabbar>
</template>
```

### 形状与球形动画

`shape="round"` 呈现悬浮胶囊造型（带左右 `32rpx` 边距与阴影）。`animation` 提供 `reveal` / `flip` / `creative` / `glass` / `fly-balls` / `drop` 六种切换动画：`drop` 在激活项上方显示凸起指示球并做抛物线移动，球色随 `color` 主题色；`fly-balls` 切换时抛出一串彩色小球，颜色与数量由 `ball-colors` 决定，落点纵向偏移用 `ball-shift-y`（单位 rpx，默认 -5）微调。

```vue
<template>
  <!-- 凸起指示球：抛物线跳跃到新激活项 -->
  <RebornTabbar v-model="active" shape="round" animation="drop" color="success">
    <RebornTabbarTrigger name="home" title="首页" icon="i-lucide-home" />
    <RebornTabbarTrigger name="my" title="我的" icon="i-lucide-user" />
  </RebornTabbar>

  <!-- 彩色小球飞跃 -->
  <RebornTabbar
    v-model="active"
    animation="fly-balls"
    :ball-colors="['#ff6675', '#ffb03b', '#35b6f2']"
    :ball-shift-y="-10"
  >
    <RebornTabbarTrigger name="home" title="首页" icon="i-lucide-home" />
    <RebornTabbarTrigger name="my" title="我的" icon="i-lucide-user" />
  </RebornTabbar>
</template>
```

### 切换前拦截（beforeChange）

`beforeChange` 在每次切换前调用，入参为 `{ name }`（目标项标识）与 `done` 回调。三种用法：同步返回 `true` / `false`；返回 `Promise<boolean>`（解析为 `false` 或 reject 则取消）；异步逻辑完成后调用 `done()` 放行或 `done(false)` 取消。拦截期间组件处于锁定状态，重复点击会被忽略。

```vue
<script setup lang="ts">
function beforeChange({ name }: { name: string | number }, done: (ok?: boolean) => void) {
  uni.showModal({
    title: "提示",
    content: `确认切换到 ${name} 吗？`,
    success: res => done(res.confirm),
    fail: () => done(false),
  });
}
</script>

<template>
  <RebornTabbar v-model="active" :before-change="beforeChange">
    <RebornTabbarTrigger name="home" title="首页" icon="i-lucide-home" />
    <RebornTabbarTrigger name="my" title="我的" icon="i-lucide-user" />
  </RebornTabbar>
</template>
```

## API

### Props

以下为容器组件 `RebornTabbar` 的属性：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number \| string` | `0` | 当前激活项，对应子项 `name`（子项未设 `name` 时为其索引），支持 `v-model`。 |
| `fixed` | `boolean` | `false` | 是否固定在页面底部（fixed 定位吸底，配合 `placeholder` 自动占位）。 |
| `bordered` | `boolean` | `true` | 是否显示顶部分隔线（仅 `shape="normal"` 时渲染）。 |
| `safeAreaInsetBottom` | `boolean` | `false` | 是否为 iOS 底部安全区追加内边距（仅 `fixed` 开启时生效）。 |
| `pureIcon` | `boolean` | `false` | 仅显示图标不显示标题，开启后标签栏高度降为 `90rpx`。 |
| `shape` | `"normal" \| "round"` | `"normal"` | 标签栏形状：`normal` 通栏矩形；`round` 悬浮胶囊（带左右边距与阴影）。 |
| `animation` | `"reveal" \| "flip" \| "creative" \| "glass" \| "fly-balls" \| "drop" \| null` | `null` | 切换动画类型，`null` 表示无动画。 |
| `ballColors` | `string[]` | 红/橙/蓝/绿四色 | `fly-balls` 动画的小球颜色数组，数组长度即小球数量。 |
| `activeColor` | `string` | - | 选中态图标与标题颜色（内联样式，优先级高于 `color` 主题色）。 |
| `inactiveColor` | `string` | - | 未选中态图标与标题颜色（内联样式）。 |
| `placeholder` | `boolean` | `true` | `fixed` 时是否生成等高占位元素，防止页面内容被标签栏遮挡。 |
| `zIndex` | `number` | `99` | 标签栏主体的 `z-index` 层级。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 主题色，选中项与 drop 指示球随之着色；子项可用自身 `color` 覆盖。 |
| `customClass` | `any` | - | 追加到根节点的自定义类名。 |
| `customStyle` | `string` | `""` | 追加到标签栏主体的内联样式字符串。 |
| `ui` | `object` | - | 覆盖内部节点类名，见下方「自定义样式（ui）」。 |
| `ballShiftY` | `number` | `-5` | `fly-balls` 小球落点的纵向偏移，单位 rpx。 |
| `beforeChange` | `(params: { name }, done) => boolean \| Promise<boolean> \| void` | - | 切换前拦截钩子：返回 `false`、Promise 解析为 `false` 或调用 `done(false)` 均可阻止本次切换。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `change` | `({ value })` | 选中项切换后触发（`beforeChange` 拦截通过后才会触发），`value` 为新选中项的 `name`。 |
| `update:modelValue` | `(value)` | 选中项变化时触发（`v-model` 同步），参数为新选中项的 `name`。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | Trigger 上为 `{ active, ui }` | `RebornTabbar` 上放置 `RebornTabbarTrigger` 子项；`RebornTabbarTrigger` 上则完全接管该子项的渲染内容。 |
| `icon` | `{ active, ui }` | `RebornTabbarTrigger` 的图标区插槽，替代 `icon` / `inactive` 属性自定义图标渲染。 |

### TabbarTrigger Props

子项组件 `RebornTabbarTrigger` 的属性（必须放在 `RebornTabbar` 默认插槽内）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | - | 标签标题，`pureIcon` 开启时不显示。 |
| `name` | `number \| string` | 子项索引 | 唯一标识，与父组件 `modelValue` 匹配判断激活态。 |
| `icon` | `string` | - | 图标类名或图片链接（带 `/`、`.`、`http`、`data:image` 的值按图片渲染）。 |
| `inactive` | `string` | - | 未选中时的图标类名或图片链接，缺省时复用 `icon`。 |
| `disabled` | `boolean` | `false` | 是否禁用该子项（点击无效）。 |
| `color` | `string` | 继承父组件 | 该子项的主题色，覆盖父组件 `color`。 |
| `imageSize` | `number` | `40` | 图片图标的宽高，单位 rpx。 |
| `customClass` | `any` | - | 追加到子项根节点的自定义类名。 |
| `customStyle` | `string` | `""` | 追加到子项根节点的内联样式。 |
| `ui` | `object` | - | 按 `root` / `body` / `icon` / `activeIcon` / `inactiveIcon` / `iconInner` / `title` / `glowLayer` / `bodyGlowLayer` 键覆盖子项内部节点类名。 |

### 自定义样式（ui）

`RebornTabbar` 的 `ui` 属性按以下键覆盖对应节点的类名：

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器（含占位元素）。 |
| `base` | 标签栏主体（高度 `110rpx`，`pureIcon` 时 `90rpx`）。 |
| `dropBall` | `drop` 动画的凸起指示球。 |
| `flyBallsContainer` | `fly-balls` 动画的小球容器层。 |
| `flyBallItem` | `fly-balls` 动画的单个小球。 |

`RebornTabbarTrigger` 的 `ui` 写在子项上，按以下键覆盖单个标签内部的节点（注意 `RebornTabbar` 的 `ui` **不会**下发给子项，两者各写各的）：

| 键名            | 说明                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `root`          | 子项根节点，默认 `box-content`，形状变体会追加尺寸类；单项宽度、点击热区改这里，`custom-class` 也并到该节点。                              |
| `bodyGlowLayer` | 包在 `body` 外的一层颜色背景（`round` + `glass` 组合才有实际样式，默认 `display: contents` 不影响布局）。**填充子项 default 插槽会替换掉从这里开始的全部内容**，`ui.bodyGlowLayer` 及其内部各键随之失效——不过该插槽的作用域透出了 `ui`，接管时可自行绑回去。 |
| `body`          | 图标 + 标题的排布容器；上下内边距、图文间距改这里。同样受上面的 default 插槽陷阱影响。                                                     |
| `icon`          | 图标区外层（抖动 / 果冻动画作用在它身上）。**仅传了 `icon` 或填充了 `icon` 插槽时渲染**；图标尺寸、外边距改这里。                          |
| `activeIcon`    | 选中态图标节点。**仅在未填充 `icon` 插槽时渲染**，填充该插槽会替换掉选中/未选中两个节点，`ui.activeIcon` 随之失效。                        |
| `inactiveIcon`  | 未选中态图标节点，同样受 `icon` 插槽陷阱影响。                                                                                             |
| `iconInner`     | 字体图标的实际渲染节点（`icon` 传的是类名而非图片时），默认 `text-40`——图标字号改这里；传图片路径时走 `RebornImage`，请用 `imageSize` 调整。 |
| `glowLayer`     | 图标区内的渐变光影层（`normal` + `glass` 动画），始终渲染但默认无样式，只有对应动画变体才可见。                                            |
| `title`         | 标题文本节点。**仅传了 `title` 且非 `pureIcon` 时渲染**；字号、行高、上边距改这里（颜色由组件按选中态写成内联 `style`，类名改不动，请用 `activeColor` / `inactiveColor`）。 |

```vue
<template>
  <RebornTabbar v-model="active" fixed :ui="{ base: 'h-[120rpx]' }">
    <RebornTabbarTrigger
      name="home"
      title="首页"
      icon="i-lucide-home"
      :ui="{ title: 'text-22 mt-[4rpx]', iconInner: 'text-44' }"
    />
    <RebornTabbarTrigger name="mine" title="我的" icon="i-lucide-user" />
  </RebornTabbar>
</template>
```

## 注意事项

- 仅 UniApp 端可用；示例尺寸单位为 rpx（标签栏高 `110rpx`，`pureIcon` 时 `90rpx`，`normal` + `glass` 动画时 `130rpx`）。
- 子项 `RebornTabbarTrigger` 必须放在 `RebornTabbar` 默认插槽内，二者通过依赖注入关联；`title` / `name` / `icon` 等是子项的 props，不要写在父组件上。
- `fixed` 与 `safeAreaInsetBottom` 默认均为 `false`：吸底和安全区适配都需显式开启；关闭 `placeholder` 后吸底时页面底部内容会被遮挡。
- `beforeChange` 拦截未通过时不更新绑定值、不触发 `change` / `update:modelValue`；拦截等待期间与动画播放期间（`fly-balls` 约 600ms、`drop` 约 480ms）组件处于锁定状态，期间的点击会被忽略。
- 点击当前已激活项不会重复触发 `change`，只播放一次抖动动画。
- `drop` 动画依赖 `uni.createSelectorQuery` 测量子项位置：子项数量或布局属性变化后会自动延迟重算，若外层容器尺寸异步变化导致指示球错位，可通过切换 `animation` 或改变布局属性触发重新测量。
- `activeColor` / `inactiveColor` 以内联样式作用于图标与标题，优先级高于 `color` 主题色；图片图标不受颜色属性影响。
