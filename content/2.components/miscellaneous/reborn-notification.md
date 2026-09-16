---
title: Notification 通知
description: 屏幕四角弹出的全局通知：标题 + 正文 + 底部操作区三段结构，支持倒计时进度条、悬停暂停、同 key 更新，属性对齐 Element Plus Notification，仅 web 端。
category: 反馈
platform: web
---

::ComponentViewer{demoFile="RebornNotificationDemo.vue" config="RebornNotificationConfig" componentId="reborn-notification" :componentFiles='["RebornNotification.vue", "index.ts", "reborn-notification.config.ts"]'}
::

## 简介

命令式的全局通知：一句 `notification.success({ title, message })` 即在屏幕一角弹出一块面板，到时自动消失。与 `RebornToast` 的单行轻提示不同，通知有**标题**、可换行的正文、可选的底部操作区，适合承载需要读一句以上的信息。组件本身不写在模板里，也没有 Props 与插槽——所有能力都通过 `notification` 对象调用。

::warning
**本组件仅 Web 端提供**，UniApp 端没有对应实现（`packages/uniapp-project` 下无 `reborn-notification` 目录），因此下方 API 无需区分平台。`appendTo` / `zIndex` / VNode 正文 / `dangerouslyUseHTMLString` 都依赖 DOM，无法在小程序端等价实现。UniApp 端的轻量反馈请用双端通用的 `RebornToast`，页面内常驻说明用 `RebornAlert`。
::

**适用场景**：后台任务完成（部署、导出、同步）的结果播报；系统级公告与版本更新提示；带「查看详情 / 稍后处理」等后续动作的异步消息。

**不适用场景**：单句操作反馈（用 `RebornToast`，更轻）；需要用户当场确认或选择（用 `RebornDialog`，通知不阻塞操作）；页面内常驻的状态说明（用 `RebornAlert`）。

## 用法

### 导入

```ts
import { notification } from "~/components/reborn/ui/reborn-notification";
```

容器在首次调用时自动 `createVNode` + `render` 挂到 `appendTo`（默认 `document.body`），无需在模板中放置 `<RebornNotification />`。

### 静态方法

```ts
notification.open(config);
notification.success(config);
notification.error(config);
notification.info(config);
notification.warning(config);
```

四个类型方法等价于 `open` 加上对应的 `type`，决定默认图标与语义配色；`open` 不带类型，即无图标、无着色。参数也可以直接传字符串，视作正文内容：

```ts
// 完整 config
notification.success({
  title: "部署完成",
  message: "订单服务已发布到生产环境，耗时 42 秒。",
});

// 只有正文
notification.info("已进入只读模式");

// 常驻不自动关闭
notification.warning({ title: "存在未保存的更改", duration: 0 });
```

### 位置与偏移

`position` 支持屏幕四角，顶部两角向下堆叠、底部两角向上堆叠，新通知始终贴着锚定边。四条边的贴边留白统一为 16px（贴视口时会自动扣掉滚动条占位，使横向与纵向的视觉留白一致），`offset` 只叠加在纵向（顶部或底部）留白之上：

```ts
notification.info({ message: "贴左下角弹出", position: "bottom-left" });
notification.info({ message: "顶部再下移 64px", offset: 64 });
```

### 倒计时进度条

`progress` 设为 `true` 显示默认进度条（颜色跟随类型），传对象可自定义样式。进度条与计时器共用同一时长，`pauseOnHover` 生效时二者会一起冻结：

```ts
notification.success({ title: "已保存", progress: true });

notification.info({
  title: "正在导出",
  duration: 8000,
  progress: { size: 6, striped: true, stripedFlow: true },
});
```

### 侧边飘带

`ribbon` 在面板内边加一条 3px 竖条，颜色取 `type` 的语义色（未设 `type` 时为品牌主色）。飘带压在面板内边距上，不挤占正文宽度，可与进度条同时开启：

```ts
// 贴左（true 等价于 'left'）
notification.success({ title: "发布成功", ribbon: true });

// 贴右，并叠加倒计时进度条
notification.error({ title: "构建失败", ribbon: "right", progress: true });
```

