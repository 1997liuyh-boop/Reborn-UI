---
title: defineShortcuts
description: 注册全局键盘快捷键，支持组合键、链式快捷键、输入框焦点控制和布局无关模式。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# defineShortcuts

`defineShortcuts` 在 `window` 上注册一个 `keydown` 监听，把一组「快捷键 → 回调」配置映射成按键处理。适合命令面板、上下文菜单、编辑器工具栏、页面级热键等场景。

同一文件还导出了 `extractShortcuts`，用于从带 `kbds` 字段的菜单数据里直接生成快捷键配置，菜单上展示的按键和实际生效的按键因此只维护一处。

## API

### defineShortcuts

```ts
function defineShortcuts(
  config: MaybeRefOrGetter<ShortcutsConfig>,
  options?: ShortcutsOptions
): () => void
```

返回值是 `@vueuse/core` 的 `useEventListener` 给出的清理函数，调用后移除监听。`config` 可以是 ref 或 getter，内容变化时按新配置匹配。

### ShortcutsConfig

```ts
interface ShortcutsConfig {
  [key: string]: ShortcutConfig | Handler | false | null | undefined
}

type Handler = (event?: KeyboardEvent) => void
```

键名写法：

- **组合键**：用 `_` 连接修饰键和按键，例如 `meta_k`、`ctrl_shift_f`。修饰键可写 `meta` / `command`、`ctrl`、`shift`、`alt` / `option`。
- **链式快捷键**：用 `-` 连接两个按键，表示依次按下，例如 `g-h`。键名里同时含 `_` 时按组合键处理。
- 值为 `false`、`null`、`undefined` 时该项不注册，可用于按条件禁用。

### ShortcutConfig

```ts
interface ShortcutConfig {
  handler: Handler
  usingInput?: string | boolean
}
```

`usingInput` 控制焦点在输入元素（`input`、`textarea`、`contenteditable` 为 `true` 或 `plaintext-only` 的元素）上时是否生效：

| 取值 | 行为 |
| :--- | :--- |
| `false` / 不传 | 输入元素聚焦时不生效，避免打字时误触发。 |
| `true` | 任何输入元素聚焦时都生效。 |
| `string` | 仅当聚焦元素的 `name` 属性等于该值时生效；焦点不在输入元素上时也不生效。 |

### ShortcutsOptions

```ts
interface ShortcutsOptions {
  chainDelay?: number
  layoutIndependent?: boolean
}
```

| 字段 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `chainDelay` | `800` | 链式快捷键两次按键之间允许的最长间隔，单位 ms；超时未匹配会清空已记录的按键。 |
| `layoutIndependent` | `false` | 为 `true` 时按 `KeyboardEvent.code`（物理键位）匹配，而不是 `KeyboardEvent.key`（输出字符），AZERTY、Dvorak 等布局下按键位置不变。 |

### extractShortcuts

```ts
function extractShortcuts(
  items: ShortcutItem[] | ShortcutItem[][],
  separator?: '_' | '-'
): Record<string, Handler>
```

```ts
interface ShortcutItem {
  kbds?: string[]
  onSelect?: Handler
  onClick?: Handler
  children?: ShortcutItem[] | ShortcutItem[][]
  items?: ShortcutItem[] | ShortcutItem[][]
}
```

它递归遍历 `items`、`children` 和嵌套的 `items`，把同时具有 `kbds` 与回调的项登记为快捷键：键名是 `kbds` 用 `separator`（默认 `'_'`）拼接的结果，回调优先取 `onSelect`，没有时取 `onClick`。

## 使用示例

### 定义页面快捷键

```ts
import { defineShortcuts } from '~/composables/defineShortcuts'

defineShortcuts({
  // macOS 上是 ⌘K，其他平台自动换成 Ctrl+K
  meta_k: () => openCommandPalette(),
  // 输入框聚焦时也要能关闭
  escape: {
    handler: () => closeDialog(),
    usingInput: true,
  },
  // 依次按 g、h
  'g-h': () => navigateTo('/'),
})
```

### 从菜单数据提取快捷键

```ts
import { defineShortcuts, extractShortcuts } from '~/composables/defineShortcuts'

const items = [
  { label: '复制', kbds: ['meta', 'c'], onSelect: () => copy() },
  { label: '删除', kbds: ['shift', 'backspace'], onSelect: () => remove() },
]

// 生成 { meta_c: copy, shift_backspace: remove }
defineShortcuts(extractShortcuts(items))
```

## 使用说明

- **监听是全局的**：挂在 `window` 上，在组件 `setup` 中调用时组件卸载会自动移除；在 `setup` 之外调用要自己保存返回的清理函数并在合适时机调用。
- **命中即阻止默认行为**：匹配到且处于启用状态的快捷键会调用 `event.preventDefault()`，例如 `meta_s` 会拦下浏览器的保存页面。
- **跨平台修饰键**：非 macOS / iOS 平台上，配置里有 `meta`（或 `command`）而没有 `ctrl` 的项会改按 `Ctrl` 匹配。
- **Shift 的匹配规则**：字母键、四个方向键（`arrowup` / `arrowdown` / `arrowleft` / `arrowright`）、`tab`、`escape`、`enter`、`backspace`，以及配置里写了 `shift` 或按下了 `Meta` / `Ctrl` 的情况，`Shift` 状态必须与配置一致；其他按键忽略 `Shift`，例如需要 `Shift` 才能输入的 `?` 直接写成 `'?'` 即可。
- **链式快捷键只看最近两次按键**：每次按键（包括单独按下的修饰键）都会记入序列，因此 `g` 和 `h` 之间按了别的键就不会命中；链式匹配不检查修饰键，默认模式下键名与按键都转成小写再比对，开着大写锁定或按住 `Shift` 时 `g-h` 同样命中。
- **键名格式错误只告警**：以 `-` 或 `_` 开头、结尾等不合法的键名会在控制台输出 `[Shortcut] 无效的快捷键`（`console.warn`），不会抛错；配置只在自身变化时重新解析，同一份配置只告警一次。
- **焦点只在按键时读取**：配置解析与焦点无关，页面上焦点切换不会让整张快捷键表重新解析；是否因为输入框聚焦而禁用，在每次按键时按当时的焦点判断。
