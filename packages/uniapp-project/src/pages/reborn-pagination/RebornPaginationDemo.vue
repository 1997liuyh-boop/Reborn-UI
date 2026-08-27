<script lang="ts" setup>
import { ref, watch } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornSelect from '@/components/reborn-select/RebornSelect.vue'
import RebornPagination from '@/components/reborn-pagination/RebornPagination.vue'
import { paginationColors, paginationSizes } from '@/components/reborn-pagination/reborn-pagination.config'

// Playground 状态
const playPage = ref(1)
const playPageSize = ref(10)
const playTotal = ref(200)
const playSize = ref<any>('md')
const playColor = ref<any>('primary')
const playBackground = ref(false)
const playDisabled = ref(false)
const playSimple = ref(false)
const playHideOnSinglePage = ref(false)
const playPagerCount = ref<any>(7)
const playLayout = ref<any>('prev, pager, next')
const playPageSizes = ref<number[]>([10, 20, 50, 100])

// 事件日志（最多展示 6 条）
const eventLog = ref<string[]>([])

function handlePlayCurrentChange(page: number) {
  eventLog.value.push(`current-change: ${page}`)
  if (eventLog.value.length > 6) eventLog.value.shift()
}

function handlePlaySizeChange(size: number) {
  eventLog.value.push(`size-change: ${size}`)
  if (eventLog.value.length > 6) eventLog.value.shift()
}

// 尺寸选项
const sizeOptions = paginationSizes.map(s => ({ label: s, value: s }))

// 主题色选项
const colorOptions = paginationColors.map(c => ({ label: c, value: c }))

// 主题颜色演示的绑定页码
const colorPage = ref(1)

// 折叠数量选项
const pagerCountOptions = [5, 7, 9, 11].map(n => ({ label: `${n}`, value: n }))

// 布局选项
const layoutOptions = [
  { label: 'prev, pager, next', value: 'prev, pager, next' },
  { label: 'total, sizes, prev, pager, next, jumper', value: 'total, sizes, prev, pager, next, jumper' },
  { label: 'prev, pager, next, total', value: 'prev, pager, next, total' },
  { label: 'prev, pager, next, jumper', value: 'prev, pager, next, jumper' },
]

// 每页条数预设
const pageSizePresetIdx = ref<any>(0)
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

watch(pageSizePresetIdx, (idx) => {
  playPageSizes.value = pageSizeLists[idx] ?? [10, 20, 50, 100]
})

// 独立示例状态
const defaultPage = ref(1)
const backgroundPage = ref(1)
const simplePage = ref(1)
const layoutPage = ref(1)
const layoutPageSize = ref(20)
const foldPage = ref(1)
const hidePage = ref(1)
const hideTotal = ref(10)
const slotPage = ref(1)
const slotPageSize = ref(10)

function handleLayoutCurrentChange(page: number) {
  eventLog.value.push(`layout current-change: ${page}`)
  if (eventLog.value.length > 6) eventLog.value.shift()
}

function handleLayoutSizeChange(size: number) {
  eventLog.value.push(`layout size-change: ${size}`)
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
        <text class="text-24 text-gray-5 mb-2">主题色 color</text>
        <RebornSelect v-model="playColor" :options="colorOptions" :size="'sm'" :clearable="false" />
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
          :color="playColor"
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
        <text v-for="(line, i) in eventLog" :key="i" class="text-24 text-gray-6">{{ line }}</text>
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

    <!-- 主题颜色 -->
    <RebornCard title="主题颜色（color）">
      <view class="flex flex-col gap-3">
        <RebornPagination
          v-for="c in paginationColors"
          :key="c"
          v-model="colorPage"
          :total="50"
          :color="c"
          background
        />
      </view>
    </RebornCard>

    <!-- 简洁模式 -->
    <RebornCard title="简洁模式（simple）">
      <RebornPagination v-model="simplePage" :total="60" simple />
      <text class="text-24 text-gray-6">当前页 {{ simplePage }}（输入框可直接键入跳页）</text>
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

        <template #pager-item="{ page, active }">
          <view
            class="px-3 h-[56rpx] inline-flex items-center justify-center rounded-full border"
            :class="active ? 'bg-primary text-white border-primary' : 'bg-white text-gray-6 border-gray-3'"
            @tap="slotPage = page"
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