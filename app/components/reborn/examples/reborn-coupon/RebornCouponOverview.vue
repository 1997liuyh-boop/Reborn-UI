<script setup lang="ts">
/**
 * 总览卡片缩略：左侧面额、右侧说明的橙色渐变优惠券，中间是带上下半圆缺口的点状撕裂线
 *
 * 沿用演练场的 perforated 竖向形态与渐变底色，把宽高与缺口偏移按卡片尺寸缩小；
 * 渐变与白字属于券面本身的配色，明暗主题下保持一致。
 */
import RebornCoupon from "~/components/reborn/ui/reborn-coupon/RebornCoupon.vue";

const couponStyle = { background: 'linear-gradient(135deg, #ff7e5f, #feb47b)' }
</script>

<template>
  <RebornCoupon
    type="perforated"
    direction="vertical"
    :width="208"
    :height="84"
    :radius="8"
    :offset="84"
    :gap="3"
    split="dotted"
    :size="2"
    split-color="#ffffff"
    class="rounded-lg text-white"
    :style="couponStyle"
  >
    <template #left>
      <div class="flex h-full flex-col items-center justify-center">
        <span class="text-2xl font-extrabold tracking-tighter">¥100</span>
        <span class="text-xs whitespace-nowrap opacity-80">满 1000 可用</span>
      </div>
    </template>
    <template #right>
      <div class="flex h-full flex-col justify-center gap-0.5 pr-3">
        <span class="text-base font-bold">新人专享券</span>
        <span class="text-xs whitespace-nowrap opacity-80">2026.12.31 前有效</span>
        <span class="mt-1 self-start rounded-full border border-current px-2 text-xs leading-5">立即领取</span>
      </div>
    </template>
  </RebornCoupon>
</template>
