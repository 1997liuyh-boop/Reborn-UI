---
title: Dialog 对话框
description: 用于模态确认与内容展示的对话框组件，属性对齐 Element Plus Dialog，附 Modal 命令式确认框，仅 web 端。
category: 反馈
platform: web
---

::ComponentViewer{demoFile="RebornDialogDemo.vue" config="RebornDialogConfig" componentId="reborn-dialog" :componentFiles='["RebornDialog.vue", "reborn-dialog.config.ts", "index.ts"]'}

#api

::warning
**本组件仅 Web 端提供**，UniApp 端没有对应实现（`packages/uniapp-project` 下无 `reborn-dialog` 目录），因此下方 API 无需区分平台。UniApp 端的模态确认请改用 `RebornPopup` 自行组合，或用 `RebornActionSheet`；轻量反馈用双端通用的 `RebornToast`。
::

## Props

属性命名与 Element Plus Dialog 对齐，另保留 `describe` / `scrollable` / `cancelBtn` / `confirmBtn` 等扩展属性。

| 属性                        | 类型                             | 默认值         | 说明                                                                                       |
| :-------------------------- | :------------------------------- | :------------- | :----------------------------------------------------------------------------------------- |
| `model-value` / `v-model`   | `boolean`                        | `undefined`    | 是否显示 Dialog；未绑定时组件内部自管理（trigger 插槽点击即可打开）。                       |
| `title`                     | `string`                         | `''`           | 标题，也可通过 `header` 具名插槽传入。                                                     |
| `describe`                  | `string`                         | `''`           | 标题下方的描述文字，与标题间隔 8px。                                                       |
| `description`               | `string`                         | `''`           | `describe` 的旧属性名，保留兼容；两者同传时 `describe` 优先。                              |
| `width`                     | `string \| number`               | `''`           | 对话框宽度，数字按 `px` 处理；不传时走主题默认宽度（最大 560px）。                          |
| `fullscreen`                | `boolean`                        | `false`        | 是否全屏展示。                                                                             |
| `top`                       | `string`                         | `'15vh'`       | 非居中形态下距视口顶部的距离（`margin-top` 语义）。                                        |
| `modal`                     | `boolean`                        | `true`         | 是否需要遮罩层。                                                                           |
| `modal-penetrable`          | `boolean`                        | `false`        | 是否允许穿透遮罩层与背后页面交互；`modal` 必须为 `false` 才生效。                          |
| `append-to-body`            | `boolean`                        | `false`        | 是否插入至 body（本实现默认已挂载 body，该属性用于强制指回 body）。                        |
| `append-to`                 | `string \| HTMLElement`          | `'body'`       | 挂载到哪个 DOM 元素，会覆盖 `append-to-body`。                                             |
| `lock-scroll`               | `boolean`                        | `true`         | 出现时是否锁定 body 滚动。                                                                 |
| `open-delay`                | `number`                         | `0`            | 打开延时，单位毫秒。                                                                       |
| `close-delay`               | `number`                         | `0`            | 关闭延时，单位毫秒。                                                                       |
| `close-on-click-modal`      | `boolean`                        | `true`         | 是否可以通过点击遮罩关闭。                                                                 |
| `close-on-press-escape`     | `boolean`                        | `true`         | 是否可以通过按下 `Esc` 关闭。                                                              |
| `show-close`                | `boolean`                        | `true`         | 是否显示右上角关闭按钮。                                                                   |
| `before-close`              | `(done: () => void) => void`     | `undefined`    | 关闭前拦截：回调内执行 `done()` 才真正关闭，覆盖关闭按钮、取消、遮罩与 `Esc` 全部入口。    |
| `draggable`                 | `boolean`                        | `false`        | 是否启用拖拽（按住头部平移，全屏模式下无效）。                                             |
| `overflow`                  | `boolean`                        | `false`        | 拖动范围是否可以超出可视区；默认拖拽被限制在视口内。                                       |
| `center`                    | `boolean`                        | `false`        | header 与 footer 内容是否居中排列。                                                        |
| `align-center`              | `boolean`                        | `false`        | 是否水平垂直居中对话框；`false` 时按 `top` 顶部落位。                                      |
| `destroy-on-close`          | `boolean`                        | `false`        | 关闭时是否销毁其中的元素；`false` 时首开后 DOM 常驻、复用状态。                            |
| `close-icon`                | `string`                         | `'lucide:x'`   | 自定义关闭按钮图标名。                                                                     |
| `header-aria-level`         | `string`                         | `'2'`          | 标题的 `aria-level` 属性。                                                                 |
| `transition`                | `string \| object`               | `'scale'`      | 面板过渡动画：`scale` 缩放 / `slide` 滑动 / `fade` 淡入淡出 / `bounce` 弹跳；也接受任意 RebornTransition 过渡名或属性对象（`name` / `duration` 等）。 |
| `scrollable`                | `boolean`                        | `false`        | 正文区域是否独立滚动（页头页脚固定，扩展属性）。                                           |
| `cancelBtn`                 | `string \| false \| ButtonProps` | `'取消'`       | 取消按钮配置，传 `false` 时隐藏（扩展属性）。                                              |
| `confirmBtn`                | `string \| false \| ButtonProps` | `'确认'`       | 确认按钮配置，传 `false` 时隐藏（扩展属性）。                                              |
| `z-index`                   | `number`                         | `2400`         | Dialog 根层级。                                                                            |
| `class`                     | `any`                            | `-`            | 自定义弹窗面板类名。                                                                       |
| `ui`                        | `RebornDialogUi`                 | `{}`           | UI 覆盖配置。                                                                              |

