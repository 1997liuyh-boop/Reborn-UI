---
name: reborn-web-demo
description: 指导创建 Reborn UI Web 端组件演示页面（Demo）。DemoSection / DemoBlock / DemoNote 原语 + Playground 交互演练场（控制面板控件 lg 尺寸、传参明细全量输出），克制、无卡片、无装饰。
metadata:
  version: "2026.8.27"
  author: Antigravity
---

# Reborn Web Demo 设计规范

> 本 skill 定义 Reborn UI Web 端组件演示页面（Demo）的标准：整页由 `DemoSection` 纵向排列，交互演练场用全局 `<Playground>` 组件（左侧控制面板控件统一 lg 尺寸、传参明细全量输出），视觉克制——不铺底色、不画卡片、不加装饰。Demo 的任务是把组件每个能力讲清楚，而不是炫技。

## 0. Demo 文件的位置与接入方式

- **存放路径**: `app/components/reborn/examples/<kebab-case 组件名>/<PascalCase 组件名>Demo.vue`
  - 例：`app/components/reborn/examples/reborn-input-number/RebornInputNumberDemo.vue`
  - 需要拆分的子演示组件放在同级 `components/` 子目录；命令式弹窗的二次封装组件放在同级 `dialogs/` 子目录（参考 `reborn-dialog/dialogs/`）。
- **文档接入**: Demo 通过 `content/2.components/<分类>/<组件名>.md` 中的 `::ComponentViewer{...}` 块挂载到文档站。新增 Demo 后务必同步该 markdown 的 `demoFile` 与 API 表格。
- **自动注册**: `nuxt.config.ts` 配置了 `pathPrefix: false, global: true`，`<DemoSection>`、`<RebornButton>`、`<Icon>` 等均可免 import 直接使用；但**被演示的主组件与演练场用到的控件组件（RebornSelect / RebornCheckbox 等）建议显式 import**，便于阅读与跳转。

## 1. 三个展示原语（唯一的排版工具）

Demo 页面只允许用这三个原语组织内容，源码与完整铁律见 `app/components/common/demo/demo.config.ts` 顶部注释（全站唯一事实来源，文档页 `/getting-started/demo-guidelines` 与其同步）：

| 原语 | 职责 | 关键 Props |
|------|------|-----------|
| `DemoSection` | 示例分组：小标题 + 可选描述 + 内容；相邻分组靠自带上边框分隔 | `title`、`description`（或 `#description` 插槽承载富文本）、`divider` |
| `DemoBlock` | 承载示例本体的排版容器，只管「怎么排」 | `layout="row \| grid \| stack"`、`align`、`tone="plain \| inset"` |
| `DemoNote` | 说明性文字，纯文本无盒子 | `tone="muted \| dimmed"` |

**背景铁律**（demo.config.ts 的核心约束，必须遵守）：

- 画布内部**禁止** `bg-* + rounded-* + (border|ring|shadow)` 的卡片组合；分组一律靠分隔线、留白与小标题完成。
- 唯一例外：被演示对象本身需要容器才说得清（滚动区、拖拽区、水印底、弹层落点）时，允许一层 `<DemoBlock tone="inset">`，其内部不得再出现填充盒。
- Token 白名单：圆角只用 `rounded-ui-*`；颜色只用语义类（`bg-default / bg-elevated / text-muted / text-dimmed / text-highlighted / border-default / divide-default`）；禁用 `backdrop-blur-*`、`shadow-xl`、`bg-white/xx`、`bg-slate-*`、`rounded-[Npx]` 硬编码。
- 必须双模式恒深的表面用 `bg-gray-10 dark:bg-gray-1`，其上弱文字用 `text-gray-6`；禁止 Tailwind 默认色板名（`gray-900` 等本项目不存在）。

## 2. 页面结构

整页外层是 `<div class="flex w-full flex-col">`，内部全部是 `DemoSection`，从上到下：

1. **交互演练场**（必选，第一个 section，见 §3）
2. **能力矩阵**：variant × color、尺寸梯度等枚举平铺（见 §4）
3. **功能特写**：每个特有 Prop / 插槽 / 事件一个 section，标题直白（如「格式化与解析」「键盘与滚轮」），描述里用 `<code>` 点出 Prop 名
4. **进阶自定义**：`ui` 逐槽覆盖、真实业务组合演示放最后

不再编写页面级大标题头（`text-4xl` Header 已废弃）——组件名与简介由文档页承载，Demo 直接从演练场开始。

## 3. 交互演练场（必选，用 `<Playground>` 通用组件）

演练场**必须使用**项目内置的 `<Playground>` 组件（`app/components/common/play-ground/Playground.vue`，Nuxt 自动注册），不要手写控制条 / 按钮墙。

### 3.1 Playground API 摘要

