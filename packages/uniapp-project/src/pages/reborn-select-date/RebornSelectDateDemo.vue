<script setup lang="ts">
import type { SelectDateShortcut } from '@/components/reborn-select-date/types'
import { ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornSelectDate from '@/components/reborn-select-date/RebornSelectDate.vue'
import { selectDateColors } from '@/components/reborn-select-date/reborn-select-date.config'

// 1. 基础用法
const date1 = ref('')

// 2. 固定开始、结束日期
const date2 = ref('')

// 3. 自定义触发器
const date3 = ref('')
const selectDateRef3 = ref<InstanceType<typeof RebornSelectDate> | null>(null)

function openSelectDate3() {
    selectDateRef3.value?.open((value: any) => {
        uni.showToast({ title: `选择了: ${value}`, icon: 'none' })
    })
}

// 4. 范围选择
const rangeValues = ref<string[]>([])

// 5. 自定义快捷选项
const rangeValues2 = ref<string[]>([])
const customShortcuts: SelectDateShortcut[] = [
    { label: '今天', value: ['2026-02-27', '2026-02-27'] },
    { label: '本周', value: ['2026-02-23', '2026-02-27'] },
    { label: '本月', value: ['2026-02-01', '2026-02-28'] },
    { label: '上月', value: ['2026-01-01', '2026-01-31'] },
    { label: '今年', value: ['2026-01-01', '2026-12-31'] },
]

// 6. 自定义日期格式
const dateFormat = ref('')
const currentType = ref<'year' | 'month' | 'date' | 'hour' | 'minute' | 'second'>('date')
const currentColor = ref<typeof selectDateColors[number]>(selectDateColors[0])
const typeOptions = [
    { label: 'YYYY', value: 'year' },
    { label: 'YYYY-MM', value: 'month' },
    { label: 'YYYY-MM-DD', value: 'date' },
    { label: 'YYYY-MM-DD HH', value: 'hour' },
    { label: 'YYYY-MM-DD HH:mm', value: 'minute' },
    { label: 'YYYY-MM-DD HH:mm:ss', value: 'second' },
] as const
</script>

<template>
    <RebornPage title="日期选择器" description="用于选择日期/时间的组件，支持范围选择和多种日期格式。">
        <RebornCard title="配置" custom-class="space-y-4">
            <view class="space-y-3">
                <view class="
                text-sm font-medium text-slate-500
                dark:text-slate-200
              ">
                    按钮颜色
                </view>
                <view class="flex flex-wrap gap-2">
                    <view v-for="c in selectDateColors" :key="c" class="
                  size-6 cursor-pointer rounded-full ring-2 ring-transparent
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
        </RebornCard>
        <!-- 1. 基础用法 -->
        <RebornCard title="基础用法" custom-class="space-y-4">
            <view class="text-xs text-gray-4">
                默认配置，类型为 second，显示完整日期时间选择。
            </view>
            <RebornSelectDate v-model="date1" :color="currentColor" />
            <RebornSelectDate v-model="date1" :color="currentColor">
                <template #tag>
                    <view class="text-xs text-surface-500">
                        {{ date1 || '未选择' }}
                    </view>
                </template>
            </RebornSelectDate>
            <view class="text-xs text-surface-500">
                当前值：{{ date1 || '未选择' }}
            </view>
        </RebornCard>

        <!-- 2. 固定开始、结束日期 -->
        <RebornCard title="固定开始、结束日期" custom-class="space-y-4">
            <view class="text-xs text-gray-4">
                通过 start 和 end 属性限制可选日期范围。
            </view>
            <RebornSelectDate v-model="date2" type="date" start="2025-01-01" end="2026-12-31" :color="currentColor"
                placeholder="选择日期 (2025~2026)" />
            <view class="text-xs text-surface-500">
                当前值：{{ date2 || '未选择' }}
            </view>
        </RebornCard>

        <!-- 3. 自定义触发器 -->
        <RebornCard title="自定义触发器" custom-class="space-y-4">
            <view class="text-xs text-gray-4">
                通过 show-trigger 隐藏默认触发器，使用 ref 调用 open 方法打开。
            </view>
            <RebornButton variant="outline" color="primary" @tap="openSelectDate3">
                打开日期选择器
            </RebornButton>
            <RebornSelectDate ref="selectDateRef3" v-model="date3" type="date" :show-trigger="false"
                :color="currentColor" />
            <view class="text-xs text-surface-500">
                当前值：{{ date3 || '未选择' }}
            </view>
        </RebornCard>

        <!-- 4. 范围选择 -->
        <RebornCard title="范围选择" custom-class="space-y-4">
            <view class="text-xs text-gray-4">
                通过 rangeable 开启范围选择模式，使用 v-model:values 绑定范围值。
            </view>
            <RebornSelectDate v-model:values="rangeValues" type="date" :rangeable="true" start-placeholder="开始日期"
                :color="currentColor" end-placeholder="结束日期" />
            <view class="text-xs text-surface-500">
                当前范围：{{ rangeValues.length > 0 && rangeValues[0] ? `${rangeValues[0]} 至 ${rangeValues[1]}` : '未选择' }}
            </view>
        </RebornCard>

        <!-- 5. 自定义快捷选项 -->
        <RebornCard title="自定义快捷选项" custom-class="space-y-4">
            <view class="text-xs text-gray-4">
                通过 shortcuts 属性自定义快捷选项，需配合 rangeable 使用。
            </view>
            <RebornSelectDate v-model:values="rangeValues2" type="date" :rangeable="true" :shortcuts="customShortcuts"
                :color="currentColor" :show-shortcuts="true" />
            <view class="text-xs text-surface-500">
                当前范围：{{ rangeValues2.length > 0 && rangeValues2[0] ? `${rangeValues2[0]} 至 ${rangeValues2[1]}` : '未选择'
                }}
            </view>
        </RebornCard>

        <!-- 6. 自定义日期格式 -->
        <RebornCard title="自定义日期格式" custom-class="space-y-4">
            <view class="text-xs text-gray-4">
                通过 type 属性切换日期精度，使用 Radio 组件选择不同格式。
            </view>
            <view class="flex flex-wrap gap-3">
                <RebornRadio v-for="item in typeOptions" :key="item.value" v-model="currentType" :value="item.value"
                    :label="item.label" size="sm" />
            </view>
            <RebornSelectDate v-model="dateFormat" :type="currentType" placeholder="选择日期" :color="currentColor" />
            <view class="text-xs text-surface-500">
                格式：{{typeOptions.find(t => t.value === currentType)?.label}} | 当前值：{{ dateFormat || '未选择' }}
            </view>
        </RebornCard>
    </RebornPage>
</template>
