<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import type { ClQrcodeMode } from '../../ui/reborn-qrcode'
import { eccLevel } from '../../ui/reborn-qrcode'
import RebornSwitch from "../../ui/reborn-switch/RebornSwitch.vue"

const qrConfig = ref({
  text: 'https://www.leyifan.com/',
  margin: 1,
  ecc: eccLevel.H,
  dotsType: 'circular' as ClQrcodeMode,
  dotsColor: '#131313',
  dotsImage: undefined as string | undefined,
  dotsGradient: undefined as any,
  backgroundColor: '#FFFFFF',
  backgroundTransparent: false,
  backgroundGradient: undefined as any,
  logoImage: 'https://cms-image.leyifan.cn/img_reborn/index/icon-calculator.png',
  logoSize: 40,
  logoMargin: 4,
  logoShape: 'circle',
  logoHideBackgroundDots: true,
  logoShadow: false,
  cornersSquareType: 'extra-rounded',
  cornersDotType: 'dot',
})

const tabs = [
  { label: '基础', value: 'basic', icon: 'i-lucide-settings' },
  { label: '颜色', value: 'color', icon: 'i-lucide-palette' },
  { label: '形状', value: 'shape', icon: 'i-lucide-shapes' },
  { label: 'Logo', value: 'logo', icon: 'i-lucide-image' },
  { label: '预设', value: 'preset', icon: 'i-lucide-code' },
]

const activeTab = ref('basic')

const presets = [
  {
    name: '极简黑白',
    config: { dotsColor: '#000000', backgroundColor: '#FFFFFF', dotsType: 'rect', cornersSquareType: 'dot', cornersDotType: 'dot' }
  },
  {
    name: '圆润天蓝',
    config: { dotsColor: '#3b82f6', backgroundColor: '#eff6ff', dotsType: 'circular', cornersSquareType: 'extra-rounded', cornersDotType: 'dot' }
  },
  {
    name: '优雅暗红',
    config: { dotsColor: '#991b1b', backgroundColor: '#fef2f2', dotsType: 'line', cornersSquareType: 'rounded', cornersDotType: 'rect' }
  },
  {
    name: '落日渐变',
    config: {
      dotsGradient: {
        type: 'linear',
        direction: 'diagonal',
        colorStops: [
          { offset: 0, color: '#f59e0b' },
          { offset: 1, color: '#ef4444' }
        ]
      },
      backgroundColor: '#fffbeb',
      dotsType: 'circular'
    }
  },
  {
    name: '星空纹理',
    config: {
      dotsImage: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1000&auto=format&fit=crop',
      backgroundColor: '#000000',
      dotsType: 'rectSmall',
      cornersSquareType: 'rounded',
      cornersDotType: 'extra-rounded'
    }
  }
]

const applyPreset = (preset: any) => {
  // Reset conflicting properties
  qrConfig.value.dotsImage = undefined
  qrConfig.value.dotsGradient = undefined
  qrConfig.value.backgroundGradient = undefined
  Object.assign(qrConfig.value, preset.config)
}

const copyParams = async () => {
  const payload = JSON.stringify(qrConfig.value, null, 2)
  await navigator.clipboard.writeText(payload)
  // Use a simple alert or toast if available
  alert('配置参数已复制到剪贴板')
}

const modeOptions = [
  { label: '圆点', value: 'circular' },
  { label: '直角', value: 'rect' },
  { label: '小直角', value: 'rectSmall' },
  { label: '条纹', value: 'line' }
]

const eccOptions = [
  { label: 'L (7%)', value: eccLevel.L },
  { label: 'M (15%)', value: eccLevel.M },
  { label: 'Q (25%)', value: eccLevel.Q },
  { label: 'H (30%)', value: eccLevel.H }
]

const cornerOptions = [
  { label: '默认', value: 'none' },
  { label: '直角', value: 'rect' },
  { label: '圆角', value: 'rounded' },
  { label: '极圆', value: 'extra-rounded' },
  { label: '圆点', value: 'dot' }
]

const toggleDotsGradient = () => {
  if (qrConfig.value.dotsGradient) {
    qrConfig.value.dotsGradient = undefined
  } else {
    qrConfig.value.dotsImage = undefined
    qrConfig.value.dotsGradient = {
      type: 'linear',
      direction: 'horizontal',
      colorStops: [
        { offset: 0, color: '#3b82f6' },
        { offset: 1, color: '#8b5cf6' }
      ]
    }
  }
}

