<script lang="ts">
import type { VNode } from 'vue'
import type { ClassValue } from 'clsx'

/**
 * RebornContainer 属性定义
 */
export interface ContainerProps {
    /**
     * 容器渲染的 HTML 元素或组件
     * @defaultValue 'div'
     */
    as?: any
    /**
     * 容器自定义类名
     */
    class?: any
    /**
     * 组件 UI 微调配置
     */
    ui?: Partial<{
        root: ClassValue
    }>
}

/**
 * RebornContainer 插槽定义
 */
export interface ContainerSlots {
    /**
     * 容器默认插槽内容
     */
    default?(props?: {}): VNode[]
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'
import { tv } from '~/lib/tv'
import theme from './reborn-container.config'

const props = withDefaults(defineProps<ContainerProps>(), {
    as: 'div',
})

defineSlots<ContainerSlots>()

/**
 * 基于 tailwind-variants 生成样式对象
 */
const variant = tv(theme)

const ui = computed(() => {
    const styles = variant()

    return {
        root: (opts?: { class?: any }) => styles.root({
            class: cn(opts?.class, props.ui?.root, props.class)
        })
    }
})
</script>

<template>
    <component :is="as" :class="ui.root()">
        <slot />
    </component>
</template>
