<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornInput from "../reborn-input/RebornInput.vue";
import RebornSelect, { type SelectProps } from "../reborn-select/RebornSelect.vue";
import RebornBadge from "../reborn-badge/RebornBadge.vue";
import { inputColors } from "../reborn-input/reborn-input.config";
import type { InputUi } from "../reborn-input/RebornInput.vue";
import theme, { searchBoxSizes, inputTheme, selectTriggerTheme, selectUiTheme } from "./reborn-search-box.config";
import RebornSku, { type SkuOption } from "../reborn-sku/RebornSku.vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";

/** 使用 tailwind-variants 生成基础样式生成器 */
const b = tv(theme);

defineOptions({
  inheritAttrs: false, // 禁用属性透传，手动控制
});

/** SKU 属性项类型定义 (兼容旧版，建议使用 SkuOption) */
export type SkuAttribute = SkuOption;

/** RebornSelect 组件的 UI 覆盖类型定义 */
export interface SelectUi {
  /** 触发器最外层容器样式 */
  wrapper?: string;
  /** 触发器主体按钮样式 */
  trigger?: string;
  /** 触发器文本内容样式 */
  triggerText?: string;
  /** 占位提示文字样式 */
  placeholder?: string;
  /** 右侧箭头/图标样式 */
  arrow?: string;
  /** 触发器内部生成的浮层(Dropdown)容器样式 */
  dropdown?: string;
  /** 内部 RebornSelect 内容区(Dropdown Content)包装容器样式 */
  internalDropdown?: string;
  /** 内部 RebornSelect 单个选项样式 */
  internalOption?: string;
  /** 内部 RebornSelect 选中项样式 */
  internalOptionActive?: string;
  /** 内部 RebornSelect 高亮项样式 */
  internalOptionHighlight?: string;
  /** 内部 RebornSelect 空状态提示样式 */
  internalEmpty?: string;
  /** 清除按钮样式 */
  clearBtn?: string;
}

/** RebornSearchBox 组件本身的 UI 槽位定义 */
export interface SearchBoxUi {
  wrapper?: string;
  /** 展开状态下的底色卡片 */
  backdropCard?: string;
  inputWrapper?: string;
  input?: string;
  cameraIcon?: string;
  dropdownOuter?: string;
  dropdown?: string;
  section?: string;
  sectionTitle?: string;
  historyTags?: string;
  historyTag?: string;
  deleteIcon?: string;
  clearAll?: string;
  /** 联想列表容器 */
  associateList?: string;
  /** 联想项 */
  associateItem?: string;
  leadingWrapper?: string;
  trailingWrapper?: string;
  separator?: string;
  searchIconInner?: string;
  emptyText?: string;
  recommendIcon?: string;
}

/** 搜索框双向绑定值类型 */
export interface SearchBoxModelValue {
  /** 输入框文本 */
  inputValue: string;
  /** 下拉选择器选中值 */
  selectValue: string | number;
  /** SKU 部分的值，仅在 mode=sku 时有效 */
  [key: string]: any;
}

/** 搜索框组件 Props 定义 */
export interface SearchBoxProps {
  /** 搜索关键字双向绑定 */
  modelValue?: SearchBoxModelValue;
  /** 占位提示文字 */
  placeholder?: string;
  /** 尺寸变体: sm, md, lg */
  size?: typeof searchBoxSizes[number];
  /** 颜色变体 */
  color?: typeof inputColors[number];
  /** 模式: associate(联想词/历史记录) | sku(属性搜索) */
  mode?: "associate" | "sku";
  /** 是否显示下拉面板 */
  showDropdown?: boolean;
  /** 是否显示历史记录区块 */
  showHistory?: boolean;
  /** SKU 属性列表 (仅在 sku 模式下有效) */
  skuAttributes?: SkuAttribute[];
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
  /** 内部 RebornSelect UI 覆盖 */
  selectUi?: SelectUi;
  /** 下拉选择器属性 */
  selectAttrs?: SelectProps;
  /** 推荐搜索关键词列表 */
  recommendKeywords?: string[];
  /** 历史记录区块标题 */
  historyTitle?: string;
  /** 空历史记录提示文字 */
  emptyHistoryLabel?: string;
  /** 推荐搜索区块标题 */
  recommendTitle?: string;
  /** 清空全部历史记录按钮文字 */
  clearAllLabel?: string;
}

