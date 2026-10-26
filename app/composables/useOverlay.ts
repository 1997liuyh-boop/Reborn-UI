import type { App, AppContext, Component, ComputedRef, PropType, ShallowRef, VNode } from 'vue';
import {
  computed,
  createApp,
  defineComponent,
  getCurrentInstance,
  getCurrentScope,
  h,
  markRaw,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  shallowReactive,
  shallowRef,
  Teleport,
} from 'vue';

/**
 * useOverlay —— 以编程方式管理 reborn-dialog、reborn-drawer 及其二次封装组件
 *
 * 渲染方式：浮层登记在客户端共享的响应式登记表里，由宿主组件 RebornOverlayHost 用 v-for 统一渲染，
 * 再经 Teleport 输出到 body。宿主放在应用根组件（app.vue）里时，浮层留在主组件树中，
 * useId、provide / inject、全局组件与指令、错误处理全部自然继承。
 *
 * 没有放置宿主时，首次 open() 会退回到一个独立的 Vue 应用承载宿主（挂在 body 下），
 * 并尽量继承首个调用方所在应用的上下文；所有浮层共用这一个应用，useId 不会互相撞号。
 *
 * 生命周期：在组件 setup 或 effectScope 内 create() 的实例随该作用域一起注销，
 * 创建者卸载时浮层立即移除、open() 的 Promise 以 undefined 解析；需要跨组件长期持有时传 persistent。
 */

/**
 * 组件 Props 类型
 */
type ComponentProps<T> = T extends new (...args: any[]) => { $props: infer P }
  ? Partial<P>
  : Record<string, any>;

/**
 * Overlay 配置选项
 */
export interface OverlayOptions<T extends Component> {
  /** 创建后立即打开 */
  defaultOpen?: boolean;
  /** 传递给组件的 props */
  props?: ComponentProps<T>;
  /** 关闭时销毁：关闭后从登记表移除，之后再 open() 会被拒绝 */
  destroyOnClose?: boolean;
  /**
   * 不随创建者的作用域注销
   * - 默认 false：在组件 setup / effectScope 内创建时，作用域销毁即卸载浮层并移出登记表
   * - true：跨组件长期持有同一个实例时使用，需要调用方在不再使用时自行 unmount(id)
   */
  persistent?: boolean;
  /** 内容插槽 */
  content?: VNode | (() => VNode);
  /** 头部插槽 */
  header?: VNode | (() => VNode);
  /** 底部插槽 */
  footer?: VNode | (() => VNode);
  /**
   * 确认回调（命令式确认框专用）
   * - 提供后：点击确认时确认按钮进入 loading 并执行本回调
   * - 回调正常返回 → 视为成功，自动关闭并使 open() 解析为 'confirm'
   * - 回调抛出 → 视为失败，保持打开、恢复按钮，可重试
   * - 未提供时保持旧行为：确认仅使 open() 解析为 'confirm'（不自动关闭）
   */
  onConfirm?: () => void | Promise<void>;
}

/**
 * Overlay 实例
 */
export interface OverlayInstance<T extends Component = Component> {
  /** 打开 overlay */
  open: (props?: ComponentProps<T>) => Promise<any>;
  /** 关闭 overlay */
  close: (value?: any) => void;
  /** 更新 props */
  patch: (props: Partial<ComponentProps<T>>) => void;
  /** overlay ID */
  id: symbol;
}

/**
 * overlays 列表中的一项（只读快照，随登记表与开关状态响应式更新）
 */
export interface OverlaySummary {
  /** overlay ID */
  id: symbol;
  /** 托管的组件 */
  component: Component;
  /** 当前是否打开 */
  isOpen: boolean;
  /** 当前渲染用的 props */
  props: Record<string, any>;
}

/**
 * 内部 Overlay 状态
 */
