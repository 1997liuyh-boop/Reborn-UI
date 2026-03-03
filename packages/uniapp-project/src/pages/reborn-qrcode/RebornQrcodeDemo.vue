<script setup lang="ts">
import { ref, computed } from 'vue'
import RebornQrcode from '@/components/reborn-qrcode/RebornQrcode.vue'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornTabs from '@/components/reborn-tabs/RebornTabs.vue'
import RebornTextarea from '@/components/reborn-textarea/RebornTextarea.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornDropdownSelect from '@/components/reborn-dropdown-select/RebornDropdownSelect.vue'
import { eccLevel } from '@/components/reborn-qrcode/draw'

import bg1 from '@/static/1.jpeg'
import bg2 from '@/static/2.jpeg'
import bg3 from '@/static/3.jpeg'
import bg4 from '@/static/4.jpeg'
import bg5 from '@/static/5.jpeg'
import bg6 from '@/static/6.jpeg'
const qrcodeRef = ref<any>(null)

const foregroundMode = computed(() => {
    return 'color'
})

const qrConfig = ref({
    text: 'https://www.leyifan.com/',
    margin: 1,
    exportSize: { width: 500, height: 500 },
    logoOptions: { image: null as string | null, size: 'medium', margin: 'small', shape: 'rectangle', hideBackgroundDots: true, shadow: false },
    dotsOptions: { type: 'square', color: '#000000', image: null as string | null, gradient: null as any },
    backgroundOptions: { color: '#ffffff', transparent: false, gradient: null as any },
    cornersSquareOptions: { type: 0, color: '#000000', gradient: null as any },
    ecc: eccLevel.H,
    cornersDotOptions: { type: 0, color: '#000000', gradient: null as any }
})

const exportSizeOptions = ref([
    { label: '500×500', width: 500, height: 500 },
    { label: '750×750', width: 750, height: 750 },
    { label: '1000×1000', width: 1000, height: 1000 }
])
const dropdownOptions = computed(() => exportSizeOptions.value.map((item, index) => ({
    label: item.label,
    value: index
})))
const exportSizeIndex = ref(0)
const isGenerating = ref(false)
const activeTab = ref('basic')
const tabs = ref([
    { label: '基础', value: 'basic' },
    { label: '颜色', value: 'color' },
    { label: '形状', value: 'shape' },
    { label: '背景', value: 'background' },
    { label: 'Logo', value: 'logo' }
])
const marginOptions = ref([
    { value: 0, name: '无' },
    { value: 1, name: '小' },
    { value: 2, name: '中' },
    { value: 3, name: '大' }
])
const errorLevels = ref([
    { value: eccLevel.L, name: 'L (7%)' },
    { value: eccLevel.M, name: 'M (15%)' },
    { value: eccLevel.Q, name: 'Q (25%)' },
    { value: eccLevel.H, name: 'H (30%)' },
])
const dotsStyles = ref([
    { type: 'rect', name: '普通' },
    { type: 'circular', name: '圆形' },
    { type: 'rectSmall', name: '瓷砖' },
    { type: 'line', name: '线性' }
])
const cornersSquareStyles = ref([
    { type: 0, name: '方形' },
    { type: 20, name: '圆形' },
    { type: 10, name: '圆角' }
])
const cornersDotStyles = ref([
    { type: 0, name: '方形' },
    { type: 5, name: '圆角' },
    { type: 10, name: '圆形' },
])
const logoSizeOptions = ref([
    { value: 'small', name: '小' },
    { value: 'medium', name: '中' },
    { value: 'large', name: '大' }
])
const logoMarginOptions = ref([
    { value: 'none', name: '无' },
    { value: 'small', name: '小' },
    { value: 'medium', name: '中' },
    { value: 'large', name: '大' }
])

const colorPalette = ref([
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff4d4f', '#ff7a45', '#ffa940', '#ffec3d', '#bae637', '#52c41a',
    '#13c2c2', '#1890ff', '#2f54eb', '#722ed1', '#eb2f96', '#f759ab'
])
const showColorPickerModal = ref(false)
const selectedColor = ref('#000000')
const colorPickerType = ref('')

