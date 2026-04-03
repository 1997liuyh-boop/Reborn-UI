<script setup lang="ts">
import { ref } from "vue";
import RebornCoupon from "~/components/reborn/ui/reborn-coupon/RebornCoupon.vue";

// 1. 统一状态对象
const state = ref<Record<string, any>>({
    type: "perforated",
    width: 904,
    height: 124,
    radius: 12,
    direction: "vertical",
    position: "start",
    offset: 120,
    corner: 20,
    gap: 2,
    split: "dotted",
    size: 2,
    background: "linear-gradient(135deg, #ff7e5f, #feb47b)",
    hoverable: true
});

// 2. 控制面板配置
const controls = [
    {
        title: "基础配置",
        children: [
            {
                label: "组件类型",
                key: "type",
                component: "select" as const,
                defaultValue: "perforated",
                props: {
                    options: [
                        { label: "缺口 (Notch)", value: "notch" },
                        { label: "票据 (Ticket)", value: "ticket" },
                        { label: "邮票 (Stamp)", value: "stamp" },
                        { label: "虚线 (Perforated)", value: "perforated" },
                        { label: "组合 (Combined)", value: "combined" },
                    ],
                },
            },
            {
                label: "背景样式",
                key: "background",
                component: "select" as const,
                defaultValue: "linear-gradient(135deg, #ff7e5f, #feb47b)",
                props: {
                    options: [
                        { label: "落日余晖 (Amber)", value: "linear-gradient(135deg, #ff7e5f, #feb47b)" },
                        { label: "极光森林 (Green)", value: "linear-gradient(135deg, #43e97b, #38f9d7)" },
                        { label: "深邃海洋 (Blue)", value: "linear-gradient(135deg, #4facfe, #00f2fe)" },
                        { label: "优雅紫罗兰 (Purple)", value: "linear-gradient(135deg, #667eea, #764ba2)" },
                        { label: "暗黑之刃 (Dark)", value: "linear-gradient(135deg, #232526, #414345)" },
                        { label: "极简白 (White)", value: "#f8fafc" },
                    ],
                },
            },
            {
                label: "宽度",
                key: "width",
                component: "slider" as const,
                defaultValue: 904,
                props: {
                    min: 100,
                    max: 1200,
                    step: 1,
                }
            },
            {
                label: "高度",
                key: "height",
                component: "slider" as const,
                defaultValue: 124,
                props: {
                    min: 100,
                    max: 1200,
                    step: 1,
                }
            },
        ],
    },
    {
        title: "布局与对齐",
        children: [
            {
                label: "布局方向",
                key: "direction",
                component: "select" as const,
                defaultValue: "horizontal",
                props: {
                    options: [
                        { label: "水平 (Horizontal)", value: "horizontal" },
                        { label: "垂直 (Vertical)", value: "vertical" },
                    ],
                },
            },
            {
                label: "位置策略",
                key: "position",
                component: "select" as const,
                defaultValue: "start",
                props: {
                    options: [
                        { label: "顶端/左侧 (Start)", value: "start" },
                        { label: "居中 (Center)", value: "center" },
                        { label: "底部/右侧 (End)", value: "end" },
                    ],
                },
            },
            {
                label: "对齐偏移 (px)",
                key: "offset",
                component: "slider" as const,
                defaultValue: 120,
                props: { min: 0, max: 600 },
            },
        ],
    },
    {
        title: "装饰细节",
        children: [
            {
                label: "缺口半径 (px)",
                key: "radius",
                component: "slider" as const,
                defaultValue: 12,
                props: { min: 0, max: 30 },
            },
            {
                label: "切角大小 (px)",
                key: "corner",
                component: "slider" as const,
                defaultValue: 20,
                props: { min: 0, max: 100 },
            },
            {
                label: "间距/密度 (px)",
                key: "gap",
                component: "slider" as const,
                defaultValue: 4,
                props: { min: 2, max: 60 },
            },
            {
                label: "虚线/孔径 (px)",
                key: "size",
                component: "slider" as const,
                defaultValue: 2,
                props: { min: 1, max: 20 },
            },
            {
                label: "虚线类型",
                key: "split",
                component: "select" as const,
                defaultValue: "dotted",
                props: {
                    options: [
                        { label: "点状 (Dotted)", value: "dotted" },
                        { label: "缝纫线 (Dashed)", value: "dashed" },
                    ],
                },
            },
        ],
    },
];

const typeCards = [
    { icon: "lucide:qr-code", label: "缺口", value: "notch", desc: "经典圆弧缺口" },
    { icon: "lucide:ticket", label: "票据", value: "ticket", desc: "四个切角效果" },
    { icon: "lucide:stamp", label: "邮票", value: "stamp", desc: "锯齿边缘纹理" },
    { icon: "lucide:scissors", label: "虚线", value: "perforated", desc: "可裁剪穿孔效果" },
    { icon: "lucide:layers", label: "组合", value: "combined", desc: "多种效果混合" },
];

const presetShowcases = [
    {
        title: "新人欢迎券",
        color: "linear-gradient(135deg, #FF3D71, #FF9B9B)",
        type: "notch",
        amount: "¥50",
        desc: "满 200 可用",
        tags: ["限时", "新人"],
    },
    {
        title: "SVIP 会员专享",
        color: "linear-gradient(135deg, #232526, #414345)",
        type: "stamp",
        amount: "¥200",
        desc: "全场通用",
        tags: ["尊享"],
    },
    {
        title: "限时秒杀",
        color: "linear-gradient(135deg, #00B0FF, #00E5FF)",
        type: "perforated",
        amount: "8.5折",
        desc: "仅限精选商品",
        tags: ["秒杀"],
    },
] as const;
</script>

<template>
    <div class="space-y-16">
        <!-- Playground -->
        <Playground v-model="state" :controls="controls" component-name="RebornCoupon" title="参数实验室"
            description="调节实时交互参数，探索每一个形态的视觉可能性">
            <RebornCoupon v-bind="state" class="transition duration-300 shadow-2xl"
                :style="{ background: state.background, color: state.background === '#f8fafc' ? '#1e293b' : 'white' }">
                <template #left>
                    <div class="flex flex-col items-center justify-center h-full">
                        <span class="text-4xl font-extrabold tracking-tighter">¥100</span>
                        <span class="text-caption-sm font-bold uppercase tracking-wider opacity-70">满 ¥1000 可用</span>
                    </div>
                </template>
                <template #right>
                    <div class="flex flex-col justify-center py-2 px-6 h-full">
                        <div class="flex flex-wrap gap-2">
                            <span
                                class="rounded bg-white/20 px-2 py-0.5 text-caption-sm font-bold tracking-wider">NEW</span>
                            <span
                                class="rounded bg-white/20 px-2 py-0.5 text-caption-sm font-bold tracking-wider">新人专享</span>
                        </div>
                        <div>
                            <h3 class="text-xl font-black">全球时尚购物周礼券</h3>
                            <p class="text-xs opacity-80 font-medium">全平台自营品类通用 • 不可包含电子产品</p>
                        </div>
                        <div class="mt-2 flex items-center justify-between">
                            <span class="text-caption-sm font-medium opacity-60">有效期至: 2026.12.31</span>
                            <button
                                class="rounded-full bg-white px-5 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                                :style="{ color: state.background.includes('linear') ? '#FF7E5F' : 'inherit' }">
                                立即领取
                            </button>
                        </div>
                    </div>
                </template>
            </RebornCoupon>
        </Playground>

    </div>
</template>
