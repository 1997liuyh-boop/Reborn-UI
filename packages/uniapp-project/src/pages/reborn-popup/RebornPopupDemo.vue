<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornPopup from '@/components/reborn-popup/RebornPopup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import type { PopupPosition } from '@/components/reborn-popup/reborn-popup.config'

const direction = ref<PopupPosition>('bottom')
const show = ref(false)
const showMask = ref(true)
const showHeader = ref(true)
const showClose = ref(true)
const swipeClose = ref(true)
const rounded = ref(true)
const src = ref('https://cms-image.leyifan.cn/img_reborn/ques-4.jpg')
const directions: { label: string; value: PopupPosition }[] = [
  { label: '底部', value: 'bottom' },
  { label: '顶部', value: 'top' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
  { label: '中间', value: 'center' },
]
</script>

<template>
  <RebornPage title="Popup 弹出层">
    <RebornCard title="基础用法">
      <view class="flex flex-col gap-4">
        <view class="text-sm text-gray-500">
          方向：
        </view>
        <RebornRadioGroup v-model="direction" :options="directions">
          <RebornRadio v-for="d in directions" :key="d.value" :value="d.value" :label="d.label" />
        </RebornRadioGroup>
        <view class="text-sm text-gray-500 flex items-center gap-2 justify-between">
          是否显示遮罩：
          <RebornSwitch v-model="showMask" activeLabel="显示" inactiveLabel="隐藏" />
        </view>
        <view class="text-sm text-gray-500 flex items-center gap-2 justify-between">
          是否显示头部：
          <RebornSwitch v-model="showHeader" activeLabel="显示" inactiveLabel="隐藏" />
        </view>
        <view class="text-sm text-gray-500 flex items-center gap-2 justify-between">
          是否显示关闭按钮：
          <RebornSwitch v-model="showClose" activeLabel="显示" inactiveLabel="隐藏" />
        </view>
        <view class="text-sm text-gray-500 flex items-center gap-2 justify-between">
          是否显示拖拽关闭：
          <RebornSwitch v-model="swipeClose" activeLabel="显示" inactiveLabel="隐藏" />
        </view>
        <view class="text-sm text-gray-500 flex items-center gap-2 justify-between">
          是否圆角：
          <RebornSwitch v-model="rounded" activeLabel="显示" inactiveLabel="隐藏" />
        </view>
        <RebornButton @click="show = true">打开弹窗</RebornButton>
      </view>
    </RebornCard>

    <RebornPopup v-model="show" :direction="direction" :show-mask="showMask" :show-header="showHeader"
      :show-close="showClose" :swipe-close="swipeClose" :rounded="rounded">
      <template #header>
        <text class="text-24 text-gray-9">方向：{{ direction }}</text>
      </template>
      <view class="p-4 h-full flex items-center justify-center bg-white">
        <RebornImage :src="src" preview width="400" height="400" />
      </view>
    </RebornPopup>
  </RebornPage>
</template>
