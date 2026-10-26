---
title: copyToClipboard
description: 把文本写入系统剪贴板并按结果弹出成功或失败提示，返回是否写入成功，可直接在点击回调中使用。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# copyToClipboard

`copyToClipboard` 调用 `navigator.clipboard.writeText()` 写入文本，并通过 Nuxt UI 的 `useToast()` 提示结果：成功时标题 `Success!`、描述 `Successfully copied to clipboard.`、颜色 `success`；失败时标题「复制失败」、颜色 `error`。

它是命令式的工具函数（源码在 `app/utils/copyToClipboard.ts`，随 Nuxt 自动导入），不是组合式函数：不缓存调用结果，每调用一次就写入一次剪贴板，适合放在复制按钮的点击回调里。

## API

```ts
function copyToClipboard(text: string): Promise<boolean>
```

返回的 Promise 解析为是否写入成功，不会被拒绝；不关心结果时可以不 `await`。

## 使用示例

```ts
async function handleCopy(code: string) {
  const ok = await copyToClipboard(code)
  if (ok) copied.value = true
}
```

## 使用说明

- **不要在 `setup` 顶层调用**：调用即执行复制，放在 `setup` 顶层会在组件创建时就写一次剪贴板。它不以 `use` 开头，就是为了和「在 `setup` 里调用、随组件清理」的组合式函数区分开。
- **可在 `setup` 之外调用**：点击回调里没有组件实例，直接调用 `useToast()` 会让 Vue 输出 `inject()` 只能在 `setup` 中使用的告警，所以这种情况下它借 Nuxt 应用上下文创建 Toast；在 `setup` 中调用时照常创建，能读到 `UApp` 提供的 Toast 配置。
- **失败会提示并返回 `false`**：非安全上下文（http 访问）没有 `navigator.clipboard`、用户拒绝权限、页面未获得焦点时，都弹出失败提示并解析为 `false`，控制台不会出现未捕获的 Promise 拒绝。
- **需要自定义提示时改用别的方式**：提示文案是固定的；要自己控制提示或复制状态，直接调用 `navigator.clipboard.writeText()`，或使用 `@vueuse/core` 的 `useClipboard`（文档站的代码复制按钮 `DemoActions` 就是这样做的）。
- **仅限浏览器**：依赖 `navigator.clipboard`，只能在客户端交互中调用。
