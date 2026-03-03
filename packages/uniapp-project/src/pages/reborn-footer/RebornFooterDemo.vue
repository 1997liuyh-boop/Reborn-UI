<script setup lang="ts">
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornFooter from '@/components/reborn-footer/RebornFooter.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const vt = ref(0)

function refreshFooter() {
  vt.value += 1
}
</script>

<template>
  <RebornPage
    title="Footer 底部操作栏"
    description="用于固定页面底部操作区域，并自动生成占位高度，避免内容被遮挡。"
    custom-class="space-y-3"
  >
    <view
      v-for="item in 20"
      :key="item"
      class="rounded-lg bg-white p-3 text-sm text-gray-7 shadow-sm dark:bg-gray-8 dark:text-gray-2"
    >
      列表示例内容 {{ item }}
    </view>

    <RebornButton @click="refreshFooter">
      刷新 Footer 高度
    </RebornButton>

    <RebornFooter :vt="vt">
      <view class="flex items-center gap-2">
        <RebornButton color="neutral" class="flex-1">
          取消
        </RebornButton>
        <RebornButton class="flex-1">
          提交
        </RebornButton>
      </view>
    </RebornFooter>
  </RebornPage>
</template>
