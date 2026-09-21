<script setup lang="ts">
import type { TabKey, TabPaneMeta, TabsContext } from "./reborn-tabs.config";
import {
  computed,
  getCurrentInstance,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowReactive,
  shallowRef,
  useSlots,
  watchEffect,
} from "vue";
import { TABS_INJECTION_KEY } from "./reborn-tabs.config";

defineOptions({
  name: "RebornTabPane",
});

const props = withDefaults(defineProps<RebornTabPaneProps>(), {
  disabled: false,
  closable: true,
  destroyOnHidden: false,
});

export interface RebornTabPaneProps {
  /** 标题文本，需要富文本时改用 title 插槽 */
  title?: string;
  /** 是否禁用，禁用后点击与悬停都不会切换 */
  disabled?: boolean;
  /** 是否允许关闭此选项卡，仅在可编辑模式生效 */
  closable?: boolean;
  /** 是否在不显示此标签时销毁 DOM 结构，与父级同名参数取或 */
  destroyOnHidden?: boolean;
}

const slots = useSlots();
const ctx = inject<TabsContext | null>(TABS_INJECTION_KEY, null);
if (!ctx) throw new Error("[RebornTabPane] 必须作为 RebornTabs 的子组件使用");

const instance = getCurrentInstance();
const el = shallowRef<HTMLElement>();

/** 登记到父级的元信息，父级据此渲染头部；未写 key 时留空由父级补序号 */
const meta = shallowReactive<TabPaneMeta>({
  key: (instance?.vnode.key ?? undefined) as TabKey,
  title: props.title,
  disabled: props.disabled,
  closable: props.closable,
  destroyOnHidden: props.destroyOnHidden,
  // 包一层始终调用当前插槽，避免父级重渲染后头部仍渲染旧的插槽函数
  titleSlot: slots.title ? () => slots.title?.() : undefined,
});

watchEffect(() => {
  meta.title = props.title;
  meta.disabled = props.disabled;
  meta.closable = props.closable;
  meta.destroyOnHidden = props.destroyOnHidden;
});

ctx.addPane(meta);

const isActive = computed(() => ctx.activeKey.value === meta.key);
const destroyOnHidden = computed(() => props.destroyOnHidden || ctx.destroyOnHidden.value);
const paneClass = computed(() => ctx.paneClass.value);

/** 记录是否被展示过，lazy-load 据此决定首次挂载时机 */
const shown = ref(false);
watchEffect(() => {
  if (isActive.value) shown.value = true;
});

const shouldRender = computed(() => {
  if (destroyOnHidden.value) return isActive.value;
  if (ctx.lazyLoad.value) return shown.value;
  return true;
});

/**
 * 内容过渡。离场面板绝对定位后与入场面板重叠，切换时内容高度不会先塌陷再撑开（高度改由 stage 那层过渡）。
 * 透明度之外再叠 scale、translate 与模糊，新旧内容就有一段互相渗透的观感，而不是硬生生换一张图。
 * 过渡属性表写 scale,translate 而不是 transform：本仓库是 Tailwind v4，scale-* 与 translate-*
 * 编译成独立的 scale / translate 属性，写 transform 一个都过渡不到。
 * 模糊的终态写 blur-[0px] 而不是 blur-none：后者产出空的 --tw-blur，合成出来的 filter 取不到合法值，
 * 浏览器会跳变而不是插值
 */
const transitionProps = computed(() =>
  ctx.animation.value
    ? {
        enterActiveClass:
          "transition-[opacity,scale,translate,filter] duration-[260ms] ease-out motion-reduce:transition-none",
        enterFromClass: "opacity-0 scale-[0.98] translate-y-1 blur-[3px]",
        enterToClass: "opacity-100 scale-100 translate-y-0 blur-[0px]",
        leaveActiveClass:
          "absolute inset-0 transition-[opacity,scale,translate,filter] duration-200 ease-in motion-reduce:transition-none",
        leaveFromClass: "opacity-100 scale-100 translate-y-0 blur-[0px]",
        leaveToClass: "opacity-0 scale-[1.01] -translate-y-1 blur-[3px]",
      }
    : { css: false },
);

onMounted(() => {
  meta.el = el.value;
  // setup 顺序在标签被插入到中间时会失真，挂载后由父级按 DOM 先后重排
  ctx.sortPanes();
});

onBeforeUnmount(() => {
  ctx.removePane(meta);
});
</script>

<template>
  <Transition v-bind="transitionProps">
    <div v-show="isActive" ref="el" role="tabpanel" :class="paneClass">
      <slot v-if="shouldRender" />
    </div>
  </Transition>
</template>
