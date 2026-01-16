<script setup lang="ts">
const colors = [
    { name: 'Red', variable: '--color-red-6', bgClass: 'bg-[#ff3d58]' },
    { name: 'Orange', variable: '--color-orange-6', bgClass: 'bg-[#ff9711]' },
    { name: 'Green', variable: '--color-green-6', bgClass: 'bg-[#16ae88]' },
    { name: 'Blue', variable: '--color-blue-6', bgClass: 'bg-[#0d99e5]' },
];

const primaryColorVar = useCookie('primary-color-var', { default: () => '--color-red-6' });

const updateTheme = (variable: string) => {
    if (import.meta.client) {
        document.documentElement.style.setProperty('--color-primary', `var(${variable})`);
        primaryColorVar.value = variable;
    }
};

onMounted(() => {
    updateTheme(primaryColorVar.value);
});
</script>

<template>
    <UPopover :ui="{ content: 'p-2' }">
        <template #default="{ open }">
            <UButton icon="i-lucide-palette" color="neutral" variant="ghost"
                :class="{ 'bg-neutral-100 dark:bg-neutral-800': open }" aria-label="切换主题颜色" />
        </template>

        <template #content>
            <div class="flex items-center gap-1.5">
                <button v-for="color in colors" :key="color.name" :class="[
                    'size-5 rounded-full cursor-pointer transition-transform hover:scale-110 ring-offset-2 ring-offset-white dark:ring-offset-black',
                    color.bgClass,
                    primaryColorVar === color.variable ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : ''
                ]" :title="color.name" @click="updateTheme(color.variable)" />
            </div>
        </template>
    </UPopover>
</template>
