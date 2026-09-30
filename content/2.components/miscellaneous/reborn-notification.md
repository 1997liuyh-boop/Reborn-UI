---
title: Notification 通知
description: 屏幕四角弹出的全局通知：标题 + 正文 + 底部操作区三段结构，支持倒计时进度条、悬停暂停、同 key 更新，属性基本对齐 Element Plus Notification，仅 web 端。
category: 反馈
platform: web
---

::ComponentViewer{demoFile="RebornNotificationDemo.vue" config="RebornNotificationConfig" componentId="reborn-notification" :componentFiles='["RebornNotification.vue", "index.ts", "reborn-notification.config.ts"]'}
::

## 简介

Notification 是命令式的全局通知：调用 `notification.success({ title, message })`，屏幕一角弹出一块面板，默认 4500 毫秒后自动消失。它和 `RebornToast` 的区别在结构上：通知有标题、可换行的正文和可选的底部操作区，能承载一句话以上的信息。

组件不写在模板里，没有 Props 与插槽，所有能力都通过导入的 `notification` 对象调用。容器在首次调用时由 `createVNode` + `render` 挂到 `appendTo`（默认 `document.body`），因此无需在页面里放置 `<RebornNotification />`。

每条通知由一个 config 对象描述，属性命名对齐 Element Plus Notification（弹出位置除外：用 `placement`，与本库浮层组件统一），另扩展了 `ribbon` / `footer` / `key` / `style` / `ui`。另有 `notification.system()` 调用浏览器原生 Notification，在操作系统层面弹出提示。

::warning
**本组件仅 Web 端提供**，UniApp 端没有对应实现（`packages/uniapp-project` 下无 `reborn-notification` 目录），因此下方 API 无需区分平台。`appendTo` / `zIndex` / VNode 正文 / `dangerouslyUseHTMLString` 都依赖 DOM，无法在小程序端等价实现。UniApp 端的轻量反馈请用双端通用的 `RebornToast`，页面内常驻说明用 `RebornAlert`。
::

### 何时使用

- 后台任务完成（部署、导出、同步）后播报结果：用户可能已经离开触发操作的位置，通知落在屏幕角落，不打断当前操作。
- 系统公告与版本更新提示：需要一个标题加一两句说明，Toast 的单行放不下。
- 带「查看详情 / 稍后处理」等后续动作的异步消息：`footer` 可放按钮，`duration: 0` 让它停留到用户处理为止。

### 何时不使用

- 单句操作反馈：用 `RebornToast`，结构更轻，不会占住屏幕一角。
- 需要用户当场确认或选择：用 `RebornDialog`。通知不阻塞操作，用户可以完全忽略它。
- 页面内常驻的状态说明：用 `RebornAlert`。通知会自动消失，也不跟随页面内容滚动。

## 用法

### 基础用法

先导入 `notification` 对象：

```ts
import { notification } from "~/components/reborn/ui/reborn-notification";
```

四个类型方法等价于 `open` 加上对应的 `type`，决定默认图标与语义配色；`open` 不带类型，即无图标、无着色。参数可以是完整 config，也可以直接传字符串，视作正文内容：

```ts
notification.success({ title: "保存成功", message: "草稿已同步到云端。" });
notification.error({ title: "提交失败", message: "网络异常，请稍后重试。" });
notification.warning({ title: "额度即将用尽", message: "本月剩余调用次数不足 5%。" });
notification.info({ title: "新版本可用", message: "重启应用后生效。" });
notification.open({ title: "纯文本通知", message: "没有类型时不显示图标。" });

// 只有正文
notification.info("已进入只读模式");
```

### 弹出位置：placement 四角

`placement` 支持屏幕四角，取值沿用浮层组件的连字符写法：`top-end` 右上（默认）、`top-start` 左上、`bottom-end` 右下、`bottom-start` 左下。通知没有 rtl 配置，start 固定贴左、end 固定贴右。顶部两角向下堆叠、底部两角向上堆叠，新通知始终贴着锚定边。四条边的贴边留白统一为 16px；贴视口时会扣掉滚动条占位，让横向与纵向的视觉留白一致。`offset` 只叠加在纵向（顶部或底部）留白之上：

