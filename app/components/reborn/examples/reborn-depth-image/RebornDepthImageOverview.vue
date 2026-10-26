<script setup lang="ts">
import { Icon } from "#components";

/**
 * 总览卡片缩略：指针在右上方时被补光照亮的士兵，旁边是它的深度图
 *
 * 真组件进入视口后会创建 WebGL 画布，总览页不允许，这里改为静态 DOM：
 * 彩色图上叠一层径向白光，用彩色图自身的透明通道做遮罩，光只落在人物上，近似「补光」；
 * 右侧并排放 depthSrc，交代这个组件靠一张灰度深度图工作。两张图都是 Demo 已在用的素材。
 */

/** 演示素材：与 Demo 相同 */
const COLOR_SRC = "/images/depth-image/soldier.webp";
const DEPTH_SRC = "/images/depth-image/soldier-depth.webp";

/** 补光层：光斑落在右肩、紧挨指针图标，遮罩取彩色图的透明通道 */
const lightStyle = {
  backgroundImage:
    "radial-gradient(circle at 66% 30%, rgb(255 255 255 / 0.85), rgb(255 255 255 / 0.35) 22%, rgb(255 255 255 / 0) 48%)",
  maskImage: `url(${COLOR_SRC})`,
  maskSize: "contain",
  maskPosition: "center",
  maskRepeat: "no-repeat",
};
</script>

<template>
  <div class="flex items-end gap-3">
    <div class="relative h-32 w-[110px]">
      <img :src="COLOR_SRC" alt="" class="size-full object-contain">
      <div class="absolute inset-0" :style="lightStyle" />
      <!-- 指针压在照片上，不随明暗切换：照系统光标用黑芯白边，浅色盔甲和亮斑上都看得清 -->
      <Icon
        name="lucide:mouse-pointer-2"
        class="absolute top-[28px] left-[76px] size-4 text-black drop-shadow-[0_0_1px_#fff]"
      />
    </div>

    <div class="flex flex-col items-center gap-1">
      <img :src="DEPTH_SRC" alt="" class="border-default h-[70px] w-[60px] rounded-md border object-contain">
      <span class="text-muted text-[10px]">深度图</span>
    </div>
  </div>
</template>