### 富文本与自定义正文

`message` 为字符串时贴在标题下方（间隔 8px）；传 VNode 或返回 VNode 的函数时，正文**独立成段**（与头部间隔 20px），可配合 `footer` 放置操作按钮：

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
  footer: () => h(RebornButton, { size: "sm" }, () => "接受邀请"),
  duration: 0,
});
```

::warning
`dangerouslyUseHTMLString` 会把 `message` 当作 HTML 直接插入（内部走 `v-html`），**绝不能拼接用户输入**，否则会导致 XSS。需要展示不可信内容时改用 VNode 正文。
::

### 手动关闭与同 key 更新

方法返回实例句柄，调用 `close()` 关闭当前通知：

```ts
const handle = notification.warning({ title: "上传中", duration: 0 });
handle.close();
```

传相同 `key` 再次调用会**原位更新内容并重置计时**，不新增一条，最典型的用法是把进行中换成最终结果：

```ts
notification.info({ key: "sync", title: "正在同步", duration: 0 });

try {
  await sync();
  notification.success({ key: "sync", title: "同步完成", duration: 3000 });
} catch {
  notification.error({ key: "sync", title: "同步失败", duration: 0 });
}
```

### 全局销毁

```ts
notification.destroy(); // 关闭全部
notification.destroy("sync"); // 关闭 key 为 sync 的那一条
```

### 系统级通知

`notification.system()` 调用浏览器原生 Notification，在**操作系统层面**弹出提示——页面切到后台、浏览器最小化时依然可见，适合构建完成、长任务结束、新消息到达等需要跨窗口触达的场景。

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

首次调用会向用户请求授权，**建议放在点击等用户手势里触发**；用户拒绝授权或环境不支持（原生 Notification 需要 HTTPS 或 localhost 的安全上下文）时，默认自动回退为站内通知。`fallback: false` 关闭回退，传站内 config 对象可定制回退样式：

```ts
// 拒绝授权时回退为站内 warning 通知
await notification.system({
  title: "任务完成",
  message: "共处理 128 个文件。",
  fallback: { type: "warning", position: "bottom-right" },
});

// 静默 + 3 秒后主动收回（原生通知的停留时长默认由操作系统决定）
await notification.system({ title: "静默提醒", message: "不播放提示音。", silent: true, duration: 3000 });
```

## API

### config 对象属性

属性命名与 Element Plus Notification 对齐，另扩展了 `footer` / `key` / `ui` / `style`。

| 属性                       | 说明                                                                   | 类型                                              | 默认值           |
| :------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------ | :--------------- |
| `title`                    | 标题                                                                   | `string`                                          | `''`             |
| `message`                  | 通知栏正文内容；字符串贴在标题下方，VNode 独立成段                     | `NotificationNode`                                | `''`             |
| `dangerouslyUseHTMLString` | 是否将 `message` 属性作为 HTML 片段处理（仅对字符串正文有效）           | `boolean`                                         | `false`          |
| `type`                     | 通知的类型，决定默认图标与语义配色；空串表示不显示图标、不着色           | `'' \| 'success' \| 'warning' \| 'info' \| 'error'` | `''`             |
| `icon`                     | 自定义图标（图标名或 VNode）。若设置了 `type`，则 `icon` 会被覆盖       | `NotificationNode`                                | 按 `type` 取     |
| `customClass`              | 自定义类名，挂在通知面板根节点                                         | `string`                                          | `''`             |
| `duration`                 | 显示时间，**单位为毫秒**。值为 0 则不会自动关闭                        | `number`                                          | `4500`           |
| `position`                 | 自定义弹出位置                                                         | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` |
| `showClose`                | 是否显示关闭按钮                                                       | `boolean`                                         | `true`           |
| `onClose`                  | 关闭时的回调函数                                                       | `() => void`                                      | -                |
| `onClick`                  | 点击 Notification 时的回调函数；绑定后整块面板可点击                   | `(e: MouseEvent) => void`                         | -                |
| `offset`                   | 相对锚定边（顶部或底部）的偏移量，叠加在 16px 贴边留白之上；**容器级设置**，同一时刻所有实例共用同一偏移 | `number`             | `0`              |
| `appendTo`                 | 设置 notification 的根元素；**容器级设置**，变更时已挂载的容器会被移动到新父级 | `string \| HTMLElement`                    | `document.body`  |
| `zIndex`                   | 初始 zIndex，0 表示使用内置层级 `2200`；**容器级设置**                 | `number`                                          | `0`              |
| `closeIcon`                | 自定义关闭图标（图标名或 VNode）                                       | `NotificationNode`                                | `'lucide:x'`     |
| `progress`                 | 进度条指示自动关闭倒计时。设为 `true` 显示默认进度条，或传对象自定义    | `boolean \| NotificationProgressOptions`          | `false`          |
| `pauseOnHover`             | 悬停于通知上时是否暂停计时器（进度条动画同时冻结）                     | `boolean`                                         | `true`           |
| `ribbon`                   | 侧边飘带：贴面板内边的 3px 竖条，颜色取 `type` 的语义色；`true` 等价于 `'left'`（**扩展属性**） | `boolean \| 'left' \| 'right'`   | `false`          |
| `footer`                   | 底部操作区内容，与正文间隔 20px（**扩展属性**）                        | `NotificationNode`                                | -                |
| `key`                      | 唯一标志；同 key 再次调用会原位更新内容并重置计时（**扩展属性**）      | `string \| number`                                | -                |
| `style`                    | 面板根节点行内样式（**扩展属性**）                                     | `CSSProperties`                                   | -                |
| `ui`                       | 按语义化结构覆盖 class（**扩展属性**）                                 | `Partial<Record<NotificationSemanticDOM, string>>` | `{}`            |

