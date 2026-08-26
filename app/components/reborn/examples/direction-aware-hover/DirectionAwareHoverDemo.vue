<script setup lang="ts">
/**
 * 方向感知悬停演示
 *
 * 卡片本身就是被演示的对象：图片、遮罩、内容层都由组件渲染，
 * 因此这里不再额外套任何背景盒，只按分组排列。
 */
const images = {
  landscape:
    "https://images.unsplash.com/photo-1728755833852-2c138c84cfb1?q=80&w=2672&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  city: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
  food: "https://images.unsplash.com/photo-1664710476481-1213c456c56c?q=80&w=2672&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  mountain: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2670&auto=format&fit=crop",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2671&auto=format&fit=crop",
};
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="桌面端把鼠标移入卡片，遮罩会从鼠标进入的那一侧滑入；移动端改为点击触发，3 秒后自动收起。只需传入 image-url，内容写在默认插槽里。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <DirectionAwareHover :image-url="images.landscape">
          <h4 class="text-lg font-semibold">
            自然风光
          </h4>
          <p class="mt-1 text-sm opacity-90">
            探索山野之间的辽阔
          </p>
        </DirectionAwareHover>

        <DirectionAwareHover :image-url="images.mountain">
          <h4 class="text-lg font-semibold">
            雪山之巅
          </h4>
          <p class="mt-1 text-sm opacity-90">
            触摸云层之上的静谧
          </p>
        </DirectionAwareHover>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自定义样式"
      description="class 作用在卡片外框，image-class 作用在图片，children-class 作用在内容层；三者都会与组件默认类合并，可用来改圆角、缩放与内容底部的渐变遮罩。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <!-- 改圆角 + 内容层加底部渐变，保证文字在浅色图片上依然可读 -->
        <DirectionAwareHover
          :image-url="images.city"
          class="rounded-ui-lg"
          children-class="inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4"
        >
          <h4 class="text-lg font-semibold">
            城市夜色
          </h4>
          <p class="mt-1 text-sm opacity-90">
            穿行在霓虹之间
          </p>
        </DirectionAwareHover>

        <!-- 圆形卡片：仅靠 class 即可改变外框形状 -->
        <DirectionAwareHover
          :image-url="images.forest"
          class="rounded-full"
          image-class="sepia transition-[filter] duration-700 hover:sepia-0"
          children-class="inset-0 flex items-center justify-center p-4 text-center"
        >
          <div>
            <h4 class="text-lg font-bold">
              林间小径
            </h4>
            <p class="text-sm opacity-90">
              悬停时褪去复古滤镜
            </p>
          </div>
        </DirectionAwareHover>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="内容层放置交互元素"
      description="内容层的 z-index 高于遮罩，可以直接放按钮等可点击元素。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <DirectionAwareHover
          :image-url="images.food"
          class="rounded-ui-lg"
          children-class="inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-4"
        >
          <h4 class="text-lg font-semibold">
            风味料理
          </h4>
          <p class="mt-1 text-sm opacity-90">
            品味每一道匠心之作
          </p>
          <RebornButton
            class="mt-3"
            size="sm"
            color="primary"
            variant="solid"
            label="查看菜谱"
          />
        </DirectionAwareHover>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
