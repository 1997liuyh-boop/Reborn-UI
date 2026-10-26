<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { onBeforeUnmount, ref, useTemplateRef } from "vue";

interface RippleButtonProps {
  class?: HTMLAttributes["class"];
  rippleColor?: string;
  duration?: number;
}

const props = withDefaults(defineProps<RippleButtonProps>(), {
  rippleColor: "#ADD8E6",
  duration: 600,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const rippleButtonRef = useTemplateRef<HTMLButtonElement>("rippleButtonRef");
const buttonRipples = ref<Array<{ x: number; y: number; size: number; key: number }>>([]);

/** 涟漪的自增 key：Date.now() 在同一毫秒内连点会重复 */
let rippleKey = 0;
/** 各涟漪的移除定时器，卸载时统一清除 */
const removeTimers = new Set<ReturnType<typeof setTimeout>>();

function handleClick(event: MouseEvent) {
  createRipple(event);
  emit("click", event);
}

function createRipple(event: MouseEvent) {
  const button = rippleButtonRef.value;
  if (!button) return;

  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const key = ++rippleKey;
  buttonRipples.value.push({ x, y, size, key });

  // 每条涟漪在创建时各排一个移除定时器：事件驱动的清理放在事件处理里，
  // 用 watchEffect 驱动会在每次增删时重跑，给剩下的涟漪重复排定时器
  const timer = setTimeout(() => {
    removeTimers.delete(timer);
    buttonRipples.value = buttonRipples.value.filter(ripple => ripple.key !== key);
  }, props.duration);
  removeTimers.add(timer);
}

onBeforeUnmount(() => {
  removeTimers.forEach(clearTimeout);
  removeTimers.clear();
});
</script>

<template>
  <button
    ref="rippleButtonRef"
    class="bg-background text-primary relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 px-4 py-2 text-center"
    :class="[$props.class]"
    :style="{ '--duration': `${$props.duration}ms` }"
    @click="handleClick"
  >
    <div class="relative z-10">
      <slot />
    </div>

    <span class="pointer-events-none absolute inset-0">
      <span
        v-for="ripple in buttonRipples"
        :key="ripple.key"
        class="ripple-animation bg-background absolute rounded-full opacity-30"
        :style="{
          width: `${ripple.size}px`,
          height: `${ripple.size}px`,
          top: `${ripple.y}px`,
          left: `${ripple.x}px`,
          backgroundColor: $props.rippleColor,
          transform: 'scale(0)',
          animationDuration: `${$props.duration}ms`,
        }"
      />
    </span>
  </button>
</template>

<style scoped>
@keyframes rippling {
  0% {
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.ripple-animation {
  animation: rippling var(--duration) ease-out;
}
</style>