const showColorPicker = (type: string) => {
    colorPickerType.value = type
    selectedColor.value = type === 'foreground' ? qrConfig.value.dotsOptions.color : qrConfig.value.backgroundOptions.color
    showColorPickerModal.value = true
}
const hideColorPicker = () => { showColorPickerModal.value = false; colorPickerType.value = '' }
const selectColor = (color: string) => {
    if (currentGradientColorIndex.value >= 0) {
        gradientColors.value[currentGradientColorIndex.value].color = color
        hideColorPicker()
        return
    }

    if (colorPickerType.value === 'foreground') {
        qrConfig.value.dotsOptions.color = color
        qrConfig.value.dotsOptions.image = null
        qrConfig.value.dotsOptions.gradient = null
        qrConfig.value.cornersSquareOptions.color = color
    } else {
        qrConfig.value.backgroundOptions.color = color
        qrConfig.value.backgroundOptions.transparent = false
        qrConfig.value.backgroundOptions.gradient = null
    }
    hideColorPicker()
}
// 选择预定义Logo
const selectPredefinedLogo = (logo: string) => {
    qrConfig.value.logoOptions.image = logo
    uni.showToast({
        title: `已选择`,
        icon: 'success'
    })
}
const setTransparentBackground = () => {
    qrConfig.value.backgroundOptions.transparent = true
    qrConfig.value.backgroundOptions.color = 'transparent'
}

const showGradientEditorModal = ref(false)
const gradientType = ref('linear')
const gradientDirection = ref('horizontal')
const gradientDirectionOptions = ref([
    { value: 'horizontal', name: '水平' },
    { value: 'vertical', name: '垂直' },
    { value: 'diagonal', name: '对角' },
    { value: 'center', name: '中心' }
])
const gradientColors = ref([
    { offset: 0, color: '#000000' },
    { offset: 1, color: '#666666' }
])
const currentGradientColorIndex = ref(-1)
const currentGradientTarget = ref('')


const showForegroundImageModal = ref(false)
const predefinedForegroundImages = ref([
    { id: 1, name: '纹理1', path: bg1 },
    { id: 2, name: '纹理2', path: bg2 },
    { id: 3, name: '纹理3', path: bg3 },
    { id: 4, name: '纹理4', path: bg4 },
    { id: 5, name: '纹理5', path: bg5 },
    { id: 6, name: '纹理6', path: bg6 }
])

const showGradientEditor = (target: string) => {
    currentGradientTarget.value = target
    const targetConfig = target === 'foreground' ? qrConfig.value.dotsOptions : qrConfig.value.backgroundOptions
    if (targetConfig.gradient) {
        gradientType.value = targetConfig.gradient.type || 'linear'
        gradientDirection.value = targetConfig.gradient.direction || 'horizontal'
        gradientColors.value = JSON.parse(JSON.stringify(targetConfig.gradient.colorStops))
    } else {
        gradientType.value = 'linear'
        gradientDirection.value = 'horizontal'
        gradientColors.value = target === 'background'
            ? [{ offset: 0, color: '#ffffff' }, { offset: 1, color: '#f0f8ff' }]
            : [{ offset: 0, color: '#000000' }, { offset: 1, color: '#666666' }]
    }
    showGradientEditorModal.value = true
}

const hideGradientEditor = () => {
    showGradientEditorModal.value = false
    currentGradientTarget.value = ''
}

const switchGradientType = (type: string) => { gradientType.value = type }
const onGradientDirectionChange = (direction: string) => { gradientDirection.value = direction }

const showGradientColorPicker = (index: number) => {
    currentGradientColorIndex.value = index
    selectedColor.value = gradientColors.value[index].color
    showColorPickerModal.value = true
}

const applyGradient = () => {
    const gradient = {
        type: gradientType.value,
        direction: gradientDirection.value,
        colorStops: JSON.parse(JSON.stringify(gradientColors.value))
    }
    if (currentGradientTarget.value === 'foreground') {
        qrConfig.value.dotsOptions.gradient = gradient
        qrConfig.value.dotsOptions.color = '#000000'
        qrConfig.value.dotsOptions.image = null
    } else if (currentGradientTarget.value === 'background') {
        qrConfig.value.backgroundOptions.gradient = gradient
        qrConfig.value.backgroundOptions.color = '#ffffff'
        qrConfig.value.backgroundOptions.transparent = false
    }
    hideGradientEditor()
}

