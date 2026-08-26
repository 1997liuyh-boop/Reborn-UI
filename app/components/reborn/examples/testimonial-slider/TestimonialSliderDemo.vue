<script lang="ts" setup>
import { rand } from "@vueuse/core";

const testimonials = [
  {
    img: `https://randomuser.me/api/portraits/men/${getRandomNumber()}.jpg`,
    quote: "Reborn UI 比我的星际巡洋舰还顺滑。秒级启动，零崩溃，零重力。",
    name: "Buzz Lightyear",
    role: "星际界面指挥部",
  },
  {
    img: `https://randomuser.me/api/portraits/women/${getRandomNumber()}.jpg`,
    quote: "点来点去像骑着加了涡轮的马。这套组件有劲儿！",
    name: "Jessie",
    role: "牧场体验与互动",
  },
  {
    img: `https://randomuser.me/api/portraits/men/${getRandomNumber()}.jpg`,
    quote: "我见过不少磕磕绊绊的界面……这一套？比周二的风滚草还顺。",
    name: "Woody",
    role: "警长",
  },
  {
    img: `https://randomuser.me/api/portraits/men/${getRandomNumber()}.jpg`,
    quote: "我本来很怕。然后我点了一下。什么都没炸。Reborn UI 是安全区，我活下来了。",
    name: "Rex",
    role: "恐龙可用性实验室 · 高级恐慌测试员",
  },
];

function getRandomNumber() {
  return rand(1, 99);
}
</script>

<template>
  <DemoSection
    title="基础用法"
    description="评价轮播自己会铺内容；外层只给高度，不再套填充卡片。"
  >
    <div class="relative h-[500px] w-full overflow-hidden">
      <div class="mt-16 flex justify-center px-12">
        <TestimonialSlider :testimonials="testimonials" />
      </div>
    </div>
  </DemoSection>
</template>
