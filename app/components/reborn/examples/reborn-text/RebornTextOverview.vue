<script setup lang="ts">
/**
 * 总览卡片缩略：金额格式化，带货币符号与千分位
 */
import RebornText from '~/components/reborn/ui/reborn-text/RebornText.vue'
</script>

<template>
  <RebornText
    type="amount"
    :value="12345.6"
    currency="¥"
    :precision="2"
    :size="20"
  />
</template>
