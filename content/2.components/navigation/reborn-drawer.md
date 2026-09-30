---
title: Drawer 抽屉
description: Web 边缘滑入抽屉，支持四向展开、关闭拦截、局部挂载、焦点管理与尺寸调整。
category: 反馈
platform: web
tags: [vue, tailwind, drawer, overlay]
---

::ComponentViewer{demoFile="RebornDrawerDemo.vue" config="RebornDrawerConfig" componentId="reborn-drawer" :componentFiles='["RebornDrawer.vue", "reborn-drawer.config.ts", "drawer.utils.ts"]'}
::

## 简介

Drawer 从父窗体边缘滑入并覆盖部分内容，用户在抽屉内完成操作后回到原任务。本组件仅适用于 Web；UniApp 保留 `reborn-popup`，两者 API 不同。

`direction` 决定四向滑入，`size` 决定宽度或高度；`modal` 决定遮罩颜色，`modalPenetrable` 决定无遮罩时是否允许穿透，`lockScroll` 独立控制页面滚动锁。`withHeader` 默认关闭，开启后显示左侧关闭图标和标题、右侧额外操作区。

关闭由 `beforeClose` 拦截，延迟由 `openDelay` / `closeDelay` 控制，`destroyOnClose` 控制内容保留。`appendTo` 指定父容器，`resizable` 提供鼠标、触摸和键盘尺寸调整；生命周期与自动焦点事件可用于业务反馈。

### 何时使用

- 编辑当前任务的补充信息，使用 `v-model` 控制打开，`beforeClose` 防止误关闭。
- 侧边筛选或详情面板，使用 `direction="right"` 和 `size="30%"` 保留页面上下文。
- 容器内部的操作面板，使用 `appendTo` 指向已有定位容器。
- 内容宽度需要用户调整时，开启 `resizable` 并监听 `resize-end`。

### 何时不使用

- 居中确认或警告——改用 `reborn-dialog`。
- 跟随按钮定位的小型浮层——改用 `reborn-popover`。
- 小程序底部操作面板或下滑手势关闭——改用 `reborn-popup`。

## 用法

### 方向与尺寸

`direction` 有四个边缘方向，默认从右侧滑入；`size` 的百分比相对于挂载容器计算。

| 维度 | 取值 | 典型用途 |
| --- | --- | --- |
| `direction` | `left` / `right` | 详情、侧边筛选；`size` 表示宽度 |
| `direction` | `top` / `bottom` | 顶部工具、底部操作；`size` 表示高度 |
| `size` | `number` 或数值字符串 | 固定像素尺寸，如 `400`、`'400'` |
| `size` | `'x%'` | 占父容器的比例，默认 `'30%'` |

```vue
<script setup lang="ts">
const open = ref(false)
</script>
<template>
  <RebornButton @click="open = true">查看详情</RebornButton>
  <RebornDrawer v-model="open" direction="right" size="40%" with-header title="任务详情">
    当前任务内容
  </RebornDrawer>
</template>
```

### 头部与页脚插槽

头部默认不显示；开启 `with-header` 后可局部替换或整体覆盖，页脚独立于头部。

| 插槽 | 行为 | 典型用途 |
| --- | --- | --- |
| `title` / `close` / `extra` | 分别替换标题、左侧关闭区域、右侧操作区 | 编辑任务、返回按钮、状态标记 |
| `header` | 覆盖整个头部内部，不再渲染前三个插槽 | 完整自定义工具栏 |
| `footer` | 独立底部区域，不提供时不渲染 | 取消、确定 |

```vue
<RebornDrawer v-model="open" with-header title="编辑任务">
  <template #extra>草稿</template>
  <RebornInput placeholder="任务标题" />
  <template #footer="{ close }">
    <div class="flex justify-end gap-3">
      <RebornButton variant="text" @click="close">取消</RebornButton>
      <RebornButton @click="close">确定</RebornButton>
    </div>
  </template>
</RebornDrawer>
```

### 关闭前确认

关闭按钮、遮罩、ESC、插槽 `close` 和实例 `close()` 均经过 `beforeClose`；父组件直接修改 `v-model` 不经过拦截。

| 回调方式 | 结果 | 典型用途 |
| --- | --- | --- |
| 不调用 `done` | 保持等待 | 异步保存或确认 |
| `done()` / `done(true)` | 取消本次关闭 | 继续编辑 |
| `done(false)` | 允许关闭 | 保存成功或确认放弃 |

```vue
<script setup lang="ts">
async function beforeClose(done: (cancel?: boolean) => void) {
  const saved = await saveTask()
  done(!saved)
}
</script>
<template>
  <RebornDrawer v-model="open" with-header :before-close="beforeClose">
    关闭前保存任务
  </RebornDrawer>
</template>
```

### 延迟与内容保留

延迟决定动画何时开始；等待期间反向切换 `v-model` 会取消过期操作。

