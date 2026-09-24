<script setup lang="ts">
import type { ClassValue } from "clsx";
import type {
  RateColors,
  rateColors,
  RateIcons,
  RateIconSource,
  RateSegment,
  RateSegmentColor,
  rateSizes,
  RateTrigger,
} from "./reborn-rate.config";
import { computed, ref, watch } from "vue";

import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-rate.config";

defineOptions({
  name: "RebornRate",
});

const props = withDefaults(defineProps<RateProps>(), {
  modelValue: 0,
  count: 5,
  allowHalf: false,
  clearable: false,
  showValue: false,
  disabled: false,
  readonly: false,
  icon: "carbon:star",
  activeIcon: "carbon:star-filled",
  lowThreshold: 2,
  highThreshold: 4,
  size: "md",
  color: "warning",
  trigger: "click",
  ui: () => ({}),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "change", value: number): void;
}>();

export interface RateProps {
  /** 当前评分 */
  modelValue?: number;
  /** 星星总数，也是最大分值：分数与自定义文案都以它为上限 */
  count?: number;
  /** 允许半星 */
  allowHalf?: boolean;
  /** 再次点击当前分值时是否清零 */
  clearable?: boolean;
  /** 显示分数 */
  showValue?: boolean;
  /** 分数区域的自定义文案：接收已提交的分值、返回要显示的文字，传入后无需 showValue；更复杂的内容请用 value 插槽 */
  formatText?: (value: number) => string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 未选中图标 (Nuxt Icon name) */
  icon?: string;
  /** 选中图标 (Nuxt Icon name)；传了 icons 时以分段结果为准 */
  activeIcon?: string;
  /** 半星选中图标 (Nuxt Icon name) */
  halfIcon?: string;
  /**
   * 选中图标按分段自定义，所有点亮的星统一使用当前分值命中的那一段：
   * 数组按 lowThreshold / highThreshold 分低、中、高三段；
   * 对象以键为分段上界（含），值为 { type, url }，type 取 icon（Nuxt Icon 名）或 image（图片地址），
   * excluded 为 true 时该段不含上界本身
   */
  icons?: RateIcons;
  /**
   * 选中图标颜色按分段自定义，分段规则同 icons：
   * 数组为低、中、高三段颜色；对象的值为颜色字符串或 { value, excluded }。不传时沿用 color 语义色
   */
  colors?: RateColors;
  /** 低分界限（含），配合数组形式的 colors / icons */
  lowThreshold?: number;
  /** 高分界限（不含），配合数组形式的 colors / icons */
  highThreshold?: number;
  /** 未选中图标颜色；不传时为文字色的 30% 不透明度 */
  voidColor?: string;
  /** 尺寸 */
  size?: (typeof rateSizes)[number];
  /** 颜色 */
  color?: (typeof rateColors)[number];
  /**
   * 切换分数的触发方式：
   * click（默认）悬停只做预览、点击才提交，开启 clearable 后再点同一分值清零；
   * hover 指针滑到哪颗就把分数改到哪颗，无需点击。触控端没有悬停事件，等同 click
   */
  trigger?: RateTrigger;
  /** 样式覆盖 */
  ui?: Partial<{
    wrapper: ClassValue;
    star: ClassValue;
    icon: ClassValue;
    iconActive: ClassValue;
    value: ClassValue;
  }>;
  /** 自定义 class */
  class?: any;
}

const isInteractive = computed(() => !props.disabled && !props.readonly);

// ui 样式系统
const uiOverrides = computed(() => props.ui || {});
const b = tv(theme);

