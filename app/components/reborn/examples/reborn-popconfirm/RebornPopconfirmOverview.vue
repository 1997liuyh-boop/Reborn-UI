<script setup lang="ts">
/**
 * 总览卡片缩略：触发按钮下方常驻的确认气泡
 *
 * 与气泡卡片缩略同理：关闭 portal、内容层改 static，关闭 dismissible 保持展开；
 * 气泡默认最小宽度 244px 超出卡片可用宽度，这里收窄到 190px。
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornPopconfirm from '~/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue'

const ui = {
  body: 'min-w-0 w-[190px]',
  popover: {
    wrapper: 'relative inline-flex flex-col items-center',
    contentWrapper: 'static mt-2',
  },
}
</script>

<template>
  <RebornPopconfirm
    title="确定删除这条记录？"
    :arrow="false"
    :portal="false"
    :dismissible="false"
    :ui="ui"
    default-open
  >
    <RebornButton
      size="sm"
      color="error"
      variant="outlined"
    >
      删除
    </RebornButton>
  </RebornPopconfirm>
</template>
