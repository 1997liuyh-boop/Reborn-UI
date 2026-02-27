<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import { imageMode } from '@/components/reborn-image/reborn-image.config'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const src = ref('https://cms-image.leyifan.cn/img_reborn/ques-4.jpg')
const previewList = ref(['https://cms-image.leyifan.cn/resources/image/2026/01/27/767453852479557.png', 'https://cms-image.leyifan.cn/resources/image/2026/01/30/768516482351173.png'])
</script>

<template>
  <RebornPage title="Image 图片" description="组件是基于 uni-app 原生 image 组件封装的增强版图片组件">
    <RebornCard title="基础用法">
      <RebornImage :src="src" />
    </RebornCard>
    <RebornCard title="不同裁剪" custom-class="grid grid-cols-4 gap-2 text-24 text-gray-7 dark:text-gray-1">
      <view
        v-for="value in imageMode" :key="value" class="
          flex flex-col items-center justify-center
        "
      >
        <RebornImage :src="src" :mode="value" />
        {{ value }}
      </view>
    </RebornCard>
    <RebornCard title="预览图片" custom-class="grid grid-cols-4 gap-2 text-24 text-gray-7 dark:text-gray-1">
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" preview />
        原图
      </view>
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" preview :preview-list="previewList" />
        预览列表
      </view>
    </RebornCard>
    <RebornCard title="状态" custom-class="grid grid-cols-4 gap-2 text-24 text-gray-7 dark:text-gray-1">
      <view class="flex flex-col items-center justify-center">
        <RebornImage src="src" />
        失败
      </view>
      <view class="flex flex-col items-center justify-center">
        <RebornImage src="" />
        加载中
      </view>
    </RebornCard>
    <RebornCard title="自定义圆角" custom-class="grid grid-cols-4 gap-2 text-24 text-gray-7 dark:text-gray-1">
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" custom-class="rounded-full" />
        rounded-full
      </view>
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" custom-class="rounded-lg" />
        rounded-lg
      </view>
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" custom-class="rounded-xl" />
        rounded-xl
      </view>
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" custom-class="rounded-2xl" />
        rounded-2xl
      </view>
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" custom-class="rounded-3xl" />
        rounded-3xl
      </view>
      <view class="flex flex-col items-center justify-center">
        <RebornImage :src="src" custom-class="rounded-full" />
        rounded-full
      </view>
    </RebornCard>
  </RebornPage>
</template>
