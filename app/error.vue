<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
    error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })

const is404 = computed(() => props.error?.statusCode === 404)
const title = computed(() => is404.value ? 'Page not found' : 'Something went wrong')
const description = computed(() => is404.value ? 'We are sorry but this page could not be found.' : 'An unexpected error has occurred.')
</script>

<template>
    <div
        class="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
        <!-- Background effects -->
        <div class="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px]" />
        <div
            class="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        <div class="relative z-10 max-w-md w-full text-center space-y-8">
            <div class="space-y-2">
                <h1
                    class="text-8xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {{ error?.statusCode }}
                </h1>
                <h2 class="text-2xl font-semibold tracking-tight">
                    {{ title }}
                </h2>
                <p class="text-muted-foreground">
                    {{ description }}
                </p>
            </div>

            <!-- Error Details for non-404 or if needed -->
            <div v-if="error?.message"
                class="bg-muted/50 rounded-lg p-4 text-sm font-mono text-left overflow-auto max-h-48 border border-border/50">
                <p class="text-destructive font-semibold mb-2">Error Details:</p>
                <p>{{ error.message }}</p>
                <div v-if="error.stack && !is404"
                    class="mt-2 text-xs text-muted-foreground opacity-70 whitespace-pre-wrap">
                    {{ error.stack }}
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <UButton size="xl" color="primary" variant="solid" icon="i-lucide-arrow-left" @click="handleError">
                    Go Home
                </UButton>
                <UButton v-if="!is404" size="xl" color="gray" variant="outline" icon="i-lucide-refresh-cw"
                    @click="() => reloadNuxtApp()">
                    Retry
                </UButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Ensure bg-grid class works if not global, but using inline style for simplicity or assume availability */
.bg-grid-white\/\[0\.02\] {
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
</style>
