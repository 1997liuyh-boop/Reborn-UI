<template>
  <!--
    首页：参考深色星空风格落地页。品牌色仍是 brand 蓝（#1B6DFA），
    向紫色（#8B5CF6）过渡形成主视觉渐变；浅色主题下退化为淡紫蓝底，保证顶栏切换主题不突兀。
  -->
  <div class="landing-shell relative isolate overflow-hidden">
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <!-- 底色：浅色为淡紫蓝，深色为深空黑紫 -->
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,#f6f5ff_0%,#eef1ff_50%,#f7f7fb_100%)] dark:bg-[linear-gradient(180deg,#0a0616_0%,#0b0a1f_45%,#070812_100%)]" />
      <!-- 星空：三层不同密度的星点 -->
      <div class="landing-stars absolute inset-0 opacity-0 dark:opacity-70" />
      <div class="landing-stars-far absolute inset-0 opacity-0 dark:opacity-40" />
      <!-- 顶部左侧的品牌辉光与右侧紫色辉光 -->
      <div
        class="absolute -top-40 left-[-6rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(27,109,250,0.28)_0%,rgba(27,109,250,0.08)_40%,transparent_72%)] blur-[100px]" />
      <div
        class="absolute top-[6rem] right-[-8rem] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.32)_0%,rgba(139,92,246,0.1)_40%,transparent_72%)] blur-[120px]" />
    </div>

    <!-- 地平线：紫色光晕与透视网格只属于 Hero 底部，随页面滚动而不是钉在视口上 -->
    <div class="pointer-events-none fixed inset-x-0 top-0 -z-[5] h-[64rem] overflow-hidden">
      <div
        class="absolute top-[38rem] left-1/2 h-[26rem] w-[90rem] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.35)_0%,rgba(27,109,250,0.12)_35%,transparent_70%)] opacity-60 blur-[60px] dark:opacity-100" />
      <div class="landing-horizon-grid absolute inset-x-0 top-[40rem] h-[22rem] opacity-30 dark:opacity-40" />
    </div>

    <div class="relative z-10 flex flex-col gap-20">
      <Hero />
      <LandingVideo />
      <LandingFeatures />
      <LandingShowcase />
      <LandingStats />
      <LandingCta />
      <LandingFooter />
    </div>
  </div>
</template>

<style scoped>
/* 近处星点：稀疏、略亮 */
.landing-stars {
  background-image:
    radial-gradient(1.5px 1.5px at 12% 18%, rgba(255, 255, 255, 0.9) 50%, transparent 51%),
    radial-gradient(1.2px 1.2px at 36% 8%, rgba(255, 255, 255, 0.8) 50%, transparent 51%),
    radial-gradient(1.8px 1.8px at 58% 22%, rgba(196, 181, 253, 0.9) 50%, transparent 51%),
    radial-gradient(1.2px 1.2px at 78% 12%, rgba(255, 255, 255, 0.85) 50%, transparent 51%),
    radial-gradient(1.4px 1.4px at 90% 30%, rgba(147, 197, 253, 0.9) 50%, transparent 51%),
    radial-gradient(1.2px 1.2px at 22% 42%, rgba(255, 255, 255, 0.7) 50%, transparent 51%),
    radial-gradient(1.6px 1.6px at 66% 46%, rgba(255, 255, 255, 0.8) 50%, transparent 51%),
    radial-gradient(1.2px 1.2px at 46% 34%, rgba(196, 181, 253, 0.8) 50%, transparent 51%);
  background-size: 100% 100%;
  mask-image: linear-gradient(180deg, black 0%, black 45%, transparent 75%);
}

/* 远处星点：密集、细微，用小尺寸平铺 */
.landing-stars-far {
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.6) 50%, transparent 51%),
    radial-gradient(1px 1px at 70% 60%, rgba(255, 255, 255, 0.5) 50%, transparent 51%),
    radial-gradient(1px 1px at 40% 80%, rgba(255, 255, 255, 0.45) 50%, transparent 51%),
    radial-gradient(1px 1px at 85% 15%, rgba(255, 255, 255, 0.5) 50%, transparent 51%);
  background-size: 180px 180px;
  mask-image: linear-gradient(180deg, black 0%, black 40%, transparent 70%);
}

/* 地平线透视网格：向远处收敛的线框地面 */
.landing-horizon-grid {
  background-image:
    linear-gradient(to right, rgba(139, 92, 246, 0.35) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(139, 92, 246, 0.25) 1px, transparent 1px);
  background-size: 64px 48px;
  transform: perspective(600px) rotateX(62deg);
  transform-origin: top center;
  /* 上下两端都渐隐，避免网格带出现生硬的直边 */
  mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 25%, transparent 85%);
}
</style>
