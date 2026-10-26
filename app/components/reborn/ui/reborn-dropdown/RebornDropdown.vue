<script setup lang="ts">
import type { SelectTriggerProps } from '../reborn-select-trigger/RebornSelectTrigger.vue';
import type {
  DropdownOption,
  DropdownPlacement,
  DropdownTrigger,
  DropdownUI,
  DropdownValue,
} from './reborn-dropdown.config';
import { computed, getCurrentInstance, inject, onBeforeUnmount, onBeforeUpdate, onMounted, provide, shallowRef, useTemplateRef, watch } from 'vue';
import { resolvePlacement } from '~/lib/placement';
import { cn } from '~/lib/utils';
import RebornSelectTrigger from '../reborn-select-trigger/RebornSelectTrigger.vue';
import { ARROW_POPUP_OFFSET, DROPDOWN_INJECTION_KEY, dropdownTheme, POPUP_OFFSET } from './reborn-dropdown.config';
import RebornDoption from './RebornDoption.vue';

defineOptions({ name: 'RebornDropdown' });

const props = withDefaults(defineProps<DropdownProps>(), {
  showArrow: false,
  disabled: false,
  options: () => [],
  placement: 'bottom',
  trigger: 'click',
  hideOnSelect: true,
  portal: true,
  closeOn: 'mousedown',
  autoAdjustOverflow: true,
});

const emit = defineEmits<{
  'update:popupVisible': [value: boolean];
  /** 下拉框显示状态发生改变时触发（模板中以 @popup-visible-change 监听） */
  popupVisibleChange: [visible: boolean];
  /** 用户选择时触发 */
  select: [value: DropdownValue, ev: Event];
}>();

const slots = defineSlots<{
  /** 触发器内容；下发显隐状态与控制方法，供 manual 触发方式（或任意触发方式下的局部控件）使用 */
  default?: (props: { visible: boolean; open: () => void; close: () => void; toggle: () => void }) => any;
  /** 菜单内容，优先于 options */
  content?: () => any;
  /** 面板页眉 */
  header?: () => any;
  /** 面板页脚 */
  footer?: () => any;
}>();

export interface DropdownProps {
  /**
   * 下拉框箭头是否显示
   * @defaultValue false
   */
  showArrow?: boolean;
  /**
   * 菜单是否禁用
   * @defaultValue false
   */
  disabled?: boolean;
  /** 菜单配置项；与 content 插槽二选一，插槽优先 */
  options?: DropdownOption[];
  /**
   * 菜单弹出位置
   * @defaultValue 'bottom'
   */
  placement?: DropdownPlacement;
  /**
   * 触发下拉的行为，移动端不支持 hover；manual 由使用者通过插槽下发的 open / close / toggle 或 v-model:popup-visible 控制
   * @defaultValue 'click'
   */
  trigger?: DropdownTrigger;
  /** 浮层与触发器的间距（px）；未传时无箭头为 4、带箭头为 12（箭头伸出面板约 8.5px，尖端再留约 3.5px） */
  popupOffset?: number;
  /**
   * 用户选择后是否自动收起菜单
   * @defaultValue true
   */
  hideOnSelect?: boolean;
  /**
   * 浮层是否传送到 body；关闭后浮层留在触发器内，随父容器一起滚动与裁剪
   * @defaultValue true
   */
  portal?: boolean;
  /**
   * 外部关闭的时机（透传给 RebornSelectTrigger）：mousedown 在面板外按下、滚轮或页面滚动时收起，
   * 面板与子菜单内的操作不算外部；click 在面板外完成一次点击后才收起，期间页面滚动时面板跟随触发器
   * @defaultValue 'mousedown'
   */
  closeOn?: SelectTriggerProps['closeOn'];
  /**
   * 下拉框是否自动调整位置：placement 指定的一侧空间不足时翻转到对侧；关闭后严格按 placement 弹出
   * @defaultValue true
   */
  autoAdjustOverflow?: boolean;
  class?: any;
  /** 按语义化结构覆盖各节点样式 */
  ui?: DropdownUI;
}

/**
 * 父级 Dropdown 的上下文（子菜单场景）。必须在本组件 provide 之前 inject，
 * 否则读到的是自己刚 provide 的那份。
 * 宿主不一定是 Dropdown（如 Breadcrumb），悬停与嵌套方法可能缺失，调用一律用 `?.()`。
 */
const parent = inject(DROPDOWN_INJECTION_KEY, null);

