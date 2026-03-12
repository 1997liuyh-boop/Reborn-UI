<script setup lang="ts">
import { ref } from 'vue'
import RebornColorPicker from '@/components/reborn/ui/reborn-color-picker/RebornColorPicker.vue'

const color1 = ref('#ff0000')
const color2 = ref('#00ff00')
const color3 = ref('#0000ff')
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-4">
            <h3 class="text-lg font-medium">基本使用</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4 flex gap-4">
                <RebornColorPicker v-model="color1" />
                <div class="flex items-center text-sm font-mono">{{ color1 }}</div>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">不同尺寸</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4 flex gap-4 items-center">
                <RebornColorPicker v-model="color2" size="sm" />
                <RebornColorPicker v-model="color2" size="md" />
                <RebornColorPicker v-model="color2" size="lg" />
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">禁用状态</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4 flex gap-4">
                <RebornColorPicker v-model="color3" disabled />
            </div>
        </div>
    </div>
</template>
