<script setup lang="ts">
import { ref } from "vue";
import RebornTypewriter from "~/components/reborn/ui/reborn-typewriter/RebornTypewriter.vue";

const text1 = ref("Hello, World!");
const text2 = ref("欢迎使用 Reborn UI 组件库");
const text3 = ref("打字机效果演示");

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
  <div class="max-w-4xl mx-auto px-6 py-12 space-y-16">
    <!-- Header -->
    <header class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon name="lucide:type" class="w-6 h-6 text-primary" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Typewriter 打字机效果
        </h1>
      </div>
      <p class="text-lg text-gray-500 max-w-2xl">
        模拟打字机效果，支持文本删除和重新输入，适用于标题动画、终端效果等场景。
      </p>
    </header>

    <!-- Basic Usage -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">基础用法</h2>

      <div class="grid grid-cols-1 gap-6">
        <!-- 示例 1 -->
        <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
          <h3 class="text-lg font-medium mb-4">简单示例</h3>
          <div class="text-2xl font-mono text-gray-800 dark:text-gray-200">
            <RebornTypewriter :text="text1" />
          </div>
        </div>

        <!-- 示例 2 -->
        <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
          <h3 class="text-lg font-medium mb-4">中文支持</h3>
          <div class="text-2xl font-mono text-gray-800 dark:text-gray-200">
            <RebornTypewriter :text="text2" :type-speed="80" />
          </div>
        </div>

        <!-- 示例 3：动态切换 -->
        <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
          <h3 class="text-lg font-medium mb-4">动态切换文本</h3>
          <div class="space-y-4">
            <div class="text-2xl font-mono text-gray-800 dark:text-gray-200 min-h-[2em]">
              <RebornTypewriter :text="currentText" :type-speed="60" :delete-speed="40" :pause-duration="300" />
            </div>
            <div class="flex gap-3">
              <button
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                @click="changeText"
              >
                切换文本
              </button>
              <button
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                @click="resetText"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Advanced Features -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">高级功能</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 自定义速度 -->
        <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
          <h3 class="text-lg font-medium mb-4">自定义速度</h3>
          <div class="space-y-4">
            <div class="text-xl font-mono text-gray-800 dark:text-gray-200 min-h-[2em]">
              <RebornTypewriter
                :text="customText"
                :type-speed="100"
                :delete-speed="50"
                :pause-duration="500"
              />
            </div>
            <button
              class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
              @click="changeSpeedText"
            >
              切换文本
            </button>
          </div>
        </div>

        <!-- 隐藏光标 -->
        <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
          <h3 class="text-lg font-medium mb-4">隐藏光标</h3>
          <div class="text-xl font-mono text-gray-800 dark:text-gray-200">
            <RebornTypewriter text="没有光标的打字效果" :show-cursor="false" />
          </div>
        </div>

        <!-- 自定义光标 -->
        <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
          <h3 class="text-lg font-medium mb-4">自定义光标</h3>
          <div class="text-xl font-mono text-gray-800 dark:text-gray-200">
            <RebornTypewriter text="使用下划线作为光标" cursor="_" />
          </div>
        </div>

        <!-- 快速打字 -->
        <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
          <h3 class="text-lg font-medium mb-4">快速打字</h3>
          <div class="text-xl font-mono text-gray-800 dark:text-gray-200">
            <RebornTypewriter text="快速打字效果演示" :type-speed="20" :delete-speed="15" />
          </div>
        </div>
      </div>
    </section>

    <!-- Code Example -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">代码示例</h2>

      <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl">
        <pre class="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto"><code>&lt;script setup lang="ts"&gt;
import { ref } from "vue";
import RebornTypewriter from "~/components/reborn/ui/reborn-typewriter/RebornTypewriter.vue";

const text = ref("Hello, World!");

// 修改 text 会触发删除旧内容，然后输入新内容
function changeText() {
  text.value = "新的文本内容";
}
&lt;/script&gt;

&lt;template&gt;
  &lt;RebornTypewriter :text="text" /&gt;
&lt;/template&gt;</code></pre>
      </div>
    </section>

    <!-- Props Table -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Props</h2>

      <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-semibold">属性名</th>
              <th class="text-left py-3 px-4 font-semibold">类型</th>
              <th class="text-left py-3 px-4 font-semibold">默认值</th>
              <th class="text-left py-3 px-4 font-semibold">说明</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td class="py-3 px-4 font-mono text-primary">text</td>
              <td class="py-3 px-4">string</td>
              <td class="py-3 px-4">""</td>
              <td class="py-3 px-4">要显示的文本内容</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">typeSpeed</td>
              <td class="py-3 px-4">number</td>
              <td class="py-3 px-4">50</td>
              <td class="py-3 px-4">打字速度（毫秒/字符）</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">deleteSpeed</td>
              <td class="py-3 px-4">number</td>
              <td class="py-3 px-4">30</td>
              <td class="py-3 px-4">删除速度（毫秒/字符）</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">pauseDuration</td>
              <td class="py-3 px-4">number</td>
              <td class="py-3 px-4">500</td>
              <td class="py-3 px-4">删除后到打字的延迟时间（毫秒）</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">cursor</td>
              <td class="py-3 px-4">string</td>
              <td class="py-3 px-4">"|"</td>
              <td class="py-3 px-4">光标字符</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">showCursor</td>
              <td class="py-3 px-4">boolean</td>
              <td class="py-3 px-4">true</td>
              <td class="py-3 px-4">是否显示光标</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">cursorBlinkSpeed</td>
              <td class="py-3 px-4">number</td>
              <td class="py-3 px-4">530</td>
              <td class="py-3 px-4">光标闪烁速度（毫秒）</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">resetOnChange</td>
              <td class="py-3 px-4">boolean</td>
              <td class="py-3 px-4">true</td>
              <td class="py-3 px-4">是否在文本变化时重置</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Events -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Events</h2>

      <div class="p-6 rounded-2xl border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-semibold">事件名</th>
              <th class="text-left py-3 px-4 font-semibold">参数</th>
              <th class="text-left py-3 px-4 font-semibold">说明</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td class="py-3 px-4 font-mono text-primary">typed</td>
              <td class="py-3 px-4">-</td>
              <td class="py-3 px-4">打字完成时触发</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">deleted</td>
              <td class="py-3 px-4">-</td>
              <td class="py-3 px-4">删除完成时触发</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">start-typing</td>
              <td class="py-3 px-4">-</td>
              <td class="py-3 px-4">开始打字时触发</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-mono text-primary">start-deleting</td>
              <td class="py-3 px-4">-</td>
              <td class="py-3 px-4">开始删除时触发</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
