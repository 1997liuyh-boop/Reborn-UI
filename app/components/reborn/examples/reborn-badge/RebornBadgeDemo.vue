<script setup lang="ts">
import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue"
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue"
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue"
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue"
import { badgeColors, badgeVariants, badgeSizes } from "~/components/reborn/ui/reborn-badge/reborn-badge.config"

// Options Mapping
const colorOptions = badgeColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))
const variantOptions = badgeVariants.map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }))
const sizeOptions = badgeSizes.map(s => ({ label: s.toUpperCase(), value: s }))

// Playground State
const color = ref<(typeof badgeColors)[number]>('primary')
const variant = ref<(typeof badgeVariants)[number]>('solid')
const size = ref<(typeof badgeSizes)[number]>('md')
const label = ref('乐一番')
const closable = ref(false)
const square = ref(false)

const showBadge = ref(true)
const handleClose = () => {
    console.log('Badge closed!')
}

const beforeCloseVerify = () => {
    return new Promise<boolean>((resolve) => {
        setTimeout(() => {
            resolve(window.confirm('确定要删除这个标签吗？'))
        }, 500)
    })
}
</script>

<template>
    <div class="flex flex-col gap-12 w-full pb-24">
        <!-- Header Section -->
        <div class="flex flex-col gap-3">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                Badge 徽标
                <RebornBadge size="sm" variant="soft" color="primary">Stable</RebornBadge>
            </h2>
            <p class="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                用于展示状态、数量或重要标识的微型标签。支持多种色彩、感官风格及交互状态。
            </p>
        </div>

        <section class="flex flex-col gap-6">
            <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">交互演练场</h3>
                <div class="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    &lt;RebornBadge :color="{{ color }}" :variant="{{ variant }}" ... /&gt;
                </div>
            </div>

            <div
                class="flex flex-col lg:flex-row rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
                <div
                    class="w-full lg:w-80 p-8 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-xl">
                    <div class="flex flex-col gap-6">
                        <div class="flex flex-col gap-2">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">内容文本</span>
                            <RebornInput v-model="label" placeholder="输入标签文字" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">预设色彩</span>
                            <RebornSelect v-model="color" :options="colorOptions" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">视觉风格</span>
                            <RebornSelect v-model="variant" :options="variantOptions" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">尺寸规格</span>
                            <RebornSelect v-model="size" :options="sizeOptions" />
                        </div>

                        <div class="pt-4 flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800">
                            <RebornCheckbox v-model="closable" label="是否可关闭？" />
                            <RebornCheckbox v-model="square" label="是否为正方形？" />
                            <RebornCheckbox v-model="showBadge" label="是否显示？(v-model:show)" />
                        </div>
                    </div>
                </div>

                <div class="flex-1 p-12 flex items-center justify-center min-h-[360px] overflow-hidden group">

                    <RebornBadge v-model:show="showBadge" :color="color" :variant="variant" :size="size" :label="label"
                        :closable="closable" :square="square" />
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <section
                class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/40 dark:bg-gray-900/10 backdrop-blur-sm">
                <h4 class="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">变体矩阵 (Variants Matrix)</h4>
                <div v-for="v in badgeVariants" :key="v">
                    <span class="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{{ v }}</span>
                    <div class="flex flex-wrap items-center gap-3">
                        <RebornBadge v-for="c in badgeColors" :key="c" :variant="v" :color="c" size="sm" :label="c" />
                    </div>
                </div>
            </section>

            <div class="flex flex-col gap-8">
                <section
                    class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/40 dark:bg-gray-900/10 backdrop-blur-sm">
                    <h4 class="text-sm font-bold uppercase tracking-widest text-gray-400">图标集成 (Icons)</h4>
                    <div class="flex flex-wrap items-center gap-4">
                        <RebornBadge color="primary" variant="soft" size="md">
                            <template #leading>
                                <Icon name="lucide:star" class="size-3.5 fill-current" />
                            </template>
                            Star
                        </RebornBadge>
                        <RebornBadge color="success" variant="outline" size="md">
                            <template #trailing>
                                <Icon name="lucide:check-circle" class="size-3.5" />
                            </template>
                            Completed
                        </RebornBadge>
                        <RebornBadge color="error" variant="solid" size="lg" square>
                            <template #default="{ ui }">
                                <Icon name="lucide:heart" :class="ui.label()" />
                            </template>
                        </RebornBadge>
                        <RebornBadge color="neutral" variant="subtle" size="sm">
                            <template #leading>
                                <Icon name="lucide:settings" class="size-3 animate-spin-slow" />
                            </template>
                            Settings
                        </RebornBadge>
                    </div>
                </section>

                <section
                    class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/40 dark:bg-gray-900/10 backdrop-blur-sm">
                    <h4 class="text-sm font-bold uppercase tracking-widest text-gray-400">插槽与扩展 (Slots)</h4>
                    <div class="flex flex-wrap items-center gap-4">
                        <RebornBadge color="info" variant="soft" size="md" closable @close="handleClose">
                            <template #default="{ ui }">
                                <span :class="ui.label()">可关闭标签</span>
                            </template>
                        </RebornBadge>

                        <RebornBadge color="warning" variant="subtle" size="md" closable>
                            <template #close="{ close }">
                                <span
                                    class="ms-2 px-1 text-[10px] bg-warning/20 rounded-sm hover:bg-warning/40 cursor-pointer"
                                    @click="close">
                                    HIDE
                                </span>
                            </template>
                            自定义关闭
                        </RebornBadge>

                        <RebornBadge color="success" variant="solid" size="md" closable
                            :before-close="beforeCloseVerify">
                            异步确认关闭
                        </RebornBadge>

                        <RebornBadge color="neutral" variant="outline" size="md" class="py-0 px-1">
                            <template #leading>
                                <div
                                    class="size-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                    A</div>
                            </template>
                            <span class="ms-1">Avatar Support</span>
                        </RebornBadge>

                        <RebornBadge color="neutral" variant="outline" size="md" label="新品・未开封" :closable="closable"
                            :square="square" class="pl-0" :ui="{ label: 'text-caption-lg' }">
                            <template #leading>
                                <div
                                    class="bg-gradient-to-b from-[#919191] to-[#3C3C3C] h-full text-white flex flex-col justify-center items-center px-1">
                                    <p class="text-[8px]">N</p>
                                    <span class="text-[4px]">RANK</span>
                                </div>
                            </template>
                        </RebornBadge>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-spin-slow {
    animation: spin 8s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>