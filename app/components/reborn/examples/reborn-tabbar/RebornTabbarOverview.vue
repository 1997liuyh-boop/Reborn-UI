<script setup lang="ts">
/**
 * 总览卡片缩略：手机屏下半截，底部是四个图标加文字的标签栏，「首页」为选中态
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：默认 normal 形状、顶部细边框、各项等分宽度、
 * 图标在上文字在下。选中项用主色（对应 activeColor），未选中项为灰色。
 * 真实组件可 fixed 贴底，缩略图不能用 fixed，改为画一截手机屏框，把标签栏放在屏幕最下方。
 */
const items = [
  { title: '首页', icon: 'lucide:house', active: true },
  { title: '分类', icon: 'lucide:layout-grid', active: false },
  { title: '购物车', icon: 'lucide:shopping-cart', active: false },
  { title: '我的', icon: 'lucide:user', active: false },
]
</script>

<template>
  <div class="relative flex h-[124px] w-[176px] flex-col overflow-hidden rounded-b-[20px] border-x-[3px] border-b-[3px] border-gray-4 bg-gray-2 [mask-image:linear-gradient(to_top,#000_72%,transparent)]">
    <!-- 页面内容：横幅 + 分类入口 -->
    <div class="flex h-[75px] shrink-0 flex-col justify-end gap-1.5 px-2.5 pb-1.5">
      <div class="h-[36px] rounded-md bg-linear-to-r from-primary/30 to-primary/10" />
      <div class="flex justify-between px-1">
        <div
          v-for="i in 5"
          :key="i"
          class="size-5 rounded-full bg-gray-1 ring-1 ring-gray-3"
        />
      </div>
    </div>

    <!-- 标签栏 -->
    <div class="flex h-[46px] shrink-0 flex-col border-t border-gray-3 bg-gray-1">
      <div class="flex h-9 items-center">
        <div
          v-for="item in items"
          :key="item.title"
          class="flex flex-1 flex-col items-center gap-[3px]"
          :class="[item.active ? 'text-primary' : 'text-gray-6']"
        >
          <Icon
            :name="item.icon"
            class="size-3.5"
          />
          <span class="text-[9px] leading-none">{{ item.title }}</span>
        </div>
      </div>
      <!-- 底部安全区与系统横条 -->
      <div class="flex flex-1 items-start justify-center">
        <div class="h-[3px] w-12 rounded-full bg-gray-9/70" />
      </div>
    </div>
  </div>
</template>