interface OverlayState {
  id: symbol;
  component: Component;
  options: OverlayOptions<Component>;
  /** create() 时的初始 props；每次关闭后基础 props 还原为它 */
  initialProps: Record<string, any>;
  /** 基础 props：初始 props 叠加 patch() 的修改，open() 在它之上浅合并本次传入的 props */
  baseProps: Record<string, any>;
  /** 渲染用 props：整体替换，组件据此响应式更新，不再重建 */
  props: ShallowRef<Record<string, any>>;
  /** 是否打开：决定传给组件的 modelValue / open */
  isOpen: ShallowRef<boolean>;
  /** 是否渲染在宿主里：关闭后保留到离场动画结束，组件才有机会播放离场过渡、发出 closed */
  mounted: ShallowRef<boolean>;
  /** 异步确认进行中：期间拦下取消、关闭与 update:modelValue */
  confirming: ShallowRef<boolean>;
  /** 打开代号：每次打开、关闭或卸载都使旧异步确认失效 */
  generation: number;
  /** 已注销（destroyOnClose 关闭后 / 随作用域卸载）：不再接受 open() */
  disposed: boolean;
  /** 本次 open() 的 Promise 解析函数 */
  resolve?: (value: any) => void;
  /** 离场兜底定时器：组件不发 closed 时到点强制移出宿主 */
  leaveTimer?: ReturnType<typeof setTimeout>;
}

/**
 * 登记表：客户端共享，宿主据此渲染
 * 服务端不会写入：create() 在没有 document 的环境里直接返回空实例，不会跨请求堆积
 */
const overlayStates = shallowReactive(new Map<symbol, OverlayState>());

/** 离场兜底时长（ms）：组件没有发出 closed 时，最多等这么久就移出宿主；组件的 closeDelay 另行累加 */
const LEAVE_FALLBACK_MS = 1000;

/**
 * 将确认按钮配置规整为带 loading 的对象（string / 对象 / 未传 / false 均安全处理）
 * ⚠️ 根因：未传 confirmBtn 时原样返回 undefined，组件回退到自己的默认按钮，loading 注入不进去
 * ✅ 修复：未传时注入只含 loading 的对象，按钮文案等其余配置仍由组件默认值补齐
 */
function withLoading(btn: any, loading: boolean) {
  if (btn === false) return btn;
  if (btn == null) return { loading };
  if (typeof btn === 'string') return { label: btn, loading };
  return { ...btn, loading };
}

/** 构建传递给目标组件的具名插槽（content 选项映射到 default 正文插槽，header / footer 同名透传） */
function buildSlots(state: OverlayState): Record<string, () => VNode> {
  const slots: Record<string, () => VNode> = {};
  (['content', 'header', 'footer'] as const).forEach((key) => {
    const val = state.options[key];
    if (val) {
      const fn = typeof val === 'function' ? val : () => val as VNode;
      // RebornDialog 重构后正文为 default 插槽；content 键仅作为选项名保留
      slots[key === 'content' ? 'default' : key] = fn;
    }
  });
  return slots;
}

/** 以给定值解析本次 open() 的 Promise（只解析一次） */
function settle(state: OverlayState, value: any) {
  const resolve = state.resolve;
  state.resolve = undefined;
  resolve?.(value);
}

function clearLeaveTimer(state: OverlayState) {
  if (state.leaveTimer) {
    clearTimeout(state.leaveTimer);
    state.leaveTimer = undefined;
  }
}

/** 离场兜底时长：组件的 closeDelay 会推迟离场的开始，需要一并等待 */
function leaveFallbackDelay(state: OverlayState) {
  const delay = Number(state.props.value.closeDelay);
  return LEAVE_FALLBACK_MS + (Number.isFinite(delay) && delay > 0 ? delay : 0);
}

/** 离场结束：移出宿主；已注销的实例同时移出登记表 */
function finishLeave(state: OverlayState) {
  clearLeaveTimer(state);
  // 离场途中又被 open()：保持渲染
  if (state.isOpen.value) return;
  state.mounted.value = false;
  state.confirming.value = false;
  if (state.disposed) overlayStates.delete(state.id);
}

/**
 * 打开指定 ID 的 overlay
 */
function openOverlay(id: symbol, props?: Record<string, any>): Promise<any> {
  const state = overlayStates.get(id);
  if (!state || state.disposed) {
    return Promise.reject(new Error(`Overlay with id ${id.toString()} not found`));
  }

  // 已打开时再次 open：先以 undefined 解析上一次的 Promise，否则之前 await 的调用方永远等不到结果
  state.generation++;
  settle(state, undefined);
  // 离场途中重新打开：撤销兜底卸载，组件不重建，直接切回打开态
  clearLeaveTimer(state);
  state.confirming.value = false;

  // 本次传入的 props 只对这一次打开生效
  state.props.value = { ...state.baseProps, ...props };
  state.isOpen.value = true;
  state.mounted.value = true;
  ensureHost();

  return new Promise((resolve) => {
    state.resolve = resolve;
  });
}

