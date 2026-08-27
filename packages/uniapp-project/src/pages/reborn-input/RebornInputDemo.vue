<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import { inputColors, inputShapes, inputSizes, inputVariants } from '@/components/reborn-input/reborn-input.config'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'

import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'

const input1 = ref('')
const input2 = ref('')

const isTranslated = ref(false)

function toggleTranslate() {
  isTranslated.value = !isTranslated.value
}

const colors = ref<typeof inputColors[number]>('primary')
const currentSize = ref<typeof inputSizes[number]>('sm')
const currentVariant = ref<typeof inputVariants[number]>('filled')
const currentShape = ref<typeof inputShapes[number]>('square')
const disabled = ref(false)
const password = ref(false)
const clearable = ref(true)

// ─── 场景演示状态（各卡片独立持有，避免相互牵连） ────────────────

const variantValue = ref('Reborn UI')
const iconValue = ref('')
const groupValue = ref('')
const limitValue = ref('字数统计')
const limitOutsideValue = ref('')
const limitAreaValue = ref('')
const pwdValue = ref('reborn-ui-2026')
const clearValue = ref('点右侧图标清空')
const textareaValue = ref('')
const autosizeValue = ref('高度随内容自动增长。')

// 格式化与解析：千分位展示，绑定值保持纯数字文本
const formattedValue = ref('1234567')

