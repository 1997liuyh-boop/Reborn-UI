import type { VNode } from "vue";
import type { RebornDialogProps } from "./RebornDialog.vue";
import { Icon } from "#components";
import { useNuxtApp } from "#imports";
import { createVNode, defineComponent, getCurrentInstance, h, render, shallowRef } from "vue";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornDialog from "./RebornDialog.vue";

export { default as RebornDialog } from "./RebornDialog.vue";
export type { DialogTransition, RebornDialogProps, RebornDialogUi } from "./RebornDialog.vue";

/** 命令式确认框类型 */
export type ModalType = "primary" | "info" | "success" | "warning" | "error" | "confirm";

/** 命令式内容节点：字符串 / VNode / 渲染函数 */
export type ModalContent = string | VNode | (() => VNode | VNode[]);

/**
 * Modal.method() 配置：在 RebornDialog 属性基础上扩展命令式专属项。
 * 生命周期事件以 onBeforeOpen / onOpened / onBeforeClose / onClosed 等驼峰键传入。
 */
export interface ModalMethodOptions
  extends Omit<RebornDialogProps, "cancelBtn" | "confirmBtn" | "beforeClose"> {
  /** 正文内容 */
  content?: ModalContent;
  /** 自定义头部图标名（默认按 type 取内置图标） */
  icon?: string;
  /** 确定按钮文案 */
  okText?: string;
  /** 取消按钮文案（仅 confirm 类型渲染取消按钮） */
  cancelText?: string;
  /**
   * 触发 ok 事件前的回调。返回 false 阻断后续事件；
   * 也可调用 done(closed) 异步接管关闭：done(true) 关闭、done(false) 仅结束加载
   */
  onBeforeOk?: (done: (closed: boolean) => void) => void | boolean | Promise<void | boolean>;
  /** 触发 cancel 事件前的回调，返回 false 阻断后续事件 */
  onBeforeCancel?: () => boolean;
  /** 点击确定回调，参数为关闭函数；返回 Promise 时 resolve 关闭、reject 不关闭 */
  onOk?: (close: () => void) => any;
  /** 点击取消回调（遮罩 / ESC / 关闭按钮同样走此流程），参数为关闭函数；Promise 语义同 onOk */
  onCancel?: (close: () => void) => any;
  /** 是否允许按钮加载中状态：异步回调未落定期间按钮显示 loading，默认开启 */
  onLoading?: boolean;
  /** 打开动画开始前回调 */
  onBeforeOpen?: () => void;
  /** 打开动画结束回调 */
  onOpened?: () => void;
  /** 关闭动画开始前回调 */
  onBeforeClose?: () => void;
  /** 关闭动画结束回调 */
  onClosed?: () => void;
}

/** Modal.method() 返回的实例句柄 */
export interface ModalReturn {
  /** 走关闭动画正常关闭 */
  close: () => void;
  /** 立即销毁（跳过动画），Modal.destroyAll 亦逐个调用此方法 */
  destroy: () => void;
}

/** 各类型的默认图标与配色 */
// 随组件提供状态图标，避免在运行时请求外部图标集。
const feedbackIconPaths = new Map<string, string>([
  ["ant-design:info-outlined", "M448 224a64 64 0 1 0 128 0a64 64 0 1 0-128 0m96 168h-64c-4.4 0-8 3.6-8 8v464c0 4.4 3.6 8 8 8h64c4.4 0 8-3.6 8-8V400c0-4.4-3.6-8-8-8"],
  ["ant-design:exclamation-outlined", "M448 804a64 64 0 1 0 128 0a64 64 0 1 0-128 0m32-168h64c4.4 0 8-3.6 8-8V164c0-4.4-3.6-8-8-8h-64c-4.4 0-8 3.6-8 8v464c0 4.4 3.6 8 8 8"],
]);

const TYPE_PRESETS: Record<ModalType, { icon: string; iconBackground: string }> = {
  primary: { icon: "ant-design:info-outlined", iconBackground: "bg-brand-6" },
  info: { icon: "ant-design:info-outlined", iconBackground: "bg-blue-6" },
  success: { icon: "lucide:check", iconBackground: "bg-green-6" },
  warning: { icon: "ant-design:exclamation-outlined", iconBackground: "bg-orange-6" },
  error: { icon: "lucide:x", iconBackground: "bg-red-6" },
  confirm: { icon: "lucide:circle-help", iconBackground: "bg-orange-6" },
};

