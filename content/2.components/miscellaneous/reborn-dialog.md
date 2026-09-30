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

::

## 简介

Dialog 是居中弹出的模态面板，由标题区、正文区和按钮区三段组成。属性命名对齐 Element Plus Dialog（`closeOnClickModal`、`alignCenter`、`beforeClose` 等），迁移时基本不用改名；另外扩展了 `describe` 描述行、`scrollable` 正文滚动和 `cancelBtn` / `confirmBtn` 按钮配置。

显隐有两种控制方式：绑定 `v-model` 受控，或者不绑定、把触发按钮放进 `trigger` 插槽由组件自管理，两者可以同时使用。确认按钮只抛出 `confirm` 事件、不会自动关闭，所以"提交成功后再关"的流程不需要额外拦截；取消按钮、右上角关闭、点击遮罩和 `Esc` 则统一走关闭流程，并都经过 `beforeClose`。

除组件用法外，`index.ts` 还导出了 `Modal` 命令式确认框（`Modal.info` / `success` / `warning` / `error` / `confirm`），不需要在模板里预先占位，适合在请求回调、路由守卫这类逻辑里直接弹出。

### 何时使用

- 删除、覆盖、提交这类需要用户明确确认的操作：用 `Modal.confirm`，一行调用即可，`onBeforeOk` 能挂异步校验。
- 在当前页完成一小段表单填写或信息查看，不想跳转页面：组件式 Dialog，正文放表单，`confirmBtn` 传对象控制 loading。
- 长篇协议、更新日志等内容较多的阅读场景：开启 `scrollable`，页头页脚固定，只滚正文。
- 需要在任意逻辑里唤起、并等待用户操作结果的二次封装弹窗：配合 `useOverlay` 创建实例后 `await open()`。

### 何时不使用

- 侧边抽屉或底部面板：Web 用 `reborn-drawer` 按方位贴边滑入；UniApp 用 `reborn-popup`。
- 只需告知结果、不需要用户操作的轻提示：用 `reborn-toast`，它会自动消失，不打断流程。
- 跟随某个按钮的轻量二次确认：用 `reborn-popconfirm`，气泡就近展示，不遮挡整页。

## 用法

### 命令式调用：Modal 类型方法

`Modal.info` / `success` / `warning` / `error` / `confirm` 按类型带出对应图标并直接打开确认框，默认宽 420、垂直居中、不显示右上角关闭按钮。`confirm` 类型默认带取消按钮，其余类型传了 `cancelText` 才会出现取消按钮。`onBeforeOk` 返回 `false` 可阻断确定，或通过 `done(true)` 异步关闭；`onOk` / `onCancel` 返回 Promise 时 resolve 才关闭。`Modal.destroyAll()` 一次销毁所有存活的确认框。

```ts
import { Modal } from "~/components/reborn/ui/reborn-dialog";

Modal.confirm({
  title: "确认删除该分支？",
  content: "删除后分支上的未合并提交将无法恢复，此操作不可撤销。",
  okText: "删除",
  onBeforeOk: (done) => {
    // 确定按钮在 done 调用前保持 loading
    setTimeout(() => done(true), 2000);
  },
});

// 路由切换时统一清理
Modal.destroyAll();
```

### 布局：顶部落位、垂直居中与头尾居中

默认按 `top`（`15vh`）顶部落位；`alignCenter` 改为水平垂直居中，此时 `top` 不再生效；`center` 让标题区与按钮区的内容居中排列，关闭按钮改为绝对定位留在右上角。`width` 传数字按 px 处理，也可传任意 CSS 宽度。

```vue
<template>
  <RebornDialog v-model="open" title="布局演示" describe="头尾居中，宽度 360px。" align-center center :width="360"
    confirm-btn="知道了" :cancel-btn="false">
    <p>正文内容</p>
  </RebornDialog>
</template>
```

### 过渡动画预设

`transition` 内置四种预设：`scale` 缩放（默认）、`slide` 自上方滑入、`fade` 淡入淡出、`bounce` 弹跳（入场走关键帧，离场是普通缩放淡出）。传其他字符串会当作 RebornTransition 的过渡名，传对象则作为过渡属性透传。

