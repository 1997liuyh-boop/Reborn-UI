---
title: Toast 消息提示
description: 全局命令式消息提示：五种类型静态方法、Promise 接口、同 key 更新与全局配置，web 端由 Toast 升级而来。
category: 反馈
platform: both
---

::ComponentViewer{demoFile="RebornToastDemo.vue" config="RebornToastConfig" componentId="reborn-toast" :componentFiles='["RebornToast.vue", "index.ts", "reborn-toast.config.ts"]' :uniappFiles='["RebornToast.vue", "index.ts", "reborn-toast.config.ts"]'}
::

## 简介

全局命令式的轻量反馈：一句 `message.success('已保存')` 即在页面顶部弹出一条消息，到时自动消失，不打断用户操作。组件本身不需要写在模板里，也没有 Props 与插槽——所有能力都通过 `message` 对象调用。

::tip
**两端 API 已对齐**：方法名（`open` / `info` / `success` / `warning` / `error` / `loading` / `config` / `destroy`）、静态方法签名、`config` 对象字段名、全局配置字段名逐一相同，下方表格为两端通用。差异集中在 `content` / `icon` 的取值形态、`top` 默认值单位与容器挂载方式，详见「两端差异对照」。
::

**适用场景**：保存 / 删除 / 复制等操作后的成功或失败反馈；请求中的 loading 占位（配合同 `key` 更新为最终结果）；无需用户处理的轻量提示。

**不适用场景**：需要用户确认或选择（用 `RebornDialog`）；页面内常驻的状态说明或公告（用 `RebornAlert`）；字段级校验错误（用 `RebornFormItem` 的错误态）。

## 用法

### 导入

两端从各自组件目录的 `index.ts` 导入同名的 `message` 对象：

::code-group
```ts [Web]
import { message } from "~/components/reborn/ui/reborn-toast";
```

```ts [UniApp]
import { message } from '@/components/reborn-toast'
```
::

::warning
**小程序端必须在页面里渲染 `<RebornToast />`**（`RebornPage` 已内置，用 `RebornPage` 包页面则无需处理）。小程序无 DOM，容器无法像 Web / H5 那样在首次调用时动态挂载。
::

### 静态方法

```ts
message.success(content, [duration], onClose);
message.error(content, [duration], onClose);
message.info(content, [duration], onClose);
message.warning(content, [duration], onClose);
message.loading(content, [duration], onClose);
```

```ts
// 最简调用：3 秒后自动关闭
message.success("已保存");

// 指定时长（单位秒），0 表示不自动关闭
message.error("网络异常，请重试", 5);

// 关闭回调
message.info("已复制到剪贴板", 3, () => console.log("closed"));
```

### Promise 接口

所有方法都返回消息关闭时兑现的 Promise，`onClose` 与 `.then()` 可同时使用：

```ts
message[level](content, [duration]).then(afterClose);
message[level](content, [duration], onClose).then(afterClose);
```

```ts
await message.success("已提交");
// 消息关闭后才执行后续逻辑
router.push("/list");
```

### 对象形式调用

需要用到 `variant`、`color`、`key` 等进阶配置时改传 config 对象，此时第二、三个参数被忽略：

```ts
message.open(config);
message.success(config);
// error / info / warning / loading 同理

message.warning({
  content: "库存不足",
  duration: 0,
  variant: "subtle",
  pauseOnHover: false,
});
```

::tip
Web 端第一个参数为对象时会先判断是否为 VNode（`__v_isVNode`）——是则按提示内容处理，否则视作 config，因此传 VNode 内容不会被误判成配置。
::

### 同 key 更新（loading → 结果）

传相同 `key` 再次调用会**原位更新内容并重置计时**，不新增一条，最典型的用法是把 loading 换成最终结果：

```ts
message.loading({ content: "提交中…", duration: 0, key: "submit" });

try {
  await save();
  message.success({ content: "提交成功", key: "submit" });
} catch {
  message.error({ content: "提交失败", key: "submit" });
}
```

::tip
`duration: 0` 的消息不会自动关闭，必须靠同 `key` 更新或 `message.destroy(key)` 收尾，否则会一直留在页面上。同 key 更新时旧的 Promise 与新的 Promise 都在**最终关闭**时一起兑现。
::

### 全局方法与配置

```ts
message.config(options);
message.destroy(); // 关闭全部
message.destroy(key); // 关闭某一条
```