const showForegroundImagePicker = () => { showForegroundImageModal.value = true }
const hideForegroundImagePicker = () => { showForegroundImageModal.value = false }

const selectForegroundImage = (path: string) => {
    qrConfig.value.dotsOptions.image = path
    qrConfig.value.dotsOptions.gradient = null
}

const uploadForegroundImage = () => {
    uni.chooseImage({
        count: 1,
        success: (res) => {
            qrConfig.value.dotsOptions.image = res.tempFilePaths[0];
            qrConfig.value.dotsOptions.gradient = null
        }
    })
}

const clearForegroundImage = () => {
    qrConfig.value.dotsOptions.image = null
    qrConfig.value.dotsOptions.color = '#000000'
}

const onCustomColorInput = (e: any) => {
    const color = e.detail.value
    selectedColor.value = color
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        selectColor(color)
    }
}

const selectLogoSize = (size: string) => { qrConfig.value.logoOptions.size = size as 'small' | 'medium' | 'large' }
const selectLogoMargin = (margin: string) => { qrConfig.value.logoOptions.margin = margin as 'small' | 'medium' | 'large' }
const resetConfig = () => {
    qrConfig.value = {
        text: 'https://www.leyifan.com/',
        margin: 1,
        exportSize: { width: 500, height: 500 },
        logoOptions: { image: null as string | null, size: 'medium', margin: 'small', shape: 'rectangle', hideBackgroundDots: true, shadow: false },
        dotsOptions: { type: 'square', color: '#000000', image: null as string | null, gradient: null as any },
        backgroundOptions: { color: '#ffffff', transparent: false, gradient: null as any },
        cornersSquareOptions: { type: 0, color: '#000000', gradient: null as any },
        ecc: eccLevel.H,
        cornersDotOptions: { type: 0, color: '#000000', gradient: null as any }
    }
}
// 上传Logo
const uploadLogo = () => {
    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
            qrConfig.value.logoOptions.image = res.tempFilePaths[0];
        }
    })
}

// 删除Logo
const removeLogo = () => {
    qrConfig.value.logoOptions.image = null
}

const handleToast = (msg: string) => {
    uni.showToast({ title: msg, icon: 'none' })
}

const saveQRCode = async () => {
    try {
        isGenerating.value = true
        if (qrcodeRef.value) {
            const path = await qrcodeRef.value.toPng()
            // #ifdef MP-WEIXIN || APP-PLUS
            uni.saveImageToPhotosAlbum({
                filePath: path,
                success: function () {
                    uni.showToast({ title: '保存成功', icon: 'success' })
                }
            })
            // #endif
            // #ifdef H5
            const a = document.createElement('a')
            a.href = path
            a.download = 'qrcode.png'
            a.click()
            // #endif
        }
    } catch (error) {
        console.error(error)
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
    } catch (error) {
        uni.showToast({ title: '分享失败', icon: 'error' })
    } finally {
        isGenerating.value = false
    }
}
</script>

