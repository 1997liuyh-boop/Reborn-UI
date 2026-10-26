<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { useElementSize } from "@vueuse/core";
import { Motion, useScroll, useTransform } from "motion-v";
import { useTemplateRef } from "vue";

interface Props {
  containerClass?: HTMLAttributes["class"];
  class?: HTMLAttributes["class"];
  items?: {
    id: string;
    label: string;
  }[];
  title?: string;
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
});

const timelineRef = useTemplateRef<HTMLElement>("timelineRef");

// 高度用尺寸观察持续同步：插槽里的图片加载、异步数据把内容撑高后，时间线长度跟着变
const { height } = useElementSize(timelineRef, undefined, { box: "border-box" });

const { scrollYProgress } = useScroll({
  target: timelineRef,
  offset: ["start 10%", "end 50%"],
});

const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
// 函数形式的 useTransform 同时追踪函数里读到的 MotionValue 与 Vue ref，只在 setup 里创建一次。
// 不能在 watch 回调里重建：那时没有当前实例，订阅不会随组件卸载清理，旧的 transform 也一直挂着
const heightTransform = useTransform(() => scrollYProgress.get() * height.value);
</script>

<template>
  <div
    class="w-full bg-white font-sans md:px-10 dark:bg-neutral-950"
  >
    <div class="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-10">
      <h2 class="mb-4 max-w-4xl text-lg text-black md:text-4xl dark:text-white">
        {{ title }}
      </h2>
      <p class="max-w-sm text-sm text-neutral-700 md:text-base dark:text-neutral-300">
        {{ description }}
      </p>
    </div>

    <div
      ref="timelineRef"
      class="relative z-0 mx-auto max-w-7xl pb-20"
    >
      <div
        v-for="(item, index) in props.items"
        :key="item.id + index"
        class="flex justify-start pt-10 md:gap-10 md:pt-40"
      >
        <div
          class="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm"
        >
          <div
            class="absolute left-3 flex size-10 items-center justify-center rounded-full bg-white md:left-3 dark:bg-black"
          >
            <div
              class="size-4 rounded-full border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          <h3
            class="hidden text-xl font-bold text-neutral-500 md:block md:pl-20 md:text-5xl dark:text-neutral-500"
          >
            {{ item.label }}
          </h3>
        </div>
        <slot :name="item.id" />
      </div>
      <div
        :style="{
          height: `${height}px`,
        }"
        class="absolute top-0 left-8 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-0% via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8 dark:via-neutral-700"
      >
        <Motion
          as="div"
          :style="{
            height: heightTransform,
            opacity: opacityTransform,
          }"
          class="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-purple-500 from-0% via-blue-500 via-10% to-transparent"
        />
      </div>
    </div>
  </div>
</template>
