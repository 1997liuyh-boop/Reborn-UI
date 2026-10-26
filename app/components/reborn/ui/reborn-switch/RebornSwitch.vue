<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { switchColors, switchSizes, switchTypes } from "./reborn-switch.config";
import { animate } from "motion-v";
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useAttrs, useTemplateRef, watch } from "vue";
import { motionPresets, prefersReducedMotion } from "@/lib/motion";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-switch.config";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<SwitchProps>(), {
  activeValue: true,
  inactiveValue: false,
  disabled: false,
  loading: false,
  inlinePrompt: false,
  autoWidth: false,
  wave: false,
  type: "circle",
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  /** 状态切换后触发（beforeChange 拦截通过后才会触发），参数与 update:modelValue 相同 */
  (e: "change", value: any): void;
}>();

defineSlots<{
  /** 开启态文案：默认在轨道右侧，inlinePrompt 生效时在轨道内 */
  activeLabel?: () => any;
  /** 关闭态文案：默认在轨道左侧，inlinePrompt 生效时在轨道内 */
  inactiveLabel?: () => any;
  /** 完全接管滑块内部内容，优先级最高 */
  thumb?: (props: { checked: boolean; loading: boolean }) => any;
  /** 滑块内开态内容，仅开态渲染 */
  active?: (props: { checked: boolean }) => any;
  /** 滑块内关态内容，仅关态渲染 */
  inactive?: (props: { checked: boolean }) => any;
}>();

/**
 * 开关绑定值（v-model）：与 activeValue 严格相等时为开态，切换完成后发出 update:modelValue，参数为 activeValue 或 inactiveValue。
 * 不绑定时组件自己持有取值，初值取 defaultValue（缺省 inactiveValue）；
 * 绑定值被父级置回 undefined（如表单重置到「未赋值」）时同样回到这个初值，不会停在上一次的受控值上。
 * 类型为 any，显式写 default: undefined，避免未传时被布尔强转。
 */
const model = defineModel<any>({ default: undefined });

const b = tv(theme);

export interface SwitchProps {
  defaultValue?: any; // 非受控模式下的初始值，缺省取 inactiveValue；绑定值为 undefined 时也回到它
  activeValue?: any; // 打开状态对应的绑定值，默认 true；配合 inactiveValue 可绑定字符串/数字等任意值
  inactiveValue?: any; // 关闭状态对应的绑定值，默认 false
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
  loading?: boolean; // 是否加载中：轨道内显示旋转图标且开关不可点击（与 disabled 相互独立）
  inlinePrompt?: boolean; // 文本显示在开关内：activeLabel / inactiveLabel 渲染进轨道内部而非两侧（line 型轨道过细，不生效）
  autoWidth?: boolean; // 轨道宽度是否按两态点内文本的较长者撑开，切换时保持稳定；关闭（默认）时固定宽度、超出文本省略
  wave?: boolean; // 切换波纹：每次切换成功后从轨道边缘向外扩散一圈开态色并淡出；默认关闭，开启后仅作视觉反馈，不影响取值与事件
  type?: typeof switchTypes[number]; // 形态：circle 胶囊圆形（默认）/ round 圆角方形 / line 细线轨道 + 悬浮滑块
  size?: typeof switchSizes[number];
  color?: typeof switchColors[number];
  beforeChange?: () => boolean | Promise<boolean>; // 切换前拦截钩子：返回 false、Promise 解析为 false 或 Promise reject 时取消本次切换，常用于二次确认/异步校验
  class?: any;
  /** 覆盖内部各区域样式类：wrapper 根容器、track 通用轨道、activeTrack/inactiveTrack 两态轨道、thumb 滑块、inlineWrap 点内文案容器、inlineActive/inlineInactive 点内两态文案、activeLabel/inactiveLabel 两侧文案 */
  ui?: Partial<{
    wrapper: ClassValue;
    input: ClassValue;
    track: ClassValue;
    activeTrack: ClassValue;
    inactiveTrack: ClassValue;
    thumb: ClassValue;
    wave: ClassValue;
    inlineWrap: ClassValue;
    inlineActive: ClassValue;
    inlineInactive: ClassValue;
    activeLabel: ClassValue;
    inactiveLabel: ClassValue;
  }>;
}

const attrs = useAttrs();
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const thumbRef = useTemplateRef<HTMLElement>("thumbRef");
let thumbRun = 0;
let thumbPlayback: ReturnType<typeof animate> | undefined;
let motionMedia: MediaQueryList | undefined;

function stopThumb() {
  thumbRun++;
  thumbPlayback?.stop();
  thumbPlayback = undefined;
}

function clearThumb() {
  if (!thumbRef.value) return;
  thumbRef.value.style.left = "";
  thumbRef.value.style.right = "";
  thumbRef.value.style.transitionDuration = "";
}

function syncMotionPreference() {
  if (!motionMedia?.matches || !thumbRef.value) return;
  stopThumb();
  clearThumb();
}

