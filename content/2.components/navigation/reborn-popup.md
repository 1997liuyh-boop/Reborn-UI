---
title: Popup 弹出层
description: 用于从上下左右四个方向弹出面板的双端弹出层组件，支持手势滑动关闭与安全区适配。
category: 导航
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPopupDemo.vue" config="RebornPopupConfig" componentId="reborn-popup" :componentFiles='["RebornPopup.vue", "reborn-popup.config.ts", "RebornTransition.vue", "reborn-transition.config.ts", "RebornOverlay.vue", "reborn-overlay.config.ts", "RebornRootPortal.vue", "reborn-root-portal.config.ts"]' :uniappFiles='["RebornPopup.vue", "reborn-popup.config.ts", "RebornTransition.vue", "reborn-transition.config.ts", "RebornOverlay.vue", "reborn-overlay.config.ts", "RebornRootPortal.vue", "reborn-root-portal.config.ts"]'}
::

## 简介

Popup 是从屏幕边缘或中央弹出的面板容器，双端可用。`v-model` 控制显隐，`position` 支持 `top` / `bottom` / `left` / `right` / `center` 五个方位并自动匹配滑入动画，`size` 控制面板宽度或高度。内置头部（标题 + 关闭按钮）、遮罩层、滚动锁定与顶部/底部安全区适配；UniApp 端在 `position="bottom"` 时支持带阻尼与回弹的下滑手势关闭，Web 端支持 `resizable` 边缘拖拽调整大小与 `beforeClose` 关闭拦截。

适用场景：

- 移动端底部操作面板、半屏弹层（`position="bottom"`，支持下滑手势关闭）。
- 侧边抽屉式面板（`position="left"` / `"right"`，`size` 控制宽度）。
- H5/小程序弹层需要顶部或底部安全区适配时。
- 需要完整生命周期事件（`open` / `opened` / `close` / `closed` 等）或 `beforeClose` 拦截关闭时。

不适用场景：

- 居中确认对话框改用 `reborn-dialog`（仅 Web）。
- 锚定元素的小型气泡浮层改用 `reborn-popover`。
- 只需要背景遮罩改用 `reborn-overlay`。

## 用法

### 基础用法

`v-model` 控制显隐；`position` 决定弹出方位与默认动画；`title` / `showClose` 配置头部。

```vue
<script setup lang="ts">
import { ref } from "vue";

const show = ref(false);
</script>

<template>
  <RebornButton @click="show = true">打开底部弹层</RebornButton>

  <RebornPopup v-model="show" position="bottom" title="选择配送方式" size="40%">
    <view class="p-4">弹层主体内容</view>
  </RebornPopup>
</template>
```

### 手势滑动关闭（UniApp）

`position="bottom"` 时默认开启 `swipeClose`：面板顶部显示滑动手柄，下拉超过 `swipeCloseThreshold`（手指竖直位移，默认 120px）或快速轻扫即关闭，未达阈值则带弹簧回弹；遮罩透明度随拖拽联动。

```vue
<template>
  <RebornPopup
    v-model="show"
    position="bottom"
    size="600rpx"
    :swipe-close="true"
    :swipe-close-threshold="100"
  >
    <view class="p-4">下拉面板顶部手柄可关闭</view>
  </RebornPopup>
</template>
```

### 关闭前拦截与生命周期（Web）

`beforeClose` 在关闭前调用并暂停关闭，回调 `done()` 继续关闭、`done(true)` 取消；`open` / `close` 在动画开始时触发，`opened` / `closed` 在动画结束后触发。

```vue
<script setup lang="ts">
function beforeClose(done: (cancel?: boolean) => void) {
  const ok = window.confirm("确认关闭？");
  done(!ok);
}
</script>

<template>
  <RebornPopup
    v-model="show"
    position="right"
    size="360px"
    :before-close="beforeClose"
    @opened="console.log('动画完成，面板已完全展开')"
  />
</template>
```

### 头部与页脚插槽

`header` 插槽替换默认标题区域；`footer` 插槽（仅 Web）固定在面板底部，常用于操作按钮组。

