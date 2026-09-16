<script setup lang="ts">
import type { inputColors, inputShapes } from "../reborn-input/reborn-input.config";
import type { InputProps, InputUi } from "../reborn-input/RebornInput.vue";
import type { searchBoxSizes } from "./reborn-search-box.config";
import { computed, nextTick, onMounted, onUnmounted, ref, useSlots, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornInput from "../reborn-input/RebornInput.vue";
import theme, { inputTheme } from "./reborn-search-box.config";

defineOptions({
  inheritAttrs: false, // 禁用属性透传，手动控制
});

const props = withDefaults(defineProps<SearchBoxProps>(), {
  placeholder: "请输入搜索内容",
  size: "sm",
  color: "primary",
  shape: "circle",
  showDropdown: true,
  ui: () => ({}),
  inputUi: () => ({}),
});

const emit = defineEmits<{
  /** 按下回车或通过插槽作用域触发搜索时触发（trailing 插槽作用域透出 search 方法供自定义按钮调用），参数为当前 modelValue */
  (e: "search", value: SearchBoxModelValue): void;
  /** 输入框获得焦点时触发；showDropdown 开启时同时展开下拉面板 */
  (e: "focus", event: FocusEvent): void;
  /** 输入框失去焦点时触发；若焦点仍在组件内部则不收起面板 */
  (e: "blur", event: FocusEvent): void;
}>();

/** 使用 tailwind-variants 生成基础样式生成器 */
const b = tv(theme);

/** 插槽表：用于判断是否存在外置插槽，从而决定聚焦描边画在外框还是输入框区 */
const slots = useSlots();

/** RebornSearchBox 组件本身的 UI 槽位定义 */
export interface SearchBoxUi {
  wrapper?: string;
  /** 展开状态下的底色卡片 */
  backdropCard?: string;
  /** 控件行：外置前后置插槽 + 输入框区的横向容器，承担外层边框；无外置插槽时聚焦高亮也落在这一层 */
  control?: string;
  /** 输入框区：撑满剩余空间的结构层，承担水平内边距；有外置插槽时聚焦描边以 ::before 覆盖层画在这一层内 */
  inputWrapper?: string;
  dropdownOuter?: string;
  dropdown?: string;
  leadingWrapper?: string;
  trailingWrapper?: string;
}

/** 搜索框双向绑定值类型 */
export interface SearchBoxModelValue {
  /** 输入框文本 */
  inputValue: string;
  /** 下拉选择器选中值 */
  selectValue: string | number;
  /** 扩展字段：在 dropdown 插槽中组合 RebornSku 等筛选内容时可自行并入 */
  [key: string]: any;
}

/** 搜索框组件 Props 定义 */
export interface SearchBoxProps {
  /** 占位提示文字 */
  placeholder?: string;
  /** 尺寸变体: sm, md, lg */
  size?: typeof searchBoxSizes[number];
  /** 颜色变体 */
  color?: typeof inputColors[number];
  /** 外形轮廓，与 RebornInput 的 shape 对齐：circle 胶囊 / square 统一取 rounded-md 令牌（不分尺寸）；底色卡片与下拉面板的圆角随之与输入框对齐 */
  shape?: typeof inputShapes[number];
  /** 是否展示下拉面板（面板内容完全由 dropdown 插槽提供） */
  showDropdown?: boolean;
  /** 自定义保存历史记录回调 */
  saveHistory?: (history: string[]) => void;
  /** 自定义清除历史记录回调 */
  removeHistory?: () => void;
  /** 自定义类名 */
  class?: any;
  /** 组件自身 UI 覆盖 */
  ui?: SearchBoxUi;
  /** 内部 RebornInput UI 覆盖 */
  inputUi?: InputUi;
  /** 输入框属性透传（v-bind 到内部 RebornInput；size/color/shape/placeholder 等显式 prop 优先级更高） */
  inputAttrs?: Partial<InputProps>;
}

/** 搜索关键字双向绑定（inputValue + selectValue 的组合对象） */
const model = defineModel<SearchBoxModelValue>({
  default: () => ({ inputValue: "", selectValue: "" }),
});

const inputRef = ref<HTMLInputElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false); // 下拉面板展开状态
const isInputFocused = ref(false); // 内部输入框是否获得焦点（边框激活高亮的唯一依据）
const localHistory = ref<string[]>([]); // 本地历史记录列表

