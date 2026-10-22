<script setup lang="ts">
/**
 * 总览卡片缩略：鼠标从左侧进入后的图片卡片——配图向右偏移，左下角浮出白色标题
 *
 * 静态模拟：进入方向由 mouseenter 时的坐标实时算出，组件没有指定方向的 prop，
 * 移动端还改成点击触发、3 秒后收起；缩略图禁交互，这里按组件的结构
 * （放大 1.5 倍的配图 + 随方向平移的图片层 + 底部内容层）画出「从左侧进入」的定格画面，
 * 左边缘内侧的指针图标用来点明进入方向。
 * 配图用背景图放大而不是给 img 加 scale，避免放大后的图层超出卡片边界。
 */
const imageStyle = {
  backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop)',
  backgroundSize: '150% auto',
  // 图片层随「从左进入」整体右移，取景点相应偏左
  backgroundPosition: '35% 50%',
}
</script>

<template>
  <div
    class="relative h-[112px] w-[150px] overflow-hidden rounded-xl bg-gray-2"
    :style="imageStyle"
    role="img"
    aria-label="雪山之巅"
  >
    <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2.5 pt-6 pb-2 text-white">
      <div class="text-xs font-semibold">
        雪山之巅
      </div>
      <div class="mt-0.5 text-[10px] opacity-90">
        触摸云层之上的静谧
      </div>
    </div>
    <!-- 指针停在左边缘内侧，点明「从左侧进入」 -->
    <Icon
      name="ph:cursor-fill"
      class="absolute top-[30px] left-1.5 size-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
    />
  </div>
</template>
