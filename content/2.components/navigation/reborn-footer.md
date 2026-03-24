---
title: Footer 底部栏
description: 固定在页面底部的操作容器组件，支持自动占位、最小高度控制和安全区适配。
category: 导航
badge: New
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::warning
web端暂未开发。
::

::ComponentViewer{demoFile="RebornFooterDemo.vue" config="RebornFooterConfig" componentId="reborn-footer" :componentFiles='["RebornFooter.vue"]' :uniappFiles='["RebornFooter.vue", "reborn-footer.config.ts", "offset.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `ui` | `object` | `{}` | 覆盖各个 UI slot 的样式。 |
| `minHeight` | `number` | `30` | 最小可见高度阈值。footer 实际高度小于该值（叠加底部安全区）时，不显示 footer。 |
| `vt` | `number` | `0` | 变化触发值。该值变化会强制重新测量 footer 高度。 |
| `height` | `number \| null` | `null` | 指定 footer 内容高度（px）。设置后将不再通过选择器自动测量。 |
| `backgroundColor` | `string \| null` | `null` | footer 背景色。 |
| `customClass` | `any` | `-` | 追加到 footer 容器的自定义 class。 |

## Slots

| 名称 | 描述 |
| --- | --- |
| `default` | footer 内容区插槽，通常放置提交/取消等底部操作按钮。 |

## UI

`ui` 支持以下字段：

| 名称 | 描述 |
| --- | --- |
| `placeholder` | 占位容器样式（用于撑开页面底部空间，避免内容被遮挡）。 |
| `wrapper` | 固定定位的外层容器样式。 |
| `footer` | footer 主体容器样式（背景、安全区内边距等）。 |
| `content` | footer 内容区样式（内边距、布局等）。 |

## 说明

- 组件会根据内容高度自动生成占位高度，并通过 `offset.ts` 向外同步当前底部偏移值。
- 当你需要手动触发高度刷新时，可更新 `vt` 的值（例如自增）。
