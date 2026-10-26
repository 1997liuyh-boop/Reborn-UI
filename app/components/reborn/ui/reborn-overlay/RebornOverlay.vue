<script setup lang="ts">
import { computed, getCurrentInstance, onUnmounted, watch } from "vue";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import { useGlobalScrollLock } from "~/composables/useGlobalScrollLock";
import theme from "./reborn-overlay.config";

interface Props {
  duration?: number;
  lockScroll?: boolean;
  zIndex?: number;
  closeOnClickOverlay?: boolean;
  absolute?: boolean;
  customClass?: string;
  customStyle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 300,
  lockScroll: true,
  zIndex: 100,
  closeOnClickOverlay: true,
  absolute: false,
  customClass: "",
  customStyle: ""
});

// update:modelValue 由下方的 defineModel 声明，这里不再重复
const emit = defineEmits<{
  (e: "close"): void;
  (e: "afterLeave"): void;
}>();

/**
 * 是否显示遮罩（v-model）。未绑定、显式 false / undefined / null 都按隐藏处理。
 * defineModel 只负责声明属性与 update 事件，读写都不经它的本地缓存：只传值时 useModel 会改写缓存；非受控时写进去的值
 * 还会成为受控后「同值不派发」的去重基准，吞掉父级要收的事件。读取按严格受控取父级原始值，写入直接派发事件。
 */
defineModel<boolean>({ default: undefined });
const instance = getCurrentInstance()!;
/**
 * 实际显隐：直接读父级原始值，按严格受控处理，父级不回写（只传值或拒收）就保持父值。
 * 不读 defineModel 的本地缓存（只传值时 useModel 会改写它）；未绑定时恒为隐藏，也就不需要另存本地状态。
 */
const visible = computed(() => !!instance.props.modelValue);

// 全局滚动锁：与 v-loading / showLoading 共享同一个引用计数器（useGlobalScrollLock），避免多套锁互相踩踏
const { acquire: acquireLock, release: releaseLock, isHolding } = useGlobalScrollLock();

let lockTimeout: ReturnType<typeof setTimeout> | undefined;

watch(
  () => visible.value && props.lockScroll,
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
    instance.emit("update:modelValue", false);
    emit("close");
  }
};
</script>
<template>
  <RebornTransition :show="visible" :appear="true" name="fade" :duration="props.duration"
    :custom-class="overlayClass" :custom-style="overlayStyle" :disable-touch-move="props.lockScroll" @click="onClick"
    @after-leave="emit('afterLeave')">
    <slot />
  </RebornTransition>
</template>