/** 下拉框显隐，支持 v-model:popup-visible 受控 */
const popupVisibleModel = defineModel<boolean>('popupVisible', { default: undefined });
const instance = getCurrentInstance()!;
const modelProps = shallowRef(instance.vnode.props ?? {});
onBeforeUpdate(() => { modelProps.value = { ...instance.vnode.props }; });
const hasPopupVisible = computed(() => Object.hasOwn(modelProps.value, 'popupVisible') || Object.hasOwn(modelProps.value, 'popup-visible'));
// 显式空模型按关闭读取，缺省状态独立保留本地交互。
const localPopupVisible = shallowRef(false);
const popupVisible = computed({
  get: () => hasPopupVisible.value ? !!instance.props.popupVisible : localPopupVisible.value,
  set: (value: boolean) => {
    if (hasPopupVisible.value) emit('update:popupVisible', value);
    else {
      localPopupVisible.value = value;
      popupVisibleModel.value = value;
    }
  },
});

/** hover 触发的展开 / 收起延迟：前者防误触，后者留出鼠标从触发器移入面板的时间 */
const HOVER_OPEN_DELAY = 100;
const HOVER_CLOSE_DELAY = 150;
let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

// 模型绑定或父值改变后，旧悬停任务不能再提交交互结果。
watch([hasPopupVisible, () => instance.props.popupVisible], clearTimers, { flush: 'sync' });

/** 显隐变更统一走这里，保证事件只触发一次 */
function setVisible(visible: boolean) {
  if (visible === popupVisible.value) return;
  popupVisible.value = visible;
  emit('popupVisibleChange', visible);
}

function open() {
  if (props.disabled) return;
  clearTimers();
  setVisible(true);
}

function close() {
  clearTimers();
  setVisible(false);
}

function toggle() {
  if (popupVisible.value) close();
  else open();
}

/** 禁用时若菜单仍展开则收起 */
watch(() => props.disabled, (disabled) => {
  if (disabled) close();
});

// ─── 嵌套（子菜单）────────────────────────────────────────────────

const triggerRef = useTemplateRef<InstanceType<typeof RebornSelectTrigger>>('triggerRef');
/** 已注册的子级面板判定，外部点击落在子级面板内时不收起 */
const nestedContains: Array<(node: Node) => boolean> = [];

function registerNested(contains: (node: Node) => boolean) {
  nestedContains.push(contains);
  return () => {
    const index = nestedContains.indexOf(contains);
    if (index >= 0) nestedContains.splice(index, 1);
  };
}

/** 节点是否位于本菜单（触发器 + 面板）或任一子级菜单内 */
function containsNode(node: Node) {
  return !!triggerRef.value?.contains(node) || nestedContains.some(contains => contains(node));
}

let unregisterFromParent: (() => void) | null = null;
onMounted(() => {
  unregisterFromParent = parent?.registerNested?.(containsNode) ?? null;
});

onBeforeUnmount(() => {
  clearTimers();
  unregisterFromParent?.();
});

// ─── 触发行为 ───────────────────────────────────────────────────

function onTriggerClick() {
  if (props.trigger === 'click') toggle();
}

/**
 * 触发器与面板共用：面板已传送到 body，不在触发器 DOM 内，需各自监听。
 * 作为子菜单时同时上报父级，父级据此维持展开（子面板同样不在父面板 DOM 内）。
 */
function onMouseEnter() {
  parent?.hoverEnter?.();
  if (props.trigger !== 'hover') return;
  clearTimers();
  if (!popupVisible.value) openTimer = setTimeout(open, HOVER_OPEN_DELAY);
}

function onMouseLeave() {
  parent?.hoverLeave?.();
  if (props.trigger !== 'hover') return;
  clearTimers();
  closeTimer = setTimeout(close, HOVER_CLOSE_DELAY);
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggle();
  } else if (e.key === 'Escape' && popupVisible.value) {
    close();
  }
}

/** 触发器外的按下或点击（按 closeOn 时机上报）：落在子菜单面板内的不算外部 */
function onOutsideClose(ev?: Event) {
  const target = ev?.target as Node | null;
  if (target && nestedContains.some(contains => contains(target))) return;
  close();
}

/** 选中：触发本级 select 并按需收起；作为子菜单时继续向父级冒泡，整条链路一起收起 */
function handleSelect(value: DropdownValue, ev: Event) {
  emit('select', value, ev);
  if (props.hideOnSelect) close();
  parent?.select(value, ev);
}

