<script setup lang="ts">
/**
 * 总览卡片缩略：纵向叠放的两条通知卡片，最新一条在上
 *
 * AnimatedList 挂载期间靠 useIntervalFn 按 delay 持续轮换，总览卡片挂载后不卸载，轮换会一直运行；
 * 因此只复用它的列表项组件 Notification，按列表的排布静态摆出其中一帧。
 * 三条在卡片里要缩到一半以下、文字看不清，所以只放两条。
 */
const notifications = [
  {
    name: '新用户注册',
    description: '张三 加入了团队',
    time: '2 分钟前',
    icon: '👤',
    color: '#FFB800',
  },
  {
    name: '收到付款',
    description: '订单 #2048 已入账',
    time: '15 分钟前',
    icon: '💸',
    color: '#00C9A7',
  },
]
</script>

<template>
  <div class="flex w-[270px] shrink-0 scale-[0.72] flex-col gap-3">
    <Notification
      v-for="item in notifications"
      :key="item.name"
      :name="item.name"
      :description="item.description"
      :icon="item.icon"
      :color="item.color"
      :time="item.time"
    />
  </div>
</template>
