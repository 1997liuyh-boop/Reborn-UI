<script setup lang="ts">
/**
 * 可拖拽浮动按钮演示
 *
 * RebornAffix 自身是 fixed 定位的浮层，脱离文档流悬浮在视口上，
 * 因此这里不给它套任何容器，只用描边标出「原本会占位的区域」。
 */

/** 记录最近一次拖拽结束后的落点，替代 console 输出 */
const lastAction = ref("暂无");

function handleDrag() {
  lastAction.value = "拖拽结束，已自动吸附到最近的一侧边缘";
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="按住浮动按钮拖动即可移动（同时支持鼠标与触摸）；松手后默认吸附到距离最近的左右边缘，可通过 no-snapping 关闭吸附。"
    >
      <DemoBlock layout="stack">
        <div class="border-default rounded-ui-md text-dimmed flex h-40 w-full items-center justify-center border border-dashed text-sm">
          浮动按钮悬浮于视口之上，不占据此处的文档流空间
        </div>

        <DemoNote tone="dimmed">
          最近操作：<code>{{ lastAction }}</code>
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <!-- 可拖拽：关闭吸附后可停在任意位置 -->
    <RebornAffix
      :left="100"
      :bottom="100"
      :no-snapping="true"
      @pointerup="handleDrag"
    >
      <div class="bg-primary flex size-12 cursor-move items-center justify-center rounded-full text-white transition-transform active:scale-95">
        <Icon
          name="lucide:move"
          class="size-5"
        />
      </div>
    </RebornAffix>

    <!-- 禁用态：仅展示，不响应拖拽 -->
    <RebornAffix
      :right="20"
      :bottom="400"
      disabled
    >
      <div class="bg-elevated text-dimmed flex size-10 cursor-not-allowed items-center justify-center rounded-full">
        <Icon
          name="lucide:lock"
          class="size-5"
        />
      </div>
    </RebornAffix>
  </div>
</template>
