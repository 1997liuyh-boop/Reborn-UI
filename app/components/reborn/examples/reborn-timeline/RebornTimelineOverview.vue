<script setup lang="ts">
/**
 * 总览卡片缩略：时间戳在轴线左侧、内容在右侧的三节点时间线
 */
import RebornTimeline from '~/components/reborn/ui/reborn-timeline/RebornTimeline.vue'
import RebornTimelineItem from '~/components/reborn/ui/reborn-timeline/RebornTimelineItem.vue'
</script>

<template>
  <div class="flex w-full max-w-[210px] justify-center">
    <RebornTimeline>
      <RebornTimelineItem timestamp="09-01" placement="left" color="success">
        提交申请
      </RebornTimelineItem>
      <RebornTimelineItem timestamp="09-03" placement="left" color="success">
        部门审批
      </RebornTimelineItem>
      <RebornTimelineItem timestamp="09-05" placement="left" loading>
        财务复核
      </RebornTimelineItem>
    </RebornTimeline>
  </div>
</template>
