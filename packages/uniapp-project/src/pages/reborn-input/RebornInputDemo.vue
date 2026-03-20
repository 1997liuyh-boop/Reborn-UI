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

const input1 = ref('')
const input2 = ref('五条悟')

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
        <RebornText color="neutral">是否密码</RebornText>
        <RebornSwitch v-model="password" active-label="是" inactive-label="否" />
      </view>

      <view>
        <RebornText color="neutral">是否禁用</RebornText>
        <RebornSwitch v-model="disabled" active-label="是" inactive-label="否" />
      </view>

      <view>
        <RebornText color="neutral">是否圆角</RebornText>
        <RebornSwitch v-model="rounded" active-label="是" inactive-label="否" />
      </view>

      <view>
        <RebornText color="neutral">是否可清空</RebornText>
        <RebornSwitch v-model="clearable" active-label="是" inactive-label="否" />
      </view>

      <view>
        <RebornText color="neutral">有边框</RebornText>
        <RebornSwitch v-model="border" active-label="是" inactive-label="否" />
      </view>
    </RebornCard>
  </RebornPage>
</template>
