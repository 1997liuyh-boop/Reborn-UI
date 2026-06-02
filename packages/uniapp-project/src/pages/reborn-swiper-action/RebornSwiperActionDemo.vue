<script setup lang="ts">
import { nextTick, ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornSwiperAction, { type SwiperActionItem, type SwiperActionClickPayload } from '@/components/reborn-swiper-action/RebornSwiperAction.vue'

const rightActions: SwiperActionItem[] = [
  { text: '收藏', key: 'star', icon: 'i-lucide-star', color: 'warning', width: 124 },
  { text: '删除', key: 'delete', icon: 'i-lucide-trash-2', color: 'error', width: 124 },
]

const rightActionsWithRemove: SwiperActionItem[] = [
  { text: '收藏', key: 'star', icon: 'i-lucide-star', color: 'warning', width: 124 },
  { text: '删除', key: 'delete', icon: 'i-lucide-trash-2', color: 'error', width: 124, triggerRemove: true },
]

const compactActions: SwiperActionItem[] = [
  { text: '更多', key: 'more', icon: 'i-lucide-more-horizontal', color: 'info', width: 96 },
  { text: '收藏', key: 'star', icon: 'i-lucide-star', color: 'warning', width: 144 },
  { text: '删除', key: 'delete', icon: 'i-lucide-trash-2', color: 'error', width: 196 },
]

const messageList = ref(
  [
    { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
    { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
    { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
    { title: '交互评审', desc: '滑开其中一条，再滑另一条，上一条会自动关闭', iconClass: 'i-lucide-message-square text-primary' },
    { title: '版本计划', desc: '同一个 group 下只保留一个打开项', iconClass: 'i-lucide-calendar-days text-info' },
    { title: '关注提醒', desc: '列表、消息、联系人这类场景会更清爽', iconClass: 'i-lucide-bell text-warning' },
  ].map((item, i) => ({ ...item, id: i }))
)

const confirmList = ref(
  [
    { title: '重要邮件', desc: '点击删除将弹出确认框，swiper 保持展开等待操作', iconClass: 'i-lucide-mail text-primary' },
    { title: '项目文档', desc: '确认后 swiper 关闭，再触发折叠动画', iconClass: 'i-lucide-file-text text-info' },
    { title: '会议记录', desc: '取消则调用 close() 回弹，不产生任何副作用', iconClass: 'i-lucide-clipboard text-warning' },
    { title: '联系人', desc: 'close() 来自 @click payload，无需维护组件 ref', iconClass: 'i-lucide-user text-success' },
  ].map((item, i) => ({ ...item, id: i + 1000 }))
)

const controlledSwiperRef = ref<{ open: (side?: string) => void, close: () => void } | null>(null)
const controlledOpen = ref(false)

function onSwitchChange(val: boolean) {
  if (val) {
    controlledSwiperRef.value?.open('right')
  }
  else {
    controlledSwiperRef.value?.close()
  }
}

function onControlledSwiperOpen() {
  nextTick(() => { controlledOpen.value = true })
}

function onControlledSwiperClose() {
  nextTick(() => { controlledOpen.value = false })
}

const confirmDeleteActions: SwiperActionItem[] = [
  { text: '删除', key: 'delete', icon: 'i-lucide-trash-2', color: 'error' },
]

/** Demo 示例：滑块根节点与内容区不使用圆角 */
const demoSwiperUi = {
  root: 'rounded-none',
  content: 'rounded-none',
}

const currentMode = ref<'push' | 'overlay'>('push')
const touchHintEnabled = ref(true)
const currentActionRadius = ref<'none' | 'right' | 'both'>('right')

const actionRadiusOptions: { label: string, value: 'none' | 'right' | 'both', desc: string }[] = [
  { label: '无', value: 'none', desc: '不补圆角' },
  { label: '右侧', value: 'right', desc: '补右边两角' },
  { label: '两侧', value: 'both', desc: '补左右四角' },
]

function handleAction(payload: SwiperActionClickPayload) {
  uni.showToast({
    title: payload.item.text,
    icon: 'none',
  })
}

function handleConfirmAction(payload: SwiperActionClickPayload) {
  if (payload.item.key !== 'delete') return

  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，是否继续？',
    success: (res) => {
      if (res.confirm) {
        payload.remove()
      } else {
        payload.close()
      }
    },
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
  <RebornPage title="SwiperAction 滑动操作" description="左滑唤出收藏、删除等快捷操作">
    <RebornCard title="基础用法" :border="false" overflow-visible>
      <RebornSwiperAction :ui="demoSwiperUi" :right-actions="rightActions" @click="handleAction">
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

    <RebornCard title="自定义宽度" :border="false" overflow-visible>
      <RebornSwiperAction :ui="demoSwiperUi" :right-actions="compactActions" :threshold="0.25" @click="handleAction">
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

    <RebornCard title="滑动模式" :border="false" overflow-visible>
      <view class="flex flex-col gap-[16rpx]">
        <view class="flex flex-row items-center justify-between px-[32rpx] pb-[4rpx]">
          <view class="flex flex-col gap-[6rpx]">
            <text class="text-[26rpx] font-medium text-gray-9 dark:text-gray-1">
              {{ currentMode === 'push' ? 'Push · 推移' : 'Overlay · 叠加' }}
            </text>
            <text class="text-[22rpx] text-gray-5 dark:text-gray-4">
              {{ currentMode === 'push' ? '内容随操作区同步位移' : '操作区浮层叠加在内容之上' }}
            </text>
          </view>
          <RebornSwitch :model-value="currentMode === 'overlay'"
            @change="(val) => currentMode = val ? 'overlay' : 'push'" />
        </view>

        <view class="flex flex-col gap-[12rpx] px-[32rpx] pb-[4rpx]">
          <view class="flex flex-col gap-[6rpx]">
            <text class="text-[26rpx] font-medium text-gray-9 dark:text-gray-1">ActionRadius · 圆角模式</text>
            <text class="text-[22rpx] text-gray-5 dark:text-gray-4">控制操作区按钮的圆角补全方式</text>
          </view>
          <view class="flex flex-row gap-[12rpx]">
            <view v-for="opt in actionRadiusOptions" :key="opt.value"
              class="flex flex-1 flex-col items-center gap-[4rpx] rounded-[16rpx] py-[16rpx] transition-colors" :class="currentActionRadius === opt.value
                ? 'bg-primary/10'
                : 'bg-gray-1 dark:bg-gray-7'" @tap="currentActionRadius = opt.value">
              <text class="text-[26rpx] font-semibold"
                :class="currentActionRadius === opt.value ? 'text-primary' : 'text-gray-7 dark:text-gray-3'">{{
                opt.label }}</text>
              <text class="text-[20rpx]"
                :class="currentActionRadius === opt.value ? 'text-primary/70' : 'text-gray-4'">{{ opt.desc }}</text>
            </view>
          </view>
        </view>

        <view class="flex flex-row items-center justify-between px-[32rpx] pb-[4rpx]">
          <view class="flex flex-col gap-[6rpx]">
            <text class="text-[26rpx] font-medium text-gray-9 dark:text-gray-1">TouchHint · 操作提示</text>
            <text class="text-[22rpx] text-gray-5 dark:text-gray-4">
              {{ touchHintEnabled ? '触摸内容时露出右侧操作区边缘' : '关闭后仅在滑动时显示操作区' }}
            </text>
          </view>
          <RebornSwitch v-model="touchHintEnabled" />
        </view>

        <RebornSwiperAction :ui="demoSwiperUi" :mode="currentMode" :touch-hint="touchHintEnabled"
          :action-radius="currentActionRadius" :right-actions="rightActions" @click="handleAction">
          <view class="flex min-h-[128rpx] flex-row items-center gap-[24rpx] px-[32rpx]">
            <view class="flex size-[72rpx] shrink-0 items-center justify-center rounded-full bg-success/10">
              <view class="i-lucide-layers text-[34rpx] text-success" />
            </view>
            <view class="flex min-w-0 flex-1 flex-col gap-[8rpx]">
              <text class="truncate text-[30rpx] font-medium text-gray-9 dark:text-gray-1">双按钮示例</text>
              <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">收藏 + 删除，切换模式与提示观察差异</text>
            </view>
          </view>
        </RebornSwiperAction>

        <RebornSwiperAction :ui="demoSwiperUi" :mode="currentMode" :touch-hint="touchHintEnabled"
          :action-radius="currentActionRadius" :right-actions="compactActions" @click="handleAction">
          <view class="flex min-h-[128rpx] flex-row items-center gap-[24rpx] px-[32rpx]">
            <view class="flex size-[72rpx] shrink-0 items-center justify-center rounded-full bg-warning/10">
              <view class="i-lucide-layout-template text-[34rpx] text-warning" />
            </view>
            <view class="flex min-w-0 flex-1 flex-col gap-[8rpx]">
              <text class="truncate text-[30rpx] font-medium text-gray-9 dark:text-gray-1">三按钮示例</text>
              <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">更多 + 收藏 + 删除，切换模式与提示观察差异</text>
            </view>
          </view>
        </RebornSwiperAction>
      </view>
    </RebornCard>

    <RebornCard title="内容点击" :border="false" overflow-visible>
      <RebornSwiperAction :ui="demoSwiperUi" :right-actions="rightActions" content-tap-navigate @click="handleAction"
        @content-click="handleContentClick">
        <view class="flex min-h-[128rpx] flex-row items-center justify-between px-[32rpx]">
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
        <view class="flex flex-row items-center justify-between px-[32rpx]">
          <view class="flex flex-col gap-[6rpx]">
            <text class="text-[28rpx] font-medium text-gray-9 dark:text-gray-1">展开操作区</text>
            <text class="text-[24rpx] text-gray-5 dark:text-gray-4">{{ controlledOpen ? '已展开' : '已收起' }}</text>
          </view>
          <RebornSwitch :model-value="controlledOpen" @change="onSwitchChange" />
        </view>

        <RebornSwiperAction ref="controlledSwiperRef" :ui="demoSwiperUi" :right-actions="rightActions"
          @open="onControlledSwiperOpen" @close="onControlledSwiperClose" @click="handleAction">
          <view class="flex min-h-[128rpx] flex-row items-center gap-[24rpx] px-[32rpx]">
            <view class="flex size-[72rpx] shrink-0 items-center justify-center rounded-full bg-info/10">
              <view class="i-lucide-sliders-horizontal text-[34rpx] text-info" />
            </view>
            <view class="flex min-w-0 flex-1 flex-col gap-[8rpx]">
              <text class="truncate text-[30rpx] font-medium text-gray-9 dark:text-gray-1">受控滑块</text>
              <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">手势滑动也会同步更新开关状态</text>
            </view>
          </view>
        </RebornSwiperAction>
      </view>
    </RebornCard>

    <RebornCard title="列表互斥" :border="false" overflow-visible>
      <view class="flex flex-col gap-[16rpx]">
        <RebornSwiperAction v-for="(item, index) in messageList" :key="item.id" group="message-list"
          :right-actions="rightActionsWithRemove" :ui="{ ...demoSwiperUi, action: 'px-[16rpx]' }" @click="handleAction"
          @remove="messageList.splice(index, 1)">
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

    <RebornCard title="确认删除" :border="false" overflow-visible>
      <view class="flex flex-col gap-[16rpx]">
        <RebornSwiperAction v-for="(item, index) in confirmList" :key="item.id" group="confirm-list"
          :right-actions="confirmDeleteActions" :close-on-action-click="false"
          :ui="{ ...demoSwiperUi, action: 'px-[16rpx]' }" @click="handleConfirmAction"
          @remove="confirmList.splice(index, 1)">
          <view class="flex min-h-[120rpx] flex-row items-center gap-[24rpx] px-[32rpx]">
            <view class="flex size-[68rpx] shrink-0 items-center justify-center rounded-full bg-gray-1 dark:bg-gray-7">
              <view :class="[item.iconClass, 'text-[32rpx]']" />
            </view>
            <view class="flex min-w-0 flex-1 flex-col gap-[8rpx]">
              <text class="truncate text-[30rpx] font-medium text-gray-9 dark:text-gray-1">{{ item.title }}</text>
              <text class="truncate text-[24rpx] text-gray-5 dark:text-gray-4">{{ item.desc }}</text>
            </view>
          </view>
        </RebornSwiperAction>
      </view>
    </RebornCard>

    <RebornCard title="禁用状态" :border="false" overflow-visible>
      <RebornSwiperAction :ui="demoSwiperUi" :right-actions="rightActions" disabled>
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
