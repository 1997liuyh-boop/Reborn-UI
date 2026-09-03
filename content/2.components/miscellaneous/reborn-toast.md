---
title: Toast 消息提示
description: 全局命令式消息提示：五种类型静态方法、Promise 接口、同 key 更新与全局配置，web 端由 Toast 升级而来。
category: 杂项
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornToastDemo.vue" config="RebornToastConfig" componentId="reborn-toast" :componentFiles='["RebornToast.vue", "index.ts", "reborn-toast.config.ts"]' :uniappFiles='["RebornToast.vue", "index.ts", "reborn-toast.config.ts"]'}
::

## API

组件提供了一些静态方法，使用方式和参数如下：

```ts
import { message } from "~/components/reborn/ui/reborn-toast";

message.success(content, [duration], onClose);
message.error(content, [duration], onClose);
message.info(content, [duration], onClose);
message.warning(content, [duration], onClose);
message.loading(content, [duration], onClose);
```

### 静态方法参数

| 参数       | 说明                                        | 类型                        | 默认值 |
| ---------- | ------------------------------------------- | --------------------------- | ------ |
| `content`  | 提示内容                                    | `string \| VNode \| config` | -      |
| `duration` | 自动关闭的延时，单位秒。设为 0 时不自动关闭 | `number`                    | `3`    |
| `onClose`  | 关闭时触发的回调函数                        | `function`                  | -      |

组件同时提供 Promise 接口，在消息关闭后兑现：

```ts
message[level](content, [duration]).then(afterClose);
message[level](content, [duration], onClose).then(afterClose);
```

也可以对象的形式传递参数：

```ts
message.open(config);
message.success(config);
// error / info / warning / loading 同理
```

### config 对象属性

| 参数           | 说明                                                            | 类型                                                                                   | 默认值   |
| -------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| `content`      | 提示内容                                                        | `string \| VNode \| () => VNode`                                                       | -        |
| `duration`     | 自动关闭的延时，单位秒。设为 0 时不自动关闭                     | `number`                                                                               | `3`      |
| `variant`      | 视觉变体，配色与按钮组件同名变体一致                            | `'base' \| 'filled' \| 'outlined' \| 'soft' \| 'subtle'`                               | `'base'` |
| `color`        | 配色覆盖；缺省由类型映射（loading → primary）                   | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | -        |
| `icon`         | 自定义图标：图标名字符串或 VNode                                | `string \| VNode \| () => VNode`                                                       | -        |
| `pauseOnHover` | 悬停时是否暂停计时器                                            | `boolean`                                                                              | `true`   |
| `key`          | 当前提示的唯一标志；同 key 再次调用会原位更新并重置计时         | `string \| number`                                                                     | -        |
| `className`    | 自定义根节点 class                                              | `string`                                                                               | -        |
| `style`        | 自定义根节点行内样式                                            | `CSSProperties`                                                                        | -        |
| `classNames`   | 按语义化结构（root / icon / content）覆盖 class，支持对象或函数 | `Record<SemanticDOM, string> \| (info: { props }) => Record<...>`                      | -        |
| `styles`       | 按语义化结构覆盖行内样式，支持对象或函数                        | `Record<SemanticDOM, CSSProperties> \| (info: { props }) => Record<...>`               | -        |
| `onClick`      | 点击消息时触发的回调函数                                        | `function`                                                                             | -        |
| `onClose`      | 关闭时触发的回调函数                                            | `function`                                                                             | -        |

### 全局方法

```ts
message.config(options);
message.destroy(); // 关闭全部
message.destroy(key); // 关闭某一条
```

### message.config

```ts
message.config({
  top: 100,
  duration: 2,
  maxCount: 3,
});
```

| 参数           | 说明                                                 | 类型                | 默认值                |
| -------------- | ---------------------------------------------------- | ------------------- | --------------------- |
| `top`          | 消息距离顶部的位置                                   | `string \| number`  | `8`                   |
| `duration`     | 默认自动关闭延时，单位秒                             | `number`            | `3`                   |
| `maxCount`     | 最大显示数，超过限制时最早的消息会被自动关闭；0 不限 | `number`            | `0`                   |
| `rtl`          | 是否开启 RTL 模式                                    | `boolean`           | `false`               |
| `getContainer` | 配置渲染节点的输出位置，但依旧为全屏展示             | `() => HTMLElement` | `() => document.body` |

## 视觉规格

单条消息高 40px、水平内边距 12px、字号 14px、圆角 8px。基础变体（base）为 `gray-1` 白底 + `0 2px 12px rgba(0,0,0,.15)` 投影，图标为语义色圆形底 + 白色符号；filled / outlined / soft / subtle 配色对齐按钮组件的同名变体（不含 circle）。消息为悬浮层，soft / subtle 底色用同色相 1 阶实色填充令牌等效替代半透明底，outlined 垫 `gray-1` 底，避免透出页面内容。

## 注意事项

- web 端为本页的 `message` 命令式 API；uniapp 端仍为轻提示 Toast（`useToast()` 服务式调用，参数与本页不同），双端 API 暂不互通。
- `duration` 单位是秒（不是毫秒）；`loading` 类型同样默认 3 秒自动关闭，需要常驻时传 `duration: 0` 并配合 `key` + `message.destroy(key)` 或同 key 更新收尾。
- 消息容器在首次调用时自动挂载到 `getContainer()`（默认 body），无需在模板中放置组件。
- 堆叠折叠（stack）暂未实现；多条消息始终纵向排列，可用 `maxCount` 控制数量上限。
