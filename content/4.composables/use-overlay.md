---
title: useOverlay
description: 以编程方式管理 Dialog、Drawer 及其二次封装组件的打开、关闭、更新和销毁，支持异步确认，实例随创建者的作用域自动注销。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useOverlay

`useOverlay` 用编程方式唤起 `reborn-dialog`、`reborn-drawer` 以及基于它们二次封装的业务弹层：先 `create()` 拿到实例，再在任意逻辑里 `await open()` 等待用户操作结果，模板里不需要预先放置组件。

所有实例登记在客户端共享的响应式登记表里，由宿主组件 `RebornOverlayHost` 统一渲染并经 `Teleport` 输出到 `body`。宿主放在应用根组件里时，浮层留在主组件树中，组件内的 `useId()`、`inject()`、全局组件与指令、应用的错误处理都和普通组件一样可用。打开时传给组件的 `modelValue`（以及供 `v-model:open` 封装用的 `open`）跟随实例的开关状态，组件发出的关闭、确认、取消事件会被转成 `open()` 返回的 Promise 的结果。

在组件 `setup` 或 `effectScope` 内调用 `create()` 时，实例随这个作用域一起注销：创建它的组件卸载后，浮层立即移除、登记随之删除。

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
  overlays: ComputedRef<OverlaySummary[]>
}

type OverlayReturn = ReturnType<typeof useOverlay>
```

| 成员 | 说明 |
| :--- | :--- |
| `create` | 登记一个浮层并返回实例；`options.defaultOpen` 为 `true` 时登记后立即打开。服务端调用时返回不登记、不渲染的空实例。 |
| `open` | 打开指定 `id` 的浮层，本次传入的 `props` 与基础 props（`options.props` 加上之后 `patch()` 的修改）浅合并，只对这一次打开生效；`id` 不存在或已注销时返回被拒绝的 Promise。浮层已打开时再次调用，上一次的 Promise 以 `undefined` 解析，新 props 生效。 |
| `close` | 关闭浮层，用 `value` 解析 `open()` 的 Promise，并把基础 props 还原为 `create()` 时的初始值。组件保留到离场动画结束才移出。 |
| `closeAll` | 关闭登记表里所有处于打开状态的浮层。 |
| `patch` | 浅合并新的 props；浮层正在显示时直接更新组件的 props，组件不重建。 |
| `unmount` | 立即移除浮层（不播放离场动画）并删除登记，打开中的 Promise 以 `undefined` 解析，之后该 `id` 无法再打开。 |
| `isOpen` | 返回指定 `id` 当前是否打开，可在模板和 `computed` 里使用。 |
| `overlays` | 登记表中全部浮层的列表，增删和开关都会反映。 |

### RebornOverlayHost

```ts
const RebornOverlayHost: Component
```

浮层宿主，放在应用根组件里一次即可（推荐放在 `UApp` 内，浮层能拿到 `UApp` 提供的配置）：

```vue
<script setup lang="ts">
import { RebornOverlayHost } from '~/composables/useOverlay'
</script>

<template>
  <UApp>
    <NuxtPage />
    <RebornOverlayHost />
  </UApp>
