<script setup lang="ts">
import { onBeforeUnmount, onMounted, readonly, shallowRef, watch } from "vue";

export interface RebornTypewriterProps {
  /** 要显示的文本内容 */
  text: string;
  /** 打字速度（毫秒/字符） */
  typeSpeed?: number;
  /** 删除速度（毫秒/字符） */
  deleteSpeed?: number;
  /** 删除完成后到开始打字的延迟时间（毫秒） */
  pauseDuration?: number;
  /** 光标字符 */
  cursor?: string;
  /** 是否显示光标 */
  showCursor?: boolean;
  /** 光标闪烁速度（毫秒） */
  cursorBlinkSpeed?: number;
  /** 文本变化时是否重新播放（先删旧文本再打新文本）；不影响挂载后的首次播放 */
  resetOnChange?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<RebornTypewriterProps>(), {
  text: "",
  typeSpeed: 50,
  deleteSpeed: 30,
  pauseDuration: 500,
  cursor: "|",
  showCursor: true,
  cursorBlinkSpeed: 530,
  resetOnChange: true,
  class: "",
});

const emit = defineEmits<{
  /** 打字完成事件 */
  typed: [];
  /** 删除完成事件 */
  deleted: [];
  /** 开始打字事件 */
  "start-typing": [];
  /** 开始删除事件 */
  "start-deleting": [];
}>();

const displayText = shallowRef("");
const isTyping = shallowRef(false);
const isDeleting = shallowRef(false);
const cursorVisible = shallowRef(true);

// ─── 定时器管理 ───

type Timer = ReturnType<typeof setTimeout>;

const timers = {
  type: null as Timer | null,
  delete: null as Timer | null,
  cursor: null as Timer | null,
  pause: null as Timer | null,
};

function clearTimer(key: keyof typeof timers) {
  if (timers[key] !== null) {
    key === "cursor" ? clearInterval(timers[key]!) : clearTimeout(timers[key]!);
    timers[key] = null;
  }
}

function clearAllTimers() {
  (Object.keys(timers) as Array<keyof typeof timers>).forEach(clearTimer);
}

// ─── 光标 ───

function startCursorBlink() {
  if (!props.showCursor) return;

  cursorVisible.value = true;
  clearTimer("cursor");
  timers.cursor = setInterval(() => {
    cursorVisible.value = !cursorVisible.value;
  }, props.cursorBlinkSpeed);
}

function stopCursorBlink() {
  clearTimer("cursor");
  cursorVisible.value = true;
}

// ─── 打字与删除 ───

function typeText(target: string, index = 0) {
  if (index >= target.length) {
    isTyping.value = false;
    emit("typed");
    startCursorBlink();
    return;
  }

  isTyping.value = true;
  displayText.value = target.slice(0, index + 1);
  timers.type = setTimeout(() => typeText(target, index + 1), props.typeSpeed);
}

function deleteText(onComplete?: () => void) {
  if (displayText.value.length === 0) {
    isDeleting.value = false;
    emit("deleted");
    onComplete?.();
    return;
  }

  isDeleting.value = true;
  displayText.value = displayText.value.slice(0, -1);
  timers.delete = setTimeout(() => deleteText(onComplete), props.deleteSpeed);
}

/**
 * 中断在途的打字 / 删除 / 停顿。
 * 通过 ref 手动调用时可能正有一条定时器链在跑，不先清掉会并行出现两条链，
 * 句柄只记得最后一个，另一条卸载后仍会跑完并留下永不清除的光标 interval
 */
function interrupt() {
  clearAllTimers();
  isTyping.value = false;
  isDeleting.value = false;
}

function startTyping(text: string) {
  interrupt();
  emit("start-typing");
  stopCursorBlink();
  typeText(text);
}

function startDeleting(nextText?: string) {
  interrupt();
  emit("start-deleting");
  stopCursorBlink();
  deleteText(() => {
    if (nextText) {
      timers.pause = setTimeout(() => startTyping(nextText), props.pauseDuration);
    }
  });
}

// ─── 文本变化 ───

function handleTextChange(newText: string) {
  clearAllTimers();

  if (!displayText.value && newText) {
    startTyping(newText);
  } else if (displayText.value && !newText) {
    startDeleting();
  } else if (displayText.value !== newText) {
    startDeleting(newText);
  }
}

// 首次播放放在挂载后：SSR 不执行 onMounted，服务端不会启动定时器；
// immediate watch 会在服务端 setup 里同步跑完打字并留下一个永不清理的光标 interval
onMounted(() => handleTextChange(props.text));

watch(
  () => props.text,
  (newText) => {
    if (props.resetOnChange) handleTextChange(newText);
  },
);

onBeforeUnmount(clearAllTimers);

// ─── 对外暴露 ───

defineExpose({
  startTyping,
  startDeleting,
  clear: clearAllTimers,
  /** 当前已显示的文本，只读：状态只能经 startTyping / startDeleting 改变，外部写入会打乱定时器链 */
  displayText: readonly(displayText),
  /** 是否正在打字，只读 */
  isTyping: readonly(isTyping),
  /** 是否正在删除，只读 */
  isDeleting: readonly(isDeleting),
});
</script>

<template>
  <span :class="props.class">
    <span class="inline">{{ displayText }}</span>
    <span
      v-if="showCursor"
      class="inline-block ml-px font-normal"
      :class="{ 'opacity-0': !cursorVisible && !isTyping && !isDeleting }"
    >
      {{ cursor }}
    </span>
  </span>
</template>
