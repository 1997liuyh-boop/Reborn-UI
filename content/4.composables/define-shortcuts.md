---
title: defineShortcuts
description: 定义全局键盘快捷键的组合式函数，支持组合键、链式快捷键、输入框焦点控制和布局无关模式。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# defineShortcuts

`defineShortcuts` 用于在 Web 端注册全局 `keydown` 监听，并将一组快捷键配置映射为可执行回调。它适合用于命令面板、上下文菜单、编辑器工具栏、页面级操作热键等场景。

当前文件同时导出了 `extractShortcuts`，可直接从菜单数据结构中提取快捷键映射。

## API

### defineShortcuts

```ts
function defineShortcuts(
  config: MaybeRefOrGetter<ShortcutsConfig>,
  options?: ShortcutsOptions
): () => void
```

### ShortcutsConfig

```ts
interface ShortcutsConfig {
  [key: string]: ShortcutConfig | Handler | false | null | undefined
}
```

- 使用 `_` 表示组合键，例如 `meta_k`、`ctrl_shift_f`
- 使用 `-` 表示链式快捷键，例如 `g-h`
- 值为 `false`、`null`、`undefined` 时表示禁用该快捷键

### ShortcutConfig

```ts
interface ShortcutConfig {
  handler: (event?: KeyboardEvent) => void
  usingInput?: string | boolean
}
```

`usingInput` 用于控制输入框聚焦时是否仍然生效：

- `false`：默认行为，输入框聚焦时禁用该快捷键
- `true`：任何输入框聚焦时仍然生效
- `string`：仅在当前聚焦输入框的 `name` 与该值一致时生效

### ShortcutsOptions

```ts
interface ShortcutsOptions {
  chainDelay?: number
  layoutIndependent?: boolean
}
```

- `chainDelay`：链式快捷键两次按键之间的最大间隔，默认 `800`
- `layoutIndependent`：是否基于 `KeyboardEvent.code` 匹配物理键位，默认 `false`

### extractShortcuts

```ts
function extractShortcuts(
  items: ShortcutItem[] | ShortcutItem[][],
  separator?: '_' | '-'
): Record<string, Handler>
```

它会遍历带有 `kbds` 的菜单项，并优先取 `onSelect`，没有时回退到 `onClick`。

## 使用示例

### 定义页面快捷键

```ts
defineShortcuts({
  meta_k: () => openCommandPalette(),
  escape: {
    handler: () => closeDialog(),
    usingInput: true
  },
  'g-h': () => navigateTo('/'),
})
```

### 从菜单数据提取快捷键

```ts
const items = [
  { label: '复制', kbds: ['meta', 'c'], onSelect: () => copy() },
  { label: '删除', kbds: ['shift', 'backspace'], onSelect: () => remove() }
]

defineShortcuts(extractShortcuts(items))
```

## 使用说明

- 这是全局监听器，建议在页面级或应用级容器中使用。
- 非 macOS 平台会将仅使用 `meta` 的配置自动映射为 `ctrl`。
- 链式快捷键只匹配最近两次按键。
- `layoutIndependent` 适合需要兼容非 QWERTY 键盘布局的场景。