</template>
```

宿主只在客户端挂载后渲染，服务端和水合首帧输出为空。页面上有多个宿主时，只有最后挂载的那个渲染浮层。

### OverlayOptions

```ts
interface OverlayOptions<T extends Component> {
  defaultOpen?: boolean
  props?: ComponentProps<T>
  destroyOnClose?: boolean
  persistent?: boolean
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
| `destroyOnClose` | 为 `true` 时关闭后注销实例，之后再调用该实例的 `open()` 会被拒绝。 |
| `persistent` | 为 `true` 时不随创建者的作用域注销，用于跨组件长期持有同一个实例；不再使用时要自己调用 `unmount(id)`。 |
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

### OverlaySummary

```ts
interface OverlaySummary {
  id: symbol
  component: Component
  isOpen: boolean
  props: Record<string, any>
}
```

`overlays` 列表的每一项：`props` 是当前渲染用的 props。

### open() 的解析结果

| 触发方式 | 解析值 | 是否关闭 |
| :--- | :--- | :--- |
| 组件发出 `confirm`，未提供 `onConfirm` | `'confirm'` | 否，由调用方决定何时关闭 |
| 组件发出 `confirm`，提供了 `onConfirm` 且回调正常返回 | `'confirm'` | 是 |
| 组件发出 `cancel` | `'cancel'` | 是 |
| 组件发出 `close`（二次封装组件可带参数） | 事件参数 | 是 |
| 组件发出 `update:modelValue` / `update:open` 且值为 `false` | `undefined` | 是 |
| 调用 `close(value)` / 实例 `close(value)` | `value` | 是 |
| 浮层已打开时再次 `open()` | `undefined`（上一次的 Promise） | 否，以新 props 继续显示 |
| 创建者的作用域销毁、调用 `unmount(id)` | `undefined` | 是，立即移除 |

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

### 交给其他组件继续使用

```ts
// 在某个组件的 setup 里创建，但实例要交给别的组件长期使用：不随本组件卸载
const overlay = useOverlay()
const settingsDrawer = overlay.create(RebornDrawer, {
  persistent: true,
  props: { title: '全局设置' },
})
useSettingsStore().settingsDrawer = settingsDrawer

// 不再需要时由持有方自行注销
// overlay.unmount(settingsDrawer.id)
```

## 使用说明

- **确认流程**：提供 `onConfirm` 后，点击确认会先把确认按钮置为 loading 再执行回调；回调执行期间重复点击被忽略，取消、关闭、`update:modelValue` 也全部被拦下，避免异步流程中途被打断。回调抛错时按钮恢复，浮层保持打开。
- **loading 注入到确认按钮配置**：字符串规整为 `{ label, loading }`，对象补上 `loading`，`props` 里没有传 `confirmBtn` 时注入 `{ loading }`，按钮文案等其余配置由组件默认值补齐（`RebornDialog` 显示「确认」）。`confirmBtn: false` 原样透传，按钮隐藏，也就没有 loading 可显示。
- **关闭会播放离场动画**：关闭时先把 `modelValue` 置为 `false`、立即解析 Promise，组件留在宿主里播放离场过渡，发出 `closed` 后才移出；组件不发 `closed`（多数二次封装组件没有转发它）时，最多等 1 秒再加上组件的 `closeDelay` 由定时器移出。离场期间再次 `open()` 会直接切回打开状态，组件不重建。
- **随创建者作用域注销**：`RebornDialogDemo` 这类在 `setup` 里一次创建多个实例的页面，离开时实例全部注销，不会在登记表里越积越多，打开中的弹窗也不会留在下一个页面上。注销走 `unmount()`，所以没有离场动画。在组件之外创建、或需要跨组件共享时传 `persistent: true`，并自己负责 `unmount()`。
- **没有放置宿主时退回独立应用**：未放 `RebornOverlayHost` 时，首次 `open()` 会在 `body` 下创建一个独立的 Vue 应用承载宿主，所有浮层共用它，`useId()` 带独立前缀 `rb-overlay-N`，不会与主应用或彼此撞号。这个应用会复制首个调用方所在应用的错误处理、全局属性、全局组件与指令、应用级 `provide`，但拿不到组件层级的 `provide`（例如 `UApp` 提供的配置），所以仍推荐放置宿主。之后宿主挂载时，独立应用会被销毁，浮层改由宿主渲染。
- **`patch()` 不重建组件**：浮层显示期间 `patch()` 只更新 props，输入中的表单、滚动位置和焦点都保留。浮层关闭后基础 props 还原为初始值，`patch()` 的修改不会保留到下一次打开。
- **服务端不登记**：服务端调用 `create()` 返回空实例，`open()` 直接以 `undefined` 解析，不会在服务端进程里跨请求积累记录。
