---
title: useOverlay
description: 以编程方式管理 Dialog、Drawer 及其二次封装组件的打开、关闭、更新和销毁，支持异步确认。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useOverlay

`useOverlay` 用编程方式唤起 `reborn-dialog`、`reborn-drawer` 以及基于它们二次封装的业务弹层：先 `create()` 拿到实例，再在任意逻辑里 `await open()` 等待用户操作结果，模板里不需要预先放置组件。

每次打开时，它用 `createApp()` 把组件挂到 `body` 下新建的容器里，并把 `modelValue` 固定传为 `true`；组件发出的关闭、确认、取消事件会被转成 `open()` 返回的 Promise 的结果。所有实例登记在模块级的状态表里，因此在不同组件里调用 `useOverlay()` 拿到的是同一份状态。

## API

### useOverlay

```ts
function useOverlay(): {
  create: <T extends Component>(component: T, options?: OverlayOptions<T>) => OverlayInstance<T>
  open: <T extends Component>(id: symbol, props?: ComponentProps<T>) => Promise<any>
  close: (id: symbol, value?: any) => void
  closeAll: () => void
  patch: <T extends Component>(id: symbol, props: Partial<ComponentProps<T>>) => void
  unmount: (id: symbol) => void
  isOpen: (id: symbol) => boolean
  overlays: [symbol, OverlayState][]
}

type OverlayReturn = ReturnType<typeof useOverlay>
```

| 成员 | 说明 |
| :--- | :--- |
| `create` | 登记一个浮层并返回实例；`options.defaultOpen` 为 `true` 时登记后立即打开。 |
| `open` | 打开指定 `id` 的浮层，本次传入的 `props` 与基础 props（`options.props` 加上之后 `patch()` 的修改）浅合并，只对这一次打开生效；`id` 不存在时返回被拒绝的 Promise。 |
| `close` | 关闭浮层，用 `value` 解析 `open()` 的 Promise，并把 props 还原为 `create()` 时的初始值。 |
| `closeAll` | 关闭状态表里所有处于打开状态的浮层。 |
| `patch` | 浅合并新的 props；浮层已打开时卸载后用最新 props 重新挂载。 |
| `unmount` | 先关闭（若已打开），再把浮层从状态表中移除，之后该 `id` 无法再打开。 |
| `isOpen` | 返回指定 `id` 当前是否打开。 |
| `overlays` | 调用 `useOverlay()` 那一刻状态表的快照数组，之后的增删和开关不会反映到这个数组上。 |

### OverlayOptions

```ts
interface OverlayOptions<T extends Component> {
  defaultOpen?: boolean
  props?: ComponentProps<T>
  destroyOnClose?: boolean
  content?: VNode | (() => VNode)
  header?: VNode | (() => VNode)
  footer?: VNode | (() => VNode)
  onConfirm?: () => void | Promise<void>
}
```

| 字段 | 说明 |
| :--- | :--- |
| `defaultOpen` | 创建后立即打开。 |
| `props` | 每次打开时传给组件的基础 props。 |
| `destroyOnClose` | 为 `true` 时关闭后把实例从状态表移除，之后再调用该实例的 `open()` 会被拒绝。 |
| `content` | 传给组件的默认插槽（`RebornDialog` 的正文是 `default` 插槽，选项名沿用 `content`）。 |
| `header` / `footer` | 同名透传为 `header` / `footer` 具名插槽。 |
| `onConfirm` | 异步确认回调，行为见下文「确认流程」。 |

### OverlayInstance

```ts
interface OverlayInstance<T extends Component = Component> {
  open: (props?: ComponentProps<T>) => Promise<any>
  close: (value?: any) => void
  patch: (props: Partial<ComponentProps<T>>) => void
  id: symbol
}
```

实例上的三个方法等价于以实例 `id` 调用 `useOverlay()` 返回的同名方法。

### open() 的解析结果

| 触发方式 | 解析值 | 是否关闭 |
| :--- | :--- | :--- |
| 组件发出 `confirm`，未提供 `onConfirm` | `'confirm'` | 否，由调用方决定何时关闭 |
| 组件发出 `confirm`，提供了 `onConfirm` 且回调正常返回 | `'confirm'` | 是 |
| 组件发出 `cancel` | `'cancel'` | 是 |
| 组件发出 `close`（二次封装组件可带参数） | 事件参数 | 是 |
| 组件发出 `update:modelValue` / `update:open` 且值为 `false` | `undefined` | 是 |
| 调用 `close(value)` / 实例 `close(value)` | `value` | 是 |

## 使用示例

### 等待用户确认

```ts
import { useOverlay } from '~/composables/useOverlay'
import RebornDialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue'

const overlay = useOverlay()
const dialog = overlay.create(RebornDialog, {
  props: {
    title: '删除确认',
    confirmBtn: '删除',
    cancelBtn: '取消',
  },
})

async function handleDelete() {
  const result = await dialog.open({ describe: '删除后无法恢复，确定继续吗？' })
  if (result === 'confirm') {
    // 未提供 onConfirm 时确认不会自动关闭，处理完再手动关闭
    await removeItem()
    dialog.close()
  }
}
```

### 异步确认

```ts
const dialog = overlay.create(RebornDialog, {
  props: {
    title: '提交审核',
    // 可不传 confirmBtn：loading 照样注入，按钮文案沿用组件默认值
    confirmBtn: '提交',
  },
  // 回调期间确认按钮显示 loading；正常返回则关闭并解析为 'confirm'，抛错则保持打开、可再次点击
  onConfirm: async () => {
    await submitReview()
  },
})

const result = await dialog.open()
```

## 使用说明

- **确认流程**：提供 `onConfirm` 后，点击确认会先把确认按钮置为 loading 再执行回调；回调执行期间重复点击被忽略，取消、关闭、`update:modelValue` 也全部被拦下，避免异步流程中途被打断。回调抛错时按钮恢复，浮层保持打开。
- **loading 注入到确认按钮配置**：字符串规整为 `{ label, loading }`，对象补上 `loading`，`props` 里没有传 `confirmBtn` 时注入 `{ loading }`，按钮文案等其余配置由组件默认值补齐（`RebornDialog` 显示「确认」）。`confirmBtn: false` 原样透传，按钮隐藏，也就没有 loading 可显示。
- **关闭是立即卸载**：`close()` 会同步卸载整个浮层应用并移除容器，组件自身的退场动画不会播放。
- **独立的 Vue 应用**：浮层通过 `createApp()` 挂载，不继承当前应用的 `provide`、全局组件、全局指令和插件（例如 Nuxt 插件全局注册的 `v-loading`），浮层组件需要的依赖要在组件内部显式引入。
- **已打开时不要再调用 `open()`**：此时不会重新挂载，新 props 不生效，而且上一次 `open()` 返回的 Promise 会被替换、不再解析；更新内容请用 `patch()`。
- **`patch()` 会重建组件**：重新挂载意味着组件内部状态（输入中的表单、滚动位置等）会丢失；`open()` 的 Promise 保持不变。浮层关闭后 props 会还原为初始值，`patch()` 的修改不会保留到下一次打开。