```ts
notification.info({ title: "bottom-start", message: "这条通知弹在左下角。", placement: "bottom-start" });
notification.info({ message: "顶部再下移 64px", offset: 64 });
```

`offset` 是容器级设置，写入后对四个角的所有通知同时生效，见「注意事项」。

### 倒计时进度条：progress

`progress` 设为 `true` 显示默认进度条，颜色跟随通知类型；传对象可自定义 `strokeColor` / `size` / `striped` / `stripedFlow` / `class`。进度条动画时长就是 `duration`，`pauseOnHover` 开启（默认开启）时，悬停会同时冻结计时器与进度条：

```ts
notification.success({ title: "默认进度条", message: "进度条颜色跟随通知类型。", progress: true });

notification.info({
  title: "加粗条纹",
  message: "轨道 6px + 流动条纹。",
  duration: 8000,
  progress: { size: 6, striped: true, stripedFlow: true },
});

notification.open({
  title: "自定义颜色",
  message: "悬停面板可暂停倒计时。",
  duration: 8000,
  progress: { strokeColor: "#7c3aed" },
});
```

`duration` 为 0 时没有倒计时可指示，进度条不渲染。

### 侧边飘带：ribbon

`ribbon` 在面板内边加一条 3px 竖条，颜色取 `type` 的语义色（未设 `type` 时为品牌主色）；`true` 或 `'left'` 贴左，`'right'` 贴右。飘带是绝对定位，压在面板内边距上，不挤占正文宽度，可与进度条同时开启：

```ts
notification.success({ title: "发布成功", message: "飘带贴左，颜色跟随 success。", ribbon: true });
notification.error({ title: "构建失败", message: "飘带贴右，颜色跟随 error。", ribbon: "right" });
notification.warning({ title: "配额告急", ribbon: "left", progress: true, duration: 8000 });
notification.open({ title: "无类型通知", message: "没有 type 时飘带取主色。", ribbon: "left" });
```

### 富文本与 VNode 正文

`message` 为字符串时贴在标题下方（间隔 8px），开启 `dangerouslyUseHTMLString` 后按 HTML 片段渲染。传 VNode 或返回 VNode 的函数时，正文**独立成段**，渲染在头部之外的 `body` 节点里（与头部间隔 20px），可配合 `footer` 放置操作按钮：

```ts
// 按 HTML 片段渲染
notification.open({
  title: "版本更新",
  message: "已升级至 <strong>v2.4.0</strong>",
  dangerouslyUseHTMLString: true,
});

// VNode 正文 + 底部操作区
notification.info({
  title: "李工 邀请你加入项目",
  message: () => h("span", "项目：Reborn-UI 组件库重构"),
  footer: () =>
    h("div", { class: "flex gap-2" }, [
      h(RebornButton, { size: "sm", variant: "soft", color: "neutral" }, () => "稍后处理"),
      h(RebornButton, { size: "sm" }, () => "接受邀请"),
    ]),
  duration: 0,
});
```

::warning
`dangerouslyUseHTMLString` 会把 `message` 当作 HTML 直接插入（内部走 `v-html`），**绝不能拼接用户输入**，否则会导致 XSS。需要展示不可信内容时改用 VNode 正文。
::

### 自定义图标、关闭图标与点击回调

`icon` 接受图标名或 VNode，但设置了 `type` 时会被类型图标覆盖，所以自定义图标要配合 `open` 使用；`closeIcon` 同样接受图标名或 VNode。绑定 `onClick` 后整块面板可点击，光标变为手型；点击面板只触发回调，不会关闭通知，点击关闭按钮也不会触发 `onClick`：

```ts
notification.open({
  title: "已加入收藏夹",
  message: "可在「我的收藏」中查看。",
  icon: "lucide:bookmark-check",
  closeIcon: "lucide:minus",
  duration: 5000,
  ui: { icon: "size-[24px] text-brand-6" },
});

notification.open({
  title: "有 3 条新的评论",
  message: "点击这块面板查看（onClick 回调）。",
  duration: 6000,
  onClick: () => router.push("/comments"),
});
```

### 手动关闭与同 key 更新

方法返回实例句柄，调用 `close()` 关闭当前通知。`duration: 0` 的通知不会自动消失，只能靠句柄、同 `key` 更新或 `destroy` 收尾：

```ts
const handle = notification.warning({ title: "存在未保存的更改", duration: 0 });
handle.close();
```

