# 组件实现规范 (Web)

## 1. 语法与注释

- **注释规范**: **严禁使用英文注释**。组件逻辑、Prop 说明、事件触发等所有注释必须使用中文。
- **根因注释**: 修复动画抖动、布局竞态等疑难问题时，注释必须写明「根因 → 方案」，可用 `⚠️ 根因` / `✅ 修复` 标记（参考 `RebornSticky.vue`、`RebornCarousel.vue` 中的写法）。只写"做了什么"不写"为什么"的注释视为不合格。
- **Props 定义**: 必须先定义 `Props` 接口或类型，然后使用 `withDefaults` 结合 `defineProps<Props>()`。
- **双向绑定**: 优先使用 `defineModel` 语法糖处理 `v-model`，需要时携带选项：`defineModel("modelValue", { type: Boolean, default: false })`。
- **事件定义**: `defineEmits` 必须使用类型化写法（调用签名形式），禁止字符串数组形式。
- **类型收口**: `customClass` 与 `ui` 覆盖项使用 `tailwind-variants` 导出的 `ClassValue` 类型，禁止 `any`；定时器句柄使用 `ReturnType<typeof setTimeout>`。
- **跨端一致性**: 在实现前必须**检索 UniApp 端是否有相同组件**。参数命名、Emit 方法名称以及插槽名称必须尽量保持一致。

## 2. 核心语法要求

- 使用 Nuxt 3 的 `<script setup>` 模式。
- 基于 `computed` 和 `tv` 对象生成局部样式变量；组件状态（open/active/disabled/animating）作为布尔变体传入 `b({...})`。
- 使用 `Icon` 组件处理所有图标逻辑。
- 需要**模块级共享状态**（同组件多实例共享）时，在 `<script setup>` 之外增加一个普通 `<script lang="ts">` 块存放（参考 `RebornOverlay.vue` 的全局滚动锁计数器）。
- `defineExpose` 暴露对外方法与状态；只读状态用 `computed` 包裹后暴露（参考 `RebornSticky.vue` 暴露的 `height`、`isSticky`）。

## 3. 代码示例

```vue
<script lang="ts">
// 模块级共享状态（多实例共享，可选）
import type { ClassValue } from 'tailwind-variants'
</script>
<script setup lang="ts">
/**
 * 注释示例：所有注释必须使用中文
 */
import { computed, ref, onBeforeUnmount } from 'vue'
import { cn } from '@/lib/utils'
import { tv } from '@/lib/tv'
import theme from './reborn-[name].config'

// 1. 先定义接口（ClassValue 收口，禁止 any）
export interface Reborn[Name]Props {
    disabled?: boolean
    customClass?: ClassValue
    ui?: {
        root?: ClassValue
        content?: ClassValue
    }
}

// 2. 使用 withDefaults
const props = withDefaults(defineProps<Reborn[Name]Props>(), {
    disabled: false,
    customClass: '',
    ui: () => ({})
})

// 3. 模型定义 (v-model，可携带类型与默认值)
const open = defineModel("modelValue", { type: Boolean, default: false })

// 4. 类型化事件定义 (保持与 UniApp 端一致)
const emit = defineEmits<{
    (e: 'toggle', value: boolean): void
}>()

const b = tv(theme)
// 状态作为布尔变体传入，样式全部收口在 config
const ui = computed(() => b({ open: open.value }))
const overrides = computed(() => props.ui || {})

// 5. 定时器：ReturnType 类型 + 卸载前清理
let timer: ReturnType<typeof setTimeout> | null = null
onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
})

defineExpose({ /* 对外方法与 computed 状态 */ })
</script>

<template>
    <div :class="ui.root({ class: cn(props.customClass, overrides?.root) })">
        <slot :open="open" />
    </div>
</template>
```

## 4. DOM 测量与响应式协作

复杂布局组件（Sticky、Tooltip、Fab、Carousel）沉淀出以下强制模式：

1. **先读响应式值注册依赖，再以同帧 DOM 测量优先**。在 `computed` / `watchEffect` 中，若响应式边界值（如 `useElementBounding` 的返回值）只作为 `??` / `||` 的兜底，DOM 读取成功时会被短路跳过、依赖不被注册，导致元素尺寸变化后样式不重算。正确写法（`RebornSticky.vue` 的 `getWrapperMetrics`）：

    ```typescript
    function getWrapperMetrics() {
        // 先读取响应式值注册依赖（值本身仍以同帧 DOM 测量优先）
        const reactiveTop = wrapperTop.value
        const domRect = wrapperRef.value?.getBoundingClientRect()
        return { top: domRect?.top ?? reactiveTop }
    }
    ```