/** 存活中的命令式实例注册表（destroyAll 的依据） */
const activeModals = new Set<ModalReturn>();

/** 解析命令式弹窗的字符串、节点或渲染函数。 */
function renderContent(content?: ModalContent) {
  return typeof content === "function" ? content() : content;
}

/**
 * 创建一个命令式确认框：挂独立容器渲染 RebornDialog，
 * 页脚按钮 / 遮罩关闭统一经 onBeforeOk / onBeforeCancel / onOk / onCancel 门控
 */
function createModal(type: ModalType, options: ModalMethodOptions = {}): ModalReturn {
  if (typeof document === "undefined") {
    return { close: () => {}, destroy: () => {} };
  }

  const {
    content,
    icon,
    okText,
    cancelText,
    onBeforeOk,
    onBeforeCancel,
    onOk,
    onCancel,
    onLoading,
    onClosed,
    ...dialogProps
  } = options;

  const preset = TYPE_PRESETS[type];
  const iconName = icon ?? preset.icon;
  const iconPath = feedbackIconPaths.get(iconName);
  const useLoading = onLoading !== false;

  const open = shallowRef(true);
  const okLoading = shallowRef(false);
  const cancelLoading = shallowRef(false);

  const container = document.createElement("div");
  let destroyed = false;
  /** 本实例句柄，dispose 时凭它把自己从注册表摘除；句柄对象在下方创建后回填 */
  let selfHandle: ModalReturn | null = null;

  /** 彻底移除渲染与注册（关闭动画结束或 destroy 时调用） */
  function dispose() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    if (selfHandle) {
      activeModals.delete(selfHandle);
    }
    render(null, container);
    container.remove();
  }

  /** 正常关闭：走关闭动画，动画结束后 dispose */
  function closeModal() {
    open.value = false;
  }

  /** 点击确定：onBeforeOk 门控 → onOk 回调 → 关闭 */
  async function handleOk() {
    if (okLoading.value || cancelLoading.value) {
      return;
    }

    if (onBeforeOk) {
      let doneCalled = false;
      const done = (closed: boolean) => {
        doneCalled = true;
        okLoading.value = false;
        if (closed) {
          closeModal();
        }
      };

      if (useLoading) {
        okLoading.value = true;
      }

      let isPromise = false;
      let result: void | boolean;
      try {
        const raw = onBeforeOk(done);
        isPromise = raw instanceof Promise;
        result = isPromise ? await (raw as Promise<void | boolean>) : (raw as void | boolean);
      } catch {
        okLoading.value = false;
        return;
      }

      // done 已被调用则由其接管关闭；显式返回 false 阻断后续事件
      if (doneCalled) {
        return;
      }
      if (result === false) {
        okLoading.value = false;
        return;
      }
      // 同步回调声明了 done 参数且未显式返回结果：等待 done 异步驱动关闭，保持 loading
      if (!isPromise && result === undefined && onBeforeOk.length > 0) {
        return;
      }
      okLoading.value = false;
    }

    if (onOk) {
      const ret = onOk(closeModal);
      if (ret instanceof Promise) {
        if (useLoading) {
          okLoading.value = true;
        }
        try {
          await ret;
          closeModal();
        } catch {
          // reject 表示不关闭，保持打开可重试
        } finally {
          okLoading.value = false;
        }
        return;
      }
    }

    closeModal();
  }

  /** 取消 / 遮罩 / ESC / 关闭按钮：onBeforeCancel 门控 → onCancel 回调 → 关闭 */
  async function handleCancel() {
    if (okLoading.value || cancelLoading.value) {
      return;
    }

    if (onBeforeCancel && onBeforeCancel() === false) {
      return;
    }

    if (onCancel) {
      const ret = onCancel(closeModal);
      if (ret instanceof Promise) {
        if (useLoading) {
          cancelLoading.value = true;
        }
        try {
          await ret;
          closeModal();
        } catch {
          // reject 表示不关闭
        } finally {
          cancelLoading.value = false;
        }
        return;
      }
    }

    closeModal();
  }

  // confirm 类型默认带取消按钮；其余类型显式传入 cancelText 时也渲染取消按钮
  const showCancel = type === "confirm" || cancelText != null;

  const Host = defineComponent({
    name: "RebornModalHost",
    setup() {
      return () =>
        h(
          RebornDialog,
          {
            width: 420,
            alignCenter: true,
            showClose: false,
            ...dialogProps,
            modelValue: open.value,
            "onUpdate:modelValue": (value: boolean) => {
              open.value = value;
            },
            // 遮罩 / ESC / 关闭按钮触发的关闭统一并入取消门控流程
            beforeClose: () => {
              void handleCancel();
            },
            cancelBtn: false,
            confirmBtn: false,
            onClosed: () => {
              onClosed?.();
              dispose();
            },
          },
          {
            // content 渲染在 describe 描述位置：标题行下方、与标题间隔 8px（headerContent 的 gap）并与标题文字左对齐
            header: () => {
              const nodes = [
                h("div", { class: "flex min-w-0 items-center gap-2" }, [
                  h("span", {
                    class: ["flex size-4 shrink-0 items-center justify-center rounded-full text-gray-1", preset.iconBackground],
                    "aria-hidden": "true",
                  }, [
                    iconPath
                      ? h("svg", { class: "size-3", viewBox: "0 0 1024 1024", fill: "currentColor" }, [
                          h("path", { d: iconPath }),
                        ])
                      : h(Icon, { name: iconName, class: "size-3" }),
                  ]),
                  // 标题样式与 RebornDialog 的 title slot 保持一致（text-lg / 500 / gray-10）
                  h(
                    "span",
                    { class: "truncate text-lg font-medium text-gray-10" },
                    dialogProps.title || "提示",
                  ),
                ]),
              ];
              // content 优先，回退 describe / description，保证两种写法都落在描述位置
              const body = renderContent(content ?? dialogProps.describe ?? dialogProps.description);
              if (body) {
                // 左缩进等于圆底宽度 16px 加间隔 8px，让正文与标题对齐。
                nodes.push(h("div", { class: "pl-6 text-base text-gray-8 whitespace-pre-line" }, [body]));
              }
              return nodes;
            },
            footer: () => {
              const buttons = [];
              if (showCancel) {
                buttons.push(
                  h(RebornButton, {
                    label: cancelText || "取消",
                    color: "neutral",
                    variant: "outlined",
                    size: "md",
                    loading: cancelLoading.value,
                    onClick: () => void handleCancel(),
                  }),
                );
              }
              buttons.push(
                h(RebornButton, {
                  label: okText || "确定",
                  color: "primary",
                  variant: "filled",
                  size: "md",
                  loading: okLoading.value,
                  onClick: () => void handleOk(),
                }),
              );
              return buttons;
            },
          },
        );
    },
  });

  const vnode = createVNode(Host);
  // 命令式调用大多发生在事件回调里（无组件实例），必须兜底拿应用上下文，
  // 否则 Icon 等依赖 app provide 的组件会在 setup 中崩溃
  const instance = getCurrentInstance();
  if (instance) {
    vnode.appContext = instance.appContext;
  } else {
    try {
      vnode.appContext = (useNuxtApp().vueApp as any)._context;
    } catch {
      // 拿不到应用上下文时仍渲染，仅部分依赖注入的内容可能受限
    }
  }

  document.body.appendChild(container);
  render(vnode, container);

  const handle: ModalReturn = {
    close: closeModal,
    destroy: dispose,
  };

  selfHandle = handle;
  activeModals.add(handle);
  return handle;
}

/** 生成某个类型的静态方法 */
function typeMethod(type: ModalType) {
  return (options?: ModalMethodOptions) => createModal(type, options);
}

/**
 * 命令式确认框 API：
 * Modal.info(config)、Modal.confirm({ title, content, onOk })，返回 { close, destroy }；
 * Modal.destroyAll() 用于路由切换等场景批量销毁所有存活实例
 */
export const Modal = {
  primary: typeMethod("primary"),
  info: typeMethod("info"),
  success: typeMethod("success"),
  warning: typeMethod("warning"),
  error: typeMethod("error"),
  confirm: typeMethod("confirm"),
  /** 销毁所有由 Modal.method() 打开的确认框（跳过关闭动画） */
  destroyAll() {
    [...activeModals].forEach((item) => item.destroy());
  },
};
