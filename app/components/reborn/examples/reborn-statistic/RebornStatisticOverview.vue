<script setup lang="ts">
/**
 * 总览卡片缩略：并排的两项统计数值，一项带千分位，一项带两位小数和百分号后缀
 *
 * 保留默认的从零计数动画：只在挂载时播一次，约 1.5 秒后停在终态，不会常驻循环。
 */
import RebornStatistic from '~/components/reborn/ui/reborn-statistic/RebornStatistic.vue'
</script>

<template>
  <div class="flex items-start gap-5">
    <RebornStatistic
      title="活跃用户"
      :value="112893"
    />
    <RebornStatistic
      title="转化率"
      :value="93.12"
      :precision="2"
      suffix="%"
    />
  </div>
</template>
