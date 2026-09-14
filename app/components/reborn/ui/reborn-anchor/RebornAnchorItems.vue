<script setup lang="ts">
import type { AnchorContext, AnchorItem } from "./reborn-anchor.config";
import { computed, inject } from "vue";
import { ANCHOR_INJECTION_KEY } from "./reborn-anchor.config";
// RebornAnchorLink 与本组件由 Nuxt 全局自动注册（nuxt.config 的 pathPrefix: false），这里刻意不写静态 import：
// 本组件既渲染 RebornAnchorLink、又在子级里渲染自己，静态导入会形成 ESM 循环依赖。

defineOptions({
  name: "RebornAnchorItems",
});

const props = defineProps<RebornAnchorItemsProps>();

/**
 * 这是库内部使用的递归渲染组件，把 items 配置式数据展开成对应的锚点子组件。
 * 使用方只接触 RebornAnchor 的 items 属性，不需要直接引用它。
 */
export interface RebornAnchorItemsProps {
  /** 当前层级要渲染的锚点数据 */
  items: AnchorItem[];
}

const ctx = inject<AnchorContext | null>(ANCHOR_INJECTION_KEY, null);
if (!ctx) throw new Error("[RebornAnchorItems] 必须作为 RebornAnchor 的子组件使用");

/** 横向锚点不渲染子级：嵌套层会把标记的横向测量基准打乱，这一点与 Ant Design 的约定一致 */
const allowChildren = computed(() => ctx.direction.value === "vertical");

/** key 允许缺省，依次回退到 href 与下标，保证列表渲染的键始终稳定 */
function nodeKey(item: AnchorItem, index: number) {
  return item.key ?? item.href ?? `__reborn_anchor_item_${index}__`;
}
</script>

<template>
  <RebornAnchorLink
    v-for="(item, index) in props.items" :key="nodeKey(item, index)" :href="item.href" :title="item.title"
    :target="item.target" :replace="item.replace" :offset="item.offset"
  >
    <template v-if="allowChildren && item.children?.length" #sub-link>
      <RebornAnchorItems :items="item.children" />
    </template>
  </RebornAnchorLink>
</template>
