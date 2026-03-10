# Demo 开发与展示规范 (UniApp)

## 1. 容器规范

- **顶层组件**: 使用 `RebornPage` 展示组件标题和描述。
- **区块划分**: 使用 `RebornCard` 对不同功能点进行分组（如“基础用法”、“颜色变量”、“禁用状态”）。

## 2. 展示内容

Demo 必须完整覆盖以下内容：
- **全变体展示**: 循环展示 `[name]Colors` 和 `[name]Sizes` 定义的所有值。
- **状态演示**: 展示组件在不同状态下的表现，如：
    - 加载中 (`loading`)
    - 禁用状态 (`disabled`)
    - 内容溢出/超长文本
- **样式覆盖**: 演示如何通过 `customClass` 或 `ui` 对象实现深度自定义样式。

## 3. 布局建议

- 使用 `flex flex-wrap gap-2` 以整齐美观地排列组件示例。
- 确保 Demo 页面已手动添加到 `packages/uniapp-project/src/pages.json`。
