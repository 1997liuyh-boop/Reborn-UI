import type {
  NotificationHandle,
  NotificationOptions,
  NotificationType,
} from './reborn-notification.config';
import { RebornNotification } from '#components';
import { useNuxtApp } from '#imports';
import { createVNode, getCurrentInstance, render } from 'vue';
import { addNotification, destroyNotifications, notificationState } from './reborn-notification.config';

export type {
  NotificationHandle,
  NotificationOptions,
  NotificationPosition,
  NotificationProgressOptions,
  NotificationType,
} from './reborn-notification.config';

/** 系统级通知选项：走浏览器原生 Notification，只接受纯文本与图片 URL */
export interface SystemNotificationOptions {
  /** 系统通知标题；原生通知必须有标题，缺省取当前页面标题 */
  title?: string;
  /** 正文内容，仅支持纯文本 */
  message?: string;
  /** 图标图片 URL；原生通知不接受图标名或 VNode */
  icon?: string;
  /** 同 tag 的系统通知会原位替换，相当于站内通知的 key */
  tag?: string;
  /** 静默通知：不播放提示音、不振动 */
  silent?: boolean;
  /** 要求用户交互后才消失；是否生效取决于操作系统 */
  requireInteraction?: boolean;
  /** 显示时长（毫秒），到时主动收回；缺省或 0 表示交给系统管理 */
  duration?: number;
  /** 点击系统通知时触发；组件会先把焦点拉回本页面再执行回调 */
  onClick?: (event: Event) => void;
  /** 系统通知关闭时触发 */
  onClose?: () => void;
  /** 环境不支持或用户拒绝授权时的回退：true 转为站内通知，传站内 config 可定制回退样式，false 直接放弃 */
  fallback?: boolean | NotificationOptions;
}

/** 系统级通知的调用结果 */
export interface SystemNotificationResult {
  /** 实际使用的通道：system 系统通知 / inapp 站内回退 / none 未能展示 */
  channel: 'system' | 'inapp' | 'none';
  /** 浏览器授权状态；unsupported 表示当前环境没有原生 Notification 能力 */
  permission: 'default' | 'denied' | 'granted' | 'unsupported';
  /** 收回本条通知；站内回退时同样生效 */
  close: () => void;
}

let containerEl: HTMLElement | null = null;
/** appendTo 是容器级设置，由最近一次显式传值的调用写入 */
let appendTarget: string | HTMLElement | undefined;

/** 解析挂载父级：选择器字符串 / 元素 / 缺省 document.body */
function resolveParent(): HTMLElement {
  if (typeof appendTarget === 'string') {
    try {
      const found = document.querySelector(appendTarget);
      if (found instanceof HTMLElement) return found;
    } catch {
      // 非法选择器时回退到 body
    }
  } else if (appendTarget) {
    return appendTarget;
  }
  return document.body;
}

/**
 * 确保通知容器已挂载（命令式调用时自动初始化）；
 * appendTo 变更时把容器节点移动到新的父级
 */
function mountContainer() {
  if (typeof document === 'undefined') return;

  const parent = resolveParent();
  // 只有贴 body（即贴视口四边）时才需要为滚动条占位做贴边补偿，
  // appendTo 指到自定义容器时贴的是该容器的边，不做补偿
  notificationState.viewportAnchored = parent === document.body;

  if (!containerEl) {
    containerEl = document.createElement('div');
    const vnode = createVNode(RebornNotification);
    // 命令式调用大多发生在事件回调里（无组件实例），必须兜底拿应用上下文，
    // 否则容器内的 NuxtIcon 等依赖 app provide 的组件会在 setup 中崩溃
    const instance = getCurrentInstance();
    if (instance) {
      vnode.appContext = instance.appContext;
    } else {
      try {
        vnode.appContext = (useNuxtApp().vueApp as any)._context;
      } catch {
        // 拿不到应用上下文时仍渲染，仅自定义组件类内容可能受限
      }
    }
    render(vnode, containerEl);
  }

  if (containerEl.parentElement !== parent) {
    parent.appendChild(containerEl);
  }
}

