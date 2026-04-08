<script setup lang="ts">
import { computed } from 'vue'
import { tv } from 'tailwind-variants'
import { cn } from '~/lib/utils'
import theme from './reborn-main.config'

export interface MainProps {
    /** UI 样式调整 */
    ui?: Partial<{
        base: any
    }>
    /** 自定义类名 */
    class?: any
}

const props = defineProps<MainProps>()

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b()

    return {
        base: (opts?: { class?: any }) => styles.base({
            class: cn(
                opts?.class,
                uiOverrides.value.base
            )
        }),
    }
})
</script>

<template>
    <main :class="ui.base({ class: props.class })">
        <slot />
    </main>
</template>
