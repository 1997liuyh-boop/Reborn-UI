---
title: 组合式函数
description: Reborn UI 的组合式函数列表，涵盖快捷键、表单状态、浮层控制、加载遮罩、滚动锁、剪贴板和文档站导航。
navigation: false
---

# 组合式函数

这一节收录 `app/composables` 下可以直接在业务代码里调用的组合式函数，以及文档站自身用到的 `useNavigation`。除 `useFieldGroup` 两端都有实现（UniApp 端在 `packages/uniapp-project/src/composables`）外，其余都只在 Web 端提供。

## 列表

- [defineShortcuts](/composables/define-shortcuts)：注册全局键盘快捷键，支持组合键、链式快捷键、输入框焦点控制和布局无关模式。
- [useCopyToClipboard](/composables/use-copy-to-clipboard)：把文本写入系统剪贴板并弹出成功提示；受共享作用域缓存影响，同一作用域存活期间只有首次调用生效。
- [useFieldGroup](/composables/use-field-group)：表单三层状态共享，让自定义控件继承表单的尺寸、禁用状态并参与校验（Web / UniApp）。
- [useGlobalScrollLock](/composables/use-global-scroll-lock)：全局共享计数的页面滚动锁，自建全屏层与库内抽屉、遮罩、加载遮罩叠加时不会互相解锁。
- [useLoading](/composables/use-loading)：服务式加载遮罩，在逻辑代码中创建全屏或局部遮罩，返回可关闭、可更新的实例。
- [useMouseState](/composables/use-mouse-state)：维护一个只读的鼠标进入状态，适合悬停样式、过渡动画和交互卡片。
- [useNavigation](/composables/use-navigation)：文档站侧边栏使用，按当前路由与顶栏平台开关取出当前分区的导航数据。
- [useOverlay](/composables/use-overlay)：以编程方式管理 Dialog、Drawer 及其二次封装组件的打开、关闭、更新和销毁，支持异步确认。
