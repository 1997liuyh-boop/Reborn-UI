<script setup lang="ts">
/**
 * 总览卡片缩略：三步横向步骤条，第一步已完成、第二步进行中、第三步待处理
 *
 * 选标题居中在标记下方的排布：比默认的「标记 + 右侧标题」更紧凑，三步能并排；
 * 该排布每步最小 88px，整体约 264px，按 0.76 缩放后落进卡片宽度。
 */
import RebornStep from '~/components/reborn/ui/reborn-steps/RebornStep.vue'
import RebornSteps from '~/components/reborn/ui/reborn-steps/RebornSteps.vue'
</script>

<template>
  <div class="w-[264px] shrink-0 scale-[0.76]">
    <RebornSteps
      :active="1"
      size="sm"
      align-center
    >
      <RebornStep
        title="填写资料"
        description="已完成"
      />
      <RebornStep
        title="身份验证"
        description="进行中"
      />
      <RebornStep
        title="提交完成"
        description="待处理"
      />
    </RebornSteps>
  </div>
</template>
