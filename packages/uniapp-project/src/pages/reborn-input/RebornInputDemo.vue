<script setup lang="ts">
import { ref } from 'vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

import RebornInput from '@/components/reborn-input/RebornInput.vue'
import { inputColors, inputSizes } from '@/components/reborn-input/reborn-input.config'
import RebornImage from '@/components/reborn-image/RebornImage.vue'

const input1 = ref('')
const input2 = ref('')

const isTranslated = ref(false)

function toggleTranslate() {
  isTranslated.value = !isTranslated.value
}

const colors = ref<typeof inputColors[number]>('neutral')
const currentSize = ref<typeof inputSizes[number]>('sm')
const disabled = ref(false)
const rounded = ref(false)
const password = ref(false)
const clearable = ref(true)
const border = ref(true)

</script>

<template>

  <RebornPage title="输入框" description="用于接收用户输入的数据。">

    <RebornCard title="示例" custom-class="flex flex-col gap-2">
      <RebornInput v-model="input1" :size="currentSize" :color="colors" :password="password" :disabled="disabled"
        :rounded="rounded" :clearable="clearable" :border="border" placeholder="基础用法..." />
      <RebornInput v-model="input2" :size="currentSize" :color="colors" :password="password" :disabled="disabled"
        :rounded="rounded" :clearable="clearable" :border="border" placeholder="插槽">
        <template #leading="{ ui }">
          <view class="i-lucide-search text-gray-400" :class="ui.trailing()" />
        </template>
        <template #trailing="{ ui }">
          <view class="i-lucide-calendar text-gray-400" :class="ui.trailing()" />
        </template>
      </RebornInput>
      <RebornInput v-model="input2" :size="currentSize" :color="colors" :password="password" :disabled="disabled"
        :rounded="rounded" :clearable="clearable" :border="border" placeholder="关键词/商品ID/网址">
        <template #leading>
          <RebornImage src="https://mall.leyifan.cn/static/h5/new_images/index_search_small.png?v=1" width="30"
            height="30" mode="widthFix" />
        </template>
        <template #trailing>
          <view class="relative h-[80rpx] w-[80rpx] flex items-center justify-center" @tap.stop="toggleTranslate">
            <view
              class="absolute left-[8rpx] top-[12rpx] flex h-[46rpx] w-[46rpx] items-center justify-center rounded-[8rpx] border text-[22rpx] font-bold transition-all duration-300"
              :class="[isTranslated ? 'translate-x-[26rpx] translate-y-[12rpx] z-10 border-info bg-white text-info shadow-sm' : 'z-0 border-gray-200 bg-[#f8f9fa] text-gray-400']">
              译
            </view>
            <view
              class="absolute left-[34rpx] top-[24rpx] flex h-[46rpx] w-[46rpx] items-center justify-center rounded-[8rpx] border text-[22rpx] font-bold transition-all duration-300"
              :class="[isTranslated ? '-translate-x-[26rpx] -translate-y-[12rpx] z-0 border-gray-200 bg-[#f8f9fa] text-gray-400' : 'z-10 border-info bg-white text-info shadow-sm']">
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
          <RebornRadio v-for="item in inputColors" :key="item" :value="item" :showIcon="false">
            <template #default="{ isChecked }">
              <view class="relative flex size-5">
                <view v-if="isChecked" class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  :class="`bg-${item}`">
                </view>
                <view class="relative inline-flex size-5 rounded-full" :class="`bg-${item}`"></view>
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

      <view>
        <RebornText color="neutral">圆角</RebornText>
        <RebornSwitch v-model="rounded" active-label="是" inactive-label="否" />
      </view>

      <view>
        <RebornText color="neutral">可清空</RebornText>
        <RebornSwitch v-model="clearable" active-label="是" inactive-label="否" />
      </view>

      <view>
        <RebornText color="neutral">有边框</RebornText>
        <RebornSwitch v-model="border" active-label="是" inactive-label="否" />
      </view>
    </RebornCard>
  </RebornPage>
</template>
