<script lang="ts" setup>
/** 轮播用的示例图片，实际使用时替换为业务图即可 */
const images = [
  "https://picsum.photos/seed/waiting/1920/1080",
  "https://picsum.photos/seed/full-collapse/1920/1080",
  "https://picsum.photos/seed/five-stories-falling/1920/1080",
  "https://picsum.photos/seed/war-all-the-time/1920/1080",
  "https://picsum.photos/seed/a-city-by-the-light-divided/1920/1080",
  "https://picsum.photos/seed/common-existence/1920/1080",
  "https://picsum.photos/seed/no-devolucion/1920/1080",
];
</script>

<template>
  <DemoSection
    title="基础用法"
    description="ImagesSlider 会预加载全部图片后再开始切换，默认插槽覆盖在图片之上，可用于放置标题与行动按钮。"
  >
    <DemoBlock layout="stack">
      <ImagesSlider
        :images="images"
        autoplay
      >
        <!-- 内容层叠在图片之上，底部渐变仅用于保证文字可读性 -->
        <div
          class="flex size-full items-end justify-center bg-linear-to-b from-transparent via-transparent to-black/80 p-8"
        >
          <div class="max-w-prose text-center text-white">
            <h3 class="mb-8 text-5xl max-md:text-2xl">没人要求，但它就是很好看的图片轮播</h3>
            <button
              type="button"
              class="border-current/50 rounded-full border px-4 py-2 text-sm transition-colors hover:border-current"
            >
              立即加入
            </button>
          </div>
        </div>
      </ImagesSlider>
    </DemoBlock>
  </DemoSection>
</template>