传相同 `key` 再次调用会**原位更新内容并重置计时**，不新增一条。典型用法是把进行中的提示换成最终结果：

```ts
notification.info({ key: "sync-task", title: "正在同步", duration: 0 });

try {
  await sync();
  notification.success({ key: "sync-task", title: "同步完成", duration: 3000 });
} catch {
  notification.error({ key: "sync-task", title: "同步失败", duration: 0 });
}
```

`notification.destroy(key)` 按 key 关闭，不传 key 则关闭全部站内通知：

```ts
notification.destroy(); // 关闭全部
notification.destroy("sync-task"); // 关闭 key 为 sync-task 的那一条
```

### 系统级通知：system

`notification.system()` 调用浏览器原生 Notification，在**操作系统层面**弹出提示，页面切到后台、浏览器最小化时依然可见，适合构建完成、长任务结束、新消息到达等需要跨窗口触达的场景：

```ts
const result = await notification.system({
  title: "构建完成",
  message: "文档站已发布，点击返回页面查看。",
  icon: "/logo.png", // 仅接受图片 URL
  tag: "build", // 同 tag 原位替换，相当于站内的 key
  onClick: () => router.push("/deploys"),
});

result.channel; // 'system' 系统通知 / 'inapp' 站内回退 / 'none' 未能展示
result.permission; // 'granted' | 'denied' | 'default' | 'unsupported'
result.close(); // 主动收回
```

首次调用会向用户请求授权，**建议放在点击等用户手势里触发**。用户拒绝授权或环境不支持（原生 Notification 需要 HTTPS 或 localhost 的安全上下文）时，默认回退为站内通知；`fallback: false` 关闭回退，传站内 config 对象可定制回退样式：

```ts
// 拒绝授权时回退为站内 warning 通知
await notification.system({
  title: "任务完成",
  message: "共处理 128 个文件。",
  fallback: { type: "warning", placement: "bottom-end" },
});

// 静默 + 3 秒后主动收回（原生通知的停留时长默认由操作系统决定）
await notification.system({ title: "静默提醒", message: "不播放提示音。", silent: true, duration: 3000 });
```

## API

### config 对象属性

组件没有 Props，下表是 `notification.open` 及类型方法接收的 config 字段。属性命名与 Element Plus Notification 对齐（`placement` 除外，对应其 `position`），标注「扩展属性」的是本库新增。

