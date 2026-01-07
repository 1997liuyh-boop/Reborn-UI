<script setup lang="ts">
const radiusList = [
    { name: '24px', variable: 'rounded-tl-ui-lg', value: '24px' },
    { name: '16px', variable: 'rounded-tl-ui-base', value: '16px' },
    { name: '12px', variable: 'rounded-tl-ui-md', value: '12px' },
    { name: '8px', variable: 'rounded-tl-ui-sm', value: '8px' },
    { name: '6px', variable: 'rounded-tl-ui-xs', value: '6px' },
    { name: '4px', variable: 'rounded-tl-ui-2xs', value: '4px' },
]
</script>

<template>
    <ComponentPlayground>
        <template #component>
            <div class="flex gap-4">
                <div
                    class="h-[220px] w-[220px] bg-red-5 rounded-ui-base flex flex-col items-center justify-between p-1 text-xs text-white">
                    <div>Border-Radius</div>
                    <div>16px（常规）</div>
                </div>
                <div class="relative h-[220px] flex-1 overflow-hidden dark:bg-zinc-950">
                    <div v-for="(radius, index) in radiusList" :key="radius.variable"
                        :class="['absolute border-l-2 border-t-2 border-gray-3', radius.variable]" :style="{
                            top: `${index * 30 + 20}px`,
                            left: `${index * 30 + 20}px`,
                            width: '100%',  // Extend to right
                            height: 'calc(100% - 20px)', // Extend down
                        }">
                        <div class="p-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {{ radius.value }}
                        </div>
                        <div
                            :class="['absolute -top-[2px] -left-[2px] w-7 h-7 border-l-2 border-t-2 border-gray-7 z-10', radius.variable]">
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </ComponentPlayground>
</template>