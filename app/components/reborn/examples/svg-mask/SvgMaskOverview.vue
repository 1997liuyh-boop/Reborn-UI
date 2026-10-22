<script setup lang="ts">
/**
 * 总览卡片缩略：一段浅底文字，圆形遮罩停在右侧，圈内透出深色底、带红色高亮的同一段文字
 *
 * 遮罩圆跟随鼠标移动，缩略图禁用交互，且组件的遮罩图形来自外部 svg；
 * 这里用两层排版完全相同的文字加 clip-path 圆形裁切，静态模拟遮罩停在某处的画面。
 * 圈内浅色主题用近黑底白字；暗色主题若照搬反相会变成一块白圆、过于刺眼，改用中灰底白字。
 */
</script>

<template>
  <div class="relative h-[112px] w-[200px] overflow-hidden rounded-md border border-gray-3 bg-gray-1 text-center text-sm leading-snug font-bold">
    <!-- 遮罩外露出的一层（对应 reveal 插槽） -->
    <div class="absolute inset-0 flex items-center justify-center px-4 text-gray-9">
      <p>第一条规则：不要谈论 MRR 俱乐部。第二条规则：绝对不要谈论 MRR 俱乐部。</p>
    </div>
    <!-- 遮罩圆内透出的一层（对应 base 插槽） -->
    <div class="absolute inset-0 flex items-center justify-center bg-gray-10 px-4 text-gray-1 dark:bg-gray-3 dark:text-gray-10 [clip-path:circle(34px_at_66%_52%)]">
      <!-- 两层文字须逐字一致且不带首尾空白，否则换行位置不同、圈内外对不齐 -->
      <p>第一条规则：不要谈论 <span class="text-red-6">MRR 俱乐部</span>。第二条规则：绝对不要谈论 <span class="text-red-6">MRR 俱乐部</span>。</p>
    </div>
  </div>
</template>
