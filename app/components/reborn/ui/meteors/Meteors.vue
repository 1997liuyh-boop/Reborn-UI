<script lang="ts" setup>
import { onMounted, shallowRef, watch } from "vue";

interface Props { count?: number; class?: string }

const props = withDefaults(defineProps<Props>(), { count: 20 });
const meteorStyles = shallowRef<Array<{ left: string; animationDelay: string; animationDuration: string }>>([]);
function generateMeteors() {
  meteorStyles.value = Array.from({ length: Math.max(0, Math.floor(props.count)) }, () => ({
    left: `${Math.floor(Math.random() * 800 - 400)}px`,
    animationDelay: `${Math.random() * 0.6 + 0.2}s`,
    animationDuration: `${Math.floor(Math.random() * 8 + 2)}s`,
  }));
}
onMounted(() => { generateMeteors(); watch(() => props.count, generateMeteors); });
</script>

<template>
  <!-- 根节点是铺满定位父容器的真实盒子：透传的 opacity / transform 等样式能作用到整层流星；
       pointer-events-none 让这一层不拦截下方内容的点击 -->
  <span class="pointer-events-none absolute inset-0">
    <span
      v-for="(style, index) in meteorStyles"
      :key="index"
      class="animate-meteor-effect absolute top-0 h-0.5 w-0.5 rotate-[45deg] rounded-full bg-slate-500 shadow-[0_0_0_1px_#ffffff10] before:absolute before:top-1/2 before:h-px before:w-[50px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']"
      :class="props.class"
      :style="style"
    />
  </span>
</template>
