<script setup lang="ts">
import { computed, ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornCheckbox from '@/components/reborn-checkbox/RebornCheckbox.vue'
import RebornCheckboxGroup from '@/components/reborn-checkbox/RebornCheckboxGroup.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const checked1 = ref(true)
const checked2 = ref(false)
const groupValues = ref(['Option A'])
const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const

/** 半选与全选：父级勾选框的状态由子项选中数量推导 */
const allFruits = ['苹果', '香蕉', '橙子']
const fruits = ref<string[]>(['苹果'])
const isAllFruitChecked = computed(() => fruits.value.length === allFruits.length)
const isPartFruitChecked = computed(() => fruits.value.length > 0 && !isAllFruitChecked.value)

/** 点击父级勾选框：全选或全不选 */
function toggleAllFruits() {
  fruits.value = isAllFruitChecked.value ? [] : [...allFruits]
}

/** 数据驱动的复选框组：options 支持对象写法，可逐项禁用 */
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '开发', value: 'dev' },
  { label: '测试', value: 'qa' },
  { label: '运维', value: 'ops', disabled: true },
]
const roles = ref<string[]>(['dev'])

/** max 限制：选满两项后未选中的选项自动禁用 */
const limitedRoles = ref<string[]>([])

/** 样式变体矩阵：两种变体各演示未选、选中、半选三态 */
const variantMatrix = [
  { variant: 'filled' as const, note: '默认值。选中与半选都填充配色，图标为白色。' },
  {
    variant: 'outlined' as const,
    note: '选中不填充背景，只把边框与图标染成配色；半选时边框保持灰色，中间是同色实心小方块。',
  },
]
const variantUnchecked = ref(false)
const variantChecked = ref(true)

/** outlined 变体的配色对照 */
const variantColors = ['primary', 'success', 'warning', 'error'] as const
</script>

