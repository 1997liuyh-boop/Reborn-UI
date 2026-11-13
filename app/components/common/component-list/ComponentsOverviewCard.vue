<script setup lang="ts">
/**
 * 组件总览里的组件小卡片：缩略预览 + 名称与可用端，悬停时预览铺满并泛光
 * 列表模式由父级挂 v-fly-in 入场；场景模式（scene）由父级逐帧写入位姿
 */
import type { OverviewItem } from "./types";
import type { ComponentPlatform } from "~/composables/useDocsPlatform";

interface Props {
  item: OverviewItem;
  /** 是否为场景模式 */
  scene?: boolean;
}

const { item, scene = false } = defineProps<Props>();

/** 平台徽标 */
const PLATFORM_BADGES: Record<ComponentPlatform, { label: string; text: string; color: "primary" | "success" }[]> = {
  web: [{ label: "WEB", text: "Web", color: "primary" }],
  uniapp: [{ label: "UNIAPP", text: "UniApp", color: "success" }],
  both: [
    { label: "WEB", text: "Web", color: "primary" },
    { label: "UNIAPP", text: "UniApp", color: "success" },
  ],
};

/** 信息行文字：标题已含英文名时改显分类 */
const subtitle = computed(() =>
  !!item.englishName && !item.title.toLowerCase().includes(item.englishName.toLowerCase())
    ? item.englishName
    : item.category,
);
</script>

<template>
  <!--
    入场（.fly-in）与悬停、按压的过渡合在同一条 transition 里，单写一组会顶掉另一组
    group/card 用具名分组，避免外层 group 互相影响
  -->
  <NuxtLink
    :to="item.path"
    class="overview-card group/card relative isolate flex h-full min-w-0 flex-col rounded-[14px] bg-(--ov-card) p-3
      shadow-[var(--ov-ring),0_1px_2px_rgb(8_10_16/0.04)] [--ov-preview-bottom:76px]
      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
      hover:shadow-(--ov-shadow-lift)
      motion-safe:[transition:box-shadow_0.24s_var(--ov-ease),translate_0.32s_var(--ov-ease),scale_0.6s_var(--ov-spring)]
      motion-safe:hover:-translate-y-[3px]
      motion-safe:active:scale-[0.975] motion-safe:active:duration-100 motion-safe:active:delay-0
      motion-safe:[&.fly-in:not(.is-flown)]:[transform:translate3d(0,14px,0)]
      motion-safe:[&.fly-in.is-flown]:[transition:opacity_0.9s_var(--ov-ease-expo)_var(--fly-delay,0ms),transform_0.9s_var(--ov-ease-expo)_var(--fly-delay,0ms),box-shadow_0.24s_var(--ov-ease),translate_0.32s_var(--ov-ease),scale_0.6s_var(--ov-spring)]
      motion-safe:[&.fly-in.is-flown:active]:duration-100 motion-safe:[&.fly-in.is-flown:active]:delay-0
      [&.is-scene]:will-change-[transform,opacity]"
    :class="{ 'is-scene': scene }"
  >
    <!-- 悬停泛光：底色与描边，位置取 --mx / --my -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -inset-px -z-1 hidden rounded-[inherit] opacity-0
        bg-[radial-gradient(320px_circle_at_var(--mx,50%)_var(--my,50%),color-mix(in_oklab,var(--color-primary)_6%,transparent),transparent_70%)]
        transition-opacity duration-[240ms] ease-(--ov-ease) group-hover/card:opacity-100 group-hover/card:duration-[90ms]
        motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:block"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -inset-px hidden rounded-[inherit] p-px opacity-0
        bg-[radial-gradient(180px_circle_at_var(--mx,50%)_var(--my,50%),color-mix(in_oklab,var(--color-primary)_70%,transparent),transparent_72%)]
        [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]
        transition-opacity duration-[240ms] ease-(--ov-ease) group-hover/card:opacity-100 group-hover/card:duration-[90ms]
        motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:block"
    />

    <!-- 撑出预览区高度 -->
    <div class="min-h-[168px] flex-1" />

    <!-- 标题行与信息行定高，--ov-preview-bottom（76px）据此计算 -->
    <div class="mt-3 flex h-6 min-w-0 items-center justify-between gap-2 px-1">
      <span class="truncate text-base font-medium text-gray-10">{{ item.title }}</span>
      <!-- 箭头：悬停时着主色并右上移 -->
      <UIcon
        name="i-lucide-arrow-up-right"
        class="size-4 shrink-0 text-gray-5 opacity-50 [transition:opacity_0.2s,translate_0.25s_var(--ov-ease),color_0.2s]
          group-hover/card:translate-x-[2px] group-hover/card:-translate-y-[2px] group-hover/card:text-primary group-hover/card:opacity-100
          motion-reduce:transition-none"
      />
    </div>

    <!-- 信息行：英文名或分类 + 可用端 -->
    <div class="mt-2 flex h-5 min-w-0 items-center justify-between gap-2 px-1 text-sm text-gray-6">
      <span class="truncate">{{ subtitle }}</span>
      <span class="flex shrink-0 items-center gap-2.5">
        <span v-for="badge in PLATFORM_BADGES[item.platform]" :key="badge.label" class="flex items-center gap-1 text-xs">
          <span class="size-1.5 rounded-full" :class="badge.color === 'primary' ? 'bg-primary' : 'bg-success'" />
          {{ badge.text }}
        </span>
      </span>
    </div>

    <!-- 缩略预览：悬停或聚焦时铺满整张卡片 -->
    <div
      class="overview-card-preview absolute inset-x-3 top-3 bottom-(--ov-preview-bottom) overflow-hidden rounded-[10px]
        bg-(--ov-card) bg-[linear-gradient(var(--ov-well),var(--ov-well))] shadow-[inset_0_0_0_1px_var(--ov-well-line)]
        [transition:inset_0.32s_var(--ov-ease),border-radius_0.32s_var(--ov-ease),box-shadow_0.32s_var(--ov-ease)]
        pointer-fine:group-hover/card:inset-0 pointer-fine:group-hover/card:rounded-[14px] pointer-fine:group-hover/card:shadow-none
        group-focus-visible/card:inset-0 group-focus-visible/card:rounded-[14px] group-focus-visible/card:shadow-none
        motion-reduce:transition-none [&_.overview-demo]:min-h-0"
    >
      <ComponentOverviewDemo :demo-name="item.demoName" :category="item.category" />
      <Icon
        v-if="item.badgeIcon" :name="item.badgeIcon.icon" :aria-label="item.badgeIcon.label"
        class="absolute top-2.5 right-2.5 z-10 size-6 text-red-5"
      />
    </div>
  </NuxtLink>
</template>
