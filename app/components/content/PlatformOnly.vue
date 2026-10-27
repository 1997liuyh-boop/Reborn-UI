<script setup lang="ts">
/**
 * PlatformOnly —— MDC 块组件 `::platform-only{platform="uniapp"}`
 *
 * 只在文档站当前平台档位与 platform 一致时渲染内容。
 * 写在正文顶层时 DocsPage 已在数据层预先拆包或剔除（见 utils/applyPlatformScopes），
 * 走到这里的只有嵌在 tabs 等组件里的平台块，以及不经过 DocsPage 的渲染场景。
 * 首屏按默认档位 web 输出，档位在水合后才从 localStorage 恢复，因此不会产生水合差异。
 */
import type { DocsPlatform } from '~/composables/useDocsPlatform'

interface Props {
  /** 内容所属平台：web / uniapp */
  platform: DocsPlatform
}

const props = defineProps<Props>()
const { platform: current } = useDocsPlatform()
</script>

<template>
  <div v-if="props.platform === current">
    <slot />
  </div>
</template>