const ui = computed(() => {
  const styles = b({
    size: props.size as any,
    color: props.color,
    disabled: props.disabled,
    readonly: props.readonly,
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    star: (opts?: { class?: any }) =>
      styles.star({ class: cn(opts?.class, uiOverrides.value.star) }),
    icon: (opts?: { class?: any }) =>
      styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    iconActive: (opts?: { class?: any }) =>
      styles.iconActive({ class: cn(opts?.class, uiOverrides.value.iconActive) }),
    value: (opts?: { class?: any }) =>
      styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
  };
});

/** 把分值夹在 0 ~ count 之间 */
function clamp(value: number) {
  return Math.max(0, Math.min(props.count, value));
}

// 当前评分（已提交的值）
const currentValue = ref<number>(clamp(props.modelValue));

// 判断当前星星是否为半星状态
function isHalf(index: number): boolean {
  return props.allowHalf && currentValue.value >= index - 0.5 && currentValue.value < index;
}

/** 单颗星的选中图标名：半星优先用 halfIcon，其余用 activeIcon（未传 icons 时的默认逻辑） */
function getActiveIcon(index: number) {
  if (isHalf(index)) {
    return props.halfIcon ?? props.activeIcon;
  }
  return props.activeIcon;
}

// Web 增强：鼠标移动时按指针位置换算分数。click 模式只做悬停预览（hoverValue），hover 模式直接写入分数
const hoverValue = ref(-1);
let moveRaf = 0;

/**
 * 点击后锁住的预览位（click 模式）：指针仍停在刚点过的那颗星上时不再做悬停预览，
 * 否则清零后指针稍一移动，那几颗星又会以预览态亮起来，看起来像没清掉；移到别的星或移出后解锁
 */
const lockedPreview = ref<number | null>(null);

/** 当前展示的分值：悬停预览优先，其次是已提交的值。只驱动星形（点亮、分段颜色、分段图标）；分数与自定义文案显示已提交的值 */
const displayValue = computed(() =>
  hoverValue.value >= 0 ? hoverValue.value : currentValue.value,
);

function isHalfDisplay(index: number): boolean {
  return props.allowHalf && displayValue.value >= index - 0.5 && displayValue.value < index;
}

function isActiveDisplay(index: number): boolean {
  return (
    displayValue.value >= index - (props.allowHalf ? 0.5 : 0) && displayValue.value >= index - 0.5
  );
}

// ─── 分段颜色 / 分段图标 ─────────────────────────────────────

/**
 * 按分段表取值：键为分段上界，升序找到第一个 value <= 上界 的段（excluded 为 true 时要求 value < 上界）。
 * 例如 { 2: A, 4: { value: B, excluded: true }, 5: C }：0 ~ 2 取 A，2 ~ 4（不含 4）取 B，4 ~ 5 取 C
 */
function pickSegment<T extends RateSegment>(value: number, map: Record<number, T>): T | undefined {
  const keys = Object.keys(map)
    .map(Number)
    .filter((key) => !Number.isNaN(key))
    .sort((a, b) => a - b);
  const hit = keys.find((key) => (map[key]!.excluded ? value < key : value <= key));
  return hit === undefined ? undefined : map[hit];
}

/** 颜色分段表：数组转成低（<= lowThreshold）、中（< highThreshold）、高（<= count）三段；对象里的纯字符串包装成 { value } */
const colorSegments = computed<Record<number, RateSegmentColor> | undefined>(() => {
  const source = props.colors;
  if (!source) return undefined;
  if (Array.isArray(source)) {
    const [low = "", mid = "", high = ""] = source;
    return {
      [props.lowThreshold]: { value: low },
      [props.highThreshold]: { value: mid, excluded: true },
      [props.count]: { value: high },
    };
  }
  const out: Record<number, RateSegmentColor> = {};
  for (const [key, item] of Object.entries(source)) {
    out[Number(key)] = typeof item === "string" ? { value: item } : item;
  }
  return out;
});

/** 图标分段表：数组转三段，规则同颜色 */
const iconSegments = computed<Record<number, RateIconSource> | undefined>(() => {
  const source = props.icons;
  if (!source) return undefined;
  if (Array.isArray(source)) {
    const [low, mid, high] = source;
    const out: Record<number, RateIconSource> = {};
    if (low) out[props.lowThreshold] = low;
    if (mid) out[props.highThreshold] = { ...mid, excluded: true };
    if (high) out[props.count] = high;
    return out;
  }
  return source;
});

/** 当前展示分值命中的选中色；为空则沿用 color 变体的语义色 */
const activeColor = computed(() =>
  colorSegments.value ? pickSegment(displayValue.value, colorSegments.value)?.value : undefined,
);

/** 当前展示分值命中的选中图标；为空则沿用 activeIcon / halfIcon */
const activeSource = computed(() =>
  iconSegments.value ? pickSegment(displayValue.value, iconSegments.value) : undefined,
);

/** 选中层内联样式：半星裁掉右半边；命中分段颜色时用内联色盖过 color 变体的类名 */
function activeStyle(index: number) {
  const style: Record<string, string> = {};
  if (isHalfDisplay(index)) style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0 100%)";
  if (activeColor.value) style.color = activeColor.value;
  return style;
}

/** formatText 返回的文案（基于已提交的分值，不随悬停预览变化）；未传时为空 */
const formattedText = computed(() =>
  props.formatText ? props.formatText(currentValue.value) : "",
);

/** 该星是否整颗点亮：此时未选中层被完全盖住，直接隐藏，避免形状不同的分段图标叠在一起露出边角 */
function isFullDisplay(index: number): boolean {
  return displayValue.value >= index;
}

/** 未选中层内联样式：指定了 voidColor 用实色；半星时只保留右半边，与选中层的左半边拼成整颗 */
function voidStyle(index: number) {
  const style: Record<string, string> = {};
  if (props.voidColor) style.color = props.voidColor;
  if (isHalfDisplay(index)) style.clipPath = "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)";
  return style;
}

// ─── 交互 ───────────────────────────────────────────────────

