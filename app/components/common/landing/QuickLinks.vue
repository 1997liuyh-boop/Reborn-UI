<script lang="ts" setup>
const links = [
  {
    icon: "tabler:rocket",
    title: "快速开始",
    description: "了解 Reborn UI 的核心概念、安装配置和第一步操作。",
    to: `/getting-started`,
  },
  {
    icon: "tabler:play",
    title: "安装",
    description: "在你的项目中安装和配置 Reborn UI。",
    to: `/getting-started/installation`,
  },
  {
    icon: "tabler:components",
    title: "组件",
    description: "探索组件、示例和 API 属性。",
    to: `/components`,
  },
  // {
  //   icon: "tabler:blocks",
  //   title: "区块",
  //   description: "通过安装、配置和使用指南开启您的旅程。",
  //   to: `/blocks`,
  // },
];
</script>

<template>
  <UPageSection id="quickLinks" title="快速链接" description="帮助您快速上手 Reborn UI 的链接">
    <div class="grid grid-cols-3 gap-4 max-md:grid-cols-1">
      <UPageCard v-for="link in links" :key="link.to" v-bind="link" class="bg-default/15 hover:bg-default/25" />
    </div>
  </UPageSection>
</template>