```vue
<template>
  <RebornDialog v-model="open" title="过渡动画演示" transition="slide" align-center>
    <p>关闭时同样带对应的离场动画。</p>
  </RebornDialog>
</template>
```

### 嵌套弹窗

内层 Dialog 可以直接写在外层的插槽里（示例写在外层的 `footer` 插槽）。各层默认 `zIndex` 都是 2400，上下顺序靠 Teleport 挂载先后决定，内层后挂载所以在上面；滚动锁按引用计数管理，内层关闭时不会提前解除外层的锁。

```vue
<template>
  <RebornDialog v-model="outerOpen" title="第一层对话框">
    <template #trigger>
      <RebornButton label="开启嵌套流程" />
    </template>
    <p>第一层业务内容</p>
    <template #footer>
      <RebornDialog v-model="innerOpen" title="第二层确认">
        <template #trigger>
          <RebornButton label="下一步" color="primary" />
        </template>
        <p>此操作不可撤销。</p>
        <template #footer>
          <RebornButton label="我已确认" color="primary" @click="innerOpen = false; outerOpen = false" />
        </template>
      </RebornDialog>
    </template>
  </RebornDialog>
</template>
```

### 长内容：scrollable 正文滚动

开启 `scrollable` 后正文区加上 `overflow-y-auto`，内容超出时只滚正文，标题区和按钮区保持在面板内。未开启时组件会拦截根节点上的滚轮事件，内容过长会被面板截断，所以长文本务必开启此项。

```vue
<template>
  <RebornDialog title="用户服务协议" describe="更新日期：2026年3月" scrollable>
    <template #trigger>
      <RebornButton label="阅读协议详情" />
    </template>
    <div class="whitespace-pre-wrap">{{ longContent }}</div>
  </RebornDialog>
</template>
```

### 异步确认：按钮 loading

`confirmBtn` / `cancelBtn` 除字符串外还能传 `ButtonProps` 对象（传 `false` 隐藏）。因为确认按钮不会自动关闭，可以在 `confirm` 回调里发请求，期间把 `loading` 置真、隐藏取消按钮，完成后再把 `v-model` 置为 `false`。

```vue
<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
const saving = ref(false);

function handleConfirm() {
  saving.value = true;
  setTimeout(() => {
    saving.value = false;
    open.value = false;
  }, 2000);
}
</script>

<template>
  <RebornDialog v-model="open" title="同步云端设置" :confirm-btn="{ label: '立即同步', loading: saving }"
    :cancel-btn="saving ? false : '稍后再说'" @confirm="handleConfirm">
    <p>系统检测到 3 项配置需要合并同步。</p>
  </RebornDialog>
</template>
```

### 拖拽与 ui 样式定制

`draggable` 后按住标题区即可平移面板（标题区里的按钮、输入框不触发拖拽，全屏时无效），默认拖动范围限制在可视区内，开启 `overflow` 后可以拖出屏幕；每次重新打开都会复位，也可调用 expose 的 `resetPosition()`。`ui` 按结构键覆盖各节点类名，键位见「自定义样式（ui）」。

```vue
<template>
  <RebornDialog title="自由拖拽" describe="按住标题区域即可平移。" draggable />

  <RebornDialog :show-close="false" title="精简模式" :ui="{
    panel: 'max-w-[360px] rounded-3xl',
    body: 'text-center pt-2 pb-6',
    footer: 'justify-center pb-6',
  }">
    <p>您的设置已即时生效。</p>
  </RebornDialog>
</template>
```

### 服务式调用：延迟、全屏与关闭图标

通过 `useOverlay().create(RebornDialog, { props })` 创建实例，之后在任意逻辑里 `await instance.open()`，不需要在模板里占位。示例同时演示了三个属性：`openDelay` / `closeDelay` 推迟开关动作（单位 ms），`fullscreen` 铺满视口并去掉圆角，`closeIcon` 替换右上角图标。

