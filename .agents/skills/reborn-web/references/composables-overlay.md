# 组合式函数规范：useOverlay 与全局滚动锁 (Web)

## 1. useOverlay 命令式弹层管理

`app/composables/useOverlay.ts` 提供命令式 API，用于全局管理 `reborn-dialog`、`reborn-popup` 及其二次封装组件。核心机制：以 `Symbol` 为键的全局 `Map<symbol, OverlayState>` 存放实例状态，通过 `createApp` 动态挂载包装组件到 `document.body`。

### 1.1 API 一览

```typescript
const overlay = useOverlay()
// 返回：{ create, open, close, closeAll, patch, unmount, isOpen, overlays }

const instance = overlay.create(MyDialog, options)
// OverlayInstance：{ open, close, patch, id }

const result = await instance.open()   // Promise，解析为 'confirm' / 'cancel' / close 传入值
instance.patch({ title: '新标题' })     // 更新 props（已打开时重新挂载并保留 resolve）
instance.close('someValue')            // 手动关闭并解析 Promise
```

### 1.2 OverlayOptions

| 选项 | 类型 | 说明 |
|------|------|------|
| `defaultOpen` | `boolean` | 创建后立即打开 |
| `props` | `ComponentProps<T>` | 传递给组件的 props |
| `destroyOnClose` | `boolean` | 关闭时从全局状态中销毁 |
| `content` / `header` / `footer` | `VNode \| (() => VNode)` | 透传给目标组件的具名插槽 |
| `onConfirm` | `() => void \| Promise<void>` | 异步确认回调（见 1.3） |

### 1.3 onConfirm 异步确认模式

提供 `onConfirm` 后，确认流程自动升级为「loading + 成功关闭 / 失败重试」：

- 点击确认时，确认按钮自动注入 `loading` 态（`withLoading` 会把 `confirmBtn` 的 string / 对象 / `false` 三种形态安全规整为带 `loading` 字段的对象）。
- 回调正常返回 → 视为成功，自动关闭并使 `open()` 解析为 `'confirm'`。
- 回调抛出 → 视为失败，保持打开、恢复按钮，可重试。
- **确认进行中锁定**：`confirming` 期间 `update:open`、`cancel`、`close` 一律忽略，避免中途关闭打断异步流程；重复点击确认被防抖忽略。
- 未提供 `onConfirm` 时保持旧行为：确认仅解析 `'confirm'`，不自动关闭，由调用方决定关闭时机。

### 1.4 目标组件契约

被 `useOverlay` 托管的组件必须满足：

- 支持 `open` prop 与 `update:open` 事件（受控显隐）。
- 触发 `confirm` / `cancel` / `close` 事件。
- 若要享受 `onConfirm` 的自动 loading，需支持 `confirmBtn` prop 且其对象形态包含 `loading` 字段。
- 支持 `content` / `header` / `footer` 具名插槽（可选）。

### 1.5 类型推导约定

组件 props 类型通过构造签名推导，并用 `Partial` 放宽（命令式场景常只传部分 props）：

```typescript
type ComponentProps<T> = T extends new (...args: any[]) => { $props: infer P }
  ? Partial<P>
  : Record<string, any>;
```

### 1.6 实现内规

- 挂载逻辑收口在单个 `mountOverlay` 函数，`open` 与 `patch` 共用，消除重复渲染逻辑。
- 插槽构建用 `(['content', 'header', 'footer'] as const).forEach` 循环规整，函数形态直接使用、VNode 形态包一层 `() => val`。
- 关闭时按序执行：解析 Promise → 卸载 app → 移除容器 → 重置 props 到 `initialProps` →（`destroyOnClose` 时）删除全局状态。
- `patch` 在已打开状态下卸载并用最新 props 重新挂载，期间必须保留并恢复 `resolve`，否则挂起的 `open()` Promise 会丢失。

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
