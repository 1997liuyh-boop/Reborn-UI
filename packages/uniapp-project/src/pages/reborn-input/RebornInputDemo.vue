<script setup lang="ts">
import type { InputType } from '@/components/reborn-input/RebornInput.vue'
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const input1 = ref('')
const input2 = ref('')
const input3 = ref('')
const input4 = ref('')
const input5 = ref('')
const input6 = ref('')
const input7 = ref('')
const input8 = ref('')

// Global Size Control
const sizes = ['sm', 'md', 'lg'] as const
const currentSize = ref<typeof sizes[number]>('md')

const inputTypes: InputType[] = [
  'tel',
  'url',
  'text',
  'email',
  'digit',
  'number',
  'idcard',
  'search',
  'decimal',
  'numeric',
  'nickname',
  'safe-password',
]
const currentType = ref<InputType>('text')
</script>

<template>
  <RebornPage title="输入框" description="用于接收用户输入的数据。">
    <!-- Size Control -->
    <RebornCard title="全局尺寸控制" custom-class="flex flex-row gap-2">
      <ReButton
        v-for="size in sizes" :key="size" :size="size === 'lg' ? 'md' : 'sm'"
        :variant="currentSize === size ? 'solid' : 'outline'" color="neutral" @click="currentSize = size"
      >
        {{ size.toUpperCase() }}
      </ReButton>
    </RebornCard>

    <!-- Basic -->
    <RebornCard title="基础用法" custom-class="flex flex-col gap-2">
      <RebornInput v-model="input1" :size="currentSize" placeholder="请输入内容..." />
      <RebornInput v-model="input1" :size="currentSize" placeholder="圆角输入框" rounded />
      <RebornInput v-model="input1" :size="currentSize" placeholder="直角输入框" :rounded="false" />
    </RebornCard>

    <!-- Dynamic Configuration (Type) -->
    <RebornCard title="输入类型配置" custom-class="flex flex-col gap-2">
      <view class="space-y-2">
        <text class="text-sm text-gray-500">选择类型 (Type)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="t in inputTypes" :key="t">
            <ReButton :color="currentType === t ? 'primary' : 'info'" size="xs" @click="currentType = t">
              {{ t }}
            </ReButton>
          </view>
        </view>
      </view>
      <RebornInput
        v-model="input8" :size="currentSize" :type="currentType"
        :placeholder="`当前类型: ${currentType}`"
      />
    </RebornCard>

    <!-- Disabled -->
    <RebornCard title="禁用状态" custom-class="flex flex-col gap-2">
      <RebornInput v-model="input2" :size="currentSize" placeholder="禁用状态" disabled />
      <RebornInput v-model="input2" :size="currentSize" placeholder="只读状态" readonly />
    </RebornCard>

    <!-- Features -->
    <RebornCard title="功能" custom-class="flex flex-col gap-2">
      <RebornInput v-model="input3" :size="currentSize" placeholder="密码输入" password />
      <RebornInput v-model="input4" :size="currentSize" placeholder="可清除" clearable />
    </RebornCard>

    <!-- Slots & Icons -->
    <RebornCard title="插槽与图标" custom-class="flex flex-col gap-2">
      <RebornInput v-model="input5" :size="currentSize" placeholder="自定义前置图标">
        <template #leading>
          <view
            class="i-lucide-search text-gray-400" :class="currentSize === 'sm' ? `
              size-3.5
            ` : `size-4`"
          />
        </template>
      </RebornInput>

      <RebornInput v-model="input5" :size="currentSize" placeholder="自定义后置图标">
        <template #trailing>
          <view
            class="i-lucide-calendar text-gray-400"
            :class="currentSize === 'sm' ? 'size-3.5' : 'size-4'"
          />
        </template>
      </RebornInput>

      <RebornInput v-model="input7" :size="currentSize" placeholder="自定义后置文本">
        <template #trailing>
          <text
            class="font-medium text-gray-500"
            :class="currentSize === 'sm' ? 'text-xs' : 'text-sm'"
          >
            RMB
          </text>
        </template>
      </RebornInput>
    </RebornCard>

    <!-- Textarea -->
    <!-- <RebornCard title="文本域" custom-class="flex flex-col gap-2">
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <RebornInput v-model="input6" as="textarea" :rows="4" placeholder="请输入多行文本..." />
                <textarea placeholder-style="color:#F76260" placeholder="占位符字体是红色的" />
            </view>
        </RebornCard> -->
  </RebornPage>
</template>