// 历史记录本地存储 Key
const STORAGE_KEY = "reborn-search-history";

/** 从 LocalStorage 加载历史记录 */
const loadHistory = () => {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    localHistory.value = saved ? JSON.parse(saved) : [];
  } catch {
    localHistory.value = [];
  }
};

/** 添加关键字到历史记录 */
const addToHistory = (keyword: string) => {
  if (!keyword.trim()) return;
  const newHistory = [keyword, ...localHistory.value.filter((h) => h !== keyword)].slice(0, 10);
  if (props.saveHistory) {
    props.saveHistory(newHistory);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  }
  localHistory.value = newHistory;
};

/** 清除全部历史记录 */
const handleClearHistory = () => {
  if (props.removeHistory) {
    props.removeHistory();
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  localHistory.value = [];
};

/** 移除单条历史记录 */
const handleRemoveHistoryItem = (keyword: string) => {
  const newHistory = localHistory.value.filter((h) => h !== keyword);
  if (props.saveHistory) {
    props.saveHistory(newHistory);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  }
  localHistory.value = newHistory;
};

/** 搜索框自身各槽位样式 */
const ui = computed(() => {
  const styles = b({
    expanded: isExpanded.value,
    shape: props.shape,
    size: props.size,
    color: props.color,
    // 激活高亮只跟随输入框焦点，外置插槽获得焦点时不点亮边框
    focused: isInputFocused.value,
    // 存在外置插槽时，外框恒为灰色、聚焦描边只画在输入框区内，避免外置插槽跟着变色
    hasOuterSlots: Boolean(slots.leading || slots.trailing),
  });
  const uiOverrides = props.ui || {};

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, props.class, uiOverrides.wrapper) }),
    backdropCard: (opts?: { class?: any }) =>
      styles.backdropCard({ class: cn(opts?.class, uiOverrides.backdropCard) }),
    control: (opts?: { class?: any }) =>
      styles.control({ class: cn(opts?.class, uiOverrides.control) }),
    inputWrapper: (opts?: { class?: any }) =>
      styles.inputWrapper({ class: cn(opts?.class, uiOverrides.inputWrapper) }),
    dropdownOuter: (opts?: { class?: any }) =>
      styles.dropdownOuter({ class: cn(opts?.class, uiOverrides.dropdownOuter) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.dropdown) }),
    leadingWrapper: (opts?: { class?: any }) =>
      styles.leadingWrapper({ class: cn(opts?.class, uiOverrides.leadingWrapper) }),
    trailingWrapper: (opts?: { class?: any }) =>
      styles.trailingWrapper({ class: cn(opts?.class, uiOverrides.trailingWrapper) }),
  };
});

/** 内部 Input 组件 UI 配置：边框与聚焦态一律交给控件行外壳承担，恒压掉 input 自身的 ring */
const internalInputUi = computed(() => {
  const inputStyles = tv(inputTheme)({ size: props.size, shape: props.shape });
  return {
    ...props.inputUi,
    wrapper: cn(inputStyles.wrapper(), props.inputUi?.wrapper),
    icon: cn(inputStyles.icon(), props.inputUi?.icon),
    iconBox: cn(inputStyles.iconBox(), props.inputUi?.iconBox),
  };
});

/**
 * 输入框透传属性：内部输入框恒为 borderless（边框统一由控件行外壳承担，避免双层描边），
 * 故 variant 后置、不接受 inputAttrs 覆盖；其余键照常透传，
 * size/color/shape/placeholder 等显式 prop 在模板中后绑、优先级更高
 */
const internalInputAttrs = computed(() => ({
  ...props.inputAttrs,
  variant: "borderless" as const,
}));

const controlRef = ref<HTMLElement | null>(null);
const controlHeight = ref(45); // 实时测量的控件行高度，用于计算底色卡片与下拉定位

/** 处理输入事件（RebornInput 的 defineModel 载荷可能为 undefined，统一归一为字符串） */
function handleInputValueChange(val: string | number | undefined) {
  model.value = { ...model.value, inputValue: String(val ?? "") };
}

