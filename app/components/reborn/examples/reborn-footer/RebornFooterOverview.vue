<script setup lang="ts">
/**
 * 总览卡片缩略：手机屏下半截，底部固定一条结算栏（合计金额 + 提交订单按钮）
 *
 * Web 端的 RebornFooter 只是「web端暂未开发」占位，按 UniApp 源码静态还原外观：
 * 底部栏白底、内容区 px-3 py-3，自身包含底部安全区；真实组件用 fixed 贴底并自动生成占位高度，
 * 缩略图不能用 fixed，改为画一截手机屏框，把底部栏放在屏幕最下方，顶部渐隐表示上方还有内容。
 */
</script>

<template>
  <div class="relative flex h-[124px] w-[176px] flex-col overflow-hidden rounded-b-[20px] border-x-[3px] border-b-[3px] border-gray-4 bg-gray-2 [mask-image:linear-gradient(to_top,#000_72%,transparent)]">
    <!-- 页面内容：几条列表项 -->
    <div class="flex h-[70px] shrink-0 flex-col justify-end gap-1.5 px-2.5 pb-1.5">
      <div
        v-for="i in 2"
        :key="i"
        class="flex h-[26px] items-center gap-2 rounded-md border border-gray-3 bg-gray-1 px-2"
      >
        <div class="size-4 shrink-0 rounded bg-primary/15" />
        <div class="h-1.5 flex-1 rounded-full bg-gray-3" />
      </div>
    </div>

    <!-- 底部栏：内容区 + 安全区 -->
    <div class="flex h-[51px] shrink-0 flex-col border-t border-gray-3 bg-gray-1 shadow-[0_-2px_8px_rgba(15,23,42,0.06)]">
      <div class="flex h-10 items-center justify-between px-2.5">
        <span class="text-[10px] text-gray-7">
          合计 <span class="text-xs font-semibold text-primary">¥128.00</span>
        </span>
        <span class="flex h-6 items-center rounded-full bg-primary px-3 text-[10px] font-medium text-white">
          提交订单
        </span>
      </div>
      <!-- 底部安全区与系统横条 -->
      <div class="flex flex-1 items-start justify-center">
        <div class="h-[3px] w-12 rounded-full bg-gray-9/70" />
      </div>
    </div>
  </div>
</template>
