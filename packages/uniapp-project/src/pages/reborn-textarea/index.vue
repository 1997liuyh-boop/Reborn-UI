<script setup lang="ts">
import { ref } from 'vue'
import { textareaColors, textareaSizes } from '@/components/reborn-textarea/reborn-textarea.config'
import RebornTextarea from '@/components/reborn-textarea/RebornTextarea.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

// Textarea values
const value = ref('');
const value1 = ref('轻轻的我走了，正如我轻轻的来；我轻轻的招手，作别西天的云彩。那河畔的金柳，是夕阳中的新娘；波光里的艳影，在我的心头荡漾。软泥上的青荇，油油的在水底招摇；在康河的柔波里，我甘心做一条水草！那榆荫下的一潭，不是清泉，是天上虹；揉碎在浮藻间，沉淀着彩虹似的梦。寻梦？撑一支长篙，向青草更青处漫溯；满载一船星辉，在星辉斑斓里放歌。但我不能放歌，悄悄是别离的笙箫；夏虫也为我沉默，沉默是今晚的康桥！悄悄的我走了，正如我悄悄的来；我挥一挥衣袖，不带走一片云彩。');
const demoColor = ref<typeof textareaColors[number]>('primary');
const demoSize = ref<typeof textareaSizes[number]>('md');
const isBorder = ref(true);
const isShowCount = ref(true);
const isDisabled = ref(false);
const isAutoHeight = ref(false);
const isShowlimitSlot = ref(false);

// Global Size Control
// const sizes = ['sm', 'md', 'lg'] as const
// const currentSize = ref<typeof sizes[number]>('md')
</script>

<template>
    <RebornPage title="文本域" description="多行文本输入控件。">
        <!-- Basic -->
        <RebornCard title="自定义" custom-class="flex flex-col gap-2">
            <RebornTextarea v-model="value" :border="isBorder" :disabled="isDisabled" :show-word-limit="isShowCount"
                :auto-height="isAutoHeight" placeholder="请输入内容..." :color="demoColor">
                <template v-if="isShowlimitSlot" #limit="{ length, max }">
                    <view
                        class="absolute right-2 bottom-2 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-500">
                        已输入: {{ length }}/{{ max }}
                    </view>
                </template>
            </RebornTextarea>
        </RebornCard>
        <!-- Custom Styles -->
        <RebornCard title="自定义样式 (UI Prop)" custom-class="flex flex-col gap-2">
            <RebornTextarea v-model="value1" :size="demoSize" :maxlength="1000" placeholder="自定义样式" :height="500" :ui="{
                root: 'bg-blue-50 dark:bg-blue-950/30 ring-red-3 dark:border-blue-800 focus-within:ring-orange-7',
                inner: 'text-blue-700 dark:text-blue-300 placeholder:text-blue-400 ',
                text: 'text-blue-400'
            }" />
        </RebornCard>
        <!-- Size Control -->
        <RebornCard title="控制" custom-class="flex flex-col gap-4">
            <view class="space-y-3">
                <view class="text-28 font-medium text-slate-500 dark:text-slate-200">边框active颜色</view>
                <view class="flex flex-wrap gap-2">
                    <view v-for="c in textareaColors" :key="c"
                        class="w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
                        :class="[
                            `bg-${c}`,
                            demoColor === c ? 'ring-slate-400 scale-110' : 'hover:scale-110'
                        ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                        @click="demoColor = c"></view>
                </view>
            </view>
            <view class="space-y-3">
                <view class="text-sm font-medium text-slate-500 dark:text-slate-200">输入字体颜色</view>
                <view class="flex flex-wrap gap-2">
                    <view v-for="s in textareaSizes" :key="s"
                        class="px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors"
                        :class="demoSize === s ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-600 border-slate-300 hover:border-slate-400'"
                        @click="demoSize = s">
                        {{ s }}
                    </view>
                </view>
            </view>
            <RebornSwitch v-model="isBorder" label="边框" />
            <RebornSwitch v-model="isShowCount" label="字数统计" />
            <RebornSwitch v-model="isShowlimitSlot" label="自定义字数统计" />
            <RebornSwitch v-model="isDisabled" label="禁用" />
            <RebornSwitch v-model="isAutoHeight" label="自动增高" />
        </RebornCard>


        <!-- States -->
        <!-- <RebornCard title="状态" custom-class="flex flex-col gap-2">
            <RebornTextarea v-model="value2" :size="currentSize" placeholder="禁用状态" disabled />
            <RebornTextarea :size="currentSize" placeholder="只读状态" readonly model-value="只读内容，不可编辑" />
        </RebornCard> -->

        <!-- Features -->
        <!-- <RebornCard title="功能" custom-class="flex flex-col gap-2">
            <RebornTextarea v-model="value3" :size="currentSize" placeholder="自动增高 (auto-height)" auto-height />
            <RebornTextarea v-model="value4" :size="currentSize" placeholder="自定义字数限制 (maxlength=200)"
                :maxlength="200" />
        </RebornCard> -->


        <!-- Slots -->
        <!-- <RebornCard title="插槽" custom-class="flex flex-col gap-2">
            <RebornTextarea v-model="value6" :size="currentSize" placeholder="自定义 limit 插槽" :maxlength="100">
                <template #limit="{ length, max }">
                    <view
                        class="absolute right-2 bottom-2 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-500">
                        已输入: {{ length }}/{{ max }}
                    </view>
                </template>
</RebornTextarea>
</RebornCard> -->
    </RebornPage>
</template>