| 属性 | 行为 | 典型用途 |
| --- | --- | --- |
| `openDelay` / `closeDelay` | 毫秒，默认 `0` | 延迟展开、等待关闭 |
| `destroyOnClose=false` | 首次打开后保留子树 | 保留未提交输入 |
| `destroyOnClose=true` | 关闭动画结束后销毁 | 再次打开重新初始化 |

```vue
<RebornDrawer
  v-model="open" with-header
  :open-delay="500" :close-delay="500"
  :destroy-on-close="true"
>
  <RebornInput placeholder="关闭后重建此输入框" />
</RebornDrawer>
```

### 遮罩与穿透

`modal=false` 只隐藏背景颜色，透明拦截层仍存在；穿透和页面滚动是两个独立开关。

| 配置 | 行为 | 典型用途 |
| --- | --- | --- |
| `modal=true` | 显示遮罩，忽略穿透设置 | 专注当前操作 |
| `modal=false`、`modalPenetrable=false` | 透明遮罩拦截点击 | 无背景色但保持模态 |
| `modal=false`、`modalPenetrable=true` | 点击与 Tab 可离开抽屉 | 与原页面并行操作 |
| `lockScroll=false` | 不持有 body 滚动锁 | 允许页面继续滚动 |

```vue
<RebornDrawer
  v-model="open" with-header title="辅助信息"
  :modal="false" :modal-penetrable="true"
  :lock-scroll="false"
>
  可以继续操作抽屉之外的页面。
</RebornDrawer>
```

### 父容器内挂载

`appendTo` 接收 CSS 选择器或 HTMLElement，并优先于 `appendToBody`；目标应在打开时存在且建立定位上下文。

| 配置 | 挂载位置 | 典型用途 |
| --- | --- | --- |
| 不传 `appendTo` | 默认 `body`，固定于视口 | 全页面任务 |
| `appendTo="#task-panel"` | 指定节点，绝对定位 | 容器内任务 |
| `appendToBody=false` 且不传 `appendTo` | 原地渲染 | 使用当前定位父元素 |

```vue
<template>
  <div id="task-panel" class="relative isolate h-80 overflow-hidden">
    <RebornButton @click="open = true">打开局部抽屉</RebornButton>
    <RebornDrawer v-model="open" append-to="#task-panel" :lock-scroll="false">
      仅覆盖本容器的内容
    </RebornDrawer>
  </div>
</template>
```

### 调整尺寸

开启 `resizable` 后可拖动内侧边缘；聚焦分隔条后，用对应轴的方向键每次调整 10px。

| 行为 | 约束 | 典型用途 |
| --- | --- | --- |
| 拖动 / 方向键 | 最小 80px，最大为父容器尺寸；父容器不足 80px 时以其尺寸为准 | 内容宽度自适应 |
| `resize-start` / `resize` / `resize-end` | 均回传像素尺寸 | 显示尺寸、持久化偏好 |
| 修改 `size` / `direction` | 清除内部调整值，重新使用 `size` | 重置布局 |

```vue
<RebornDrawer
  v-model="open" with-header resizable
  :size="400" title="可调整面板"
  @resize-end="value => console.log('最终像素尺寸', value)"
>
  拖动面板靠内的边缘调整大小。
</RebornDrawer>
```

### 嵌套抽屉

后打开的抽屉自动提高层级，ESC 与焦点循环仅作用于最上层；滚动锁按实例计数。

| 行为 | 规则 | 典型用途 |
| --- | --- | --- |
| 默认挂载 | 每个抽屉挂到 body | 父子任务不受裁切 |
| 关闭子抽屉 | 焦点回到原触发元素 | 回到父任务继续编辑 |
| 关闭全部抽屉 | 最后一个退场后释放滚动锁 | 回到原页面 |

