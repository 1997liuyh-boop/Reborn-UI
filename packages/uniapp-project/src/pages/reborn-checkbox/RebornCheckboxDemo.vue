<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornCheckbox from '@/components/reborn-checkbox/RebornCheckbox.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const checked1 = ref(true)
const checked2 = ref(false)
const groupValues = ref(['Option A'])
const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
</script>

<template>
  <RebornPage title="复选框 (Checkbox)" description="交互式复选框组件，支持布尔值或多选。">
    <!-- Combined View -->
    <RebornCard title="组合视图" custom-class="space-y-3">
      <view
        class="
          text-sm text-slate-600
          dark:text-slate-200
        "
      >
        已选: {{ groupValues }}
      </view>
      <view class="flex flex-col gap-2">
        <RebornCheckbox v-model="groupValues" value="Option A" label="选项 A" />
        <RebornCheckbox v-model="groupValues" value="Option B" label="选项 B" />
        <RebornCheckbox v-model="groupValues" value="Option C" label="选项 C" />
      </view>
      <view class="flex flex-col gap-3">
        <RebornCheckbox
          v-model="groupValues" value="基础版" :ui="{
            wrapper: 'w-full bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all items-start',
            label: 'flex-1',
          }"
          :customClass="groupValues.includes('基础版') ? 'border-primary ring-1 ring-primary' : 'border-slate-200'"
        >
          <view class="flex flex-col gap-1">
            <text
              class="
                font-bold text-slate-900
                dark:text-slate-100
              "
            >
              基础版
            </text>
            <text
              class="
                text-sm text-slate-500
                dark:text-slate-200
              "
            >
              适合快速接入的轻量配置。
            </text>
          </view>
        </RebornCheckbox>

        <RebornCheckbox
          v-model="groupValues" value="标准版" color="error" :ui="{
            wrapper: 'w-full bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all items-start',
            label: 'flex-1',
          }" :customClass="groupValues.includes('标准版') ? 'border-error ring-1 ring-error' : 'border-slate-200'"
        >
          <view class="flex flex-col gap-1">
            <text
              class="
                font-bold text-slate-900
                dark:text-slate-100
              "
            >
              标准版
            </text>
            <text
              class="
                text-sm text-slate-500
                dark:text-slate-200
              "
            >
              涵盖常用场景的均衡方案。
            </text>
          </view>
        </RebornCheckbox>

        <RebornCheckbox
          v-model="groupValues" value="旗舰版" color="neutral" :ui="{
            wrapper: 'w-full bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all items-start',
            label: 'flex-1',
          }"
          :customClass="groupValues.includes('旗舰版') ? 'border-neutral ring-1 ring-neutral' : 'border-slate-200'"
        >
          <view class="flex flex-col gap-1">
            <text
              class="
                font-bold text-slate-900
                dark:text-slate-100
              "
            >
              旗舰版
            </text>
            <text
              class="
                text-sm text-slate-500
                dark:text-slate-200
              "
            >
              完整能力组合，满足复杂业务。
            </text>
          </view>
        </RebornCheckbox>
      </view>
    </RebornCard>

    <!-- Advanced Customization -->
    <RebornCard title="高级定制">
      <view
        class="
          grid grid-cols-1 gap-4
          md:grid-cols-2
        "
      >
        <!-- Custom UI -->
        <RebornCheckbox
          v-model="checked1" color="error" label="完全圆角 (Custom UI)" :ui="{
            control: 'rounded-full size-6',
            icon: 'size-4',
          }"
        />

        <!-- Custom Slot -->
        <RebornCheckbox
          v-model="checked1" color="error" label="自定义图标、大小 (Slot)" :ui="{
            control: 'size-8 rounded-lg group-[.is-checked]:bg-orange-5 group-[.is-checked]:border-green-5',
          }"
        >
          <template #icon="{ checked }">
            <view
              class="i-lucide-heart transition-all duration-300"
              :class="[checked ? 'scale-100 text-white' : `scale-0`]"
            />
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
