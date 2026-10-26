<script setup lang="ts">
/**
 * 总览卡片缩略：带计时图标与标题的倒计时「距离活动结束 02 天 18:45:30」
 *
 * 倒计时挂载后按秒自我调度、没有暂停开关，缩略图不能常驻计时器，所以展示静态的一帧：
 * 用倒计时自己的格式化函数把一个固定剩余时长排成「DD 天 HH:mm:ss」，
 * 再交给它内部复用的统计数值组件渲染，结构与样式和真实倒计时一致。
 */
import { Icon } from "#components";
import { formatCountdown } from "~/components/reborn/ui/reborn-countdown/reborn-countdown.utils";
import RebornStatistic from "~/components/reborn/ui/reborn-statistic/RebornStatistic.vue";

/** 固定剩余时长：2 天 18 小时 45 分 30 秒 */
const REMAINING = ((2 * 24 + 18) * 3600 + 45 * 60 + 30) * 1000
const text = formatCountdown(REMAINING, 'DD [天] HH:mm:ss')
</script>

<template>
  <RebornStatistic
    class="reborn-countdown"
    title="距离活动结束"
    :value="REMAINING"
    :formatter="() => text"
  >
    <template #prefix>
      <Icon
        name="lucide:timer"
        class="size-5 text-primary"
      />
    </template>
  </RebornStatistic>
</template>
