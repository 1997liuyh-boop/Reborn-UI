<script setup lang="ts">
import type { AnchorItem } from "./reborn-anchor.config";
import { computed, inject } from "vue";
import { ANCHOR_INJECTION_KEY } from "./reborn-anchor.config";
// 兄弟组件一律显式导入：经 CLI 复制到使用方项目后，不能指望对方的自动导入按同样的名字解析（如 Nuxt 的 pathPrefix）
// 本组件在子级里渲染自己（靠文件名推断完成递归，无需导入自身）；<script setup> 下组件只在渲染时才取值，循环导入不会出问题。
import RebornAnchorLink from "./RebornAnchorLink.vue";

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

const ctx = inject(ANCHOR_INJECTION_KEY, null);
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
