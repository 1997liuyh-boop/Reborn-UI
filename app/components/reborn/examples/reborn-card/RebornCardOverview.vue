<script setup lang="ts">
/**
 * 总览卡片缩略：带分组标题的信息卡片，内容为三行订单字段
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：标题在卡片外、小号大写字距，
 * 卡片体为圆角描边加浅投影，子元素之间保持统一间距。原尺寸 p-4 / gap-3 放不进卡片，这里等比收紧。
 */
const rows = [
  { label: '订单编号', value: 'NO.20261020' },
  { label: '下单时间', value: '10-20 14:32' },
  { label: '实付金额', value: '¥128.00' },
]
</script>

<template>
  <div class="flex w-[200px] flex-col gap-2">
    <div class="text-[11px] font-medium tracking-wider text-gray-6">
      订单信息
    </div>
    <div class="flex flex-col gap-2 overflow-hidden rounded-xl border border-gray-3 bg-gray-1 p-3 shadow-sm">
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex items-center justify-between text-[11px] leading-4"
      >
        <span class="text-gray-6">{{ row.label }}</span>
        <span class="font-medium text-gray-9">{{ row.value }}</span>
      </div>
    </div>
  </div>
</template>
