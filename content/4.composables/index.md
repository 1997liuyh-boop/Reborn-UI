---
title: 组合式函数
description: Reborn UI 的组合式函数与命令式工具列表，涵盖快捷键、表单状态、浮层控制、加载遮罩、滚动锁、剪贴板和文档站导航。
navigation: false
---

# 组合式函数

这一节收录可以直接在业务代码里调用的组合式函数（`app/composables`），以及两个命令式工具 `copyToClipboard`、`showLoading` 和文档站自身用到的 `useNavigation`。以 `use` 开头的需要在组件 `setup` 中调用，状态与清理跟随调用方；`copyToClipboard`、`showLoading` 是调用即执行的动作，可以放在事件回调里。除 `useFieldGroup` 两端都有实现（UniApp 端在 `packages/uniapp-project/src/composables`）外，其余都只在 Web 端提供。

## 列表

- [defineShortcuts](/composables/define-shortcuts)：注册全局键盘快捷键，支持组合键、链式快捷键、输入框焦点控制和布局无关模式。
- [copyToClipboard](/composables/copy-to-clipboard)：把文本写入系统剪贴板并按结果弹出成功或失败提示，返回是否写入成功；每次调用都执行一次写入。
- [useFieldGroup](/composables/use-field-group)：表单三层状态共享，让自定义控件继承表单的尺寸、禁用状态并参与校验（Web / UniApp）。
- [useGlobalScrollLock](/composables/use-global-scroll-lock)：全局共享计数的页面滚动锁，自建全屏层与库内抽屉、遮罩、加载遮罩叠加时不会互相解锁，持锁方的作用域销毁时自动释放。
- [showLoading](/composables/show-loading)：服务式加载遮罩，在逻辑代码中创建全屏或局部遮罩，返回可关闭、可更新的实例。
- [useNavigation](/composables/use-navigation)：文档站侧边栏使用，按当前路由与顶栏平台开关取出当前分区的导航数据。
- [useOverlay](/composables/use-overlay)：以编程方式管理 Dialog、Drawer 及其二次封装组件的打开、关闭、更新和销毁，支持异步确认，实例随创建者的作用域注销。