```ts
message.config({
  top: 100,
  duration: 2,
  maxCount: 3,
});
```

## API

::tip
以下参数两端通用，标注了平台的条目除外。
::

### 静态方法参数

| 参数       | 说明                                        | 类型                            | 默认值 |
| ---------- | ------------------------------------------- | ------------------------------- | ------ |
| `content`  | 提示内容；为对象时视作 config，其余参数忽略 | `MessageNode \| config`         | -      |
| `duration` | 自动关闭的延时，单位秒。设为 0 时不自动关闭 | `number`                        | `3`    |
| `onClose`  | 关闭时触发的回调函数                        | `() => void`                    | -      |

其中 `MessageNode` 为自定义节点类型，两端取值形态不同：

| 平台   | `MessageNode` 类型                   | 说明                                            |
| ------ | ------------------------------------ | ----------------------------------------------- |
| Web    | `string \| VNode \| (() => VNode)`   | 支持富内容                                      |
| UniApp | `string`                             | 小程序无法在运行时渲染动态 VNode，仅支持字符串  |

### config 对象属性

| 参数           | 说明                                                            | 类型                                                                                   | 默认值   |
| -------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| `content`      | 提示内容                                                        | `MessageNode`                                                                          | -        |
| `duration`     | 自动关闭的延时，单位秒。设为 0 时不自动关闭                     | `number`                                                                               | `3`      |
| `type`         | 消息类型，决定默认图标与配色（静态方法会自动带上）              | `'info' \| 'success' \| 'warning' \| 'error' \| 'loading'`                              | `'info'` |
| `variant`      | 视觉变体，配色与按钮组件同名变体一致                            | `'base' \| 'filled' \| 'outlined' \| 'soft' \| 'subtle'`                               | `'base'` |
| `color`        | 配色覆盖；缺省由类型映射（loading → primary）                   | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | -        |
| `icon`         | 自定义图标。Web 传图标名或 VNode，UniApp 传图标类名（如 `i-lucide-star`） | `MessageNode`                                                                | 按 `type` 取 |
| `pauseOnHover` | 悬停（UniApp 小程序端为按住）时是否暂停计时器                   | `boolean`                                                                              | `true`   |
| `key`          | 当前提示的唯一标志；同 key 再次调用会原位更新并重置计时         | `string \| number`                                                                     | -        |
| `className`    | 自定义根节点 class                                              | `string`                                                                               | -        |
| `style`        | 自定义根节点行内样式                                            | `CSSProperties`                                                                        | -        |
| `classNames`   | 按语义化结构（root / icon / content）覆盖 class，支持对象或函数 | `Record<SemanticDOM, string> \| (info: { props }) => Record<...>`                      | -        |
| `styles`       | 按语义化结构覆盖行内样式，支持对象或函数                        | `Record<SemanticDOM, CSSProperties> \| (info: { props }) => Record<...>`               | -        |
| `onClick`      | 点击消息时触发的回调函数                                        | `(e) => void`                                                                          | -        |
| `onClose`      | 关闭时触发的回调函数                                            | `() => void`                                                                           | -        |

### message.config

| 参数           | 说明                                                 | 类型                | 默认值                                  |
| -------------- | ---------------------------------------------------- | ------------------- | --------------------------------------- |
| `top`          | 消息距离顶部的位置；传数字时 Web 按 px、UniApp 按 rpx | `string \| number`  | Web `8`（px）/ UniApp `'16rpx'`         |
| `duration`     | 默认自动关闭延时，单位秒                             | `number`            | `3`                                     |
| `maxCount`     | 最大显示数，超过限制时最早的消息会被自动关闭；0 不限 | `number`            | `0`                                     |
| `rtl`          | 是否开启 RTL 模式                                    | `boolean`           | `false`                                 |
| `getContainer` | 配置渲染节点的输出位置，但依旧为全屏展示（**仅 Web / H5 生效**） | `() => HTMLElement` | `() => document.body`       |

### 语义化结构键

`classNames` / `styles` 按以下键覆盖对应节点，两端一致：

| 键名      | 说明                                       |
| --------- | ------------------------------------------ |
| `root`    | 单条消息的根节点（高度、内边距、配色、投影） |
| `icon`    | 类型图标                                   |
| `content` | 提示文本，默认 `truncate` 单行截断         |

## 视觉规格