```ts
import { useOverlay } from "~/composables/useOverlay";
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

const overlay = useOverlay();
const delayedDialog = overlay.create(RebornDialog, {
  props: {
    title: "延迟效果演示",
    describe: "此对话框有 500ms 的打开和关闭延迟",
    openDelay: 500,
    closeDelay: 500,
  },
});

await delayedDialog.open();
```

## API

### Props

属性命名与 Element Plus Dialog 对齐，另保留 `describe` / `scrollable` / `cancelBtn` / `confirmBtn` 等扩展属性。

| 属性名                    | 类型                                       | 默认值       | 描述                                                                                                                                         |
| :------------------------ | :----------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `model-value` / `v-model` | `boolean`                                  | `undefined`  | 是否显示 Dialog；未绑定时组件内部自管理（trigger 插槽点击即可打开）。                                                                        |
| `title`                   | `string`                                   | `''`         | 标题，也可通过 `header` 具名插槽传入。                                                                                                       |
| `describe`                | `string`                                   | `''`         | 标题下方的描述文字，与标题间隔 8px。                                                                                                         |
| `description`             | `string`                                   | `''`         | `describe` 的旧属性名，保留兼容；两者同传时 `describe` 优先。                                                                                |
| `width`                   | `string \| number`                         | `''`         | 对话框宽度，数字按 `px` 处理；不传时走主题默认宽度（最大 560px）。                                                                           |
| `fullscreen`              | `boolean`                                  | `false`      | 是否全屏展示；开启后 `width`、`top`、拖拽均不生效。                                                                                          |
| `top`                     | `string`                                   | `'15vh'`     | 非居中形态下距视口顶部的距离（`margin-top` 语义）；`alignCenter` 或 `fullscreen` 时忽略。                                                    |
| `modal`                   | `boolean`                                  | `true`       | 是否需要遮罩层；`false` 时遮罩变为透明，仍拦截点击。                                                                                         |
| `modal-penetrable`        | `boolean`                                  | `false`      | 是否允许穿透遮罩层与背后页面交互；`modal` 必须为 `false` 才生效。                                                                            |
| `append-to-body`          | `boolean`                                  | `false`      | 是否插入至 body（本实现默认已挂载 body，该属性用于强制指回 body）。                                                                          |
| `append-to`               | `string \| HTMLElement`                    | `'body'`     | 挂载到哪个 DOM 元素；`append-to-body` 为真时以它为准。                                                                                       |
| `lock-scroll`             | `boolean`                                  | `true`       | 出现时是否锁定 body 滚动；多个 Dialog 共享引用计数，最后一个关闭 200ms 后才解锁。                                                            |
| `open-delay`              | `number`                                   | `0`          | 打开延时，单位毫秒。                                                                                                                         |
| `close-delay`             | `number`                                   | `0`          | 关闭延时，单位毫秒。                                                                                                                         |
| `close-on-click-modal`    | `boolean`                                  | `true`       | 是否可以通过点击遮罩（含面板外空白处）关闭。                                                                                                 |
| `close-on-press-escape`   | `boolean`                                  | `true`       | 是否可以通过按下 `Esc` 关闭。                                                                                                                |
| `show-close`              | `boolean`                                  | `true`       | 是否显示右上角关闭按钮；关闭按钮位于标题区内，没有标题区时不渲染。                                                                           |
| `before-close`            | `(done: () => void) => void`               | `undefined`  | 关闭前拦截：回调内执行 `done()` 才真正关闭，覆盖关闭按钮、取消、遮罩、`Esc` 与 expose 的 `close()`。                                         |
| `draggable`               | `boolean`                                  | `false`      | 是否启用拖拽（按住头部平移，全屏模式下无效）。                                                                                               |
| `overflow`                | `boolean`                                  | `false`      | 拖动范围是否可以超出可视区；默认拖拽被限制在视口内。                                                                                         |
| `center`                  | `boolean`                                  | `false`      | header 与 footer 内容是否居中排列。                                                                                                          |
| `align-center`            | `boolean`                                  | `false`      | 是否水平垂直居中对话框；`false` 时按 `top` 顶部落位。                                                                                        |
| `destroy-on-close`        | `boolean`                                  | `false`      | 关闭时是否销毁其中的元素；`false` 时首开后 DOM 常驻、复用状态。                                                                              |
| `close-icon`              | `string`                                   | `'lucide:x'` | 自定义关闭按钮图标名。                                                                                                                       |
| `header-aria-level`       | `string`                                   | `'2'`        | 标题的 `aria-level` 属性。                                                                                                                   |
| `transition`              | `DialogTransition`                         | `'scale'`    | 面板过渡动画：`scale` 缩放 / `slide` 滑动 / `fade` 淡入淡出 / `bounce` 弹跳；也接受任意 RebornTransition 过渡名或属性对象（`name` / `duration` 等）。 |
| `scrollable`              | `boolean`                                  | `false`      | 正文区域是否独立滚动（页头页脚固定，扩展属性）；关闭时根节点会拦截滚轮事件。                                                                 |
| `cancelBtn`               | `string \| false \| ButtonProps`           | `'取消'`     | 取消按钮配置，传 `false` 时隐藏（扩展属性）；默认 `neutral` + `outlined`。                                                                   |
| `confirmBtn`              | `string \| false \| ButtonProps`           | `'确认'`     | 确认按钮配置，传 `false` 时隐藏（扩展属性）；默认 `filled`。                                                                                 |
| `z-index`                 | `number`                                   | `2400`       | Dialog 根层级；嵌套时不会自动递增。                                                                                                          |
| `class`                   | `any`                                      | `-`          | 自定义弹窗面板类名（作用于 `panel` 节点，不是根节点）。                                                                                      |
| `ui`                      | `RebornDialogUi`                           | `{}`         | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                                                                 |

