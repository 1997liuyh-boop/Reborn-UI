# 组件文档规范 (UniApp)

## 1. 文档结构

组件文档采用 Markdown 文件存放在 `content/2.components/[category]/reborn-[name].md`。

## 2. 必须包含的元素

- **ComponentViewer**: 使用 `::ComponentViewer` 宏进行渲染。
    - `uniappFiles`: 必须显式列出相关的组件文件和配置文件名称。
- **API 表格**: 完整列出所有 Props（包含类型、默认值、描述）。默认值必须与代码实际一致（例如 RebornText 的 `currency` 默认值已由 `'¥'` 调整为 `''`）。
- **Event 表格**: 详细说明触发条件及传参（如 Collapse 的 `toggle`、Sticky 的 `change`/`resize`）。
- **Slot 表格**: 列出所有插槽及其作用域参数（如 Collapse 默认插槽的 `{ open }`、Sticky 默认插槽的 `{ isSticky }`）。
- **Expose 表格**: 列出 `defineExpose` 暴露的方法与只读状态（如 `show`/`hide`/`toggle`/`forceUpdate`/`isSticky`）。
- **UI 对象说明**: 列出 `ui` 属性支持的所有可覆盖键名。

## 3. 跨端差异标注

如果 UniApp 组件与 Web 组件存在实现差异：
- 必须使用明显的警示框或独立小节进行标注。
- 解释为何存在差异（如小程序环境限制、H5 独有能力等）。

## 4. 示例

```markdown
---
title: [组件名称]
description: [描述文字]
---

::ComponentViewer{demoFile="Reborn[Name]Demo.vue" config="Reborn[Name]Config" componentId="reborn-[name]" :uniappFiles='["reborn-[name].vue", "reborn-[name].config.ts"]'}

#api
## API
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## 平台差异点
> [!NOTE]
> 在 UniApp 环境下，由于 CSS 隔离限制，覆盖子组件样式建议优先通过 `ui` 对象 Prop 进行传参。
::
```
