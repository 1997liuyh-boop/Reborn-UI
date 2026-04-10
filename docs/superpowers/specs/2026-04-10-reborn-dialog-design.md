# RebornDialog 设计文档

- 日期: 2026-04-10
- 目标组件: `RebornDialog`
- 平台: Web（Nuxt 3）
- 范围: 完整版首版设计

## 1. 背景与目标

当前组件库缺少标准化的对话框组件。需要补齐一个同时满足以下要求的 `RebornDialog`：

- 支持触发器模式和受控模式
- 同时支持单组件封装用法和组合式子组件用法
- 支持标题、描述、遮罩、关闭按钮、确认/取消按钮
- 支持 `beforeClose`、打开/关闭延时、遮罩关闭、ESC 关闭
- 支持 `scrollable`、`fullscreen`、`draggable`
- 支持基础焦点管理和无障碍语义

本次只设计 Web 端首版，不覆盖 UniApp 端实现。

## 2. 用户使用方式

### 2.1 单组件封装用法

```vue
<RebornDialog
  title="删除记录"
  description="删除后无法恢复，请谨慎操作。"
  :confirm-btn="{ label: '确认删除', color: 'error' }"
  cancel-btn="取消"
  :before-close="handleBeforeClose"
>
  <UButton label="打开弹窗" color="neutral" variant="subtle" />

  <template #content>
    <div>这里是弹窗内容。</div>
  </template>
</RebornDialog>
```

### 2.2 受控模式用法

```vue
<RebornDialog
  v-model:open="open"
  title="编辑资料"
  confirm-btn="保存"
  cancel-btn="取消"
  @confirm="handleSubmit"
/>
```

### 2.3 组合式用法

```vue
<RebornDialog v-model:open="open">
  <RebornDialogTrigger>
    <UButton label="打开" />
  </RebornDialogTrigger>

  <RebornDialogContent>
    <RebornDialogHeader title="标题" description="说明文字" />

    <div>这里是正文内容。</div>

    <RebornDialogFooter
      cancel-btn="取消"
      confirm-btn="确认"
      @confirm="handleConfirm"
    />
  </RebornDialogContent>
</RebornDialog>
```

## 3. 设计原则

- 以组合式内核为基础，再向上提供单组件语法糖
- 状态管理与视图渲染分层，避免触发器模式与受控模式耦合
- 所有打开/关闭来源走统一状态链路
- 默认行为应覆盖业务高频场景，但不阻塞高级自定义
- 首版保持结构可扩展，不为了“快做出来”牺牲后续演进空间

## 4. 组件结构

目录结构建议如下：

- `app/components/reborn/ui/reborn-dialog/RebornDialog.vue`
- `app/components/reborn/ui/reborn-dialog/RebornDialogTrigger.vue`
- `app/components/reborn/ui/reborn-dialog/RebornDialogContent.vue`
- `app/components/reborn/ui/reborn-dialog/RebornDialogHeader.vue`
- `app/components/reborn/ui/reborn-dialog/RebornDialogFooter.vue`
- `app/components/reborn/ui/reborn-dialog/RebornDialogClose.vue`
- `app/components/reborn/ui/reborn-dialog/reborn-dialog.config.ts`
- `app/components/reborn/ui/reborn-dialog/index.ts`
- `app/components/reborn/examples/reborn-dialog/RebornDialogDemo.vue`
- `app/components/reborn/configs/reborn-dialog/RebornDialogConfig.vue`
- `content/2.components/feedback-and-status/reborn-dialog.md`

职责划分如下：

- `RebornDialog.vue`
  - 提供上下文
  - 管理受控/非受控开关状态
  - 提供统一 `requestOpen` / `requestClose` 能力
- `RebornDialogTrigger.vue`
  - 负责打开对话框
  - 不持有业务状态
- `RebornDialogContent.vue`
  - 负责 Teleport、Overlay、Panel、动画、ESC、点击外部、焦点管理、拖拽
- `RebornDialogHeader.vue`
  - 负责标题、描述区语义输出
- `RebornDialogFooter.vue`
  - 负责默认确认/取消按钮布局与按钮事件分发
- `RebornDialogClose.vue`
  - 负责右上角关闭按钮或局部关闭行为

## 5. API 设计

### 5.1 主组件 Props

#### `open?: boolean`