其中 `NotificationNode` 为自定义节点类型：`string | VNode | (() => VNode)`。

### 实例方法

`notification.open` 及四个类型方法都返回当前的 Notification 实例句柄。如果需要手动关闭实例，可以调用它的 `close` 方法。

| 名称    | 详情                    | 类型         |
| :------ | :---------------------- | :----------- |
| `close` | 关闭当前的 Notification | `() => void` |

### 全局方法

| 名称                     | 说明                                            | 类型                              |
| :----------------------- | :---------------------------------------------- | :-------------------------------- |
| `notification.destroy()` | 关闭全部通知（不含系统级通知）                  | `(key?: string \| number) => void` |
| `notification.destroy(key)` | 关闭 `key` 对应的那一条通知（不存在则忽略）  | `(key?: string \| number) => void` |
| `notification.system(config)` | 弹出操作系统级提示，也可直接传字符串作为正文 | `(config: SystemNotificationOptions \| string) => Promise<SystemNotificationResult>` |

### system 选项与返回值

`SystemNotificationOptions` 走浏览器原生 Notification，只接受纯文本与图片 URL：

| 属性                 | 说明                                                                 | 类型                              | 默认值       |
| :------------------- | :------------------------------------------------------------------- | :-------------------------------- | :----------- |
| `title`              | 系统通知标题；原生通知必须有标题，缺省取当前页面标题                 | `string`                          | 页面标题     |
| `message`            | 正文内容，仅支持纯文本                                               | `string`                          | -            |
| `icon`               | 图标图片 URL（不接受图标名或 VNode）                                 | `string`                          | -            |
| `tag`                | 同 `tag` 的系统通知原位替换，相当于站内通知的 `key`                  | `string`                          | -            |
| `silent`             | 静默通知：不播放提示音、不振动                                       | `boolean`                         | `false`      |
| `requireInteraction` | 要求用户交互后才消失，是否生效取决于操作系统                         | `boolean`                         | `false`      |
| `duration`           | 显示时长（毫秒），到时主动收回；缺省或 0 表示交给系统管理            | `number`                          | `0`          |
| `onClick`            | 点击系统通知时触发；组件会先把焦点拉回本页面再执行回调               | `(event: Event) => void`          | -            |
| `onClose`            | 系统通知关闭时触发                                                   | `() => void`                      | -            |
| `fallback`           | 授权被拒或环境不支持时的回退：`true` 转站内通知，传站内 config 定制样式，`false` 放弃 | `boolean \| NotificationOptions` | `true`       |

