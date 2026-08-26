<script setup lang="ts">
import { firstCode, secondCode } from "./code/index";
</script>

<template>
  <div class="flex w-full justify-center">
    <!-- 代码对比两侧都需要永久深色底，才能衬出红/绿语法色 -->
    <Compare
      slide-mode="drag"
      class="rounded-ui-md overflow-hidden bg-gray-10 dark:bg-gray-1"
    >
      <template #first-content>
        <div class="size-full overflow-auto bg-gray-10 p-8 dark:bg-gray-1">
          <pre
            class="font-mono text-red-400"
            v-text="firstCode"
          />
        </div>
      </template>
      <template #second-content>
        <div class="size-full overflow-auto bg-gray-10 p-8 dark:bg-gray-1">
          <pre
            class="font-mono text-green-400"
            v-text="secondCode"
          />
        </div>
      </template>
    </Compare>
  </div>
</template>