| 属性名                     | 类型                                                           | 默认值          | 描述                                                                                              |
| :------------------------- | :------------------------------------------------------------- | :-------------- | :------------------------------------------------------------------------------------------------ |
| `title`                    | `string`                                                       | -               | 标题；不传则不渲染标题节点                                                                        |
| `message`                  | `NotificationNode`                                             | -               | 正文内容；字符串贴在标题下方，VNode 或函数独立成段渲染到 `body` 节点                              |
| `dangerouslyUseHTMLString` | `boolean`                                                      | `false`         | 是否将 `message` 作为 HTML 片段处理，仅对字符串正文有效                                           |
| `type`                     | `'' \| 'success' \| 'warning' \| 'info' \| 'error'`            | `''`            | 通知类型，决定默认图标与图标、飘带、进度条的语义色；空串表示不显示类型图标、不着色               |
| `icon`                     | `NotificationNode`                                             | -               | 自定义图标（图标名或 VNode）；设置了 `type` 时会被类型图标覆盖                                    |
| `customClass`              | `string`                                                       | -               | 自定义类名，挂在通知面板根节点                                                                    |
| `duration`                 | `number`                                                       | `4500`          | 显示时间，**单位为毫秒**；0 或负值不会自动关闭                                                    |
| `placement`                | `'top-end' \| 'top-start' \| 'bottom-end' \| 'bottom-start'`   | `'top-end'`     | 弹出位置：end 贴右、start 贴左；对应 Element Plus 的 `position`                                   |
| `showClose`                | `boolean`                                                      | `true`          | 是否显示关闭按钮                                                                                  |
| `onClose`                  | `() => void`                                                   | -               | 关闭时的回调；自动到时、点关闭按钮、句柄 `close()`、`destroy` 都会触发                            |
| `onClick`                  | `(e: MouseEvent) => void`                                      | -               | 点击面板时的回调；绑定后面板光标变为手型，点击不会关闭通知                                        |
| `offset`                   | `number`                                                       | `0`             | 相对锚定边（顶部或底部）的偏移量，叠加在 16px 贴边留白之上；**容器级设置**，所有实例共用          |
| `appendTo`                 | `string \| HTMLElement`                                        | `document.body` | 通知容器的挂载父级，字符串按选择器查找，找不到回退到 body；**容器级设置**，变更时容器会被移动过去 |
| `zIndex`                   | `number`                                                       | `0`             | 定位容器的 z-index，0 表示使用内置层级 `2200`；**容器级设置**                                     |
| `closeIcon`                | `NotificationNode`                                             | `'lucide:x'`    | 自定义关闭图标（图标名或 VNode）                                                                  |
| `progress`                 | `boolean \| NotificationProgressOptions`                       | `false`         | 倒计时进度条；`true` 显示默认样式，传对象自定义，见「progress 选项」；`duration` 为 0 时不渲染    |
| `pauseOnHover`             | `boolean`                                                      | `true`          | 悬停于通知上时是否暂停计时器，进度条动画同时冻结                                                  |
| `ribbon`                   | `boolean \| 'left' \| 'right'`                                 | `false`         | 侧边飘带：贴面板内边的 3px 竖条，颜色取 `type` 的语义色；`true` 等价于 `'left'`（扩展属性）       |
| `footer`                   | `NotificationNode`                                             | -               | 底部操作区内容，与上一段间隔 20px（扩展属性）                                                     |
| `key`                      | `string \| number`                                             | -               | 唯一标志；同 key 再次调用会原位更新内容并重置计时（扩展属性）                                     |
| `style`                    | `CSSProperties`                                                | -               | 面板根节点行内样式（扩展属性）                                                                    |
| `ui`                       | `Partial<Record<NotificationSemanticDOM, string>>`             | -               | 细粒度样式覆盖，键位见「自定义样式（ui）」。（扩展属性）                                          |

其中 `NotificationNode` 为自定义节点类型：`string | VNode | (() => VNode)`。

### 实例方法

`notification.open` 及四个类型方法都返回当前通知的实例句柄。

| 方法名  | 签名         | 描述                                                 |
| :------ | :----------- | :--------------------------------------------------- |
| `close` | `() => void` | 关闭当前通知并触发 `onClose`；已关闭时调用不产生效果 |

### 全局方法

| 方法名                 | 签名                                                                                 | 描述                                                                    |
| :--------------------- | :----------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| `notification.open`    | `(config: NotificationOptions \| string) => NotificationHandle`                      | 打开一条不带类型的通知，字符串视作 `message`                            |
| `notification.success` | `(config: NotificationOptions \| string) => NotificationHandle`                      | 等价于 `open` 并设置 `type: 'success'`，`error` / `info` / `warning` 同理 |
| `notification.destroy` | `(key?: string \| number) => void`                                                   | 不传 key 关闭全部站内通知，传 key 关闭对应那一条（不存在则忽略）；不含系统级通知 |
| `notification.system`  | `(config: SystemNotificationOptions \| string) => Promise<SystemNotificationResult>` | 弹出操作系统级提示，字符串视作 `message`                                |

### system 选项与返回值

`SystemNotificationOptions` 走浏览器原生 Notification，只接受纯文本与图片 URL：

| 属性名               | 类型                             | 默认值   | 描述                                                                                   |
| :------------------- | :------------------------------- | :------- | :------------------------------------------------------------------------------------- |
| `title`              | `string`                         | 页面标题 | 系统通知标题；原生通知必须有标题，缺省取 `document.title`，再缺省为「通知」             |
| `message`            | `string`                         | -        | 正文内容，仅支持纯文本                                                                 |
| `icon`               | `string`                         | -        | 图标图片 URL，不接受图标名或 VNode                                                     |
| `tag`                | `string`                         | -        | 同 `tag` 的系统通知原位替换，相当于站内通知的 `key`                                    |
| `silent`             | `boolean`                        | -        | 静默通知：不播放提示音、不振动                                                         |
| `requireInteraction` | `boolean`                        | -        | 要求用户交互后才消失，是否生效取决于操作系统                                           |
| `duration`           | `number`                         | -        | 显示时长（毫秒），到时主动收回；缺省或 0 表示交给系统管理                              |
| `onClick`            | `(event: Event) => void`         | -        | 点击系统通知时触发；组件会先把焦点拉回本页面再执行回调                                 |
| `onClose`            | `() => void`                     | -        | 系统通知关闭时触发                                                                     |
| `fallback`           | `boolean \| NotificationOptions` | `true`   | 授权被拒或环境不支持时的回退：`true` 转站内通知，传站内 config 定制样式，`false` 放弃 |

