<script setup lang="ts">
/**
 * AppToolsFab —— 桌面端左下角的工具悬浮菜单（AI 助手 / 主题色 / 明暗模式 / GitHub）
 *
 * 按钮使用主题底色和像素阶梯角，投影是错开 3px 的同形色块。展开时只隐藏触发器的投影。
 */
import RebornFab from "~/components/reborn/ui/reborn-fab/RebornFab.vue";

interface Props {
  /** GitHub 仓库地址，为空时不显示该项 */
  githubUrl?: string;
}

const props = defineProps<Props>();

const open = shallowRef(false);

const { isEnabled: isAssistantEnabled, toggle: toggleAssistant } = useAssistant();
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

function onAssistant() {
  open.value = false;
  toggleAssistant();
}

function onToggleColorMode() {
  colorMode.preference = isDark.value ? "light" : "dark";
}

/** 点到菜单与色块浮层以外的地方时收起 */
function onDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return;
  const target = event.target as Element | null;
  if (target?.closest("[data-app-tools-fab], .app-theme-picker-content")) return;
  open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown, true);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <RebornFab
    v-model="open"
    data-app-tools-fab
    position="left-bottom"
    :left="80"
    :bottom="80"
    direction="top"
    :z-index="60"
    :ui="{ root: 'max-lg:hidden', actions: 'gap-2.5' }"
  >
    <template #trigger="{ isActive }">
      <span class="pixel-btn-wrap">
        <span v-if="!isActive" class="pixel-shadow" />
        <span
          class="pixel-glass bg-gray-1 size-12"
          role="button"
          tabindex="0"
          :aria-expanded="isActive"
          aria-label="站点工具"
          title="站点工具"
          @keydown.enter.prevent="open = !open"
          @keydown.space.prevent="open = !open"
        >
          <Icon :name="isActive ? 'lucide:x' : 'lucide:layout-grid'" class="size-5" />
        </span>
      </span>
    </template>

    <!-- 操作项：自下而上排列，第一项紧挨触发按钮 -->
    <span v-if="isAssistantEnabled" class="pixel-btn-wrap">
      <span class="pixel-shadow" />
      <button type="button" class="pixel-glass bg-gray-1 size-10" aria-label="AI 助手" @click="onAssistant">
        <Icon name="lucide:sparkles" class="size-4.5" />
      </button>
      <span class="pixel-label">AI 助手</span>
    </span>

    <span class="pixel-btn-wrap">
      <span class="pixel-shadow" />
      <AppThemePicker placement="right-end">
        <template #trigger="{ open: pickerOpen }">
          <button type="button" class="pixel-glass bg-gray-1 size-10" :class="{ 'is-on': pickerOpen }" aria-label="切换主题颜色">
            <Icon name="lucide:palette" class="size-4.5" />
          </button>
        </template>
      </AppThemePicker>
      <span class="pixel-label">主题色</span>
    </span>

    <span class="pixel-btn-wrap">
      <span class="pixel-shadow" />
      <button
        type="button" class="pixel-glass bg-gray-1 size-10" :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
        @click="onToggleColorMode"
      >
        <Icon :name="isDark ? 'lucide:moon' : 'lucide:sun'" class="size-4.5" />
      </button>
      <span class="pixel-label">{{ isDark ? "深色" : "浅色" }}</span>
    </span>

    <span v-if="props.githubUrl" class="pixel-btn-wrap">
      <span class="pixel-shadow" />
      <a
        :href="props.githubUrl" target="_blank" rel="noopener" class="pixel-glass bg-gray-1 size-10" aria-label="GitHub"
        @click="open = false"
      >
        <Icon name="simple-icons:github" class="size-4.5" />
      </a>
      <span class="pixel-label">GitHub</span>
    </span>
  </RebornFab>
</template>

<style scoped>
/* 像素阶梯角：每个角切两级台阶，台阶边长 --px */
.pixel-glass,
.pixel-shadow {
  --px: 3px;
  clip-path: polygon(
    0 calc(var(--px) * 2), var(--px) calc(var(--px) * 2), var(--px) var(--px), calc(var(--px) * 2) var(--px), calc(var(--px) * 2) 0,
    calc(100% - var(--px) * 2) 0, calc(100% - var(--px) * 2) var(--px), calc(100% - var(--px)) var(--px), calc(100% - var(--px)) calc(var(--px) * 2), 100% calc(var(--px) * 2),
    100% calc(100% - var(--px) * 2), calc(100% - var(--px)) calc(100% - var(--px) * 2), calc(100% - var(--px)) calc(100% - var(--px)), calc(100% - var(--px) * 2) calc(100% - var(--px)), calc(100% - var(--px) * 2) 100%,
    calc(var(--px) * 2) 100%, calc(var(--px) * 2) calc(100% - var(--px)), var(--px) calc(100% - var(--px)), var(--px) calc(100% - var(--px) * 2), 0 calc(100% - var(--px) * 2)
  );
}

.pixel-btn-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* 错开 3px 的硬投影：外层只有按钮占位（标签是绝对定位），铺满外层即与按钮同形同大 */
.pixel-shadow {
  position: absolute;
  inset: 0;
  translate: 3px 3px;
  background: color-mix(in oklab, var(--ui-text-highlighted) 28%, transparent);
  pointer-events: none;
}

.pixel-glass {
  position: relative;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--ui-text-highlighted);
  /* 外圈像素描边 + 左上高光，台阶角处自然断开 */
  box-shadow:
    inset 0 0 0 2px color-mix(in oklab, var(--ui-text-highlighted) 30%, transparent),
    inset 3px 3px 0 0 color-mix(in oklab, white 22%, transparent);
  transition: color 150ms, translate 120ms steps(2);
}

.pixel-glass:hover,
.pixel-glass.is-on {
  color: var(--color-primary);
}

/* 按下时向投影方向沉 2 个像素，像素风的按键反馈 */
.pixel-glass:active {
  translate: 2px 2px;
}

.pixel-glass:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

/* 悬停时右侧弹出的等宽小标签 */
.pixel-label {
  position: absolute;
  left: calc(100% + 10px);
  padding: 2px 6px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  color: var(--ui-text-highlighted);
  background: color-mix(in oklab, var(--ui-bg) 70%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ui-text-highlighted) 25%, transparent);
  opacity: 0;
  translate: -4px 0;
  pointer-events: none;
  transition: opacity 120ms, translate 120ms steps(2);
}

.pixel-btn-wrap:hover > .pixel-label {
  opacity: 1;
  translate: 0 0;
}
</style>
