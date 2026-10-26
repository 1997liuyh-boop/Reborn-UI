<script setup lang="ts">
import { useHighlighter } from 'docus/modules/assistant/runtime/composables/useHighlighter';
import { ShikiCachedRenderer } from 'shiki-stream/vue';
import { computed } from 'vue';
import ProsePre from '~/components/content/ProsePre.vue';

interface Props {
  code: string;
  language: string;
  class?: string;
  meta?: string;
}
const props = defineProps<Props>();
const colorMode = useColorMode();
const highlighter = await useHighlighter();
const code = computed(() => props.code.trim());
// 模型偶尔把 Vue 示例标为 xml，使用已加载的 HTML 语法高亮。
const languageAliases: Record<string, string> = { javascript: 'js', typescript: 'ts', xml: 'html' };
const language = computed(() => languageAliases[props.language] ?? props.language);
</script>

<template>
  <!-- 显式引用本站代码块，流式回复与文档共用复制和运行入口。 -->
  <ProsePre v-bind="props" :code="code">
    <ShikiCachedRenderer
      :key="`${language}-${colorMode.value}`" :highlighter="highlighter"
      :code="code" :lang="language"
      :theme="colorMode.value === 'dark' ? 'material-theme-palenight' : 'material-theme-lighter'"
    />
  </ProsePre>
</template>