const props = withDefaults(defineProps<SearchBoxProps>(), {
  modelValue: () => ({ inputValue: "", selectValue: "" }),
  placeholder: "请输入搜索内容",
  size: "sm",
  color: "primary",
  mode: "associate",
  showDropdown: true,
  showHistory: true,
  skuAttributes: () => [],
  ui: () => ({}),
  inputUi: () => ({}),
  selectUi: () => ({}),
  recommendKeywords: () => [],
  historyTitle: "历史记录",
  emptyHistoryLabel: "暂无最近的搜索记录",
  recommendTitle: "推荐搜索",
  clearAllLabel: "清空全部",
});

const emit = defineEmits<{
  /** 输入框、左侧选择器或 SKU 值变化时触发，参数为合并后的完整 modelValue 对象 */
  (e: "update:modelValue", value: SearchBoxModelValue): void;
  /** 点击搜索按钮、按下回车或选中历史记录时触发，参数为当前 modelValue */
  (e: "search", value: SearchBoxModelValue): void;
  /** 点击后置相机图标时触发（web 端短横线命名，对应 uniapp 端的 clickCamera） */
  (e: "click-camera"): void;
  /** 左侧选择器或 SKU 属性变化时触发，label 为属性 key（选择器变更时为 "selectValue"），value 为选中值（web 端短横线命名，对应 uniapp 端的 selectSku） */
  (e: "select-sku", attr: { label: string, value: string | number }): void;
  /** 输入框获得焦点时触发；showDropdown 开启时同时展开下拉面板 */
  (e: "focus", event: FocusEvent): void;
  /** 输入框失去焦点时触发；若焦点仍在组件内部则不收起面板 */
  (e: "blur", event: FocusEvent): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false); // 下拉面板展开状态
const localHistory = ref<string[]>([]); // 本地历史记录列表

// 历史记录本地存储 Key
const STORAGE_KEY = "reborn-search-history";

