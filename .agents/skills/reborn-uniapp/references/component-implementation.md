# 组件实现规范 (UniApp)

## 1. 语法与注释

- **注释规范**: **严禁使用英文注释**。组件逻辑、Prop 说明、事件触发等所有注释必须使用中文。
- **Props 定义**: 必须先定义 `Props` 接口或类型，然后使用 `withDefaults` 结合 `defineProps<Props>()`。
- **双向绑定**: 优先使用 `defineModel` 语法糖处理 `v-model`。
- **跨端一致性**: 在实现前必须**检索 Web 端是否有相同组件**（位于 `app/components/reborn/ui/reborn-[name]/`）。参数命名、Emit 方法名称（如 `change`, `click`, `close`, `toggle`）、插槽名称（含作用域参数）以及 `defineExpose` 暴露的方法/状态必须尽量保持一致。最新基线见下方「跨端 API 对齐基线」。
- **Emits 类型化**: `defineEmits` 必须使用类型化签名（`defineEmits<{ (e: 'change', value: boolean): void }>()`），禁止使用字符串数组形式。

## 2. 样式集成

- 使用 `computed` 与 `tv` 工具生成样式对象 `ui`。
- 支持 `customClass` 和 `ui` 对象 Prop 以允许外部覆盖内部 Slot 样式。

## 3. 代码示例

```vue
<script lang="ts" setup>
/**
 * 注释示例：所有注释必须使用中文
 */
import { computed } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { type [Name]UI, type [Name]Color } from './reborn-[name].config'

// 1. 先定义接口
export interface [Name]Props {
    customClass?: string
    customStyle?: string
    color?: [Name]Color
    ui?: [Name]UI
}

// 2. 使用 withDefaults
const props = withDefaults(defineProps<[Name]Props>(), {
    customClass: '',
    customStyle: '',
    color: 'neutral',
    ui: () => ({}),
})

// 3. 模型定义 (v-model)
const modelValue = defineModel<any>()

const b = tv(theme)
const ui = computed(() => {
    const styles = b({ color: props.color })
    return {
        // 自动合并基础类、外部自定义类和 UI 对象覆盖类
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
        text: (opts?: { class?: any }) => styles.text({ class: cn(opts?.class, props.ui?.text) }),
    }
})

// 4. 事件定义 (参考 Web 端命名)
const emit = defineEmits<{
    (e: 'change', value: any): void
}>()
</script>

<template>
    <view :class="ui.root()" :style="customStyle">
        <text :class="ui.text()">内容</text>
        <slot :ui="ui" />
    </view>
</template>
```

## 4. 跨端 API 对齐基线（2026.07 Web 端更新）

以下组件在 Web 端已完成优化，UniApp 端新建或迭代同名组件时，Props/Emits/Slots/Expose 必须以此为准：

### RebornCollapse
- **Props**: `disabled?: boolean`（默认 `false`）、`position?: 'bottom' | 'top'`（默认 `'bottom'`，面板相对触发区的位置）、`absolute?: boolean`（默认 `false`，浮层模式，面板绝对定位不占文档流）、`customClass`、`ui: { root, trigger, content }`。
- **v-model**: `defineModel('modelValue')` 控制展开状态。
- **Emits**: `toggle(value: boolean)` —— 点击触发区切换后抛出最新展开状态。
- **Slots**: 默认插槽作用域为 `{ open }`（当前展开状态）；`content` 插槽承载面板内容。
- **Expose**: `show()`、`hide()`、`toggle()`、`resize()`、`isAnimating`（动画中标记，供 Sticky 等联动组件读取）。

### RebornSticky
- **Props**: 在 `offsetTop`、`zIndex`、`isNeedNavbarHeight`、`navbarHeight`、`target` 基础上新增：
  - `sticky?: boolean`（默认 `true`，手动开关吸附能力）
  - `position?: 'top' | 'bottom'`（默认 `'top'`，吸顶或吸底）
  - `bottomBoundary?: 'parent' | 'target'`（默认 `'parent'`，吸底越界后的边界基准）
  - `bottomPlaceholder?: 'auto' | 'keep' | 'none'`（默认 `'auto'`，吸底固定后的占位策略：keep 保留高度、none 不参与排版）
  - `ui?: { wrapper?: string, content?: string }`
- **Emits**: `change(isSticky: boolean)`、`resize(rect: { height, width, left, top })`。
- **Slots**: 默认插槽作用域为 `{ isSticky }`。
- **Expose**: `height`、`isSticky`、`position`、`rect`、`forceUpdate()`。

### RebornText
- **Props 变更**:
  - 新增 `thousandsIcon?: string`：千分位分隔符。**默认不传即不启用千分位**（旧版强制加 `,` 的行为已废弃）。
  - `currency` 默认值由 `'¥'` 改为 `''`（默认不显示货币符号）。
  - `ui` 新增 `currency` 键：货币符号以独立 `<text>`/`<span>` 节点渲染，可单独覆盖样式。
- **行为规范**: 金额格式化必须对 `NaN` 做安全兜底（非法数值原样返回，不输出 `NaN`）；`tooltip` 未开启时不渲染 Tooltip 包裹层。

