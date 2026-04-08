<script setup lang="ts">
import RebornMain from '../../ui/reborn-main/RebornMain.vue'
import RebornContainer from '../../ui/reborn-container/RebornContainer.vue'
</script>

<template>
    <RebornMain class="bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
        <RebornContainer class="py-12">
            <div class="flex flex-col items-center justify-center space-y-8 text-center">
                <div class="space-y-4">
                    <h2 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Reborn Main Layout
                    </h2>
                    <p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                        A premium main layout component that automatically handles minimum height based on the UI header
                        height variable.
                    </p>
                </div>

                <div class="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="i in 6" :key="i"
                        class="flex flex-col items-start p-6 space-y-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                        <div class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon name="lucide:layout" class="text-primary size-6" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Feature Item {{ i }}</h3>
                        <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
                            Experience the standard of modern web design with Reborn UI's professional layout system.
                        </p>
                    </div>
                </div>
            </div>
        </RebornContainer>
    </RebornMain>
</template>