<template>
    <RebornPage title="二维码">
        <view class="flex flex-col w-full">
            <!-- 预览区域 -->
            <view
                class="bg-white rounded-xl p-4 shadow-lg w-full box-border flex items-start flex-col gap-4 sm:flex-row">
                <!-- 左侧：二维码预览 -->
                <view class="flex items-center justify-center">
                    <reborn-qrcode ref="qrcodeRef" :text="qrConfig.text" :size="200" :padding="qrConfig.margin * 5"
                        :mode="qrConfig.dotsOptions.type === 'circular' ? 'circular' : qrConfig.dotsOptions.type === 'line' ? 'line' : qrConfig.dotsOptions.type === 'rectSmall' ? 'rectSmall' : 'rect'"
                        :foreground="qrConfig.dotsOptions.color || '#000000'"
                        :background="qrConfig.backgroundOptions.color || '#ffffff'"
                        :logo="qrConfig.logoOptions.image || ''"
                        :logoSize="qrConfig.logoOptions.size === 'small' ? 20 : qrConfig.logoOptions.size === 'large' ? 60 : 40"
                        :pdColor="qrConfig.dotsOptions.color || '#000000'"
                        :pdOuterRadius="qrConfig.cornersSquareOptions.type"
                        :pdInnerRadius="qrConfig.cornersDotOptions.type" :ecc="qrConfig.ecc"
                        :dotsGradient="qrConfig.dotsOptions.gradient" :dotsImage="qrConfig.dotsOptions.image"
                        :backgroundGradient="qrConfig.backgroundOptions.gradient"
                        :backgroundTransparent="qrConfig.backgroundOptions.transparent"
                        :logoOptions="qrConfig.logoOptions"
                        :cornersSquareGradient="qrConfig.cornersSquareOptions.gradient || qrConfig.dotsOptions.gradient"
                        :cornersDotGradient="qrConfig.cornersDotOptions.gradient || qrConfig.dotsOptions.gradient"
                        :cornersSquareOptions="qrConfig.cornersSquareOptions"
                        :cornersDotOptions="qrConfig.cornersDotOptions"></reborn-qrcode>
                </view>

                <!-- 右侧：操作按钮区 -->
                <view class="flex-1 shrink-0 flex flex-col justify-start gap-3 w-full sm:max-w-[240rpx]">
                    <view class="bg-[#f8f9fa] rounded-md p-2 shrink-0 overflow-visible">
                        <text class="text-xs text-gray-500 mb-1 block">导出尺寸</text>
                        <RebornDropdownSelect v-model="exportSizeIndex" :options="dropdownOptions" size="sm" />
                    </view>

                    <!-- 操作按钮 -->
                    <view class="flex flex-row flex-wrap mb-2 overflow-visible">
                        <RebornButton @click="saveQRCode" :loading="isGenerating" variant="solid" color="primary">
                            保存
                        </RebornButton>
                        <RebornButton @click="shareQRCode" :loading="isGenerating" variant="solid" color="secondary">
                            分享
                        </RebornButton>
                        <RebornButton @click="resetConfig" variant="solid" color="warning">重置</RebornButton>
                    </view>
                </view>
            </view>

            <!-- 配置面板 -->
            <view class="bg-white rounded-xl shadow-[0_4rpx_20rpx_rgba(0,0,0,0.08)] overflow-hidden mt-6">
                <!-- 标签页导航 -->
                <view class="flex bg-[#f8f9fa] border-b border-[#e8e8e8]">
                    <RebornTabs v-model="activeTab" :list="tabs" fill size="md" />
                </view>

                <!-- 标签页内容 -->
                <view class="p-4">
                    <!-- 基础设置 -->
                    <view class="block" v-if="activeTab === 'basic'">
                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">二维码内容1</text>
                            <view class="relative w-full">
                                <RebornTextarea v-model="qrConfig.text" :maxlength="2953" :auto-height="true"
                                    placeholder="请输入网址或文本内容" />
                            </view>
                        </view>

                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">外边距</text>
                            <RebornRadioGroup v-model="qrConfig.margin" size="sm">
                                <RebornRadio v-for="item in marginOptions" :key="item.value" :label="item.name"
                                    :value="item.value" />
                            </RebornRadioGroup>
                        </view>

                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">容错率 (组件默认H)</text>
                            <RebornRadioGroup v-model="qrConfig.ecc" size="sm">
                                <RebornRadio v-for="item in errorLevels" :key="item.value" :label="item.name"
                                    :value="item.value" />
                            </RebornRadioGroup>
                        </view>
                    </view>

                    <!-- 颜色设置 -->
                    <view class="block" v-if="activeTab === 'color'">
                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">前景色</text>
                            <text class="text-xs text-[#666] mb-2 block">同时设置码点和码眼的颜色</text>
                            <view class="flex gap-2 mt-2">
                                <view
                                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg bg-[#fafafa] min-h-[80rpx]"
                                    :class="!qrConfig.dotsOptions.image && !qrConfig.dotsOptions.gradient ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8]'"
                                    @tap="showColorPicker('foreground')">
                                    <view
                                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                                        :style="{ backgroundColor: qrConfig.dotsOptions.color }"></view>
                                    <text class="text-[20rpx] font-medium"
                                        :class="!qrConfig.dotsOptions.image && !qrConfig.dotsOptions.gradient ? 'text-[#1890ff]' : 'text-[#666]'">单色</text>
                                </view>
                                <view
                                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg bg-[#fafafa] min-h-[80rpx]"
                                    :class="qrConfig.dotsOptions.gradient ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                                    @tap="showGradientEditor('foreground')">
                                    <view
                                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                                        style="background: linear-gradient(45deg, #ff4d4f 0%, #1890ff 100%)"></view>
                                    <text class="text-[20rpx] font-medium"
                                        :class="qrConfig.dotsOptions.gradient ? 'text-[#1890ff]' : 'text-[#666]'">渐变</text>
                                </view>
                                <view
                                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg bg-[#fafafa] min-h-[80rpx]"
                                    :class="qrConfig.dotsOptions.image ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                                    @tap="showForegroundImagePicker">
                                    <view v-if="qrConfig.dotsOptions.image"
                                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1 overflow-hidden">
                                        <image :src="qrConfig.dotsOptions.image" mode="aspectFill"
                                            class="w-full h-full" />
                                    </view>
                                    <view v-else
                                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1 bg-[#f0f0f0] flex items-center justify-center">
                                        <text class="text-[20rpx]">🖼</text>
                                    </view>
                                    <text class="text-[20rpx] font-medium"
                                        :class="qrConfig.dotsOptions.image ? 'text-[#1890ff]' : 'text-[#666]'">图片</text>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 形状设置 -->
                    <view class="block" v-if="activeTab === 'shape'">
                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">码点形状</text>
                            <reborn-radio-group v-model="qrConfig.dotsOptions.type" size="sm">
                                <reborn-radio v-for="item in dotsStyles" :key="item.type" :label="item.name"
                                    :value="item.type" />
                            </reborn-radio-group>
                        </view>

                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">码眼外框形状</text>
                            <reborn-radio-group v-model="qrConfig.cornersSquareOptions.type" size="sm">
                                <reborn-radio v-for="item in cornersSquareStyles" :key="item.type" :label="item.name"
                                    :value="item.type" />
                            </reborn-radio-group>
                        </view>

                        <!-- 码眼内点形状设置 -->
                        <view class="config-item">
                            <text class="config-label">码眼内点形状</text>
                            <reborn-radio-group v-model="qrConfig.cornersDotOptions.type" size="sm">
                                <reborn-radio v-for="item in cornersDotStyles" :key="item.type" :label="item.name"
                                    :value="item.type" />
                            </reborn-radio-group>
                        </view>
                    </view>

                    <!-- 背景设置 -->
                    <view class="block" v-if="activeTab === 'background'">
                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">背景填充</text>
                            <view class="flex gap-2 mt-2">
                                <view
                                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg min-h-[80rpx]"
                                    :class="qrConfig.backgroundOptions.color && !qrConfig.backgroundOptions.gradient && !qrConfig.backgroundOptions.transparent ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                                    @tap="showColorPicker('background')">
                                    <view
                                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                                        :style="{ backgroundColor: qrConfig.backgroundOptions.color }"></view>
                                    <text class="text-[20rpx] font-medium"
                                        :class="qrConfig.backgroundOptions.color && !qrConfig.backgroundOptions.gradient && !qrConfig.backgroundOptions.transparent ? 'text-[#1890ff]' : 'text-[#666]'">单色</text>
                                </view>
                                <view
                                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg min-h-[80rpx]"
                                    :class="qrConfig.backgroundOptions.gradient ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                                    @tap="showGradientEditor('background')">
                                    <view
                                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                                        style="background: linear-gradient(45deg, #ff4d4f 0%, #1890ff 100%)"></view>
                                    <text class="text-[20rpx] font-medium"
                                        :class="qrConfig.backgroundOptions.gradient ? 'text-[#1890ff]' : 'text-[#666]'">渐变</text>
                                </view>
                                <view
                                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg min-h-[80rpx]"
                                    :class="qrConfig.backgroundOptions.transparent ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                                    @tap="setTransparentBackground()">
                                    <view
                                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                                        style="background: repeating-conic-gradient(#cccccc 0% 25%, #ffffff 0% 50%) 50% / 8rpx 8rpx;">
                                    </view>
                                    <text class="text-[20rpx] font-medium"
                                        :class="qrConfig.backgroundOptions.transparent ? 'text-[#1890ff]' : 'text-[#666]'">透明</text>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- Logo设置 -->
                    <view class="block" v-if="activeTab === 'logo'">
                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">Logo图片</text>
                            <view class="flex items-center gap-4">
                                <view v-if="!qrConfig.logoOptions.image"
                                    class="w-[120rpx] h-[120rpx] flex flex-col items-center justify-center border-2 border-dashed border-[#d9d9d9] rounded-xl bg-[#fafafa]"
                                    @tap="uploadLogo">
                                    <text class="text-2xl text-[#999] mb-1">+</text>
                                    <text class="text-[20rpx] text-[#666]">上传Logo</text>
                                </view>
                                <view v-else class="flex flex-col items-center gap-2">
                                    <view
                                        class="w-[120rpx] h-[120rpx] border-2 border-[#e8e8e8] rounded-xl overflow-hidden flex items-center justify-center">
                                        <image :src="qrConfig.logoOptions.image" mode="aspectFit"
                                            class="w-full h-full" />
                                    </view>
                                    <view class="flex gap-2">
                                        <button
                                            class="!m-0 p-0 px-2 text-[20rpx] h-[40rpx] leading-[40rpx] bg-white border border-[#d9d9d9] text-[#666] rounded"
                                            @tap="uploadLogo">更换</button>
                                        <button
                                            class="!m-0 p-0 px-2 text-[20rpx] h-[40rpx] leading-[40rpx] bg-white border border-[#ff4d4f] text-[#ff4d4f] rounded"
                                            @tap="removeLogo">删除</button>
                                    </view>
                                </view>

                                <view class="flex-1">
                                    <text class="block text-xs font-medium text-[#666] mb-2">预设Logo</text>
                                    <view class="flex gap-2">
                                        <view
                                            class="w-[80rpx] h-[80rpx] border border-[#e8e8e8] rounded-lg overflow-hidden flex items-center justify-center bg-[#fafafa]"
                                            :class="{ 'border-[#1890ff] bg-[#e6f7ff]': qrConfig.logoOptions.image === '/static/starbucks.png' }"
                                            @tap="selectPredefinedLogo('/static/starbucks.png')">
                                            <image src="/static/starbucks.png" class="w-[48rpx] h-[48rpx]"
                                                mode="aspectFit" />
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view class="mb-4" v-if="qrConfig.logoOptions.image">
                            <text class="block text-sm font-medium text-[#262626] mb-1">Logo尺寸</text>
                            <view class="grid grid-cols-4 gap-3 mt-3">
                                <view v-for="item in logoSizeOptions" :key="item.value"
                                    class="flex flex-col items-center justify-center py-[12rpx] px-[8rpx] border-[2rpx] border-solid rounded-[12rpx] bg-[#fafafa] min-h-[50rpx]"
                                    :class="qrConfig.logoOptions.size === item.value ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8]'"
                                    @tap="selectLogoSize(item.value)">
                                    <text class="text-[22rpx] font-medium text-center"
                                        :class="qrConfig.logoOptions.size === item.value ? 'text-[#1890ff]' : 'text-[#666]'">{{
                                            item.name }}</text>
                                </view>
                            </view>
                        </view>

                        <view class="mb-4" v-if="qrConfig.logoOptions.image">
                            <text class="block text-sm font-medium text-[#262626] mb-1">Logo边距</text>
                            <view class="grid grid-cols-4 gap-3 mt-3">
                                <view v-for="item in logoMarginOptions" :key="item.value"
                                    class="flex flex-col items-center justify-center py-[12rpx] px-[8rpx] border-[2rpx] border-solid rounded-[12rpx] bg-[#fafafa] min-h-[50rpx]"
                                    :class="qrConfig.logoOptions.margin === item.value ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8]'"
                                    @tap="selectLogoMargin(item.value)">
                                    <text class="text-[22rpx] font-medium text-center"
                                        :class="qrConfig.logoOptions.margin === item.value ? 'text-[#1890ff]' : 'text-[#666]'">{{
                                            item.name }}</text>
                                </view>
                            </view>
                        </view>

                        <view class="mb-4" v-if="qrConfig.logoOptions.image">
                            <view class="flex items-center justify-between gap-4">
                                <view
                                    class="flex items-center justify-between flex-1 bg-[#fafafa] p-3 rounded-lg border border-[#e8e8e8]">
                                    <text class="text-[24rpx] font-medium text-[#262626]">投影效果</text>
                                    <switch :checked="qrConfig.logoOptions.shadow"
                                        @change="(e: any) => qrConfig.logoOptions.shadow = e.detail.value"
                                        color="#1890ff" style="transform:scale(0.7)" />
                                </view>
                                <view
                                    class="flex items-center justify-between flex-1 bg-[#fafafa] p-3 rounded-lg border border-[#e8e8e8]">
                                    <text class="text-[24rpx] font-medium text-[#262626]">隐藏背景</text>
                                    <switch :checked="qrConfig.logoOptions.hideBackgroundDots"
                                        @change="(e: any) => qrConfig.logoOptions.hideBackgroundDots = e.detail.value"
                                        color="#1890ff" style="transform:scale(0.7)" />
                                </view>
                            </view>
                        </view>
                    </view>

                    <view class="block" v-if="activeTab === 'presets'">
                        <view class="mb-4">
                            <text class="block text-sm font-medium text-[#262626] mb-1">风格预设说明</text>
                            <text class="text-xs text-[#666] block mb-2">定制预设可直接配置以下 props...</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 颜色选择器弹窗 -->
        <view v-if="showColorPickerModal"
            class="fixed inset-0 z-[10002] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
            @tap="hideColorPicker">
            <view
                class="w-[600rpx] max-w-[90vw] bg-white rounded-[16rpx] p-[32rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.2)]"
                @tap.stop="">
                <view class="flex justify-between items-center mb-[32rpx]">
                    <text class="text-[32rpx] font-[600] text-[#262626]">选择颜色</text>
                    <text class="text-[40rpx] text-[#999] leading-none" @tap="hideColorPicker">×</text>
                </view>
                <view class="grid grid-cols-6 gap-[16rpx] mb-[32rpx]">
                    <view v-for="color in colorPalette" :key="color"
                        class="w-[80rpx] h-[80rpx] rounded-[12rpx] border-[3rpx] border-solid border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)]"
                        :style="{ backgroundColor: color }" @tap="selectColor(color)"></view>
                </view>
                <view class="flex items-center gap-[16rpx]">
                    <text class="text-[26rpx] text-[#262626] font-[500]">自定义:</text>
                    <RebornInput v-model="selectedColor" size="sm" @input="onCustomColorInput" />
                </view>
            </view>
        </view>

        <!-- 渐变编辑器弹窗 -->
        <view v-if="showGradientEditorModal"
            class="fixed inset-0 z-[10001] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
            @tap="hideGradientEditor">
            <view
                class="w-[600rpx] max-w-[90vw] bg-white rounded-[16rpx] p-[32rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.2)]"
                @tap.stop="">
                <view class="flex justify-between items-center mb-[32rpx]">
                    <text class="text-[32rpx] font-[600] text-[#262626]">渐变设置</text>
                    <text class="text-[40rpx] text-[#999] leading-none" @tap="hideGradientEditor">×</text>
                </view>

                <!-- 渐变类型 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">渐变类型</text>
                    <view class="flex gap-[16rpx]">
                        <view class="flex-1 py-[16rpx] border-[2rpx] border-solid rounded-[8rpx] text-center"
                            :class="gradientType === 'linear' ? 'border-[#1890ff] bg-[#e6f7ff] text-[#1890ff]' : 'border-[#e8e8e8] text-[#333]'"
                            @tap="switchGradientType('linear')">
                            <text class="text-[26rpx]">线性渐变</text>
                        </view>
                        <view class="flex-1 py-[16rpx] border-[2rpx] border-solid rounded-[8rpx] text-center"
                            :class="gradientType === 'radial' ? 'border-[#1890ff] bg-[#e6f7ff] text-[#1890ff]' : 'border-[#e8e8e8] text-[#333]'"
                            @tap="switchGradientType('radial')">
                            <text class="text-[26rpx]">径向渐变</text>
                        </view>
                    </view>
                </view>

                <!-- 渐变方向 -->
                <view class="mb-[32rpx]" v-if="gradientType === 'linear'">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">渐变方向</text>
                    <view class="grid grid-cols-4 gap-[12rpx]">
                        <view v-for="item in gradientDirectionOptions" :key="item.value"
                            class="flex flex-col items-center justify-center border-[2rpx] border-solid rounded-[12rpx] min-h-[80rpx] p-[12rpx]"
                            :class="gradientDirection === item.value ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                            @tap="onGradientDirectionChange(item.value)">
                            <text class="text-[24rpx] font-[600]"
                                :class="gradientDirection === item.value ? 'text-[#1890ff]' : 'text-[#333]'">{{
                                    item.name }}</text>
                        </view>
                    </view>
                </view>

                <!-- 渐变颜色 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">渐变颜色</text>
                    <view class="flex gap-[24rpx]">
                        <view class="flex flex-col items-center flex-1">
                            <text class="text-[24rpx] text-[#666] mb-[12rpx]">起始颜色</text>
                            <view
                                class="w-[60rpx] h-[60rpx] rounded-[12rpx] border-[3rpx] border-solid border-white shadow-[0_4rpx_12rpx_rgba(0,0,0,0.15)] mb-[8rpx]"
                                :style="{ backgroundColor: gradientColors[0].color }" @tap="showGradientColorPicker(0)">
                            </view>
                            <text class="text-[20rpx] text-[#999]">{{ gradientColors[0].color }}</text>
                        </view>
                        <view class="flex flex-col items-center flex-1">
                            <text class="text-[24rpx] text-[#666] mb-[12rpx]">结束颜色</text>
                            <view
                                class="w-[60rpx] h-[60rpx] rounded-[12rpx] border-[3rpx] border-solid border-white shadow-[0_4rpx_12rpx_rgba(0,0,0,0.15)] mb-[8rpx]"
                                :style="{ backgroundColor: gradientColors[1].color }" @tap="showGradientColorPicker(1)">
                            </view>
                            <text class="text-[20rpx] text-[#999]">{{ gradientColors[1].color }}</text>
                        </view>
                    </view>
                </view>

                <view class="mt-[32rpx] flex justify-end">
                    <button
                        class="bg-[#1890ff] text-white py-[16rpx] px-[48rpx] rounded-[8rpx] text-[28rpx] !m-0 leading-none"
                        @tap="applyGradient">确定</button>
                </view>
            </view>
        </view>

        <!-- 前景图选择弹窗 -->
        <view v-if="showForegroundImageModal"
            class="fixed inset-0 z-[10001] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
            @tap="hideForegroundImagePicker">
            <view
                class="w-[650rpx] max-w-[90vw] bg-white rounded-[16rpx] p-[32rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.2)]"
                @tap.stop="">
                <view class="flex justify-between items-center mb-[32rpx]">
                    <text class="text-[32rpx] font-[600] text-[#262626]">选择前景图</text>
                    <text class="text-[40rpx] text-[#999] leading-none" @tap="hideForegroundImagePicker">×</text>
                </view>

                <!-- 预定义前景图 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">预设纹理</text>
                    <view class="grid grid-cols-3 gap-[16rpx]">
                        <view v-for="img in predefinedForegroundImages" :key="img.id"
                            class="flex flex-col items-center p-[12rpx] border-[2rpx] border-solid rounded-[12rpx]"
                            :class="qrConfig.dotsOptions.image === img.path ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                            @tap="selectForegroundImage(img.path)">
                            <image :src="img.path" mode="aspectFill"
                                class="w-[120rpx] h-[120rpx] rounded-[8rpx] mb-[8rpx]"></image>
                            <text class="text-[22rpx]"
                                :class="qrConfig.dotsOptions.image === img.path ? 'text-[#1890ff]' : 'text-[#666]'">{{
                                    img.name }}</text>
                        </view>
                    </view>
                </view>

                <!-- 自定义上传 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">自定义图片</text>
                    <view class="flex gap-[16rpx]">
                        <button
                            class="flex-1 bg-[#1890ff] text-white py-[16rpx] rounded-[8rpx] text-[26rpx] !m-0 leading-none"
                            @tap="uploadForegroundImage">上传图片</button>
                        <button v-if="qrConfig.dotsOptions.image"
                            class="flex-1 bg-[#ff4d4f] text-white py-[16rpx] rounded-[8rpx] text-[26rpx] !m-0 leading-none"
                            @tap="clearForegroundImage">清除</button>
                    </view>
                </view>

                <view class="mt-[32rpx] flex justify-end">
                    <button
                        class="bg-[#1890ff] text-white py-[16rpx] px-[48rpx] rounded-[8rpx] text-[28rpx] !m-0 leading-none"
                        @tap="hideForegroundImagePicker">确定</button>
                </view>
            </view>
        </view>
    </RebornPage>
</template>
