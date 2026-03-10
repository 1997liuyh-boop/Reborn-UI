# 组件实现规范 (UniApp)

## 1. 语法与注释

- **注释规范**: **严禁使用英文注释**。组件逻辑、Prop 说明、事件触发等所有注释必须使用中文。
- **Props 定义**: 必须先定义 `Props` 接口或类型，然后使用 `withDefaults` 结合 `defineProps<Props>()`。
- **双向绑定**: 优先使用 `defineModel` 语法糖处理 `v-model`。
- **跨端一致性**: 在实现前必须**检索 Web 端是否有相同组件**。参数命名、Emit 方法名称（如 `change`, `click`, `close`）以及插槽名称必须尽量保持一致。

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
