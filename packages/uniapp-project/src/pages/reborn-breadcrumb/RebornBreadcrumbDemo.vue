<script setup lang="ts">
import type { BreadcrumbDroplistItem, BreadcrumbRoute } from '@/components/reborn-breadcrumb'
import { computed, ref } from 'vue'
import { RebornBreadcrumb, RebornBreadcrumbItem } from '@/components/reborn-breadcrumb'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSlider from '@/components/reborn-slider/RebornSlider.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'

/** 本页路径，用于演示会清空页面栈的跳转方式 */
const SELF_PATH = '/pages/reborn-breadcrumb/RebornBreadcrumbDemo'
/** 首页路径，作为各段落的跳转目标 */
const HOME_PATH = '/pages/index/index'

const defaultState = {
  separator: '/',
  separatorIcon: '',
  maxCount: 0,
}

const separator = ref(defaultState.separator)
const separatorIcon = ref(defaultState.separatorIcon)
const maxCount = ref(defaultState.maxCount)

/** 可选文本分隔符 */
const separatorOptions = ['/', '>', '»', '·']

/** 可选图标分隔符，空串表示不使用图标（回落到文本分隔符） */
const separatorIconOptions = [
  { label: '不使用', value: '', icon: '' },
  { label: 'chevron', value: 'i-lucide-chevron-right', icon: 'i-lucide-chevron-right' },
  { label: 'arrow', value: 'i-lucide-arrow-right', icon: 'i-lucide-arrow-right' },
  { label: 'slash', value: 'i-lucide-slash', icon: 'i-lucide-slash' },
]

/** 演练场当前配置摘要，方便对照预览区 */
const playgroundHint = computed(() => {
  const icon = separatorIconOptions.find(item => item.value === separatorIcon.value)
  const count = maxCount.value > 0 ? `最多 ${maxCount.value} 项` : '不折叠'
  return `分隔符 ${separator.value}  ·  图标 ${icon?.label || '不使用'}  ·  ${count}`
})

function resetPlayground() {
  separator.value = defaultState.separator
  separatorIcon.value = defaultState.separatorIcon
  maxCount.value = defaultState.maxCount
}

/** routes 模式数据源，children 会渲染成条目上的下拉菜单 */
const routes: BreadcrumbRoute[] = [
  { label: '首页', path: HOME_PATH },
  {
    label: '组件库',
    children: [
      { label: '按钮 Button' },
      { label: '标签 Badge' },
      { label: '下拉选择 DropdownSelect' },
    ],
  },
  { label: '导航' },
  { label: '面包屑' },
]

/** 长路径，用于演示 max-count 折叠 */
const longRoutes: BreadcrumbRoute[] = [
  { label: '首页', path: HOME_PATH },
  { label: '商品中心' },
  { label: '家电' },
  { label: '厨房' },
  { label: '微波炉' },
  { label: '详情' },
]

/** 条目 droplist 属性的数据源 */
const droplist: BreadcrumbDroplistItem[] = [
  { label: '活动列表' },
  { label: '活动模板' },
  { label: '活动数据' },
]

const customDroplist = ['自定义项 1', '自定义项 2', '自定义项 3']

const lastSelected = ref('')

function onSelect(item: BreadcrumbDroplistItem) {
  lastSelected.value = item.label
}

/** #droplist 自定义内容需要自行记录选择结果 */
function onCustomSelect(label: string) {
  lastSelected.value = label
}
</script>

