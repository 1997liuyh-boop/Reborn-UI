<script setup lang="ts">
import { ref } from "vue";
import RebornTypewriter from "~/components/reborn/ui/reborn-typewriter/RebornTypewriter.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";

const text1 = ref("Hello, World!");
const text2 = ref("欢迎使用 Reborn UI 组件库");

const currentText = ref("这是第一段文字");

const texts = [
  "这是第一段文字",
  "这是第二段文字，会先删除前面的内容",
  "第三段文字，继续演示打字效果",
  "最后一段，演示完成！",
];

let textIndex = 0;

function changeText() {
  textIndex = (textIndex + 1) % texts.length;
  currentText.value = texts[textIndex];
}

function resetText() {
  currentText.value = texts[0];
  textIndex = 0;
}

const customText = ref("自定义速度的打字效果");


const speedTexts = [
  "快速打字效果",
  "中等速度打字",
  "慢速打字效果演示",
];

let speedIndex = 0;

function changeSpeedText() {
  speedIndex = (speedIndex + 1) % speedTexts.length;
  customText.value = speedTexts[speedIndex];
}
</script>

<template>
  <div class="flex w-full flex-col">
    <DemoSection title="基础用法" description="传入 text 即可开始打字；文本变化时会先删除旧内容再输入新内容。">
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">简单示例</span>
          <div class="text-default font-mono text-2xl">
            <RebornTypewriter :text="text1" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">中文支持（typeSpeed 80）</span>
          <div class="text-default font-mono text-2xl">
            <RebornTypewriter :text="text2" :type-speed="80" />
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="动态切换文本" description="改变 text 会触发「删除 → 停顿 → 重新输入」的完整过程。">
      <DemoBlock layout="stack" class="gap-4">
        <div class="text-default min-h-[2em] font-mono text-2xl">
          <RebornTypewriter :text="currentText" :type-speed="60" :delete-speed="40" :pause-duration="300" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <RebornButton color="primary" @click="changeText">切换文本</RebornButton>
          <RebornButton color="neutral" variant="outlined" @click="resetText">重置</RebornButton>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="速度控制" description="typeSpeed / deleteSpeed / pauseDuration 三个参数分别控制输入、删除与停顿节奏。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-4">
          <span class="text-dimmed text-xs font-medium">自定义速度（100 / 50 / 500）</span>
          <div class="text-default min-h-[2em] font-mono text-xl">
            <RebornTypewriter :text="customText" :type-speed="100" :delete-speed="50" :pause-duration="500" />
          </div>
          <div>
            <RebornButton color="secondary" @click="changeSpeedText">切换文本</RebornButton>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <span class="text-dimmed text-xs font-medium">快速打字（20 / 15）</span>
          <div class="text-default min-h-[2em] font-mono text-xl">
            <RebornTypewriter text="快速打字效果演示" :type-speed="20" :delete-speed="15" />
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="光标定制" description="showCursor 控制显隐，cursor 可替换为任意字符。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">隐藏光标</span>
          <div class="text-default font-mono text-xl">
            <RebornTypewriter text="没有光标的打字效果" :show-cursor="false" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">自定义光标 <code>cursor="_"</code></span>
          <div class="text-default font-mono text-xl">
            <RebornTypewriter text="使用下划线作为光标" cursor="_" />
          </div>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>