/** 执行搜索 */
function handleSearch() {
  const current = model.value;
  addToHistory(current.inputValue);
  emit("search", current);
  isExpanded.value = false;
  inputRef.value?.blur();
}

/** 获得焦点：点亮边框并展开面板 */
const onFocus = (e: FocusEvent) => {
  isInputFocused.value = true;
  if (props.showDropdown) {
    isExpanded.value = true;
  }
  emit("focus", e);
};

/** 点击输入框展开面板 */
const onInputClick = () => {
  if (props.showDropdown) {
    isExpanded.value = true;
  }
};


/** 失去焦点：熄灭边框并收起面板 (收起需延时，避开点击下拉列表时的冲突) */
const onBlur = (e: FocusEvent) => {
  isInputFocused.value = false;
  const nextTarget = e.relatedTarget as Node | null;
  // 如果新焦点仍在组件内部，则不关闭面板 (如从主输入框点击到了 SKU 里的输入框)
  if (nextTarget && wrapperRef.value?.contains(nextTarget)) {
    return;
  }

  setTimeout(() => {
    // 再次确认当前活跃元素是否在外部
    if (!wrapperRef.value?.contains(document.activeElement)) {
      isExpanded.value = false;
    }
  }, 200);
  emit("blur", e);
};

/** 选择一条历史记录（通过 dropdown 插槽作用域暴露给外部内容使用） */
function selectHistory(keyword: string) {
  const next = { ...model.value, inputValue: keyword };
  model.value = next;
  addToHistory(keyword);
  emit("search", next);
  isExpanded.value = false;
}

/** 选中一条推荐词并回填 inputValue（通过 dropdown 插槽作用域暴露） */
function selectRecommend(keyword: string) {
  model.value = { ...model.value, inputValue: keyword };
  isExpanded.value = false;
}

const contentRef = ref<HTMLElement | null>(null);
const dropdownHeight = ref(0); // 联想面板内容实际高度

/** 重新计算并更新面板高度以支持动画过渡 */
const updateHeight = () => {
  if (contentRef.value) {
    dropdownHeight.value = contentRef.value.scrollHeight;
  }
};

/** 监听展开状态以触发高度计算 */
watch(isExpanded, (val) => {
  if (val) {
    nextTick(() => updateHeight());
  } else {
    dropdownHeight.value = 0;
  }
});

/** 监听 showDropdown 属性，若关闭则强制收起面板 */
watch(() => props.showDropdown, (val) => {
  if (!val) isExpanded.value = false;
});

let contentObserver: ResizeObserver | null = null;
let controlObserver: ResizeObserver | null = null;

onMounted(() => {
  loadHistory();

  // 面板内容的 ResizeObserver (处理联想列表动态增加的情况)
  if (contentRef.value) {
    contentObserver = new ResizeObserver(() => {
      if (isExpanded.value) updateHeight();
    });
    contentObserver.observe(contentRef.value);
  }

  // 控件行的 ResizeObserver (处理响应式布局或前后置插槽内容导致的行高变动)
  if (controlRef.value) {
    controlObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        controlHeight.value =
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      }
    });
    controlObserver.observe(controlRef.value);
  }
});

onUnmounted(() => {
  contentObserver?.disconnect();
  controlObserver?.disconnect();
});
</script>

