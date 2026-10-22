<script setup lang="ts">
/**
 * 总览卡片缩略：警告、主色、成功三种配色的通知栏，左侧图标、右侧关闭或箭头
 *
 * 关闭 scrollable，超长文字省略显示，不跑横向滚动动画；
 * 组件默认的 #F7F7F9 底色与 #888A8C 文字只适合浅色，这里改传会随明暗反转的色板变量。
 */
import RebornNoticeBar from '~/components/reborn/ui/reborn-notice-bar/RebornNoticeBar.vue'

const bars = [
  {
    text: '系统将于今晚 22:00 升级维护，请提前保存',
    leftIcon: 'lucide:volume-2',
    rightIcon: 'lucide:x',
    color: 'var(--color-warning)',
    background: 'var(--color-orange-1)',
  },
  {
    text: '新版本已上线，查看更新说明',
    leftIcon: 'lucide:megaphone',
    rightIcon: 'lucide:chevron-right',
    color: 'var(--color-primary)',
    background: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-gray-1))',
  },
  {
    text: '报销单已通过审批，款项将于三日内到账',
    leftIcon: 'lucide:circle-check',
    rightIcon: 'lucide:x',
    color: 'var(--color-success)',
    background: 'var(--color-green-1)',
  },
]

const ui = { root: 'gap-1.5 rounded-lg p-1.5 text-xs' }
</script>

<template>
  <div class="flex w-[208px] flex-col gap-2">
    <RebornNoticeBar
      v-for="bar in bars"
      :key="bar.text"
      :text="bar.text"
      :left-icon="bar.leftIcon"
      :right-icon="bar.rightIcon"
      :color="bar.color"
      :background="bar.background"
      :scrollable="false"
      :ui="ui"
    />
  </div>
</template>
