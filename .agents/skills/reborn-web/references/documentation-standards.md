# 文档规范 (Web)

## 1. 文档结构

组件文档采用 Markdown 文件存放在 `content/2.components/[category]/reborn-[name].md`。

## 2. 核心元素要求

- **ComponentViewer**: 使用 `::ComponentViewer` 宏，配置 `demoFile`, `config`, `componentId` 以及 `componentFiles`。
- **API 说明**: 完整列出所有 Props（类型、默认值、描述）。
- **事件描述**: 记录所有 Emit 事件、触发逻辑及参数。
- **UI 对象说明**: 说明 `ui` 属性如何用于样式重写。

## 3. 跨端差异标注

必须在文档结尾处详细标注 **平台差异性**：
- 如果 Web 版本支持特有的交互或属性，需注明。
- 如果与 UniApp 版本的 Props 定义存在不可避免的差异，必须明确解释。

## 4. 示例

```markdown
---
title: [组件名称]
description: [描述文字]
---

::ComponentViewer{demoFile="Reborn[Name]Demo.vue" config="Reborn[Name]Config" componentId="reborn-[name]" :componentFiles='["[Name].vue", "reborn-[name].config.ts"]'}

#api
## API
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## 平台差异与注意事项
- Web 端支持全键盘交互方案。
- 在与 UniApp 版本联动时，建议 [xxx] 参数保持一致。
::
```
