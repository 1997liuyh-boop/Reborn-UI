<script setup lang="ts">
import { textColors } from "~/components/reborn/ui/reborn-text/reborn-text.config";
import RebornText from "~/components/reborn/ui/reborn-text/RebornText.vue";

const color = ref<any>("primary");
</script>

<template>
  <div class="flex w-full flex-col gap-10">
    <div
      class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
        <USelect
          v-model="color"
          :items="[...textColors]"
          class="w-28"
        />
      </div>
    </div>

    <div class="grid gap-8">
      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">颜色</h3>
        <div class="flex flex-wrap gap-4">
          <RebornText
            v-for="c in textColors"
            :key="c"
            :color="c"
          >
            {{ c }}
          </RebornText>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">文本格式化</h3>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="space-y-1">
            <span class="text-xs text-gray-400">手机号脱敏</span>
            <div>
              <RebornText
                :color="color"
                type="phone"
                value="13812345678"
                mask
              />
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs text-gray-400">姓名脱敏</span>
            <div>
              <RebornText
                :color="color"
                type="name"
                value="张三丰"
                mask
              />
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs text-gray-400">金额</span>
            <div>
              <RebornText
                :color="color"
                type="amount"
                :value="12345.6"
              />
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs text-gray-400">银行卡脱敏</span>
            <div>
              <RebornText
                :color="color"
                type="card"
                value="6222021234567890"
                mask
              />
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs text-gray-400">邮箱脱敏</span>
            <div>
              <RebornText
                :color="color"
                type="email"
                value="hello@example.com"
                mask
              />
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">
          文本省略（单行 / 多行）
        </h3>
        <RebornText
          :color="color"
          ellipsis
          :lines="1"
          class="max-w-xs"
        >
          单行省略单行省略单行省略单行省略单行省略单行省略单行省略
        </RebornText>
        <RebornText
          :color="color"
          ellipsis
          :lines="2"
          class="max-w-xs"
        >
          这是一段很长的文本内容，用于测试多行文本省略功能。当内容超出指定行数时，会显示省略号。这是一段很长的文本内容，用于测试多行文本省略功能。
          这是一段很长的文本内容，用于测试多行文本省略功能。当内容超出指定行数时，会显示省略号。这是一段很长的文本内容，用于测试多行文本省略功能。
          这是一段很长的文本内容，用于测试多行文本省略功能。当内容超出指定行数时，会显示省略号。这是一段很长的文本内容，用于测试多行文本省略功能。
        </RebornText>
      </div>
    </div>
  </div>
</template>