const toggleBackgroundGradient = () => {
  if (qrConfig.value.backgroundGradient) {
    qrConfig.value.backgroundGradient = undefined
  } else {
    qrConfig.value.backgroundTransparent = false
    qrConfig.value.backgroundGradient = {
      type: 'linear',
      direction: 'vertical',
      colorStops: [
        { offset: 0, color: '#f8fafc' },
        { offset: 1, color: '#e2e8f0' }
      ]
    }
  }
}
</script>

<template>
  <div class="p-6 grid grid-cols-7 gap-4 w-full">

    <!-- 左侧：配置区 -->
    <div class="col-span-4 space-y-6">
      <UCard :ui="{ root: 'overflow-visible!', body: 'p-0! py-2!' }">
        <UTabs v-model="activeTab" :items="tabs" class="w-full" variant="link" size="xs">
          <template #content="{ item }">
            <div class="px-2 space-y-6 min-h-[400px]">
              <!-- 基础配置 -->
              <div v-if="item.value === 'basic'" class="space-y-4">
                <UFormField label="内容" description="输入二维码包含的链接或文本">
                  <RebornTextarea v-model="qrConfig.text" placeholder="https://..." :rows="3" />
                </UFormField>

                <UFormField label="边距">
                  <RebornInputNumber v-model="qrConfig.margin" type="number" :min="0" :max="10" size="md" />
                </UFormField>
                <UFormField label="纠错级别">
                  <RebornSelect v-model="qrConfig.ecc" :options="eccOptions" />
                </UFormField>
              </div>

              <!-- 颜色与视觉配置 -->
              <div v-if="item.value === 'color'" class="space-y-6">
                <UFormField label="主体基准色" description="当不使用渐变或图片时生效">
                  <div class="flex items-center gap-2">
                    <RebornColorPicker v-model="qrConfig.dotsColor" />
                  </div>
                </UFormField>
                <UFormField label="背景颜色">
                  <div class="flex items-center gap-2">
                    <RebornColorPicker v-model="qrConfig.backgroundColor" :disabled="qrConfig.backgroundTransparent" />
                  </div>
                </UFormField>

                <UFormField label="透明背景">
                  <RebornSwitch v-model="qrConfig.backgroundTransparent" active-label="透明背景" inactive-label="不透明背景"
                    :ui="{ track: 'rounded-md', thumb: 'rounded-sm' }" />
                </UFormField>

                <!-- 图片纹理配置 -->
                <UFormField label="前景图片纹理 (URL)" description="覆盖颜色和渐变">
                  <UInput v-model="qrConfig.dotsImage" placeholder="https://images.unsplash.com/..." />
                </UFormField>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">主体视觉特效</span>
                  <div class="flex gap-2">
                    <RebornButton size="xs" :color="qrConfig.dotsGradient ? 'primary' : 'neutral'" variant="soft"
                      @click="toggleDotsGradient">
                      {{ qrConfig.dotsGradient ? '关闭渐变' : '开启渐变' }}
                    </RebornButton>
                  </div>
                </div>

                <!-- 主体渐变配置 -->
                <div v-if="qrConfig.dotsGradient"
                  class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4 border border-gray-100 dark:border-gray-700">
                  <UFormField label="起始颜色">
                    <RebornColorPicker v-model="qrConfig.dotsGradient.colorStops[0].color" size="sm" />
                  </UFormField>
                  <UFormField label="结束颜色">
                    <RebornColorPicker v-model="qrConfig.dotsGradient.colorStops[1].color" size="sm" />
                  </UFormField>
                  <UFormField label="方向">
                    <RebornSelect v-model="qrConfig.dotsGradient.direction"
                      :options="['horizontal', 'vertical', 'diagonal']" />
                  </UFormField>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">背景视觉特效</span>
                  <div class="flex gap-2">
                    <RebornButton size="xs" :color="qrConfig.backgroundGradient ? 'primary' : 'neutral'" variant="soft"
                      @click="toggleBackgroundGradient">
                      {{ qrConfig.backgroundGradient ? '关闭渐变' : '开启背景渐变' }}
                    </RebornButton>
                  </div>
                </div>

                <div v-if="qrConfig.backgroundGradient"
                  class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4 border border-gray-100 dark:border-gray-700">
                  <UFormField label="背景起始色">
                    <RebornColorPicker v-model="qrConfig.backgroundGradient.colorStops[0].color" size="sm" />
                  </UFormField>
                  <UFormField label="背景结束色">
                    <RebornColorPicker v-model="qrConfig.backgroundGradient.colorStops[1].color" size="sm" />
                  </UFormField>
                  <UFormField label="渐变方向">
                    <RebornSelect v-model="qrConfig.backgroundGradient.direction"
                      :options="['horizontal', 'vertical', 'diagonal']" />
                  </UFormField>
                </div>
              </div>

              <!-- 形状配置 -->
              <div v-if="item.value === 'shape'" class="space-y-6">
                <UFormField label="码点形状">
                  <RebornSelect v-model="qrConfig.dotsType" :options="modeOptions" />
                </UFormField>

                <UFormField label="定位点外框">
                  <RebornSelect v-model="qrConfig.cornersSquareType" :options="cornerOptions" />
                </UFormField>
                <UFormField label="定位点中心">
                  <RebornSelect v-model="qrConfig.cornersDotType" :options="cornerOptions" />
                </UFormField>
              </div>

              <!-- Logo 配置 -->
              <div v-if="item.value === 'logo'" class="space-y-4">
                <UFormField label="Logo 链接" description="输入图片 URL 或选择预设（暂不支持上传）">
                  <UInput v-model="qrConfig.logoImage" placeholder="https://..." />
                </UFormField>

                <UFormField label="Logo 大小">
                  <RebornInputNumber v-model="qrConfig.logoSize" :min="20" :max="100" />
                </UFormField>
                <UFormField label="Logo 边距">
                  <RebornInputNumber v-model="qrConfig.logoMargin" :min="0" :max="20" />
                </UFormField>

                <UFormField label="Logo 下方码点">
                  <RebornSwitch v-model="qrConfig.logoHideBackgroundDots" active-label="隐藏" inactive-label="显示" />
                </UFormField>
                <UFormField label="Logo 投影">
                  <RebornSwitch v-model="qrConfig.logoShadow" active-label="开启" inactive-label="关闭" />
                </UFormField>
              </div>

              <!-- 预设配置 -->
              <div v-if="item.value === 'preset'" class="space-y-6">
                <RebornButton v-for="preset in presets" :key="preset.name" variant="solid" size="lg"
                  class="rounded-full" @click="applyPreset(preset)">
                  <span class="text-xs">{{ preset.name }}</span>
                </RebornButton>
              </div>
            </div>
          </template>
        </UTabs>
      </UCard>
    </div>

    <!-- 右侧：预览区 -->
    <div class="col-span-3 sticky top-6 space-y-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">实时预览</h3>
            <div class="flex gap-2">
              <UButton size="xs" color="primary" @click="copyParams">复制参数</UButton>
            </div>
          </div>
        </template>

        <div
          class="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <RebornQrcode :text="qrConfig.text" :foreground="qrConfig.dotsColor" :background="qrConfig.backgroundColor"
            :pd-color="qrConfig.dotsColor" :padding="qrConfig.margin * 5" :mode="qrConfig.dotsType" :ecc="qrConfig.ecc"
            :logo="qrConfig.logoImage" :logo-size="qrConfig.logoSize" :logo-margin="qrConfig.logoMargin"
            :logo-hide-background-dots="qrConfig.logoHideBackgroundDots" :logo-shadow="qrConfig.logoShadow"
            :pd-outer-radius="qrConfig.cornersSquareType === 'rect' ? 0 : qrConfig.cornersSquareType === 'rounded' ? 8 : qrConfig.cornersSquareType === 'extra-rounded' ? 15 : qrConfig.cornersSquareType === 'dot' ? 25 : undefined"
            :pd-inner-radius="qrConfig.cornersDotType === 'rect' ? 0 : qrConfig.cornersDotType === 'rounded' ? 4 : qrConfig.cornersDotType === 'extra-rounded' ? 8 : qrConfig.cornersDotType === 'dot' ? 15 : undefined"
            :background-transparent="qrConfig.backgroundTransparent" :dots-gradient="qrConfig.dotsGradient"
            :dots-image="qrConfig.dotsImage" :background-gradient="qrConfig.backgroundGradient" />
          <div class="mt-8 text-center">
            <p class="text-sm text-gray-400 font-mono break-all px-4 max-w-xs">{{ qrConfig.text }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>