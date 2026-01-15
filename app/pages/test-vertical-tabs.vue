<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref(0)
</script>

<template>
    <div class="p-10 flex flex-col gap-10 min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <h1 class="text-2xl font-bold">Vertical Tabs Animation Test</h1>

        <div class="border rounded p-4 h-[500px] flex gap-8">
            <!-- Vertical Tabs -->
            <TabsRoot v-model:active="activeTab" orientation="vertical" :swipeable="true" class="flex gap-4 h-full">
                <TabsList class="flex flex-col gap-2 w-48 border-r pr-4">
                    <TabsTrigger v-for="i in 3" :key="i" :index="i - 1"
                        class="p-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900 transition-colors">
                        Vertical Tab {{ i }}
                    </TabsTrigger>
                </TabsList>

                <div class="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900 rounded border">
                    <TabsContent v-for="i in 3" :key="i" :index="i - 1"
                        class="h-full w-full p-6 absolute top-0 left-0 bg-white dark:bg-gray-800">
                        <h2 class="text-xl font-bold mb-4">Content {{ i }}</h2>
                        <p>This is content for tab {{ i }}.</p>
                        <p class="mt-2 text-gray-500">Try swiping UP to go to the NEXT tab, or DOWN to go to the PREV
                            tab (if implementation follows logic).</p>
                        <div
                            class="mt-8 h-48 w-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-4xl font-bold">
                            Slide {{ i }}
                        </div>
                    </TabsContent>
                </div>
            </TabsRoot>
        </div>

        <div class="mt-4">
            <p>Active Tab Index: {{ activeTab }}</p>
        </div>
    </div>
</template>
