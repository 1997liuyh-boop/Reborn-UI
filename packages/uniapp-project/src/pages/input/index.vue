<script setup lang="ts">
import { ref } from 'vue'
import RebornInput, { type InputType } from '@/components/reborn-input/RebornInput.vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'

const input1 = ref('')
const input2 = ref('')
const input3 = ref('')
const input4 = ref('')
const input5 = ref('')
const input6 = ref('')
const input7 = ref('')
const input8 = ref('')

const inputTypes: InputType[] = [
    'tel', 'url', 'text', 'email', 'digit', 'number',
    'idcard', 'search', 'decimal', 'numeric', 'nickname', 'safe-password'
]
const currentType = ref<InputType>('text')
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">输入框</view>
            <view class="text-slate-500">用于接收用户输入的数据。</view>
        </view>

        <!-- Basic -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">基础用法</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <RebornInput v-model="input1" placeholder="请输入内容..." />
                <RebornInput v-model="input1" placeholder="圆角输入框" rounded />
                <RebornInput v-model="input1" placeholder="直角输入框" :rounded="false" />
            </view>
        </view>

        <!-- Dynamic Configuration (Type) -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">输入类型配置</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <view class="space-y-2">
                    <text class="text-sm text-gray-500">选择类型 (Type)</text>
                    <view class="flex flex-wrap gap-2">
                        <view v-for="t in inputTypes" :key="t">
                            <ReButton :color="currentType === t ? 'primary' : 'info'" @tap="currentType = t" size="xs">
                                {{ t }}
                            </ReButton>
                        </view>
                    </view>
                </view>
                <RebornInput v-model="input8" :type="currentType" :placeholder="`当前类型: ${currentType}`" />
            </view>
        </view>

        <!-- Disabled -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">禁用状态</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <RebornInput v-model="input2" placeholder="禁用状态" disabled />
                <RebornInput v-model="input2" placeholder="只读状态" readonly />
            </view>
        </view>

        <!-- Features -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">功能</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <RebornInput v-model="input3" placeholder="密码输入" password />
                <RebornInput v-model="input4" placeholder="可清除" clearable />
            </view>
        </view>

        <!-- Slots & Icons -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">插槽与图标</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <RebornInput v-model="input5" placeholder="自定义前置图标">
                    <template #leading>
                        <view class="i-lucide-search text-gray-400 size-4" />
                    </template>
                </RebornInput>

                <RebornInput v-model="input5" placeholder="自定义后置图标">
                    <template #trailing>
                        <view class="i-lucide-calendar text-gray-400 size-4" />
                    </template>
                </RebornInput>

                <RebornInput v-model="input7" placeholder="自定义后置文本">
                    <template #trailing>
                        <text class="text-gray-500 text-sm font-medium">RMB</text>
                    </template>
                </RebornInput>
            </view>
        </view>

        <!-- Textarea -->
        <!-- <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">文本域</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <RebornInput v-model="input6" as="textarea" :rows="4" placeholder="请输入多行文本..." />
                <textarea placeholder-style="color:#F76260" placeholder="占位符字体是红色的" />
            </view>
        </view> -->
    </view>
</template>
