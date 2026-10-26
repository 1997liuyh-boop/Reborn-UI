<script setup lang="ts">
import type { ColorTarget, QrConfig, QrGradient } from './types'
import { computed, ref, shallowRef } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { eccLevel } from '@/components/reborn-qrcode/draw'
import RebornTabPane from '@/components/reborn-tabs/RebornTabPane.vue'
import RebornTabs from '@/components/reborn-tabs/RebornTabs.vue'
import bg1 from '@/static/1.jpeg'
import bg2 from '@/static/2.jpeg'
import bg3 from '@/static/3.jpeg'
import bg4 from '@/static/4.jpeg'
import bg5 from '@/static/5.jpeg'
import bg6 from '@/static/6.jpeg'
import ColorPickerModal from './components/ColorPickerModal.vue'
import ConfigBackground from './components/ConfigBackground.vue'
import ConfigBasic from './components/ConfigBasic.vue'
import ConfigColor from './components/ConfigColor.vue'
import ConfigData from './components/ConfigData.vue'
import ConfigLogo from './components/ConfigLogo.vue'
import ConfigShape from './components/ConfigShape.vue'
import ForegroundImageModal from './components/ForegroundImageModal.vue'
import GradientEditorModal from './components/GradientEditorModal.vue'
import PreviewSection from './components/PreviewSection.vue'
import { createDefaultConfig } from './types'

const previewRef = ref<InstanceType<typeof PreviewSection> | null>(null)
const activeTab = shallowRef('basic')
const isGenerating = shallowRef(false)
const qrConfig = shallowRef<QrConfig>(createDefaultConfig())
const tabs = [
  { label: '基础', value: 'basic' }, { label: '颜色', value: 'color' },
  { label: '形状', value: 'shape' }, { label: '背景', value: 'background' },
  { label: 'Logo', value: 'logo' }, { label: '数据', value: 'data' },
] as const
const marginOptions = [{ value: 0, name: '无' }, { value: 1, name: '小' }, { value: 2, name: '中' }, { value: 3, name: '大' }] as const
const errorLevels = [
  { value: eccLevel.L, name: 'L (7%)' }, { value: eccLevel.M, name: 'M (15%)' },
  { value: eccLevel.Q, name: 'Q (25%)' }, { value: eccLevel.H, name: 'H (30%)' },
] as const
const dotsStyles = [{ type: 'rect', name: '普通' }, { type: 'circular', name: '圆形' }, { type: 'rectSmall', name: '瓷砖' }, { type: 'line', name: '线性' }] as const
const cornersSquareStyles = [{ type: 0, name: '方形' }, { type: 20, name: '圆形' }, { type: 10, name: '圆角' }] as const
const cornersDotStyles = [{ type: 0, name: '方形' }, { type: 5, name: '圆角' }, { type: 10, name: '圆形' }] as const
const logoSizeOptions = [{ value: 'small', name: '小' }, { value: 'medium', name: '中' }, { value: 'large', name: '大' }] as const
const logoMarginOptions = [{ value: 'none', name: '无' }, { value: 'small', name: '小' }, { value: 'medium', name: '中' }, { value: 'large', name: '大' }] as const
const showColorPickerModal = shallowRef(false)
const showGradientEditorModal = shallowRef(false)
const showForegroundImageModal = shallowRef(false)
const colorTarget = shallowRef<ColorTarget>('foreground')
const gradientTarget = shallowRef<ColorTarget>('foreground')
const selectedColor = computed(() => colorTarget.value === 'foreground' ? qrConfig.value.dotsColor : qrConfig.value.backgroundColor)
const selectedGradient = computed(() => gradientTarget.value === 'foreground' ? qrConfig.value.dotsGradient : qrConfig.value.backgroundGradient)
const modalOpen = computed(() => showColorPickerModal.value || showGradientEditorModal.value || showForegroundImageModal.value)
const predefinedForegroundImages = [
  { id: 1, name: '纹理1', path: bg1 }, { id: 2, name: '纹理2', path: bg2 },
  { id: 3, name: '纹理3', path: bg3 }, { id: 4, name: '纹理4', path: bg4 },
  { id: 5, name: '纹理5', path: bg5 }, { id: 6, name: '纹理6', path: bg6 },
] as const

