<script setup lang="ts">
import type { AnchorContext, AnchorLinkMeta } from "./reborn-anchor.config";
import { computed, inject, onBeforeUnmount, onMounted, shallowReactive, shallowRef, watchEffect } from "vue";
import { ANCHOR_INJECTION_KEY } from "./reborn-anchor.config";

defineOptions({
  name: "RebornAnchorLink",
});

const props = defineProps<RebornAnchorLinkProps>();

export interface RebornAnchorLinkProps {
  /** 链接的文本内容，写了默认插槽时以插槽为准 */
  title?: string;
  /** 链接的地址，形如 `#section-id`；留空的链接不参与滚动判定 */
  href?: string;
  /** 该属性指定在何处显示链接的资源。填了它就交给浏览器打开，组件不再接管滚动 */
  target?: string;
  /** 点击后是否把 href 同步进地址栏。为真时走 replaceState，替换当前记录而不新增历史条目 */
  replace?: boolean;
  /** 该链接单独的滚动偏移量，覆盖 RebornAnchor 的 offset */
  offset?: number;
}

const ctx = inject<AnchorContext | null>(ANCHOR_INJECTION_KEY, null);
if (!ctx) throw new Error("[RebornAnchorLink] 必须作为 RebornAnchor 的子组件使用");

const el = shallowRef<HTMLElement>();

/** 登记到父级的元信息，父级据此判定选中项、测量标记位置，并在点击时读取跳转相关配置 */
const meta = shallowReactive<AnchorLinkMeta>({ href: props.href });

watchEffect(() => {
  meta.href = props.href;
  meta.target = props.target;
  meta.replace = props.replace;
  meta.offset = props.offset;
});

ctx.addLink(meta);

const isActive = computed(() => !!props.href && ctx.activeHref.value === props.href);
const itemClass = computed(() => ctx.itemClass.value);
const titleClass = computed(() => ctx.linkTitleClass.value);
const sublistClass = computed(() => ctx.sublistClass.value);
const linkClass = computed(() => ctx.linkClass(isActive.value));

onMounted(() => {
  meta.el = el.value;
  // setup 顺序在链接被插入到中间时会失真，挂载后由父级按 DOM 先后重排
  ctx.sortLinks();
});

onBeforeUnmount(() => {
  ctx.removeLink(meta);
});
</script>

<template>
  <div :class="itemClass">
    <a
      ref="el" :href="props.href" :target="props.target" :class="linkClass" :data-anchor-active="isActive"
      :aria-current="isActive ? 'location' : undefined" @click="ctx.handleClick($event, meta)"
    >
      <span :class="titleClass">
        <slot>{{ props.title }}</slot>
      </span>
    </a>

    <!-- 子链接始终竖排，嵌套层级只影响缩进，标记仍按 a 节点的绝对位置测量 -->
    <div v-if="$slots['sub-link']" :class="sublistClass">
      <slot name="sub-link" />
    </div>
  </div>
</template>
