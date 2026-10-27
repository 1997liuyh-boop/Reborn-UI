<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection } from "#components";
import { shallowRef, useTemplateRef } from "vue";
import RebornSticky from "~/components/reborn/ui/reborn-sticky/RebornSticky.vue";

/** 吸顶演示需要一段可滚动内容，列表本身无背景，靠分隔线区分条目 */
const listA = Array.from({ length: 8 }, (_, i) => i + 1);
const listB = Array.from({ length: 8 }, (_, i) => i + 1);
const listC = Array.from({ length: 16 }, (_, i) => i + 1);

/** 基础用法的演示区：三条吸顶条都以它为 target，滚出演示区后停靠在底部，不会一直盖在整页上 */
const basicEl = useTemplateRef<HTMLElement>("basicEl");

// ─── 限制在目标容器内 ─────────────────────────────────────────────

/** 目标父元素：直接传 DOM 元素而不是选择器，页面上同时存在多份 demo 时不会串到别的容器 */
const targetEl = useTemplateRef<HTMLElement>("targetEl");
/** 目标容器内的条目 */
const targetList = Array.from({ length: 10 }, (_, i) => i + 1);
/** 吸附状态回显：change 事件在固定与恢复文档流之间切换时派发 */
const targetSticky = shallowRef(false);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="与 CSS position: sticky 一致：组件到达预设的顶部距离后固定。下方三条吸顶条分别使用 offset 0 / 40 / 80，可叠加；三条都把 target 指向本演示区，滚出演示区后停靠在它的底部。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <!-- 演示区本体：作为三条吸顶条的 target，吸附范围不超出这里 -->
        <div ref="basicEl" class="flex w-full flex-col gap-4">
          <RebornSticky :target="basicEl ?? undefined">
            <div class="bg-primary rounded-sm flex h-10 items-center px-3 text-sm text-white">
              默认吸顶 · offset 0
            </div>
          </RebornSticky>

          <div
            v-for="item in listA"
            :key="`a-${item}`"
            class="border-default border-b py-3 last:border-b-0"
          >
            <span class="text-muted text-sm">条目 A · {{ item }}</span>
          </div>

          <RebornSticky :target="basicEl ?? undefined" :offset-top="40">
            <div class="bg-warning rounded-sm flex h-10 items-center px-3 text-sm text-white">
              吸顶 · offset 40px
            </div>
          </RebornSticky>

          <div
            v-for="item in listB"
            :key="`b-${item}`"
            class="border-default border-b py-3 last:border-b-0"
          >
            <span class="text-muted text-sm">条目 B · {{ item }}</span>
          </div>

          <RebornSticky :target="basicEl ?? undefined" :offset-top="80">
            <div class="bg-success rounded-sm flex h-10 items-center px-3 text-sm text-white">
              吸顶 · offset 80px
            </div>
          </RebornSticky>

          <div
            v-for="item in listC"
            :key="`c-${item}`"
            class="border-default border-b py-3 last:border-b-0"
          >
            <span class="text-muted text-sm">条目 C · {{ item }}</span>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="限制在目标容器内（仅 Web）">
      <template #description>
        <code>target</code>
        传 CSS 选择器或 DOM 元素后，吸附只在该容器范围内生效；页面滚动越过容器底部时，吸附条停靠在容器内侧底边，随容器一起离开视口，不会盖到容器之外的内容。
      </template>
      <DemoBlock layout="stack" tone="inset">
        <div ref="targetEl" class="border-success/60 w-full rounded-lg border border-dashed p-3">
          <RebornSticky :target="targetEl ?? undefined" @change="targetSticky = $event">
            <div class="bg-success rounded-sm flex h-10 items-center px-3 text-sm text-white">
              仅在虚线框内吸顶{{ targetSticky ? " · 已吸附" : "" }}
            </div>
          </RebornSticky>
          <div
            v-for="item in targetList"
            :key="`t-${item}`"
            class="border-default border-b py-3 last:border-b-0"
          >
            <span class="text-muted text-sm">目标容器内 · {{ item }}</span>
          </div>
        </div>
        <div class="text-dimmed flex h-40 w-full items-center justify-center text-sm">
          虚线框之外的内容：继续向下滚动，吸附条停在虚线框底部，不会跟到这里
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        虚线框就是目标父元素。不传 <code>target</code> 时没有停靠边界，吸附条一旦固定就一直跟随视口，即使它所在的区域已经滚出页面。
      </DemoNote>
    </DemoSection>
  </div>
</template>
