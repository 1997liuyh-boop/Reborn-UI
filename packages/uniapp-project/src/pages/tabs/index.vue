<script setup lang="ts">
import type { TabsProps } from '@/components/reborn-tabs-test/types'
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import TabsContent from '@/components/reborn-tabs-test/TabsContent.vue'
import TabsList from '@/components/reborn-tabs-test/TabsList.vue'

// import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/reborn-tabs'
import TabsRoot from '@/components/reborn-tabs-test/TabsRoot.vue'
import TabsTrigger from '@/components/reborn-tabs-test/TabsTrigger.vue'

const activeTab1 = ref(0)
const activeTab2 = ref(0)
const activeTab3 = ref(0)
const activeTab4 = ref(0)
const activeTab5 = ref(0)
const activeTab6 = ref(0)

const tabs = ['Account', 'Password', 'Settings', 'Notifications', 'Phone']
const scrollTabs = Array.from({ length: 10 }, (_, i) => `Tab ${i + 1}`)

const activeIndex = ref(0)
const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab ${i + 1}`)
const type = ref<TabsProps['type']>('line')
const variant = ref<TabsProps['variant']>('primary')
const size = ref<TabsProps['size']>('md')
const orientation = ref<TabsProps['orientation']>('horizontal')
const sticky = ref<boolean>(true)
const shrink = ref<boolean>(true)
const scrollspy = ref<boolean>(true)
const swipeable = ref<boolean>(true)
const activationMode = ref<TabsProps['activationMode']>('manual')
</script>

<template>
  <RebornPage title="标签页 (Tabs)" description="用于内容组织和导航的标签页组件。">
    <!-- Basic Usage -->
    <!-- <RebornCard title="基础用法 (Basic)" class="space-y-3">
            <TabsRoot v-model:active="activeTab1" type="line">
                <TabsList>
                    <TabsTrigger v-for="(tab, index) in tabs" :key="tab" :index="index" :label="tab" />
                </TabsList>
                <TabsContent v-for="(tab, index) in tabs" :key="tab" :index="index">
                    <view class="p-4 bg-slate-50 rounded-lg mt-2">
                        <text class="text-slate-600">Content of {{ tab }}</text>
                    </view>
                </TabsContent>
            </TabsRoot>
        </RebornCard> -->

    <!-- Card Type -->
    <!-- <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">卡片样式 (Card)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <TabsRoot v-model:active="activeTab1" type="card">
                    <TabsList>
                        <TabsTrigger v-for="(tab, index) in tabs" :key="tab" :index="index" :label="tab" />
                    </TabsList>
                    <TabsContent v-for="(tab, index) in tabs" :key="tab" :index="index">
                        <view class="p-4 bg-slate-50 rounded-lg mt-2">
                            <text class="text-slate-600">Card Content {{ tab }}</text>
                        </view>
                    </TabsContent>
                </TabsRoot>
            </view>
        </view> -->

    <!-- Vertical -->
    <!-- <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">垂直模式 (Vertical)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm h-64">
                <TabsRoot v-model:active="activeTab3" orientation="vertical" class="h-full">
                    <TabsList>
                        <TabsTrigger v-for="(tab, index) in tabs" :key="tab" :index="index" :label="tab" />
                    </TabsList>
                    <TabsContent v-for="(tab, index) in tabs" :key="tab" :index="index" class="p-4">
                        <text class="text-slate-900 font-bold mb-2 block">{{ tab }}</text>
                        <text class="text-slate-500 text-sm">
                            This is the content for {{ tab }}. It is displayed in a vertical layout.
                        </text>
                    </TabsContent>
                </TabsRoot>
            </view>
        </view> -->

    <!-- Scrollable -->
    <!-- <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">滚动模式 (Scrollable)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <TabsRoot v-model:active="activeTab4">
                    <TabsList>
                        <TabsTrigger v-for="(tab, index) in scrollTabs" :key="tab" :index="index" :label="tab" />
                    </TabsList>
                    <TabsContent v-for="(tab, index) in scrollTabs" :key="tab" :index="index">
                        <view class="p-4 bg-slate-50 rounded-lg mt-2">
                            <text class="text-slate-600">Scroll Content {{ tab }}</text>
                        </view>
                    </TabsContent>
                </TabsRoot>
            </view>
        </view> -->

    <!-- Disabled State -->
    <!-- <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">禁用状态 (Disabled)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <TabsRoot v-model:active="activeTab5">
                    <TabsList>
                        <TabsTrigger :index="0" label="Enabled" />
                        <TabsTrigger :index="1" label="Disabled" disabled />
                        <TabsTrigger :index="2" label="Enabled" />
                    </TabsList>
                    <TabsContent :index="0">
                        <view class="p-4 bg-slate-50 rounded-lg mt-2"><text>Content 1</text></view>
                    </TabsContent>
                    <TabsContent :index="1">
                        <view class="p-4 bg-slate-50 rounded-lg mt-2"><text>Content 2</text></view>
                    </TabsContent>
                    <TabsContent :index="2">
                        <view class="p-4 bg-slate-50 rounded-lg mt-2"><text>Content 3</text></view>
                    </TabsContent>
                </TabsRoot>
            </view>
        </view> -->

    <!-- Custom Color -->
    <!-- <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">自定义颜色 (Color Variants)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-8">
                <TabsRoot v-model:active="activeTab6" variant="success">
                    <TabsList>
                        <TabsTrigger :index="0" label="Success" />
                        <TabsTrigger :index="1" label="Tab 2" />
                    </TabsList>
                </TabsRoot>

                <TabsRoot v-model:active="activeTab6" variant="warning">
                    <TabsList>
                        <TabsTrigger :index="0" label="Warning" />
                        <TabsTrigger :index="1" label="Tab 2" />
                    </TabsList>
                </TabsRoot>

                <TabsRoot v-model:active="activeTab6" variant="info">
                    <TabsList>
                        <TabsTrigger :index="0" label="Info" />
                        <TabsTrigger :index="1" label="Tab 2" />
                    </TabsList>
                </TabsRoot>
            </view>
        </view> -->

    <view
      class="
        flex h-[500px] min-w-0 flex-col overflow-hidden rounded-lg border
        border-gray-200 bg-white shadow-sm
        dark:border-gray-800
      "
    >
      <view
        v-if="sticky" class="
          flex-none border-b border-gray-100 p-4
          dark:border-gray-800
        "
      >
        <view class="text-sm text-gray-500">
          Scroll down to see sticky header behavior.
        </view>
      </view>

      <TabsRoot
        v-model:active="activeIndex" :type="type" v-slot="{ currentScrollToId, rootId }" :variant="variant"
        :size="size" :orientation="orientation" :sticky="sticky" :shrink="shrink"
        :scrollspy="scrollspy" :swipeable="swipeable" :activationMode="activationMode"
        :ignore-page-scroll="true" custom-class="flex-1 h-full min-h-0"
      >
        <TabsList class="z-10 bg-white">
          <TabsTrigger v-for="(tab, index) in manyTabs" :key="tab" :index="index" :disabled="index == 2">
            {{ tab }}
          </TabsTrigger>
        </TabsList>

        <!-- Content Wrapper for Independent Scrolling -->
        <!-- Use height: 100% inside flex container for MP scrolling -->
        <scroll-view
          scroll-y scroll-with-animation :scroll-into-view="currentScrollToId"
          class="
            relative h-full min-h-0 flex-1 bg-gray-50
            dark:bg-gray-900/50
          "
        >
          <TabsContent
            v-for="(tab, index) in manyTabs" :id="`${rootId}-content-${index}`" :key="tab"
            :index="index"
          >
            <view class="min-h-[500px] p-6">
              <view class="text-lg font-medium">
                {{ tab }} Content
              </view>
              <view class="mt-2 text-gray-500">
                Currently showing content for {{ tab }}.
                {{ sticky ? 'Try scrolling down!' : '' }}
              </view>
            </view>
          </TabsContent>
        </scroll-view>
      </TabsRoot>
    </view>

    <!-- <view
            class="h-[500px] min-w-0 overflow-hidden bg-white rounded-lg flex flex-col border border-gray-200 dark:border-gray-800 shadow-sm">
            <view class="p-4 flex-none border-b border-gray-100 dark:border-gray-800" v-if="sticky">
                <view class="text-sm text-gray-500">Scroll down to see sticky header behavior.</view>
            </view>

            <TabsRootCopy v-model:active="activeIndex" :type="type" :variant="variant" size="md"
                :orientation="orientation" :sticky="false" :shrink="shrink" :scrollspy="scrollspy"
                :swipeable="swipeable" :activationMode="activationMode" :ignore-page-scroll="true"
                custom-class="flex-1 h-full min-h-0" v-slot="{ currentScrollToId }">
                <TabsListCopy custom-class="bg-white z-10">
                    <TabsTriggerCopy v-for="(tab, index) in manyTabs" :key="tab" :index="index">
                        {{ tab }}
                    </TabsTriggerCopy>
                </TabsListCopy>

                <scroll-view scroll-y scroll-with-animation :scroll-into-view="currentScrollToId"
                    class="flex-1 h-full min-h-0 relative bg-gray-50 dark:bg-gray-900/50">
                    <TabsContentCopy v-for="(tab, index) in manyTabs" :key="tab" :index="index">
                        <view class="min-h-[500px] p-6">
                            <view class="text-lg font-medium">{{ tab }} Content</view>
                            <view class="text-gray-500 mt-2">
                                Currently showing content for {{ tab }}.
                                {{ sticky ? 'Try scrolling down!' : '' }}
                            </view>
                        </view>
                    </TabsContentCopy>
                </scroll-view>
            </TabsRootCopy>
        </view> -->
  </RebornPage>
</template>
