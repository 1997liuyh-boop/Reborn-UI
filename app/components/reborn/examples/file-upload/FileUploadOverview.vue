<script setup lang="ts">
/**
 * 总览卡片缩略：虚线框拖放区，网格底纹上是「Upload file」标题、说明与带上传图标的卡片
 *
 * 直接挂载组件，标题与说明是组件内写死的文案。两处取舍：
 * - 默认的 FileUploadGrid 会铺出 451 个 40px 方格、远超卡片范围，这里在插槽里换成一张 CSS 网格底纹，
 *   视觉相同、只有一个节点；
 * - 组件默认高度约 320px，缩到卡片里文字会小到看不清，所以先从外层收紧内边距与上传卡片尺寸再整体缩小。
 */
/** 网格底纹：浅色格子加 1px 分隔线，与 FileUploadGrid 的观感一致 */
const gridStyle = {
  backgroundColor: 'var(--color-gray-1)',
  backgroundImage:
    'linear-gradient(to right, var(--color-gray-2) 1px, transparent 1px), linear-gradient(to bottom, var(--color-gray-2) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}
</script>

<template>
  <div class="w-[300px] shrink-0 scale-[0.56] [&_.group\/file]:p-5 [&_.h-32]:h-16 [&_.max-w-32]:max-w-16 [&_.mt-10]:mt-3">
    <FileUpload class="rounded-xl border border-dashed border-gray-4">
      <div
        class="size-full"
        :style="gridStyle"
      />
    </FileUpload>
  </div>
</template>
