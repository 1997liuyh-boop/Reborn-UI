<script setup lang="ts">
import { computed, ref } from "vue";
import IconCloud from "~/components/reborn/ui/icon-cloud/IconCloud.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";

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


const imageUrls = slugs.map((slug) => `https://cdn.simpleicons.org/${slug}/${slug}`);
</script>

<template>
  <div class="flex w-full flex-col gap-10 pb-20">
    <div class="flex flex-col gap-2">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Icon Cloud 图标云</h2>
      <p class="text-lg text-gray-500 dark:text-gray-400">
        基于 Canvas 的 3D 图标云组件，适合做技术栈、能力矩阵或品牌集合的轻量展示。
      </p>
    </div>

    <section class="flex flex-col gap-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">交互演练场</h3>
      <div
        class="flex flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 md:flex-row">


        <div class="relative flex min-h-[440px] flex-1 items-center justify-center overflow-hidden p-10">
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.14),_transparent_30%),linear-gradient(135deg,_rgba(248,250,252,1),_rgba(241,245,249,0.92))] dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.16),_transparent_26%),linear-gradient(135deg,_rgba(2,6,23,1),_rgba(15,23,42,0.94))]" />
          <div class="relative flex flex-col items-center gap-6">
            <IconCloud :images="imageUrls" />
            <p class="max-w-md text-center text-sm leading-6 text-gray-500 dark:text-gray-400">
              点击任意节点会自动旋转到正前方，拖拽画布可以手动调整视角。
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
