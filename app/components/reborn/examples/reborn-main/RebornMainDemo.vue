<script setup lang="ts">
/**
 * 主体区域演示
 *
 * RebornMain 的职责是根据 --ui-header-height 变量自动撑起最小高度，
 * 视觉上本身不带任何样式，因此这里只用一条描边勾出它的边界，内部不再套填充盒。
 */
const features = [
  { icon: "lucide:layout", title: "自动最小高度", desc: "读取头部高度变量，保证内容不足时页面仍撑满视口。" },
  { icon: "lucide:columns-3", title: "配合容器使用", desc: "内部通常嵌 RebornContainer 控制最大宽度与左右留白。" },
  { icon: "lucide:sliders-horizontal", title: "样式完全交给业务", desc: "组件不预设背景与内边距，可自由通过 class 覆盖。" },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="RebornMain 作为页面主体包裹层，最小高度为「视口高度 − 头部高度」；下方描边即它撑开的实际范围。"
    >
      <DemoBlock layout="stack">
        <RebornMain class="border-default rounded-ui-md w-full border">
          <RebornContainer class="py-10">
            <div class="flex flex-col gap-8">
              <p class="text-muted mx-auto max-w-2xl text-center text-sm leading-relaxed">
                主体区域会自动占满剩余高度，页脚因此始终贴在视口底部，而不会在内容较少时上浮。
              </p>

              <div class="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="item in features"
                  :key="item.title"
                  class="flex flex-col items-start gap-2"
                >
                  <Icon
                    :name="item.icon"
                    class="text-primary size-5"
                  />
                  <h4 class="text-default text-sm font-semibold">
                    {{ item.title }}
                  </h4>
                  <p class="text-muted text-sm leading-relaxed">
                    {{ item.desc }}
                  </p>
                </div>
              </div>
            </div>
          </RebornContainer>
        </RebornMain>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
