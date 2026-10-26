<script setup lang="ts">
/**
 * 可拖拽浮动按钮演示
 *
 * RebornAffix 自身是 fixed 定位的浮层，脱离文档流悬浮在视口上，
 * 因此这里不给它套任何容器，只用描边标出「原本会占位的区域」。
 */

/** 原生指针事件只回显抬起，不冒充组件拖拽完成事件 */
const lastAction = shallowRef("暂无");

function handlePointerUp(snapping: boolean) {
  lastAction.value = snapping ? "默认吸附示例：指针抬起" : "关闭吸附示例：指针抬起";
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="按住浮动按钮拖动即可移动（同时支持鼠标与触摸）；松手后默认吸附到距离最近的左右边缘，可通过 no-snapping 关闭吸附。"
    >
      <DemoBlock layout="stack">
        <div class="border-default rounded-xl text-dimmed flex h-40 w-full items-center justify-center border border-dashed text-sm">
          浮动按钮悬浮于视口之上，不占据此处的文档流空间
        </div>

        <DemoNote tone="dimmed">
          最近操作：<code>{{ lastAction }}</code>
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <!-- 默认吸附与关闭吸附分别演示；pointerup 只描述原生指针操作 -->
    <RebornAffix :left="20" :bottom="180" :size="48" @pointerup="handlePointerUp(true)">
      <div class="bg-primary flex size-12 cursor-move items-center justify-center rounded-full text-white transition-transform active:scale-95">
        <Icon name="lucide:magnet" class="size-5" />
      </div>
    </RebornAffix>

    <!-- 可拖拽：关闭吸附后可停在任意位置 -->
    <RebornAffix
      :left="100"
      :bottom="100"
      :size="48"
      :no-snapping="true"
      @pointerup="handlePointerUp(false)"
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
