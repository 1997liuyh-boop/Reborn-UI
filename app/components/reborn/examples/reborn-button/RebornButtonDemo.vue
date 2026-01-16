<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import type { ButtonProps } from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import { buttonColors, buttonVariants, buttonSizes } from "~/components/reborn/ui/reborn-button/reborn-button.config"


const colors = ref([...buttonColors])
const color = ref<ButtonProps["color"]>('primary')
const variants = ref([...buttonVariants])
const variant = ref<ButtonProps["variant"]>('solid')
const sizes = ref([...buttonSizes])
const size = ref<ButtonProps["size"]>('md')

const num = ref(0)
const disabled = ref(false)
const loading = ref(false)
const rounded = ref(false)
function onClick() {
  num.value++
}

</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <!-- Configuration Panel -->
    <div
      class="flex flex-wrap items-center gap-6 p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 dark:border-gray-800">

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">颜色</span>
        <USelect v-model="color" :items="colors" class="w-32" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">风格</span>
        <USelect v-model="variant" :items="variants" class="w-32" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">大小</span>
        <USelect v-model="size" :items="sizes" class="w-24" />
      </div>

      <div class="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block"></div>

      <div class="flex flex-wrap items-center gap-4">
        <UCheckbox v-model="disabled" label="禁用" />
        <UCheckbox v-model="loading" label="加载" />
        <UCheckbox v-model="rounded" label="全圆角" />
      </div>
    </div>

    <!-- Main Preview -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        class="flex flex-col gap-4 p-6 border rounded-lg justify-center items-center min-h-[160px] dark:border-gray-800">
        <h3 class="text-sm font-medium text-gray-400 self-start mb-auto">按钮展示</h3>
        <div class="flex flex-wrap items-center justify-center gap-4 mb-auto">
          <RebornButton :color="color" :variant="variant" :size="size" :disabled="disabled" :loading="loading"
            :class="rounded ? 'rounded-full' : ''" @click="onClick">
            我被点击了： {{ num }}
          </RebornButton>

          <RebornButton :color="color" :variant="variant" size="icon-md" :disabled="disabled" :loading="loading"
            :class="rounded ? 'rounded-full' : ''">
            <Icon name="fluent-emoji-flat:avocado" size="20" />
          </RebornButton>

          <RebornButton :color="color" :variant="variant" size="icon-md" :disabled="disabled" :loading="loading"
            :class="rounded ? 'rounded-full' : ''">
            <Icon name="lucide:plus" size="16" />
          </RebornButton>
        </div>
      </div>

      <!-- Combinations -->
      <div class="flex flex-col gap-4 p-6 border rounded-lg dark:border-gray-800">
        <h3 class="text-sm font-medium text-gray-400">组合展示</h3>
        <div class="flex flex-col gap-6 items-center justify-center flex-1">
          <!-- Button Group -->
          <div class="flex items-center w-full justify-center">
            <RebornButton color="warning" variant="solid" class="rounded-l-full px-6 w-32">
              加入购物车
            </RebornButton>
            <RebornButton color="error" variant="solid" class="rounded-r-full px-6 w-32 border-l-0">
              立即购买
            </RebornButton>
          </div>

          <!-- Vertical Group -->
          <div class="flex">
            <RebornButton color="secondary" variant="solid" class="h-auto flex-col gap-1 py-3 w-20">
              <Icon name="lucide:heart" size="18" />
              <span class="text-xs">收藏</span>
            </RebornButton>
            <RebornButton color="error" variant="solid" class="h-auto flex-col gap-1 py-3 w-20">
              <Icon name="lucide:trash" size="18" />
              <span class="text-xs">删除</span>
            </RebornButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