<template>
  <RebornPage title="Breadcrumb 面包屑" description="显示当前页面路径，快速回到之前的任意一级。">
    <!-- 交互演练场：预览台与控制区分开，避免控件把面包屑挤到角落 -->
    <RebornCard title="交互演练场" overflow-visible>
      <RebornText color="neutral">
        切换分隔符或折叠数量，预览区会即时反映。
      </RebornText>

      <view class="relative overflow-hidden rounded-xl bg-gray-2 dark:bg-gray-9">
        <view class="absolute -right-16 -top-16 size-32 rounded-full bg-primary/15 blur-2xl" />
        <view class="absolute -bottom-16 -left-10 size-28 rounded-full bg-info/10 blur-2xl" />
        <view class="relative flex min-h-45 flex-col items-center justify-center gap-3 px-4 py-8">
          <RebornBreadcrumb :separator="separator" :separator-icon="separatorIcon" :max-count="maxCount">
            <RebornBreadcrumbItem :to="HOME_PATH">
              首页
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              组件库
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              导航
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              面包屑
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              基础
            </RebornBreadcrumbItem>
          </RebornBreadcrumb>
          <text class="text-22 text-gray-5">
            {{ playgroundHint }}
          </text>
        </view>
      </view>

      <view class="flex flex-row items-center justify-between">
        <RebornText color="neutral">
          文本分隔符
        </RebornText>
        <RebornButton size="xs" variant="text" color="neutral" @click="resetPlayground">
          重置
        </RebornButton>
      </view>
      <view class="flex flex-row flex-wrap gap-2">
        <RebornButton
          v-for="option in separatorOptions"
          :key="option"
          size="sm"
          variant="outlined"
          :color="separator === option ? 'primary' : 'neutral'"
          @click="separator = option"
        >
          {{ option }}
        </RebornButton>
      </view>

      <RebornText color="neutral">
        图标分隔符
      </RebornText>
      <view class="flex flex-row flex-wrap gap-2">
        <RebornButton
          v-for="option in separatorIconOptions"
          :key="option.label"
          size="sm"
          variant="outlined"
          :color="separatorIcon === option.value ? 'primary' : 'neutral'"
          @click="separatorIcon = option.value"
        >
          <view v-if="option.icon" :class="option.icon" class="mr-1 size-3.5" />
          {{ option.label }}
        </RebornButton>
      </view>

      <RebornText color="neutral">
        最多展示数量（0 不限制）
      </RebornText>
      <RebornSlider v-model="maxCount" :min="0" :max="6" :step="1" show-value />
    </RebornCard>

    <RebornCard title="基础用法">
      <RebornText color="neutral">
        条目用 RebornBreadcrumbItem 包裹，末项自动识别为当前页。
      </RebornText>
      <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
        <RebornBreadcrumb>
          <RebornBreadcrumbItem :to="HOME_PATH">
            首页
          </RebornBreadcrumbItem>
          <RebornBreadcrumbItem>
            频道
          </RebornBreadcrumbItem>
          <RebornBreadcrumbItem>
            新闻
          </RebornBreadcrumbItem>
        </RebornBreadcrumb>
      </view>
    </RebornCard>

    <RebornCard title="分隔符定制">
      <RebornText color="neutral">
        容器级 separator / separator-icon 可被条目属性或 #separator 插槽覆盖。
      </RebornText>

      <view class="flex flex-col gap-4">
        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            容器文本 · separator
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb separator=">">
              <RebornBreadcrumbItem :to="HOME_PATH">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                活动
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                详情
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            容器图标 · separator-icon
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb separator-icon="i-lucide-arrow-right">
              <RebornBreadcrumbItem :to="HOME_PATH">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                用户
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                设置
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            条目属性 · separator
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb separator="/">
              <RebornBreadcrumbItem :to="HOME_PATH">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem separator="→">
                商城
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                购物车
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            条目插槽 · #separator
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb>
              <RebornBreadcrumbItem :to="HOME_PATH">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                商城
                <template #separator>
                  <text class="text-primary mx-1">
                    ~
                  </text>
                </template>
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                购物车
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>
      </view>
    </RebornCard>

    <RebornCard title="尺寸与配色">
      <RebornText color="neutral">
        通过 ui 覆盖根节点与条目样式，父级 ui 会级联到所有子条目。
      </RebornText>

      <view class="flex flex-col gap-4">
        <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
          <RebornBreadcrumb :ui="{ root: 'text-24', separator: 'text-20' }">
            <RebornBreadcrumbItem :to="HOME_PATH">
              小号
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              组件库
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              面包屑
            </RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </view>

        <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
          <RebornBreadcrumb :ui="{ root: 'text-32', link: 'text-primary/80', separator: 'text-primary/40' }">
            <RebornBreadcrumbItem :to="HOME_PATH">
              大号主色
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              组件库
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              面包屑
            </RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </view>
      </view>
    </RebornCard>

    <RebornCard title="routes 数据驱动" overflow-visible>
      <RebornText color="neutral">
        传入 routes 后由组件渲染条目；#item-render 可接管单项内容。
      </RebornText>

      <view class="flex flex-col gap-4">
        <view class="overflow-visible rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
          <RebornBreadcrumb :routes="routes" @select="onSelect" />
        </view>

        <view class="overflow-visible rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
          <RebornBreadcrumb :routes="routes">
            <template #item-render="{ route, paths }">
              <view class="flex flex-row items-center gap-1">
                <view class="i-lucide-folder size-3.5 opacity-60" />
                <text>{{ route.label }}</text>
                <text class="text-22 text-gray-5">
                  ({{ paths.length }})
                </text>
              </view>
            </template>
          </RebornBreadcrumb>
        </view>
      </view>

      <text class="text-22 text-gray-5">
        第二组用 #item-render 自定义了每一项，作用域含 route、routes 与 paths。
      </text>
    </RebornCard>

    <RebornCard title="下拉菜单" overflow-visible>
      <RebornText color="neutral">
        routes.children、droplist 属性或 #droplist 插槽都会展开下拉。
      </RebornText>

      <view class="flex flex-col gap-4">
        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            droplist 属性
          </text>
          <view class="overflow-visible rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb>
              <RebornBreadcrumbItem :to="HOME_PATH">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem :droplist="droplist" @select="onSelect">
                活动
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                详情
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            #droplist 插槽
          </text>
          <view class="overflow-visible rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb>
              <RebornBreadcrumbItem :to="HOME_PATH">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                频道
                <template #droplist>
                  <view
                    v-for="(label, index) in customDroplist"
                    :key="label"
                    class="px-3 py-2 text-28 leading-normal text-gray-8 dark:text-gray-2"
                    :class="index === customDroplist.length - 1 ? 'border-t border-gray-2 dark:border-gray-7' : ''"
                    @tap="onCustomSelect(label)"
                  >
                    {{ label }}
                  </view>
                </template>
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                新闻
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>
      </view>

      <view class="flex flex-row items-center gap-2 rounded-lg bg-gray-2 px-3 py-2 dark:bg-gray-9">
        <view class="i-lucide-mouse-pointer-click size-3.5 text-gray-5" />
        <text class="text-24 text-gray-6">
          最近选择：{{ lastSelected || '尚未选择' }}
        </text>
      </view>
    </RebornCard>

    <RebornCard title="超出折叠">
      <RebornText color="neutral">
        max-count 超出后折叠为省略号，始终保留首项与末尾若干项。
      </RebornText>

      <view class="flex flex-col gap-4">
        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            max-count = 3
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb :routes="longRoutes" :max-count="3" />
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            max-count = 4 · #more-icon
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb :routes="longRoutes" :max-count="4">
              <template #more-icon>
                <text class="text-primary text-24 font-semibold">
                  ···
                </text>
              </template>
            </RebornBreadcrumb>
          </view>
        </view>
      </view>
    </RebornCard>

    <RebornCard title="链接与跳转方式">
      <RebornText color="neutral">
        to 指定地址，replace 对应 uni 的四种路由 API。标签保持简短，避免小屏折行。
      </RebornText>

      <view class="flex flex-col gap-4">
        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            navigate · 入栈
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb>
              <RebornBreadcrumbItem :to="HOME_PATH">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                当前页
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            redirect · 替换当前页
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb>
              <RebornBreadcrumbItem :to="HOME_PATH" replace="redirect">
                首页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                当前页
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <text class="text-22 font-medium text-gray-5">
            reLaunch · 清空页面栈
          </text>
          <view class="rounded-lg bg-gray-2 px-3 py-3 dark:bg-gray-9">
            <RebornBreadcrumb>
              <RebornBreadcrumbItem :to="SELF_PATH" replace="reLaunch">
                本页
              </RebornBreadcrumbItem>
              <RebornBreadcrumbItem>
                当前页
              </RebornBreadcrumbItem>
            </RebornBreadcrumb>
          </view>
        </view>
      </view>

      <text class="text-22 text-gray-5">
        switchTab 仅对 tabBar 页面生效；末项不传 to，渲染为不可点击文本。
      </text>
    </RebornCard>
  </RebornPage>
</template>