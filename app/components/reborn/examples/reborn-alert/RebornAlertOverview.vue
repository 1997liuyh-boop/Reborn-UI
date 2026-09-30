<script setup lang="ts">
/**
 * 总览卡片缩略：带图标的成功提示条
 */
import RebornAlert from '~/components/reborn/ui/reborn-alert/RebornAlert.vue'
</script>

<template>
  <div class="w-full max-w-[210px]">
    <RebornAlert
      type="success"
      title="保存成功"
      show-icon
    />
  </div>
</template>