/** 千分位格式化，如 1234567 → 1,234,567 */
function formatThousands(value: string | number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 去掉千分位逗号，还原为纯数字文本 */
function parseThousands(text: string) {
  return text.replace(/,/g, '')
}

</script>

<template>
  <RebornPage title="输入框" description="用于接收用户输入的数据。">
    <RebornCard title="示例" custom-class="flex flex-col gap-2">
      <RebornInput
        v-model="input1" :size="currentSize" :color="colors" :show-password="password" :disabled="disabled"
        :variant="currentVariant" :shape="currentShape" :clearable="clearable" placeholder="基础用法..."
      />
      <RebornInput
        v-model="input2" :size="currentSize" :color="colors" :show-password="password" :disabled="disabled"
        :variant="currentVariant" :shape="currentShape" :clearable="clearable" placeholder="插槽"
      >
        <template #leading="{ ui }">
          <view class="i-lucide-search text-gray-400" :class="ui.trailing()" />
        </template>
        <template #trailing="{ ui }">
          <view class="i-lucide-calendar text-gray-400" :class="ui.trailing()" />
        </template>
      </RebornInput>
      <RebornInput
        v-model="input2" :size="currentSize" :color="colors" :show-password="password" :disabled="disabled"
        :variant="currentVariant" :shape="currentShape" :clearable="clearable" placeholder="关键词/商品ID/网址"
      >
        <template #leading>
          <RebornImage
            src="https://mall.leyifan.cn/static/h5/new_images/index_search_small.png?v=1" width="30"
            height="30" mode="widthFix"
          />
        </template>
        <template #trailing>
          <view class="relative h-[80rpx] w-[80rpx] flex items-center justify-center" @tap.stop="toggleTranslate">
            <view
              class="absolute left-[8rpx] top-[12rpx] flex h-[46rpx] w-[46rpx] items-center justify-center rounded-[8rpx] border text-[22rpx] font-bold transition-all duration-300"
              :class="[isTranslated ? 'translate-x-[26rpx] translate-y-[12rpx] z-10 border-info bg-white text-info shadow-sm' : 'z-0 border-gray-200 bg-[#f8f9fa] text-gray-400']"
            >
              译
            </view>
            <view
              class="absolute left-[34rpx] top-[24rpx] flex h-[46rpx] w-[46rpx] items-center justify-center rounded-[8rpx] border text-[22rpx] font-bold transition-all duration-300"
              :class="[isTranslated ? '-translate-x-[26rpx] -translate-y-[12rpx] z-0 border-gray-200 bg-[#f8f9fa] text-gray-400' : 'z-10 border-info bg-white text-info shadow-sm']"
            >
              原
            </view>
          </view>
        </template>
      </RebornInput>
    </RebornCard>

    <RebornCard title="配置" custom-class="grid grid-cols-2 gap-2">
      <view class="col-span-2">
        <RebornText color="neutral">尺寸</RebornText>
        <RebornRadioGroup v-model="currentSize">
          <RebornRadio v-for="size in inputSizes" :key="size" :value="size" :label="size" />
        </RebornRadioGroup>
      </view>

      <view class="col-span-2">
        <RebornText color="neutral">激活边框颜色</RebornText>
        <RebornRadioGroup v-model="colors">
          <RebornRadio v-for="item in inputColors" :key="item" :value="item" :show-icon="false">
            <template #default="{ isChecked }">
              <view class="relative flex size-5">
                <view
                  v-if="isChecked" class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  :class="`bg-${item}`"
                />
                <view class="relative inline-flex size-5 rounded-full" :class="`bg-${item}`" />
              </view>
            </template>
          </RebornRadio>
        </RebornRadioGroup>
      </view>

      <view>
        <RebornText color="neutral">密码</RebornText>
        <RebornSwitch v-model="password" active-label="是" inactive-label="否" />
      </view>

      <view>
        <RebornText color="neutral">禁用</RebornText>
        <RebornSwitch v-model="disabled" active-label="是" inactive-label="否" />
      </view>

      <view class="col-span-2">
        <RebornText color="neutral">形态变体 variant</RebornText>
        <RebornRadioGroup v-model="currentVariant">
          <RebornRadio v-for="v in inputVariants" :key="v" :value="v" :label="v" />
        </RebornRadioGroup>
      </view>

      <view class="col-span-2">
        <RebornText color="neutral">形状轮廓 shape</RebornText>
        <RebornRadioGroup v-model="currentShape">
          <RebornRadio v-for="s in inputShapes" :key="s" :value="s" :label="s" />
        </RebornRadioGroup>
      </view>

      <view>
        <RebornText color="neutral">可清空</RebornText>
        <RebornSwitch v-model="clearable" active-label="是" inactive-label="否" />
      </view>
    </RebornCard>

    <!-- 形态与形状 -->
    <RebornCard title="形态与形状" custom-class="flex flex-col gap-3">
      <text class="text-24 text-slate-500">
        variant 提供四种形态，underlined 会强制压平圆角；shape 的 square 按尺寸取圆角令牌（4/6/8rpx），circle 为胶囊。
      </text>
      <view v-for="v in inputVariants" :key="v" class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">{{ v }}</text>
        <RebornInput v-model="variantValue" :variant="v" placeholder="请输入" />
      </view>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">circle · 胶囊</text>
        <RebornInput v-model="variantValue" variant="outlined" shape="circle" placeholder="请输入" />
      </view>
    </RebornCard>

    <!-- 前后缀与前后置块 -->
    <RebornCard title="前后缀与前后置块" custom-class="flex flex-col gap-3">
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">prefix-icon / suffix-icon</text>
        <RebornInput v-model="iconValue" prefix-icon="i-lucide-search" suffix-icon="i-lucide-calendar" placeholder="搜索日期" />
      </view>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">#prepend / #append 连体块</text>
        <RebornInput v-model="groupValue" variant="outlined" placeholder="域名前缀">
          <template #prepend>
            <text>https://</text>
          </template>
          <template #append>
            <text>.com</text>
          </template>
        </RebornInput>
      </view>
    </RebornCard>

    <!-- 字数统计 -->
    <RebornCard title="字数统计" custom-class="flex flex-col gap-3">
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">inside（默认）· maxlength 10</text>
        <RebornInput v-model="limitValue" :maxlength="10" show-word-limit placeholder="最多 10 字" />
      </view>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">outside · 统计显示在下方</text>
        <RebornInput v-model="limitOutsideValue" :maxlength="10" show-word-limit word-limit-position="outside" placeholder="统计显示在下方" />
      </view>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">textarea · 右下角</text>
        <RebornInput v-model="limitAreaValue" type="textarea" :maxlength="50" show-word-limit placeholder="多行文本统计" />
      </view>
    </RebornCard>

    <!-- 格式化与解析 -->
    <RebornCard title="格式化与解析" custom-class="flex flex-col gap-3">
      <text class="text-24 text-slate-500">
        formatter 决定展示文本，parser 还原绑定值，仅 type="text" 时生效。
      </text>
      <RebornInput v-model="formattedValue" :formatter="formatThousands" :parser="parseThousands" placeholder="输入数字" />
      <text class="text-24 text-gray-6">绑定值：{{ formattedValue }}</text>
    </RebornCard>

    <!-- 密码与清除 -->
    <RebornCard title="密码与清除" custom-class="flex flex-col gap-3">
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">show-password</text>
        <RebornInput v-model="pwdValue" show-password placeholder="请输入密码" />
      </view>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">自定义 #password-icon</text>
        <RebornInput v-model="pwdValue" show-password placeholder="请输入密码">
          <template #password-icon="{ visible }">
            <view :class="visible ? 'i-lucide-unlock' : 'i-lucide-lock'" />
          </template>
        </RebornInput>
      </view>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">clearable + clear-icon</text>
        <RebornInput v-model="clearValue" clearable clear-icon="i-lucide-trash-2" placeholder="可清空" />
      </view>
    </RebornCard>

    <!-- 多行文本 -->
    <RebornCard title="多行文本" custom-class="flex flex-col gap-3">
      <text class="text-24 text-slate-500">
        type="textarea" 渲染为多行输入；autosize 映射原生 auto-height，高度随内容自适应。
      </text>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">固定 rows = 3</text>
        <RebornInput v-model="textareaValue" type="textarea" :rows="3" placeholder="请输入多行内容..." />
      </view>
      <view class="flex flex-col gap-1">
        <text class="text-24 text-gray-6">autosize · 高度自适应</text>
        <RebornInput v-model="autosizeValue" type="textarea" autosize placeholder="高度自适应..." />
      </view>
    </RebornCard>
  </RebornPage>
</template>
