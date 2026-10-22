<script setup lang="ts">
/**
 * 总览卡片缩略：四步流程进行到第三步，前两步已勾选、当前步转圈、后续步置灰
 *
 * 真实组件是 fixed 全屏模糊遮罩，靠定时器逐步推进；缩略图不弹遮罩、不起定时器，
 * 按组件的图标与「离当前步越远越淡」的透明度规则，静态渲染步骤列表这一部分。
 */
const steps = ['校验支付信息', '保存订单', '发送确认邮件', '即将跳转']
/** 当前进行到的步骤下标 */
const current = 2
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="(text, index) in steps"
      :key="text"
      class="flex items-center gap-2"
      :style="{ opacity: Math.max(1 - Math.abs(index - current) * 0.2, 0) }"
    >
      <Icon
        v-if="index < current"
        name="heroicons:check-circle-solid"
        class="size-5 text-primary"
      />
      <Icon
        v-else-if="index === current"
        name="heroicons:arrow-path-solid"
        class="size-5 animate-spin text-primary"
      />
      <Icon
        v-else
        name="heroicons:check-circle"
        class="size-5 text-gray-10 opacity-50"
      />
      <span
        class="text-sm text-gray-10"
        :class="{ 'opacity-50': index > current }"
      >
        {{ text }}
      </span>
    </div>
  </div>
</template>
