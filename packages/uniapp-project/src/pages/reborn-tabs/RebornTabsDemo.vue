<script setup lang="ts">
import type { TabKey, TabsPosition, TabsSize, TabsType } from '@/components/reborn-tabs/reborn-tabs.config'
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { tabsPositions, tabsSizes, tabsTypes } from '@/components/reborn-tabs/reborn-tabs.config'
import RebornTabPane from '@/components/reborn-tabs/RebornTabPane.vue'
import RebornTabs from '@/components/reborn-tabs/RebornTabs.vue'

// ─── 演练场状态 ─────────────────────────────────────────────────

/** 演练场选中的标签 key */
const playKey = ref<TabKey>('overview')
const currentType = ref<TabsType>('line')
const currentSize = ref<TabsSize>('medium')
const currentPosition = ref<TabsPosition>('top')

/** change 触发次数，让切换「有回应」 */
const changeCount = ref(0)
function onPlayChange() {
  changeCount.value++
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 类型演示 */
const typeKey = ref<TabKey>('all')
/** 尺寸演示 */
const sizeKey = ref<TabKey>('all')
/** 位置演示 */
const positionKey = ref<TabKey>('all')
/** 禁用演示 */
const disabledKey = ref<TabKey>('normal')
/** 触发方式演示 */
const hoverKey = ref<TabKey>('day')
/** 动画演示 */
const animationKey = ref<TabKey>('one')
/** 渲染策略演示 */
const lazyKey = ref<TabKey>('first')
const destroyKey = ref<TabKey>('first')
/** 额外内容演示 */
const extraKey = ref<TabKey>('inbox')
/** 撑满高度演示 */
const justifyKey = ref<TabKey>('list')

/** 滚动定位演示：标签数量超出一屏时才能看出差别 */
const scrollKey = ref<TabKey>('12')
const scrollModes = ['auto', 'start', 'center', 'end'] as const
const currentScrollMode = ref<typeof scrollModes[number]>('auto')
const scrollPanes = Array.from({ length: 20 }, (_, index) => ({
  key: `${index + 1}`,
  title: `标签 ${index + 1}`,
}))

// ─── 可编辑模式 ─────────────────────────────────────────────────

/** 可编辑模式的标签数据，增删都发生在这个数组上 */
const editablePanes = ref([
  { key: 'order', title: '订单' },
  { key: 'refund', title: '退款' },
  { key: 'invoice', title: '发票' },
])
const editableKey = ref<TabKey>('order')

/** 新标签的编号来源，避免复用已删除的 key */
let seed = 0

/** 组件只抛事件不动数据，新增标签由页面自己决定插在哪 */
function handleAdd() {
  seed++
  const key = `custom-${seed}`
  editablePanes.value.push({ key, title: `新标签 ${seed}` })
}

/** 删除后若移除的正是当前项，则回退到相邻标签 */
function handleDelete(key: TabKey) {
  const index = editablePanes.value.findIndex(item => item.key === key)
  if (index === -1) return
  editablePanes.value.splice(index, 1)
  if (editableKey.value !== key) return
  const fallback = editablePanes.value[index] ?? editablePanes.value[index - 1]
  editableKey.value = fallback ? fallback.key : ''
}
</script>

<template>
  <RebornPage title="标签页" description="在同一块区域内切换多组平级内容。" custom-class="flex flex-col gap-y-4">
    <!-- 演练场 -->
    <RebornCard title="自定义" custom-class="space-y-4">
      <view :class="currentPosition === 'left' || currentPosition === 'right' ? 'h-[320rpx]' : ''">
        <RebornTabs
          v-model:active-key="playKey" :type="currentType" :size="currentSize"
          :position="currentPosition" @change="onPlayChange"
        >
          <RebornTabPane key="overview" title="概览">
            <text class="text-26 text-gray-7">当前选中 overview</text>
          </RebornTabPane>
          <RebornTabPane key="detail" title="明细">
            <text class="text-26 text-gray-7">当前选中 detail</text>
          </RebornTabPane>
          <RebornTabPane key="log" title="日志">
            <text class="text-26 text-gray-7">当前选中 log</text>
          </RebornTabPane>
        </RebornTabs>
      </view>
      <view class="flex justify-between">
        <text class="text-24 text-gray-6">change × {{ changeCount }}</text>
        <text class="text-24 text-gray-6 font-mono">active-key = {{ playKey }}</text>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">类型 (Type)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="t in tabsTypes" :key="t">
            <ReButton
              size="xs" :variant="currentType === t ? 'filled' : 'outlined'"
              :color="currentType === t ? 'primary' : 'neutral'" @tap="currentType = t"
            >
              {{ t }}
            </ReButton>
          </view>
        </view>
      </view>
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">尺寸 (Size)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="s in tabsSizes" :key="s">
            <ReButton
              size="xs" :variant="currentSize === s ? 'filled' : 'outlined'"
              :color="currentSize === s ? 'primary' : 'neutral'" @tap="currentSize = s"
            >
              {{ s }}
            </ReButton>
          </view>
        </view>
      </view>
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">位置 (Position)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="p in tabsPositions" :key="p">
            <ReButton
              size="xs" :variant="currentPosition === p ? 'filled' : 'outlined'"
              :color="currentPosition === p ? 'primary' : 'neutral'" @tap="currentPosition = p"
            >
              {{ p }}
            </ReButton>
          </view>
        </view>
      </view>
    </RebornCard>

    <!-- 类型 -->
    <RebornCard title="类型" custom-class="space-y-4">
      <text class="text-24 text-gray-6">
        line 下划线跟随标题滑动；card / card-gutter 用边框围出卡片，区别是标签之间是否留缝；card-fill
        不画边框，只给选中项铺一层与内容区同色的底，两块背景连成一片；text
        去掉一切容器只留文字；rounded 选中态填充主题色；capsule 把整条标签栏做成分段控件
      </text>
      <view v-for="t in tabsTypes" :key="t" class="flex flex-col gap-2">
        <text class="text-24 text-gray-5 font-mono">{{ t }}</text>
        <RebornTabs v-model:active-key="typeKey" :type="t">
          <RebornTabPane key="all" title="全部">
            <text class="text-26 text-gray-7">全部内容</text>
          </RebornTabPane>
          <RebornTabPane key="doing" title="进行中">
            <text class="text-26 text-gray-7">进行中内容</text>
          </RebornTabPane>
          <RebornTabPane key="done" title="已完成">
            <text class="text-26 text-gray-7">已完成内容</text>
          </RebornTabPane>
        </RebornTabs>
      </view>
    </RebornCard>

    <!-- 尺寸 -->
    <RebornCard title="尺寸" custom-class="space-y-4">
      <text class="text-24 text-gray-6">
        size 只影响标签高度与字号，水平内边距不跟着变——三种卡片类型固定 32rpx。下面 card-gutter 的高度是
        mini 48 / small 64 / medium 80 / large 80（rpx）；line 与 text 走整行行高，同一个 size 量出来更高
      </text>
      <view v-for="s in tabsSizes" :key="s" class="flex flex-col gap-2">
        <text class="text-24 text-gray-5 font-mono">{{ s }}</text>
        <RebornTabs v-model:active-key="sizeKey" :size="s" type="card-gutter">
          <RebornTabPane key="all" title="全部">
            <text class="text-26 text-gray-7">全部内容</text>
          </RebornTabPane>
          <RebornTabPane key="doing" title="进行中">
            <text class="text-26 text-gray-7">进行中内容</text>
          </RebornTabPane>
        </RebornTabs>
      </view>
    </RebornCard>

    <!-- 位置 -->
    <RebornCard title="位置" custom-class="space-y-4">
      <text class="text-24 text-gray-6">
        position 决定头部贴哪一边。left / right 会把布局转成横向，标签栏需要一个确定的高度才能滚动，
        所以外层容器要给高
      </text>
      <view v-for="p in tabsPositions" :key="p" class="flex flex-col gap-2">
        <text class="text-24 text-gray-5 font-mono">{{ p }}</text>
        <view :class="p === 'left' || p === 'right' ? 'h-[280rpx]' : ''">
          <RebornTabs v-model:active-key="positionKey" :position="p">
            <RebornTabPane key="all" title="全部">
              <text class="text-26 text-gray-7">全部内容</text>
            </RebornTabPane>
            <RebornTabPane key="doing" title="进行中">
              <text class="text-26 text-gray-7">进行中内容</text>
            </RebornTabPane>
            <RebornTabPane key="done" title="已完成">
              <text class="text-26 text-gray-7">已完成内容</text>
            </RebornTabPane>
          </RebornTabs>
        </view>
      </view>
    </RebornCard>

    <!-- 禁用 -->
    <RebornCard title="禁用" custom-class="space-y-4">
      <text class="text-24 text-gray-6">禁用的标签点击与悬停都不会切换，指示器也不会移过去</text>
      <RebornTabs v-model:active-key="disabledKey">
        <RebornTabPane key="normal" title="可用">
          <text class="text-26 text-gray-7">可用内容</text>
        </RebornTabPane>
        <RebornTabPane key="locked" title="已锁定" disabled>
          <text class="text-26 text-gray-7">锁定内容</text>
        </RebornTabPane>
        <RebornTabPane key="other" title="其他">
          <text class="text-26 text-gray-7">其他内容</text>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>

    <!-- 可编辑 -->
    <RebornCard title="可编辑" custom-class="space-y-4">
      <text class="text-24 text-gray-6">
        editable 打开后每个标签末尾出现关闭按钮，show-add-button 再补一个新增按钮。组件只负责抛
        add / delete 事件，增删由页面自己改数据，删除后选中哪一个也由页面决定
      </text>
      <RebornTabs
        v-model:active-key="editableKey" type="card-gutter" editable show-add-button
        @add="handleAdd" @delete="handleDelete"
      >
        <RebornTabPane v-for="pane in editablePanes" :key="pane.key" :title="pane.title">
          <text class="text-26 text-gray-7">{{ pane.title }} 的内容</text>
        </RebornTabPane>
      </RebornTabs>
      <text class="text-24 text-gray-5">固定标签可以单独设 closable 为 false，只留新增不许关闭</text>
      <RebornTabs v-model:active-key="editableKey" type="card-gutter" editable>
        <RebornTabPane key="order" title="订单" :closable="false">
          <text class="text-26 text-gray-7">订单不允许关闭</text>
        </RebornTabPane>
        <RebornTabPane key="refund" title="退款">
          <text class="text-26 text-gray-7">退款可以关闭</text>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>

    <!-- 额外内容 -->
    <RebornCard title="额外内容" custom-class="space-y-4">
      <text class="text-24 text-gray-6">extra 插槽挂在标签栏末尾，常用来放筛选、刷新一类和整块内容相关的操作</text>
      <RebornTabs v-model:active-key="extraKey">
        <template #extra>
          <ReButton size="xs" variant="text" color="neutral">
            刷新
          </ReButton>
        </template>
        <RebornTabPane key="inbox" title="收件箱">
          <text class="text-26 text-gray-7">收件箱内容</text>
        </RebornTabPane>
        <RebornTabPane key="sent" title="已发送">
          <text class="text-26 text-gray-7">已发送内容</text>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>

    <!-- 滚动定位 -->
    <RebornCard title="滚动定位" custom-class="space-y-4">
      <text class="text-24 text-gray-6">
        标签超出一屏时会横向滚动。scroll-position 默认 auto，只在选中项被挡住时补上差值；
        start / center / end 每次切换都把它对到固定位置，传数字则直接指定滚动距离
      </text>
      <view class="flex flex-wrap gap-2">
        <view v-for="mode in scrollModes" :key="mode">
          <ReButton
            size="xs" :variant="currentScrollMode === mode ? 'filled' : 'outlined'"
            :color="currentScrollMode === mode ? 'primary' : 'neutral'" @tap="currentScrollMode = mode"
          >
            {{ mode }}
          </ReButton>
        </view>
      </view>
      <RebornTabs v-model:active-key="scrollKey" :scroll-position="currentScrollMode">
        <RebornTabPane v-for="pane in scrollPanes" :key="pane.key" :title="pane.title">
          <text class="text-26 text-gray-7">{{ pane.title }} 的内容</text>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>

    <!-- 触发方式 -->
    <RebornCard title="触发方式" custom-class="space-y-4">
      <text class="text-24 text-gray-6">trigger 设为 hover 时鼠标移入即切换。小程序与 App 没有悬停，该值等同 click</text>
      <RebornTabs v-model:active-key="hoverKey" trigger="hover" type="rounded">
        <RebornTabPane key="day" title="日">
          <text class="text-26 text-gray-7">按日统计</text>
        </RebornTabPane>
        <RebornTabPane key="week" title="周">
          <text class="text-26 text-gray-7">按周统计</text>
        </RebornTabPane>
        <RebornTabPane key="month" title="月">
          <text class="text-26 text-gray-7">按月统计</text>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>

    <!-- 过渡动画 -->
    <RebornCard title="过渡动画" custom-class="space-y-4">
      <text class="text-24 text-gray-6">animation 让切入的面板淡入。小程序端没有 Transition，只做入场淡入，不做退场</text>
      <RebornTabs v-model:active-key="animationKey" animation>
        <RebornTabPane key="one" title="第一屏">
          <view class="h-[160rpx] flex items-center rounded-ui-2xs bg-gray-2 px-[24rpx]">
            <text class="text-26 text-gray-7">第一屏内容</text>
          </view>
        </RebornTabPane>
        <RebornTabPane key="two" title="第二屏">
          <view class="h-[160rpx] flex items-center rounded-ui-2xs bg-gray-2 px-[24rpx]">
            <text class="text-26 text-gray-7">第二屏内容</text>
          </view>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>

    <!-- 渲染策略 -->
    <RebornCard title="渲染策略" custom-class="space-y-4">
      <text class="text-24 text-gray-6">
        默认所有面板一次性挂载并保留。lazy-load 推迟到首次展示再挂载，适合内容重、首屏只看一个的场景
      </text>
      <RebornTabs v-model:active-key="lazyKey" lazy-load>
        <RebornTabPane key="first" title="首个">
          <input class="h-[64rpx] w-full rounded-ui-2xs border border-gray-3 px-[16rpx] text-26" placeholder="输入后切走再回来，内容还在">
        </RebornTabPane>
        <RebornTabPane key="second" title="次个">
          <text class="text-26 text-gray-7">第一次点进来才挂载</text>
        </RebornTabPane>
      </RebornTabs>
      <text class="text-24 text-gray-6">destroy-on-hide 则相反，离开就销毁，面板里的临时状态会一并丢掉</text>
      <RebornTabs v-model:active-key="destroyKey" destroy-on-hide>
        <RebornTabPane key="first" title="首个">
          <input class="h-[64rpx] w-full rounded-ui-2xs border border-gray-3 px-[16rpx] text-26" placeholder="输入后切走再回来，内容已清空">
        </RebornTabPane>
        <RebornTabPane key="second" title="次个">
          <text class="text-26 text-gray-7">每次进入都是新的</text>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>

    <!-- 撑满高度 -->
    <RebornCard title="撑满高度" custom-class="space-y-4">
      <text class="text-24 text-gray-6">justify 让内容区吃掉容器剩余高度，配合定高外层做「头部固定、内容滚动」的版式</text>
      <view class="h-[320rpx]">
        <RebornTabs v-model:active-key="justifyKey" justify>
          <RebornTabPane key="list" title="列表">
            <view class="h-full flex items-center justify-center rounded-ui-2xs bg-gray-2">
              <text class="text-26 text-gray-7">内容区已撑满剩余高度</text>
            </view>
          </RebornTabPane>
          <RebornTabPane key="chart" title="图表">
            <view class="h-full flex items-center justify-center rounded-ui-2xs bg-gray-2">
              <text class="text-26 text-gray-7">图表占位</text>
            </view>
          </RebornTabPane>
        </RebornTabs>
      </view>
    </RebornCard>

    <!-- 样式定制 -->
    <RebornCard title="样式定制" custom-class="space-y-4">
      <text class="text-24 text-gray-6">color 只改 --re-tabs-color 这一个变量，指示器与选中态一起跟着变</text>
      <RebornTabs v-model:active-key="typeKey" color="success">
        <RebornTabPane key="all" title="全部">
          <text class="text-26 text-gray-7">全部内容</text>
        </RebornTabPane>
        <RebornTabPane key="doing" title="进行中">
          <text class="text-26 text-gray-7">进行中内容</text>
        </RebornTabPane>
      </RebornTabs>
      <text class="text-24 text-gray-6">ui 按槽位覆写，下面把指示器换成整条标题宽的粗线</text>
      <RebornTabs
        v-model:active-key="typeKey"
        :ui="{ indicator: 'h-[8rpx] rounded-none', tab: 'tracking-wide' }"
      >
        <RebornTabPane key="all" title="全部">
          <text class="text-26 text-gray-7">全部内容</text>
        </RebornTabPane>
        <RebornTabPane key="doing" title="进行中">
          <text class="text-26 text-gray-7">进行中内容</text>
        </RebornTabPane>
      </RebornTabs>
    </RebornCard>
  </RebornPage>
</template>
