<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { switchColors, switchSizes, switchTypes } from "./reborn-switch.config";
import { computed, ref, useAttrs, watch } from "vue";
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
  /** 切换完成后更新绑定值，参数为 activeValue 或 inactiveValue */
  (e: "update:modelValue", value: any): void;
  /** 状态切换后触发（beforeChange 拦截通过后才会触发），参数与 update:modelValue 相同 */
  (e: "change", value: any): void;
}>();

const b = tv(theme);

export interface SwitchProps {
  modelValue?: any;
  defaultValue?: any;
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
  /** 覆盖内部各区域样式类：wrapper 根容器、track 通用轨道、activeTrack/inactiveTrack 两态轨道、thumb 滑块、activeLabel/inactiveLabel 两侧文案 */
  ui?: Partial<{
    wrapper: ClassValue;
    input: ClassValue;
    track: ClassValue;
    activeTrack: ClassValue;
    inactiveTrack: ClassValue;
    thumb: ClassValue;
    wave: ClassValue;
    inlineActive: ClassValue;
    inlineInactive: ClassValue;
    activeLabel: ClassValue;
    inactiveLabel: ClassValue;
  }>;
}

const attrs = useAttrs();
const inputRef = ref<HTMLInputElement>();

const localValue = ref(props.defaultValue ?? props.inactiveValue);
const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate
} = useFormInject(props);

const isChecked = computed(() => {
  const val = props.modelValue !== undefined ? props.modelValue : localValue.value;
  return val === props.activeValue;
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
    inlineActive: (opts?: { class?: any }) => styles.inlineActive({ class: cn(opts?.class, uiOverrides.value.inlineActive) }),
    inlineInactive: (opts?: { class?: any }) => styles.inlineInactive({ class: cn(opts?.class, uiOverrides.value.inlineInactive) }),
    activeLabel: (opts?: { class?: any }) => styles.activeLabel({ class: cn(opts?.class, uiOverrides.value.activeLabel) }),
    inactiveLabel: (opts?: { class?: any }) => styles.inactiveLabel({ class: cn(opts?.class, uiOverrides.value.inactiveLabel) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

/** inline-prompt 是否生效：line 型轨道过细放不下文本，直接不渲染 */
const inlinePromptActive = computed(() => props.inlinePrompt && props.type !== "line");

/**
 * 切换波纹（wave 开启才生效）：每次切换成功自增 key 重建波纹节点，动画从头触发（参考 antd 的 wave 效果）。
 * 颜色取 color 语义色变量，不受轨道 ui 背景覆盖影响，扩散与淡出见 scoped 样式。
 */
const waveKey = ref(0);
const waveStyle = computed(() => ({
  "--re-switch-wave-color": `var(--color-${props.color})`,
}));

function updateValue(checked: boolean) {
  const nextValue = checked ? props.activeValue : props.inactiveValue;
  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }
  // 关闭波纹时不自增，波纹节点始终不渲染，避免为纯装饰动画多挂一个节点
  if (props.wave) waveKey.value++;
  emit("update:modelValue", nextValue);
  emit("change", nextValue);
  // 与 uniapp 端对齐：切换后触发表单项的 change 校验
  if (validate) validate("change");
}

async function handleClick(event: Event) {
  // isDisabled 含表单级禁用，仅判 props.disabled 会漏掉 Form 下发的禁用态
  if (isDisabled.value || props.loading) return;

  // 阻止默认行为（防止 input 自动切换状态）
  event.preventDefault();

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

watch(
  () => props.modelValue,
  (value: any) => {
    if (value !== undefined) {
      localValue.value = value;
    }
  },
);

defineExpose({
  /** `() => void` 使内部隐藏的原生 checkbox 获得键盘焦点 */
  focus: () => inputRef.value?.focus(),
});
</script>

<template>
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="isDisabled || props.loading" @click="handleClick">

    <!-- inline-prompt 开启后两侧文案让位给轨道内文本 -->
    <span v-if="!inlinePromptActive && (props.inactiveLabel || $slots.inactiveLabel)" :class="ui.inactiveLabel()">
      <slot name="inactiveLabel">{{ props.inactiveLabel }}</slot>
    </span>

    <!-- 增加 @click.stop 防止事件冒泡造成的双重触发 -->
    <input
      ref="inputRef" v-bind="inputAttrs" type="checkbox" :checked="isChecked"
      :disabled="isDisabled || props.loading" :class="ui.input()" @click.stop
    >

    <span :class="ui.track()" :data-loading="props.loading">
      <!-- 切换波纹：key 变化重建节点以重新触发动画；wave 关闭或尚未切换过时不渲染 -->
      <span v-if="props.wave && waveKey" :key="waveKey" class="re-switch-wave" :class="ui.wave()" :style="waveStyle" />

      <!-- 两态文本持续挂载并水平滑动；网格稳定宽度，独立裁剪不影响滑块和波纹。 -->
      <span v-if="inlinePromptActive" class="grid min-w-0 flex-1 grid-cols-1 self-stretch overflow-hidden rounded-[inherit]">
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

      <span :class="ui.thumb()">
        <slot name="thumb" :checked="isChecked" :loading="props.loading">
          <Icon v-if="props.loading" name="lucide:loader-2" class="size-full p-0.5 animate-spin text-gray-400" />
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