返回 `Promise<SystemNotificationResult>`：

| 字段         | 说明                                                                  | 类型                                                |
| :----------- | :-------------------------------------------------------------------- | :-------------------------------------------------- |
| `channel`    | 实际使用的通道：`system` 系统通知 / `inapp` 站内回退 / `none` 未能展示 | `'system' \| 'inapp' \| 'none'`                     |
| `permission` | 浏览器授权状态；`unsupported` 表示环境没有原生 Notification 能力       | `'default' \| 'denied' \| 'granted' \| 'unsupported'` |
| `close`      | 收回本条通知，站内回退时同样生效                                       | `() => void`                                        |

### progress 选项

传对象时字段名对齐 `RebornProgress`；规格中排除的 `percentage` / `type` / `duration` / `indeterminate` / `width` 由通知自身接管，故不开放。

| 属性          | 说明                                                | 类型               | 默认值       |
| :------------ | :-------------------------------------------------- | :----------------- | :----------- |
| `strokeColor` | 填充色，缺省跟随通知类型的语义色（无类型时为品牌主色） | `string`         | -            |
| `size`        | 轨道高度，数字视为 px                               | `number \| string` | `3`（px）    |
| `striped`     | 条纹装饰层                                          | `boolean`          | `false`      |
| `stripedFlow` | 条纹流动，需同时开启 `striped`                      | `boolean`          | `false`      |
| `class`       | 追加到填充层的自定义 class                          | `string`           | -            |

### 语义化结构键

`ui` 按以下键覆盖对应节点的 class：

| 键名              | 说明                                       |
| :---------------- | :----------------------------------------- |
| `wrapper`         | 某一角的定位容器（贴边、堆叠间距、层级）   |
| `root`            | 单条通知的面板根节点（内边距、圆角、投影） |
| `ribbon`          | 侧边飘带（`ribbon` 开启时启用）            |
| `header`          | 头部三列容器（图标 / 文字区 / 关闭按钮）   |
| `iconWrapper`     | 图标外层容器                               |
| `icon`            | 提示图标本体                               |
| `headerContent`   | 头部文字区（标题 + 字符串正文）            |
| `title`           | 标题                                       |
| `message`         | 字符串形态的正文                           |
| `close`           | 关闭按钮                                   |
| `body`            | 独立正文段（`message` 为 VNode 时启用）    |
| `footer`          | 底部操作区                                 |
| `progressTrack`   | 倒计时进度条轨道                           |
| `progressFill`    | 倒计时进度条填充层                         |
| `progressStripes` | 条纹装饰层                                 |

```ts
notification.open({
  title: "已加入收藏夹",
  icon: "lucide:bookmark-check",
  ui: { icon: "text-brand-6", title: "text-[18px]" },
});
```

## 视觉规格

面板内边距、三段间隔、标题与正文的字号字色，与 `RebornDialog` 面板令牌完全一致；文字行高走 `typography.css` 的字号阶梯（行高 = 字号 + 8px）。通知是悬浮层，底色用不透明的 `gray-1`，避免透出页面内容；深浅色由令牌翻转，不写 `dark:` 前缀。

| 项目                | 值                                        |
| :------------------ | :---------------------------------------- |
| 面板宽度            | 360px（上限 `calc(100vw - 32px)`）        |
| 内边距              | 上下 20px / 左右 24px                     |
| header / 正文 / footer 三段间隔 | 20px                          |
| 标题与正文间隔      | 8px                                       |
| 标题                | `text-lg` 令牌（16px / 行高 24px）/ 字重 500 / `gray-10` |
| 正文                | `text-base` 令牌（14px / 行高 22px）/ `gray-8` |
| 提示图标            | 24px                                      |
| 关闭图标            | 18px（`gray-5`，悬停 `gray-7`）           |
| 图标与文字间距      | 12px                                      |
| 侧边飘带            | 3px 宽，通栏贴左 / 右内边，色值为类型语义色（各色阶 `-6`） |
| 圆角                | `rounded-xl`                           |
| 多条通知间距        | 16px                                      |
| 贴边留白            | 四边统一 16px（纵向再叠加 `offset`）；贴视口时自动扣掉滚动条占位，保证四个方向的视觉留白一致 |
| 投影                | `0 12px 32px rgba(15,23,42,.16)`          |
| 进度条轨道          | 默认 3px，底色 `gray-2`                   |
| 开启进度条时底部内边距 | 23px（20px + 轨道 3px，避免压住内容）   |
| 层级（z-index）     | `2200`（`zIndex` 为 0 时；介于 Toast 2100 与 Dialog 2400 之间） |
| 入场 / 离场         | 0.28s ease，横向 24px 位移 + 淡入淡出（入场走 `@keyframes`，页面在后台时不会卡在偏移位） |