<template>
  <RebornPage title="复选框 (Checkbox)" description="交互式复选框组件，支持布尔值或多选。">
    <!-- Combined View -->
    <RebornCard title="组合视图" custom-class="space-y-3">
      <view class="
          text-sm text-slate-600
          dark:text-slate-200
        ">
        已选: {{ groupValues }}
      </view>
      <view class="flex flex-col gap-2">
        <RebornCheckbox v-model="groupValues" value="Option A" label="选项 A" />
        <RebornCheckbox v-model="groupValues" value="Option B" label="选项 B" />
        <RebornCheckbox v-model="groupValues" value="Option C" label="选项 C" />
      </view>
      <view class="flex flex-col gap-3">
        <RebornCheckbox v-model="groupValues" value="基础版" :ui="{
          wrapper: 'w-full bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all items-start',
          label: 'flex-1',
        }" :customClass="groupValues.includes('基础版') ? 'border-primary ring-1 ring-primary' : 'border-slate-200'">
          <view class="flex flex-col gap-1">
            <text class="
                font-bold text-slate-900
                dark:text-slate-100
              ">
              基础版
            </text>
            <text class="
                text-sm text-slate-500
                dark:text-slate-200
              ">
              适合快速接入的轻量配置。
            </text>
          </view>
        </RebornCheckbox>

        <RebornCheckbox v-model="groupValues" value="标准版" color="error" :ui="{
          wrapper: 'w-full bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all items-start',
          label: 'flex-1',
        }" :customClass="groupValues.includes('标准版') ? 'border-error ring-1 ring-error' : 'border-slate-200'">
          <view class="flex flex-col gap-1">
            <text class="
                font-bold text-slate-900
                dark:text-slate-100
              ">
              标准版
            </text>
            <text class="
                text-sm text-slate-500
                dark:text-slate-200
              ">
              涵盖常用场景的均衡方案。
            </text>
          </view>
        </RebornCheckbox>

        <RebornCheckbox v-model="groupValues" value="旗舰版" color="neutral" :ui="{
          wrapper: 'w-full bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all items-start',
          label: 'flex-1',
        }" :customClass="groupValues.includes('旗舰版') ? 'border-neutral ring-1 ring-neutral' : 'border-slate-200'">
          <view class="flex flex-col gap-1">
            <text class="
                font-bold text-slate-900
                dark:text-slate-100
              ">
              旗舰版
            </text>
            <text class="
                text-sm text-slate-500
                dark:text-slate-200
              ">
              完整能力组合，满足复杂业务。
            </text>
          </view>
        </RebornCheckbox>
      </view>
    </RebornCard>

    <!-- 半选与全选 -->
    <RebornCard title="半选与全选" custom-class="flex flex-col gap-[16rpx]">
      <RebornCheckbox
        :model-value="isAllFruitChecked" :indeterminate="isPartFruitChecked" label="全选"
        @change="toggleAllFruits"
      />
      <RebornCheckboxGroup v-model="fruits" direction="vertical" custom-class="pl-[48rpx]">
        <RebornCheckbox v-for="fruit in allFruits" :key="fruit" :value="fruit" :label="fruit" />
      </RebornCheckboxGroup>
      <view class="
          text-sm text-slate-500
          dark:text-slate-200
        ">
        已选 {{ fruits.length }} / {{ allFruits.length }} 项
      </view>
    </RebornCard>

    <!-- 样式变体 -->
    <RebornCard title="样式变体 (Variants)" custom-class="flex flex-col gap-[24rpx]">
      <view v-for="item in variantMatrix" :key="item.variant" class="flex flex-col gap-[12rpx]">
        <text class="
            text-sm text-slate-500
            dark:text-slate-200
          ">
          variant="{{ item.variant }}"
        </text>
        <view class="flex flex-wrap items-center gap-[32rpx]">
          <RebornCheckbox v-model="variantUnchecked" :variant="item.variant" label="未选" />
          <RebornCheckbox v-model="variantChecked" :variant="item.variant" label="选中" />
          <RebornCheckbox :model-value="false" :variant="item.variant" indeterminate label="半选" />
        </view>
        <text class="text-xs text-slate-400">{{ item.note }}</text>
      </view>

      <view class="flex flex-wrap items-center gap-[32rpx]">
        <RebornCheckbox
          v-for="color in variantColors" :key="color" :model-value="true" variant="outlined"
          :color="color" :label="color"
        />
      </view>
    </RebornCard>

    <!-- 复选框组 -->
    <RebornCard title="复选框组 (CheckboxGroup)" custom-class="flex flex-col gap-[24rpx]">
      <view class="flex flex-col gap-[12rpx]">
        <text class="
            text-sm text-slate-500
            dark:text-slate-200
          ">
          options 数据驱动 · 横向排列
        </text>
        <RebornCheckboxGroup v-model="roles" :options="roleOptions" />
      </view>

      <view class="flex flex-col gap-[12rpx]">
        <text class="
            text-sm text-slate-500
            dark:text-slate-200
          ">
          max=2 · 纵向排列 · label 插槽（已选 {{ limitedRoles.length }} / 2）
        </text>
        <RebornCheckboxGroup
          v-model="limitedRoles" :options="roleOptions" :max="2" color="success"
          direction="vertical"
        >
          <template #label="{ data }">
            <view class="flex items-center gap-[8rpx]">
              <text>{{ data.label }}</text>
              <text class="text-xs text-slate-400">{{ data.value }}</text>
            </view>
          </template>
        </RebornCheckboxGroup>
      </view>
    </RebornCard>

    <!-- Advanced Customization -->
    <RebornCard title="高级定制">
      <view class="
          grid grid-cols-1 gap-4
          md:grid-cols-2
        ">
        <!-- Custom UI -->
        <RebornCheckbox v-model="checked1" color="error" label="完全圆角 (Custom UI)" :ui="{
          control: 'rounded-full size-6',
          icon: 'size-4',
        }" />

        <!-- Custom Slot -->
        <RebornCheckbox v-model="checked1" color="error" label="自定义图标、大小 (Slot)" :ui="{
          control: 'size-8 rounded-lg group-[.is-checked]:bg-orange-5 group-[.is-checked]:border-green-5',
        }">
          <template #icon="{ checked }">
            <view class="transition-all duration-300"
              :class="[checked ? 'i-lucide-heart text-white' : `i-lucide-heart-crack text-gray-8`]" />
          </template>
        </RebornCheckbox>
      </view>
    </RebornCard>

    <!-- Basic Usage -->
    <RebornCard title="基础用法" custom-class="space-x-2">
      <RebornCheckbox v-model="checked1" label="接受条款和条件" />
      <RebornCheckbox v-model="checked2" label="订阅通过" />
    </RebornCard>

    <!-- States -->
    <RebornCard title="状态 (States)" custom-class="flex flex-col gap-2">
      <RebornCheckbox :model-value="true" label="已选中" />
      <RebornCheckbox :model-value="false" label="未选中" />
      <RebornCheckbox :model-value="true" disabled label="禁用且选中" />
      <RebornCheckbox :model-value="false" disabled label="禁用且未选中" />
    </RebornCard>

    <!-- Colors -->
    <RebornCard title="颜色 (Colors)" custom-class="flex flex-wrap gap-2">
      <RebornCheckbox v-for="color in colors" :key="color" v-model="checked1" :color="color" :label="color" />
    </RebornCard>

    <!-- Sizes -->
    <RebornCard title="尺寸 (Sizes)" custom-class="flex flex-wrap gap-2">
      <RebornCheckbox v-for="size in sizes" :key="size" v-model="checked1" :size="size" :label="`Size ${size}`" />
    </RebornCard>
  </RebornPage>
</template>
