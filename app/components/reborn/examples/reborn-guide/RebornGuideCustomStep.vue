<script setup lang="ts">
import type { GuideStep } from "~/components/reborn/ui/reborn-guide/RebornGuide.vue";
import { shallowRef } from 'vue';
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";

interface Props {
  step?: GuideStep;
  heading: string;
  description: string;
  current: number;
  total: number;
  next: () => void;
  prev: () => void;
  finish: () => void;
  close: () => void;
}

defineProps<Props>();

/** 自定义面板可以维护独立的业务状态。 */
const preference = shallowRef("个人使用");
const options = ["个人使用", "团队协作"];
</script>

<template>
  <section class="flex flex-col gap-4" data-guide-custom-panel>
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm text-primary">独立 Vue 组件</span>
      <RebornButton size="sm" color="neutral" variant="text" aria-label="关闭自定义引导" @click="close()">关闭</RebornButton>
    </div>
    <div class="flex flex-col gap-2">
      <h3 class="text-base font-medium text-gray-10">{{ heading }}</h3>
      <p class="text-base text-gray-8">{{ description }}</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <RebornButton v-for="option in options" :key="option" size="sm" :variant="preference === option ? 'filled' : 'outlined'" :color="preference === option ? 'primary' : 'neutral'" @click="preference = option">{{ option }}</RebornButton>
    </div>
    <p class="text-sm text-gray-8">已选：{{ preference }}</p>
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm text-gray-8">{{ current }}/{{ total }}</span>
      <div class="flex items-center gap-2">
        <RebornButton v-if="current > 1" color="neutral" variant="outlined" size="sm" @click="prev()">返回选择</RebornButton>
        <RebornButton v-if="current < total" color="primary" variant="filled" size="sm" @click="next()">保存并继续</RebornButton>
        <RebornButton v-else color="primary" variant="filled" size="sm" @click="finish()">完成自定义流程</RebornButton>
      </div>
    </div>
  </section>
</template>
