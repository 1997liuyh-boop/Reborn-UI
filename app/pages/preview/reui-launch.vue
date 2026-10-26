<script setup lang="ts">
import { shallowRef } from "vue";
import ReuiLaunchDoodle from "~/components/reborn/ui/reui-launch/ReuiLaunchDoodle.vue";

definePageMeta({ layout: false, header: false, footer: false });
useSeoMeta({ title: "REUI Launch · 动画预览", robots: "noindex, nofollow" });

const expanded = shallowRef(false);
const cardSize = shallowRef(false);
const replayKey = shallowRef(0);
const text = shallowRef("REUI");
const screenText = shallowRef("RE");

function replay() {
  expanded.value = false;
  replayKey.value += 1;
}
</script>

<template>
  <main class="min-h-dvh bg-[#181916] px-5 py-8 font-sans text-[#d9dccf] sm:px-10 sm:py-12">
    <div class="mx-auto max-w-5xl">
      <header class="flex items-start justify-between gap-6 border-b border-[#d9dccf]/15 pb-6">
        <div>
          <p class="font-mono text-sm tracking-[0.16em] text-[#979b8e]">REUI / MOTION STUDY</p>
          <h1 class="mt-3 text-2xl font-medium sm:text-3xl">让灵感，从这里启动。</h1>
        </div>
        <span
          class="shrink-0 rounded-full border border-[#d9dccf]/20 px-3 py-1 font-mono text-sm text-[#aeb3a4]"
        >独立预览</span>
      </header>

      <section
        aria-label="REUI Launch 动画预览"
        class="py-10 sm:py-14"
      >
        <div
          :class="cardSize ? 'max-w-[410px]' : 'max-w-[820px]'"
          class="mx-auto w-full"
        >
          <ReuiLaunchDoodle
            :key="replayKey"
            :expanded="expanded"
            :text="text"
            :screen-text="screenText"
            class="ring-1 ring-[#d9dccf]/15"
          />
          <div class="mt-5 flex items-baseline justify-between gap-4">
            <h2 class="text-lg font-semibold">REUI Launch</h2>
            <span class="font-mono text-sm text-[#989e8d]">RE / UI</span>
          </div>
          <p class="mt-1 text-base text-[#a0a596]">
            移入展开，移出收起。点击可固定画面，手机上轻点切换。
          </p>
          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-2 text-base text-[#a0a596]">
              外侧文字
              <input v-model="text" class="w-full rounded-lg border border-[#d9dccf]/25 bg-transparent px-3 py-2 text-[#d9dccf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9dccf]">
            </label>
            <label class="flex flex-col gap-2 text-base text-[#a0a596]">
              屏幕文字
              <input v-model="screenText" class="w-full rounded-lg border border-[#d9dccf]/25 bg-transparent px-3 py-2 text-[#d9dccf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9dccf]">
            </label>
          </div>
        </div>
      </section>

      <footer
        class="flex flex-wrap items-center justify-between gap-5 border-t border-[#d9dccf]/15 pt-6"
      >
        <p class="text-sm text-[#959b8c]">复古电脑 · 像素屏幕 · 从一个想法展开</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            :aria-pressed="cardSize"
            class="rounded-lg border border-[#d9dccf]/25 px-4 py-2 text-base hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d9dccf]"
            @click="cardSize = !cardSize"
          >
            {{ cardSize ? "放大查看" : "卡片尺寸" }}
          </button>
          <button
            type="button"
            :aria-pressed="expanded"
            class="rounded-lg border border-[#d9dccf]/25 px-4 py-2 text-base hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d9dccf]"
            @click="expanded = !expanded"
          >
            {{ expanded ? "恢复交互" : "保持展开" }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-[#d9dccf] px-4 py-2 text-base font-medium text-[#181916] hover:bg-[#eef0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d9dccf]"
            @click="replay"
          >
            重置动画
          </button>
        </div>
      </footer>
    </div>
  </main>
</template>