/**
 * 关闭指定 ID 的 overlay
 * 关闭即解析 Promise；组件保持渲染到离场动画结束（发出 closed 或兜底定时器到点）再移出宿主
 */
function closeOverlay(id: symbol, value?: any): void {
  const state = overlayStates.get(id);
  if (!state) return;
  state.generation++;
  state.confirming.value = false;

  // 基础 props 还原为初始值：patch() 的修改只保留到本次关闭；
  // 渲染用 props 不动，离场动画期间内容不跳变
  state.baseProps = { ...state.initialProps };
  if (!state.isOpen.value) return;

  state.isOpen.value = false;
  settle(state, value);
  if (state.options.destroyOnClose) state.disposed = true;

  clearLeaveTimer(state);
  state.leaveTimer = setTimeout(() => finishLeave(state), leaveFallbackDelay(state));
}

/**
 * 更新指定 ID 的 overlay props
 * 已渲染时直接改写渲染用 props，组件内部状态（输入中的表单、滚动位置、焦点）不受影响
 */
function patchOverlay(id: symbol, props: Record<string, any>): void {
  const state = overlayStates.get(id);
  if (!state) return;

  state.baseProps = { ...state.baseProps, ...props };
  if (state.mounted.value) {
    state.props.value = { ...state.props.value, ...props };
  }
}

/**
 * 卸载指定 ID 的 overlay：立即移出宿主与登记表（不播放离场动画），之后该 id 无法再打开
 */
function unmountOverlay(id: symbol): void {
  const state = overlayStates.get(id);
  if (!state) return;
  state.generation++;

  clearLeaveTimer(state);
  state.disposed = true;
  state.isOpen.value = false;
  state.confirming.value = false;
  settle(state, undefined);
  state.mounted.value = false;
  overlayStates.delete(id);
}

/**
 * 关闭所有处于打开状态的 overlay
 */
function closeAllOverlays(): void {
  for (const [id, state] of overlayStates) {
    if (state.isOpen.value) closeOverlay(id);
  }
}

/** 渲染单个浮层：合并 props，统一处理确认（loading / 异步 / 成功关闭 / 失败保持）、取消、关闭与离场结束 */
function renderOverlay(state: OverlayState) {
  const { id } = state;
  const userProps = state.props.value;
  const handler = state.options.onConfirm;
  const open = state.isOpen.value;

  const mergedProps: Record<string, any> = {
    ...userProps,
    // dialog / drawer 均为 modelValue 双向绑定；open 键供以 v-model:open 封装的组件使用
    modelValue: open,
    open,
    // 有异步确认回调时，为确认按钮注入 loading 态
    ...(handler ? { confirmBtn: withLoading(userProps.confirmBtn, state.confirming.value) } : {}),
    'onUpdate:modelValue': (value: boolean) => {
      // 确认进行中锁定，避免中途关闭打断异步流程
      if (!value && !state.confirming.value) closeOverlay(id);
    },
    'onUpdate:open': (value: boolean) => {
      if (!value && !state.confirming.value) closeOverlay(id);
    },
    'onConfirm': async () => {
      if (state.disposed || !state.isOpen.value) return;
      if (!handler) {
        // 向后兼容：无回调时仅解析 'confirm'，由调用方决定关闭时机
        settle(state, 'confirm');
        return;
      }
      if (state.confirming.value) return; // 防重复提交
      const generation = state.generation;
      state.confirming.value = true;
      try {
        await handler();
        if (generation !== state.generation) return;
        // 成功 → 先恢复按钮再关闭并解析 'confirm'，离场动画期间按钮不再转圈
        state.confirming.value = false;
        closeOverlay(id, 'confirm');
      }
      catch {
        if (generation !== state.generation) return;
        state.confirming.value = false; // 失败 → 保持打开，可重试
      }
    },
    'onCancel': () => {
      if (!state.confirming.value) closeOverlay(id, 'cancel');
    },
    'onClose': (value?: any) => {
      if (!state.confirming.value) closeOverlay(id, value);
    },
    // 离场过渡结束：移出宿主（使用方自己传的 onClosed 照常调用）
    'onClosed': (...args: unknown[]) => {
      if (typeof userProps.onClosed === 'function') userProps.onClosed(...args);
      finishLeave(state);
    },
  };

  return h(state.component, mergedProps, buildSlots(state));
}

