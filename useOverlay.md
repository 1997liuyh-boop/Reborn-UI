# useOverlay Composable 使用指南

## 简介

`useOverlay` 是一个用于全局管理 `reborn-dialog` 和 `reborn-popup` 组件及其二次封装组件的 composable。它提供了统一的 API 来创建、打开、关闭和管理多个弹窗实例。

## API

### create()

创建一个 overlay 实例。

```typescript
create<T extends Component>(
  component: T,
  options?: OverlayOptions<T>
): OverlayInstance<T>
```

#### 参数

- `component`: 要渲染的弹窗组件
- `options`: 配置选项
  - `defaultOpen`: 创建后立即打开，默认 `false`
  - `props`: 传递给组件的初始 props
  - `destroyOnClose`: 关闭时销毁实例，默认 `false`

#### 返回值

返回一个 `OverlayInstance` 对象，包含以下方法：
- `open(props?)`: 打开弹窗，返回 Promise
- `close(value?)`: 关闭弹窗
- `patch(props)`: 更新弹窗 props
- `id`: overlay 的唯一标识符

### open()

通过 ID 打开指定的 overlay。

```typescript
open<T extends Component>(
  id: symbol,
  props?: ComponentProps<T>
): Promise<any>
```

### close()

通过 ID 关闭指定的 overlay。

```typescript
close(id: symbol, value?: any): void
```

### closeAll()

关闭所有打开的 overlay。

```typescript
closeAll(): void
```

### patch()

更新指定 overlay 的 props。

```typescript
patch<T extends Component>(
  id: symbol,
  props: Partial<ComponentProps<T>>
): void
```

### unmount()

卸载指定 overlay 并从 DOM 中移除。

```typescript
unmount(id: symbol): void
```

### isOpen()

检查指定 overlay 是否打开。

```typescript
isOpen(id: symbol): boolean
```

### overlays

所有 overlay 的响应式列表。

```typescript
overlays: Map<symbol, OverlayState>
```

## 使用示例

### 基础用法 - Dialog

```vue
<script setup lang="ts">
import { useOverlay } from '~/composables/useOverlay';
import RebornDialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue';

const overlay = useOverlay();

// 创建 dialog 实例
const dialog = overlay.create(RebornDialog, {
  props: {
    title: '确认操作',
    description: '您确定要执行此操作吗？',
  },
});

// 打开 dialog
async function openDialog() {
  const result = await dialog.open({
    title: '自定义标题',
  });
  console.log('Dialog 关闭，返回值:', result);
}

// 关闭 dialog
function closeDialog() {
  dialog.close('用户取消了操作');
}
</script>

<template>
  <button @click="openDialog">打开 Dialog</button>
  <button @click="closeDialog">关闭 Dialog</button>
</template>
```

### 基础用法 - Popup

```vue
<script setup lang="ts">
import { useOverlay } from '~/composables/useOverlay';
import RebornPopup from '~/components/reborn/ui/reborn-popup/RebornPopup.vue';

const overlay = useOverlay();

// 创建 popup 实例
const popup = overlay.create(RebornPopup, {
  props: {
    position: 'bottom',
    round: true,
    title: '底部弹出',
  },
});

// 打开 popup
function openPopup() {
  popup.open();
}

// 关闭 popup
function closePopup() {
  popup.close();
}
</script>

<template>
  <button @click="openPopup">打开 Popup</button>
  <button @click="closePopup">关闭 Popup</button>
</template>
```

### 二次封装组件

```vue
<!-- MyConfirmDialog.vue -->
<script setup lang="ts">
import RebornDialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue';

const modelValue = defineModel<boolean>({ default: false });
const emit = defineEmits<{
  close: [value: boolean];
}>();

const props = defineProps<{
  title?: string;
  message?: string;
}>();

function handleConfirm() {
  emit('close', true);
  modelValue.value = false;
}

function handleCancel() {
  emit('close', false);
  modelValue.value = false;
}
</script>

<template>
  <RebornDialog
    v-model="modelValue"
    :title="title"
    :confirm-btn="'确认'"
    :cancel-btn="'取消'"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #content>
      <p>{{ message }}</p>
    </template>
  </RebornDialog>
</template>
```

