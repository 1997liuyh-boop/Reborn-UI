<script setup lang="ts">
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'

function go(path: string) {
  uni.navigateTo({
    url: path,
  })
}
</script>

<template>
  <RebornPage title="Demo 组件演示入口">
    <RebornCard title="反馈类组件">
      <view class="flex flex-col gap-3">
        <RebornButton @click="go('/pages/demo/feedback/index')">
          进入反馈组件 Demo
        </RebornButton>
      </view>
    </RebornCard>
  </RebornPage>
</template>
