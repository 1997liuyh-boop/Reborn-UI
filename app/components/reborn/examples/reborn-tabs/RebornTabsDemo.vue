<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "~/components/reborn/ui/reborn-tabs";
import { tabsTypes, tabsVariants, tabsSizes, tabsOrientations } from "~/components/reborn/ui/reborn-tabs/reborn-tabs.config";
import type { TabsProps } from "~/components/reborn/ui/reborn-tabs/TabsRoot.vue";

const types = ref([...tabsTypes]);
const type = ref<TabsProps["type"]>("line");
const variants = ref([...tabsVariants]);
const variant = ref<TabsProps["variant"]>("primary");
const sizes = ref([...tabsSizes])
const size = ref<TabsProps["size"]>('md')
const orientations = ref([...tabsOrientations])
const orientation = ref<TabsProps["orientation"]>('horizontal')

const sticky = ref(false)
const shrink = ref(false)
const swipeable = ref(false)
const activationMode = ref<TabsProps['activationMode']>('automatic')
const scrollspy = ref(false)

const activeIndex = ref(0)
const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab ${i + 1}`)
const customIndicatorIndex = ref(0)

function onTabClick(val: number, e: MouseEvent) {
    console.log('Tab Clicked:', val, e)
    // Minimal toast or log effect
}
</script>

<template>
    <div class="space-y-6">
        <div class="grid grid-cols-4 gap-2">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500">类型</span>
                <USelect v-model="type!" :items="types" class="w-32" />
            </div>

            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500">风格</span>
                <USelect v-model="variant!" :items="variants" class="w-32" />
            </div>

            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500">大小</span>
                <USelect v-model="size!" :items="sizes" class="w-24" />
            </div>

            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500">方向</span>
                <USelect v-model="orientation!" :items="orientations" class="w-32" />
            </div>

            <div class="flex items-center gap-2">
                <UCheckbox v-model="sticky" label="Sticky" />
                <UCheckbox v-model="shrink" label="Shrink" />
                <UCheckbox v-model="scrollspy" label="Scrollspy" />
                <UCheckbox v-model="swipeable" label="Swipeable" />
            </div>

            <div class="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block"></div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500">Active: {{ activeIndex }}</span>
            </div>
        </div>

        <!-- Scrollable/Sticky Example Area -->
        <div class="h-[400px] max-w-3xl mx-auto  min-w-0 overflow-hidden overflow-y-scroll bg-white rounded-lg">
            <div>
                <div class="p-4" v-if="sticky">
                    <p class="mb-4 text-sm text-gray-500">Scroll down to see sticky header behavior.</p>
                    <div class="h-12"></div>
                </div>

                <TabsRoot v-model:active="activeIndex" :type="type" :variant="variant" :size="size"
                    :orientation="orientation" :sticky="sticky" :shrink="shrink" :scrollspy="scrollspy"
                    :swipeable="swipeable" :activationMode="activationMode" @click-tab="onTabClick">
                    <TabsList class="bg-white z-1">
                        <TabsTrigger v-for="(tab, index) in manyTabs" :key="tab" :index="index">
                            {{ tab }}
                        </TabsTrigger>
                    </TabsList>

                    <!-- Wrapper styles should be handled by component config now -->
                    <TabsContent v-for="(tab, index) in manyTabs" :key="tab" :index="index">
                        <div class="min-h-[500px]">
                            <h3 class="text-lg font-medium">{{ tab }} Content</h3>
                            <p class="text-gray-500 mt-2">
                                Currently showing content for {{ tab }}.
                                {{ sticky ? 'Try scrolling down!' : '' }}
                            </p>
                        </div>
                    </TabsContent>
                </TabsRoot>
            </div>
        </div>

        <!-- Custom Indicator Demo -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">自定义指示器 Demo</h3>
            <div class="border rounded-lg dark:border-gray-800 bg-background p-4">
                <TabsRoot v-model:active="customIndicatorIndex" type="line">
                    <TabsList>
                        <TabsTrigger :index="0">首页</TabsTrigger>
                        <TabsTrigger :index="1">产品</TabsTrigger>
                        <TabsTrigger :index="2">关于</TabsTrigger>

                        <!-- Custom indicator slot -->
                        <template #indicator="{ style }">
                            <span :style="style"
                                class="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 -translate-y-1"
                                style="width: var(--radix-tabs-indicator-width); transform: translateX(var(--radix-tabs-indicator-position)) translateY(-4px);"
                                aria-hidden="true"></span>
                        </template>
                    </TabsList>

                    <TabsContent :index="0">
                        <div class="p-4">首页内容</div>
                    </TabsContent>
                    <TabsContent :index="1">
                        <div class="p-4">产品列表</div>
                    </TabsContent>
                    <TabsContent :index="2">
                        <div class="p-4">关于我们</div>
                    </TabsContent>
                </TabsRoot>
            </div>
        </div>

        <!-- Standard Preview -->
        <!-- <div class="flex flex-col gap-4 border rounded-lg min-h-[300px] dark:border-gray-800">
            <TabsRoot v-model:active="activeIndex" :type="type" :variant="variant" :size="size"
                :orientation="orientation" :shrink="shrink">
                <TabsList>
                    <TabsTrigger :index="0" @click="onTabClick(0, $event)">Account</TabsTrigger>
                    <TabsTrigger :index="1">Password</TabsTrigger>
                    <TabsTrigger :index="2">Settings</TabsTrigger>
                    <TabsTrigger :index="3" disabled>Billing</TabsTrigger>
                </TabsList>
                <TabsContent :index="0">
                    <div class="p-4 border rounded-md mt-2">Account Info</div>
                </TabsContent>
                <TabsContent :index="1">
                    <div class="p-4 border rounded-md mt-2">Change Password</div>
                </TabsContent>
                <TabsContent :index="2">
                    <div class="p-4 border rounded-md mt-2">User Settings</div>
                </TabsContent>
                <TabsContent :index="3">
                    <div class="p-4 border rounded-md mt-2">Billing Details</div>
                </TabsContent>
            </TabsRoot>
        </div> -->
    </div>
</template>