- Props：`v-model`（状态对象 `Record<string, any>`）、`controls`（分组控件配置）、`componentName`、`code`（可选，自定义等价代码字符串）、`title` / `description`、`direction`（`horizontal` 默认左面板右预览；`vertical` 上下堆叠，适合宽幅组件）。
- 插槽：`#default` 预览区、`#tag` 标题栏右侧（放「重置配置」按钮）、`#left` 控制面板底部追加内容。
- 控件类型五种：`select`（渲染 `RebornSelect`，选项字段是 `options`）、`input`、`checkbox`、`slider`（数值属性优先用它）、`color-picker`；`hide` 回调可做条件显隐（支持异步）。控制面板控件统一以 **lg 尺寸**渲染（Playground 内置，demo 无需配置）。
- 「传参明细」**完整列出当前所有参数（含等于默认值的项）**，不做默认值过滤。**优先用自动生成，不要手写 `:code`**：控件 key 会自动转 kebab-case（`showPassword` → `show-password`），布尔 / 数字以 `:prop="值"` 带值输出；controls 之外的固定参数与事件用 `code-extras`（如 `['placeholder="请输入内容"', '@change="handleChange"']`）追加；「空 = 未传」语义的选项（如 `controlsPosition` 的空串）给该控件配 `codeSkipEmpty: true`，纯演示用的辅助开关配 `codeIgnore: true`。仅当组件无 `v-model` 或结构复杂（多插槽 / 嵌套子组件，如 Button / Menu）时才传自定义 `:code`。

### 3.2 标准模板（defaultState + 重置）

```vue
<script setup lang="ts">
import { xxxColors, xxxSizes } from "~/components/reborn/ui/reborn-xxx/reborn-xxx.config";
import RebornXxx from "~/components/reborn/ui/reborn-xxx/RebornXxx.vue";

/** 演练场默认状态，取组件真实默认值 */
const defaultState: Record<string, any> = { value: 10, size: "md", color: "primary", disabled: false };
const state = ref<Record<string, any>>({ ...defaultState });

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 控制面板配置；选项列表从组件 config 派生，禁止手抄枚举 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: xxxSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];
</script>

<template>
  <Playground v-model="state" :controls="controls" component-name="RebornXxx"
    title="交互演练场" description="调节左侧参数，实时查看组件表现。">
    <template #tag>
      <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
        <template #leading>
          <Icon name="lucide:rotate-ccw" size="12" />
        </template>
        重置配置
      </RebornButton>
    </template>

    <div class="flex w-full flex-col items-center gap-4">
      <RebornXxx v-model="state.value" :size="state.size" :color="state.color" :disabled="state.disabled" />
      <!-- 有事件的组件：用 DemoNote 回显绑定值与最近一次事件参数，让交互「有回应」 -->
      <DemoNote tone="dimmed">绑定值：<code>{{ state.value }}</code></DemoNote>
    </div>
  </Playground>
</template>
```

### 3.3 规则

- **左侧控制面板的控件统一 lg 尺寸**：由 Playground 内部对 Select / Input / Checkbox / Slider / ColorPicker 统一设定，demo 不要在 `controls` 里传 size 覆盖；预览区组件的尺寸交给 `defaultState`（取组件真实默认值）由用户自行调节。
- **传参明细全量输出**：不论参数是否等于默认值都要出现在代码里；自定义 `:code` 时布尔项写成 `:prop="true|false"` 带值形式，未选择的可选参数（如空的 `controls-position`）不输出。
- **选项列表从组件 config 派生**（如 `buttonColors` / `inputNumberSizes`），保证 Demo 选项与组件真实能力永远同步。
- **让交互有回应**：预览区下方用 `DemoNote tone="dimmed"` 回显绑定值与最近一次事件参数（如点击计数、`change` 的新旧值）。
- **宽度撑满型组件**（Input 系）给预览实例套 `class="max-w-sm"` 约束展示宽度。
- 复杂 / 联动控件参考 `RebornFabDemo.vue`（`hide` 回调）与 `RebornMenuDemo.vue`（自定义 `:code`）。

## 4. 场景 Section 的编排惯例

- **枚举平铺**：
  - 窄小组件（Button、Chip）：一行一个变体，行首放 `<p class="text-dimmed w-16 text-xs italic">{{ v }}</p>` 标签，行内 `flex flex-wrap items-center gap-3` 平铺所有颜色。
  - 宽幅组件（Input 系）：用 `<DemoBlock layout="grid">`（`sm:grid-cols-2 lg:grid-cols-3`），每格「斜体小标签 + 实例」：`<p class="text-dimmed text-xs italic">` 在上，组件在下，`flex flex-col gap-3`。
