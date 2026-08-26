<script setup lang="ts">
import IconCloud from "~/components/reborn/ui/icon-cloud/IconCloud.vue";

/** 取自 Simple Icons 的图标标识，用于拼装 CDN 地址 */
const slugs = [
  "typescript",
  "javascript",
  "dart",
  "java",
  "react",
  "flutter",
  "android",
  "html5",
  "css3",
  "nodedotjs",
  "express",
  "nextdotjs",
  "prisma",
  "amazonaws",
  "postgresql",
  "firebase",
  "nginx",
  "vercel",
  "testinglibrary",
  "jest",
  "cypress",
  "docker",
  "git",
  "jira",
  "github",
  "gitlab",
  "visualstudiocode",
  "androidstudio",
  "sonarqube",
  "figma",
];

/** 组件只接收图片地址数组，图标来源可以自由替换 */
const imageUrls = slugs.map((slug) => `https://cdn.simpleicons.org/${slug}/${slug}`);
</script>

<template>
  <DemoSection
    title="基础用法"
    description="基于 Canvas 的 3D 图标云，适合做技术栈、能力矩阵或品牌集合的轻量展示；点击任意节点会自动旋转到正前方，拖拽画布可手动调整视角。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <IconCloud :images="imageUrls" />
    </DemoBlock>
  </DemoSection>
</template>
