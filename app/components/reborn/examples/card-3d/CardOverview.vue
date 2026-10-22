<script setup lang="ts">
/**
 * 总览卡片缩略：向右下倾斜的 3D 卡片，标题、配图与按钮按不同深度浮起
 *
 * 卡片高度有限，只保留标题、配图与两枚按钮三层，省掉 Demo 里的描述行。
 * 倾斜角由 CardContainer 跟随鼠标实时写入，浮起由 CardItem 在鼠标进入后写入 translateZ，
 * 两者都没有强制状态的 prop；缩略图禁交互，这里用 class 直接给出一组定格的旋转角与 translateZ，
 * 透视与 preserve-3d 仍由组件自身提供，浮起深度沿用 Demo 的比例（配图最高、按钮最低）。
 * 卡片默认 384×384，这里用 important 收窄成小卡。
 */
import { CardBody, CardContainer, CardItem } from '~/components/reborn/ui/card-3d'
</script>

<template>
  <CardContainer
    container-class="p-0"
    class="[transform:rotateX(14deg)_rotateY(-22deg)]"
  >
    <CardBody class="relative h-auto! w-[168px]! rounded-xl border border-default bg-elevated p-2.5">
      <CardItem class="text-xs font-bold text-highlighted [transform:translateZ(24px)]">
        让元素浮在空中
      </CardItem>
      <CardItem class="mt-1.5 w-full [transform:translateZ(48px)]">
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop"
          class="h-[40px] w-full rounded-lg object-cover"
          alt="示例图片"
        >
      </CardItem>
      <div class="mt-2 flex items-center justify-between">
        <CardItem class="px-1 text-[10px] text-default [transform:translateZ(12px)]">
          访问 →
        </CardItem>
        <CardItem class="rounded-md bg-inverted px-2 py-0.5 text-[10px] font-bold text-inverted [transform:translateZ(12px)]">
          立即开始
        </CardItem>
      </div>
    </CardBody>
  </CardContainer>
</template>
