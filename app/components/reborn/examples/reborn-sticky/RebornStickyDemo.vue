<template>
    <div class="space-y-4">
        <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h2 class="text-xl font-bold mb-4">Sticky 吸顶 Demo</h2>
            <p class="text-gray-500 mb-8">
                该组件与CSS中position: sticky属性实现的效果一致，当组件达到预设的到顶部距离时， 就会固定在指定位置。
            </p>

            <div class="space-y-4">
                <RebornSticky>
                    <div class="bg-primary p-3 h-[40px] text-white flex flex-row items-center rounded shadow-sm">
                        Header - Default (Offset 0)
                    </div>
                </RebornSticky>

                <div v-for="item in 10" :key="`a-${item}`"
                    class="p-3 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded shadow-sm">
                    Item A - {{ item }}
                </div>

                <RebornSticky :offset-top="40">
                    <div class="bg-amber-500 p-3 h-[40px] text-white flex flex-row items-center rounded shadow-sm">
                        Header - Offset 40px
                    </div>
                </RebornSticky>

                <div v-for="item in 10" :key="`b-${item}`"
                    class="p-3 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded shadow-sm">
                    Item B - {{ item }}
                </div>

                <RebornSticky :offset-top="80">
                    <div class="bg-green-500 p-3 h-[40px] text-white flex flex-row items-center rounded shadow-sm">
                        Header - Offset 80px
                    </div>
                </RebornSticky>

                <div v-for="item in 30" :key="`c-${item}`"
                    class="p-3 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded shadow-sm">
                    Item C - {{ item }}
                </div>
            </div>
        </div>

        <RebornBackTop />
    </div>
</template>

<script setup lang="ts">
import RebornSticky from "~/components/reborn/ui/reborn-sticky/RebornSticky.vue"
import RebornBackTop from "~/components/reborn/ui/reborn-back-top/RebornBackTop.vue"
</script>
