<script setup lang="ts">
/**
 * 总览卡片缩略：成功状态的结果页，绿色对勾图标、标题、副标题与两个操作按钮
 *
 * 默认 72px 图标底板、24px 标题和段间 24px 放不进卡片，这里通过 ui 等比缩小图标、字号与间距。
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornResult from '~/components/reborn/ui/reborn-result/RebornResult.vue'

const ui = {
  root: 'gap-2',
  icon: 'size-11',
  iconGlyph: 'size-6',
  content: 'gap-0.5',
  title: 'text-base',
  subTitle: 'text-xs',
  extra: 'gap-2',
}
</script>

<template>
  <RebornResult
    icon="success"
    title="提交成功"
    sub-title="审批结果将通过短信通知"
    :ui="ui"
  >
    <template #extra>
      <RebornButton
        size="sm"
        color="neutral"
        variant="outlined"
      >
        返回列表
      </RebornButton>
      <RebornButton
        size="sm"
        color="primary"
      >
        查看详情
      </RebornButton>
    </template>
  </RebornResult>
</template>