- **每格独立绑定值**：不同 section 各自持有自己的 ref，避免调整一处示例牵连其他示例；同一 section 内多实例共享一个 ref 反而能顺便演示同步。
- **描述写法**：涉及 Prop / 插槽 / 事件名时用 `#description` 插槽 + `<code>`：
  ```vue
  <template #description>
    <code>step-strictly</code> 只允许步进的倍数，键入非倍数值会在提交时就近吸附。
  </template>
  ```
- **数值 / 事件回显**：统一 `<DemoNote tone="dimmed" class="text-xs">绑定值：<code>{{ v }}</code></DemoNote>`，不要手写 `text-gray-500` 之类的裸样式。
- **引导式示例**：边界行为给出可操作的提示（「试着输入 13」「先聚焦，再滚滚轮」），让读者能立刻验证描述。
- **真实业务组合**：组合编排类 section（胶囊组、垂直功能条）模拟真实场景，允许对组件传 class 做布局改造，但仍受 §1 背景铁律约束。

## 5. 特殊组件的演示模式

- **固定定位 / 悬浮类**（Fab、BackTop）：组件 `fixed` 定位悬浮于视口，演练场 description 引导用户直接与悬浮实例交互；显式传 `:z-index="500"` 避免被文档站导航遮挡。
- **命令式 Overlay 类**（Dialog、Drawer，基于 `useOverlay`）：必须演示两条路线——① 原始组件 + 演练场状态透传；② `dialogs/` 子目录的二次封装演示表单、嵌套、异步确认（`onConfirm` 回调的 loading→关闭→可重试流程）。实例方法 `open / close / patch` 都值得专项展示。
- **声明式遮罩 / 提示类**（Overlay、Tooltip、Popover）：Overlay 同时演示全屏与「指定节点」（`absolute` + 父容器 `relative h-[300px] overflow-hidden`，这正是 `tone="inset"` 的合法场景）；Tooltip 的 12 个 `placement` 用九宫格环形平铺。自带表面的组件裸渲染，不要再套 inset。
- **滚动依赖类**（Sticky、Affix）：生成足量占位列表制造滚动空间，多实例用不同 `offset-top` 与主题色横条形成层叠对比，页面末尾放 `<RebornBackTop />`。
- **宽幅富媒体类**(Carousel、Marquee)：给 Playground 传 `direction="vertical"` 换成上下堆叠的全宽预览；轮播内容严禁占位灰块，用渐变色卡配编辑感排版——渐变属于「被演示对象自己的表面」，不违反背景铁律。

## 6. 代码实现规范

1. **注释语言**: 所有注释、Prop 说明、标签文字必须使用中文（项目硬性要求，严禁英文注释）。
2. **导入路径**: 统一 `~/components/reborn/ui/...` 绝对别名，不用相对路径。
3. **事件反馈**: 回调落到页面可见的回显（DemoNote / 计数），不要只 `console.log`。
4. **样式隔离**: 确需自定义动画时放 `<style scoped>`；能用组件 `ui` prop 覆盖的不写 style。
5. **跨端一致性**: 编写前核对 uniapp 端同名组件的 Props/Emit 命名，文档 markdown 的 API 表格标注平台列。
6. **提交前**: `npx eslint <demo 文件> --fix` 必须零错误零警告。

## 参考示例（按对齐优先级排序）

- `Playground 组件源码`（类型定义在此，配套样式见同目录 `play-ground.config.ts`）: [查看源码](../../../app/components/common/play-ground/Playground.vue)
- `RebornInputNumberDemo.vue`（**基准范式**：Playground + 传参全量输出 + 重置 + 事件回显 + 功能特写全集）: [查看代码实现](../../../app/components/reborn/examples/reborn-input-number/RebornInputNumberDemo.vue)
- `RebornButtonDemo.vue`（无 v-model 组件的自定义 `:code` + 变体矩阵 + 组合编排）: [查看代码实现](../../../app/components/reborn/examples/reborn-button/RebornButtonDemo.vue)
- `RebornPaginationDemo.vue`（多插槽组件的 Playground 全集）: [查看代码实现](../../../app/components/reborn/examples/reborn-pagination/RebornPaginationDemo.vue)
- `demo.config.ts`（三原语样式与背景铁律的唯一事实来源）: [查看源码](../../../app/components/common/demo/demo.config.ts)
- `RebornDialogDemo.vue`（useOverlay 命令式演示全集）: [查看代码实现](../../../app/components/reborn/examples/reborn-dialog/RebornDialogDemo.vue)
- `RebornStickyDemo.vue`（滚动依赖类）: [查看代码实现](../../../app/components/reborn/examples/reborn-sticky/RebornStickyDemo.vue)

---
> 克制即高级：如果一个 Demo 需要靠光效、渐变卡片和阴影才「好看」，说明示例本身没讲清楚。先把组件能力讲透，视觉自然成立。
