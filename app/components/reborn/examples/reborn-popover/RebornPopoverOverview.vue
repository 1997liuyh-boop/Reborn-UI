<script setup lang="ts">
/**
 * 总览卡片缩略：触发按钮下方常驻的气泡卡片
 *
 * 关闭 portal 就地渲染，并把内容层从 fixed 改成 static 排在按钮下方，
 * 这样不依赖视口坐标计算，也不会逃出卡片；关闭 dismissible 防止点击页面其他位置把它收起。
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornPopover from '~/components/reborn/ui/reborn-popover/RebornPopover.vue'

const ui = {
  wrapper: 'relative inline-flex flex-col items-center',
  contentWrapper: 'static mt-2',
}
</script>

<template>
  <RebornPopover
    :portal="false"
    :dismissible="false"
    :ui="ui"
    default-open
  >
    <RebornButton
      size="sm"
      variant="outlined"
    >
      查看详情
    </RebornButton>
    <template #content>
      <div class="w-[160px] text-sm">
        订单已发货，预计明天送达
      </div>
    </template>
  </RebornPopover>
</template>
