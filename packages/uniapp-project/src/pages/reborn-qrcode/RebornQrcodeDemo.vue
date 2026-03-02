<script setup lang="ts">
import { computed, ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornQrcode from '@/components/reborn-qrcode/RebornQrcode.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

type TabId = 'basic' | 'color' | 'logo'

const qrcodeRef = ref<any>()
const activeTab = ref<TabId>('basic')

const qrConfig = ref({
  value: 'https://www.example.com',
  size: 240,
  color: '#000000',
  bgColor: '#ffffff',
  icon: '/static/logo.png',
  iconSize: 42,
  bordered: true,
  marginSize: 8,
  errorLevel: 'H' as ErrorLevel,
})

const tabs = [
  { id: 'basic' as const, name: '基础' },
  { id: 'color' as const, name: '颜色' },
  { id: 'logo' as const, name: 'Logo' },
]

const marginOptions = [0, 4, 8, 12]
const sizeOptions = [180, 220, 240, 280, 320]
const errorLevels: ErrorLevel[] = ['L', 'M', 'Q', 'H']

const activeExportLabel = computed(() => `${qrConfig.value.size}×${qrConfig.value.size}`)

function switchTab(tab: TabId) {
  activeTab.value = tab
}

function setMargin(marginSize: number) {
  qrConfig.value.marginSize = marginSize
}

function setErrorLevel(level: ErrorLevel) {
  qrConfig.value.errorLevel = level
}

function setSize(size: number) {
  qrConfig.value.size = size
}

function onExportSuccess() {
  uni.showToast({
    title: '二维码已导出',
    icon: 'success',
  })
}

function saveQRCode() {
  qrcodeRef.value?.canvasToTempFilePath?.()
}

function shareQRCode() {
  qrcodeRef.value?.canvasToTempFilePath?.()
  uni.showToast({
    title: '请在相册中选择二维码分享',
    icon: 'none',
  })
}

function resetConfig() {
  qrConfig.value = {
    value: 'https://www.example.com',
    size: 240,
    color: '#000000',
    bgColor: '#ffffff',
    icon: '/static/logo.png',
    iconSize: 42,
    bordered: true,
    marginSize: 8,
    errorLevel: 'H',
  }
}
</script>

<template>
  <RebornPage title="二维码" description="参考配置面板示例：预览、操作、分区配置（twcss）。">
    <view class="flex flex-col gap-4">
      <RebornCard title="预览与操作" custom-class="flex flex-col gap-4">
        <view class="flex flex-col gap-4 md:flex-row">
          <view class="flex size-[260px] items-center justify-center rounded-xl border border-gray-2 bg-gray-1 p-2">
            <RebornQrcode
              ref="qrcodeRef" :value="qrConfig.value.value" :size="qrConfig.value.size" :color="qrConfig.value.color"
              :bg-color="qrConfig.value.bgColor" :icon="qrConfig.value.icon" :icon-size="qrConfig.value.iconSize"
              :bordered="qrConfig.value.bordered" :margin-size="qrConfig.value.marginSize"
              :error-level="qrConfig.value.errorLevel" @success="onExportSuccess"
            />
          </view>

          <view class="flex flex-1 flex-col gap-3">
            <view class="rounded-lg bg-gray-1 p-3 text-sm text-gray-6">
              导出尺寸：{{ activeExportLabel }}
            </view>
            <view class="grid grid-cols-3 gap-2">
              <RebornButton size="sm" @tap="saveQRCode">
                保存
              </RebornButton>
              <RebornButton size="sm" variant="outline" @tap="shareQRCode">
                分享
              </RebornButton>
              <RebornButton size="sm" variant="soft" color="warning" @tap="resetConfig">
                重置
              </RebornButton>
            </view>
          </view>
        </view>
      </RebornCard>

      <RebornCard title="配置面板" custom-class="flex flex-col gap-4">
        <view class="grid grid-cols-3 gap-2 rounded-lg bg-gray-1 p-1">
          <view
            v-for="tab in tabs" :key="tab.id"
            class="rounded-md px-3 py-2 text-center text-sm font-medium"
            :class="activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-gray-6'" @tap="switchTab(tab.id)"
          >
            {{ tab.name }}
          </view>
        </view>

        <view v-if="activeTab === 'basic'" class="flex flex-col gap-4">
          <view class="flex flex-col gap-2">
            <view class="text-sm text-gray-6">
              二维码内容
            </view>
            <RebornInput v-model="qrConfig.value.value" placeholder="请输入网址或文本内容" />
          </view>

          <view class="grid grid-cols-2 gap-3">
            <view class="flex flex-col gap-2">
              <view class="text-sm text-gray-6">
                尺寸
              </view>
              <view class="flex flex-wrap gap-2">
                <view
                  v-for="item in sizeOptions" :key="item" class="rounded-md border px-2 py-1 text-xs"
                  :class="qrConfig.value.size === item ? 'border-primary bg-primary/10 text-primary' : 'border-gray-2 text-gray-6'"
                  @tap="setSize(item)"
                >
                  {{ item }}
                </view>
              </view>
            </view>

            <view class="flex flex-col gap-2">
              <view class="text-sm text-gray-6">
                外边距
              </view>
              <view class="flex flex-wrap gap-2">
                <view
                  v-for="item in marginOptions" :key="item" class="rounded-md border px-2 py-1 text-xs"
                  :class="qrConfig.value.marginSize === item ? 'border-primary bg-primary/10 text-primary' : 'border-gray-2 text-gray-6'"
                  @tap="setMargin(item)"
                >
                  {{ item }}
                </view>
              </view>
            </view>
          </view>

          <view class="flex flex-col gap-2">
            <view class="text-sm text-gray-6">
              容错等级
            </view>
            <view class="flex gap-2">
              <view
                v-for="level in errorLevels" :key="level" class="rounded-md border px-3 py-1 text-sm"
                :class="qrConfig.value.errorLevel === level ? 'border-primary bg-primary/10 text-primary' : 'border-gray-2 text-gray-6'"
                @tap="setErrorLevel(level)"
              >
                {{ level }}
              </view>
            </view>
          </view>
        </view>

        <view v-if="activeTab === 'color'" class="grid grid-cols-2 gap-3">
          <view class="flex flex-col gap-2">
            <view class="text-sm text-gray-6">
              前景色
            </view>
            <RebornInput v-model="qrConfig.value.color" placeholder="#000000" />
          </view>
          <view class="flex flex-col gap-2">
            <view class="text-sm text-gray-6">
              背景色
            </view>
            <RebornInput v-model="qrConfig.value.bgColor" placeholder="#ffffff" />
          </view>
        </view>

        <view v-if="activeTab === 'logo'" class="flex flex-col gap-4">
          <view class="flex flex-col gap-2">
            <view class="text-sm text-gray-6">
              Logo 图片地址
            </view>
            <RebornInput v-model="qrConfig.value.icon" placeholder="/static/logo.png" />
          </view>
          <view class="grid grid-cols-2 gap-3">
            <view class="flex flex-col gap-2">
              <view class="text-sm text-gray-6">
                Logo 尺寸
              </view>
              <RebornInput v-model="qrConfig.value.iconSize" type="number" placeholder="42" />
            </view>
            <view class="flex items-end justify-between rounded-lg border border-gray-2 p-3">
              <view class="text-sm text-gray-6">
                显示边框
              </view>
              <RebornSwitch v-model="qrConfig.value.bordered" size="sm" />
            </view>
          </view>
        </view>
      </RebornCard>
    </view>
  </RebornPage>
</template>