// 点击事件（Web 版：用鼠标位置判断半星）
function onClick(e: MouseEvent, index: number) {
  if (!isInteractive.value) {
    return;
  }
  // hover 模式下悬停已经把分数写进去了，点击不再做「同值清零」：
  // 清零后指针稍一移动又会被悬停改回来，只会闪一下
  if (props.trigger === "hover") {
    return;
  }

  let next = index;
  if (props.allowHalf) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    next = e.clientX < midX ? index - 0.5 : index;
  }

  // 点击后立刻按提交后的值展示：否则悬停预览会一直盖在上面，清零后看起来像没生效
  lockedPreview.value = next;
  hoverValue.value = -1;

  // 再次点击当前分值：开启 clearable 才清零，否则保持不变
  if (currentValue.value === next) {
    if (props.clearable) updateValue(0);
    return;
  }
  updateValue(next);
}

function onMouseMove(e: MouseEvent) {
  if (!isInteractive.value) {
    return;
  }
  if (moveRaf) cancelAnimationFrame(moveRaf);

  const x = e.clientX;
  const wrapper = e.currentTarget as HTMLElement;

  moveRaf = requestAnimationFrame(() => {
    const stars = wrapper.querySelectorAll<HTMLElement>(".reborn-rate__star");
    const last = stars[stars.length - 1];
    // 指针滑到星形右侧（分数 / 自定义文案区域）时不再换算：否则预览或分数会被顶成满分
    if (last && x > last.getBoundingClientRect().right) {
      return;
    }

    let next = 0;
    for (let i = stars.length - 1; i >= 0; i--) {
      const rect = stars[i]!.getBoundingClientRect();
      if (x >= rect.left) {
        if (props.allowHalf) {
          const midX = rect.left + rect.width / 2;
          next = x < midX ? i + 0.5 : i + 1;
        } else {
          next = i + 1;
        }
        break;
      }
    }

    if (lockedPreview.value !== null) {
      if (next === lockedPreview.value) return;

      lockedPreview.value = null;
    }

    if (props.trigger === "hover") {
      updateValue(next);
    } else {
      hoverValue.value = next;
    }
  });
}

function onMouseLeave() {
  if (moveRaf) cancelAnimationFrame(moveRaf);
  hoverValue.value = -1;
  lockedPreview.value = null;
}

// 更新值
function updateValue(newValue: number) {
  if (currentValue.value !== newValue) {
    currentValue.value = newValue;
    emit("update:modelValue", newValue);
    emit("change", newValue);
  }
}

// 同步外部值
watch(
  () => props.modelValue,
  (val) => {
    if (val !== currentValue.value) {
      currentValue.value = clamp(val);
    }
  },
);

// ─── 实例方法 ───────────────────────────────────────────────

/**
 * 设置当前分数：按 count 夹取，allowHalf 时取整到半星、否则取整到整星；
 * 与用户点击一样会触发 update:modelValue 与 change，不受 disabled / readonly 限制
 */
function setCurrentValue(value: number) {
  const clamped = clamp(value);
  const next = props.allowHalf ? Math.round(clamped * 2) / 2 : Math.round(clamped);
  hoverValue.value = -1;
  updateValue(next);
}

/** 重置当前分数：清除悬停预览，并把内部值同步回 modelValue（非受控用法下可撤销未被父级接收的改动） */
function resetCurrentValue() {
  hoverValue.value = -1;
  currentValue.value = clamp(props.modelValue);
}

defineExpose({ setCurrentValue, resetCurrentValue });
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
    <div v-for="index in count" :key="index" class="reborn-rate__star" :class="ui.star()"
      @click="onClick($event, index)">
      <!-- 未激活图标：整颗点亮时隐藏（保留占位），半星时只露右半边；传了 voidColor 用实色，否则取文字色的 30% 不透明度 -->
      <div :class="[ui.icon(), voidColor ? '' : 'opacity-30', isFullDisplay(index) ? 'invisible' : '']"
        :style="voidStyle(index)">
        <slot name="icon" :index="index" :active="false">
          <Icon :name="props.icon" class="size-full" />
        </slot>
      </div>

      <!-- 激活图标（整星 / 半星）：命中分段图标时按其类型渲染图片或图标 -->
      <div v-if="isActiveDisplay(index)" class="absolute inset-0" :class="ui.iconActive()" :style="activeStyle(index)">
        <slot name="icon" :index="index" :active="true">
          <img v-if="activeSource?.type === 'image'" :src="activeSource.url" alt="" draggable="false"
            class="size-full object-contain">
          <Icon v-else :name="activeSource?.url ?? getActiveIcon(index)" class="size-full" />
        </slot>
      </div>
    </div>

    <!-- 分数 / 自定义文案：显示已提交的值，悬停只预览星形；传了 formatText 时显示其返回值 -->
    <slot name="value" :value="currentValue" :text="formattedText">
      <span v-if="formatText || showValue" :class="ui.value()">{{ formatText ? formattedText : currentValue }}</span>
    </slot>
  </div>
</template>
