<script setup lang="ts">
const appConfig = useAppConfig()
</script>

<template>
    <div v-if="appConfig.toc?.bottom?.links?.length" class="hidden lg:block mt-8 space-y-8">
        <!-- 分割线 -->
        <USeparator type="dashed" class="opacity-50" />

        <!-- 社区版块容器 -->
        <div class="space-y-4">
            <!-- 社区标题 -->
            <div v-if="appConfig.toc?.bottom?.title"
                class="flex items-center gap-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <Icon name="lucide:sparkles" class="size-3 text-primary animate-pulse" />
                <span>{{ appConfig.toc.bottom.title }}</span>
            </div>

            <!-- 社区链接列表 -->
            <div class="grid gap-1.5" v-if="appConfig.toc?.bottom?.links">
                <NuxtLink v-for="link in appConfig.toc.bottom.links" :key="link.to" :to="link.to" :target="link.target"
                    class="group flex items-center gap-3 rounded-2xl p-2 transition-all hover:bg-white dark:hover:bg-gray-900 hover:shadow-2xl hover:shadow-primary/5 ring-1 ring-transparent hover:ring-gray-100 dark:hover:ring-gray-800">
                    <!-- 图标容器 -->
                    <div
                        class="flex size-9 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/50 transition-all group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-6 shadow-sm">
                        <Icon :name="link.icon" class="size-4.5" />
                    </div>

                    <!-- 链接文本 -->
                    <span
                        class="text-[13px] font-bold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">
                        {{ link.label }}
                    </span>

                    <!-- 交互箭头 -->
                    <div
                        class="ml-auto opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                        <Icon name="lucide:arrow-right" class="size-3.5 text-primary" />
                    </div>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>