### Emits

| 事件名              | 回调参数           | 描述                                                              |
| :------------------ | :----------------- | :---------------------------------------------------------------- |
| `update:modelValue` | `(value: boolean)` | 显示状态变更。                                                    |
| `beforeOpen`        | `-`                | 打开动作发生时触发（动画开始前，已计入 `openDelay`）。            |
| `opened`            | `-`                | 打开动画结束时触发。                                              |
| `beforeClose`       | `-`                | 关闭动作发生时触发（动画开始前，已计入 `closeDelay`）。           |
| `closed`            | `-`                | 关闭动画结束时触发。                                              |
| `openAutoFocus`     | `-`                | 打开动画结束、焦点移入面板后触发，与 `opened` 同时发出。          |
| `closeAutoFocus`    | `-`                | 关闭动画结束、焦点归还给打开前的元素后触发，与 `closed` 同时发出。 |
| `confirm`           | `-`                | 点击确认按钮时触发，默认不会自动关闭。                            |
| `cancel`            | `-`                | 点击取消按钮时触发，随后走关闭流程（经过 `before-close`）。       |

### Slots

| 插槽名    | 作用域参数                         | 描述                                                                                                 |
| :-------- | :--------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `default` | `{ open, close }`                  | 对话框的正文内容；不传时不渲染正文区。                                                               |
| `header`  | `{ open, close }`                  | 标题区内容；替换标题与描述，但保留右上角关闭按钮。                                                   |
| `footer`  | `{ open, close, confirm, cancel }` | 底部操作区内容；`confirm` / `cancel` 与默认按钮行为一致（`cancel` 会走关闭流程）。                   |
| `trigger` | `{ open }`                         | 触发器内容，点击即打开 Dialog（扩展插槽）；`open` 是当前是否打开的布尔值，不是打开函数。             |

`header` / `default` / `footer` 作用域里的 `open` 同样是布尔值，`close` 是关闭函数（等同 expose 的 `close`）。

### Expose

| 方法名          | 签名         | 描述                                       |
| :-------------- | :----------- | :----------------------------------------- |
| `open`          | `() => void` | 打开对话框。                               |
| `close`         | `() => void` | 关闭对话框（走 `before-close` 拦截流程）。 |
| `handleClose`   | `() => void` | 同 `close`，对齐 Element Plus 命名。       |
| `resetPosition` | `() => void` | 重置拖拽产生的位置偏移。                   |