```vue
<template>
  <RebornPopup v-model="show" position="center" size="420px">
    <template #header>
      <text class="text-lg font-bold">自定义头部</text>
    </template>
    <view class="py-2">主体内容</view>
    <template #footer>
      <RebornButton color="primary" @click="show = false">确定</RebornButton>
    </template>
  </RebornPopup>
</template>
```

## API

### Props

| 属性名                          | 类型                                                  | 默认值                       | 说明                                                                       | 平台   |
| ------------------------------- | ----------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- | ------ |
| `v-model`                       | `boolean`                                             | `false`                      | 是否显示弹出层                                                             | 通用   |
| `position`                      | `'top' \| 'bottom' \| 'left' \| 'right' \| 'center'`  | `'bottom'`                   | 弹出位置，自动匹配对应方向的滑入动画                                       | 通用   |
| `size`                          | `number \| string`                                    | `'30%'`                      | 弹出层的大小：左右方向为宽度，上下方向为高度                               | 通用   |
| `title`                         | `string`                                              | `''`                         | 弹出层的标题                                                               | 通用   |
| `showHeader`                    | `boolean`                                             | `true`                       | 是否显示头部（包含标题和关闭按钮）                                         | 通用   |
| `showClose`                     | `boolean`                                             | `true`                       | 是否显示关闭按钮                                                           | 通用   |
| `round`                         | `boolean`                                             | `true`                       | 是否显示圆角样式                                                           | 通用   |
| `modal` / `showMask`            | `boolean`                                             | `true`                       | 是否需要遮罩层（两者互为别名）                                             | 通用   |
| `closeOnClickModal` / `maskClosable` | `boolean`                                        | `true`                       | 是否可以通过点击遮罩层关闭（两者互为别名）                                 | 通用   |
| `transition`                    | `string`                                              | `''`                         | 自定义过渡动画名称，覆盖 `position` 的默认动画                             | 通用   |
| `duration`                      | `number \| boolean`                                   | Web `350` / UniApp `300`     | 动画时长（ms）；UniApp 端设为 `false` 可禁用动画                           | 通用   |
| `zIndex` / `overlayZIndex`      | `number`                                              | Web `2000` / UniApp `25`     | 弹出层的层级 z-index（两者互为别名）                                       | 通用   |
| `lockScroll`                    | `boolean`                                             | `true`                       | 是否在出现时锁定背景滚动                                                   | 通用   |
| `lazyRender`                    | `boolean`                                             | `true`                       | 是否在首次显示时才渲染内容                                                 | 通用   |
| `safeAreaInsetBottom`           | `boolean`                                             | `true`                       | 是否开启底部安全区域适配（`position="bottom"` 时生效）                     | 通用   |
| `safeAreaInsetTop`              | `boolean`                                             | `true`                       | 是否开启顶部安全区域适配（`position="top"` 时生效）                        | 通用   |
| `modalStyle`                    | `string`                                              | `''`                         | 遮罩层的自定义样式                                                         | 通用   |
| `customClass`                   | `string`                                              | `''`                         | 自定义根元素类名                                                           | 通用   |
| `customStyle`                   | `string`                                              | `''`                         | 自定义根元素样式                                                           | 通用   |
| `ui`                            | `object`                                              | `{}`                         | 按内部结构键覆盖类名                                                       | 通用   |
| `swipeClose`                    | `boolean`                                             | `true`                       | 是否开启手势下滑关闭（仅 `position="bottom"` 时生效）                      | UniApp |
| `swipeCloseThreshold`           | `number`                                              | `120`                        | 手势关闭的触发阈值（手指竖直位移 px，不与阻尼位移混用）                    | UniApp |
| `rootPortal` / `enablePortal`   | `boolean`                                             | `false`                      | 是否使用 `reborn-root-portal` 渲染，解决小程序原生组件层级问题             | UniApp |
| `color`                         | `'primary' \| 'success' \| 'warning' \| 'error' \| 'neutral'` | `'neutral'`          | 主题色（仅影响滑动手柄等）                                                 | UniApp |
| `appendToBody`                  | `boolean`                                             | `false`                      | 是否将弹出层 Teleport 至 `body` 节点                                       | Web    |
| `appendTo`                      | `string \| HTMLElement`                               | `'body'`                     | 指定弹出层插入的节点（非 `body` 时强制 Teleport）                          | Web    |
| `beforeClose`                   | `(done: (cancel?: boolean) => void) => void`          | -                            | 关闭前回调，会暂停关闭：`done()` 继续、`done(true)` 取消                   | Web    |
| `closeOnPressEscape`            | `boolean`                                             | `true`                       | 是否可以通过按下 ESC 键关闭                                                | Web    |
| `openDelay`                     | `number`                                              | `0`                          | 开启延迟（ms）                                                             | Web    |
| `closeDelay`                    | `number`                                              | `0`                          | 关闭延迟（ms）                                                             | Web    |
| `destroyOnClose`                | `boolean`                                             | `false`                      | 关闭后是否销毁内部元素                                                     | Web    |
| `resizable`                     | `boolean`                                             | `false`                      | 是否可通过边缘拖拽调整大小（`center` 位置不可用）                          | Web    |
| `modalPenetrable`               | `boolean`                                             | `false`                      | 遮罩层是否可穿透（不处理任何鼠标事件）                                     | Web    |
| `modalClass`                    | `string`                                              | `''`                         | 遮罩层的自定义类名                                                         | Web    |
| `headerClass`                   | `string`                                              | `''`                         | 头部的自定义类名                                                           | Web    |
| `bodyClass`                     | `string`                                              | `''`                         | 内容主体的自定义类名                                                       | Web    |
| `footerClass`                   | `string`                                              | `''`                         | 底部页脚的自定义类名                                                       | Web    |
| `headerAriaLevel`               | `string`                                              | `'2'`                        | 头部标题的 aria-level 属性                                                 | Web    |
| `class`                         | `any`                                                 | -                            | 自定义根元素类名                                                           | Web    |