/** 只接管切换的左右边界，结束后还给类名，保留按压拉伸与自定义轨道尺寸。 */
async function animateThumb() {
  const thumb = thumbRef.value;
  if (!thumb) return;
  const before = getComputedStyle(thumb);
  const from = { left: Number.parseFloat(before.left), right: Number.parseFloat(before.right) };
  stopThumb();
  const run = thumbRun;
  thumb.style.transitionDuration = "0ms";
  await nextTick();
  if (run !== thumbRun) return;
  thumb.style.left = "";
  thumb.style.right = "";
  const after = getComputedStyle(thumb);
  const to = { left: Number.parseFloat(after.left), right: Number.parseFloat(after.right) };
  if (prefersReducedMotion() || ![from.left, from.right, to.left, to.right].every(Number.isFinite)) {
    clearThumb();
    return;
  }
  // 先恢复当前边界，数值动画直接写 DOM，不留下停止后又排队覆盖清理的渲染任务。
  thumb.style.left = `${from.left}px`;
  thumb.style.right = `${from.right}px`;
  thumbPlayback = animate(0, 1, {
    ...motionPresets.spring,
    onUpdate: progress => {
      if (run !== thumbRun) return;
      thumb.style.left = `${from.left + (to.left - from.left) * progress}px`;
      thumb.style.right = `${from.right + (to.right - from.right) * progress}px`;
    },
    onComplete: () => {
      if (run !== thumbRun) return;
      thumbPlayback = undefined;
      clearThumb();
    },
  });
}

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate
} = useFormInject(props);

/** 当前生效的取值：绑定值为 undefined（未绑定或被置回 undefined）时回到非受控初值 */
const currentValue = computed(() => (model.value === undefined ? (props.defaultValue ?? props.inactiveValue) : model.value));

const isChecked = computed(() => currentValue.value === props.activeValue);

watch(isChecked, animateThumb, { flush: "pre" });
onMounted(() => {
  motionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  motionMedia?.addEventListener("change", syncMotionPreference);
});
onBeforeUnmount(() => {
  stopThumb();
  motionMedia?.removeEventListener("change", syncMotionPreference);
});

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: fieldGroupSize.value || props.size,
    color: props.color,
    type: props.type,
    autoWidth: props.autoWidth,
    active: isChecked.value,
    error: isError.value,
    disabled: isDisabled.value || props.loading,
    loading: props.loading,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    // 状态样式最后合并，背景与 ring 均可覆盖通用轨道样式。
    track: (opts?: { class?: any }) => styles.track({
      class: cn(
        isChecked.value ? styles.activeTrack() : styles.inactiveTrack(),
        opts?.class,
        uiOverrides.value.track,
        isChecked.value ? uiOverrides.value.activeTrack : uiOverrides.value.inactiveTrack,
      ),
    }),
    thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
    wave: (opts?: { class?: any }) => styles.wave({ class: cn(opts?.class, uiOverrides.value.wave) }),
    inlineWrap: (opts?: { class?: any }) => styles.inlineWrap({ class: cn(opts?.class, uiOverrides.value.inlineWrap) }),
    inlineActive: (opts?: { class?: any }) => styles.inlineActive({ class: cn(opts?.class, uiOverrides.value.inlineActive) }),
    inlineInactive: (opts?: { class?: any }) => styles.inlineInactive({ class: cn(opts?.class, uiOverrides.value.inlineInactive) }),
    activeLabel: (opts?: { class?: any }) => styles.activeLabel({ class: cn(opts?.class, uiOverrides.value.activeLabel) }),
    inactiveLabel: (opts?: { class?: any }) => styles.inactiveLabel({ class: cn(opts?.class, uiOverrides.value.inactiveLabel) }),
  };
});

/**
 * 透传属性分两路：
 * - style 与 data-* 作用于外观或供选择器定位，落到根节点 label，否则会落在 sr-only 的隐藏 input 上毫无效果；
 * - 其余（id、name、aria-*、原生监听等）落到隐藏的原生 checkbox，保证 label for、表单提交与读屏语义指向真实控件。
 * class 是声明过的 prop，不会出现在 attrs 里。
 */
function rootAttrs() {
  const result: Record<string, unknown> = {};
  for (const key in attrs) {
    if (key === "style" || key.startsWith("data-")) result[key] = attrs[key];
  }
  return result;
}

function inputAttrs() {
  const result: Record<string, unknown> = {};
  for (const key in attrs) {
    if (key !== "style" && !key.startsWith("data-")) result[key] = attrs[key];
  }
  return result;
}

/** inline-prompt 是否生效：line 型轨道过细放不下文本，直接不渲染 */
const inlinePromptActive = computed(() => props.inlinePrompt && props.type !== "line");

/**
 * 切换波纹（wave 开启才生效）：每次切换成功自增 key 重建波纹节点，动画从头触发（参考 antd 的 wave 效果）。
 * 颜色取 color 语义色变量，不受轨道 ui 背景覆盖影响，扩散与淡出见 scoped 样式。
 */
const waveKey = shallowRef(0);
const waveStyle = computed(() => ({
  "--re-switch-wave-color": `var(--color-${props.color})`,
}));