`base` 变体为 `gray-1` 白底 + 投影，图标为语义色圆形底 + 白色符号；`filled` / `outlined` / `soft` / `subtle` 配色对齐按钮组件的同名变体（不含 circle）。消息是悬浮层，`soft` / `subtle` 的底色用同色相 1 阶**实色**填充令牌等效替代半透明底，`outlined` 垫 `gray-1` 底，避免透出页面内容。

| 项目              | Web                                | UniApp                               |
| ----------------- | ---------------------------------- | ------------------------------------ |
| 单条高度          | 40px                               | 80rpx                                |
| 水平内边距        | 12px                               | 24rpx                                |
| 字号 / 行高       | 14px / 150%                        | 28rpx / 150%                         |
| 圆角              | `rounded-lg`（8px）             | `rounded-lg`                      |
| 图标与文字间距    | 8px                                | 16rpx                                |
| 多条消息间距      | 8px                                | 16rpx                                |
| 投影              | `0 2px 12px rgba(0,0,0,.15)`       | `0 4rpx 24rpx rgba(0,0,0,.15)`       |
| base 图标圆底     | 20px 圆形，符号 14px               | 40rpx 圆形，符号 28rpx               |
| 其余变体图标      | 16px                               | 32rpx                                |
| base 文字色       | `gray-9`                           | `gray-8`                             |
| 层级（z-index）   | `2100`                             | `2100`                               |

::warning
两端调色板不同，`soft` / `subtle` 的浅底令牌因此有别：Web 的 `primary` 用 `brand-1`、`secondary` 用 `secondary-1`；UniApp 的主色即 red 系（`primary` → `red-1`），且没有独立的 secondary 色阶，`secondary` / `neutral` 统一用 `gray-2` 顶替。语义色（success / info / warning / error）两端一致。
::

## 两端差异对照

| 维度              | Web 端                                                        | UniApp 端                                                                    |
| ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 导入路径          | `~/components/reborn/ui/reborn-toast`                         | `@/components/reborn-toast`                                                  |
| `MessageNode`     | `string \| VNode \| (() => VNode)`                            | 仅 `string`                                                                  |
| `icon` 取值       | 图标名字符串或 VNode                                          | Tailwind 图标类名（如 `i-lucide-star`）                                      |
| 容器挂载          | 首次调用时自动 `createVNode` + `render` 挂到 `getContainer()` | H5 同 Web（页面已有 `<RebornToast />` 时不再重复挂）；小程序必须写在页面里   |
| `getContainer`    | 生效                                                          | 仅 H5 生效，小程序端忽略                                                     |
| `top` 默认值      | `8`（px）                                                     | `'16rpx'`；传数字按 rpx 处理                                                 |
| `pauseOnHover`    | 鼠标悬停暂停                                                  | 按住暂停（H5 为悬停）                                                        |
| 离场动画          | `TransitionGroup`                                             | 小程序不支持 `TransitionGroup`，改用 `closing` 标记驱动 CSS 动画（240ms）后移出队列 |
| `onClick` 参数    | `MouseEvent`                                                  | 原生事件对象                                                                 |
| loading 图标      | `lucide:loader-2`                                             | `i-lucide-loader-circle`                                                     |
| 尺寸单位          | px                                                            | rpx                                                                          |

::tip
UniApp 端 `closing` 只影响节点何时从队列移出：`onClose` 与 Promise 的兑现时机与 Web 端一致，都在**关闭那一刻**立即触发，不会等动画结束。
::

## 注意事项

- `duration` 单位是**秒**（不是毫秒）；`loading` 类型同样默认 3 秒自动关闭，需要常驻时传 `duration: 0` 并配合 `key` + `message.destroy(key)` 或同 key 更新收尾。
- Web / H5 端消息容器在首次调用时自动挂载到 `getContainer()`（默认 `body`），无需在模板中放置组件；**小程序端必须页面里有 `<RebornToast />`**（`RebornPage` 已内置）。
- `message.config` 是全局配置，改动会影响后续所有消息；`getContainer` 变更时已挂载的容器节点会被移动到新父级。
- `maxCount` 超限时关闭的是**最早**的那条，被关闭的消息照常触发 `onClose` 与 Promise。
- `content` 默认单行 `truncate`，长文本会被截断；需要多行请用 `classNames: { content: 'whitespace-normal' }` 放开。
- 堆叠折叠（stack）暂未实现；多条消息始终纵向排列，可用 `maxCount` 控制数量上限。
