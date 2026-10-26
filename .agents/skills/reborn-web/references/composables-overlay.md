# 组合式函数规范：useOverlay 与全局滚动锁 (Web)

## 1. useOverlay 命令式弹层管理

`app/composables/useOverlay.ts` 提供命令式 API，用于全局管理 `reborn-dialog`、`reborn-drawer` 及其二次封装组件。核心机制：以 `Symbol` 为键的客户端共享登记表（`shallowReactive(new Map())`）存放实例状态，由宿主组件 `RebornOverlayHost`（放在 app.vue 的 `UApp` 内）`v-for` 渲染全部浮层并 `Teleport` 到 `body`，浮层留在主组件树里，`useId` / `provide` / 全局组件 / 错误处理自然继承。未放置宿主时首次 `open()` 退回一个承载宿主的独立应用（独立 `idPrefix`，复制首个调用方应用的上下文）。

### 1.1 API 一览

```typescript
const overlay = useOverlay()
// 返回：{ create, open, close, closeAll, patch, unmount, isOpen, overlays }
// overlays 是 ComputedRef<OverlaySummary[]>，isOpen(id) 可在模板 / computed 中响应式使用

const instance = overlay.create(MyDialog, options)
// OverlayInstance：{ open, close, patch, id }

const result = await instance.open()   // Promise，解析为 'confirm' / 'cancel' / close 传入值
instance.patch({ title: '新标题' })     // 直接更新渲染用 props，组件不重建
instance.close('someValue')            // 立即解析 Promise，组件播放离场动画后移出宿主
```

### 1.2 OverlayOptions

| 选项 | 类型 | 说明 |
|------|------|------|
| `defaultOpen` | `boolean` | 创建后立即打开 |
| `props` | `ComponentProps<T>` | 传递给组件的 props |
| `destroyOnClose` | `boolean` | 关闭后注销，之后 `open()` 被拒绝 |
| `persistent` | `boolean` | 不随创建者的作用域注销（默认在组件 / effectScope 内创建时随作用域 `unmount`） |
| `content` / `header` / `footer` | `VNode | (() => VNode)` | 透传给目标组件的具名插槽 |
| `onConfirm` | `() => void | Promise<void>` | 异步确认回调（见 1.3） |

### 1.3 onConfirm 异步确认模式

提供 `onConfirm` 后，确认流程自动升级为「loading + 成功关闭 / 失败重试」：

- 点击确认时，确认按钮自动注入 `loading` 态（`withLoading` 会把 `confirmBtn` 的 string / 对象 / `false` 三种形态安全规整为带 `loading` 字段的对象）。
- 回调正常返回 → 视为成功，先恢复按钮再自动关闭，并使 `open()` 解析为 `'confirm'`。
- 回调抛出 → 视为失败，保持打开、恢复按钮，可重试。
- **确认进行中锁定**：`confirming` 期间 `update:modelValue`、`update:open`、`cancel`、`close` 一律忽略，避免中途关闭打断异步流程；重复点击确认被防抖忽略。
- 未提供 `onConfirm` 时保持旧行为：确认仅解析 `'confirm'`，不自动关闭，由调用方决定关闭时机。

### 1.4 目标组件契约

被 `useOverlay` 托管的组件必须满足：

- 支持 `modelValue`（或 `v-model:open` 封装的 `open`）受控显隐，并在用户关闭时发出 `update:modelValue` / `update:open`。
- 触发 `confirm` / `cancel` / `close` 事件。
- 离场过渡结束时发出 `closed`，宿主据此移出组件；不发时由兜底定时器（1 秒 + `closeDelay`）移出。
- 若要享受 `onConfirm` 的自动 loading，需支持 `confirmBtn` prop 且其对象形态包含 `loading` 字段。
- 支持 `default`（选项名 `content`）/ `header` / `footer` 插槽（可选）。

### 1.5 类型推导约定

组件 props 类型通过构造签名推导，并用 `Partial` 放宽（命令式场景常只传部分 props）：

```typescript
type ComponentProps<T> = T extends new (...args: any[]) => { $props: infer P }
  ? Partial<P>
  : Record<string, any>;
```

### 1.6 实现内规

- 每个实例的 `props` / `isOpen` / `mounted` / `confirming` 都是 `shallowRef`，渲染单元 `RebornOverlayItem` 只读它们；`patch` 改数据，不重挂载。
- `isOpen` 表示逻辑开关，`mounted` 表示是否仍在宿主里渲染：关闭只翻 `isOpen` 并解析 Promise，离场结束（`closed` 或兜底定时器）才翻 `mounted`。
- 已打开时再次 `open()` 先以 `undefined` 解析旧 Promise，再更新 props。
- `create()` 在服务端返回空实例（不登记）；在组件 / effectScope 内创建时 `onScopeDispose(() => unmount(id))`，`persistent` 跳过。
- 关闭时基础 props 还原为 `initialProps`，渲染用 props 保持到离场结束，离场动画期间内容不跳变。

## 2. RebornOverlay 全局滚动锁

`app/components/reborn/ui/reborn-overlay/RebornOverlay.vue` 演示了多实例共享资源的标准模式：

### 2.1 模块级共享状态

在 `<script setup>` 之外增加一个普通 `<script lang="ts">` 块，存放跨实例共享的状态：

```vue
<script lang="ts">
import { ref } from "vue";
import type { Ref } from "vue";
import { useScrollLock } from "@vueuse/core";

// 全局状态管理：确保多个 RebornOverlay 实例共享同一个锁状态和计数器
const globalLockCount = ref(0);
let isBodyLocked: Ref<boolean> | null = null;
let isHtmlLocked: Ref<boolean> | null = null;
</script>
```

### 2.2 引用计数锁规则

- 使用 `@vueuse/core` 的 `useScrollLock`，同时锁 `document.body` 与 `document.documentElement`（部分浏览器滚动容器不同），禁止手写 `overflow: hidden` + `paddingRight` 补偿。
- **acquire**：实例首次加锁时置位 `isCurrentlyLockedByMe` 并使计数器 `+1`；计数器 > 0 时开锁。
- **release**：仅持有锁的实例可释放，计数器 `-1`；归零时才真正解锁。
- **延迟释放**：关闭时按 `props.duration`（遮罩过渡时长）延迟释放，避免退场动画期间页面提前恢复滚动。
- **兜底释放**：`onUnmounted` 中清理定时器并强制 `releaseLock()`，防止实例在锁定期间被销毁导致锁泄漏。

### 2.3 层级约定

- `RebornOverlay` 默认 `zIndex: 100`，通过 prop 可覆盖；`absolute` prop 控制 `absolute` / `fixed` 定位切换。
- 显隐动画统一走 `RebornTransition`（`name="fade"`），关闭回调触发 `update:modelValue(false)` 与 `close` 事件。