返回 `Promise<SystemNotificationResult>`：

| 属性名       | 类型                                                  | 默认值 | 描述                                                                   |
| :----------- | :---------------------------------------------------- | :----- | :--------------------------------------------------------------------- |
| `channel`    | `'system' \| 'inapp' \| 'none'`                       | -      | 实际使用的通道：`system` 系统通知 / `inapp` 站内回退 / `none` 未能展示 |
| `permission` | `'default' \| 'denied' \| 'granted' \| 'unsupported'` | -      | 浏览器授权状态；`unsupported` 表示环境没有原生 Notification 能力       |
| `close`      | `() => void`                                          | -      | 收回本条通知，站内回退时同样生效                                       |

### progress 选项

传对象时字段名对齐 `RebornProgress`；`percentage` / `type` / `duration` / `indeterminate` / `width` 由通知自身接管，故不开放。

| 属性名        | 类型               | 默认值    | 描述                                                                             |
| :------------ | :----------------- | :-------- | :------------------------------------------------------------------------------- |
| `strokeColor` | `string`           | -         | 填充色，写成行内背景色；缺省跟随通知类型的语义色（无类型时为品牌主色）           |
| `size`        | `number \| string` | `3`（px） | 轨道高度，数字视为 px，字符串原样作为 CSS 高度                                   |
| `striped`     | `boolean`          | `false`   | 条纹装饰层                                                                       |
| `stripedFlow` | `boolean`          | `false`   | 条纹流动，需同时开启 `striped`                                                   |
| `class`       | `string`           | -         | 追加到填充层的自定义 class，优先级低于 `ui.progressFill`                         |

### 自定义样式（ui）

`ui` 是 config 对象上的字段，不是组件 Prop：每条通知各自传入，按下列键把 class 合并到对应节点上（经 `cn` 合并，冲突的 Tailwind 类以传入值为准）。键名与 `reborn-notification.config.ts` 中 `notificationTheme` 的 slots 一一对应。