### Emits

| 事件名              | 回调参数           | 说明                                       | 平台   |
| ------------------- | ------------------ | ------------------------------------------ | ------ |
| `update:modelValue` | `(value: boolean)` | 显隐状态变化时触发（`v-model` 同步）       | 通用   |
| `open`              | `-`                | 开启弹出层时触发（动画开始）               | 通用   |
| `opened`            | `-`                | 开启且动画完成时触发                       | 通用   |
| `close`             | `-`                | 关闭弹出层时触发（动画开始）               | 通用   |
| `closed`            | `-`                | 关闭且动画完成时触发                       | 通用   |
| `click-modal`       | `-`                | 点击遮罩层时触发                           | 通用   |
| `before-enter`      | `-`                | 进入过渡开始前触发                         | UniApp |
| `enter`             | `-`                | 进入过渡进行中触发（面板开始滑入）         | UniApp |
| `after-enter`       | `-`                | 进入过渡结束后触发                         | UniApp |
| `before-leave`      | `-`                | 离开过渡开始前触发                         | UniApp |
| `leave`             | `-`                | 离开过渡进行中触发（面板开始滑出）         | UniApp |
| `after-leave`       | `-`                | 离开过渡结束后触发                         | UniApp |
| `open-auto-focus`   | `-`                | 打开后焦点转移进弹层时触发                 | Web    |
| `close-auto-focus`  | `-`                | 关闭后焦点归还时触发                       | Web    |
| `resize-start`      | `-`                | 开始拖拽缩放时触发                         | Web    |
| `resize`            | `(size: number)`   | 拖拽缩放中持续触发，参数为最新尺寸（px）   | Web    |
| `resize-end`        | `-`                | 结束拖拽缩放时触发                         | Web    |

### Slots

| 插槽名    | 说明                                       | 平台 |
| --------- | ------------------------------------------ | ---- |
| `header`  | 头部区域，替换默认的标题文本               | 通用 |
| `default` | 弹层主体内容                               | 通用 |
| `footer`  | 底部页脚区域，常用于操作按钮组             | Web  |

### Expose

