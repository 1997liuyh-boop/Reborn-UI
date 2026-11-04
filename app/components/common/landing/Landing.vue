<script setup lang="ts">
import SylvaHero from "./sylva-hero/SylvaHero.vue";
</script>

<template>
  <!-- 首屏整页场景，占满视口 -->
  <div class="h-dvh w-full">
    <SylvaHero
      variant="living-green"
      heading-font="lexend"
      body-font="lexend"
      heading-weight="300"
      body-weight="300"
      primary-color="#ffffff"
      :heading-size="63"
      :body-size="16.5"
      :heading-letter-spacing="-0.006"
    />
  </div>
</template>
