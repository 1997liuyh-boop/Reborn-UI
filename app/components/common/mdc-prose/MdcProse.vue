<script lang="ts" setup>
import { hash } from "ohash";
import ProsePre from "~/components/content/ProsePre.vue";

interface Props {
  /** 原始 MDC 字符串 */
  value: string;
  /** 透传给 MDCRenderer 的根元素 class */
  class?: unknown;
}

const props = defineProps<Props>();

// 与 <MDC> 同源的运行时解析，但直接喂给 MDCRenderer 并注入 pre → ProsePre 组件对象：
// 独立 MDC 场景下标签映射缺失 pre → ProsePre（ProsePre 属局部组件，不在全局组件注册表），
// 按字符串名全局解析本地覆盖组件会触发 "Failed to resolve component: ProsePre" 警告；
// 这里通过 components prop 注入组件引用，让 findMappedTag 直接命中组件对象，彻底绕开运行时组件名解析。
const { data, refresh } = await useAsyncData(
  `mdc-prose-${hash(String(props.value))}`,
  async () => {
    const { parseMarkdown } = await import("@nuxtjs/mdc/runtime");
    return parseMarkdown(props.value);
  },
);

// value 变化时重新解析（对应旧 <MDC> 的响应式 refresh 行为）
watch(
  () => props.value,
  () => {
    refresh();
  },
);
</script>

<template>
  <MDCRenderer
    v-if="data"
    :body="data.body"
    :data="data.data"
    :class="class"
    :components="{ pre: ProsePre }"
  />
</template>