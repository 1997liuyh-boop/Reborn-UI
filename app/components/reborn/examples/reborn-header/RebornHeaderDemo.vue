<script setup lang="ts">
import RebornHeader from '~/components/reborn/ui/reborn-header/RebornHeader.vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornSwitch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue';
import { ref } from 'vue';

const links = [
    { label: '入门指南', to: '#' },
    { label: '组件列表', to: '#' },
    { label: '设计规范', to: '#' },
    { label: 'GitHub', to: 'https://github.com/1997liuyh-boop/Reborn-UI' },
];

const toggleSide = ref<'left' | 'right'>('right');
const sticky = ref(true);
</script>

<template>
    <div
        class="min-h-[200vh] bg-gray-50 dark:bg-gray-950 font-sans rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 relative">
        <RebornHeader :title="'Reborn UI'" :to="'/'" :toggle-side="toggleSide" :sticky="sticky" class="absolute!">
            <!-- Desktop Navigation -->
            <nav class="flex items-center gap-8">
                <NuxtLink v-for="link in links" :key="link.label" :to="link.to"
                    class="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {{ link.label }}
                    <Icon v-if="link.label === 'GitHub'" name="lucide:external-link"
                        class="size-3 inline ml-1 opacity-50" />
                </NuxtLink>
            </nav>

            <template #right>
                <div class="flex items-center gap-2">
                    <RebornButton size="sm" color="success" variant="subtle" circle>
                        <Icon name="lucide:search" />
                    </RebornButton>
                    <RebornButton size="sm" color="secondary" variant="subtle" circle>
                        <Icon name="lucide:moon" />
                    </RebornButton>
                    <RebornButton size="sm" class="hidden sm:flex">立即体验</RebornButton>
                </div>
            </template>

            <!-- Mobile Menu Content -->
            <template #content="{ close }">
                <div class="flex flex-col gap-4">
                    <div class="px-2 py-4 border-b border-gray-100 dark:border-gray-800">
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">导航页面</p>
                        <nav class="mt-4 flex flex-col gap-1">
                            <NuxtLink v-for="link in links" :key="link.label" :to="link.to"
                                class="px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                @click="close">
                                {{ link.label }}
                            </NuxtLink>
                        </nav>
                    </div>

                    <div class="px-2">
                        <RebornButton block @click="close">登录账户</RebornButton>
                    </div>
                </div>
            </template>
        </RebornHeader>

        <!-- Demo Content -->
        <main class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div class="text-center">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                    Reborn Header Demo
                </h1>
                <p class="mt-4 text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                    这是一个示例页面，展示了 RebornHeader 的响应式布局、各种插槽用法以及移动端侧边栏。
                </p>

                <div class="mt-8 flex flex-wrap justify-center gap-4">
                    <div
                        class="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <p class="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">侧边栏位置</p>
                        <RebornSwitch v-model="toggleSide" active-value="left" inactive-value="right"
                            active-label="Left" inactive-label="Right" />
                    </div>

                    <div
                        class="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <p class="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">吸顶状态</p>
                        <RebornSwitch v-model="sticky" :active-label="sticky ? '吸顶中' : '不吸顶'" />
                    </div>
                </div>
            </div>

            <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div v-for="i in 6" :key="i"
                    class="h-48 bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm" />
            </div>
        </main>
    </div>
</template>
