<script setup lang="ts">
import { ref, computed } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornTabs from '@/components/reborn-tabs/RebornTabs.vue'
import { eccLevel } from '@/components/reborn-qrcode/draw'

// Sub-components
import PreviewSection from './components/PreviewSection.vue'
import ConfigBasic from './components/ConfigBasic.vue'
import ConfigColor from './components/ConfigColor.vue'
import ConfigShape from './components/ConfigShape.vue'
import ConfigBackground from './components/ConfigBackground.vue'
import ConfigLogo from './components/ConfigLogo.vue'
import ConfigData from './components/ConfigData.vue'
import EditorModals from './components/EditorModals.vue'

import bg1 from '@/static/1.jpeg'
import bg2 from '@/static/2.jpeg'
import bg3 from '@/static/3.jpeg'
import bg4 from '@/static/4.jpeg'
import bg5 from '@/static/5.jpeg'
import bg6 from '@/static/6.jpeg'

const qrcodeRef = ref<any>(null)
const activeTab = ref('basic')
const isGenerating = ref(false)

const qrConfig = ref({
    text: 'https://www.leyifan.com/',
    margin: 1,
    ecc: eccLevel.H,
    // Dots
    dotsType: 'square',
    dotsColor: '#000000',
    dotsImage: null as string | null,
    dotsGradient: null as any,
    // Background
    backgroundColor: '#ffffff',
    backgroundTransparent: false,
    backgroundGradient: null as any,
    // Corners
    cornersSquareType: 0,
    cornersSquareGradient: null as any,
    cornersDotType: 0,
    cornersDotGradient: null as any,
    // Logo
    logoImage: null as string | null,
    logoSize: 'medium',
    logoMargin: 'small',
    logoShape: 'rectangle',
    logoHideBackgroundDots: true,
    logoShadow: false
})

const tabs = ref([
    { label: '基础', value: 'basic' },
    { label: '颜色', value: 'color' },
    { label: '形状', value: 'shape' },
    { label: '背景', value: 'background' },
    { label: 'Logo', value: 'logo' },
    { label: '数据', value: 'data' }
])

// Options
const marginOptions = ref([
    { value: 0, name: '无' }, { value: 1, name: '小' }, { value: 2, name: '中' }, { value: 3, name: '大' }
])
const errorLevels = ref([
    { value: eccLevel.L, name: 'L (7%)' }, { value: eccLevel.M, name: 'M (15%)' }, { value: eccLevel.Q, name: 'Q (25%)' }, { value: eccLevel.H, name: 'H (30%)' }
])
const dotsStyles = ref([
    { type: 'rect', name: '普通' }, { type: 'circular', name: '圆形' }, { type: 'rectSmall', name: '瓷砖' }, { type: 'line', name: '线性' }
])
const cornersSquareStyles = ref([
    { type: 0, name: '方形' }, { type: 20, name: '圆形' }, { type: 10, name: '圆角' }
])
const cornersDotStyles = ref([
    { type: 0, name: '方形' }, { type: 5, name: '圆角' }, { type: 10, name: '圆形' }
])
const logoSizeOptions = ref([
    { value: 'small', name: '小' }, { value: 'medium', name: '中' }, { value: 'large', name: '大' }
])
const logoMarginOptions = ref([
    { value: 'none', name: '无' }, { value: 'small', name: '小' }, { value: 'medium', name: '中' }, { value: 'large', name: '大' }
])

const exportSizeOptions = ref([
    { label: '500×500', width: 500, height: 500 },
    { label: '750×750', width: 750, height: 750 },
    { label: '1000×1000', width: 1000, height: 1000 }
])
const dropdownOptions = computed(() => exportSizeOptions.value.map((item, index) => ({
    label: item.label, value: index
})))
const exportSizeIndex = ref(0)

// Modal States
const showColorPickerModal = ref(false)
const showGradientEditorModal = ref(false)
const showForegroundImageModal = ref(false)
const selectedColor = ref('#000000')
const colorPickerType = ref('')
const colorPalette = ref([
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff4d4f', '#ff7a45', '#ffa940', '#ffec3d', '#bae637', '#52c41a',
    '#13c2c2', '#1890ff', '#2f54eb', '#722ed1', '#eb2f96', '#f759ab'
])

// Gradient Editor States
const gradientType = ref('linear')
const gradientDirection = ref('horizontal')
const gradientDirectionOptions = ref([
    { value: 'horizontal', name: '水平' }, { value: 'vertical', name: '垂直' },
    { value: 'diagonal', name: '对角' }, { value: 'center', name: '中心' }
])
const gradientColors = ref([{ offset: 0, color: '#000000' }, { offset: 1, color: '#666666' }])
const currentGradientColorIndex = ref(-1)
const currentGradientTarget = ref('')

