---
title: useOverlay
description: 以编程方式管理 Dialog、Popup 及其二次封装组件的打开、关闭、更新和销毁。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useOverlay

`useOverlay` 是一个面向浮层的编程式管理工具，适合用于 `reborn-dialog`、`reborn-popup` 以及基于它们封装的业务弹层组件。

它通过 `createApp()` 动态挂载组件，并在内部维护全局 overlay 状态表。

## API

### useOverlay

```ts
function useOverlay(): {
  create: <T extends Component>(component: T, options?: OverlayOptions<T>) => OverlayInstance<T>
  open: <T extends Component>(id: symbol, props?: Partial<ComponentProps<T>>) => Promise<any>
  close(id: symbol, value?: any): void
  closeAll(): void
  patch: <T extends Component>(id: symbol, props: Partial<ComponentProps<T>>) => void
  unmount(id: symbol): void
  isOpen(id: symbol): boolean
  overlays: [symbol, OverlayState][]
}
```

### OverlayOptions

```ts
interface OverlayOptions<T extends Component> {
  defaultOpen?: boolean
  props?: ComponentProps<T>
  destroyOnClose?: boolean
  content?: VNode | (() => VNode)
  header?: VNode | (() => VNode)
  footer?: VNode | (() => VNode)
}
```

### OverlayInstance

```ts
interface OverlayInstance<T extends Component = Component> {
  id: symbol
  open(props?: ComponentProps<T>): Promise<any>
  close(value?: any): void
  patch(props: Partial<ComponentProps<T>>): void
}
```

## 使用示例

```ts
const overlay = useOverlay()
const dialog = overlay.create(RebornDialog, {
  props: {
    title: '删除确认'
  }
})

await dialog.open({
  description: '确定要删除当前内容吗？'
})
```

## 使用说明

- `create()` 会返回一个实例对象，后续可通过该实例直接 `open`、`close`、`patch`。
- `open()` 返回 `Promise`，可用于串联确认流或异步交互。
- `patch()` 会在浮层已打开时重新挂载，以应用最新 props。
- `destroyOnClose` 为 `true` 时，关闭后会将实例从全局状态表中移除。