2. **带 transform 动画的浮层用 `offsetWidth` / `offsetHeight` 测量**。`getBoundingClientRect()` 会受进场动画的 `scale` 影响，在 `onBeforeEnter` 期间测到缩放后的错误尺寸（`RebornTooltip.vue` 的 `ContentSize` 接口即为此设计）。

3. **高频位移直接写 DOM，结束后回写响应式**。拖拽跟手场景绕过 Vue 响应式更新链，`pointermove` 中直接写 `el.style.left/top`，`pointerup` 时读回并写入 `ref`，再清空内联样式让 `computed` 样式接管（`RebornFab.vue`）。

4. **避免监听器叠加死循环**。`useElementBounding` 内部已注册 resize/observe 监听，不要再对同一元素叠加 `useEventListener(window, 'resize')` / `useResizeObserver`，二者互相触发会形成死循环；改用原生 `addEventListener` + 单个 `ResizeObserver`，并用 rAF 防抖合并同帧回调（`RebornSticky.vue`）。

## 5. 异步竞态与状态锁

1. **代次（generation）计数器**：连续用户操作产生的过期异步回调（`nextTick` / `requestAnimationFrame` / scrollend），用自增计数器判定后直接丢弃：

    ```typescript
    let generationCounter = 0
    function startTransition() {
        const generation = ++generationCounter
        nextTick(() => {
            if (generation !== generationCounter) return // 已被新指令打断，丢弃
            // ...继续本次流程
        })
    }
    ```

    参考 `RebornCarousel.vue` 的 `loopArrowGeneration` 与 `abortLoopTransition`。

2. **统一锁判定**：多个互斥状态（跳转中、应用索引中、循环转场中）收口为单个判定函数（`RebornCarousel.vue` 的 `isNavigationLocked()`），自动播放、导航入口统一走该判定。

3. **异步流程中锁定关闭**：确认按钮 loading 期间，`update:open` / `cancel` / `close` 均需被锁定，避免中途关闭打断异步流程（`useOverlay.ts` 的 `confirming` 标记）。

4. **动画状态标记与定时解锁**：动画期间置 `isAnimating`，用略大于动画时长的定时器解锁，并在 `onBeforeUnmount` 清理（`RebornCollapse.vue` 的 300ms 动画 + `markAnimating`）。

## 6. SSR 与 Hydration 安全

- 访问 `window` / `document` 前必须以 `import.meta.client` 或 `typeof document === 'undefined'` 守卫。
- `Teleport` 在 SSR 首帧禁用，挂载后启用：`<Teleport to="body" :disabled="!isMounted">`（`RebornTooltip.vue`）。
- 依赖客户端测量的布局切换（如 fixed overlay）用 `hasMounted` 标记，SSR 与首帧 hydration 保持与服务端一致的普通流布局，`onMounted` 后再切换，避免 hydration 不匹配（`RebornSticky.vue`）。

## 7. 跨组件协作约定

- **动画标记类**: `RebornCollapse` 在动画期间给 trigger 附加 `reborn-collapse__animating` 类；`RebornSticky` 通过 `ResizeObserver` 回调与 `querySelector` 检测该类，冻结吸顶判定，防止子组件动画期间的布局变化导致 fixed/relative 反复翻转。新增会引发布局变化的动画组件时，应沿用「标记类 + 外部检测冻结」这一协作方式。
- **provide/inject 上下文**: 复合组件（如 Menu）通过 `provide('reborn-menu', {...})` 下发 `ComputedRef` 状态与回调；扩展上下文时新成员声明为可选（如 `scheduleCloseAll?: () => void`），子组件调用时使用可选链，保证新旧版本兼容（`RebornSubMenu.vue`）。
- **像素对齐**: fixed 遮盖条必须向外取整消除亚像素缝隙——左边 `Math.floor`、右边 `Math.ceil`，再由两边之差反推宽度；禁止 `Math.round`（就近取整会把边缘向内推、露出背后内容），参考 `RebornSticky.vue` 的 `snapEdges`。
