---
title: 组合式函数
description: Reborn UI 在文档站和组件体系中使用到的 composables 列表，涵盖快捷键、导航、表单状态、剪贴板和浮层控制等能力。
navigation: false
---

# 组合式函数

这一节收录 `app/composables` 下的公开组合式函数文档，便于在业务组件、文档站页面和基础交互能力中复用。

## 列表

- [defineShortcuts](/composables/define-shortcuts)：定义全局快捷键和链式快捷键。
- [useCopyToClipboard](/composables/use-copy-to-clipboard)：写入系统剪贴板并弹出 Toast 提示。
- [useFieldGroup](/composables/use-field-group)：为表单、表单项和内部输入控件提供统一状态管理。
- [useMouseState](/composables/use-mouse-state)：维护简单的鼠标进入/离开状态。
- [useNavigation](/composables/use-navigation)：根据当前路由从 Nuxt Content 导航树中提取侧边栏数据。
- [useOverlay](/composables/use-overlay)：以编程方式创建、打开、更新和销毁 Dialog / Popup 浮层。