- 用于受控模式
- 传入时组件不直接持有最终开关状态
- 通过 `update:open` 请求外部更新

#### `title?: string`

- 默认值: `""`
- 用于默认头部标题

#### `description?: string`

- 默认值: `""`
- 用于默认头部说明

#### `close?: boolean | RebornButtonProps`

- 默认值: `{ color: 'primary', variant: 'outline', size: 'sm' }`
- 控制右上角关闭按钮是否显示以及按钮样式
- `false` 表示不显示

#### `closeIcon?: string`

- 默认值: `"lucide:x"`
- 控制右上角关闭按钮图标

#### `overlay?: boolean`

- 默认值: `true`
- 控制是否显示遮罩层

#### `dismissible?: boolean`

- 默认值: `true`
- 控制点击遮罩和按 `Esc` 是否允许关闭
- 不影响右上角关闭按钮和取消按钮

#### `scrollable?: boolean`

- 默认值: `false`
- 开启后正文区在弹层内部滚动

#### `fullscreen?: boolean`

- 默认值: `false`
- 开启后弹窗全屏展示
- 开启时拖拽能力失效

#### `draggable?: boolean`

- 默认值: `false`
- 仅在桌面端、非全屏模式下生效
- 仅允许拖拽头部区域

#### `cancelBtn?: string | false | RebornButtonProps`

- 默认值: `"取消"`
- `false` 表示不显示
- `string` 表示按钮文案
- `object` 表示透传按钮配置，可带 `label`

#### `confirmBtn?: string | false | RebornButtonProps`

- 默认值: `"确认"`
- `false` 表示不显示
- `string` 表示按钮文案
- `object` 表示透传按钮配置，可带 `label`

#### `beforeClose?: (done: () => void, reason: DialogCloseReason) => void`

- 所有关闭动作的统一拦截钩子
- 组件进入待关闭状态后暂停
- 仅在调用 `done()` 后继续真正关闭

#### `openDelay?: number`

- 默认值: `0`
- 打开延时，单位毫秒

#### `closeDelay?: number`

- 默认值: `0`
- 关闭延时，单位毫秒

### 5.2 关闭原因类型

```ts
type DialogCloseReason =
  | "close-button"
  | "overlay"
  | "esc"
  | "cancel"
  | "programmatic"
```

该值用于：

- `beforeClose`
- `close`
- `closed`
- 内部调试与日志定位

### 5.3 Slots

#### 主组件插槽

- `default`
  - 单组件模式下的触发器内容
- `header`
  - 自定义头部
- `content`
  - 主内容区
- `footer`
  - 自定义底部区域

#### 组合式子组件

- `RebornDialogTrigger`
- `RebornDialogContent`
- `RebornDialogHeader`
- `RebornDialogFooter`
- `RebornDialogClose`

### 5.4 Emits

- `update:open`
- `open`
- `opened`
- `close`
- `closed`
- `confirm`
- `cancel`
- `open-auto-focus`
- `close-auto-focus`

约定如下：

- `open` / `close` 表示打开或关闭流程开始
- `opened` / `closed` 表示动画完成
- `confirm` / `cancel` 是业务动作事件，不等价于状态事件

## 6. 交互行为定义

### 6.1 模式判定

- 传入 `open` 或使用 `v-model:open` 时，视为受控模式
- 未传入时，视为非受控模式
- 非受控模式下组件维护内部 `innerOpen`
- 单组件模式下，若存在 `default` 插槽，则默认将其作为触发器

### 6.2 统一状态链路

所有打开/关闭动作统一走以下方法：

- `requestOpen(source)`
- `requestClose(reason)`

这样以下入口不会分裂成多套逻辑：

- Trigger 点击
- 右上角关闭
- 点击遮罩
- 按 `Esc`
- 取消按钮
- 外部程序触发

### 6.3 关闭流程

关闭链路顺序如下：

1. 校验当前动作是否允许关闭
2. 若来源为遮罩或 `Esc`，受 `dismissible` 控制
3. 若存在 `beforeClose`，暂停关闭并等待 `done()`
4. 触发 `close`
5. 等待 `closeDelay`
6. 更新开关状态
7. 动画完成后触发 `closed`

### 6.4 按钮默认行为

采用已确认的混合约定：

