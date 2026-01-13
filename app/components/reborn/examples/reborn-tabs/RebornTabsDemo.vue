<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "~/components/reborn/ui/reborn-tabs"
import { tabsVariants, tabsSizes, tabsOrientations } from "~/components/reborn/ui/reborn-tabs/reborn-tabs.config"
import type { TabsProps } from "~/components/reborn/ui/reborn-tabs/TabsRoot.vue"

const variants = ref([...tabsVariants])
const variant = ref<TabsProps["variant"]>('line')
const sizes = ref([...tabsSizes])
const size = ref<TabsProps["size"]>('md')
const orientations = ref([...tabsOrientations])
const orientation = ref<TabsProps["orientation"]>('horizontal')

const sticky = ref(false)
const shrink = ref(false)
const shrinkDir = ref<TabsProps['shrinkDir']>('start')
const activationMode = ref<TabsProps['activationMode']>('automatic')

const modelValue = ref('account')
const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab ${i + 1}`)
const manyTabsValue = ref('Tab 1')
const customIndicatorValue = ref('home')

function onTabClick(val: string | number, e: MouseEvent) {
    console.log('Tab Clicked:', val, e)
    // Minimal toast or log effect
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex gap-2">
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
            </div>

            <div class="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block"></div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500">Value: {{ modelValue }}</span>
            </div>
        </div>

        <!-- Scrollable/Sticky Example Area -->
        <div class="h-[400px] max-w-3xl mx-auto  min-w-0 overflow-hidden bg-white rounded-lg">
            <div class="h-full w-full min-w-0 flex flex-col">
                <div class="p-4" v-if="sticky">
                    <p class="mb-4 text-sm text-gray-500">Scroll down to see sticky header behavior.</p>
                    <div class="h-12"></div>
                </div>

                <TabsRoot v-model="manyTabsValue" :variant="variant" :size="size" :orientation="orientation"
                    :sticky="sticky" :shrink="shrink" :shrinkDir="shrinkDir" :activationMode="activationMode"
                    @click-tab="onTabClick">
                    <TabsList>
                        <TabsTrigger v-for="tab in manyTabs" :key="tab" :value="tab">
                            {{ tab }}
                        </TabsTrigger>
                    </TabsList>

                    <!-- Wrapper styles should be handled by component config now -->
                    <TabsContent v-for="tab in manyTabs" :key="tab" :value="tab">
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
                <TabsRoot v-model="customIndicatorValue" variant="line">
                    <TabsList>
                        <TabsTrigger value="home">首页</TabsTrigger>
                        <TabsTrigger value="products">产品</TabsTrigger>
                        <TabsTrigger value="about">关于</TabsTrigger>

                        <!-- Custom indicator slot -->
                        <template #indicator="{ style }">
                            <span :style="style"
                                class="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 -translate-y-1"
                                style="width: var(--radix-tabs-indicator-width); transform: translateX(var(--radix-tabs-indicator-position)) translateY(-4px);"
                                aria-hidden="true"></span>
                        </template>
                    </TabsList>

                    <TabsContent value="home">
                        <div class="p-4">首页内容</div>
                    </TabsContent>
                    <TabsContent value="products">
                        <div class="p-4">产品列表</div>
                    </TabsContent>
                    <TabsContent value="about">
                        <div class="p-4">关于我们</div>
                    </TabsContent>
                </TabsRoot>
            </div>
        </div>

        <!-- Standard Preview -->
        <!-- <div class="flex flex-col gap-4 border rounded-lg min-h-[300px] dark:border-gray-800">
            <TabsRoot v-model="modelValue" :variant="variant" :size="size" :orientation="orientation" :shrink="shrink">
                <TabsList>
                    <TabsTrigger value="account" @click="onTabClick('account', $event)">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="billing" disabled>Billing</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <div class="p-4 border rounded-md mt-2">Account Info</div>
                </TabsContent>
                <TabsContent value="password">
                    <div class="p-4 border rounded-md mt-2">Change Password</div>
                </TabsContent>
                <TabsContent value="settings">
                    <div class="p-4 border rounded-md mt-2">User Settings</div>
                </TabsContent>
                <TabsContent value="billing">
                    <div class="p-4 border rounded-md mt-2">Billing Details</div>
                </TabsContent>
            </TabsRoot>
        </div> -->
    </div>
</template>
