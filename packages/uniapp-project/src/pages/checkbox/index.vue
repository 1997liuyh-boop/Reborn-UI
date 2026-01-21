<script setup lang="ts">
import { ref } from 'vue'
import RebornCheckbox from '@/components/reborn-checkbox/RebornCheckbox.vue'

const checked1 = ref(true)
const checked2 = ref(false)
const groupValues = ref(['Option A'])
const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">复选框 (Checkbox)</view>
            <view class="text-slate-500">交互式复选框组件，支持布尔值或多选。</view>
        </view>

        <!-- Combined View -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">组合视图</view>
            <view class="flex flex-col gap-3">
                <RebornCheckbox v-model="groupValues" value="基础版" :ui="{
                    wrapper: 'w-full bg-white p-4 rounded-xl border transition-all items-start',
                    label: 'flex-1'
                }"
                    :customClass="groupValues.includes('基础版') ? 'border-primary ring-1 ring-primary' : 'border-slate-200'">
                    <view class="flex flex-col gap-1">
                        <text class="font-bold text-slate-900">基础版</text>
                        <text class="text-sm text-slate-500">适合快速接入的轻量配置。</text>
                    </view>
                </RebornCheckbox>

                <RebornCheckbox v-model="groupValues" value="标准版" color="error" :ui="{
                    wrapper: 'w-full bg-white p-4 rounded-xl border transition-all items-start',
                    label: 'flex-1'
                }" :customClass="groupValues.includes('标准版') ? 'border-error ring-1 ring-error' : 'border-slate-200'">
                    <view class="flex flex-col gap-1">
                        <text class="font-bold text-slate-900">标准版</text>
                        <text class="text-sm text-slate-500">涵盖常用场景的均衡方案。</text>
                    </view>
                </RebornCheckbox>

                <RebornCheckbox v-model="groupValues" value="旗舰版" color="neutral" :ui="{
                    wrapper: 'w-full bg-white p-4 rounded-xl border transition-all items-start',
                    label: 'flex-1'
                }"
                    :customClass="groupValues.includes('旗舰版') ? 'border-neutral ring-1 ring-neutral' : 'border-slate-200'">
                    <view class="flex flex-col gap-1">
                        <text class="font-bold text-slate-900">旗舰版</text>
                        <text class="text-sm text-slate-500">完整能力组合，满足复杂业务。</text>
                    </view>
                </RebornCheckbox>
            </view>
        </view>

        <!-- Advanced Customization -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">高级定制</view>
            <view class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Custom UI -->
                <view class="bg-white p-6 rounded-xl border border-slate-200">
                    <RebornCheckbox v-model="checked1" color="error" label="完全圆角 (Custom UI)" :ui="{
                        control: 'rounded-full size-6',
                        icon: 'size-4'
                    }" />
                </view>

                <!-- Custom Slot -->
                <view class="bg-white p-6 rounded-xl border border-slate-200">
                    <RebornCheckbox v-model="checked1" color="error" label="自定义图标、大小 (Slot)" :ui="{
                        control: 'size-8 rounded-lg',
                    }">
                        <template #icon="{ checked }">
                            <view class="i-lucide-heart transition-all duration-300"
                                :class="[checked ? 'scale-100 text-white' : 'scale-0']" />
                        </template>
                    </RebornCheckbox>
                </view>
            </view>
        </view>

        <!-- Basic Usage -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">基础用法</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <RebornCheckbox v-model="checked1" label="接受条款和条件" />
                <RebornCheckbox v-model="checked2" label="订阅通过" />
            </view>
        </view>

        <!-- States -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">状态 (States)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
                <RebornCheckbox :model-value="true" label="已选中" />
                <RebornCheckbox :model-value="false" label="未选中" />
                <RebornCheckbox :model-value="true" disabled label="禁用且选中" />
                <RebornCheckbox :model-value="false" disabled label="禁用且未选中" />
            </view>
        </view>

        <!-- Colors -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">颜色 (Colors)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                <RebornCheckbox v-for="color in colors" :key="color" v-model="checked1" :color="color" :label="color" />
            </view>
        </view>

        <!-- Sizes -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">尺寸 (Sizes)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <RebornCheckbox v-for="size in sizes" :key="size" v-model="checked1" :size="size"
                    :label="`Size ${size}`" />
            </view>
        </view>

        <!-- Group -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">复选组 (Group)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <view class="text-sm text-slate-600">已选: {{ groupValues }}</view>
                <view class="flex flex-col gap-2">
                    <RebornCheckbox v-model="groupValues" value="Option A" label="选项 A" />
                    <RebornCheckbox v-model="groupValues" value="Option B" label="选项 B" />
                    <RebornCheckbox v-model="groupValues" value="Option C" label="选项 C" />
                </view>
            </view>
        </view>
    </view>
</template>