| 键名              | 对应节点                                           | 默认 class                                                                                                                                                                                 | 渲染条件                                                                                             |
| :---------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `wrapper`         | 某一角的定位容器（`TransitionGroup` 渲染的 div）   | `fixed flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-[16px] pointer-events-none`；按位置追加 `items-end` / `items-start`，底部两角再加 `flex-col-reverse`                          | 四个角的容器常驻；**只取该角队列里第一条通知的 `ui.wrapper`**                                       |
| `root`            | 单条通知的面板根节点                               | `reborn-notification pointer-events-auto relative flex w-full flex-col gap-[20px] overflow-hidden rounded-lg border border-black/5 bg-gray-1 py-[20px] px-[24px] text-gray-9 shadow-[0_12px_32px_rgba(15,23,42,0.16)]`；绑定 `onClick` 时加 `cursor-pointer` | 始终渲染；`customClass` 先于 `ui.root` 合并                                                         |
| `ribbon`          | 侧边飘带竖条                                       | `pointer-events-none absolute inset-y-0 w-[3px]`，按方向加 `left-0` / `right-0`，按类型加 `bg-*` 语义色（无类型为 `bg-primary`）                                                        | `ribbon` 为真值                                                                                      |
| `header`          | 头部三列容器（图标 / 文字区 / 关闭按钮）           | `flex items-start gap-[12px]`                                                                                                                                                              | `title`、字符串 `message`、图标、`showClose` 任一存在                                               |
| `iconWrapper`     | 图标外层容器                                       | `flex shrink-0 items-center justify-center`                                                                                                                                                | 设置了 `type` 或 `icon`                                                                              |
| `icon`            | 提示图标本体（`Icon` 组件）                        | `size-[24px]`，按类型加 `text-success` / `text-warning` / `text-info` / `text-error`                                                                                                      | 图标来自 `type` 或字符串 `icon`；`icon` 为 VNode 时直接渲染该 VNode，**此键不生效**                 |
| `headerContent`   | 头部文字区（标题 + 字符串正文）                    | `flex min-w-0 flex-1 flex-col gap-[8px]`                                                                                                                                                   | 随 `header` 渲染                                                                                     |
| `title`           | 标题                                               | `text-lg font-medium text-gray-10`                                                                                                                                                         | 设置了 `title`                                                                                       |
| `message`         | 字符串形态的正文（`<p>`）                          | `text-base break-words text-gray-8`                                                                                                                                                        | `message` 为非空字符串                                                                               |
| `close`           | 关闭按钮                                           | `inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center text-gray-5 transition-colors hover:text-gray-7`                                                            | `showClose` 为 `true`                                                                                |
| `body`            | 独立正文段                                         | `text-base text-gray-8`                                                                                                                                                                    | `message` 为 VNode 或函数                                                                            |
| `footer`          | 底部操作区                                         | `flex items-center justify-end gap-3`                                                                                                                                                      | 设置了 `footer`                                                                                      |
| `progressTrack`   | 倒计时进度条轨道                                   | `pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden bg-gray-2`，高度走行内样式                                                                                              | `progress` 为真值且 `duration > 0`                                                                  |
| `progressFill`    | 倒计时进度条填充层                                 | `block h-full w-full origin-left`，按类型加 `bg-*` 语义色（无类型为 `bg-primary`）                                                                                                       | 随 `progressTrack` 渲染；`progress.class` 先于 `ui.progressFill` 合并                                |
| `progressStripes` | 条纹装饰层                                         | `pointer-events-none absolute inset-0` + 45° 半透明白色条纹背景；`stripedFlow` 时加流动动画（`motion-reduce` 下关闭）                                                                     | `progress.striped` 为 `true`                                                                         |

```ts
notification.open({
  title: "已加入收藏夹",
  message: "可在「我的收藏」中查看。",
  icon: "lucide:bookmark-check",
  ui: {
    root: "rounded-xl",
    icon: "text-brand-6",
    title: "text-[18px]",
    close: "text-gray-7",
  },
});
```

## 视觉规格

面板内边距、三段间隔、标题与正文的字号字色，与 `RebornDialog` 面板令牌一致；文字行高走 `typography.css` 的字号阶梯（行高 = 字号 + 8px）。通知是悬浮层，底色用不透明的 `gray-1`，避免透出页面内容；深浅色由令牌翻转，不写 `dark:` 前缀。

| 项目                            | 值                                                                                         |
| :------------------------------ | :----------------------------------------------------------------------------------------- |
| 面板宽度                        | 360px（上限 `calc(100vw - 32px)`）                                                         |
| 内边距                          | 上下 20px / 左右 24px                                                                      |
| header / 正文 / footer 三段间隔 | 20px                                                                                       |
| 标题与正文间隔                  | 8px                                                                                        |
| 标题                            | `text-lg` 令牌（16px / 行高 24px）/ 字重 500 / `gray-10`                                   |
| 正文                            | `text-base` 令牌（14px / 行高 22px）/ `gray-8`                                             |
| 提示图标                        | 24px                                                                                       |
| 关闭图标                        | 18px（`gray-5`，悬停 `gray-7`）                                                            |
| 图标与文字间距                  | 12px                                                                                       |
| 侧边飘带                        | 3px 宽，通栏贴左 / 右内边，色值为类型语义色                                                |
| 圆角                            | `rounded-lg`                                                                               |
| 多条通知间距                    | 16px                                                                                       |
| 贴边留白                        | 四边统一 16px（纵向再叠加 `offset`）；贴视口时扣掉滚动条占位                               |
| 投影                            | `0 12px 32px rgba(15,23,42,.16)`                                                           |
| 进度条轨道                      | 默认 3px，底色 `gray-2`，绝对定位贴面板底边，底部内边距仍为 20px                           |
| 层级（z-index）                 | `2200`（`zIndex` 为 0 时；介于 Toast 2100 与 Dialog 2400 之间）                            |
| 入场 / 离场                     | 0.28s ease，横向 24px 位移 + 淡入淡出（入场走 `@keyframes`，页面在后台时不会卡在偏移位）   |

