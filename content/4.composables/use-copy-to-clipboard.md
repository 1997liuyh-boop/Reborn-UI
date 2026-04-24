---
title: useCopyToClipboard
description: 将文本写入系统剪贴板，并通过全局 Toast 给出复制成功提示。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useCopyToClipboard

`useCopyToClipboard` 基于 `navigator.clipboard.writeText()` 实现复制功能，并在成功后调用 `useToast()` 显示成功提示。

## API

```ts
function useCopyToClipboard(text: string): void
```

## 使用示例

```ts
function handleCopy(code: string) {
  useCopyToClipboard(code)
}
```

## 使用说明

- 当前实现是直接调用式，而不是返回一个 `copy` 方法。
- 内部使用 `createSharedComposable` 包装，多个位置调用时会复用同一套 composable 上下文。
- 该能力依赖浏览器原生剪贴板 API，仅适用于 Web 环境。
