<script setup lang="ts">
/**
 * 动效令牌演示：六条缓动曲线跑同一段位移，外加三个关键帧动画。
 * 这里刻意用工具类而不是内联 style——Tailwind 只为源码里出现过的类名产出 CSS，
 * 写成内联就等于这些令牌永远不会被打包进去。
 */

/** 同一段位移，换不同曲线跑，差别才看得出来 */
const easings = [
  { cls: "ease-out", label: "缓出", note: "三次缓出，界面默认曲线" },
  { cls: "ease-out-soft", label: "轻缓出", note: "二次缓出，高频小反馈" },
  { cls: "ease-in", label: "缓入", note: "越走越快，用于离场" },
  { cls: "ease-in-out", label: "缓入缓出", note: "两端平缓，用于位置迁移" },
  { cls: "ease-back", label: "超调回落", note: "冲过终点约 12% 再落回" },
  { cls: "ease-anticipate", label: "预备超调", note: "先反向退一点再冲出" },
  { cls: "ease-spring", label: "阻尼弹簧", note: "峰值约 1.28，两次半回弹" },
];

/** 三个关键帧动画，靠 key 自增来重播 */
const keyframes = [
  { cls: "animate-pop", label: "出场 pop", note: "放大到位，超调来自 ease-back" },
  { cls: "animate-squash", label: "按压 squash", note: "横撑纵压，面积基本不变" },
  { cls: "animate-settle", label: "落位 settle", note: "小幅下落，回弹来自 ease-spring" },
];

/** 位移到终点还是回到起点 */
const moved = ref(false);
/** 重播计数：改 key 让关键帧动画重新播一遍 */
const playCount = ref(0);

function replay() {
  moved.value = !moved.value;
  playCount.value += 1;
}
</script>

<template>
  <ComponentPlayground>
    <template #component>
      <div class="flex w-full min-w-0 flex-col gap-6">
        <div class="flex flex-col gap-3">
          <div
            v-for="e in easings"
            :key="e.cls"
            class="flex items-center gap-4"
          >
            <span class="text-dimmed w-20 shrink-0 text-xs">{{ e.label }}</span>
            <div class="bg-elevated relative h-8 min-w-0 flex-1 rounded-sm">
              <div
                class="bg-primary absolute top-1 size-6 rounded-sm transition-transform duration-(--duration-slower)"
                :class="[e.cls, moved ? 'translate-x-[calc(100%-1.5rem)]' : 'translate-x-0']"
                :style="{ left: '0.25rem', right: '0.25rem', width: '1.5rem' }"
              />
            </div>
            <code class="text-dimmed hidden w-32 shrink-0 text-[10px] sm:block">{{ e.cls }}</code>
            <span class="text-muted hidden w-44 shrink-0 text-xs lg:block">{{ e.note }}</span>
          </div>
        </div>

        <div class="border-gray-3 flex flex-wrap items-end gap-8 border-t pt-6">
          <div
            v-for="k in keyframes"
            :key="k.cls"
            class="flex flex-col items-center gap-2"
          >
            <div
              :key="`${k.cls}-${playCount}`"
              class="bg-primary size-12 rounded-sm"
              :class="k.cls"
            />
            <span class="text-dimmed text-xs">{{ k.label }}</span>
            <span class="text-muted max-w-[9rem] text-center text-[10px]">{{ k.note }}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            class="border-default hover:border-inverted text-muted cursor-pointer rounded-xl border px-3 py-1 text-xs transition-colors duration-(--duration-fast) ease-out"
            @click="replay"
          >
            重播
          </button>
        </div>
      </div>
    </template>
  </ComponentPlayground>
</template>
