<script setup lang="ts">
import DeviceFrame from '../device-frame/DeviceFrame.vue'

const props = defineProps<{
  uniapp?: boolean
  url?: string
}>()

const open = ref(false);

const isDesktop = useMediaQuery("(min-width: 768px)");

const items = [{
  label: 'Web',
  icon: 'i-lucide-globe',
  slot: 'web'
}, {
  label: 'UniApp',
  icon: 'i-lucide-smartphone',
  slot: 'uniapp'
}]
const config = useRuntimeConfig();
const nuxtBase = computed(() => {
  // 优先用 runtimeConfig（你自己在 nuxt.config.ts 里配）
  const b = config.public?.appBaseURL || "";
  // 兜底用 Nuxt 内置 app.baseURL（有时是 "/"）
  return (b || config.app?.baseURL || "/")?.replace(/\/+$/, "");
});
const iframeUrl = computed(() => {
  const appBaseURL = nuxtBase.value;
  const src = window.location.origin + appBaseURL + props.url;
  return src;
})
</script>

<template>
  <div class="flex w-full flex-col items-start justify-start gap-4">
    <UPageCard variant="outline" class="bg-default/15 w-full min-w-0" :ui="{
      container: 'w-full min-w-0'
    }">
      <UTabs v-if="uniapp" :items="items" class="w-full">
        <template #web>
          <div class="pt-4">
            <slot name="component" />
          </div>
        </template>
        <template #uniapp>
          <div class="flex justify-center pt-4">
            <DeviceFrame v-if="iframeUrl" :src="iframeUrl" />
            <div v-else class="text-sm text-muted-foreground p-4">
              No Preview URL provided
            </div>
          </div>
        </template>
      </UTabs>
      <slot v-else name="component" />
    </UPageCard>

    <div v-if="$slots.config" class="flex w-full flex-row items-center justify-between">
      <div class="flex flex-col items-start gap-2">
        <span class="text-2xl font-semibold">Playground</span>
        <span class="text-muted italic">Play with props and customize the component.</span>
      </div>
      <UDrawer v-model:open="open" :direction="isDesktop ? 'right' : 'bottom'" :overlay="!isDesktop"
        :dismissible="!isDesktop" :handle="false" :modal="!isDesktop" :inset="isDesktop" :ui="{
          header: 'flex items-center justify-between',
          content: 'bg-default/35 backdrop-blur-3xl md:min-w-md',
        }">
        <UButton label="Customize" variant="solid" trailing-icon="tabler:chevron-right" size="xl" />

        <template #header>
          <div class="flex flex-col gap-2">
            <h2 class="text-highlighted font-semibold">Component Playground</h2>
            <h2 class="text-muted text-sm font-light italic">Customize & play with component.</h2>
          </div>

          <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="open = false" />
        </template>
        <template #body>
          <div class="mt-4 grid grid-cols-1 gap-4 overflow-y-auto p-1">
            <slot name="config" />
          </div>
        </template>
      </UDrawer>
    </div>
  </div>
</template>