/** 12 向位置映射为 SelectTrigger 的 side / align；间距显式传入优先，否则带箭头时留出箭头伸出面板的长度再加间隙 */
const resolvedPlacement = computed(() => resolvePlacement(props.placement));
const offset = computed(() => props.popupOffset ?? (props.showArrow ? ARROW_POPUP_OFFSET : POPUP_OFFSET));

/**
 * options 渲染用的 key：原始值带上类型前缀作 key，增删选项时不会错位复用；对象值无法作 key，退回下标。
 * 两类 key 放在不同前缀下互不相撞（数字值 1 与第 2 项对象的下标 1 不再重复），
 * 同一原始值重复出现时按出现次数追加序号，保证兄弟节点间 key 唯一
 */
const optionKeys = computed(() => {
  const seen = new Map<string, number>();
  return props.options.map((option, index) => {
    const { value } = option;
    if (typeof value === 'object' && value !== null) return `i:${index}`;
    const base = `v:${typeof value}:${String(value)}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count ? `${base}#${count}` : base;
  });
});

// ─── 样式 ───────────────────────────────────────────────────────

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = dropdownTheme();
  const slot = (key: keyof DropdownUI) => (opts?: { class?: any }) =>
    styles[key]({ class: cn(opts?.class, uiOverrides.value[key]) });
  return {
    wrapper: () => styles.wrapper({ class: cn(uiOverrides.value.wrapper, props.class) }),
    trigger: slot('trigger'),
    panel: slot('panel'),
    header: slot('header'),
    list: slot('list'),
    item: slot('item'),
    itemIcon: slot('itemIcon'),
    itemLabel: slot('itemLabel'),
    submenuIcon: slot('submenuIcon'),
    group: slot('group'),
    groupTitle: slot('groupTitle'),
    footer: slot('footer'),
  };
});

provide(DROPDOWN_INJECTION_KEY, {
  select: handleSelect,
  hoverEnter: onMouseEnter,
  hoverLeave: onMouseLeave,
  registerNested,
  ui: computed(() => ({
    item: ui.value.item,
    itemIcon: ui.value.itemIcon,
    itemLabel: ui.value.itemLabel,
    submenuIcon: ui.value.submenuIcon,
    group: ui.value.group,
    groupTitle: ui.value.groupTitle,
  })),
});

defineExpose({
  /** 展开菜单（禁用时无效） */
  open,
  /** 收起菜单 */
  close,
  /** 切换展开 / 收起 */
  toggle,
  /** 节点是否位于本菜单（触发器 + 面板）或任一子级菜单内 */
  contains: containsNode,
});
</script>

<template>
  <RebornSelectTrigger
    ref="triggerRef"
    :is-open="popupVisible" :disabled="disabled" :portal="portal" :close-on="closeOn"
    :auto-adjust-overflow="autoAdjustOverflow"
    :side="resolvedPlacement.side" :align="resolvedPlacement.align" :offset="offset" :arrow="showArrow"
    :class="ui.wrapper()" :ui="{
      /* 浮层宽度由菜单内容撑开，不跟随触发器 */
      dropdown: 'w-auto!',
    }"
    @keydown="onKeydown" @close="onOutsideClose"
  >
    <template #trigger>
      <div :class="ui.trigger({ class: disabled && 'cursor-not-allowed' })" @click="onTriggerClick" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <!-- 下发显隐状态与控制方法，供 manual 触发方式（或任意触发方式下的局部控件）使用 -->
        <slot :visible="popupVisible" :open="open" :close="close" :toggle="toggle" />
      </div>
    </template>

    <template #content>
      <div :class="ui.panel()" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <div v-if="slots.header" :class="ui.header()">
          <slot name="header" />
        </div>

        <div :class="ui.list()" role="menu">
          <!-- content 插槽优先；未提供时按 options 渲染 -->
          <slot name="content">
            <RebornDoption
              v-for="(option, index) in options" :key="optionKeys[index]"
              :value="option.value"
              :disabled="option.disabled"
            >
              <template v-if="option.icon" #icon>
                <Icon :name="option.icon" class="size-4" />
              </template>
              {{ option.label }}
            </RebornDoption>
          </slot>
        </div>

        <div v-if="slots.footer" :class="ui.footer()">
          <slot name="footer" />
        </div>
      </div>
    </template>
  </RebornSelectTrigger>
</template>
