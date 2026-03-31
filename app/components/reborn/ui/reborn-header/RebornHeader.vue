<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from '#imports';
import { tv } from 'tailwind-variants';
import { createReusableTemplate } from '@vueuse/core';
import RebornDrawer from '../reborn-drawer/RebornDrawer.vue';
import theme from './reborn-header.config';
import { cn } from '~/lib/utils';

const b = tv(theme);

defineOptions({ inheritAttrs: false });

export type HeaderMode = 'modal' | 'slideover' | 'drawer';

export interface RebornHeaderProps {
    /** Header title text */
    title?: string;
    /** Link URL for the title */
    to?: string;
    /** Mobile menu toggle side */
    toggleSide?: 'left' | 'right';
    /** Mobile menu mode */
    mode?: HeaderMode;
    /** Custom wrapper tag */
    as?: string;
    /** Whether the header is sticky */
    sticky?: boolean;
    /** Automatically close when route changes */
    autoClose?: boolean;
    /** Custom class for the root element */
    class?: any;
    /** UI slots overrides */
    ui?: Partial<{
        root: string;
        container: string;
        left: string;
        title: string;
        center: string;
        right: string;
        toggle: string;
        drawer: string;
        drawerHeader: string;
        drawerBody: string;
        drawerFooter: string;
    }>;
}

const props = withDefaults(defineProps<RebornHeaderProps>(), {
    title: 'Nuxt UI',
    to: '/',
    toggleSide: 'right',
    mode: 'drawer',
    as: 'header',
    sticky: false,
    autoClose: true,
    ui: () => ({}),
});

const isMenuOpen = defineModel<boolean>('open', { default: false });
const route = useRoute();

const [DefineLeftTemplate, ReuseLeftTemplate] = createReusableTemplate();
const [DefineRightTemplate, ReuseRightTemplate] = createReusableTemplate();
const [DefineToggleTemplate, ReuseToggleTemplate] = createReusableTemplate();

// Auto close menu on route change
watch(() => route.fullPath, () => {
    if (props.autoClose) {
        isMenuOpen.value = false;
    }
});

const ui = computed(() => {
    const styles = b({
        sticky: props.sticky,
    });
    const overrides = props.ui || {};

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.class, overrides.root) }),
        container: (opts?: { class?: any }) => styles.container({ class: cn(opts?.class, overrides.container) }),
        left: (opts?: { class?: any }) => styles.left({ class: cn(opts?.class, overrides.left) }),
        title: (opts?: { class?: any }) => styles.title({ class: cn(opts?.class, overrides.title) }),
        center: (opts?: { class?: any }) => styles.center({ class: cn(opts?.class, overrides.center) }),
        right: (opts?: { class?: any }) => styles.right({ class: cn(opts?.class, overrides.right) }),
        toggle: (opts?: { class?: any }) => styles.toggle({ class: cn(opts?.class, overrides.toggle) }),
        drawer: (opts?: { class?: any }) => styles.drawer({ class: cn(opts?.class, overrides.drawer) }),
        drawerHeader: (opts?: { class?: any }) => styles.drawerHeader({ class: cn(opts?.class, overrides.drawerHeader) }),
        drawerBody: (opts?: { class?: any }) => styles.drawerBody({ class: cn(opts?.class, overrides.drawerBody) }),
        drawerFooter: (opts?: { class?: any }) => styles.drawerFooter({ class: cn(opts?.class, overrides.drawerFooter) }),
    };
});

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}
</script>

<template>
    <!-- Toggle Button Template -->
    <DefineToggleTemplate>
        <slot name="toggle" :open="isMenuOpen" :toggle="toggleMenu">
            <div :class="ui.toggle()" @click="toggleMenu">
                <Icon :name="isMenuOpen ? 'lucide:x' : 'lucide:menu'" class="size-6" />
            </div>
        </slot>
    </DefineToggleTemplate>

    <!-- Left Section Template -->
    <DefineLeftTemplate>
        <div v-if="$slots.left || $slots.title || title || toggleSide === 'left'" :class="ui.left()">
            <ReuseToggleTemplate v-if="toggleSide === 'left'" />

            <slot name="left">
                <NuxtLink v-if="to && (title || $slots.title)" :to="to" :class="ui.title()" @click="isMenuOpen = false">
                    <slot name="title">
                        {{ title }}
                    </slot>
                </NuxtLink>
            </slot>
        </div>
    </DefineLeftTemplate>

    <!-- Right Section Template -->
    <DefineRightTemplate>
        <div v-if="$slots.right || toggleSide === 'right'" :class="ui.right()">
            <slot name="right" />

            <ReuseToggleTemplate v-if="toggleSide === 'right'" />
        </div>
    </DefineRightTemplate>

    <!-- Header Root -->
    <component :is="as" v-bind="$attrs" :class="ui.root()">
        <slot name="top" />

        <div :class="ui.container()">
            <ReuseLeftTemplate />

            <div v-if="$slots.default" :class="ui.center()">
                <slot />
            </div>

            <ReuseRightTemplate />
        </div>

        <slot name="bottom" />
    </component>

    <!-- Mobile Menu Drawer (supports modal/slideover mapping to Drawer for now) -->
    <RebornDrawer v-model="isMenuOpen" :placement="toggleSide" size="100%" :ui="{
        root: 'z-[980]', // Just below the sticky header (which is usually z-1000 in Header.vue)
    }">
        <div :class="ui.drawer()">
            <!-- Drawer Header (Always visible unless content slot overrides everything) -->
            <slot name="drawer-header" :close="() => isMenuOpen = false">
                <div :class="ui.drawerHeader()">
                    <div class="flex items-center gap-4">
                        <NuxtLink v-if="to && (title || $slots.title)" :to="to" :class="ui.title()"
                            @click="isMenuOpen = false">
                            <slot name="title">
                                {{ title }}
                            </slot>
                        </NuxtLink>
                    </div>

                    <ReuseToggleTemplate />
                </div>
            </slot>

            <div v-if="$slots.body || $slots.default || $slots.content" :class="ui.drawerBody()">
                <slot name="content" :close="() => isMenuOpen = false">
                    <slot name="body" />
                    <slot v-if="!$slots.body" />
                </slot>
            </div>

            <div v-if="$slots.footer" :class="ui.drawerFooter()">
                <slot name="footer" />
            </div>
        </div>
    </RebornDrawer>
</template>
