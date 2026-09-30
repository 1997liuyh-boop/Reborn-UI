<script setup lang="ts">
/**
 * 总览卡片缩略：按钮上方的文字提示
 *
 * 真实组件只在悬停时通过 Teleport 挂到 body，缩略图改用主题里的 content 样式静态渲染气泡，
 * 外观与组件一致，又不会脱离卡片。
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import { rebornTooltip } from '~/components/reborn/ui/reborn-tooltip/reborn-tooltip.config'

const styles = rebornTooltip({ side: 'top' })
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div :class="styles.content()">
      复制链接
    </div>
    <RebornButton
      size="sm"
      variant="outlined"
    >
      <Icon
        name="lucide:link"
        class="size-4"
      />
    </RebornButton>
  </div>
</template>