## Slots

| 插槽名    | 作用域                             | 说明                                           |
| :-------- | :--------------------------------- | :--------------------------------------------- |
| `default` | `{ open, close }`                  | 对话框的正文内容。                             |
| `header`  | `{ open, close }`                  | 标题区内容；替换标题部分，但不会移除关闭按钮。 |
| `footer`  | `{ open, close, confirm, cancel }` | 底部操作区内容。                               |
| `trigger` | `{ open }`                         | 触发器内容，点击即打开 Dialog（扩展插槽）。    |

## Emits

| 事件名               | 回调参数         | 说明                                   |
| :------------------- | :--------------- | :------------------------------------- |
| `update:modelValue`  | `value: boolean` | 显示状态变更。                         |
| `before-open`        | `-`              | 打开动作发生时触发（动画开始前）。     |
| `opened`             | `-`              | 打开动画结束时触发。                   |
| `before-close`       | `-`              | 关闭动作发生时触发（动画开始前）。     |
| `closed`             | `-`              | 关闭动画结束时触发。                   |
| `open-auto-focus`    | `-`              | 输入焦点聚焦在 Dialog 内容时触发。     |
| `close-auto-focus`   | `-`              | 输入焦点从 Dialog 内容失焦时触发。     |
| `confirm`            | `-`              | 点击确认按钮时触发，默认不会自动关闭。 |
| `cancel`             | `-`              | 点击取消按钮时触发，随后走关闭流程。   |

## Exposes

| 名称            | 类型         | 说明                                       |
| :-------------- | :----------- | :----------------------------------------- |
| `open`          | `() => void` | 打开对话框。                               |
| `close`         | `() => void` | 关闭对话框（走 `before-close` 拦截流程）。 |
| `handleClose`   | `() => void` | 同 `close`，对齐 Element Plus 命名。       |
| `resetPosition` | `() => void` | 重置拖拽产生的位置偏移。                   |

## Modal 命令式调用

从 `~/components/reborn/ui/reborn-dialog` 导入 `Modal`，包含 `Modal.info` / `Modal.success` / `Modal.warning` / `Modal.error` / `Modal.confirm` 五个方法。参数为对象，支持上表全部 Props（驼峰形式），生命周期事件以 `onBeforeOpen` / `onOpened` / `onBeforeClose` / `onClosed` 传入，另有以下命令式专属项：

| 参数             | 类型                                                                                     | 说明                                                                                              |
| :--------------- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `content`        | `string \| VNode \| () => VNode`                                                         | 内容，渲染在 `describe` 描述位置（标题下方 8px、与标题文字左对齐）；未传时回退 `describe`。       |
| `icon`           | `string`                                                                                 | 自定义头部图标名，默认按类型取内置图标。                                                          |
| `okText`         | `string`                                                                                 | 确定按钮文案，默认「确定」。                                                                      |
| `cancelText`     | `string`                                                                                 | 取消按钮文案；`confirm` 类型默认渲染取消按钮，其余类型传入此项后也会渲染。                        |
| `onBeforeOk`     | `(done: (closed: boolean) => void) => void \| boolean \| Promise<void \| boolean>`       | 触发 ok 前的回调：返回 `false` 阻断后续事件；也可用 `done(true)` 异步关闭、`done(false)` 结束加载。 |
| `onBeforeCancel` | `() => boolean`                                                                          | 触发 cancel 前的回调，返回 `false` 阻断后续事件。                                                 |
| `onOk`           | `(close: () => void) => any`                                                             | 点击确定回调，参数为关闭函数；返回 Promise 时 resolve 关闭、reject 不关闭。                       |
| `onCancel`       | `(close: () => void) => any`                                                             | 点击取消回调（遮罩 / `Esc` / 关闭按钮同样进入此流程），Promise 语义同 `onOk`。                    |
| `onLoading`      | `boolean`                                                                                | 是否允许按钮加载中状态：异步回调未落定期间按钮显示 loading，默认开启。                            |

