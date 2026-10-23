---
title: useCopyToClipboard
description: 把文本写入系统剪贴板并弹出成功提示，每次调用都执行一次写入，可直接在点击回调中使用。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useCopyToClipboard

`useCopyToClipboard` 调用 `navigator.clipboard.writeText()` 写入文本，写入成功后通过 Nuxt UI 的 `useToast()` 弹出一条提示（标题 `Success!`，描述 `Successfully copied to clipboard.`，颜色 `success`）。

它是普通函数，不缓存调用结果，每调用一次就写入一次剪贴板，适合放在复制按钮的点击回调里。

## API

```ts
function useCopyToClipboard(text: string): void
```

直接调用即执行复制，不返回 `copy` 方法，也不返回 Promise，调用方无法得知写入是否成功。

## 使用示例

```ts
import { useCopyToClipboard } from '~/composables/useCopyToClipboard'

function handleCopy(code: string) {
  useCopyToClipboard(code)
}
```

## 使用说明

- **可在 `setup` 之外调用**：点击回调里没有组件实例，直接调用 `useToast()` 会让 Vue 输出 `inject()` 只能在 `setup` 中使用的告警，所以这种情况下它借 Nuxt 应用上下文创建 Toast；在 `setup` 中调用时照常创建，能读到 `UApp` 提供的 Toast 配置。
- **需要知道写入结果或自定义提示时改用别的方式**：直接调用 `navigator.clipboard.writeText()`，或使用 `@vueuse/core` 的 `useClipboard`（文档站的代码复制按钮 `DemoActions` 就是这样做的）。
- **失败没有提示**：写入被拒绝（如页面未获得焦点、非安全上下文）时不弹提示，Promise 的拒绝也没有被捕获。
- **仅限浏览器**：依赖 `navigator.clipboard`，服务端渲染阶段调用会报错，只能在客户端交互中调用。