/** 单个浮层的渲染单元：各自独立更新，patch 一个浮层不牵动其它浮层 */
const OverlayItem = defineComponent({
  name: 'RebornOverlayItem',
  props: {
    state: { type: Object as PropType<OverlayState>, required: true },
  },
  setup(props) {
    return () => renderOverlay(props.state);
  },
});

/** 已挂载的正式宿主（后挂载的在栈顶，只有栈顶宿主渲染浮层） */
const hostStack = shallowRef<readonly symbol[]>([]);

/** 退回用的独立应用（未放置正式宿主时由 open() 按需创建） */
let fallbackHost: { app: App; container: HTMLElement } | null = null;
let fallbackSeq = 0;
/** 首个在组件内调用 useOverlay() 的应用上下文：退回独立应用时借用 */
let parentContext: AppContext | null = null;

function defineHost(fallback: boolean) {
  return defineComponent({
    name: fallback ? 'RebornOverlayFallbackHost' : 'RebornOverlayHost',
    setup() {
      const token = Symbol('overlay-host');
      /** 只在客户端挂载后渲染：服务端与水合首帧都输出空，避免 Teleport 引起的水合差异 */
      const ready = shallowRef(false);

      onMounted(() => {
        ready.value = true;
        if (!fallback) {
          hostStack.value = [...hostStack.value, token];
          // 正式宿主就位后，退回用的独立应用不再需要
          disposeFallbackHost();
        }
      });
      onBeforeUnmount(() => {
        if (!fallback) hostStack.value = hostStack.value.filter(item => item !== token);
      });

      return () => {
        const active = fallback ? hostStack.value.length === 0 : hostStack.value.at(-1) === token;
        if (!ready.value || !active) return null;
        const items: VNode[] = [];
        for (const state of overlayStates.values()) {
          if (state.mounted.value) items.push(h(OverlayItem, { key: state.id, state }));
        }
        return h(Teleport, { to: 'body' }, items);
      };
    },
  });
}

/**
 * 浮层宿主：放在应用根组件里（例如 app.vue 的 UApp 内），所有 useOverlay 浮层都在这里渲染
 *
 * ```vue
 * <script setup lang="ts">
 * import { RebornOverlayHost } from '~/composables/useOverlay'
 * </script>
 *
 * <template>
 *   <UApp>
 *     <NuxtPage />
 *     <RebornOverlayHost />
 *   </UApp>
 * </template>
 * ```
 */
export const RebornOverlayHost = defineHost(false);

const FallbackHost = defineHost(true);

/** 退回模式下继承父应用的上下文：错误处理、全局属性、全局组件与指令、应用级 provide */
function inheritAppContext(app: App, parent: AppContext) {
  app.config.errorHandler = parent.config.errorHandler;
  app.config.warnHandler = parent.config.warnHandler;
  Object.assign(app.config.globalProperties, parent.config.globalProperties);
  for (const [name, component] of Object.entries(parent.components)) app.component(name, component);
  for (const [name, directive] of Object.entries(parent.directives)) app.directive(name, directive);
  const provides = parent.provides as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(provides)) app.provide(key as string, provides[key]);
  // Nuxt 的 useNuxtApp() 从 appContext.app.$nuxt 取应用实例
  const nuxtApp = (parent.app as unknown as Record<string, unknown>).$nuxt;
  if (nuxtApp) (app as unknown as Record<string, unknown>).$nuxt = nuxtApp;
}

/** 没有正式宿主时，挂载一个承载宿主的独立应用；所有浮层共用它，useId 计数不会互相撞号 */
function ensureHost() {
  if (hostStack.value.length > 0 || fallbackHost || typeof document === 'undefined') return;
  const container = document.createElement('div');
  container.setAttribute('data-reborn-overlay-host', '');
  document.body.appendChild(container);
  const app = createApp(FallbackHost);
  // 独立前缀：与主应用的 useId（默认前缀 v）区分开
  app.config.idPrefix = `rb-overlay-${++fallbackSeq}`;
  if (parentContext) inheritAppContext(app, parentContext);
  app.mount(container);
  fallbackHost = { app, container };
}