const predefinedForegroundImages = ref([
    { id: 1, name: '纹理1', path: bg1 }, { id: 2, name: '纹理2', path: bg2 },
    { id: 3, name: '纹理3', path: bg3 }, { id: 4, name: '纹理4', path: bg4 },
    { id: 5, name: '纹理5', path: bg5 }, { id: 6, name: '纹理6', path: bg6 }
])

// Methods
const showColorPicker = (type: string) => {
    colorPickerType.value = type
    selectedColor.value = type === 'foreground' ? qrConfig.value.dotsColor : qrConfig.value.backgroundColor
    showColorPickerModal.value = true
}

const selectColor = (color: string) => {
    if (currentGradientColorIndex.value >= 0) {
        gradientColors.value[currentGradientColorIndex.value].color = color
        showColorPickerModal.value = false
        currentGradientColorIndex.value = -1
        return
    }

    if (colorPickerType.value === 'foreground') {
        qrConfig.value.dotsColor = color
        qrConfig.value.dotsImage = null
        qrConfig.value.dotsGradient = null
    } else {
        qrConfig.value.backgroundColor = color
        qrConfig.value.backgroundTransparent = false
        qrConfig.value.backgroundGradient = null
    }
    showColorPickerModal.value = false
}

const showGradientEditor = (target: string) => {
    currentGradientTarget.value = target
    const gradient = target === 'foreground' ? qrConfig.value.dotsGradient : qrConfig.value.backgroundGradient
    if (gradient) {
        gradientType.value = gradient.type
        gradientDirection.value = gradient.direction
        gradientColors.value = JSON.parse(JSON.stringify(gradient.colorStops))
    } else {
        gradientColors.value = target === 'background'
            ? [{ offset: 0, color: '#ffffff' }, { offset: 1, color: '#f0f8ff' }]
            : [{ offset: 0, color: '#000000' }, { offset: 1, color: '#666666' }]
    }
    showGradientEditorModal.value = true
}

const applyGradient = () => {
    const gradient = {
        type: gradientType.value,
        direction: gradientDirection.value,
        colorStops: JSON.parse(JSON.stringify(gradientColors.value))
    }
    if (currentGradientTarget.value === 'foreground') {
        qrConfig.value.dotsGradient = gradient
        qrConfig.value.dotsColor = '#000000'
        qrConfig.value.dotsImage = null
    } else {
        qrConfig.value.backgroundGradient = gradient
        qrConfig.value.backgroundColor = '#ffffff'
        qrConfig.value.backgroundTransparent = false
    }
    showGradientEditorModal.value = false
}

const resetConfig = () => {
    qrConfig.value = {
        text: 'https://www.leyifan.com/', margin: 1, ecc: eccLevel.H,
        dotsType: 'square', dotsColor: '#000000', dotsImage: null, dotsGradient: null,
        backgroundColor: '#ffffff', backgroundTransparent: false, backgroundGradient: null,
        cornersSquareType: 0, cornersSquareGradient: null, cornersDotType: 0, cornersDotGradient: null,
        logoImage: null, logoSize: 'medium', logoMargin: 'small', logoShape: 'rectangle', logoHideBackgroundDots: true, logoShadow: false
    }
}

const saveQRCode = async () => {
    try {
        isGenerating.value = true
        if (qrcodeRef.value) {
            const path = await qrcodeRef.value.toPng()
            // #ifdef MP-WEIXIN || APP-PLUS
            uni.saveImageToPhotosAlbum({
                filePath: path,
                success: () => uni.showToast({ title: '保存成功', icon: 'success' })
            })
            // #endif
            // #ifdef H5
            const a = document.createElement('a'); a.href = path; a.download = 'qrcode.png'; a.click()
            // #endif
        }
    } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'error' })
    } finally {
        isGenerating.value = false
    }
}

const shareQRCode = async () => {
    try {
        isGenerating.value = true
        if (qrcodeRef.value) {
            const path = await qrcodeRef.value.toPng()
            // #ifdef MP-WEIXIN
            uni.showShareImageMenu({ path })
            // #endif
            // #ifdef H5
            uni.showToast({ title: '长按保存或复制', icon: 'none' })
            // #endif
        }
    } catch (e) {
        uni.showToast({ title: '分享失败', icon: 'error' })
    } finally {
        isGenerating.value = false
    }
}

