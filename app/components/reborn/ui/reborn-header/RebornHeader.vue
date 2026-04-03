<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from '#imports';
import { tv } from 'tailwind-variants';
import { createReusableTemplate } from '@vueuse/core';
import RebornPopup from '../reborn-popup/RebornPopup.vue';
import theme from './reborn-header.config';
import { cn } from '~/lib/utils';

const b = tv(theme);

defineOptions({ inheritAttrs: false });

export type HeaderMode = 'modal' | 'slideover' | 'popup';

export interface RebornHeaderProps {
    /** 导航栏标题文本 */
    title?: string;
    /** 标题链接地址 */
    to?: string;
    /** 移动端菜单切换按钮侧边 (左/右) */
    toggleSide?: 'left' | 'right';
    /** 移动端菜单模式 */
    mode?: HeaderMode;
    /** 自定义包装标签 */
    as?: string;
    /** 是否吸顶显示 */
    sticky?: boolean;
    /** 路由改变时是否自动关闭菜单 */
    autoClose?: boolean;
    /** 根元素的自定义类名 */
    class?: any;
    /** UI 插槽样式覆盖 */
    ui?: Partial<{
        root: string;
        container: string;
        left: string;
        title: string;
        center: string;
        right: string;
        toggle: string;
        popup: string;
        popupHeader: string;
        popupBody: string;
        popupFooter: string;
    }>;
}

const props = withDefaults(defineProps<RebornHeaderProps>(), {
    title: 'Nuxt UI',
    to: '/',
    toggleSide: 'right',
    mode: 'popup',
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

// 监听路由变化，自动关闭移动端菜单
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
        popupHeader: (opts?: { class?: any }) => styles.popupHeader({ class: cn(opts?.class, overrides.popupHeader) }),
        popupBody: (opts?: { class?: any }) => styles.popupBody({ class: cn(opts?.class, overrides.popupBody) }),
        popupFooter: (opts?: { class?: any }) => styles.popupFooter({ class: cn(opts?.class, overrides.popupFooter) }),
    };
});

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}
</script>

<template>
    <!-- 切换按钮模板 (复用) -->
    <DefineToggleTemplate>
        <slot name="toggle" :open="isMenuOpen" :toggle="toggleMenu">
            <div :class="ui.toggle()" @click="toggleMenu">
                <Icon :name="isMenuOpen ? 'lucide:x' : 'lucide:menu'" class="size-6" />
            </div>
        </slot>
    </DefineToggleTemplate>

    <!-- 左侧区域模板 (复用) -->
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

    <!-- 右侧区域模板 (复用) -->
    <DefineRightTemplate>
        <div v-if="$slots.right || toggleSide === 'right'" :class="ui.right()">
            <div class="hidden md:flex">
                <slot name="right" />
            </div>

            <ReuseToggleTemplate v-if="toggleSide === 'right'" />
        </div>
    </DefineRightTemplate>

    <!-- 导航栏根容器 -->
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

    <!-- 移动端菜单弹窗 (支持从 Drawer 映射为 Popup) -->
    <RebornPopup v-model="isMenuOpen" :position="toggleSide" size="100%" :round="false" :ui="{
        root: 'z-[980]', // 位于吸顶导航栏下方 (Header 通常 z-1000)
    }">
        <!-- 弹窗头部 (除非被插槽覆盖，否则始终可见) -->
        <template #header>
            <slot name="header" :close="() => isMenuOpen = false">
                <div :class="ui.popupHeader()">
                    <NuxtLink v-if="to && (title || $slots.title)" :to="to" :class="ui.title()"
                        @click="isMenuOpen = false">
                        {{ title }}
                    </NuxtLink>
                </div>
            </slot>
        </template>

        <div v-if="$slots.body || $slots.default || $slots.content" :class="ui.popupBody()">
            <slot name="content" :close="() => isMenuOpen = false">
                <slot name="body" />
                <slot v-if="!$slots.body" />
            </slot>
        </div>

        <div v-if="$slots.footer" :class="ui.popupFooter()">
            <slot name="footer" />
        </div>
    </RebornPopup>
</template>
