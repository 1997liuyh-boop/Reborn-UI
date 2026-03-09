<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'
import RebornOverlay from '@/components/reborn-overlay/RebornOverlay.vue'
import RebornLoading from '@/components/reborn-loading/RebornLoading.vue'
import RebornToast from '@/components/reborn-toast/RebornToast.vue'
import RebornLoadmore from '@/components/reborn-loadmore/RebornLoadmore.vue'
import { useToast } from '@/components/reborn-toast'

const showTransition = ref(false)
const showOverlay = ref(false)
const loadState = ref<'loading' | 'error' | 'finished'>('loading')

const toast = useToast()

function nextState() {
  loadState.value = loadState.value === 'loading' ? 'error' : loadState.value === 'error' ? 'finished' : 'loading'
}
</script>

<template>
  <RebornPage title="Feedback 反馈组件">
    <RebornCard title="Transition / Overlay">
      <view class="flex gap-3">
        <RebornButton @click="showTransition = !showTransition">切换 Transition</RebornButton>
        <RebornButton color="secondary" @click="showOverlay = !showOverlay">切换 Overlay</RebornButton>
      </view>
      <RebornTransition :show="showTransition" name="zoom-in" custom-class="mt-3 rounded-lg bg-blue-50 p-3 text-blue-600">
        我是 reborn-transition
      </RebornTransition>
      <RebornOverlay :show="showOverlay" :z-index="20" @click="showOverlay = false" />
    </RebornCard>

    <RebornCard title="Loading">
      <view class="flex items-center gap-4">
        <RebornLoading type="outline" />
        <RebornLoading type="ring" color="#22c55e" />
        <RebornLoading type="spinner" color="#f97316" />
      </view>
    </RebornCard>

    <RebornCard title="Toast">
      <view class="flex flex-wrap gap-3">
        <RebornButton @click="toast.success('操作成功')">success</RebornButton>
        <RebornButton color="warning" @click="toast.warning('注意风险')">warning</RebornButton>
        <RebornButton color="error" @click="toast.error('操作失败')">error</RebornButton>
        <RebornButton color="secondary" @click="toast.loading('加载中...')">loading</RebornButton>
      </view>
      <RebornToast />
    </RebornCard>

    <RebornCard title="Loadmore">
      <RebornButton @click="nextState">切换状态: {{ loadState }}</RebornButton>
      <RebornLoadmore class="mt-3" :state="loadState" @reload="loadState = 'loading'" />
    </RebornCard>
  </RebornPage>
</template>
