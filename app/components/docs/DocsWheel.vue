<script setup lang="ts">
/**
 * DocsWheel —— 拨轮式导航
 *
 * 条目排在一个圆柱面上并首尾相接，高亮卡片标出当前对准的条目。滚轮只转拨轮、不滚页面；
 * 点中线卡片、左侧箭头或任意条目才触发 confirm，跳转由使用方完成。
 * currentKey 变化（页面换了）时拨轮转到对应条目；拨了没点就离开，过一会儿转回 currentKey。
 */
import { useElementSize, usePreferredReducedMotion } from "@vueuse/core";

/** 拨轮上的一行 */
export interface DocsWheelRow {
  /** 唯一标识；item 行用它与 currentKey 比对 */
  key: string;
  /** 显示文字 */
  label: string;
  /** 层级，大于 1 时缩进一档 */
  depth?: number;
  /** 条目所属的菜单分类 */
  category?: string;
}

interface Props {
  /** 全部行，按显示顺序 */
  rows: DocsWheelRow[];
  /** 当前所在条目的 key */
  currentKey?: string;
  /** 无障碍名称 */
  label?: string;
  /** 中线左侧箭头的图标 */
  arrowIcon?: string;
  /** 滚轮累计多少像素转一格 */
  stepDelta?: number;
  /** 拨了没点、离开后多久转回当前条目，单位毫秒 */
  revertDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  label: "导航",
  arrowIcon: "akar-icons:triangle-right-fill",
  stepDelta: 60,
  revertDelay: 2400,
});

const emit = defineEmits<{
  /** 用户确认跳到某一行 */
  confirm: [row: DocsWheelRow];
}>();

/** 连续下标用于动画与 DOM 键，取模后才用于查菜单数据。 */
function rowAt(index: number): DocsWheelRow | undefined {
  const length = props.rows.length;
  if (length) return props.rows[((index % length) + length) % length];
}

const looping = computed(() => props.rows.length > 1);

/** 当前页在菜单数据中的下标，缺省时选择第一项。 */
const currentIndex = computed(() => Math.max(0, props.rows.findIndex((row) => row.key === props.currentKey)));

/** 目标行用于按键及确认，实际位置用于绘制和裁切。 */
const wheelIndex = shallowRef(currentIndex.value);
const position = shallowRef(currentIndex.value);
const centerIndex = computed(() => Math.round(position.value));
const centerRow = computed(() => rowAt(centerIndex.value));
const targetRow = computed(() => rowAt(wheelIndex.value));
const pending = computed(() => targetRow.value !== props.rows[currentIndex.value]);

/** 回到当前页或跳到首尾时，采用距离画面最近的一圈。 */
function nearestIndex(index: number) {
  if (!looping.value) return index;
  const length = props.rows.length;
  const turn = Math.round((position.value - index) / length);
  return index + turn * length;
}

const wheelActive = shallowRef(false);
const arrowReady = computed(() => pending.value && !wheelActive.value && position.value === wheelIndex.value);

const reducedMotion = usePreferredReducedMotion();
const TURN_DURATION = 280;
let turnFrame = 0;
let lastTurnFrameAt = 0;
let turnFrom = position.value;
let turnStartedAt = 0;

function updatePosition(now: number) {
  lastTurnFrameAt = now;
  const progress = Math.max(0, Math.min(1, (now - turnStartedAt) / TURN_DURATION));
  const target = wheelIndex.value;
  position.value = progress === 1 ? target : turnFrom + (target - turnFrom) * (1 - (1 - progress) ** 3);
  turnFrame = progress < 1 ? requestAnimationFrame(updatePosition) : 0;
}

// 动画和可见窗口共用实际位置；连续输入复用同一个渲染帧。
watch(wheelIndex, (target) => {
  if (position.value === target || reducedMotion.value === "reduce") {
    cancelAnimationFrame(turnFrame);
    turnFrame = 0;
    position.value = target;
    return;
  }

  turnFrom = position.value;
  turnStartedAt = turnFrame ? lastTurnFrameAt : performance.now();
  if (!turnFrame) turnFrame = requestAnimationFrame(updatePosition);
});

