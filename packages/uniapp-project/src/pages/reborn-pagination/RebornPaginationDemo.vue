<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornSelect from '@/components/reborn-select/RebornSelect.vue'
import RebornPagination from '@/components/reborn-pagination/RebornPagination.vue'
import { paginationSizes } from '@/components/reborn-pagination/reborn-pagination.config'

// Playground 状态
const playPage = shallowRef(1)
const playPageSize = shallowRef(10)
const playTotal = shallowRef(200)
const playSize = shallowRef<typeof paginationSizes[number]>('md')
const playBackground = shallowRef(false)
const playDisabled = shallowRef(false)
const playSimple = shallowRef(false)
const playHideOnSinglePage = shallowRef(false)
// 初值与组件默认值保持一致（双端默认均为 3）
const playPagerCount = shallowRef(3)
const playLayout = shallowRef('prev, pager, next')

// 事件日志（最多展示 6 条）
let eventId = 0
const eventLog = ref<{ id: number, text: string }[]>([])

function handlePlayCurrentChange(page: number) {
  eventLog.value.push({ id: ++eventId, text: `current-change: ${page}` })
  if (eventLog.value.length > 6) eventLog.value.shift()
}

function handlePlaySizeChange(size: number) {
  eventLog.value.push({ id: ++eventId, text: `size-change: ${size}` })
  if (eventLog.value.length > 6) eventLog.value.shift()
}

// 尺寸选项
const sizeOptions = paginationSizes.map(s => ({ label: s, value: s }))

// 折叠数量选项
// pagerCount 为不小于 3 的整数，奇偶均可，3 即为默认值
const pagerCountOptions = [3, 5, 7, 9, 11].map(n => ({ label: `${n}`, value: n }))

// 布局选项
const layoutOptions = [
  { label: 'prev, pager, next', value: 'prev, pager, next' },
  { label: 'total, sizes, prev, pager, next, jumper', value: 'total, sizes, prev, pager, next, jumper' },
  { label: 'prev, pager, next, total', value: 'prev, pager, next, total' },
  { label: 'prev, pager, next, jumper', value: 'prev, pager, next, jumper' },
]

// 每页条数预设
const pageSizePresetIdx = shallowRef(0)
const pageSizePresets = [
  { label: '10/20/50/100', value: 0 },
  { label: '5/10/15/20', value: 1 },
  { label: '2/4/6/8', value: 2 },
]
const pageSizeLists = [
  [10, 20, 50, 100],
  [5, 10, 15, 20],
  [2, 4, 6, 8],
]

const playPageSizes = computed(() => pageSizeLists[pageSizePresetIdx.value] ?? pageSizeLists[0]!)

// 独立示例状态
const defaultPage = shallowRef(1)
const backgroundPage = shallowRef(1)
const simplePage = shallowRef(1)
const layoutPage = shallowRef(1)
const layoutPageSize = shallowRef(20)
const foldPage = shallowRef(1)
const hidePage = shallowRef(1)
const hideTotal = shallowRef(10)
const slotPage = shallowRef(1)
const slotPageSize = shallowRef(10)

function handleLayoutCurrentChange(page: number) {
  eventLog.value.push({ id: ++eventId, text: `layout current-change: ${page}` })
  if (eventLog.value.length > 6) eventLog.value.shift()
}

function handleLayoutSizeChange(size: number) {
  eventLog.value.push({ id: ++eventId, text: `layout size-change: ${size}` })
  if (eventLog.value.length > 6) eventLog.value.shift()
}
</script>

