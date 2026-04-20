<script setup lang="ts">
import { ref } from 'vue';
import RebornPage from '@/components/reborn-page/RebornPage.vue';
import RebornCard from '@/components/reborn-card/RebornCard.vue';
import RebornNoticeBar from '@/components/reborn-notice-bar/RebornNoticeBar.vue';
import RebornButton from '@/components/reborn-button/RebornButton.vue';

const showNotice = ref(true);
const noticeBarRef = ref<any>(null);

function handleReplay() {
    noticeBarRef.value?.replay();
    uni.showToast({ title: '重播动画', icon: 'none' });
}

function handleClose() {
    showNotice.value = false;
    uni.showToast({ title: '已关闭通知', icon: 'none' });
}

function handleClick() {
    uni.showToast({ title: '点击了通知栏', icon: 'none' });
}

function handleChange(index: number) {
    console.log('当前索引:', index);
}
</script>

<template>
    <RebornPage title="NoticeBar 通知栏" description="用于循环播放展示一组消息通知。">

        <RebornCard title="基础用法">
            <view class="flex flex-col gap-[24rpx]">
                <RebornNoticeBar text="这是一条普通通知，用于展示最重要的系统消息。" :scrollable="true" left-icon="i-lucide-info" />

                <RebornNoticeBar text="这是一条警告通知，自定义了背景颜色和文本颜色。" background="#fffbe8" color="#ed6a0c"
                    left-icon="i-lucide-alert-triangle" />

                <RebornNoticeBar text="这是一条警告通知，自定义了背景颜色和文本颜色。" wrapable :scrollable="false" background="#fffbe8"
                    color="#ed6a0c" left-icon="i-lucide-alert-triangle" />

                <RebornNoticeBar text="这是一条警告通知，自定义了背景颜色和文本颜色。" :scrollable="false" background="#fffbe8" color="#ed6a0c"
                    left-icon="i-lucide-alert-triangle" />
            </view>
        </RebornCard>

        <RebornCard title="多消息轮播 (水平)">
            <RebornNoticeBar :text="['🔥 限时秒杀开始啦！', '📢 系统升级维护公告', '🎯 新功能上线体验']" left-icon="i-lucide-megaphone"
                @click="handleClick" />
        </RebornCard>

        <RebornCard title="多消息轮播 (垂直)">
            <RebornNoticeBar :text="['第一条：星辰灿烂，愿你的代码如诗般优雅。', '第二条：愿你的 Bug 永远追不上你的脚步。', '第三条：每一行代码都是一颗星星。']"
                direction="vertical" :interval="3000" left-icon="i-lucide-volume-2" @change="handleChange" />
        </RebornCard>

        <RebornCard title="插槽自定义">
            <view class="flex flex-col gap-[24rpx]">
                <!-- 左侧插槽 -->
                <RebornNoticeBar text="自定义左侧插槽组件内容">
                    <template #left-icon>
                        <view class="rounded-full bg-primary/20 p-[4rpx] mr-[8rpx]">🔥</view>
                    </template>
                </RebornNoticeBar>

                <!-- 垂直模式作用域插槽 -->
                <RebornNoticeBar :text="['账户安全提示', '系统维护公告', '会员福利发放']" direction="vertical" background="#f0f9ff"
                    color="#0369a1" left-icon="i-lucide-shield-check">
                    <template #default="{ item, index }">
                        <view class="flex items-center gap-[8rpx]">
                            <view class="bg-primary px-[12rpx] py-[2rpx] rounded text-white text-[20rpx]">
                                {{ index === 0 ? '安全' : '提示' }}
                            </view>
                            <text>{{ item }}</text>
                        </view>
                    </template>
                </RebornNoticeBar>
            </view>
        </RebornCard>

        <RebornCard title="事件与方法">
            <view class="flex flex-col gap-[24rpx]">
                <RebornNoticeBar ref="noticeBarRef" text="点击右侧图标重播动画" right-icon="i-lucide-refresh-cw"
                    @replay="() => { }" @click="handleReplay" />

                <view v-if="showNotice">
                    <RebornNoticeBar text="点击右侧图标关闭此通知" right-icon="i-lucide-x" @close="handleClose"
                        @click="handleClose" />
                </view>

                <RebornButton v-if="!showNotice" size="sm" @click="showNotice = true">
                    显示通知
                </RebornButton>
            </view>
        </RebornCard>

        <RebornCard title="禁用状态">
            <RebornNoticeBar text="这条通知栏禁用了滚动。" disabled />
        </RebornCard>

    </RebornPage>
</template>

<style scoped></style>
