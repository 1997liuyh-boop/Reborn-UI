<script setup lang="ts">
import { CardBody, CardContainer, CardItem } from "~/components/reborn/ui/card-3d";
</script>

<template>
  <!-- 固定变换参数的静态示例：卡片本身即被演示的对象 -->
  <ClientOnly>
    <CardContainer>
      <CardBody
        class="group/card border-default bg-elevated rounded-ui-base relative size-auto border p-6 sm:w-[30rem]">
        <CardItem :translate-z="50" class="text-highlighted text-xl font-bold">
          让元素浮在空中
        </CardItem>
        <CardItem as="p" :translate-z="60" class="text-muted mt-2 max-w-sm text-sm">
          把鼠标移到卡片上，感受 CSS 透视带来的立体效果
        </CardItem>
        <CardItem :translate-z="100" :rotate-x="20" :rotate-z="-10" class="mt-4 w-full">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            height="1000" width="1000" class="rounded-ui-md h-60 w-full object-cover" alt="示例图片" />
        </CardItem>
        <div class="mt-20 flex items-center justify-between">
          <CardItem :translate-z="20" :translate-x="-40" as="a" href="https://rahulv.dev" target="__blank"
            class="text-default rounded-ui-md px-4 py-2 text-xs font-normal">
            访问 →
          </CardItem>
          <CardItem :translate-z="20" :translate-x="40" as="button"
            class="bg-inverted text-inverted rounded-ui-md px-4 py-2 text-xs font-bold">
            立即开始
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  </ClientOnly>
</template>
