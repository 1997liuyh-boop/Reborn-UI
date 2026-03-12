<script setup lang="ts">
import { ref } from "vue";
import RebornTextarea from "~/components/reborn/ui/reborn-textarea/RebornTextarea.vue";
import { textareaColors, textareaSizes } from "~/components/reborn/ui/reborn-textarea/reborn-textarea.config";

const value = ref('');
const value1 = ref('轻轻的我走了，正如我轻轻的来；我轻轻的招手，作别西天的云彩。那河畔的金柳，是夕阳中的新娘；波光里的艳影，在我的心头荡漾。软泥上的青荇，油油的在水底招摇；在康河的柔波里，我甘心做一条水草！那榆荫下的一潭，不是清泉，是天上虹；揉碎在浮藻间，沉淀着彩虹似的梦。寻梦？撑一支长篙，向青草更青处漫溯；满载一船星辉，在星辉斑斓里放歌。但我不能放歌，悄悄是别离的笙箫；夏虫也为我沉默，沉默是今晚的康桥！悄悄的我走了，正如我悄悄的来；我挥一挥衣袖，不带走一片云彩。');
const demoColor = ref<typeof textareaColors[number]>('primary');
const demoSize = ref<typeof textareaSizes[number]>('md');
const isBorder = ref(true);
const isShowCount = ref(true);
const isDisabled = ref(false);
const isAutoHeight = ref(false);
const isShowlimitSlot = ref(false);
</script>

<template>
    <div class="grid grid-cols-2 gap-4">
        <div>
            <RebornTextarea v-model="value" :border="isBorder" :disabled="isDisabled" :show-word-limit="isShowCount"
                :auto-height="isAutoHeight" placeholder="请输入内容..." :color="demoColor">
                <template v-if="isShowlimitSlot" #limit="{ length, max }">
                    <div
                        class="absolute right-3 bottom-3 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-500">
                        已输入: {{ length }}/{{ max }}
                    </div>
                </template>
            </RebornTextarea>
        </div>
        <div>
            <RebornTextarea v-model="value1" :size="demoSize" show-word-limit :maxlength="1000" placeholder="自定义样式"
                :rows="10" :ui="{
                    root: 'bg-blue-50 dark:bg-blue-950/30 ring-red-3 dark:border-blue-800 focus-within:ring-orange-7',
                    inner: 'text-blue-700 dark:text-blue-300 placeholder:text-blue-400 ',
                    text: 'text-blue-400'
                }" />
        </div>
        <div class="col-span-2 flex flex-col gap-4">
            <div class="space-y-3">
                <div class="text-28 font-medium text-slate-500 dark:text-slate-200">边框active颜色</div>
                <div class="flex flex-wrap gap-2">
                    <div v-for="c in textareaColors" :key="c"
                        class="w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
                        :class="[
                            `bg-${c}`,
                            demoColor === c ? 'ring-slate-400 scale-110' : 'hover:scale-110'
                        ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                        @click="demoColor = c"></div>
                </div>
            </div>
            <div class="space-y-3">
                <div class="text-sm font-medium text-slate-500 dark:text-slate-200">输入字体颜色</div>
                <div class="flex flex-wrap gap-2">
                    <div v-for="s in textareaSizes" :key="s"
                        class="px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors"
                        :class="demoSize === s ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-600 border-slate-300 hover:border-slate-400'"
                        @click="demoSize = s">
                        {{ s }}
                    </div>
                </div>
            </div>
            <RebornSwitch v-model="isBorder" active-label="边框" />
            <RebornSwitch v-model="isShowCount" active-label="字数统计" />
            <RebornSwitch v-model="isShowlimitSlot" active-label="自定义字数统计" />
            <RebornSwitch v-model="isDisabled" active-label="禁用" />
            <RebornSwitch v-model="isAutoHeight" active-label="自动增高" />
        </div>
    </div>
</template>
