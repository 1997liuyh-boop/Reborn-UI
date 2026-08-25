---
title: 滚动条 Scrollbar
description: 通用滚动条样式，悬浮于内容之上不挤压布局，提供 4/6/8 三档尺寸与颜色变量定制。
category: 布局
tags: [css, tailwind, scrollbar, layout]
---

::ComponentViewer{demoFile="ScrollbarDemo.vue" config="ScrollbarConfig" componentId="scrollbar" :componentFiles='["index.ts"]'}

#api

## API

`scrollbar` 是一个全局引入的通用 CSS 样式（非 Vue 组件），通过在目标元素上添加 `.reborn-scrollbar` 类启用。它让滚动条悬浮于内容之上、不占用布局宽度，避免有/无滚动条时内容宽度变化引起的抖动。

```html
<!-- 默认 6px -->
<div class="reborn-scrollbar h-64 overflow-auto">…</div>

<!-- 4px / 8px -->
<div class="reborn-scrollbar reborn-scrollbar--4 h-64 overflow-auto">…</div>
<div class="reborn-scrollbar reborn-scrollbar--8 h-64 overflow-auto">…</div>

<!-- 颜色变量自定义 -->
<div class="reborn-scrollbar h-64 overflow-auto"
     style="--reborn-scrollbar-thumb: #6366f1; --reborn-scrollbar-thumb-hover: #818cf8">…</div>
```

## 尺寸修饰类

| 类名 | 说明 |
| --- | --- |
| `reborn-scrollbar` | 默认 6px 滚动条，浮层式、不占宽度。 |
| `reborn-scrollbar--4` | 4px 尺寸。 |
| `reborn-scrollbar--6` | 6px 尺寸（与默认一致）。 |
| `reborn-scrollbar--8` | 8px 尺寸。 |

## CSS 变量

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `--reborn-scrollbar-size` | `6px` | 滚动条粗细。 |
| `--reborn-scrollbar-radius` | `999px` | thumb 圆角。 |
| `--reborn-scrollbar-track` | `transparent` | 轨道颜色。 |
| `--reborn-scrollbar-thumb` | `rgb(113 113 122 / 0.35)` | thumb 颜色。 |
| `--reborn-scrollbar-thumb-hover` | `rgb(113 113 122 / 0.55)` | thumb 悬停颜色。 |
| `--reborn-scrollbar-thumb-active` | `rgb(113 113 122 / 0.7)` | thumb 按住颜色。 |

暗色适配：`.dark` 祖先下会自动将 thumb 三档颜色提升为 0.55 / 0.75 / 0.9，无需额外配置。

## 平台差异与注意事项

- **WebKit / Chromium**：通过 `::-webkit-scrollbar` 自定义滚动条，`overflow: overlay` 实现浮层式滚动条（该值已被规范废弃，但 Chromium 仍支持；不支持的浏览器会忽略该声明并自动回退到 `overflow: auto`）。
- **Firefox**：无法精确控制 4 / 6 / 8px，使用 `scrollbar-width: thin` + `scrollbar-color` 合理降级。
- **旧版 Edge**：`-ms-overflow-style: -ms-autohiding-scrollbar` 自动隐藏式滚动条。
- 刻意不使用 `scrollbar-gutter`：它会为滚动条预留宽度，与“不占宽度”目标相悖；个别需要预留空间避免跳动的场景可自行叠加 `scrollbar-gutter: stable`。

## 样式源码

```css
/**
 * ============================================================
 * Reborn UI 通用滚动条样式（通用 CSS，非组件）
 * ------------------------------------------------------------
 * 特性：
 *  1. 不占宽度：WebKit/Chromium 下通过 `overflow: overlay`（该值已被规范
 *     废弃，但 Chromium 仍支持）实现浮层式滚动条，滚动条悬浮于内容之上，
 *     不挤压内容区，有/无滚动条时内容宽度保持一致、无布局抖动；
 *     不支持 `overlay` 的浏览器会忽略该声明并自动回退到 `overflow: auto`。
 *  2. 三档尺寸：`.reborn-scrollbar` 默认 6px，另有 `--4` / `--6` / `--8`
 *     修饰类，全部通过 CSS 变量 `--reborn-scrollbar-size` 驱动，易扩展。
 *  3. 主题化：尺寸、圆角、轨道 / thumb / hover / 按住颜色均以 CSS 变量
 *     暴露，内置 `.dark` 暗色适配，可覆盖变量做品牌定制。
 *  4. Firefox 降级：Firefox 无法精确控制 4/6/8px，使用
 *     `scrollbar-width: thin` + `scrollbar-color` 合理降级。
 * ------------------------------------------------------------
 */

@layer components {
  .reborn-scrollbar {
    --reborn-scrollbar-size: 6px;
    --reborn-scrollbar-radius: 999px;
    --reborn-scrollbar-track: transparent;
    --reborn-scrollbar-thumb: rgb(113 113 122 / 0.35);
    --reborn-scrollbar-thumb-hover: rgb(113 113 122 / 0.55);
    --reborn-scrollbar-thumb-active: rgb(113 113 122 / 0.7);

    overflow: auto;
    overflow: overlay;

    -ms-overflow-style: -ms-autohiding-scrollbar;

    scrollbar-width: thin;
    scrollbar-color: var(--reborn-scrollbar-thumb) var(--reborn-scrollbar-track);
  }

  .reborn-scrollbar--4 { --reborn-scrollbar-size: 4px; }
  .reborn-scrollbar--6 { --reborn-scrollbar-size: 6px; }
  .reborn-scrollbar--8 { --reborn-scrollbar-size: 8px; }

  .dark .reborn-scrollbar {
    --reborn-scrollbar-thumb: rgb(113 113 122 / 0.55);
    --reborn-scrollbar-thumb-hover: rgb(113 113 122 / 0.75);
    --reborn-scrollbar-thumb-active: rgb(113 113 122 / 0.9);
  }
}

.reborn-scrollbar::-webkit-scrollbar {
  width: var(--reborn-scrollbar-size);
  height: var(--reborn-scrollbar-size);
}

.reborn-scrollbar::-webkit-scrollbar-track {
  background: var(--reborn-scrollbar-track);
}

.reborn-scrollbar::-webkit-scrollbar-thumb {
  border-radius: var(--reborn-scrollbar-radius);
  background-color: var(--reborn-scrollbar-thumb);
}

.reborn-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--reborn-scrollbar-thumb-hover);
}

.reborn-scrollbar::-webkit-scrollbar-thumb:active {
  background-color: var(--reborn-scrollbar-thumb-active);
}

.reborn-scrollbar::-webkit-scrollbar-corner {
  background: var(--reborn-scrollbar-track);
}
```

::