| 方法            | 说明                                                                     | 平台 |
| --------------- | ------------------------------------------------------------------------ | ---- |
| `handleClose()` | 手动关闭弹出层；Web 端配置了 `beforeClose` 时会先执行拦截回调            | 通用 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端 DOM 结构差异较大，可用键位也不同：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名       | 说明                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`  | 定位包装层。默认 `fixed pointer-events-none`，只负责把面板摆到视口的对应边；居中模式下它同时充当 flex 居中容器。层级由 `zIndex` 内联注入，别在这里写 `z-*`。 |
| `root`     | 面板本体（过渡动画的目标节点）。默认 `fixed bg-white dark:bg-gray-9 flex flex-col shadow-xl z-50 box-border p-1`，底色、圆角、阴影、内边距都改这里；`class` 与 `customClass` 也会并到同一节点。 |
| `resizer`  | 拖拽改变尺寸的把手。**仅 `resizable` 为真且 `position` 不为 `center` 时渲染**，默认透明、悬浮时 `bg-primary/20`。                                     |
| `header`   | 头部容器。**仅 `showHeader` 为真时渲染**，默认 `w-full flex items-center justify-between shrink-0`；`headerClass` 也会并到同一节点。                  |
| `title`    | 标题文本。默认 `text-base font-medium`。**填充 `header` 插槽会替换掉整块兜底内容**，该节点随之消失，`ui.title` 失效。                                 |
| `closeBtn` | 右上角关闭按钮（`RebornButton` 的圆形变体）。**仅 `showClose` 为真时渲染**。                                                                          |
| `body`     | 内容区，包裹 default 插槽。默认 `flex-1 overflow-y-auto scrollbar-hide min-h-0`，内边距与滚动行为改这里；`bodyClass` 也会并到同一节点。               |
| `footer`   | 页脚容器。**仅填充了 `footer` 插槽时才渲染**，默认 `border-t border-gray-1 shrink-0`；`footerClass` 也会并到同一节点。                                |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名        | 说明                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `base`      | 面板本体（过渡组件的 `custom-class`）。默认 `fixed bg-white`，位置类由 `position` 决定、圆角由 `round` 决定；底色与阴影改这里。 |
| `inner`     | 面板内层容器，默认 `relative`，是手柄、头部与内容的定位参照。整体内边距建议加在这里。                                          |
| `draw`      | 顶部的滑动手柄横条。默认 `mx-auto mt-2 h-1 w-10 rounded-full bg-gray-3`，颜色也受 `color` prop 影响。                          |
| `header`    | 头部容器。**仅 `showHeader` 为真时渲染**，默认 `flex items-center justify-between px-4 py-2`。                                 |
| `title`     | 标题文本 `<text>`，默认 `text-30 font-medium text-gray-9`。                                                                    |
| `closeIcon` | 右上角关闭图标 `<text>`（内置 `i-lucide-x`）。**仅 `showClose` 为真时渲染**，默认 `text-gray-5 cursor-pointer`，字号即图标大小。 |

:::

::

```vue
<template>
  <RebornPopup v-model="visible" position="bottom" round title="筛选" show-close
    :ui="{ root: 'rounded-t-2xl p-0', header: 'px-4 py-3', body: 'p-4' }">
    <div>内容</div>
  </RebornPopup>
</template>
```

## 注意事项

- web、uniapp 双端可用。
- `swipeClose` 仅在 `position="bottom"` 时生效，阈值 `swipeCloseThreshold` 按手指真实竖直位移判定（默认 120px），快速轻扫（flick）也会触发关闭。
- `safeAreaInsetBottom` / `safeAreaInsetTop` 默认均开启，仅在对应方位（bottom/top）弹出时注入安全区 padding。
- `lazyRender` 默认 `true`，内容首次显示时才渲染；`destroyOnClose`（仅 Web）默认 `false`。
- `zIndex` 默认值双端不同（Web 2000 / UniApp 25）；`color` 仅影响 UniApp 端的滑动手柄颜色。
- 渲染机制：Web 端用 Vue `Teleport`（`appendToBody` / `appendTo`）挂载；UniApp 端用 `rootPortal` 开启 `reborn-root-portal`，解决小程序中原生组件（map、video）层级过高或被父级 `overflow:hidden` 截断的问题。
- Web 端 `resizable` 在 `position="center"` 时不可用；拖拽结束尺寸不会持久化，关闭后恢复 `size`。
- 嵌套使用多层 Popup 时遮罩与层级自动叠加处理，无需手动管理 z-index。
