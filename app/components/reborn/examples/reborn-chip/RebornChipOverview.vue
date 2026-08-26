<script setup lang="ts">
/**
 * 总览卡片缩略：角标挂在占位块上的基础态
 */
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-8">
    <RebornChip
      color="primary"
      text="8"
    >
      <div class="border-default rounded-ui-md size-12 border" />
    </RebornChip>
    <RebornChip
      color="error"
      text="NEW"
    >
      <div class="border-default rounded-ui-md size-12 border" />
    </RebornChip>
    <RebornChip
      color="success"
      size="sm"
      text=""
    >
      <div class="border-default rounded-ui-md flex size-12 items-center justify-center border">
        <Icon
          name="lucide:mail"
          class="text-muted size-5"
        />
      </div>
    </RebornChip>
  </div>
</template>
