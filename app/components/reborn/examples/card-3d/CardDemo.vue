<script setup lang="ts">
import { CardBody, CardContainer, CardItem } from "~/components/reborn/ui/card-3d";

interface Props {
  title?: {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  };
  description?: {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  };
  image?: {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  };
  btnLeft?: {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  };
  btnRight?: {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  title: () => ({
    translateX: 0,
    translateY: 0,
    translateZ: 50,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  }),
  description: () => ({
    translateX: 0,
    translateY: 0,
    translateZ: 60,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  }),
  image: () => ({
    translateX: 0,
    translateY: 0,
    translateZ: 100,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  }),
  btnLeft: () => ({
    translateX: 0,
    translateY: 0,
    translateZ: 20,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  }),
  btnRight: () => ({
    translateX: 0,
    translateY: 0,
    translateZ: 20,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  }),
});
</script>

<template>
  <!-- 卡片本身就是被演示的对象，其表面样式属于组件效果，不视为额外嵌套 -->
  <CardContainer>
    <CardBody
      class="group/card border-default bg-elevated rounded-ui-base relative h-auto w-fit border p-6 sm:w-[30rem]">
      <CardItem v-bind="props.title" class="text-highlighted text-xl font-bold">
        让元素浮在空中
      </CardItem>
      <CardItem as="p" v-bind="props.description" class="text-muted mt-2 max-w-sm text-sm">
        把鼠标移到卡片上，感受 CSS 透视带来的立体效果
      </CardItem>
      <CardItem v-bind="props.image" class="mt-4 w-full">
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          height="1000" width="1000" class="rounded-ui-md h-60 w-full object-cover" alt="示例图片" />
      </CardItem>
      <div class="mt-12 flex items-center justify-between">
        <CardItem v-bind="props.btnLeft" as="a" href="https://rahulv.dev" target="__blank"
          class="text-default rounded-ui-md px-4 py-2 text-xs font-normal">
          访问 →
        </CardItem>
        <CardItem v-bind="props.btnRight" as="button"
          class="bg-inverted text-inverted rounded-ui-md px-4 py-2 text-xs font-bold">
          立即开始
        </CardItem>
      </div>
    </CardBody>
  </CardContainer>
</template>
