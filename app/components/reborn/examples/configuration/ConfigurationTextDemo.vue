<script setup lang="ts">
const scale = [
  { cls: "text-sm", size: "12px", leading: "20px", rule: "辅助文字 / size=sm" },
  { cls: "text-base", size: "14px", leading: "22px", rule: "正文 · 默认 / size=default" },
  { cls: "text-lg", size: "16px", leading: "24px", rule: "标题（主）/ size=lg" },
  { cls: "text-xl", size: "20px", leading: "28px", rule: "标题（大）" },
  { cls: "text-2xl", size: "24px", leading: "32px", rule: "标题（特大）" },
  { cls: "text-3xl", size: "30px", leading: "38px", rule: "展示级标题" },
  { cls: "text-4xl", size: "38px", leading: "46px", rule: "展示级标题（大）" },
];
</script>

<template>
    <ComponentPlayground>
        <template #component>
            <div class="grid grid-cols-[110px_130px_180px_1fr] gap-y-4 items-center w-full">
                <!-- Header -->
                <div class="font-medium text-muted-foreground text-sm">类名</div>
                <div class="font-medium text-muted-foreground text-sm">字号 / 行高</div>
                <div class="font-medium text-muted-foreground text-sm">应用规则</div>
                <div class="font-medium text-muted-foreground text-sm">举例</div>

                <template v-for="item in scale" :key="item.cls">
                    <div class="text-sm">{{ item.cls }}</div>
                    <div class="text-sm text-muted-foreground">{{ item.size }} / {{ item.leading }}</div>
                    <div class="text-sm text-muted-foreground">{{ item.rule }}</div>
                    <div class="truncate"><span :class="item.cls">Font 乐淘一番切煤神器</span></div>
                </template>
            </div>
        </template>
    </ComponentPlayground>
</template>
