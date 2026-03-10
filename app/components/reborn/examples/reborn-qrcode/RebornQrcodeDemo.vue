<script setup lang="ts">
import type { ClQrcodeMode } from '../../ui/reborn-qrcode'
import { computed, ref } from 'vue'
import { eccLevel } from '../../ui/reborn-qrcode'

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
  { label: '数据', value: 'data', icon: 'i-lucide-code-2' }
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

const propsPreview = computed(() => JSON.stringify(qrConfig.value, null, 2))

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
  <div class="p-6 max-w-7xl mx-auto">
    <div
      class="mb-8 overflow-hidden rounded-2xl bg-linear-to-r from-primary-500 to-secondary-500 p-8 text-white shadow-xl">
      <h1 class="text-3xl font-bold mb-2">二维码生成器</h1>
      <p class="opacity-90">自定义您的个性化二维码，支持多种形状、颜色、渐变及 Logo 嵌入。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- 左侧：配置区 -->
      <div class="lg:col-span-7 space-y-6">
        <UCard :ui="{ body: 'p-0' }">
          <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #content="{ item }">
              <div class="p-6 space-y-6 min-h-[400px]">
                <!-- 基础配置 -->
                <div v-if="item.value === 'basic'" class="space-y-4">
                  <UFormField label="内容" description="输入二维码包含的链接或文本">
                    <UTextarea v-model="qrConfig.text" placeholder="https://..." :rows="3" />
                  </UFormField>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField label="边距">
                      <UInput v-model="qrConfig.margin" type="number" :min="0" :max="10" />
                    </UFormField>
                    <UFormField label="纠错级别">
                      <USelect v-model="qrConfig.ecc" :items="eccOptions" />
                    </UFormField>
                  </div>
                </div>

                <!-- 颜色与视觉配置 -->
                <div v-if="item.value === 'color'" class="space-y-6">
                  <div class="grid grid-cols-2 gap-4">
                    <UFormField label="主体基准色" description="当不使用渐变或图片时生效">
                      <div class="flex items-center gap-2">
                        <UInput v-model="qrConfig.dotsColor" type="color" class="w-12 h-10 p-0" />
                        <UInput v-model="qrConfig.dotsColor" placeholder="#000000" class="flex-1" />
                      </div>
                    </UFormField>
                    <UFormField label="背景颜色">
                      <div class="flex items-center gap-2">
                        <UInput v-model="qrConfig.backgroundColor" type="color" class="w-12 h-10 p-0"
                          :disabled="qrConfig.backgroundTransparent" />
                        <UInput v-model="qrConfig.backgroundColor" placeholder="#FFFFFF" class="flex-1"
                          :disabled="qrConfig.backgroundTransparent" />
                      </div>
                    </UFormField>
                  </div>

                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">主体视觉特效</span>
                      <div class="flex gap-2">
                        <UButton size="xs" :color="qrConfig.dotsGradient ? 'primary' : 'neutral'" variant="ghost"
                          @click="toggleDotsGradient">
                          {{ qrConfig.dotsGradient ? '关闭渐变' : '开启渐变' }}
                        </UButton>
                      </div>
                    </div>

                    <!-- 主体渐变配置 -->
                    <div v-if="qrConfig.dotsGradient"
                      class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4 border border-gray-100 dark:border-gray-700">
                      <div class="grid grid-cols-2 gap-4">
                        <UFormField label="起始颜色">
                          <UInput v-model="qrConfig.dotsGradient.colorStops[0].color" type="color" />
                        </UFormField>
                        <UFormField label="结束颜色">
                          <UInput v-model="qrConfig.dotsGradient.colorStops[1].color" type="color" />
                        </UFormField>
                      </div>
                      <UFormField label="方向">
                        <USelect v-model="qrConfig.dotsGradient.direction"
                          :items="['horizontal', 'vertical', 'diagonal']" />
                      </UFormField>
                    </div>

                    <!-- 图片纹理配置 -->
                    <UFormField label="前景图片纹理 (URL)" description="覆盖颜色和渐变">
                      <UInput v-model="qrConfig.dotsImage" placeholder="https://images.unsplash.com/..." />
                    </UFormField>
                  </div>

                  <div class="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">背景视觉特效</span>
                      <div class="flex gap-2">
                        <UButton size="xs" :color="qrConfig.backgroundGradient ? 'primary' : 'neutral'" variant="ghost"
                          @click="toggleBackgroundGradient">
                          {{ qrConfig.backgroundGradient ? '关闭渐变' : '开启背景渐变' }}
                        </UButton>
                      </div>
                    </div>

                    <!-- 背景渐变配置 -->
                    <div v-if="qrConfig.backgroundGradient"
                      class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4 border border-gray-100 dark:border-gray-700">
                      <div class="grid grid-cols-2 gap-4">
                        <UFormField label="背景起始色">
                          <UInput v-model="qrConfig.backgroundGradient.colorStops[0].color" type="color" />
                        </UFormField>
                        <UFormField label="背景结束色">
                          <UInput v-model="qrConfig.backgroundGradient.colorStops[1].color" type="color" />
                        </UFormField>
                      </div>
                      <UFormField label="渐变方向">
                        <USelect v-model="qrConfig.backgroundGradient.direction"
                          :items="['horizontal', 'vertical', 'diagonal']" />
                      </UFormField>
                    </div>
                  </div>

                  <UCheckbox v-model="qrConfig.backgroundTransparent" label="透明背景" />
                </div>

                <!-- 形状配置 -->
                <div v-if="item.value === 'shape'" class="space-y-6">
                  <UFormField label="码点形状">
                    <USelect v-model="qrConfig.dotsType" :items="modeOptions" />
                  </UFormField>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField label="定位点外框">
                      <USelect v-model="qrConfig.cornersSquareType" :items="cornerOptions" />
                    </UFormField>
                    <UFormField label="定位点中心">
                      <USelect v-model="qrConfig.cornersDotType" :items="cornerOptions" />
                    </UFormField>
                  </div>
                </div>

                <!-- Logo 配置 -->
                <div v-if="item.value === 'logo'" class="space-y-4">
                  <UFormField label="Logo 链接" description="输入图片 URL 或选择预设（暂不支持上传）">
                    <UInput v-model="qrConfig.logoImage" placeholder="https://..." />
                  </UFormField>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Logo 大小">
                      <UInput v-model="qrConfig.logoSize" type="number" :min="20" :max="100" />
                    </UFormField>
                    <UFormField label="Logo 边距">
                      <UInput v-model="qrConfig.logoMargin" type="number" :min="0" :max="20" />
                    </UFormField>
                  </div>

                  <div class="flex flex-wrap gap-4">
                    <UCheckbox v-model="qrConfig.logoHideBackgroundDots" label="隐藏 Logo 下方码点" />
                    <UCheckbox v-model="qrConfig.logoShadow" label="开启投影" />
                  </div>
                </div>

                <!-- 数据查看 -->
                <div v-if="item.value === 'data'" class="space-y-4">
                  <div class="relative group">
                    <UTextarea :model-value="propsPreview" :rows="15" readonly
                      class="font-mono text-sm bg-gray-50 dark:bg-gray-900" />
                    <UButton icon="i-lucide-copy" variant="ghost" color="neutral"
                      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="copyParams">
                      复制
                    </UButton>
                  </div>
                </div>
              </div>
            </template>
          </UTabs>
        </UCard>

        <!-- 预设展示 -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">推荐展示 (Presets)</h3>
          <div class="grid grid-cols-3 gap-4">
            <UButton v-for="preset in presets" :key="preset.name" variant="outline" block
              class="h-16 flex flex-col items-center justify-center gap-1" @click="applyPreset(preset)">
              <span class="text-xs">{{ preset.name }}</span>
            </UButton>
          </div>
        </div>
      </div>

      <!-- 右侧：预览区 -->
      <div class="lg:col-span-5">
        <div class="sticky top-6 space-y-6">
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
              <RebornQrcode :text="qrConfig.text" :foreground="qrConfig.dotsColor"
                :background="qrConfig.backgroundColor" :pd-color="qrConfig.dotsColor" :padding="qrConfig.margin * 5"
                :mode="qrConfig.dotsType" :ecc="qrConfig.ecc" :logo="qrConfig.logoImage" :logo-size="qrConfig.logoSize"
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
    </div>
  </div>
</template>