/** 打开一条通知，返回可手动关闭的实例句柄 */
function open(options: NotificationOptions): NotificationHandle {
  if (options.appendTo !== undefined) appendTarget = options.appendTo;
  mountContainer();
  return addNotification(options);
}

/** 归一化 (config) 与 (message) 两种调用形态：字符串视作正文内容 */
function normalize(options: NotificationOptions | string): NotificationOptions {
  return typeof options === 'string' ? { message: options } : { ...options };
}

/** 生成某个类型的静态方法 */
function levelMethod(type: NotificationType) {
  return (options: NotificationOptions | string): NotificationHandle =>
    open({ ...normalize(options), type });
}

/** 当前环境是否具备原生系统通知能力；需要 HTTPS 或 localhost 的安全上下文 */
function systemSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** 请求授权：兼容旧版 Safari 只支持回调形态的 requestPermission */
function requestSystemPermission(): Promise<NotificationPermission> {
  return new Promise((resolve) => {
    const maybe = Notification.requestPermission(resolve) as Promise<NotificationPermission> | undefined;
    if (maybe && typeof maybe.then === 'function') maybe.then(resolve);
  });
}

/** 无法走系统通道时按 fallback 配置回退为站内通知 */
function systemFallback(
  config: SystemNotificationOptions,
  permission: SystemNotificationResult['permission'],
): SystemNotificationResult {
  if (config.fallback === false) return { channel: 'none', permission, close: () => {} };
  const handle = open({
    title: config.title,
    message: config.message,
    duration: config.duration,
    onClick: config.onClick,
    onClose: config.onClose,
    ...(typeof config.fallback === 'object' ? config.fallback : {}),
  });
  return { channel: 'inapp', permission, close: handle.close };
}

/**
 * 系统级通知：调用浏览器原生 Notification 在操作系统层面弹出提示，
 * 页面处于后台甚至最小化时依然可见。首次调用会向用户请求授权，
 * 建议放在点击等用户手势里触发；被拒绝或环境不支持时默认回退为站内通知。
 */
async function system(options: SystemNotificationOptions | string): Promise<SystemNotificationResult> {
  const config: SystemNotificationOptions = typeof options === 'string' ? { message: options } : { ...options };
  if (!systemSupported()) return systemFallback(config, 'unsupported');

  let permission = Notification.permission;
  if (permission === 'default') permission = await requestSystemPermission();
  if (permission !== 'granted') return systemFallback(config, permission);

  const native = new Notification(config.title || document.title || '通知', {
    body: config.message,
    icon: config.icon,
    tag: config.tag,
    silent: config.silent,
    requireInteraction: config.requireInteraction,
  });
  native.onclick = (event) => {
    // 用户大概率在别的窗口点到通知，先把焦点拉回本页面再执行业务回调
    window.focus();
    config.onClick?.(event);
  };
  if (config.onClose) native.onclose = () => config.onClose?.();
  // 原生通知的停留时长由操作系统决定，duration 只额外提供「到时主动收回」
  if (config.duration && config.duration > 0) setTimeout(() => native.close(), config.duration);

  return { channel: 'system', permission, close: () => native.close() };
}

/**
 * 命令式通知 API：
 * notification.success({ title: '已发布', message: '内容已对外可见' })、
 * notification.open(config).close() 手动关闭、notification.destroy(key) 按 key 关闭、
 * notification.system(config) 弹出操作系统级提示
 */
export const notification = {
  /** 以完整 config 打开一条通知（不带类型，即无图标、无着色） */
  open: (options: NotificationOptions | string): NotificationHandle => open(normalize(options)),
  success: levelMethod('success'),
  error: levelMethod('error'),
  info: levelMethod('info'),
  warning: levelMethod('warning'),
  /** 系统级提示：浏览器原生 Notification，页面在后台也可见；授权被拒或不支持时回退为站内通知 */
  system,
  /** 全局销毁：不传 key 关闭全部，传 key 关闭对应通知（不含系统级通知） */
  destroy(key?: string | number) {
    destroyNotifications(key);
  },
};