<template>
  <RebornPage title="Pagination 分页" description="当数据量过多时，使用分页分解数据。">

    <!-- Playground 配置演示 -->
    <RebornCard title="配置演示（Playground）">
      <view>
        <text class="text-24 text-gray-5 mb-2">尺寸 size</text>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="s in paginationSizes"
            :key="s"
            class="px-4 py-1 rounded-full"
            :class="playSize === s ? 'bg-primary text-white' : 'bg-gray-2 text-gray-6'"
            @tap="playSize = s"
          >
            <text class="text-24">{{ s }}</text>
          </view>
        </view>
      </view>

      <view>
        <text class="text-24 text-gray-5 mb-2">折叠数量 pagerCount</text>
        <RebornSelect v-model="playPagerCount" :options="pagerCountOptions" :size="'sm'" :clearable="false" />
      </view>

      <view>
        <text class="text-24 text-gray-5 mb-2">布局 layout</text>
        <RebornSelect v-model="playLayout" :options="layoutOptions" :size="'sm'" :clearable="false" />
      </view>

      <view>
        <text class="text-24 text-gray-5 mb-2">每页条数 pageSizes</text>
        <RebornSelect v-model="pageSizePresetIdx" :options="pageSizePresets" :size="'sm'" :clearable="false" />
      </view>

      <view>
        <text class="text-24 text-gray-5 mb-2">背景 background</text>
        <RebornSwitch v-model="playBackground" active-label="开" inactive-label="关" />
      </view>

      <view>
        <text class="text-24 text-gray-5 mb-2">禁用 disabled</text>
        <RebornSwitch v-model="playDisabled" active-label="禁用" inactive-label="启用" />
      </view>

      <view>
        <text class="text-24 text-gray-5 mb-2">简洁模式 simple</text>
        <RebornSwitch v-model="playSimple" active-label="开" inactive-label="关" />
      </view>

      <view>
        <text class="text-24 text-gray-5 mb-2">单页隐藏 hideOnSinglePage</text>
        <RebornSwitch v-model="playHideOnSinglePage" active-label="隐藏" inactive-label="显示" />
      </view>

      <view class="py-4">
        <RebornPagination
          v-model="playPage"
          v-model:page-size="playPageSize"
          :total="playTotal"
          :pager-count="playPagerCount"
          :layout="playLayout"
          :page-sizes="playPageSizes"
          :size="playSize"
          :background="playBackground"
          :disabled="playDisabled"
          :simple="playSimple"
          :hide-on-single-page="playHideOnSinglePage"
          @current-change="handlePlayCurrentChange"
          @size-change="handlePlaySizeChange"
        />
        <view class="mt-2 text-center">
          <text class="text-24 text-gray-6">当前页 {{ playPage }}，每页 {{ playPageSize }} 条</text>
        </view>
      </view>

      <view v-if="eventLog.length" class="flex flex-col gap-1">
        <text class="text-24 text-gray-5">事件日志</text>
        <text v-for="line in eventLog" :key="line.id" class="text-24 text-gray-6">{{ line.text }}</text>
      </view>
    </RebornCard>

    <!-- 默认 -->
    <RebornCard title="默认">
      <RebornPagination v-model="defaultPage" :total="100" />
      <text class="text-24 text-gray-6">当前页 {{ defaultPage }}</text>
    </RebornCard>

    <!-- 背景 -->
    <RebornCard title="背景（background）">
      <RebornPagination v-model="backgroundPage" :total="80" background />
      <text class="text-24 text-gray-6">当前页 {{ backgroundPage }}</text>
    </RebornCard>

    <!-- 简洁模式 -->
    <RebornCard title="简洁模式（simple）">
      <RebornPagination v-model="simplePage" :total="60" simple />
      <text class="text-24 text-gray-6">当前页 {{ simplePage }} / 总页数文本展示</text>
    </RebornCard>

    <!-- 完整布局 -->
    <RebornCard title="完整布局（jumper + total + sizes）">
      <RebornPagination
        v-model="layoutPage"
        v-model:page-size="layoutPageSize"
        :total="120"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleLayoutCurrentChange"
        @size-change="handleLayoutSizeChange"
      />
      <text class="text-24 text-gray-6">当前页 {{ layoutPage }}，每页 {{ layoutPageSize }} 条</text>
    </RebornCard>

    <!-- 页码折叠 -->
    <RebornCard title="页码折叠（total ≥ 200）">
      <RebornPagination v-model="foldPage" :total="200" :pager-count="7" />
      <text class="text-24 text-gray-6">当前页 {{ foldPage }}</text>
    </RebornCard>

    <!-- 单页隐藏 -->
    <RebornCard title="单页隐藏（hide-on-single-page）">
      <view class="flex items-center justify-between">
        <text class="text-24 text-gray-5">切换 total（10 单页 / 30 三页）</text>
        <RebornSwitch v-model="hideTotal" active-label="1 页" inactive-label="3 页" :active-value="10" :inactive-value="30" />
      </view>
      <RebornPagination v-model="hidePage" :total="hideTotal" hide-on-single-page />
      <text class="text-24 text-gray-6">{{ hideTotal <= 10 ? '单页时组件已隐藏' : '多页时正常显示' }}</text>
    </RebornCard>

    <!-- 插槽自定义 -->
    <RebornCard title="插槽自定义">
      <RebornPagination
        v-model="slotPage"
        v-model:page-size="slotPageSize"
        :total="60"
        layout="prev, pager, next, jumper, total, sizes"
      >
        <template #prev="{ prev }">
          <view class="px-3 h-[56rpx] inline-flex items-center justify-center rounded-md bg-gray-2" @tap="prev">
            <view class="i-lucide-arrow-left text-24 text-primary" />
          </view>
        </template>

        <template #pager-item="{ page, active, select }">
          <view
            class="px-3 h-[56rpx] inline-flex items-center justify-center rounded-full border"
            :class="active ? 'bg-primary text-white border-primary' : 'bg-white text-gray-6 border-gray-3'"
            @tap="select"
          >
            <text class="text-24 font-medium">{{ page }}</text>
          </view>
        </template>

        <template #next="{ next }">
          <view class="px-3 h-[56rpx] inline-flex items-center justify-center rounded-md bg-gray-2" @tap="next">
            <view class="i-lucide-arrow-right text-24 text-primary" />
          </view>
        </template>

        <template #jumper="{ current, totalPages, jump }">
          <view class="inline-flex items-center gap-[8rpx]">
            <text class="text-24 text-gray-5">第 {{ current }}/{{ totalPages }} 页</text>
            <view class="px-2 py-1 rounded-md bg-gray-2" @tap="jump(1)">
              <text class="text-24 text-primary">首页</text>
            </view>
          </view>
        </template>

        <template #total="{ total }">
          <text class="text-24 text-primary">共 {{ total }} 条数据</text>
        </template>

        <template #sizes="{ pageSize, pageSizes, change }">
          <view class="inline-flex items-center gap-[8rpx]">
            <view
              v-for="s in pageSizes"
              :key="s"
              class="px-2 py-1 rounded-md"
              :class="pageSize === s ? 'bg-primary text-white' : 'bg-gray-2 text-gray-6'"
              @tap="change(s)"
            >
              <text class="text-24">{{ s }} 条/页</text>
            </view>
          </view>
        </template>
      </RebornPagination>
      <text class="text-24 text-gray-6">当前页 {{ slotPage }}，每页 {{ slotPageSize }} 条</text>
    </RebornCard>

  </RebornPage>
</template>
