<script setup lang="ts">
const showBadge = ref(true)

const handleClose = () => {
    alert('Badge closed!')
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- New Control Section -->
        <div class="flex items-center gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
            <span class="text-sm text-gray-500">外部控制:</span>
            <RebornButton color="warning" variant="solid" :disabled="showBadge" @click="showBadge = true"
                class="px-6 w-32">
                {{ showBadge ? '显示中' : '点击还原' }}
            </RebornButton>
        </div>

        <div class="flex flex-wrap items-center gap-2">
            <RebornBadge size="xl" color="warning" variant="solid">Default</RebornBadge>
            <RebornBadge size="lg" color="primary" variant="solid">Secondary</RebornBadge>
            <RebornBadge size="md" color="secondary" variant="solid">Destructive</RebornBadge>
            <RebornBadge size="sm" color="success" variant="solid">Outline</RebornBadge>
            <RebornBadge size="xs" color="info" variant="solid">Secondary</RebornBadge>
            <RebornBadge size="xs" color="error" variant="solid">Secondary</RebornBadge>
        </div>

        <div class="flex flex-wrap items-center gap-2">
            <!-- Bind show state -->
            <RebornBadge v-model:show="showBadge" label="Closable (v-model)" closable @close="handleClose" />

            <!-- Others -->
            <RebornBadge color="success" variant="soft" label="Custom Icon" closable close-icon="i-lucide-check" />
            <RebornBadge color="error" variant="outline" label="Slot Close" closable>
                <template #close>
                    <span class="ms-1 text-[10px] opacity-50 hover:opacity-100 cursor-pointer">X</span>
                </template>
            </RebornBadge>
        </div>
    </div>
</template>