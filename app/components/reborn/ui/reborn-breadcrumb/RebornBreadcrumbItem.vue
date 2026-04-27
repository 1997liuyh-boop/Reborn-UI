<script setup lang="ts">
import { inject, computed } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-breadcrumb.config'

export interface RebornBreadcrumbItemProps {
    to?: string | object
    replace?: 'push' | 'replace' | 'blank'
    customClass?: any
    ui?: any
}

const props = withDefaults(defineProps<RebornBreadcrumbItemProps>(), {
    replace: 'push',
    ui: () => ({})
})

const context = inject<any>('breadcrumb', {
    separator: '/',
    ui: theme.slots
})

const b = tv(theme)
const ui = computed(() => {
    const styles = b({
        active: !!props.to
    })
    return {
        item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class, props.ui?.item) }),
        link: (opts?: { class?: any }) => styles.link({ class: cn(opts?.class, props.ui?.link, props.customClass) }),
        separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class, props.ui?.separator) }),
    }
})

</script>

<template>
    <div :class="ui.item()">
        <NuxtLink 
            v-if="props.to"
            :to="props.to"
            :replace="props.replace === 'replace'"
            :target="props.replace === 'blank' ? '_blank' : undefined"
            :class="ui.link({ class: 'reborn-breadcrumb-item__link' })"
        >
            <slot />
        </NuxtLink>
        <span v-else :class="ui.link({ class: 'reborn-breadcrumb-item__link' })">
            <slot />
        </span>
        <span :class="ui.separator()" aria-hidden="true">
            <slot name="separator">
                <template v-if="context.separatorIcon">
                    <component :is="context.separatorIcon" v-if="typeof context.separatorIcon !== 'string'" />
                    <Icon :name="context.separatorIcon" v-else />
                </template>
                <template v-else>
                    {{ context.separator }}
                </template>
            </slot>
        </span>
    </div>
</template>
