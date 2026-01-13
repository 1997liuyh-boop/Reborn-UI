<script setup lang="ts">
import { inject, computed } from 'vue'

const props = defineProps<{
    value: string | number
    class?: any
}>()

const context = inject('TabsContext') as any

const isActive = computed(() => context.modelValue.value === props.value)
</script>

<template>
    <div v-if="isActive" role="tabpanel" :data-state="isActive ? 'active' : 'inactive'"
        :class="context.ui.value.content({ class: props.class })">
        <slot></slot>
    </div>
</template>