const uploadLogo = () => {
    uni.chooseImage({
        count: 1,
        success: (res: any) => {
            qrConfig.value.logoImage = res.tempFilePaths[0]
        }
    })
}

const uploadForegroundImage = () => {
    uni.chooseImage({
        count: 1,
        success: (res: any) => {
            qrConfig.value.dotsImage = res.tempFilePaths[0]
            qrConfig.value.dotsGradient = null
        }
    })
}

const selectPredefinedLogo = (logo: string) => {
    qrConfig.value.logoImage = logo
    uni.showToast({ title: '已选择', icon: 'success' })
}
</script>

<template>
    <RebornPage title="二维码">
        <view class="flex flex-col w-full">
            <!-- 预览区域 -->
            <PreviewSection v-model="qrConfig" v-model:qrcodeRef="qrcodeRef" v-model:exportSizeIndex="exportSizeIndex"
                :isGenerating="isGenerating" :dropdownOptions="dropdownOptions" @save="saveQRCode" @share="shareQRCode"
                @reset="resetConfig" />

            <!-- 配置面板 -->
            <view class="bg-white rounded-xl shadow-[0_4rpx_20rpx_rgba(0,0,0,0.08)] overflow-hidden mt-6">
                <!-- 标签页导航 -->
                <view class="flex bg-[#f8f9fa] border-b border-[#e8e8e8] overflow-x-scroll">
                    <RebornTabs v-model="activeTab" :list="tabs" fill show-slider size="md" />
                </view>

                <!-- 标签页内容 -->
                <view class="p-4">
                    <ConfigBasic v-if="activeTab === 'basic'" v-model="qrConfig" :marginOptions="marginOptions"
                        :errorLevels="errorLevels" />

                    <ConfigColor v-if="activeTab === 'color'" v-model="qrConfig" @showColorPicker="showColorPicker"
                        @showGradientEditor="showGradientEditor" @showImagePicker="showForegroundImageModal = true" />

                    <ConfigShape v-if="activeTab === 'shape'" v-model="qrConfig" :dotsStyles="dotsStyles"
                        :cornersSquareStyles="cornersSquareStyles" :cornersDotStyles="cornersDotStyles" />

                    <ConfigBackground v-if="activeTab === 'background'" v-model="qrConfig"
                        @showColorPicker="showColorPicker" @showGradientEditor="showGradientEditor"
                        @setTransparent="() => { qrConfig.backgroundTransparent = true; qrConfig.backgroundColor = 'transparent' }" />

                    <ConfigLogo v-if="activeTab === 'logo'" v-model="qrConfig" :logoSizeOptions="logoSizeOptions"
                        :logoMarginOptions="logoMarginOptions" @uploadLogo="uploadLogo"
                        @removeLogo="qrConfig.logoImage = null" @selectPredefinedLogo="selectPredefinedLogo" />

                    <ConfigData v-if="activeTab === 'data'" v-model="qrConfig" />
                </view>
            </view>
        </view>

        <!-- 弹窗集 -->
        <EditorModals v-model:selectedColor="selectedColor" :showColorPickerModal="showColorPickerModal"
            :showGradientEditorModal="showGradientEditorModal" :showForegroundImageModal="showForegroundImageModal"
            :colorPalette="colorPalette" :gradientType="gradientType" :gradientDirection="gradientDirection"
            :gradientDirectionOptions="gradientDirectionOptions" :gradientColors="gradientColors"
            :predefinedForegroundImages="predefinedForegroundImages" :qrConfig="qrConfig"
            @hideColorPicker="showColorPickerModal = false" @selectColor="selectColor"
            @onCustomColorInput="(e) => selectColor(e)" @hideGradientEditor="showGradientEditorModal = false"
            @switchGradientType="(type) => gradientType = type"
            @onGradientDirectionChange="(dir) => gradientDirection = dir"
            @showGradientColorPicker="(idx) => { currentGradientColorIndex = idx; selectedColor = gradientColors[idx].color; showColorPickerModal = true }"
            @applyGradient="applyGradient" @hideForegroundImagePicker="showForegroundImageModal = false"
            @selectForegroundImage="(path) => { qrConfig.dotsImage = path; qrConfig.dotsGradient = null }"
            @uploadForegroundImage="uploadForegroundImage"
            @clearForegroundImage="() => { qrConfig.dotsImage = null; qrConfig.dotsColor = '#000000' }" />
    </RebornPage>
</template>

<style scoped>
/* 保持原有布局微调 */
.overflow-x-scroll {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
}

.overflow-x-scroll::-webkit-scrollbar {
    display: none;
}
</style>