方法返回 `{ close, destroy }` 实例句柄：`close()` 走关闭动画正常关闭，`destroy()` 立即销毁。`Modal.destroyAll()` 可批量销毁所有存活的确认框，常用于路由监听中处理前进/后退无法逐个关闭的问题。

```ts
import { Modal } from "~/components/reborn/ui/reborn-dialog";

Modal.confirm({
  title: "确认删除该分支？",
  content: "删除后未合并提交将无法恢复。",
  okText: "删除",
  onBeforeOk: (done) => {
    // 异步校验，确定按钮自动进入 loading
    setTimeout(() => done(true), 2000);
  },
});

// 路由切换时批量销毁
Modal.destroyAll();
```

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名：

| 键名            | 说明                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger`       | 触发器包裹层。**仅填充了 trigger 插槽时渲染**，默认 `inline-flex`。                                                                                              |
| `root`          | Teleport 之后的全屏根节点，默认 `fixed inset-0`；层级由内联样式写入，遮罩之外的定位上下文改这里。                                                                |
| `backdrop`      | 遮罩层，默认 `absolute inset-0 bg-black/45`（刻意不做 backdrop-blur——全屏背景模糊在动画期间每帧重算会严重掉帧）；`modal=false` 时转为透明拦截层。               |
| `shell`         | 面板定位壳（静态层，不参与动画）。负责水平居中与垂直落点：`align-center` 时 flex 垂直居中，否则顶部按 `top` 落位；点击面板外空白等同点击遮罩。                   |
| `panelWrapper`  | 面板动画包裹层（过渡动画作用在这一层）：只有面板大小，避免整屏尺寸图层参与缩放导致每帧重栅格化。                                                                 |
| `panel`         | 弹窗面板本体。默认 `relative flex w-full max-w-[560px] flex-col gap-[20px] overflow-hidden rounded-ui-md border bg-white py-[20px] px-[24px] shadow-…`；内边距与三段间距统一在此，`width` prop 与 `class` prop 也作用于该节点。 |
| `header`        | 头部条（无分隔线）。**仅传了 `title` / `describe` 或填充 `header` 插槽时渲染**，默认 `flex items-start justify-between gap-4`，拖拽手柄绑定在它身上。             |
| `headerContent` | 头部左侧的文字区容器，默认 `flex min-w-0 flex-1 flex-col gap-[8px]`（标题与描述间隔 8px）；它在 `header` 插槽外层，填充插槽后依然生效。                          |
| `title`         | 标题节点（`role="heading"`，层级由 `header-aria-level` 指定），16px / `font-medium` / `text-gray-10`。**仅在传了 `title` 且未填充 `header` 插槽时渲染**。         |
| `description`   | 描述 `<p>`，14px / `text-gray-8`。**仅在传了 `describe` 且未填充 `header` 插槽时渲染**。                                                                         |
| `close`         | 右上角关闭图标，`size-[18px]`。**仅 `show-close` 为真时渲染**，图标名走 `close-icon` prop。                                                                      |
| `body`          | 内容区，承载 `default` 插槽；内边距由面板统一给出，滚动配合 `scrollable` 改这里。                                                                                |
| `footer`        | 底部条（无分隔线）。**仅底部有内容时渲染**（填充了 `footer` 插槽或启用了确认/取消按钮），默认 `flex items-center justify-end gap-3` 按钮靠右，取消/确认按钮默认参数为 `neutral+outlined` / `filled`（均 `size=md`、`border-style=solid`）。 |

```vue
<template>
  <RebornDialog
    v-model="open"
    title="删除确认"
    describe="该操作不可撤销"
    :width="420"
    align-center
    :ui="{
      backdrop: 'bg-black/60',
      panel: 'rounded-2xl',
      title: 'text-base font-bold',
      footer: 'justify-between',
    }"
  />
</template>
```

## 默认行为

- `trigger` 插槽与 `v-model` 可以同时参与打开 Dialog，不会互斥；未绑定 `v-model` 时组件内部自管理显隐。
- 默认按 `top`（15vh）顶部落位，`align-center` 开启后改为水平垂直居中。
- 点击取消按钮时会先触发 `cancel`，随后执行关闭流程；点击确认按钮只触发 `confirm`，默认不会自动关闭。
- `close-on-click-modal` / `close-on-press-escape` 分别控制遮罩点击与 `Esc` 关闭。
- `before-close` 会拦截右上角关闭、取消按钮、点击遮罩和 `Esc` 等全部关闭动作。
- `destroy-on-close=false`（默认）时首开后内容 DOM 常驻，重开即复用；开启后每次关闭都会销毁内容。
- `center` 只影响 header / footer 的内容排布，关闭按钮始终固定在面板右上角，不随居中偏移。

::
