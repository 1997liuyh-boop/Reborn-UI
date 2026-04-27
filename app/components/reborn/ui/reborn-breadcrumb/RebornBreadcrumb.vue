<script setup lang="ts">
import { provide, computed, reactive } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-breadcrumb.config'

export interface RebornBreadcrumbProps {
    separator?: string
    separatorIcon?: any
    customClass?: any
    ui?: any
}

const props = withDefaults(defineProps<RebornBreadcrumbProps>(), {
    separator: '/',
    ui: () => ({})
})

const b = tv(theme)
const ui = computed(() => {
    const styles = b()
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
    }
})

const context = reactive({
    separator: computed(() => props.separator),
    separatorIcon: computed(() => props.separatorIcon),
    ui: theme.slots
})

provide('breadcrumb', context)
</script>

<template>
    <nav :class="ui.root()" aria-label="Breadcrumb">
        <slot />
    </nav>
</template>