### Modal 命令式调用

从 `~/components/reborn/ui/reborn-dialog` 导入 `Modal`，包含 `Modal.info` / `Modal.success` / `Modal.warning` / `Modal.error` / `Modal.confirm` 五个方法。参数为对象，支持除 `cancelBtn` / `confirmBtn` / `beforeClose` 外的全部 Props（驼峰形式），默认值改为 `width: 420`、`alignCenter: true`、`showClose: false`；生命周期事件以 `onBeforeOpen` / `onOpened` / `onBeforeClose` / `onClosed` 传入，另有以下命令式专属项：

| 参数             | 类型                                                                               | 描述                                                                                                |
| :--------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| `content`        | `string \| VNode \| () => VNode`                                                   | 内容，渲染在 `describe` 描述位置（标题下方 8px、与标题文字左对齐）；未传时回退 `describe`。         |
| `icon`           | `string`                                                                           | 自定义头部图标名，默认按类型取内置图标。                                                            |
| `okText`         | `string`                                                                           | 确定按钮文案，默认「确定」。                                                                        |
| `cancelText`     | `string`                                                                           | 取消按钮文案；`confirm` 类型默认渲染取消按钮，其余类型传入此项后也会渲染。                          |
| `onBeforeOk`     | `(done: (closed: boolean) => void) => void \| boolean \| Promise<void \| boolean>` | 触发 ok 前的回调：返回 `false` 阻断后续事件；也可用 `done(true)` 异步关闭、`done(false)` 结束加载。 |
| `onBeforeCancel` | `() => boolean`                                                                    | 触发 cancel 前的回调，返回 `false` 阻断后续事件。                                                   |
| `onOk`           | `(close: () => void) => any`                                                       | 点击确定回调，参数为关闭函数；返回 Promise 时 resolve 关闭、reject 不关闭。                         |
| `onCancel`       | `(close: () => void) => any`                                                       | 点击取消回调（遮罩 / `Esc` / 关闭按钮同样进入此流程），Promise 语义同 `onOk`。                      |
| `onLoading`      | `boolean`                                                                          | 是否允许按钮加载中状态：异步回调未落定期间按钮显示 loading，默认开启。                              |

方法返回 `{ close, destroy }` 实例句柄：`close()` 走关闭动画正常关闭，`destroy()` 立即销毁。`Modal.destroyAll()` 可批量销毁所有存活的确认框，常用于路由监听中处理前进/后退无法逐个关闭的问题。

内置类型图标：`info` → `lucide:info`、`success` → `lucide:circle-check`、`warning` → `lucide:circle-alert`、`error` → `lucide:circle-x`、`confirm` → `lucide:circle-help`。

### 自定义样式（ui）

`ui` 按 `reborn-dialog.config.ts` 的 `slots` 覆盖对应节点的类名，共 13 个键：

