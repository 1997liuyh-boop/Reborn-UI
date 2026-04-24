<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";

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
  /** 是否在文本变化时重置 */
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

const displayText = ref("");
const isTyping = ref(false);
const isDeleting = ref(false);
const cursorVisible = ref(true);

// ─── Timer Management ───

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

// ─── Cursor ───

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

// ─── Animation Core ───

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

function startTyping(text: string) {
  emit("start-typing");
  stopCursorBlink();
  typeText(text);
}

function startDeleting(nextText?: string) {
  emit("start-deleting");
  stopCursorBlink();
  deleteText(() => {
    if (nextText) {
      timers.pause = setTimeout(() => startTyping(nextText), props.pauseDuration);
    }
  });
}

// ─── Text Change Handler ───

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

watch(
  () => props.text,
  (newText) => {
    if (props.resetOnChange) handleTextChange(newText);
  },
  { immediate: true },
);

onBeforeUnmount(clearAllTimers);

// ─── Expose ───

defineExpose({
  startTyping,
  startDeleting,
  clear: clearAllTimers,
  displayText,
  isTyping,
  isDeleting,
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