/** 从 LocalStorage 加载历史记录 */
const loadHistory = () => {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    localHistory.value = saved ? JSON.parse(saved) : [];
  } catch (e) {
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
    //  size: props.size 
  });
  const uiOverrides = props.ui || {};

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, props.class, uiOverrides.wrapper) }),
    backdropCard: (opts?: { class?: any }) =>
      styles.backdropCard({ class: cn(opts?.class, uiOverrides.backdropCard) }),
    inputWrapper: (opts?: { class?: any }) =>
      styles.inputWrapper({ class: cn(opts?.class, uiOverrides.inputWrapper) }),
    inputLink: (opts?: { class?: any }) =>
      styles.input({ class: cn(opts?.class, uiOverrides.input) }),
    cameraIcon: (opts?: { class?: any }) =>
      styles.cameraIcon({ class: cn(opts?.class, uiOverrides.cameraIcon) }),
    dropdownOuter: (opts?: { class?: any }) =>
      styles.dropdownOuter({ class: cn(opts?.class, uiOverrides.dropdownOuter) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.dropdown) }),
    section: (opts?: { class?: any }) =>
      styles.section({ class: cn(opts?.class, uiOverrides.section) }),
    sectionTitle: (opts?: { class?: any }) =>
      styles.sectionTitle({ class: cn(opts?.class, uiOverrides.sectionTitle) }),
    historyTags: (opts?: { class?: any }) =>
      styles.historyTags({ class: cn(opts?.class, uiOverrides.historyTags) }),
    historyTag: (opts?: { class?: any }) =>
      styles.historyTag({ class: cn(opts?.class, uiOverrides.historyTag) }),
    deleteIcon: (opts?: { class?: any }) =>
      styles.deleteIcon({ class: cn(opts?.class, uiOverrides.deleteIcon) }),
    clearAll: (opts?: { class?: any }) =>
      styles.clearAll({ class: cn(opts?.class, uiOverrides.clearAll) }),
    associateList: (opts?: { class?: any }) =>
      styles.associateList({ class: cn(opts?.class, uiOverrides.associateList) }),
    associateItem: (opts?: { class?: any }) =>
      styles.associateItem({ class: cn(opts?.class, uiOverrides.associateItem) }),

    leadingWrapper: (opts?: { class?: any }) =>
      styles.leadingWrapper({ class: cn(opts?.class, uiOverrides.leadingWrapper) }),
    trailingWrapper: (opts?: { class?: any }) =>
      styles.trailingWrapper({ class: cn(opts?.class, uiOverrides.trailingWrapper) }),
    separator: (opts?: { class?: any }) =>
      styles.separator({ class: cn(opts?.class, uiOverrides.separator) }),
    searchIconInner: (opts?: { class?: any }) =>
      styles.searchIconInner({ class: cn(opts?.class, uiOverrides.searchIconInner) }),
    emptyText: (opts?: { class?: any }) =>
      styles.emptyText({ class: cn(opts?.class, uiOverrides.emptyText) }),
    recommendIcon: (opts?: { class?: any }) =>
      styles.recommendIcon({ class: cn(opts?.class, uiOverrides.recommendIcon) }),
  };
});

/** 内部 Select 组件基础样式 */
const selectTriggerStyles = tv(selectTriggerTheme)();
const selectUiStyles = tv(selectUiTheme)();

/** 
 * 内部 Select 组件触发器 UI 配置
 * 这里的属性将透传给 RebornSelectTrigger 进行样式覆盖
 */
const internalSelectTriggerUi = computed(() => ({
  ...props.selectUi,
  wrapper: cn(selectTriggerStyles.wrapper(), props.selectUi?.wrapper),
  trigger: cn(selectTriggerStyles.trigger(), props.selectUi?.trigger),
  triggerText: cn(selectTriggerStyles.triggerText(), props.selectUi?.triggerText),
  dropdown: cn(selectTriggerStyles.dropdown(), props.selectUi?.dropdown),
}));

/** 
 * 内部 Select 组件内容 UI 配置
 * 这里的属性将透传给 RebornSelect 的 ui 属性，用于覆盖选项列表等内部样式
 */
const internalSelectUi = computed(() => ({
  ...props.selectUi,
  dropdown: cn(selectUiStyles.dropdown(), props.selectUi?.internalDropdown),
  option: props.selectUi?.internalOption,
  optionActive: props.selectUi?.internalOptionActive,
  optionHighlight: props.selectUi?.internalOptionHighlight,
  empty: props.selectUi?.internalEmpty,
}));

/** 合并后的 RebornSelect 组件属性 */
const internalSelectProps = computed(() => ({
  ...props.selectAttrs,
  color: props.color,
  size: "md" as const,
  triggerUi: internalSelectTriggerUi.value,
  ui: internalSelectUi.value,
  clearable: false,
}));

/** 内部 Input 组件 UI 配置 */
const internalInputUi = computed(() => {
  const inputStyles = tv(inputTheme)({ size: props.size });
  return {
    ...props.inputUi,
    wrapper: cn(inputStyles.wrapper(), props.inputUi?.wrapper, !isExpanded.value && "ring-0"),
    icon: cn(inputStyles.icon(), props.inputUi?.icon),
    iconBox: cn(inputStyles.iconBox(), props.inputUi?.iconBox),
  };
});