function disposeFallbackHost() {
  if (!fallbackHost) return;
  const { app, container } = fallbackHost;
  fallbackHost = null;
  app.unmount();
  container.remove();
}

/** 记下调用方所在应用的上下文（只记第一个，且跳过退回用的独立应用自身） */
function rememberParentContext() {
  // 服务端应用上下文属于单次请求，不能保存在模块级缓存中。
  if (typeof document === 'undefined' || parentContext) return;
  const context = getCurrentInstance()?.appContext;
  if (context && context.app !== fallbackHost?.app) parentContext = context;
}

/** 服务端使用的空实例：不登记、不渲染 */
function createNoopInstance<T extends Component>(): OverlayInstance<T> {
  return {
    id: Symbol('overlay'),
    open: () => Promise.resolve(undefined),
    close: () => {},
    patch: () => {},
  };
}

/**
 * useOverlay composable
 * 用于全局管理 reborn-dialog 和 reborn-drawer 组件及其二次封装组件
 */
export function useOverlay() {
  rememberParentContext();

  /**
   * 创建一个 overlay 实例
   */
  function create<T extends Component>(component: T, options?: OverlayOptions<T>): OverlayInstance<T> {
    // 服务端不登记：open() 依赖 document，登记了也用不上，只会跨请求堆积
    if (typeof document === 'undefined') return createNoopInstance<T>();
    rememberParentContext();

    const id = Symbol('overlay');
    const initialProps = { ...(options?.props as Record<string, any> | undefined) };
    const state: OverlayState = markRaw({
      id,
      component: markRaw(component as Component),
      options: (options as OverlayOptions<Component>) || {},
      initialProps,
      baseProps: { ...initialProps },
      props: shallowRef({ ...initialProps }),
      isOpen: shallowRef(false),
      mounted: shallowRef(false),
      confirming: shallowRef(false),
      generation: 0,
      disposed: false,
    });

    overlayStates.set(id, state);

    // 在组件 / effectScope 内创建时，随作用域一起卸载并移出登记表：
    // 创建者卸载后不再残留记录，打开中的浮层也不会比创建它的组件活得更久
    if (!options?.persistent && getCurrentScope()) {
      onScopeDispose(() => unmountOverlay(id));
    }

    const instance: OverlayInstance<T> = {
      id,
      open: (props?: ComponentProps<T>) => openOverlay(id, props as Record<string, any> | undefined),
      close: (value?: any) => closeOverlay(id, value),
      patch: (props: Partial<ComponentProps<T>>) => patchOverlay(id, props as Record<string, any>),
    };

    // 如果设置了 defaultOpen，立即打开
    if (options?.defaultOpen) {
      void instance.open();
    }

    return instance;
  }

  /**
   * 打开指定 ID 的 overlay
   */
  function open<T extends Component>(id: symbol, props?: ComponentProps<T>): Promise<any> {
    return openOverlay(id, props as Record<string, any> | undefined);
  }

  /**
   * 更新指定 ID 的 overlay props
   */
  function patch<T extends Component>(id: symbol, props: Partial<ComponentProps<T>>): void {
    patchOverlay(id, props as Record<string, any>);
  }

  /**
   * 检查指定 ID 的 overlay 是否打开（响应式，可在模板与 computed 中使用）
   */
  function isOpen(id: symbol): boolean {
    return overlayStates.get(id)?.isOpen.value ?? false;
  }

  /**
   * 登记表中的全部 overlay（响应式：增删与开关都会反映）
   */
  const overlays: ComputedRef<OverlaySummary[]> = computed(() =>
    Array.from(overlayStates.values(), state => ({
      id: state.id,
      component: state.component,
      isOpen: state.isOpen.value,
      props: state.props.value,
    })),
  );

  return {
    create,
    open,
    close: closeOverlay,
    closeAll: closeAllOverlays,
    patch,
    unmount: unmountOverlay,
    isOpen,
    overlays,
  };
}

// 导出类型
export type OverlayReturn = ReturnType<typeof useOverlay>;
