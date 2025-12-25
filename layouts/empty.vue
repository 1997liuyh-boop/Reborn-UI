<!-- layouts/empty.vue -->
<template>
  <div class="min-h-screen bg-black">
    <!-- 顶部导航：默认透明，滚动后玻璃态 -->
    <header class="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
      <nav
        class="relative flex items-center justify-between rounded-2xl border transition-all duration-300"
        :class="[
          isScrolled
            ? 'bg-white/10 backdrop-blur-md border-white/15 shadow-lg shadow-black/10 w-[90%] md:w-1/2 mt-5'
            : 'bg-transparent border-transparent w-full md:w-3/4',
        ]"
      >
        <!-- 左侧 Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 px-4 py-3 select-none">
          <img src="/logo-dark.svg" alt="Logo" class="h-7 w-7" />
          <span class="text-sm font-semibold tracking-wide text-white drop-shadow">
            Reborn UI
          </span>
        </NuxtLink>

        <!-- 右侧折叠菜单按钮 -->
        <div class="relative">
          <button
            type="button"
            class="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            :aria-expanded="isMenuOpen ? 'true' : 'false'"
            aria-label="打开菜单"
            @click="toggleMenu"
          >
            <!-- hamburger / close -->
            <span class="sr-only">Menu</span>
            <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>

          <!-- dropdown -->
          <div
            v-if="isMenuOpen"
            class="absolute right-2 top-12 w-56 overflow-hidden rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md shadow-xl shadow-black/20"
          >
            <div class="py-2">
              <NuxtLink
                v-for="item in menuItems"
                :key="item.to"
                :to="item.to"
                class="block px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                @click="closeMenu"
              >
                {{ item.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- 页面内容：留出顶部空间避免被导航遮挡 -->
    <div class="pt-20">
      <slot />
    </div>
    <FluidCursor  />
  </div>
</template>

<script setup lang="ts">
const isScrolled = ref(false);
const isMenuOpen = ref(false);

const menuItems = [
  { label: '首页', to: '/' },
  { label: '文档', to: '/getting-started/introduction' },
  { label: '组件', to: '/components' },
  { label: '安装', to: '/getting-started/installation' },
];


function onScroll() {
  isScrolled.value = (window.scrollY || 0) > 10;
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});

// 路由切换时自动收起
const route = useRoute();
watch(
  () => route.fullPath,
  () => closeMenu(),
);
</script>