// 平台切换后行下标的含义可能变化，立即对齐当前页。
watch(() => props.rows, () => {
  cancelAnimationFrame(turnFrame);
  turnFrame = 0;
  wheelIndex.value = currentIndex.value;
  position.value = currentIndex.value;
});
watch(currentIndex, (index) => {
  if (targetRow.value !== props.rows[index]) wheelIndex.value = nearestIndex(index);
});

/* ── 圆柱几何：由容器高度推出半径、每格角度与可见行数 ───────────── */

const ROW_HEIGHT = 51;
const PERSPECTIVE = 1400;
/** 露出到 52°，边缘行仍有足够的高度可以阅读。 */
const MAX_ANGLE = (52 * Math.PI) / 180;
/** 首帧按常见桌面高度预留可见行，单项菜单仍贴住顶部。 */
const FALLBACK_HEIGHT = 960;

const rootRef = useTemplateRef<HTMLElement>("root");
const { height } = useElementSize(rootRef);

const geometry = computed(() => {
  const size = height.value || FALLBACK_HEIGHT;
  const edge = Math.max(0, size / 2 - 24);
  // 将透视缩短计入半径，令第一行与最后一行靠近可视区边缘。
  const radius = Math.max(60, edge / (Math.sin(MAX_ANGLE) - edge * (1 - Math.cos(MAX_ANGLE)) / PERSPECTIVE));
  const step = 2 * Math.atan(ROW_HEIGHT / (2 * radius));
  return { size, radius, step, range: MAX_ANGLE / step };
});

/** 循环时保持高亮居中，只有一项时让内容贴近顶部。 */
const drumCenter = computed(() => {
  const { range } = geometry.value;
  return looping.value ? position.value : Math.max(range, position.value);
});

const rootStyle = computed(() => {
  const { size, radius, step, range } = geometry.value;
  const angle = (position.value - drumCenter.value) * step;
  const scale = PERSPECTIVE / (PERSPECTIVE + radius * (1 - Math.cos(angle)));
  const offset = radius * Math.sin(angle) * scale;
  let drumShift = "0px";
  if (!looping.value && !height.value && drumCenter.value === range) drumShift = `calc(${size / 2}px - 50%)`;

  return {
    "--row": `${ROW_HEIGHT}px`,
    "--perspective": `${PERSPECTIVE}px`,
    "--r": `${radius}px`,
    "--step": `${(step * 180) / Math.PI}deg`,
    "--drum-shift": drumShift,
    "--indicator-top": `calc(50% + var(--drum-shift) + ${offset}px)`,
    "--indicator-height": `${ROW_HEIGHT * Math.cos(angle) * scale}px`,
    "--indicator-inset": `${(1 - scale) * 50}%`,
  };
});

/** 按实际位置裁切，首尾交界处也保留连续的前后条目。 */
const windowStart = computed(() => Math.floor(drumCenter.value - geometry.value.range - 1));
const windowEnd = computed(() => Math.ceil(drumCenter.value + geometry.value.range + 1));
const visibleRows = computed(() => {
  const start = looping.value ? windowStart.value : Math.max(0, windowStart.value);
  const end = looping.value ? windowEnd.value : Math.min(props.rows.length - 1, windowEnd.value);
  const rows: { row: DocsWheelRow; index: number }[] = [];
  for (let index = start; index <= end; index++) {
    const row = rowAt(index);
    if (row) rows.push({ row, index });
  }
  return rows;
});

/** 短菜单的重复行只用于视觉补位，辅助技术只读取最近的一圈。 */
function isRepeated(index: number) {
  const start = centerIndex.value - Math.floor(props.rows.length / 2);
  return looping.value && (index < start || index >= start + props.rows.length);
}