```vue
<!-- 使用二次封装组件 -->
<script setup lang="ts">
import { useOverlay } from '~/composables/useOverlay';
import MyConfirmDialog from './MyConfirmDialog.vue';

const overlay = useOverlay();

const confirmDialog = overlay.create(MyConfirmDialog, {
  destroyOnClose: true,
});

async function showConfirm() {
  const result = await confirmDialog.open({
    title: '删除确认',
    message: '您确定要删除这条记录吗？此操作不可撤销。',
  });

  if (result) {
    console.log('用户确认删除');
    // 执行删除操作
  } else {
    console.log('用户取消删除');
  }
}
</script>

<template>
  <button @click="showConfirm">删除</button>
</template>
```

### 动态更新 Props

```vue
<script setup lang="ts">
import { useOverlay } from '~/composables/useOverlay';
import RebornDialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue';

const overlay = useOverlay();

const dialog = overlay.create(RebornDialog, {
  props: {
    title: '初始标题',
    description: '初始描述',
  },
});

function openDialog() {
  dialog.open();
}

function updateTitle() {
  dialog.patch({
    title: '更新后的标题',
    description: '更新后的描述',
  });
}
</script>

<template>
  <button @click="openDialog">打开 Dialog</button>
  <button @click="updateTitle">更新标题</button>
</template>
```

### 管理多个弹窗

```vue
<script setup lang="ts">
import { useOverlay } from '~/composables/useOverlay';
import RebornDialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue';
import RebornPopup from '~/components/reborn/ui/reborn-popup/RebornPopup.vue';

const overlay = useOverlay();

// 创建多个弹窗实例
const dialog = overlay.create(RebornDialog);
const popup = overlay.create(RebornPopup, {
  props: { position: 'bottom' },
});

function openAll() {
  dialog.open({ title: 'Dialog' });
  popup.open({ title: 'Popup' });
}

function closeAll() {
  overlay.closeAll();
}

function checkStatus() {
  console.log('Dialog 是否打开:', overlay.isOpen(dialog.id));
  console.log('Popup 是否打开:', overlay.isOpen(popup.id));
}
</script>

<template>
  <button @click="openAll">打开所有弹窗</button>
  <button @click="closeAll">关闭所有弹窗</button>
  <button @click="checkStatus">检查状态</button>
</template>
```

### 自动销毁

```vue
<script setup lang="ts">
import { useOverlay } from '~/composables/useOverlay';
import RebornDialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue';

const overlay = useOverlay();

// 创建时设置 destroyOnClose
const dialog = overlay.create(RebornDialog, {
  destroyOnClose: true, // 关闭时自动销毁
});

async function showOnce() {
  const result = await dialog.open({
    title: '一次性弹窗',
  });
  // 关闭后，实例会被自动销毁
}
</script>

<template>
  <button @click="showOnce">显示一次性弹窗</button>
</template>
```

## 注意事项

1. **组件要求**: 被管理的组件必须支持 `v-model` 或 `modelValue` prop 来控制显示状态
2. **事件处理**: 组件应该通过 `close` 或 `update:modelValue` 事件来通知关闭
3. **生命周期**: 使用 `destroyOnClose` 可以在关闭时自动清理资源
4. **Promise 支持**: `open()` 方法返回 Promise，可以等待用户操作结果
5. **全局管理**: 所有创建的 overlay 都会被追踪，可以通过 `overlays` 属性访问

## 类型定义

```typescript
// Overlay 配置选项
export interface OverlayOptions<T extends Component> {
  defaultOpen?: boolean;
  props?: ComponentProps<T>;
  destroyOnClose?: boolean;
}

// Overlay 实例
export interface OverlayInstance<T extends Component = Component> {
  open: (props?: ComponentProps<T>) => Promise<any>;
  close: (value?: any) => void;
  patch: (props: Partial<ComponentProps<T>>) => void;
  id: symbol;
}
```
