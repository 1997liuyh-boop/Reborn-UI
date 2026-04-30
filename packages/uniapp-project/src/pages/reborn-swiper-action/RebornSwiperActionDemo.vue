<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornSwiperAction, { type SwiperActionItem } from '@/components/reborn-swiper-action/RebornSwiperAction.vue'

const opened = ref('')
const controlledOpened = ref('')

const leftActions: SwiperActionItem[] = [
  { text: '关注', key: 'follow', icon: 'i-lucide-user-plus', color: 'success' },
]

const rightActions: SwiperActionItem[] = [
  { text: '收藏', key: 'star', icon: 'i-lucide-star', color: 'warning', width: 124 },
  { text: '删除', key: 'delete', icon: 'i-lucide-trash-2', color: 'error', width: 124 },
]

const compactActions: SwiperActionItem[] = [
  { text: '更多', key: 'more', icon: 'i-lucide-more-horizontal', color: 'info', width: 96 },
  { text: '收藏', key: 'star', icon: 'i-lucide-star', color: 'warning', width: 144 },
  { text: '删除', key: 'delete', icon: 'i-lucide-trash-2', color: 'error', width: 196 },
]

const messageList = [
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
  { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
  { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
]

function handleAction(payload: { item: SwiperActionItem, index: number, side: string }) {
  uni.showToast({
    title: `${payload.side === 'left' ? '左侧' : '右侧'}-${payload.item.text}`,
    icon: 'none',
  })
}

function handleContentClick() {
  uni.showToast({
    title: '触发内容点击，可在这里跳转',
    icon: 'none',
  })
}
</script>

<template>
  <RebornPage title="SwiperAction 滑动操作" description="支持左滑和右滑唤出删除、收藏、关注等快捷操作">
    <RebornCard title="基础用法" :border="false" overflow-visible>
      <RebornSwiperAction :right-actions="rightActions" @click="handleAction">
        <view class="flex min-h-[128rpx] flex-row items-center gap-[24rpx] px-[32rpx]">
          <view class="flex size-[72rpx] items-center justify-center rounded-full bg-primary/10">
            <view class="i-lucide-mail text-[34rpx] text-primary" />
          </view>
          <view class="flex flex-1 flex-col gap-[8rpx]">
            <text class="text-[30rpx] font-medium text-gray-9 dark:text-gray-1">系统通知</text>
            <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">左滑可以收藏或删除这条消息</text>
          </view>
          <view class="i-lucide-chevron-left text-[32rpx] text-gray-4" />
        </view>
      </RebornSwiperAction>
    </RebornCard>

    <RebornCard title="左右双向" :border="false" overflow-visible>
      <RebornSwiperAction v-model="opened" :left-actions="leftActions" :right-actions="rightActions"
        :ui="{ action: 'px-[16rpx]' }" @click="handleAction">
        <view class="flex min-h-[148rpx] flex-row items-center gap-[24rpx] px-[32rpx] py-[20rpx]">
          <view class="flex size-[72rpx] shrink-0 items-center justify-center rounded-full bg-success/10">
            <view class="i-lucide-user text-[34rpx] text-success" />
          </view>
          <view class="flex min-w-0 flex-1 flex-col gap-[10rpx]">
            <view class="flex min-w-0 flex-row items-center gap-[16rpx]">
              <text class="min-w-0 flex-1 truncate text-[30rpx] font-medium text-gray-9 dark:text-gray-1">
                设计师 Hana
              </text>
              <view class="shrink-0 rounded-full bg-gray-1 px-[16rpx] py-[6rpx] dark:bg-gray-7">
                <text class="text-[22rpx] text-gray-5 dark:text-gray-3">{{ opened || '未打开' }}</text>
              </view>
            </view>
            <text class="truncate text-[24rpx] leading-[34rpx] text-gray-5 dark:text-gray-4">
              右滑关注，左滑显示收藏、删除、更多、关注，内容较多时仍保持标题优先可读
            </text>
          </view>
        </view>
      </RebornSwiperAction>
    </RebornCard>

    <RebornCard title="自定义宽度" :border="false" overflow-visible>
      <RebornSwiperAction :right-actions="compactActions" :threshold="0.25" @click="handleAction">
        <view class="flex min-h-[132rpx] flex-row items-center justify-between gap-[24rpx] px-[32rpx]">
          <view class="flex min-w-0 flex-1 flex-col gap-[10rpx]">
            <text class="text-[30rpx] font-medium text-gray-9 dark:text-gray-1">紧凑操作区</text>
            <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">更多 96rpx / 收藏 144rpx / 删除 196rpx</text>
            <view class="flex flex-row overflow-hidden rounded-full bg-gray-1 dark:bg-gray-7">
              <view class="h-[10rpx] w-[96rpx] bg-info" />
              <view class="h-[10rpx] w-[144rpx] bg-warning" />
              <view class="h-[10rpx] w-[196rpx] bg-error" />
            </view>
          </view>
          <view class="i-lucide-sliders-horizontal shrink-0 text-[32rpx] text-gray-4" />
        </view>
      </RebornSwiperAction>
    </RebornCard>

    <RebornCard title="内容点击" :border="false" overflow-visible>
      <RebornSwiperAction :right-actions="rightActions" content-tap-navigate @content-click="handleContentClick">
        <view class="flex min-h-[112rpx] flex-row items-center justify-between px-[32rpx]">
          <view class="flex flex-col gap-[8rpx]">
            <text class="text-[30rpx] font-medium text-gray-9 dark:text-gray-1">点击内容触发跳转</text>
            <text class="text-[24rpx] text-gray-5 dark:text-gray-4">开启 contentTapNavigate 后不再自动收起</text>
          </view>
          <view class="i-lucide-arrow-right text-[32rpx] text-gray-4" />
        </view>
      </RebornSwiperAction>
    </RebornCard>

    <RebornCard title="外部控制" :border="false" overflow-visible>
      <view class="flex flex-col gap-[20rpx]">
        <view class="flex flex-row flex-wrap gap-[16rpx]">
          <RebornButton size="sm" variant="outline" @click="controlledOpened = 'left'">
            打开左边
          </RebornButton>
          <RebornButton size="sm" variant="outline" color="neutral" @click="controlledOpened = ''">
            关闭所有
          </RebornButton>
          <RebornButton size="sm" variant="outline" @click="controlledOpened = 'right'">
            打开右边
          </RebornButton>
        </view>

        <RebornSwiperAction v-model="controlledOpened" :left-actions="leftActions" :right-actions="rightActions"
          :ui="{ action: 'px-[16rpx]' }" @click="handleAction">
          <view class="flex min-h-[128rpx] flex-row items-center gap-[24rpx] px-[32rpx]">
            <view class="flex size-[72rpx] shrink-0 items-center justify-center rounded-full bg-info/10">
              <view class="i-lucide-sliders-horizontal text-[34rpx] text-info" />
            </view>
            <view class="flex min-w-0 flex-1 flex-col gap-[8rpx]">
              <text class="truncate text-[30rpx] font-medium text-gray-9 dark:text-gray-1">受控滑块</text>
              <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">
                当前状态：{{ controlledOpened || '关闭' }}
              </text>
            </view>
          </view>
        </RebornSwiperAction>
      </view>
    </RebornCard>

    <RebornCard title="列表互斥" :border="false" overflow-visible>
      <view class="flex flex-col gap-[16rpx]">
        <RebornSwiperAction v-for="(item, index) in messageList" :key="`${item.title}-${index}`" group="message-list"
          :right-actions="rightActions" :ui="{ action: 'px-[16rpx]' }" @click="handleAction">
          <view class="flex min-h-[120rpx] flex-row items-center gap-[24rpx] px-[32rpx]">
            <view class="flex size-[68rpx] shrink-0 items-center justify-center rounded-full bg-gray-1 dark:bg-gray-7">
              <view :class="[item.iconClass, 'text-[32rpx]']" />
            </view>
            <view class="flex min-w-0 flex-1 flex-col gap-[8rpx]">
              <view class="flex flex-row items-center gap-[12rpx]">
                <text class="truncate text-[30rpx] font-medium text-gray-9 dark:text-gray-1">{{ item.title }}</text>
                <text class="shrink-0 text-[22rpx] text-gray-4">#{{ index + 1 }}</text>
              </view>
              <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">{{ item.desc }}</text>
            </view>
          </view>
        </RebornSwiperAction>
      </view>
    </RebornCard>


    <RebornCard title="禁用状态" :border="false" overflow-visible>
      <RebornSwiperAction :right-actions="rightActions" disabled>
        <view class="flex min-h-[112rpx] flex-row items-center justify-between px-[32rpx]">
          <view class="flex flex-col gap-[8rpx]">
            <text class="text-[30rpx] font-medium text-gray-9 dark:text-gray-1">不可滑动</text>
            <text class="text-[24rpx] text-gray-5 dark:text-gray-4">disabled 后不响应手势和操作点击</text>
          </view>
          <view class="i-lucide-lock text-[32rpx] text-gray-4" />
        </view>
      </RebornSwiperAction>
    </RebornCard>
  </RebornPage>
</template>