function rowStyle(index: number) {
  const distance = index - drumCenter.value;
  const angle = Math.min(Math.abs(distance) * geometry.value.step, Math.PI / 2);
  const edgeFade = Math.max(0, Math.min(1, geometry.value.range + 1 - Math.abs(distance)));
  return {
    "--d": distance,
    // 保持两端文字清晰，只在出入窗口时做一格淡出。
    "opacity": (edgeFade * (0.65 + Math.cos(angle) * 0.35)).toFixed(3),
    "pointer-events": edgeFade === 0 ? "none" : undefined,
  };
}

/* ── 转动与确认 ─────────────────────────────────────────────────── */

function rotate(steps: number) {
  if (looping.value) wheelIndex.value += steps;
}

/** 确认指定条目，缺省时使用拨轮的目标项。 */
function confirm(index = wheelIndex.value) {
  const row = rowAt(index);
  if (!row) return;
  wheelIndex.value = index;
  emit("confirm", row);
}

let wheelSum = 0;
let wheelIdleTimer = 0;

function onWheel(event: WheelEvent) {
  // 指针在拨轮上时滚轮只转拨轮，不滚页面
  event.preventDefault();
  // deltaMode 为 1 时单位是行（Firefox 鼠标滚轮），折成像素
  wheelSum += event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
  clearTimeout(wheelIdleTimer);
  wheelActive.value = true;
  wheelIdleTimer = window.setTimeout(() => {
    wheelSum = 0;
    wheelActive.value = false;
  }, 200);
  const steps = Math.trunc(wheelSum / props.stepDelta);
  if (!steps) return;
  wheelSum -= steps * props.stepDelta;
  rotate(steps);
}