```vue
<RebornDrawer v-model="parentOpen" with-header title="父任务" size="60%">
  <RebornButton @click="childOpen = true">打开子任务</RebornButton>
  <RebornDrawer v-model="childOpen" with-header title="子任务" size="35%">
    子任务内容
  </RebornDrawer>
</RebornDrawer>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | 显隐状态，支持 `v-model` |
| `appendTo` | `string \| HTMLElement` | - | 挂载节点；优先于 `appendToBody`，最终默认 body |
| `appendToBody` | `boolean` | `true` | 不传 `appendTo` 时是否传送到 body |
| `lockScroll` | `boolean` | `true` | 从打开到退场结束锁定 body，独立于 modal |
| `closeOnClickModal` | `boolean` | `true` | 点击拦截层关闭 |
| `closeOnPressEscape` | `boolean` | `true` | ESC 关闭，仅最上层响应 |
| `openDelay` | `number` | `0` | 打开延迟，毫秒 |
| `closeDelay` | `number` | `0` | 关闭延迟，毫秒 |
| `destroyOnClose` | `boolean` | `false` | 退场完成后销毁子元素 |
| `modal` | `boolean` | `true` | 是否显示遮罩背景 |
| `modalPenetrable` | `boolean` | `false` | 仅 modal=false 时允许穿透 |
| `direction` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | 滑入方向 |
| `resizable` | `boolean` | `false` | 启用边缘拖动、键盘调整 |
| `size` | `number \| string` | `'30%'` | 百分比或像素数值；其他字符串按数值部分解析为 px |
| `title` | `string` | `''` | 标题，显示须开启 withHeader |
| `withHeader` | `boolean` | `false` | 是否渲染整个头部 |
| `beforeClose` | `(done: (cancel?: boolean) => void) => void` | - | done(false) 放行；done()/done(true) 取消 |
| `zIndex` | `number` | `2000` | 打开时的基础层级，嵌套自动递增 |
| `duration` | `number` | `300` | 动画毫秒数；减少动态效果偏好下为 0 |
| `ariaLabel` | `string` | `'抽屉'` | 没有标题时的无障碍名称 |
| `ui` | `DrawerUI` | `{}` | 内部节点样式覆盖 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `value: boolean` | 同步显隐状态 |
| `open` | - | 延迟结束，开始打开 |
| `opened` | - | 打开动画完成 |
| `close` | - | 延迟结束，开始关闭 |
| `closed` | - | 关闭动画完成 |
| `open-auto-focus` | - | 打开时自动聚焦内容后触发 |
| `close-auto-focus` | - | 退场后执行焦点归还流程；非顶层关闭不抢占焦点 |
| `resize-start` | `size: number` | 开始调整，当前像素尺寸 |
| `resize` | `size: number` | 调整中，最新像素尺寸 |
| `resize-end` | `size: number` | 调整结束，最终像素尺寸 |

### Slots

所有插槽提供 `close: () => void`，调用会经过 `beforeClose`。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `{ close }` | 主体内容 |
| `header` | `{ close }` | 覆盖整个头部内部，须开启 withHeader |
| `title` | `{ close }` | 单独替换标题，header 优先 |
| `close` | `{ close }` | 单独替换左侧关闭区域，header 优先 |
| `extra` | `{ close }` | 头部右侧额外操作区，header 优先 |
| `footer` | `{ close }` | 页脚，不传时不渲染 |

### Expose

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `close` | `() => void` | 请求关闭，经过 beforeClose |
| `panel` | `HTMLElement \| undefined` | 面板节点，首次打开后可用 |

### 自定义样式（ui）

| 键名 | 默认作用 |
| --- | --- |
| `wrapper` | 视口 / 容器定位层；层级由 zIndex 控制 |
| `backdrop` | 遮罩和透明拦截层 |
| `root` | 面板背景、阴影与列布局 |
| `header` | 头部：px-6 py-4，即横向 24px、纵向 16px |
| `heading` | 左侧关闭图标与标题分组 |
| `title` | text-lg text-gray-10，即 16px 标题 |
| `close` | size-5，即 20px 关闭按钮 |
| `extra` | 头部右侧额外操作区域 |
| `body` | p-6，即 24px 内边距，内容超出可滚动 |
| `footer` | px-6 py-4，即横向 24px、纵向 16px |
| `resizer` | 内侧边缘的 4px 调整条 |

## 注意事项

- **关闭回调语义与常见抽屉库不同。** 本组件按约定以 `done(false)` 放行，`done()` / `done(true)` 取消；迁移时必须修改已有回调。
- **默认不显示头部。** `withHeader=false` 时所有头部插槽均不渲染；仍可通过遮罩、ESC、默认插槽或页脚的 `close` 关闭。
- **程序控制可以绕过关闭拦截。** 直接将 `v-model` 设为 false 不执行 beforeClose；需要拦截请调用插槽或实例的 `close()`。
- **首次打开前不渲染内容。** 默认关闭后保留子树和内部调整尺寸；destroyOnClose 只销毁内容，外部绑定状态不会自动清空。
- **定位容器必须明确尺寸。** 自定义挂载使用 absolute，应给目标 relative 与高度；缺失节点或非法选择器回退到 body。局部挂载不会自动突破祖先的层叠上下文。
- **穿透不等于解锁滚动。** modal=false 且 modalPenetrable=true 才允许穿透；要滚动背景还需 lockScroll=false。
- **旧 Web Popup 已迁移。** 将组件与目录改为 reborn-drawer，position 改 direction，showHeader 改 withHeader，handleClose() 改 close()；ui.closeBtn 改 ui.close。旧 header 只替换标题的场景改用 title 插槽。center 改用 reborn-dialog；旧别名、安全区与手势 API 不属于 Web Drawer。
- **自动层级与焦点管理针对 Drawer 实例。** 自定义容器仍受 CSS 层叠规则影响；其他类型的全局浮层不在 Drawer 栈中，嵌套交互需单独验证。