| 键名            | 描述                                                                                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger`       | 触发器包裹层。**仅填充了 trigger 插槽时渲染**，默认 `inline-flex`，点击它即打开。                                                                                                                                                  |
| `root`          | Teleport 之后的全屏根节点，默认 `fixed inset-0`；层级由 `zIndex` 以内联样式写入。`modalPenetrable` 生效时追加 `pointer-events-none`。                                                                                              |
| `backdrop`      | 遮罩层，默认 `absolute inset-0 bg-black/45`（刻意不做 backdrop-blur——全屏背景模糊在动画期间每帧重算会严重掉帧）；`modal=false` 时转为 `bg-transparent` 的透明拦截层，`modalPenetrable` 生效时不渲染。                            |
| `shell`         | 面板定位壳（静态层，不参与动画），默认 `absolute inset-0 flex justify-center px-4 sm:px-6`：`alignCenter` 时加 `items-center` 垂直居中，否则 `items-start` 并按 `top` 写入顶部内边距；点击面板外空白等同点击遮罩。                |
| `panelWrapper`  | 面板动画包裹层（过渡动画作用在这一层），默认 `flex w-full justify-center pointer-events-none`：只有面板大小，避免整屏尺寸图层参与缩放导致每帧重栅格化。                                                                          |
| `panel`         | 弹窗面板本体。默认 `pointer-events-auto relative flex w-full max-w-[560px] flex-col gap-[20px] overflow-hidden rounded-xl border bg-white py-[20px] px-[24px] shadow-…`；`fullscreen` 时改为 `h-full`、去掉最大宽度与圆角。`width` prop 与 `class` prop 也作用于该节点。 |
| `header`        | 头部条（无分隔线），默认 `flex items-start justify-between gap-4`，拖拽手柄绑定在它身上。**仅传了 `title` / `describe` 或填充 `header` 插槽时渲染**；`center` 时追加 `justify-center px-[26px]`。                                 |
| `headerContent` | 头部左侧的文字区容器，默认 `flex min-w-0 flex-1 flex-col gap-[8px]`（标题与描述间隔 8px）；它在 `header` 插槽外层，填充插槽后依然生效。                                                                                          |
| `title`         | 标题节点（`role="heading"`，层级由 `header-aria-level` 指定），默认 `text-lg font-medium text-gray-10`。**仅在传了 `title` 且未填充 `header` 插槽时渲染**。                                                                       |
| `description`   | 描述 `<p>`，默认 `text-base text-gray-8`。**仅在传了 `describe`（或 `description`）且未填充 `header` 插槽时渲染**。                                                                                                               |
| `close`         | 右上角关闭图标，默认 `size-[18px] shrink-0 cursor-pointer text-gray-5`。**仅 `show-close` 为真且标题区渲染时出现**，图标名走 `close-icon` prop；`center` 时改为 `absolute top-[20px] right-[24px]`。                              |
| `body`          | 内容区，承载 `default` 插槽，默认无类名（`overflow-visible`），`scrollable` 时改为 `overflow-y-auto`。**未传 default 插槽时不渲染**。                                                                                             |
| `footer`        | 底部条（无分隔线），默认 `flex items-center justify-end gap-3` 按钮靠右。**仅底部有内容时渲染**（填充了 `footer` 插槽或至少启用了一个默认按钮）；`center` 时按钮居中。                                                           |

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

## 注意事项

- **`trigger` 插槽与 `v-model` 可以同时参与打开 Dialog，不会互斥**；未绑定 `v-model` 时组件内部自管理显隐。
- **确认按钮不会自动关闭**。点击确认只触发 `confirm`，需要自己把 `v-model` 置为 `false`；点击取消会先触发 `cancel`，再执行关闭流程。
- **直接改 `v-model` 不经过 `before-close`**。拦截只作用于关闭按钮、取消按钮、遮罩、`Esc` 和 expose 的 `close()` / `handleClose()`。
- **没有标题区就没有关闭按钮**。关闭图标放在头部条里，既没传 `title` / `describe` 也没填 `header` 插槽时，`show-close` 为真也不会显示，此时应保证按钮区或遮罩能关闭。
- **嵌套时按一次 `Esc` 会同时关闭所有打开的层**。每个 Dialog 打开期间各自在 `document` 上监听 `keydown`，不区分最上层；需要逐层关闭时给外层设 `close-on-press-escape="false"`，或用 `before-close` 拦截。
- **嵌套弹窗不会自动递增 `z-index`**。各层都是 2400，靠挂载先后决定上下；挂到不同容器时需要手动给内层更大的 `zIndex`。
- **长内容必须开 `scrollable`**。未开启时根节点会 `preventDefault` 滚轮事件（`modalPenetrable` 生效时除外），面板本身 `overflow-hidden`，超长内容既滚不动也看不全。
- `destroy-on-close=false`（默认）时首开后内容 DOM 常驻，重开即复用；开启后每次关闭都会销毁内容。
- 打开时焦点移入面板，关闭后归还给打开前的焦点元素（例如 trigger 按钮）。