## 与 Toast / Dialog 的取舍

| 维度       | Notification             | Toast               | Dialog                 |
| :--------- | :----------------------- | :------------------ | :--------------------- |
| 落位       | 屏幕四角，可选           | 页面顶部居中        | 视口中央（模态）       |
| 结构       | 标题 + 正文 + 底部操作区 | 单行文本 + 图标     | 完整页头 / 正文 / 页脚 |
| 是否阻塞   | 否                       | 否                  | 是（默认带遮罩）       |
| `duration` | 毫秒，默认 4500          | **秒**，默认 3      | 不自动关闭             |
| 典型用途   | 任务结果播报、系统公告   | 操作成功 / 失败反馈 | 需要用户确认的决策     |

## 注意事项

- `duration` 单位是**毫秒**（默认 4500），与 `RebornToast` 的**秒**（默认 3）不同，两个组件混用时容易写错。
- `offset` / `zIndex` / `appendTo` 是**容器级**设置，由最近一次显式传值的调用写入，并对四个角全局生效；不能让不同通知有不同偏移。
- `ui.wrapper` 作用在某一角的定位容器上，而容器是该角所有通知共用的，所以只读取队列里第一条通知的 `ui.wrapper`；后续通知传的 `wrapper` 不会生效。
- 设置了 `type` 时 `icon` 会被类型图标覆盖；需要自定义图标就不要传 `type`，配色改用 `ui: { icon: '...' }`。`icon` 传 VNode 时 `ui.icon` 与类型配色都不作用于它，样式要写在 VNode 自己身上。
- `duration: 0` 的通知不会自动关闭，也**不会显示进度条**，必须靠句柄 `close()`、同 `key` 更新或 `notification.destroy(key)` 收尾。
- 同 `key` 更新是把新 config 合并进旧实例（`Object.assign`）：新调用里没写的字段会沿用旧值，例如旧通知的 `footer`、`ribbon` 在新调用未传时仍然保留，需要去掉时显式传 `undefined` 或 `false`。
- 同 `key` 更新会重置计时器，但进度条节点不重建，CSS 动画不会从头播放；`duration` 不变时，进度条与剩余时间可能对不上。需要进度条准确时，先 `destroy(key)` 再重新打开。
- `onClose` 在每一种关闭路径上都会触发，包括 `notification.destroy()` 批量关闭；在 `onClose` 里再次打开通知时要注意避免循环。
- `dangerouslyUseHTMLString` 只对字符串 `message` 生效，且会直接插入 HTML，务必自行确保内容可信。
- `progress` 传对象时仅支持 `strokeColor` / `size` / `striped` / `stripedFlow` / `class`；`percentage` / `type` / `duration` / `indeterminate` / `width` 由通知自身接管，传了不会生效。
- Vue 3 没有全局实例约定，未提供 `this.$notify`，统一用导入的 `notification` 对象调用。
- 底部两角为倒序排列（`flex-col-reverse`），新通知始终贴着底边、旧通知向上顶；顶部两角则是新通知在下。
- 离场时节点会被置为 `position: absolute` 以脱离文档流，让同栈内其余通知的位移过渡平滑收拢；给 `wrapper` 覆盖定位相关 class 时需留意这一点。
- 贴边值全部由行内样式给出，不写在 `wrapper` 的 class 里。`position: fixed` 的包含块不含经典滚动条，所以右侧与底部贴边会扣掉滚动条宽度：CSS 上的 `right` 可能小于 16px，但视觉留白仍是 16px；`appendTo` 指到自定义容器时贴的是容器边，不做补偿。
- `ribbon` 与 `progress` 可同时开启：飘带最后渲染、通栏贯穿，会压过进度条轨道的端部，这是预期表现。
- `notification.system()` 依赖安全上下文（HTTPS 或 localhost），且首次调用会弹出浏览器授权询问；部分浏览器在非用户手势上下文里会直接忽略询问，因此建议放在点击回调里触发。`destroy()` 只管理站内通知，系统级通知用返回值的 `close()` 收回。
- 系统级通知的展示样式与停留时长由操作系统决定，`requireInteraction` / `silent` 在部分平台可能不生效；正文只支持纯文本，富文本与操作按钮请继续使用站内通知。