- `cancelBtn`
  - 点击后默认触发关闭流程
  - 同时派发 `cancel`
- `confirmBtn`
  - 点击后仅派发 `confirm`
  - 不自动关闭

该约定用于适配表单提交、异步确认、危险操作确认等业务场景。

### 6.5 拖拽行为

- 仅在 `draggable=true` 且 `fullscreen=false` 时启用
- 仅头部区域可拖拽
- 不在正文区启用拖拽，避免与表单输入、文本选择、滚动冲突
- 打开时默认居中，不记忆上次位置
- 首版不实现吸附和复杂边界系统
- 需要保证拖拽后至少头部仍可操作

### 6.6 滚动行为

- `scrollable=false` 时，按默认对话框高度自适应布局
- `scrollable=true` 时，仅正文区滚动
- Header 和 Footer 固定在弹层结构内，不跟随正文滚动

### 6.7 全屏行为

- `fullscreen=true` 时，弹窗铺满视口
- 全屏模式禁用拖拽
- Header、正文、Footer 使用全屏布局规则

## 7. 可访问性与焦点管理

首版必须满足以下最低要求：

- 打开后焦点进入 Dialog 内容容器
- 关闭后焦点回到最近一次触发器
- `Esc` 关闭受 `dismissible` 控制
- 内容容器设置 `role="dialog"` 与 `aria-modal="true"`
- 当存在标题与描述时，自动建立 `aria-labelledby` 与 `aria-describedby`

首版焦点策略：

- 优先保证“打开聚焦”和“关闭回焦”的主路径稳定
- 若仓库内已有成熟焦点管理能力，则优先复用
- 若无可复用能力，首版不手写复杂焦点陷阱算法，但需避免焦点直接落回背景主页面

## 8. 渲染与层级策略

- `RebornDialogContent` 使用 `Teleport` 渲染到 `body`
- Overlay 与 Panel 同属于 Dialog 内容层级
- 使用统一 z-index 体系，避免被页面容器裁切
- 不依赖页面布局容器定位，避免在 Tabs、Card、文档布局中出现遮挡问题

## 9. 单组件与组合式共存策略

实现顺序必须是：

1. 先完成组合式内核
2. 再由主组件提供单组件封装语法糖

原因：

- 避免出现两套状态逻辑
- 触发器模式与受控模式更容易统一
- 后续扩展 `DialogHeader`、`DialogFooter`、局部关闭按钮等能力时无需返工

单组件模式只是组合式 API 的快捷封装，不应成为另一套独立实现。

## 10. Demo 与文档范围

Demo 至少覆盖以下场景：

- 基础弹窗
- 受控模式
- 自定义 Header / Footer
- 确认不自动关闭
- `beforeClose` 异步确认关闭
- 可滚动内容
- 全屏模式
- 可拖拽模式
- 无遮罩模式
- 禁止点击外部关闭模式

文档需覆盖：

- 基础用法
- 触发器模式
- 受控模式
- 组合式用法
- Props 表
- Events 表
- Slots 表
- `beforeClose` 行为说明
- `confirmBtn` / `cancelBtn` 默认行为说明

## 11. 测试与验证范围

至少需要验证以下行为：

- 单组件模式可正常打开关闭
- 受控模式不会与内部状态冲突
- `dismissible=false` 时遮罩与 `Esc` 无法关闭
- `beforeClose` 不调用 `done()` 时不会关闭
- `cancelBtn` 默认关闭
- `confirmBtn` 默认不关闭
- `fullscreen=true` 时 `draggable` 不生效
- `scrollable=true` 时正文区能独立滚动
- 关闭后焦点返回触发器

## 12. 不纳入本次首版的内容

- 多实例堆叠管理系统
- 复杂焦点陷阱与嵌套弹窗策略
- 移动端手势拖拽优化
- 视窗吸附、边缘磁贴、位置记忆
- UniApp 端同步实现

## 13. 最终建议

`RebornDialog` 应以组合式上下文为内核实现，再向上提供单组件封装。该结构最适合当前已确认的完整版需求，并且能稳定兼容：

- 触发器模式
- 受控模式
- 默认 footer 行为
- `beforeClose`
- 可拖拽 / 全屏 / 可滚动
- 后续文档与示例扩展

这是当前阶段最稳妥、后续返工成本最低的方案。
