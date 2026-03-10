# 组件实现规范 (Web)

## 1. 语法与注释

- **注释规范**: **严禁使用英文注释**。组件逻辑、Prop 说明、事件触发等所有注释必须使用中文。
- **Props 定义**: 必须先定义 `Props` 接口或类型，然后使用 `withDefaults` 结合 `defineProps<Props>()`。
- **双向绑定**: 优先使用 `defineModel` 语法糖处理 `v-model`。
- **跨端一致性**: 在实现前必须**检索 UniApp 端是否有相同组件**。参数命名、Emit 方法名称以及插槽名称必须尽量保持一致。

## 2. 核心语法要求

- 使用 Nuxt 3 的 `<script setup>` 模式。
- 基于 `computed` 和 `tv` 对象生成局部样式变量。
- 使用 `Icon` 组件处理所有图标逻辑。

## 3. 代码示例

```vue
<script setup lang="ts">
/**
 * 注释示例：所有注释必须使用中文
 */
import { computed } from 'vue'
import theme, { type [Name]Color, [name]Colors } from './reborn-[name].config'
import { tv } from '~/lib/tv'

const b = tv(theme)

// 1. 先定义接口
export interface [Name]Props {
    label?: string
    color?: [Name]Color
    class?: any
    ui?: any
}

// 2. 使用 withDefaults
const props = withDefaults(defineProps<[Name]Props>(), {
    color: 'primary',
})

// 3. 模型定义 (v-model)
const modelValue = defineModel<any>()

const ui = computed(() => b({
    color: props.color,
}))

// 4. 定义事件 (保持与 UniApp 端一致)
const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
    <div :class="ui.base({ class: props.class })">
        <slot :ui="ui" />
    </div>
</template>
```