const inputWrapperRef = ref<HTMLElement | null>(null);
const internalInputHeight = ref(45); // 实时测量的输入框高度，用于计算下拉定位

/** 处理输入事件 */
function handleInputValueChange(val: string | number) {
  emit("update:modelValue", { ...props.modelValue!, inputValue: String(val) });
}

/** 执行搜索 */
function handleSearch() {
  const current = props.modelValue!;
  addToHistory(current.inputValue);
  emit("search", current);
  isExpanded.value = false;
  inputRef.value?.blur();
}

/** 获得焦点展开面板 */
const onFocus = (e: FocusEvent) => {
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


/** 失去焦点收起面板 (需延时，避开点击下拉列表时的冲突) */
const onBlur = (e: FocusEvent) => {
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

/** 选择一条历史记录 */
function selectHistory(keyword: string) {
  const next = { ...props.modelValue!, inputValue: keyword };
  emit("update:modelValue", next);
  addToHistory(keyword);
  emit("search", next);
  isExpanded.value = false;
}

/** 点击推荐搜索项，将 inputValue 赋值 */
function selectRecommend(keyword: string) {
  emit("update:modelValue", { ...props.modelValue!, inputValue: keyword });
  isExpanded.value = false;
}

/** 相机图标点击 */
function handleCameraClick() {
  emit("click-camera");
}

/** Select 选中值变更 */
function handleSelectChange(val: string | number) {
  emit("update:modelValue", { ...props.modelValue!, selectValue: val });
  emit("select-sku", { label: 'selectValue', value: val });
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
let inputObserver: ResizeObserver | null = null;

onMounted(() => {
  loadHistory();

  // 面板内容的 ResizeObserver (处理联想列表动态增加的情况)
  if (contentRef.value) {
    contentObserver = new ResizeObserver(() => {
      if (isExpanded.value) updateHeight();
    });
    contentObserver.observe(contentRef.value);
  }

  // 输入框包裹层的 ResizeObserver (处理响应式布局导致的搜索框高度变动)
  if (inputWrapperRef.value) {
    inputObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        internalInputHeight.value =
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      }
    });
    inputObserver.observe(inputWrapperRef.value);
  }
});

onUnmounted(() => {
  contentObserver?.disconnect();
  inputObserver?.disconnect();
});
</script>

