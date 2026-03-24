---
name: reborn-web-demo
description: 指导创建 Reborn UI Web 端的"高级感"演示页面（Demo）。包含布局规范、交互标准、色彩体系及代码组织。
metadata:
  version: "2026.3.24"
  author: Antigravity
---

# Reborn Web Demo 设计规范

> 本 skill 定义了 Reborn UI Web 端组件演示页面（Demo）的最高标准。每一个 Demo 都应致力于为用户提供"惊艳"的第一印象（WOW Factor），并充分展示组件的灵活性与深度。

## 1. 核心布局架构

每个 Demo 页面应遵循以下由上至下的结构：

### 1.1 标题头 (Header)
- **Title**: 使用 `text-3xl font-bold`，包含组件中英文名。
- **Description**: 使用 `text-lg text-gray-500`，简述组件核心用途。

### 1.2 交互演练场 (Playground) - [必选]

**必须使用项目内置的 `Playground` 通用组件**，位于 `app/components/common/play-ground/Playground.vue`（Nuxt 自动注册为 `<Playground>`）。

#### 1.2.1 Playground 组件 API

| Prop | 类型 | 说明 |
|------|------|------|
| `v-model` | `Record<string, any>` | 双向绑定的状态对象，所有控件的值统一存储于此 |
| `controls` | `PlaygroundControlGroup[]` | 左侧控制面板配置数组 |
| `componentName` | `string` | 组件名称（如 'RebornButton'），用于自动生成代码 |
| `code` | `string` | [可选] 手动指定的代码字符串。若不传则自动根据 `controls` 拼接 |
| `title` | `string` | 标题（默认"交互体验"） |
| `description` | `string` | 描述文字 |

**默认插槽 `#default`**: 传入需要预览的组件实例。

#### 1.2.2 Controls 数据结构

```ts
interface PlaygroundControlGroup {
  title: string;                    // 一级分组标题
  children: PlaygroundControlItem[];
}

interface PlaygroundControlItem {
  label: string;                    // 控件标签
  key: string;                      // 对应 modelValue 中的 key
  component: "select" | "input" | "checkbox";  // 控件类型 (传参时建议加 as const)
  defaultValue?: any;               // 默认值 (用于在代码生成时过滤掉未修改项)
  props?: Record<string, any>;      // 透传给控件的额外 props
}
```

#### 1.2.3 Playground 内置功能

1. **自动代码生成**：组件会对比 `modelValue` 与 `defaultValue`，仅将有差异的属性拼接到代码片段中。支持布尔（简写）、数字、字符串和对象序列化。
2. **左侧控制面板**：根据 `controls` 配置自动渲染，分组带有彩色竖线标识。
3. **右侧预览区**：通过 `#default` 插槽展示组件，带模糊光效装饰背景。
4. **传参明细**：左上角 `lucide:code-xml` 图标按钮，点击通过 `RebornPopover` 弹出。

#### 1.2.4 使用模板

```vue
<script setup lang="ts">
import RebornXxx from "~/components/reborn/ui/reborn-xxx/RebornXxx.vue";

// 1. 统一状态对象
const state = ref<Record<string, any>>({
  value: 10,
  size: "md",
  disabled: false,
});

// 2. 控制面板配置 (component 需加 as const 确保类型正确)
const controls = [
  {
    title: "基础属性",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: [{ label: "MD", value: "md" }, { label: "LG", value: "lg" }] },
      },
      {
        label: "禁用状态",
        key: "disabled",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
];
</script>

<template>
  <Playground 
    v-model="state" 
    :controls="controls" 
    component-name="RebornXxx"
  >
    <RebornXxx v-model="state.value" :size="state.size" :disabled="state.disabled" />
  </Playground>
</template>
```

### 1.3 详情展示区 (Showcases) - [可选]
使用 `grid grid-cols-1 lg:grid-cols-2` 布局展示更多维度：
- **变体矩阵**: 平铺展示所有 `variant` 与 `color` 的组合。
- **尺寸与图标**: 展示不同尺寸梯度及图标插槽的使用。
- **功能特写**: 针对组件特有 Prop (如 `gap`, `rangeable`) 的专项演示。
- **创意组合**: 模拟真实业务场景（如：按钮组、配合 Icon 使用等）。

## 2. 视觉与美学标准

- **高级感**: 严禁使用纯色块。多用 `bg-white/50 dark:bg-gray-900/20` 等半透明层级增加通透感。
- **微动效**: 
    - 使用 `transition-all` 确保交互顺滑。
    - 合理使用 `RadiantText` 或自定义 `animate-zoom` 增强关键状态的视觉反馈。
- **响应式**: 适配移动端，Config Panel 在窄屏下应自动转换至顶部或底部。

## 3. 代码实现规范

1. **导入路径**: 统一使用 `~/components/reborn/ui/...` 路径。
2. **Playground 组件**: 位于 `app/components/common/play-ground/Playground.vue`，Nuxt 自动注册为 `<Playground>`。
3. **数据绑定**: 
    - 从组件的 `config.ts` 中导出 `variant`, `color`, `size` 枚举。
    - 在 `setup` 中映射为 `{ label, value }` 格式供 `RebornSelect` 使用。
    - 使用统一的 `state` 响应式对象（而非独立的 `ref`），配合 Playground 的 `v-model`。
4. **样式隔离**: 复杂动画（如 `@keyframes`）应放在 `<style scoped>` 中。

## 参考示例 (Reference)

- `Playground 组件`: [查看源码](../../../app/components/common/play-ground/Playground.vue)
- `RebornInputNumberDemo.vue`: [查看代码实现](../../../app/components/reborn/examples/reborn-input-number/RebornInputNumberDemo.vue)
- `RebornButtonDemo.vue`: [查看代码实现](../../../app/components/reborn/examples/reborn-button/RebornButtonDemo.vue)

---
> 如果你的 Demo 看起来"平庸且简陋"，那么你即告失败。请始终追求极致的视觉表现力。