function onKeydown(event: KeyboardEvent) {
  const page = Math.max(1, Math.floor(geometry.value.range));
  const actions: Record<string, () => void> = {
    ArrowDown: () => rotate(1),
    ArrowUp: () => rotate(-1),
    PageDown: () => rotate(page),
    PageUp: () => rotate(-page),
    Home: () => { wheelIndex.value = nearestIndex(0); },
    End: () => { wheelIndex.value = nearestIndex(Math.max(0, props.rows.length - 1)); },
    Enter: () => confirm(),
    " ": () => confirm(),
  };
  const action = actions[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

let revertTimer = 0;

function scheduleRevert() {
  clearTimeout(revertTimer);
  if (!pending.value) return;
  revertTimer = window.setTimeout(() => (wheelIndex.value = nearestIndex(currentIndex.value)), props.revertDelay);
}

function cancelRevert() {
  clearTimeout(revertTimer);
}

onBeforeUnmount(() => {
  cancelAnimationFrame(turnFrame);
  clearTimeout(wheelIdleTimer);
  clearTimeout(revertTimer);
});

/** 行的 DOM id，供 aria-activedescendant 指向中线上的那行 */
const wheelId = useId();
function optionId(index: number) {
  return `${wheelId}-option-${index}`;
}
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <slot name="header" :row="centerRow" />

    <div
      ref="root" class="docs-wheel group/wheel relative min-h-0 flex-1 outline-none [mask-image:linear-gradient(transparent,#000_28%,#000_72%,transparent)]" role="listbox" tabindex="0" :aria-label="label"
      :style="rootStyle" :aria-activedescendant="centerRow ? optionId(centerIndex) : undefined"
      :data-pending="pending" :data-arrow-ready="arrowReady"
      @wheel="onWheel" @keydown="onKeydown" @mouseenter="cancelRevert" @mouseleave="scheduleRevert"
      @focus="cancelRevert" @blur="scheduleRevert"
    >
      <!-- 中线卡片：标出对准的条目 -->
      <i
        v-if="targetRow" aria-hidden="true"
        class="docs-wheel-card pointer-events-none absolute inset-x-(--indicator-inset) top-(--indicator-top) h-(--indicator-height) -translate-y-1/2 border-y border-gray-10/10 bg-gray-10/5 transition-colors duration-250 group-data-[pending=true]/wheel:border-primary/45 group-data-[pending=true]/wheel:bg-primary/10 group-focus-visible/wheel:border-y-2 group-focus-visible/wheel:border-primary"
      />

      <div class="docs-wheel-drum">
        <a
          v-for="{ row, index } in visibleRows" :id="optionId(index)" :key="`${index}:${row.key}`"
          :href="row.key" role="option" tabindex="-1"
          class="docs-wheel-row pr-3" :class="(row.depth ?? 1) > 1 ? 'is-sub pl-13' : 'pl-10'"
          :aria-selected="index === centerIndex"
          :aria-hidden="isRepeated(index) || undefined"
          :data-current="row === rows[currentIndex] ? '' : undefined"
          :style="rowStyle(index)" @click.prevent="confirm(index)"
        >
          <span class="truncate">{{ row.label }}</span>
        </a>
      </div>

      <!-- 左侧箭头：拨轮停稳后提示确认，图标和按钮的点击范围分开 -->
      <button
        v-if="targetRow" type="button" tabindex="-1"
        class="docs-wheel-arrow absolute top-(--indicator-top) left-[calc(var(--indicator-inset)+0.5rem)] z-1 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-gray-6 hover:text-gray-10"
        :aria-label="`前往「${targetRow.label}」`" @click="confirm()"
      >
        <UIcon :name="arrowIcon" class="docs-wheel-arrow-icon size-3.5" />
      </button>

      <!-- 模糊只覆盖上下边缘，向中心渐退。 -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-2 backdrop-blur-[4px] [mask-image:linear-gradient(#000,#000_10%,transparent_28%,transparent_72%,#000_90%,#000)]"
      />
    </div>
  </div>
</template>

<style scoped>
/*
 * 每行绕 X 轴转 --d 格再沿 Z 轴推出半径 --r，整体后撤一个半径，中线上的那行正好落回 z=0 不放大。
 * --r 与 --step 由脚本按容器高度算出后写在根节点上。
 */
.docs-wheel {
  --wheel-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  perspective: var(--perspective);
  perspective-origin: 50% calc(50% + var(--drum-shift));
}

.docs-wheel-drum {
  position: absolute;
  inset: 0;
  transform: translateY(var(--drum-shift)) translateZ(calc(var(--r) * -1));
  transform-style: preserve-3d;
}

.docs-wheel-row {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--row);
  margin-top: calc(var(--row) / -2);
  color: var(--color-gray-8);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transform: rotateX(calc(var(--d) * var(--step) * -1)) translateZ(var(--r));
  backface-visibility: hidden;
  transition: color 0.2s;
}

.docs-wheel-row.is-sub {
  font-size: 13px;
}

.docs-wheel-row:hover {
  color: var(--color-gray-10);
}

/* 当前所在条目：拨到别处时仍能看出自己在哪 */
.docs-wheel-row[data-current] {
  color: var(--color-primary);
}

.docs-wheel-row[aria-selected="true"] {
  color: var(--color-gray-10);
  font-weight: 500;
}

.docs-wheel-row[aria-selected="true"][data-current] {
  color: var(--color-primary);
}

/* 点击范围保持固定，停稳后只轻推一次三角图标。 */
.docs-wheel[data-arrow-ready="true"] .docs-wheel-arrow {
  background: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 20%, transparent);
  color: var(--color-primary-foreground);
}

@media (prefers-reduced-motion: no-preference) {
  .docs-wheel[data-arrow-ready="true"] .docs-wheel-arrow-icon {
    animation: docs-wheel-nudge 320ms var(--wheel-ease);
  }
}

@keyframes docs-wheel-nudge {
  50% {
    transform: translateX(3px);
  }
}

</style>
