<script setup lang="ts">
/**
 * 总览卡片缩略：底部弹出的选择面板，含拖拽条、标题、单列滚轮与取消 / 确定按钮
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：该组件点击触发器后从底部弹出 Popup，
 * 内嵌 PickerView 滚动选择，底部两个按钮一描边一填充。缩略图只取弹出后的面板，
 * 不画遮罩与触发器；滚轮只保留中线上下各一行。
 */
const items = ['CSS', 'JavaScript', 'Node']
const centerIndex = 1
</script>

<template>
  <div class="flex w-[200px] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-gray-3 bg-gray-1 shadow-[0_-4px_16px_rgba(15,23,42,0.08)]">
    <!-- 拖拽条：底部弹出且开启 swipeClose 时显示 -->
    <div class="flex justify-center pt-1.5">
      <div class="h-1 w-8 rounded-full bg-gray-4" />
    </div>
    <div class="flex items-center justify-between px-3 py-0.5">
      <span class="text-xs font-medium text-gray-9">请选择</span>
      <Icon
        name="lucide:x"
        class="size-3.5 text-gray-5"
      />
    </div>
    <!-- 单列滚轮：中线为主色浅底指示条 -->
    <div class="relative px-1">
      <div class="absolute inset-x-1.5 top-1/2 h-[18px] -translate-y-1/2 rounded-[10px] bg-primary/10" />
      <div
        v-for="(label, index) in items"
        :key="label"
        class="relative flex h-[18px] items-center justify-center text-[11px]"
        :class="[
          index === centerIndex ? 'font-bold text-primary' : 'text-gray-8 opacity-50',
        ]"
      >
        {{ label }}
      </div>
    </div>
    <div class="flex gap-2 px-2 pt-1.5 pb-2">
      <div class="flex h-6 flex-1 items-center justify-center rounded border border-primary text-[11px] text-primary">
        取消
      </div>
      <div class="flex h-6 flex-1 items-center justify-center rounded bg-primary text-[11px] text-white">
        确定
      </div>
    </div>
  </div>
</template>
