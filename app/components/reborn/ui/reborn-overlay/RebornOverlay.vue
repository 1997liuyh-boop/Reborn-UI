<script setup lang="ts">
import { computed, watch, onUnmounted } from "vue";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import { useGlobalScrollLock } from "~/composables/useGlobalScrollLock";
import theme from "./reborn-overlay.config";

interface Props {
  modelValue?: boolean;
  duration?: number;
  lockScroll?: boolean;
  zIndex?: number;
  closeOnClickOverlay?: boolean;
  absolute?: boolean;
  customClass?: string;
  customStyle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  duration: 300,
  lockScroll: true,
  zIndex: 100,
  closeOnClickOverlay: true,
  absolute: false,
  customClass: "",
  customStyle: ""
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "afterLeave"): void;
}>();

// 全局滚动锁：与 v-loading / useLoading 共享同一个引用计数器（useGlobalScrollLock），避免多套锁互相踩踏
const { acquire: acquireLock, release: releaseLock, isHolding } = useGlobalScrollLock();

let lockTimeout: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.modelValue && props.lockScroll,
  (locked) => {
    if (typeof document === "undefined") return;
    clearTimeout(lockTimeout);

    if (locked) {
      acquireLock();
    } else {
      // 只有当前实例持有锁时，才启动延时释放
      if (isHolding()) {
        lockTimeout = setTimeout(() => {
          releaseLock();
        }, props.duration);
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  clearTimeout(lockTimeout);
  releaseLock();
});

const overlayClass = computed(() => `${props.absolute ? "absolute" : "fixed"} ${theme.base} ${props.customClass}`);
const overlayStyle = computed(() => `z-index:${props.zIndex};${props.customStyle}`);

const onClick = () => {
  if (props.closeOnClickOverlay) {
    emit("update:modelValue", false);
    emit("close");
  }
};
</script>
<template>
  <RebornTransition :show="props.modelValue" :appear="true" name="fade" :duration="props.duration"
    :custom-class="overlayClass" :custom-style="overlayStyle" :disable-touch-move="props.lockScroll" @click="onClick"
    @after-leave="emit('afterLeave')">
    <slot />
  </RebornTransition>
</template>