<template>
  <div ref="wrapperRef" :class="ui.wrapper()">
    <!-- 展开状态下的底色卡片 (绝对定位，圆角匹配输入框的药丸形状) -->
    <div :class="ui.backdropCard()" :style="{
      height: `${internalInputHeight + 12}px`,
      borderBottom: 'none',
      opacity: isExpanded ? 1 : 0,
      transform: isExpanded ? 'scaleY(1)' : 'scaleY(0.95)',
      transformOrigin: 'top center',
    }" />

    <!-- 搜索输入框核心区 -->
    <div ref="inputWrapperRef" :class="ui.inputWrapper()">
      <RebornInput ref="inputRef" :model-value="modelValue?.inputValue" :placeholder="placeholder" clearable
        :separator="false" :class="ui.inputLink()" :size="size" :color="color" :ui="internalInputUi"
        @click="onInputClick" @update:model-value="handleInputValueChange" @focus="onFocus" @blur="onBlur"
        @keydown.enter="handleSearch">
        <!-- 前置选择器槽位 -->
        <template #leading="{ ui: inputSlotUi }">
          <div :class="ui.leadingWrapper()" @click.stop="isExpanded = false">
            <RebornSelect :model-value="modelValue?.selectValue" v-bind="internalSelectProps"
              @update:model-value="handleSelectChange" :bordered="false" @click.stop>
              <template #default="{ displayText, ui: selectSlotUi }">
                <slot name="select-trigger" :displayText="displayText" :ui="selectSlotUi">
                  <div :class="selectSlotUi.triggerText()">
                    {{ displayText }}
                  </div>
                </slot>
              </template>
            </RebornSelect>
            <!-- 阻止 separator 点击冒泡到 RebornInput 的 wrapper click，避免触发非 input 的聚焦 -->
            <div :class="[ui.separator(), inputSlotUi.separator()]" @click.stop="inputRef?.focus()" />
          </div>
        </template>
        <!-- 后置功能区槽位 -->
        <template #trailing>
          <div :class="ui.trailingWrapper()">
            <slot name="trailing" :ui="ui">
              <Icon name="lucide:camera" :class="ui.cameraIcon()" @click.stop="handleCameraClick" />
            </slot>

            <RebornButton @click.stop="handleSearch" :size="size" :color="color">
              <slot name="search-button" :ui="ui">
                <Icon name="lucide:search" :class="ui.searchIconInner()" />
              </slot>
            </RebornButton>
          </div>
        </template>
      </RebornInput>
    </div>

    <!-- 动态下拉面板 (SKU属性 / 历史搜索 / 推荐搜索) -->
    <div :class="ui.dropdownOuter()" :style="{
      height: isExpanded ? `${dropdownHeight}px` : '0px',
      top: `${internalInputHeight / 2}px`,
      pointerEvents: isExpanded ? 'auto' : 'none',
    }">
      <div ref="contentRef" :class="ui.dropdown()" :style="{
        paddingTop: `${internalInputHeight / 2 + 24}px`,
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
        <slot name="dropdown" :ui="ui" :history="localHistory">

          <!-- SKU 属性搜索区块 -->
          <template v-if="mode === 'sku'">
            <slot name="sku-list" :ui="ui" :attributes="skuAttributes">
              <RebornSku :model-value="modelValue" :options="skuAttributes"
                @update:model-value="(val: any) => emit('update:modelValue', val)"
                @change="(key: string, val: any) => emit('select-sku', { label: key, value: val })" @click.stop>
                <!-- 将从 RebornSearchBox 接收到的所有插槽全部穿透转发给 RebornSku (例如 #price 等) -->
                <template v-for="(_, name) in $slots" #[name]="slotData">
                  <slot :name="name" v-bind="slotData" />
                </template>
              </RebornSku>
            </slot>
          </template>

          <!-- 历史搜索区块 -->
          <div v-if="showHistory" :class="ui.section()">
            <div :class="ui.sectionTitle()">
              <span>{{ historyTitle }}</span>
              <div v-if="localHistory.length > 0" :class="ui.clearAll()" @click="handleClearHistory">
                <Icon name="lucide:trash-2" />
                {{ clearAllLabel }}
              </div>
            </div>

            <div v-if="localHistory.length > 0" :class="ui.historyTags()">
              <slot name="history" :history="localHistory" :ui="ui">
                <RebornBadge v-for="h in localHistory" :key="h" :label="h" closable variant="soft" color="neutral"
                  size="md" :ui="{ label: 'text-gray-7' }" @click="selectHistory(h)"
                  @close="handleRemoveHistoryItem(h)" />
              </slot>
            </div>
            <div v-else :class="ui.emptyText()">
              {{ emptyHistoryLabel }}
            </div>
          </div>

          <!-- 推荐搜索区块，支持 slot 完全覆盖，暴露 selectRecommend 方法供外部赋值 inputValue -->
          <div v-if="$slots['recommend-list'] || mode === 'associate'" :class="ui.section()">
            <slot name="recommend-list" :ui="ui" :selectRecommend="selectRecommend">
              <div :class="ui.sectionTitle()">{{ recommendTitle }}</div>
              <div :class="ui.associateList()">
                <div v-for="item in recommendKeywords" :key="item" :class="ui.associateItem()"
                  @click="selectRecommend(item)">
                  <Icon name="lucide:trending-up" :class="ui.recommendIcon()" />
                  <span>{{ item }}</span>
                </div>
              </div>
            </slot>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