<template>
  <div ref="wrapperRef" :class="ui.wrapper()">
    <!-- 展开状态下的底色卡片 (绝对定位，圆角由 shape 变体控制并与输入框对齐) -->
    <div :class="ui.backdropCard()" :style="{
      height: `${controlHeight + 12}px`,
      borderBottom: 'none',
      opacity: isExpanded ? 1 : 0,
      transform: isExpanded ? 'scaleY(1)' : 'scaleY(0.95)',
      transformOrigin: 'top center',
    }" />

    <!--
      控件行：外层边框所在的一层，把外置的 leading / trailing 插槽一并囊括在内；
      激活态一律由 isInputFocused 驱动而非 CSS focus-within，因此点中外置插槽里的选择器、按钮都不会点亮描边。
      无外置插槽时整行就是输入框，聚焦高亮直接换这一层的边框色；
      有外置插槽时这一层恒为 gray-4，高亮改由输入框区自己另起一圈（见下方 inputWrapper）。
      items-stretch 让两个外置插槽包裹层与输入框区一样撑满整行高度。
    -->
    <div ref="controlRef" :class="ui.control()">
      <!--
        外置前置插槽：在边框内、输入框之外，无默认内容（如自行放入 RebornSelect）。
        包裹层点击即收起面板并阻止冒泡，避免触发输入框聚焦；分隔线等装饰样式由插槽内容自行提供。
      -->
      <div v-if="$slots.leading" :class="ui.leadingWrapper()" @click.stop="isExpanded = false">
        <slot name="leading" :ui="ui" />
      </div>

      <!--
        输入框区：撑满剩余空间的结构层，承担水平内边距；
        存在外置插槽时由 hasOuterSlots 变体挂上 ::before 覆盖层，聚焦时只在这块区域内画一圈描边，
        纯装饰、绝对定位，不参与布局也不挤压输入框高度。
      -->
      <div :class="ui.inputWrapper()">
        <!-- internalInputAttrs 先绑定（variant 恒为 borderless）、显式 prop 后绑定优先级更高 -->
        <RebornInput ref="inputRef" v-bind="internalInputAttrs" :model-value="model.inputValue" shape="square"
          :placeholder="placeholder" clearable :separator="false" :size="size" :color="color" :ui="internalInputUi"
          @click="onInputClick" @update:model-value="handleInputValueChange" @focus="onFocus" @blur="onBlur"
          @keydown.enter="handleSearch">
          <!-- 内置前置插槽：转发到 RebornInput 的 #prefix，落在输入框内部、随输入框一起进入激活态 -->
          <template v-if="$slots['input-leading']" #prefix="inputScope">
            <slot name="input-leading" :ui="ui" :input-ui="inputScope.ui" :search="handleSearch" />
          </template>

          <!-- 内置后置插槽：转发到 RebornInput 的 #suffix，落在输入框内部、随输入框一起进入激活态 -->
          <template v-if="$slots['input-trailing']" #suffix="inputScope">
            <slot name="input-trailing" :ui="ui" :input-ui="inputScope.ui" :search="handleSearch" />
          </template>
        </RebornInput>
      </div>

      <!--
        外置后置插槽：在边框内、输入框之外，无默认内容（如相机图标、搜索按钮）。
        作用域透出 search 方法，自定义搜索按钮点击时调用即可触发搜索。
      -->
      <div v-if="$slots.trailing" :class="ui.trailingWrapper()">
        <slot name="trailing" :ui="ui" :search="handleSearch" />
      </div>
    </div>

    <!-- 动态下拉面板（内容完全由 dropdown 插槽提供） -->
    <div :class="ui.dropdownOuter()" :style="{
      height: isExpanded ? `${dropdownHeight}px` : '0px',
      top: `${controlHeight / 2}px`,
      pointerEvents: isExpanded ? 'auto' : 'none',
    }">
      <div ref="contentRef" :class="ui.dropdown()" :style="{
        paddingTop: `${controlHeight / 2 + 24}px`,
        opacity: isExpanded ? 1 : 0,
        transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)',
        transitionDelay: isExpanded ? '100ms' : '0ms',
      }" @mousedown="(e) => {
        const target = e.target as HTMLElement;
        // 如果点击的是输入框等可聚焦元素，不要阻止默认行为，否则会导致无法正常聚焦
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
          return;
        }
        e.preventDefault();
      }">
        <!--
          面板内容完全由 dropdown 插槽提供，组件不渲染任何默认内容。
          作用域透出：ui（结构层样式键，面板内容的装饰样式由插槽内容自行提供）、
          history（历史记录列表）与历史/推荐相关的操作方法。
        -->
        <slot name="dropdown" :ui="ui" :history="localHistory" :select-history="selectHistory"
          :remove-history-item="handleRemoveHistoryItem" :clear-history="handleClearHistory"
          :select-recommend="selectRecommend" />
      </div>
    </div>
  </div>
</template>