## 与 Toast / Dialog 的取舍

| 维度       | Notification                    | Toast                  | Dialog                 |
| :--------- | :------------------------------ | :--------------------- | :--------------------- |
| 落位       | 屏幕四角，可选                  | 页面顶部居中           | 视口中央（模态）       |
| 结构       | 标题 + 正文 + 底部操作区        | 单行文本 + 图标        | 完整页头 / 正文 / 页脚 |
| 是否阻塞   | 否                              | 否                     | 是（默认带遮罩）       |
| `duration` | 毫秒，默认 4500                 | **秒**，默认 3         | 不自动关闭             |
| 典型用途   | 任务结果播报、系统公告          | 操作成功 / 失败反馈    | 需要用户确认的决策     |

## 注意事项

- `duration` 单位是**毫秒**（默认 4500），与 `RebornToast` 的**秒**（默认 3）不同，两个组件混用时容易写错。
- `offset` / `zIndex` / `appendTo` 是**容器级**设置，由最近一次显式传值的调用写入并对四个角全局生效——规格本身也要求「同一时刻所有实例具有相同偏移量」，因此不要指望不同通知有不同偏移。
- 设置了 `type` 时 `icon` 会被类型图标覆盖，这是规格的既定行为；需要自定义图标就不要传 `type`，配色改用 `ui: { icon: '...' }`。
- `duration: 0` 的通知不会自动关闭，也**不会显示进度条**（无倒计时可指示），必须靠句柄 `close()`、同 `key` 更新或 `notification.destroy(key)` 收尾。
- `dangerouslyUseHTMLString` 只对字符串 `message` 生效，且会直接插入 HTML，务必自行确保内容可信。
- `progress` 传对象时仅支持 `strokeColor` / `size` / `striped` / `stripedFlow` / `class`；`percentage` / `type` / `duration` / `indeterminate` / `width` 由通知自身接管，传了不会生效。
- Vue 3 无全局实例约定，未提供 `this.$notify`，统一用导入的 `notification` 对象调用。
- 底部两角为倒序排列（`flex-col-reverse`），新通知始终贴着底边、旧通知向上顶；顶部两角则是新通知在下。
- 离场时节点会被置为 `position: absolute` 以脱离文档流，让同栈内其余通知的位移过渡平滑收拢；给 `wrapper` 覆盖定位相关 class 时需留意这一点。
- 贴边值全部由行内样式给出（不再写在 `wrapper` 的 class 里）。`position: fixed` 的包含块不含经典滚动条，所以横向贴边会自动扣掉滚动条宽度——CSS 上的 `right` 可能小于 16px，但视觉留白仍是 16px；`appendTo` 指到自定义容器时贴的是容器边，不做补偿。
- `ribbon` 与 `progress` 可同时开启：飘带通栏贯穿，会压过进度条轨道的端部，这是预期表现。
- `notification.system()` 依赖安全上下文（HTTPS 或 localhost），且首次调用会弹出浏览器授权询问——部分浏览器在非用户手势上下文里会直接忽略询问，因此建议放在点击回调里触发；`destroy()` 只管理站内通知，系统级通知用返回值的 `close()` 收回。
- 系统级通知的展示样式与停留时长由操作系统决定，`requireInteraction` / `silent` 在部分平台可能不生效；正文只支持纯文本，富文本与操作按钮请继续使用站内通知。