function patchConfig(patch: Partial<QrConfig>) {
  qrConfig.value = { ...qrConfig.value, ...patch }
}
function showColorPicker(target: ColorTarget) {
  colorTarget.value = target
  showColorPickerModal.value = true
}
function applyColor(color: string) {
  patchConfig(colorTarget.value === 'foreground'
    ? { dotsColor: color, dotsImage: null, dotsGradient: null }
    : { backgroundColor: color, backgroundTransparent: false, backgroundGradient: null })
}
function showGradientEditor(target: ColorTarget) {
  gradientTarget.value = target
  showGradientEditorModal.value = true
}
function applyGradient(gradient: QrGradient) {
  patchConfig(gradientTarget.value === 'foreground'
    ? { dotsGradient: gradient, dotsColor: '#000000', dotsImage: null }
    : { backgroundGradient: gradient, backgroundColor: '#ffffff', backgroundTransparent: false })
}
function setTransparent() {
  patchConfig({ backgroundTransparent: true, backgroundColor: 'transparent', backgroundGradient: null })
}
/** 选用前景图：只换图并清掉渐变，保留 dotsColor（码眼外框、内点与 pdColor 仍取这个颜色） */
function applyForegroundImage(image: string) {
  patchConfig({ dotsImage: image, dotsGradient: null })
}
/** 清除前景图：回到纯色前景，颜色复位为黑色 */
function clearForegroundImage() {
  patchConfig({ dotsImage: null, dotsColor: '#000000' })
}
/** 前景图弹窗「应用」：有图走选图；草稿为空且当前确有前景图才走清除，没选图直接应用不改颜色 */
function onForegroundImageApply(image: string | null) {
  if (image) applyForegroundImage(image)
  else if (qrConfig.value.dotsImage) clearForegroundImage()
}
function removeLogo() { patchConfig({ logoImage: null }) }
function uploadLogo() {
  uni.chooseImage({ count: 1, success: result => patchConfig({ logoImage: result.tempFilePaths[0] ?? null }) })
}
function selectPredefinedLogo(image: string) {
  patchConfig({ logoImage: image })
  uni.showToast({ title: '已选择', icon: 'success' })
}
function resetConfig() { qrConfig.value = createDefaultConfig() }

async function saveQRCode() {
  if (isGenerating.value || !previewRef.value) return
  try {
    isGenerating.value = true
    const path = await previewRef.value.toPng()
    if (!path) throw new Error('二维码尚未绘制完成')
    // #ifdef MP-WEIXIN || APP-PLUS
    uni.saveImageToPhotosAlbum({ filePath: path, success: () => uni.showToast({ title: '保存成功', icon: 'success' }) })
    // #endif
    // #ifdef H5
    const anchor = document.createElement('a')
    anchor.href = path
    anchor.download = 'qrcode.png'
    anchor.click()
    // #endif
  }
  catch {
    uni.showToast({ title: '保存失败', icon: 'error' })
  }
  finally { isGenerating.value = false }
}
async function shareQRCode() {
  if (isGenerating.value || !previewRef.value) return
  try {
    isGenerating.value = true
    const path = await previewRef.value.toPng()
    if (!path) throw new Error('二维码尚未绘制完成')
    // #ifdef MP-WEIXIN
    uni.showShareImageMenu({ path })
    // #endif
    // #ifdef H5
    uni.showToast({ title: '长按保存或复制', icon: 'none' })
    // #endif
  }
  catch { uni.showToast({ title: '分享失败', icon: 'error' }) }
  finally { isGenerating.value = false }
}
</script>

<template>
  <RebornPage title="二维码">
    <view class="flex w-full flex-col">
      <PreviewSection ref="previewRef" :config="qrConfig"
                      :is-generating="isGenerating" :modal-open="modalOpen"
                      @save="saveQRCode" @share="shareQRCode" @reset="resetConfig" />
      <view class="mt-[24rpx] overflow-hidden rounded-[24rpx] bg-white shadow-[0_4rpx_20rpx_rgba(0,0,0,0.08)]">
        <RebornTabs v-model:active-key="activeTab" size="md" hide-content>
          <RebornTabPane v-for="(tab, paneIndex) in tabs" :key="tab.value" :order="paneIndex" :pane-key="tab.value" :title="tab.label" />
        </RebornTabs>
        <view class="p-[32rpx]">
          <ConfigBasic v-if="activeTab === 'basic'" v-model="qrConfig" :margin-options="marginOptions" :error-levels="errorLevels" />
          <ConfigColor v-if="activeTab === 'color'" :config="qrConfig" @show-color-picker="showColorPicker"
                       @show-gradient-editor="showGradientEditor" @show-image-picker="showForegroundImageModal = true" />
          <ConfigShape v-if="activeTab === 'shape'" v-model="qrConfig" :dots-styles="dotsStyles"
                       :corners-square-styles="cornersSquareStyles" :corners-dot-styles="cornersDotStyles" />
          <ConfigBackground v-if="activeTab === 'background'" :config="qrConfig" @show-color-picker="showColorPicker"
                            @show-gradient-editor="showGradientEditor" @set-transparent="setTransparent" />
          <ConfigLogo v-if="activeTab === 'logo'" v-model="qrConfig" :logo-size-options="logoSizeOptions"
                      :logo-margin-options="logoMarginOptions" @upload-logo="uploadLogo" @remove-logo="removeLogo" @select-predefined-logo="selectPredefinedLogo" />
          <ConfigData v-if="activeTab === 'data'" :config="qrConfig" />
        </view>
      </view>
    </view>
    <ColorPickerModal v-model:open="showColorPickerModal" :color="selectedColor" @apply="applyColor" />
    <GradientEditorModal v-model:open="showGradientEditorModal" :gradient="selectedGradient"
                         :background="gradientTarget === 'background'" @apply="applyGradient" />
    <ForegroundImageModal v-model:open="showForegroundImageModal" :image="qrConfig.dotsImage"
                          :images="predefinedForegroundImages" @apply="onForegroundImageApply" />
  </RebornPage>
</template>
