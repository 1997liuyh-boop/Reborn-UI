<script setup lang="ts">
/**
 * 总览卡片缩略：Demo 人像经 4×4 Bayer 有序抖动后的像素画面
 *
 * 真组件在 canvas 上逐像素计算，挂载即整幅重绘，总览页不挂载，改为 <img> + SVG 滤镜静态近似：
 * 1. 取 Demo 同一张图的 100px 宽版本，按 2 倍最近邻放大，得到与 gridSize=2 相同的 2px 像素块
 *    （缩略图只有 200px 宽，Demo 默认的 4px 块会糊得认不出人脸）；
 * 2. 滤镜铺一张 8px 的 Bayer 阈值贴图，按组件 original 模式的公式给每个通道加 ±32 的偏移；
 * 3. 再把每个通道量化到 5 级，得到同样的有序抖动纹理。
 */
import { useId } from "vue";

/** Demo 同款图片，宽度降到 100px：放大 2 倍正好铺满 200px 宽的画框 */
const IMAGE_SRC = "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?q=80&w=100&auto=format&fit=crop";

/** 与组件一致的 4×4 Bayer 矩阵 */
const BAYER_MATRIX_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** 一个像素块的边长（px），对应组件 gridSize */
const CELL = 2;
const TILE = CELL * 4;

/** Bayer 阈值贴图：每格灰度 = 矩阵值 / 16，作为滤镜里平铺的偏移量来源 */
const bayerTile = (() => {
  const rects = BAYER_MATRIX_4x4.flatMap((row, y) =>
    row.map((value, x) => {
      const gray = Math.round((value / 16) * 255);
      return `<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}" fill="rgb(${gray},${gray},${gray})"/>`;
    }),
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();

/**
 * 量化表：组件做的是 round(c × 4) / 4，discrete 只能向下取整，
 * 因此切成 8 段、相邻两段取同一级，等价于四舍五入到 0 / 0.25 / 0.5 / 0.75 / 1。
 */
const QUANTIZE_TABLE = "0 0.25 0.25 0.5 0.5 0.75 0.75 1";

const filterId = `dither-ov-${useId().replace(/[^\w-]/g, "")}`;
</script>

<template>
  <div class="relative h-32 w-50 overflow-hidden rounded-xl bg-black">
    <!-- object-position 的纵向偏移取 2 的倍数，让像素块与 Bayer 格对齐 -->
    <img
      :src="IMAGE_SRC"
      alt=""
      class="size-full object-cover [image-rendering:pixelated] [object-position:0_-36px]"
      :style="{ filter: `url(#${filterId})` }"
    >

    <svg
      class="absolute size-0"
      aria-hidden="true"
    >
      <filter
        :id="filterId"
        x="0"
        y="0"
        width="100%"
        height="100%"
        color-interpolation-filters="sRGB"
      >
        <feImage
          :href="bayerTile"
          x="0"
          y="0"
          :width="TILE"
          :height="TILE"
          result="cell"
        />
        <feTile
          in="cell"
          result="bayer"
        />
        <!-- 原色 + (阈值 - 0.5) × 64/255：k3 = 0.25，k4 = -0.125 -->
        <feComposite
          in="SourceGraphic"
          in2="bayer"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="0.25"
          k4="-0.125"
          result="offset"
        />
        <feComponentTransfer in="offset">
          <feFuncR
            type="discrete"
            :tableValues="QUANTIZE_TABLE"
          />
          <feFuncG
            type="discrete"
            :tableValues="QUANTIZE_TABLE"
          />
          <feFuncB
            type="discrete"
            :tableValues="QUANTIZE_TABLE"
          />
        </feComponentTransfer>
      </filter>
    </svg>
  </div>
</template>
