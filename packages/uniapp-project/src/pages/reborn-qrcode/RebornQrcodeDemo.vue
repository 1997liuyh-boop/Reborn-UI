<script setup lang="ts">
import { ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornQrcode from '@/components/reborn-qrcode/RebornQrcode.vue'

const text = ref('https://reborn-ui.vercel.app')
const color = ref('#111827')
const bgColor = ref('#ffffff')
const size = ref(240)
const bordered = ref(true)
const icon = ref('/static/logo.png')
const qrcodeRef = ref<any>()

function exportQrCode() {
  qrcodeRef.value?.canvasToTempFilePath?.()
}

function onSuccess(path: string) {
  uni.showToast({
    title: '二维码已生成',
    icon: 'success',
  })
  uni.previewImage({ urls: [path], current: path })
}
</script>

<template>
  <RebornPage title="二维码" description="支持颜色、尺寸、边距和中心 Logo 的二维码组件。">
    <RebornCard title="预览" custom-class="items-center">
      <view class="flex w-full flex-col items-center gap-4">
        <RebornQrcode
          ref="qrcodeRef" :value="text" :size="size" :color="color" :bg-color="bgColor" :bordered="bordered"
          :icon="icon" :use-canvas-to-temp-file-path="true" @success="onSuccess"
        />
        <RebornButton @tap="exportQrCode">
          导出二维码
        </RebornButton>
      </view>
    </RebornCard>

    <RebornCard title="配置" custom-class="flex flex-col gap-3">
      <view class="text-sm text-slate-500">
        内容
      </view>
      <RebornInput v-model="text" placeholder="请输入二维码内容" />

      <view class="grid grid-cols-2 gap-3">
        <view class="flex flex-col gap-2">
          <view class="text-sm text-slate-500">
            前景色
          </view>
          <RebornInput v-model="color" placeholder="#000000" />
        </view>
        <view class="flex flex-col gap-2">
          <view class="text-sm text-slate-500">
            背景色
          </view>
          <RebornInput v-model="bgColor" placeholder="#ffffff" />
        </view>
      </view>
    </RebornCard>
  </RebornPage>
</template>