function updateValue(checked: boolean) {
  const nextValue = checked ? props.activeValue : props.inactiveValue;
  // 关闭波纹时不自增，波纹节点始终不渲染，避免为纯装饰动画多挂一个节点
  if (props.wave) waveKey.value++;
  // 未绑定时 defineModel 自行更新本地值；受控时只发 update:modelValue，赋值后同步读到的仍是旧值，事件载荷用本地算出的新值
  model.value = nextValue;
  emit("change", nextValue);
  // 与 uniapp 端对齐：切换后触发表单项的 change 校验
  if (validate) validate("change");
}

/**
 * 唯一的切换入口，挂在原生 checkbox 的 click 上：
 * 点击轨道或文案时 label 把点击转发给 input，键盘聚焦后按空格时浏览器直接在 input 上派发 click，两条路径只处理一次。
 * 原生 checkbox 在 click 派发前已经自行翻转了 checked，这里立刻把它改回当前状态，DOM 的勾选态只跟随 isChecked：
 * 不用 preventDefault，是因为被取消的 click 会在派发结束后再把 checked 还原一次，
 * 而同步切换时 Vue 已在派发途中写入新值，还原会让 DOM 与绑定值失步（读屏读到的状态随之出错）。
 */
async function handleClick(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  input.checked = isChecked.value;

  // isDisabled 含表单级禁用，仅判 props.disabled 会漏掉 Form 下发的禁用态
  if (isDisabled.value || props.loading) return;

  const newChecked = !isChecked.value;

  if (props.beforeChange) {
    try {
      const result = await props.beforeChange();
      if (result === false) return;
    } catch {
      return;
    }
  }

  updateValue(newChecked);
}

defineExpose({
  /** `() => void` 使内部隐藏的原生 checkbox 获得键盘焦点 */
  focus: () => inputRef.value?.focus(),
});
</script>

<template>
  <label v-bind="rootAttrs()" :class="ui.wrapper({ class: props.class })" :data-disabled="isDisabled || props.loading">

    <!-- inline-prompt 开启后两侧文案让位给轨道内文本 -->
    <span v-if="!inlinePromptActive && (props.inactiveLabel || $slots.inactiveLabel)" :class="ui.inactiveLabel()">
      <slot name="inactiveLabel">{{ props.inactiveLabel }}</slot>
    </span>

    <!-- 切换逻辑只挂在 input 上：鼠标点击经 label 转发、键盘空格直接派发，都落到同一个 click -->
    <input
      ref="inputRef" v-bind="inputAttrs()" type="checkbox" :checked="isChecked"
      :disabled="isDisabled || props.loading" :class="ui.input()" @click="handleClick"
    >

    <span :class="ui.track()" :data-loading="props.loading">
      <!-- 切换波纹：key 变化重建节点以重新触发动画；wave 关闭或尚未切换过时不渲染 -->
      <span v-if="props.wave && waveKey" :key="waveKey" class="re-switch-wave" :class="ui.wave()" :style="waveStyle" />

      <!-- 两态文本持续挂载并水平滑动；网格稳定宽度，独立裁剪不影响滑块和波纹。 -->
      <span v-if="inlinePromptActive" :class="ui.inlineWrap()">
        <span v-if="props.activeLabel || $slots.activeLabel" :aria-hidden="!isChecked" :class="ui.inlineActive()">
          <slot name="activeLabel">
            {{ props.activeLabel }}
          </slot>
        </span>
        <span v-if="props.inactiveLabel || $slots.inactiveLabel" :aria-hidden="isChecked" :class="ui.inlineInactive()">
          <slot name="inactiveLabel">
            {{ props.inactiveLabel }}
          </slot>
        </span>
      </span>

      <span ref="thumbRef" :class="ui.thumb()">
        <slot name="thumb" :checked="isChecked" :loading="props.loading">
          <Icon v-if="props.loading" name="lucide:loader-2" class="size-full p-0.5 animate-spin text-gray-5" />
          <!-- 滑块内按状态显示的内容：开态渲染 #active、关态渲染 #inactive -->
          <slot v-else-if="isChecked" name="active" :checked="isChecked" />
          <slot v-else name="inactive" :checked="isChecked" />
        </slot>
      </span>
    </span>

    <span v-if="!inlinePromptActive && (props.activeLabel || $slots.activeLabel)" :class="ui.activeLabel()">
      <slot name="activeLabel">{{ props.activeLabel }}</slot>
    </span>
  </label>
</template>

<style scoped>
/* 切换波纹：从轨道边缘向外扩散一圈开态色并淡出（参考 antd wave） */
.re-switch-wave {
  animation: re-switch-wave 0.5s ease-out both;
}

@keyframes re-switch-wave {
  0% {
    box-shadow: 0 0 0 0 var(--re-switch-wave-color);
    opacity: 0.4;
  }

  100% {
    box-shadow: 0 0 0 8px var(--re-switch-wave-color);
    opacity: 0;
  }
}
</style>
