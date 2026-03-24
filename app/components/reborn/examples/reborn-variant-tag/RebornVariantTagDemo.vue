<script setup lang="ts">
import { ref } from "vue";
import {
  variantTagColors,
  variantTagPositions,
} from "~/components/reborn/ui/reborn-variant-tag/reborn-variant-tag.config";
import RebornVariantTag from "~/components/reborn/ui/reborn-variant-tag/RebornVariantTag.vue";

const currentColor = ref<(typeof variantTagColors)[number]>("primary");
const currentPosition = ref<(typeof variantTagPositions)[number]>("top-left");
const reverseActivity = ref(false);
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="grid gap-6 lg:grid-cols-2">
      <div
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      >
        <div class="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-slate-500">内置颜色：</span>
          <button
            v-for="item in variantTagColors"
            :key="item"
            class="rounded-full border px-3 py-1 transition"
            :class="
              currentColor === item
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 hover:border-slate-400 dark:border-slate-700'
            "
            @click="currentColor = item"
          >
            {{ item }}
          </button>
        </div>
        <div class="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-slate-500">角标位置：</span>
          <button
            v-for="item in variantTagPositions"
            :key="item"
            class="rounded-full border px-3 py-1 transition"
            :class="
              currentPosition === item
                ? 'border-sky-500 bg-sky-500 text-white'
                : 'border-slate-200 hover:border-slate-400 dark:border-slate-700'
            "
            @click="currentPosition = item"
          >
            {{ item }}
          </button>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div class="flex items-center justify-center">
            <RebornVariantTag
              variant="corner-ribbon"
              :color="currentColor"
              label="首发"
              :position="currentPosition"
            >
              <div
                class="flex h-[124px] w-[144px] items-center justify-center rounded-[18px] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
              />
            </RebornVariantTag>
          </div>
          <div class="flex items-center justify-center">
            <RebornVariantTag
              variant="promo-badge"
              :color="currentColor"
              label="限时"
              sub-label="优惠"
            />
          </div>
          <div class="flex items-center justify-center">
            <RebornVariantTag
              variant="activity-badge"
              color="info"
              label="2024/12/30"
              sub-label="发售"
              :reverse="reverseActivity"
            />
          </div>
          <div class="flex items-center justify-center">
            <RebornVariantTag
              variant="status-tag"
              color="secondary"
              label="新品 · 未开封"
              sub-label="N\nRANK"
            />
          </div>
        </div>
      </div>

      <div
        class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">折角角标</div>
            <div class="text-sm text-slate-500">支持自定义颜色、尺寸、位置与偏移。</div>
          </div>
          <button
            class="rounded-full border border-slate-200 px-3 py-1 text-sm transition hover:border-slate-400 dark:border-slate-700"
            @click="reverseActivity = !reverseActivity"
          >
            {{ reverseActivity ? "恢复顺序" : "反转活动标签" }}
          </button>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div class="flex items-center justify-center">
            <RebornVariantTag
              variant="fold-corner"
              color="info"
              label="请点击"
              position="top-left"
              width="82px"
              height="34px"
              fold-size="14px"
            >
              <div
                class="h-[80px] w-[120px] rounded-[16px] bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
              />
            </RebornVariantTag>
          </div>
          <div class="flex items-center justify-center">
            <RebornVariantTag
              variant="fold-corner"
              custom-color="#7c3aed"
              accent-color="#8b5cf6"
              label="自定义"
              position="bottom-right"
              width="84px"
              height="36px"
              fold-size="16px"
            >
              <div
                class="h-[80px] w-[120px] rounded-[16px] bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
              />
            </RebornVariantTag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
