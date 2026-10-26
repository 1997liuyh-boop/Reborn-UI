<script setup lang="ts">
import { useRoute } from '#imports';
import { createReusableTemplate } from '@vueuse/core';
import { computed, watch } from 'vue';
import { useBooleanModel } from '~/composables/useControlledModel';
import { useRawProp } from '~/composables/useRawProp';
import { tv } from '~/lib/tv';
import { cn } from '~/lib/utils';
import RebornDrawer from '../reborn-drawer/RebornDrawer.vue';
import theme from './reborn-header.config';

defineOptions({ inheritAttrs: false });

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

defineSlots<{
    /** 移动端菜单切换按钮；open 为菜单是否展开，toggle 切换菜单（经过 beforeToggle） */
    toggle?: (props: { open: boolean; toggle: () => void }) => any;
    /** 左侧区域，默认渲染标题 */
    left?: () => any;
    /** 标题内容 */
    title?: () => any;
    /** 右侧区域 */
    right?: () => any;
    /** 导航栏上方的附加内容 */
    top?: () => any;
    /** 中间导航内容，移动端菜单未提供 body 时也用它 */
    default?: () => any;
    /** 导航栏下方的附加内容 */
    bottom?: () => any;
    /** 移动端菜单头部；close 关闭菜单 */
    header?: (props: { close: () => void }) => any;
    /** 整体替换移动端菜单内容；close 关闭菜单 */
    content?: (props: { close: () => void }) => any;
    /** 移动端菜单正文 */
    body?: () => any;
    /** 移动端菜单底部 */
    footer?: () => any;
}>();

const b = tv(theme);

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
    /** 菜单展开前的拦截函数 */
    beforeToggle?: () => boolean | Promise<boolean>;
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

/** defineModel 返回的引用只随父级传值变化（本地交互不写它），下方用它监听父级改写 */
const isMenuOpenModel = defineModel<boolean>('open', { default: undefined });
const { present: openBound } = useRawProp('open');
// 显式空模型按关闭读取，缺省状态独立保留本地交互。
const isMenuOpen = useBooleanModel('open');
const route = useRoute();
let toggleRequest = 0;
// 父级改写模型后，旧的异步打开请求不再覆盖新状态。
watch([openBound, isMenuOpenModel], () => { toggleRequest++; }, { flush: 'sync' });

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
        // 移动端弹窗根节点：本组件没有对应的 tv slot，直接把用户覆盖透传给内部 RebornDrawer 的 root
        popup: (opts?: { class?: any }) => cn(opts?.class, overrides.popup),
        popupHeader: (opts?: { class?: any }) => styles.popupHeader({ class: cn(opts?.class, overrides.popupHeader) }),
        popupBody: (opts?: { class?: any }) => styles.popupBody({ class: cn(opts?.class, overrides.popupBody) }),
        popupFooter: (opts?: { class?: any }) => styles.popupFooter({ class: cn(opts?.class, overrides.popupFooter) }),
    };
});

async function toggleMenu() {
    const request = ++toggleRequest;
    if (isMenuOpen.value) {
        isMenuOpen.value = false;
        return;
    }

    if (!props.beforeToggle) {
        isMenuOpen.value = true;
        return;
    }

    try {
        const canOpen = await props.beforeToggle();

        if (canOpen === true && request === toggleRequest) {
            isMenuOpen.value = true;
        }
    } catch {
        // beforeToggle 被拒绝时阻止菜单展开
    }
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

  <!-- 移动端菜单抽屉，保留原有 ui.popup 样式入口。 -->
  <RebornDrawer
    v-model="isMenuOpen" :direction="toggleSide" size="100%" with-header :z-index="980" :ui="{
      // 位于吸顶导航栏下方 (Header 通常 z-1000)；层级通过 z-index 控制
      root: ui.popup(),
      body: 'p-0',
      footer: 'p-0',
    }"
  >
    <!-- 弹窗头部 (除非被插槽覆盖，否则始终可见) -->
    <template #header="{ close }">
      <slot name="header" :close="close">
        <div :class="ui.popupHeader()">
          <button type="button" aria-label="关闭菜单" class="flex size-5 shrink-0 items-center justify-center text-gray-9" @click="close"><Icon name="lucide:x" class="size-5" /></button>
          <NuxtLink
            v-if="to && (title || $slots.title)" :to="to" :class="ui.title()"
            @click="isMenuOpen = false"
          >
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

    <template v-if="$slots.footer" #footer>
      <div :class="ui.popupFooter()"><slot name="footer" /></div>
    </template>
  </RebornDrawer>
</template>
