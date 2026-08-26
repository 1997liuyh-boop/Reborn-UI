<script setup lang="ts">
const src = ref("https://cms-image.leyifan.cn/img_reborn/ques-4.jpg");
const previewList = ref([
  "https://cms-image.leyifan.cn/resources/image/2026/01/27/767453852479557.png",
  "https://cms-image.leyifan.cn/resources/image/2026/01/30/768516482351173.png",
]);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection title="基础用法">
      <DemoBlock layout="grid">
        <RebornImage :src="src" />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="预览"
      description="preview 单击放大；preview-list 可在多图之间切换。"
    >
      <DemoBlock layout="grid">
        <RebornImage
          :src="src"
          preview
        />
        <RebornImage
          :src="src"
          preview
          :preview-list="previewList"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="放大镜"
      description="商品详情常见的悬停放大；可调透镜尺寸、倍率和视口。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col items-center">
          <span class="text-dimmed mb-2 text-xs">默认</span>
          <RebornImage
            :src="src"
            magnifier
            width="200"
            height="200"
          />
        </div>
        <div class="flex flex-col items-center">
          <span class="text-dimmed mb-2 text-xs">小透镜高倍率</span>
          <RebornImage
            :src="src"
            magnifier
            :magnifier-size="40"
            :magnifier-zoom="5"
            width="200"
            height="200"
          />
        </div>
        <div class="flex flex-col items-center">
          <span class="text-dimmed mb-2 text-xs">自定义视口</span>
          <RebornImage
            :src="src"
            magnifier
            :magnifier-size="60"
            :magnifier-zoom="1.5"
            :magnifier-width="150"
            :magnifier-height="300"
            width="200"
            height="200"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="状态"
      description="加载失败与空源走错误 / 加载占位。"
    >
      <DemoBlock layout="grid">
        <RebornImage
          src="https://example.com/error.jpg"
          width="180"
          height="180"
          :ui="{ errorIcon: 'size-10 text-red-5' }"
        />
        <RebornImage
          src=""
          width="200"
          height="200"
          :ui="{ loadingIcon: 'size-12' }"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="圆角"
      description="custom-class 走项目圆角白名单，不要写 rounded-2xl / rounded-3xl。"
    >
      <DemoBlock layout="grid">
        <RebornImage
          :src="src"
          lazy-load
          custom-class="rounded-ui-sm"
        />
        <RebornImage
          :src="src"
          lazy-load
          custom-class="rounded-ui-md"
        />
        <RebornImage
          :src="src"
          lazy-load
          custom-class="rounded-ui-lg"
        />
        <RebornImage
          :src="src"
          lazy-load
          custom-class="rounded-full"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="延迟加载">
      <DemoBlock layout="grid">
        <RebornImage
          src="https://picsum.photos/200/200"
          lazy-load
          custom-class="rounded-ui-sm"
        />
        <RebornImage
          src="https://p.upyun.com/demo/webp/webp/animated-gif-0.webp"
          lazy-load
          custom-class="rounded-ui-md"
        />
        <RebornImage
          src="https://img.iplaysoft.com/wp-content/uploads/2019/free-images/free_stock_photo.jpg!0x0.webp"
          lazy-load
          custom-class="rounded-ui-lg"
        />
        <RebornImage
          src="https://img.iplaysoft.com/wp-content/uploads/2019/free-images/unsplash.jpg!0x0.webp"
          lazy-load
          custom-class="rounded-ui-lg"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
