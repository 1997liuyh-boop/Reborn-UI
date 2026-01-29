<script setup lang="ts">
import { ref } from 'vue'
import RebornCollapse from '~/components/reborn/ui/reborn-collapse/RebornCollapse.vue'

const visible = ref(false)
</script>

<template>
    <div class="flex flex-col gap-2 items-center">
        <RebornCollapse v-model="visible" customClass="w-full">
            <template #default="{ open }">
                <div
                    class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                    <span class="font-medium">Click to Toggle</span>
                    <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform duration-200"
                        :class="{ 'rotate-180': open }" />
                </div>
            </template>
            <template #content>
                <div class="p-4 text-slate-600 dark:text-slate-400 bg-white mt-1 rounded-2xl space-y-2 indent-4">
                    <div>
                        张若虚（约公元660—约公元720），唐代诗人，扬州（今属江苏）人。曾任兖州兵曹。生卒年、字号均不详。事迹略见于《旧唐书·贺知章传》。
                    </div>
                    <div>
                        唐中宗神龙年间（公元705～公元707），张若虚与贺知章、贺朝、万齐融、邢巨、包融俱以文词俊秀驰名于京都，张若虚与贺知章、张旭、包融并称“吴中四士”。唐玄宗开元时张若虚还尚在世。
                    </div>
                    <div>
                        张若虚的诗仅存二首于《全唐诗》中。其中《春江花月夜》是一篇脍炙人口的名作，它沿用陈隋乐府旧题，抒写真挚动人的离情别绪及富有哲理意味的人生感慨，表现了一种迥绝的宇宙意识，创造了一个深沉、寥廓、宁静的境界。
                    </div>
                    <div>
                        全诗共三十六句，每四句一换韵，通篇融诗情、画意、哲理为一体，意境空明，想象奇特，语言自然隽永，韵律宛转悠扬，洗去了宫体的浓脂艳粉，给人以澄澈空明、清丽自然的感觉。具有极高的审美价值，素有“孤篇盖全唐”之誉。
                    </div>
                    <img src="https://q7.itc.cn/q_70/images01/20240301/bf4c154b04334b3b955139dd1f06ba53.jpeg" alt="" />
                </div>
            </template>
        </RebornCollapse>

        <RebornCollapse v-model="visible" customClass="flex flex-col gap-2 w-3/4">
            <template #default="{ open }">
                <div
                    class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                    <span class="font-medium">Click to Toggle</span>
                    <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform duration-200"
                        :class="{ 'rotate-180': open }" />
                </div>
            </template>
            <template #content>
                <div class="p-4 text-slate-600 dark:text-slate-400 bg-white mt-1 rounded-2xl space-y-2 indent-4">
                    <div>
                        张若虚（约公元660—约公元720），唐代诗人，扬州（今属江苏）人。曾任兖州兵曹。生卒年、字号均不详。事迹略见于《旧唐书·贺知章传》。
                    </div>
                    <div>
                        唐中宗神龙年间（公元705～公元707），张若虚与贺知章、贺朝、万齐融、邢巨、包融俱以文词俊秀驰名于京都，张若虚与贺知章、张旭、包融并称“吴中四士”。唐玄宗开元时张若虚还尚在世。
                    </div>
                    <div>
                        张若虚的诗仅存二首于《全唐诗》中。其中《春江花月夜》是一篇脍炙人口的名作，它沿用陈隋乐府旧题，抒写真挚动人的离情别绪及富有哲理意味的人生感慨，表现了一种迥绝的宇宙意识，创造了一个深沉、寥廓、宁静的境界。
                    </div>
                    <div>
                        全诗共三十六句，每四句一换韵，通篇融诗情、画意、哲理为一体，意境空明，想象奇特，语言自然隽永，韵律宛转悠扬，洗去了宫体的浓脂艳粉，给人以澄澈空明、清丽自然的感觉。具有极高的审美价值，素有“孤篇盖全唐”之誉。
                    </div>
                    <img src="https://q7.itc.cn/q_70/images01/20240301/bf4c154b04334b3b955139dd1f06ba53.jpeg" alt="" />
                </div>
            </template>
        </RebornCollapse>
    </div>
</template>
