<script setup lang="ts">
import type { SelectOption } from '@/components/reborn-picker-view/RebornPickerView.vue'
import { reactive, ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { selectColors, selectSizes } from '@/components/reborn-select/reborn-select.config'
import RebornSelect from '@/components/reborn-select/RebornSelect.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

const isShowCancel = ref(true)
const isButtonText = ref(false)
const isDisabled = ref(false)
const isShowClear = ref(true)
const splitor = ref('-')
const currentColor = ref<typeof selectColors[number]>(selectColors[0])
const currentSize = ref<typeof selectSizes[number]>(selectSizes[1])

interface Form {
  selected: number | null
  selected2: string
  selected3: number[]
}

const form = reactive<Form>({
  selected: 3,
  selected2: '#FF6600',
  selected3: [1, 3, 4],
})

const selectRef2 = ref<InstanceType<typeof RebornSelect> | null>(null)

const options = ref<SelectOption[]>([
  { label: 'HTML', value: 1 },
  { label: 'CSS', value: 2 },
  { label: 'JavaScript', value: 3 },
  { label: 'Node', value: 4 },
  { label: 'Vite', value: 5 },
  { label: 'Webpack', value: 6 },
])

const options2 = ref<SelectOption[]>([
  {
    value: '#E63415',
    label: 'red',
  },
  {
    value: '#FF6600',
    label: 'orange',
  },
  {
    value: '#FFDE0A',
    label: 'yellow',
  },
  {
    value: '#1EC79D',
    label: 'green',
  },
  {
    value: '#14CCCC',
    label: 'cyan',
  },
  {
    value: '#4167F0',
    label: 'blue',
  },
  {
    value: '#6222C9',
    label: 'purple',
  },
])

const options3 = ref<SelectOption[]>([
  {
    label: '福建省',
    value: 1,
    children: [
      {
        label: '福州市',
        value: 1,
        children: [
          { label: '鼓楼区', value: 1 },
          { label: '台江区', value: 2 },
          { label: '仓山区', value: 3 },
          { label: '马尾区', value: 4 },
        ],
      },
      {
        label: '厦门市',
        value: 2,
        children: [
          { label: '思明区', value: 1 },
          { label: '湖里区', value: 2 },
          { label: '集美区', value: 3 },
          { label: '海沧区', value: 4 },
        ],
      },
      {
        label: '泉州市',
        value: 3,
        children: [
          { label: '鲤城区', value: 1 },
          { label: '丰泽区', value: 2 },
          { label: '洛江区', value: 3 },
          { label: '泉港区', value: 4 },
        ],
      },
    ],
  },
  {
    label: '浙江省',
    value: 2,
    children: [
      {
        label: '杭州市',
        value: 1,
        children: [
          { label: '上城区', value: 1 },
          { label: '下城区', value: 2 },
          { label: '江干区', value: 3 },
          { label: '拱墅区', value: 4 },
        ],
      },
      {
        label: '宁波市',
        value: 2,
        children: [
          { label: '海曙区', value: 1 },
          { label: '江北区', value: 2 },
          { label: '北仑区', value: 3 },
        ],
      },
    ],
  },
  {
    label: '湖南省',
    value: 3,
    children: [
      {
        label: '长沙市',
        value: 1,
        children: [
          { label: '芙蓉区', value: 1 },
          { label: '天心区', value: 2 },
          { label: '岳麓区', value: 3 },
        ],
      },
      {
        label: '株洲市',
        value: 2,
        children: [
          { label: '荷塘区', value: 1 },
          { label: '芦淞区', value: 2 },
        ],
      },
    ],
  },
  {
    label: '江西省',
    value: 4,
    children: [
      {
        label: '南昌市',
        value: 1,
        children: [
          { label: '东湖区', value: 1 },
          { label: '西湖区', value: 2 },
          { label: '青云谱区', value: 3 },
        ],
      },
      {
        label: '九江市',
        value: 2,
        children: [
          { label: '浔阳区', value: 1 },
          { label: '濂溪区', value: 2 },
        ],
      },
    ],
  },
])

const options4 = ref<SelectOption[]>([])

function openSelect2() {
  selectRef2.value?.open((value: any) => {
    const d = options2.value.find(item => item.value == value)
    uni.showToast({ title: `你选择了 ${d?.label}`, icon: 'none' })
  })
}
</script>

<template>
  <RebornPage title="选择器" description="用于从一组选项中选择一个值的组件。">
    <RebornCard title="基础用法" overflow-visible>
      <view class="text-xs">
        基础配置
      </view>
      <RebornSelect v-model="form.selected" :options="options" :disabled="isDisabled" :show-cancel="isShowCancel"
        :clearable="isShowClear" :size="currentSize" :color="currentColor" :confirm-text="isButtonText ? '下一步' : '确定'"
        :cancel-text="isButtonText ? '关闭' : '取消'" />

      <view class="text-xs">
        插槽
      </view>
      <RebornSelect v-model="form.selected2" :options="options2" :disabled="isDisabled" :show-cancel="isShowCancel"
        :clearable="isShowClear" :size="currentSize" :color="currentColor" :confirm-text="isButtonText ? '下一步' : '确定'"
        :cancel-text="isButtonText ? '关闭' : '取消'">
        <template #tag="{ selectItem }">
          <view v-for="value in selectItem" :key="value.value" class="
              flex items-center
            ">
            <view class="mr-1 size-3 rounded-full" :style="{ backgroundColor: value.value }" />
            <text :style="{ color: value.value }">{{ value.label }}</text>
          </view>
        </template>
        <template #option="{ item, index }">
          <view class="mr-1 size-3 rounded-full" :style="{ backgroundColor: item.value }" />
          <text :style="{ color: item.value }">{{ item.label }}</text>
        </template>
      </RebornSelect>

      <view class="text-xs">
        自定义样式
      </view>
      <RebornSelect v-model="form.selected3" :options="options3" :column-count="3" :size="currentSize"
        :color="currentColor" :splitor="splitor" :triggerUi="{ text: 'text-red-5' }" />
    </RebornCard>
    <RebornCard title="控制器" overflow-visible>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">尺寸 (Size)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="size in selectSizes" :key="size">
            <RebornButton size="xs" :variant="currentSize === size ? 'solid' : 'outline'"
              :color="currentSize === size ? 'primary' : 'neutral'" @tap="currentSize = size">
              {{ size }}
            </RebornButton>
          </view>
        </view>
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">颜色 (Color)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="c in selectColors" :key="c" class="
              size-4 cursor-pointer rounded-full ring-2 ring-transparent
              ring-offset-2 transition-all
            " :class="[
              `
                bg-${c}
              `,
              currentColor === c ? 'scale-110 ring-slate-400' : `
                hover:scale-110
              `,
            ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
            @click="currentColor = c" />
        </view>
      </view>
      <view class="mt-2 flex justify-between">
        <text class="text-sm text-slate-500">显示取消按钮</text>
        <RebornSwitch v-model="isShowCancel" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">显示清空按钮</text>
        <RebornSwitch v-model="isShowClear" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">修改按钮文案</text>
        <RebornSwitch v-model="isButtonText" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">禁用</text>
        <RebornSwitch v-model="isDisabled" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">分割符号</text>
        <view>
          <RebornInput v-model="splitor" size="sm" />
        </view>
      </view>
    </RebornCard>
    <!-- 自定义触发器 -->
    <RebornCard title="自定义触发器" overflow-visible>
      <view class="text-xs text-gray-4">
        通过 show-trigger 隐藏默认触发器，使用 ref 调用 open 方法打开
      </view>
      <RebornButton variant="outline" color="primary" @tap="openSelect2">
        打开选择器
      </RebornButton>
      <RebornSelect ref="selectRef2" v-model="form.selected2" :options="options2" :show-trigger="false" />
    </RebornCard>

    <!-- 空数据 -->
    <RebornCard title="空数据" overflow-visible>
      <RebornSelect v-model="form.selected" :options="options4" />
    </RebornCard>
  </RebornPage>
</template>
