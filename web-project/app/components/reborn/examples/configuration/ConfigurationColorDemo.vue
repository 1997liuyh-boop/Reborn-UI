<script setup lang="ts">
const colorFamilies = ['red', 'orange', 'green', 'blue'] as const
const colorMap: Record<(typeof colorFamilies)[number], { hex: string, variable: string, text?: string }[]> = {
    red: [
        { hex: '#660821', variable: 'bg-red-10' },
        { hex: '#8C0D2A', variable: 'bg-red-9' },
        { hex: '#B31938', variable: 'bg-red-8' },
        { hex: '#D92946', variable: 'bg-red-7' },
        { hex: '#FF3D58', variable: 'bg-red-6', text: '主色' },
        { hex: '#FF6675', variable: 'bg-red-5' },
        { hex: '#FF8B9B', variable: 'bg-red-4' },
        { hex: '#FFB1BC', variable: 'bg-red-3', text: '标签边框' },
        { hex: '#FFE0E4', variable: 'bg-red-2', text: '通知横幅' },
        { hex: '#FFEBEE', variable: 'bg-red-1', text: '标签底色' },
    ],
    orange: [
        { hex: '#522601', variable: 'bg-orange-10' },
        { hex: '#733D0E', variable: 'bg-orange-9' },
        { hex: '#995C1A', variable: 'bg-orange-8' },
        { hex: '#BF7C2A', variable: 'bg-orange-7', text: '会员字色' },
        { hex: '#FF9711', variable: 'bg-orange-6', text: '主色' },
        { hex: '#FFB03B', variable: 'bg-orange-5' },
        { hex: '#FFC370', variable: 'bg-orange-4' },
        { hex: '#FFD5A0', variable: 'bg-orange-3', text: '标签边框' },
        { hex: '#FFE9C9', variable: 'bg-orange-2', text: '会员券底色' },
        { hex: '#FFF6E7', variable: 'bg-orange-1', text: '标签底色' },
    ],
    green: [
        { hex: '#001412', variable: 'bg-green-10' },
        { hex: '#003B32', variable: 'bg-green-9' },
        { hex: '#036150', variable: 'bg-green-8' },
        { hex: '#0B876C', variable: 'bg-green-7' },
        { hex: '#16AE88', variable: 'bg-green-6', text: '主色' },
        { hex: '#3AC29E', variable: 'bg-green-5' },
        { hex: '#5FCFAD', variable: 'bg-green-4' },
        { hex: '#A2DFCF', variable: 'bg-green-3', text: '标签边框' },
        { hex: '#E7F6F3', variable: 'bg-green-2' },
        { hex: '#F1FAF8', variable: 'bg-green-1', text: '标签底色' },
    ],
    blue: [
        { hex: '#00284D', variable: 'bg-blue-10' },
        { hex: '#003F73', variable: 'bg-blue-9' },
        { hex: '#005999', variable: 'bg-blue-8' },
        { hex: '#0277BF', variable: 'bg-blue-7' },
        { hex: '#0D99E5', variable: 'bg-blue-6', text: '主色' },
        { hex: '#35B6F2', variable: 'bg-blue-5' },
        { hex: '#61CCFF', variable: 'bg-blue-4' },
        { hex: '#9ED6F5', variable: 'bg-blue-3', text: '标签边框' },
        { hex: '#DFF4FF', variable: 'bg-blue-2' },
        { hex: '#ECF9FF', variable: 'bg-blue-1', text: '标签底色' },
    ],
}
const gray = [
    { hex: '#333333', variable: 'bg-gray-8' },
    { hex: '#666666', variable: 'bg-gray-7' },
    { hex: '#999999', variable: 'bg-gray-6' },
    { hex: '#AAAAAA', variable: 'bg-gray-5' },
    { hex: '#CCCCCC', variable: 'bg-gray-4' },
    { hex: '#EEEEEE', variable: 'bg-gray-3' },
    { hex: '#F5F5F5', variable: 'bg-gray-2' },
    { hex: '#FFFFFF', variable: 'bg-gray-1' },
]
const colorLabelMap: Record<(typeof colorFamilies)[number], string> = {
    red: '品牌色',
    orange: '辅助色',
    green: '',
    blue: '',
}
</script>

<template>
    <div class="space-y-4">
        <div class="text-sm">
            <b>基础色板：</b>共计40个颜色，包含1种品牌色和3种辅助色及其对应的衍生色，每个颜色分为10个梯度；6号色作为色板中的主色；其他为衍生色。这些颜色基本可以
            满足乐淘一番设计中对于颜色的需求。
        </div>

        <div class="space-y-4">
            <div v-for="(children, family) in colorMap" :key="family">
                <div class="flex-1 min-h-1 text-xs mb-2">
                    {{ colorLabelMap[family] }}
                </div>
                <div class="grid grid-cols-10">
                    <UPopover v-for="(item, index) in children" :key="item.variable" mode="hover">
                        <div
                            :class="['w-full h-20 first:rounded-l-md last:rounded-r-md shadow-sm transition-transform hover:scale-105 text-[10px] flex flex-col justify-between py-2 items-center', item.variable, index < 5 ? 'text-white/70' : 'text-black/60']">
                            <div>
                                {{ item.variable }}
                            </div>
                            <div :style="{ color: index >= 5 ? children[0]?.hex : children[children.length - 1]?.hex }">
                                {{ item.text }}
                            </div>
                            <div>
                                {{ item.hex }}
                            </div>
                        </div>
                        <template #content>
                            <div class="flex flex-col gap-1 p-2">
                                <span class="font-medium text-xs"></span>
                                <span class="font-mono text-xs text-muted-foreground">{{ item.hex }}</span>
                            </div>
                        </template>
                    </UPopover>
                </div>
            </div>
        </div>
        <div class="text-sm">
            <b>中性色：</b>中性色包含了黑、白、灰，共计8个颜色。在乐淘一番的设计中被大量使用到，合理地选择中性色能够令页面信息具备良好的主次关系，助力阅读体验。
        </div>

        <div class="grid grid-cols-8">
            <UPopover v-for="(item, index) in gray" :key="item.variable" mode="hover">
                <div
                    :class="['w-full h-20 first:rounded-l-md last:rounded-r-md shadow-sm transition-transform hover:scale-105 text-[10px] flex justify-center items-center', item.variable]">

                </div>
                <template #content>
                    <div class="flex flex-col gap-1 p-2">
                        <span class="font-medium text-xs"></span>
                        <span class="font-mono text-xs text-muted-foreground">{{ item.hex }}</span>
                    </div>
                </template>
            </UPopover>
        </div>
    </div>
</template>