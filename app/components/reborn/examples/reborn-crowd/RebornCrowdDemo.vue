<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornCrowd from "~/components/reborn/ui/reborn-crowd/RebornCrowd.vue";

/** 演示素材：Open Peeps 拼成的精灵图（CC0），15 列 × 7 行，说明见 public/images/peeps/README.md */
const SHEET_SRC = "/images/peeps/open-peeps-sheet.png";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态：count 取格子总数 105，与不传 count 时的效果一致 */
const defaultState: Record<string, any> = {
  count: 105,
  duration: 14,
  height: 240,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场实例的事件回显 */
const playgroundStatus = ref("等待进入视口");

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "人群",
    children: [
      { label: "同时在场人数", key: "count", component: "slider" as const, defaultValue: 105, props: { min: 1, max: 105, step: 1 } },
      { label: "走完一趟（秒）", key: "duration", component: "slider" as const, defaultValue: 14, props: { min: 4, max: 30, step: 1 } },
    ],
  },
  {
    title: "画布",
    children: [
      { label: "画布高度（px）", key: "height", component: "slider" as const, defaultValue: 240, props: { min: 120, max: 360, step: 10 } },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const crowdCode = computed(() => {
  const s = state.value;
  return [
    "<RebornCrowd",
    `  src="${SHEET_SRC}"`,
    "  :cols=\"15\"",
    "  :rows=\"7\"",
    `  :count="${s.count}"`,
    `  :duration="${s.duration}"`,
    `  class="h-[${s.height}px] w-full"`,
    "/>",
  ].join("\n");
});

// ─── 场景演示状态 ─────────────────────────────────────────────────

/** 「加载与事件」两个实例各自的事件回显 */
const okStatus = ref("等待进入视口");
const brokenStatus = ref("等待进入视口");
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="crowdCode" component-name="RebornCrowd"
      title="交互演练场" description="调节左侧参数，查看人群密度、行走速度与画布高度对人物大小的影响。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col gap-4">
        <RebornCrowd
          :src="SHEET_SRC" :count="state.count" :duration="state.duration"
          class="border-default w-full border-b" :style="{ height: `${state.height}px` }"
          @ready="playgroundStatus = 'ready：精灵图已加载，人群就位'"
          @error="playgroundStatus = 'error：精灵图加载失败'"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          {{ playgroundStatus }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        传入精灵图 <code>src</code>，尺寸写在 <code>class</code> 上；默认按 15 列 × 7 行切格，全部人物同时上场。
      </template>
      <DemoBlock layout="stack">
        <RebornCrowd :src="SHEET_SRC" class="border-default h-56 w-full border-b" />
      </DemoBlock>
      <DemoNote tone="dimmed">
        底部的线代表页脚上沿：精灵是半身像，最前排的人底边贴住画布底边，腰部的切口正好藏在画布外。
      </DemoNote>
    </DemoSection>

    <DemoSection title="精灵图的要求">
      <template #description>
        下面就是演示用的 <code>src</code>，叠了一层切格线：按 <code>cols</code> × <code>rows</code> 等分，每格一个人物，格子不能留空。
      </template>
      <DemoBlock layout="stack">
        <figure class="flex w-full flex-col items-center gap-2">
          <div class="relative w-full max-w-xl">
            <img :src="SHEET_SRC" alt="Open Peeps 人物精灵图" class="block w-full">
            <div class="crowd-sheet-grid pointer-events-none absolute inset-0" />
          </div>
          <figcaption class="text-muted text-xs">
            src：3600×2268，透明背景，15 列 × 7 行，单格 240×324
          </figcaption>
        </figure>
      </DemoBlock>
      <DemoNote tone="dimmed">
        人物底边要贴着格子底边，组件把它当作站位基线；有朝向的人物统一面朝右，向左走的人会被水平翻转。空格子会变成一个看不见的「人」，占掉一个上场名额。
      </DemoNote>
    </DemoSection>

    <DemoSection title="人数与速度">
      <template #description>
        <code>count</code> 限制同时在场的人数，走完的人回到候场、再随机换一个人上场；<code>duration</code> 是走完一趟的基础秒数，每人再随机放慢到约 1.05~2.6 倍。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col gap-2">
          <RebornCrowd :src="SHEET_SRC" :count="8" :duration="24" class="border-default h-44 w-full border-b" />
          <span class="text-muted font-mono text-xs">:count="8" :duration="24"</span>
        </div>
        <div class="flex flex-col gap-2">
          <RebornCrowd :src="SHEET_SRC" :count="40" :duration="8" class="border-default h-44 w-full border-b" />
          <span class="text-muted font-mono text-xs">:count="40" :duration="8"</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="渐隐与摆放">
      <template #description>
        组件不带遮罩，上沿渐隐写在 <code>class</code> 上：<code>mask-image</code> 让后排的人从内容区里慢慢浮现，而不是被一条硬边截断。
      </template>
      <DemoBlock layout="stack">
        <div class="flex w-full flex-col">
          <p class="text-highlighted text-sm font-medium">
            页面正文的最后一段
          </p>
          <RebornCrowd
            :src="SHEET_SRC" :count="60"
            class="h-56 w-full [mask-image:linear-gradient(to_bottom,transparent_0%,#000_24%)]"
          />
          <div class="border-default text-muted border-t pt-3 text-xs">
            页脚：人群底边贴住它的上沿
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="加载与事件">
      <template #description>
        进入视口附近才加载精灵图，加载完成派发 <code>ready</code>，失败派发 <code>error</code>。右侧故意写错了 <code>src</code>。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col gap-2">
          <RebornCrowd
            :src="SHEET_SRC" :count="20" class="border-default h-40 w-full border-b"
            @ready="okStatus = 'ready：精灵图已加载，人群就位'" @error="okStatus = 'error：精灵图加载失败'"
          />
          <DemoNote tone="dimmed" class="font-mono text-xs">
            {{ okStatus }}
          </DemoNote>
        </div>
        <div class="flex flex-col gap-2">
          <RebornCrowd
            src="/images/peeps/not-exist.png" :count="20" class="border-default h-40 w-full border-b"
            @ready="brokenStatus = 'ready：精灵图已加载，人群就位'" @error="brokenStatus = 'error：精灵图加载失败'"
          />
          <DemoNote tone="dimmed" class="font-mono text-xs">
            {{ brokenStatus }}
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>

<style scoped>
/* 精灵图切格线：15 列 × 7 行，与组件默认的 cols / rows 一致 */
.crowd-sheet-grid {
  background-image:
    linear-gradient(to right, var(--color-primary) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px);
  background-size: calc(100% / 15) calc(100% / 7);
  /* 渐变只画每格的左边与上边，最右与最下两条边用内阴影补齐 */
  box-shadow: inset -1px -1px 0 var(--color-primary);
  opacity: 0.5;
}
</style>