### RebornOverlay
- **Props 不变**（`modelValue`、`lockScroll`、`duration`、`zIndex`、`closeOnClickOverlay`、`absolute`、`customClass`、`customStyle`）。
- **Emits**（类型化）: `update:modelValue(value: boolean)`、`close()`、`afterLeave()`。
- **行为规范**: 滚动锁必须采用**全局计数**方案（见下方通用实现模式），关闭时按 `duration` 延迟释放，`onUnmounted` 兜底释放自身持有的锁。

### RebornTooltip
- **Props 不变**；视觉与行为规范更新：
  - 内容区内边距加大（Web 端为 `px-4 py-3`，UniApp 对应约 `px-[32rpx] py-[24rpx]`），圆角使用 `rounded-ui-sm`。
  - 深色主题使用半透明深灰（`bg-gray-9/90`）。
  - 触发器与内容层间距：有箭头时等于箭头高度（箭头正好填充间隙），无箭头时为固定间距。
  - 显隐过渡使用 `fade`（不再使用 `zoom-in` 缩放动画）。

### RebornCarousel
- **Props/Emits 不变**；行为规范更新：
  - 自动播放在 hover、focus、拖拽以及任一转场锁定期间必须暂停步进。
  - 快速连点箭头不得被静默丢弃：loop 模式下中止当前转场并立即接受新指令（代次计数器方案，见下文）。
  - 缩略图配置项读取需兼容 ref 传入（取值时 `unref`），`thumbsPosition` 变化后须重新测量主图尺寸。

### RebornBadge（config 规范）
- `label` 不再按 size 声明字号（由外层继承），仅保留行高；`closeIcon` 按 size 使用宽高类（size-4/5/6 对应 sm/md/lg）。
- `base`/`label` 附带 `max-w-full min-w-0` 溢出保护。
- warning 各变体浅底色统一为 `#FFF7F3`（见 design-tokens「特殊场景色」）。

### useOverlay（命令式浮层管理）
- **Options** 新增 `onConfirm?: () => void | Promise<void>`：
  - 提供后：点击确认时确认按钮自动进入 loading 并执行回调；回调正常返回 → 自动关闭且 `open()` 解析为 `'confirm'`；回调抛出 → 保持打开、恢复按钮可重试。
  - 未提供时保持旧行为：确认仅解析 `'confirm'`，由调用方决定关闭时机。
  - 确认进行中（confirming）锁定关闭/取消，防止异步流程被中途打断，并防重复提交。
- **实例方法**: `open(props?)`（返回 Promise）、`close(value?)`、`patch(props)`（已打开时以最新 props 重新挂载）。

## 5. 通用实现模式（UniApp 端实现建议）

以下模式源自 Web 端组件优化沉淀，UniApp 端实现同类能力时应遵循，同时保持对外 API 与 Web 端一致：

### 5.1 遮罩滚动锁：全局计数
多个遮罩实例可能同时存在，加锁/解锁必须走**模块级全局计数器**，而非各实例直接改样式：
- 实例首次加锁时计数 +1，仅当计数从 0 变正时真正锁定；释放时计数 -1，仅当归零时真正解锁。
- 关闭时按过渡时长（`duration`）延迟释放；组件卸载（`onUnmounted`）时兜底释放自身持有的锁，防止泄漏。
- H5 端直接复用 `packages/uniapp-project/src/composables/useLockScroll.ts`（已内置计数与 overscroll 处理）；小程序端可用 `page-meta` 的 `page-style` 或在遮罩上 `@touchmove.stop.prevent` 实现等效锁定。

### 5.2 竞态防护：代次（generation）计数器
凡是「用户可快速连续触发 + 存在异步回调（`nextTick` / 定时器 / 动画帧 / scrollend）」的逻辑（如轮播连点切换、快速开合动画），必须使用自增代次计数器：发起新指令时代次 +1，所有挂起回调执行前校验代次是否仍为发起时的值，不一致则直接返回，避免过期回调改写新状态。

### 5.3 Sticky 实现要点
- **占位与浮层解耦**: `bottomPlaceholder` 为 `keep`/`none` 时，占位高度必须恒定（keep=内容高度、none=0），**不得随 `isSticky` 翻转**——占位高度突变会反过来改变判定基准，形成逐帧翻转的抖动反馈环。
- **迟滞容差**: fixed/absolute 状态切换的边界判定加 ±2px 容差，避免亚像素误差导致来回抖动。
- **尺寸更新防抖**: resize/observer 触发的尺寸更新用 `requestAnimationFrame` 合并（同一帧只执行一次），且仅在尺寸确实变化时才写入并 emit `resize`。UniApp 端测量使用 `uni.createSelectorQuery().boundingClientRect()`。
- **动画冻结联动**: 探测子节点上的 `reborn-collapse__animating` 状态类，子组件展开/收起动画期间暂停吸附判定，动画结束后强制同步一次尺寸。

### 5.4 浮层定位测量
带缩放/位移入场动画的浮层（Tooltip/Popover），定位测量不得在动画进行中读取受 transform 影响的尺寸（Web 端改用 `offsetWidth`/`offsetHeight` 规避）。UniApp 端应在动画开始前完成一次测量，或使用不含 transform 的包裹层做测量基准。

### 5.5 SSR / 首帧安全
依赖端上 API 的能力（如 Web 端 `Teleport`、`window` 尺寸）必须在挂载后再启用（`isMounted` / `hasMounted` 标记），确保首帧与服务端渲染结果一致。UniApp 对应场景：`root-portal` 及系统信息读取应放在 `onMounted` 后执行。

