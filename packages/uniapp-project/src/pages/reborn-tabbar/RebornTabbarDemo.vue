<script lang="ts" setup>
import { ref } from 'vue'
import RebornTabbar from '@/components/reborn-tabbar/RebornTabbar.vue'
import RebornTabbarTrigger from '@/components/reborn-tabbar-trigger/RebornTabbarTrigger.vue'
import { tabbarAnimations, tabbarShapes, tabbarColors } from '@/components/reborn-tabbar/reborn-tabbar.config'

import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

const tabbar = ref('home')
const tabbar1 = ref(1)
const tabbar2 = ref(3)
const tabbar3 = ref(1)
const animation = ref<typeof tabbarAnimations[number] | null>(null)
const shape = ref<typeof tabbarShapes[number]>('normal')
const fixed = ref(false)
const demoColor = ref<typeof tabbarColors[number]>(tabbarColors[0])
const onlyIcon = ref(false)

const tabbarList = computed(() => {
    const obj = {
        home: '首页',
        site: '分类',
        shopping: '购物车',
        my: '我的',
    }
    return Object.entries(obj).map(([key, value]) => {
        return {
            name: key,
            title: onlyIcon.value ? '' : value,
            icon: `https://mall.leyifan.cn/static/h5/new_images/${key}_active.png`,
            inactive: `https://mall.leyifan.cn/static/h5/new_images/${key}.png`,
        }
    })

})

function handleChange(event: any) {
    console.log(event)
}


function handleChange1({ value }: { value: string }) {
    uni.showToast({ title: '选中标签: ' + value, icon: 'none' })
}

function beforeChangeHook({ name }: { name: string | number }, done: (shouldProceed?: boolean) => void) {
    uni.showLoading({ title: '校验中' })
    setTimeout(() => {
        uni.hideLoading()
        if (name === 2) {
            uni.showToast({ title: '请登录', icon: 'error' })
            done(false)
            return
        }
        done()
    }, 500)
}
</script>

<template>
    <RebornPage title="Tabbar 标签栏" description="页面底部标签栏，用于页面级路由跳转或内容区域切换。" custom-class="p-0">

        <RebornTabbar bordered :animation="animation" :shape="shape" v-model="tabbar" :fixed="fixed" :color="demoColor"
            @change="handleChange" :ball-shift-y="-10">
            <RebornTabbarTrigger v-for="item in tabbarList" :key="item.name" :name="item.name" :title="item.title"
                :image-size="52" :icon="item.icon" :inactive="item.inactive" />
        </RebornTabbar>

        <RebornCard title="参数配置" customClass="flex flex-col gap-4 mx-4">
            <view class="space-y-3">
                <RebornText color="neutral" customClass="text-26 font-bold">颜色</RebornText>
                <view class="flex flex-wrap gap-2">
                    <view v-for="c in tabbarColors" :key="c" class="
                  size-4 cursor-pointer rounded-full ring-2 ring-transparent
                  ring-offset-2 transition-all
                " :class="[
                    `
                    bg-${c}
                  `,
                    demoColor === c ? 'scale-110 ring-slate-400' : `
                    hover:scale-110
                  `,
                ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                        @click="demoColor = c" />
                </view>
            </view>
            <view class="flex flex-col gap-2">
                <RebornText color="neutral" customClass="text-26 font-bold">动画</RebornText>
                <RebornRadioGroup v-model="animation">
                    <RebornRadio v-for="item in tabbarAnimations" :key="item" :value="item">{{ item }}</RebornRadio>
                </RebornRadioGroup>
            </view>
            <view class="flex flex-col gap-2">
                <RebornText color="neutral" customClass="text-26 font-bold">类型</RebornText>
                <RebornRadioGroup v-model="shape">
                    <RebornRadio v-for="item in tabbarShapes" :key="item" :value="item">{{ item }}</RebornRadio>
                </RebornRadioGroup>
            </view>
            <view class="flex flex-col gap-2">
                <RebornText color="neutral" customClass="text-26 font-bold">纯图标标签栏</RebornText>
                <RebornSwitch v-model="onlyIcon" size="sm" />
            </view>
            <view class="flex flex-col gap-2">
                <RebornText color="neutral" customClass="text-26 font-bold">是否固定底部</RebornText>
                <RebornSwitch v-model="fixed" size="sm" />
            </view>
        </RebornCard>


        <!-- 自定义图标 -->
        <view class="text-26 font-bold mt-4 mb-2">自定义图标</view>
        <view class="relative w-full bg-gray-2 rounded-md">
            <RebornTabbar v-model="tabbar1" @change="handleChange" animation="flip" active-color="#409EFF"
                inactive-color="#909399">
                <RebornTabbarTrigger title="首页" icon="i-lucide-home" />
                <RebornTabbarTrigger title="分类" icon="https://letaoyifan.com/images/svg/quickPurchase.svg"
                    inactive="https://letaoyifan.com/images/svg/wx.svg" />
                <RebornTabbarTrigger title="我的" icon="i-lucide-user" />
            </RebornTabbar>
        </view>

        <!-- 自定义颜色 -->
        <view class="text-26 font-bold mt-4 mb-2">自定义颜色</view>
        <view class="relative w-full bg-gray-2 rounded-md ">
            <RebornTabbar v-model="tabbar2" @change="handleChange">
                <RebornTabbarTrigger title="首页" icon="i-lucide-home" color="success" />
                <RebornTabbarTrigger title="分类" icon="i-lucide-shopping-cart" color="warning" />
                <RebornTabbarTrigger title="我的" icon="i-lucide-user" color="error" />
                <RebornTabbarTrigger title="最大值" icon="i-lucide-image" color="info" />
                <RebornTabbarTrigger title="客服" icon="i-lucide-message-circle" color="primary" />
            </RebornTabbar>
        </view>

        <!-- 监听切换事件 -->
        <view class="text-26 font-bold mt-4 mb-2">监听切换事件</view>
        <view class="relative w-full bg-gray-2 rounded-md ">
            <RebornTabbar v-model="tabbar3" :before-change="beforeChangeHook" @change="handleChange1"
                active-color="#ee0a24" inactive-color="#7d7e80">
                <RebornTabbarTrigger title="首页" icon="i-lucide-home" />
                <RebornTabbarTrigger title="分类" icon="i-lucide-shopping-cart" />
                <RebornTabbarTrigger title="我的" icon="i-lucide-user" />
                <RebornTabbarTrigger title="相册" icon="i-lucide-image" />
                <RebornTabbarTrigger title="客服" icon="i-lucide-message-circle" />
            </RebornTabbar>
        </view>

    </RebornPage>
</template>