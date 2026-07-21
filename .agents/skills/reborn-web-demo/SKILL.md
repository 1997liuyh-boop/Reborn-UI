---
name: reborn-web-demo
description: 指导创建 Reborn UI Web 端的"高级感"演示页面（Demo）。包含布局规范、交互标准、色彩体系及代码组织。
metadata:
  version: "2026.7.20"
  author: Antigravity
---

# Reborn Web Demo 设计规范

> 本 skill 定义了 Reborn UI Web 端组件演示页面（Demo）的最高标准。每一个 Demo 都应致力于为用户提供"惊艳"的第一印象（WOW Factor），并充分展示组件的灵活性与深度。

## 0. Demo 文件的位置与接入方式

- **存放路径**: `app/components/reborn/examples/<kebab-case 组件名>/<PascalCase 组件名>Demo.vue`
  - 例：`app/components/reborn/examples/reborn-fab/RebornFabDemo.vue`
  - 需要拆分的子演示组件放在同级 `components/` 子目录（如 `reborn-carousel/components/HeroBanner.vue`）；命令式弹窗的二次封装组件放在同级 `dialogs/` 子目录（参考 `reborn-dialog/dialogs/`）。
- **文档接入**: Demo 通过 `content/2.components/<分类>/<组件名>.md` 中的 `::ComponentViewer{...}` 块挂载到文档站，例如：
  ```md
  ::ComponentViewer{demoFile="RebornFabDemo.vue" config="RebornFabConfig" componentId="reborn-fab" :componentFiles='["RebornFab.vue", "reborn-fab.config.ts"]' :uniappFiles='["RebornFab.vue", "reborn-fab.config.ts"]' dependencies="clsx, tailwind-variants"}
  ::
  ```
  新增 Demo 后务必同步该 markdown 的 `demoFile` 与 API 表格。
- **自动注册**: 项目在 `nuxt.config.ts` 中配置了 `path: "~/components/", pathPrefix: false, global: true`，因此 `<Playground>`、`<RebornButton>`、`<Icon>` 等均可免 import 直接使用；但为了可读性与跳转体验，**被演示的主组件建议显式 import**。

## 1. 核心布局架构

每个 Demo 页面应遵循以下由上至下的结构：

### 1.1 标题头 (Header)

参考最新的 `RebornFireworksDemo.vue`：

- **页面外层**: `mx-auto flex w-full max-w-6xl flex-col gap-12 pt-4 pb-24`（底部留白防止被 fixed 元素遮挡）。
- **Title**: `text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white`，包含组件中英文名（如 "Fireworks 礼花"）。
- **Description**: `text-xl text-gray-500 dark:text-gray-400 max-w-3xl`，一句话讲清组件核心用途与亮点能力。

### 1.2 交互演练场 (Playground) - [必选]

**必须使用项目内置的 `Playground` 通用组件**，位于 `app/components/common/play-ground/Playground.vue`（Nuxt 自动注册为 `<Playground>`）。

#### 1.2.1 Playground 组件 API

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `v-model` | `Record<string, any>` | - | 双向绑定的状态对象，所有控件的值统一存储于此 |
| `controls` | `PlaygroundControlGroup[]` | - | 控制面板配置数组 |
| `componentName` | `string` | `"Component"` | 组件名称（如 'RebornButton'），用于自动生成代码 |
| `code` | `string` | - | [可选] 手动指定的代码字符串。若不传则根据 `controls` 自动拼接 |
| `title` | `string` | `"交互体验"` | 标题 |
| `description` | `string` | `"通过左侧面板实时调节组件属性，在右侧查看视觉反馈"` | 描述文字 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 布局方向。`horizontal` 为左面板右预览（lg 下 4:8 栅格）；`vertical` 为上下堆叠，适合 Carousel 等需要全宽预览的组件 |

**插槽**:

| 插槽 | 说明 |
|------|------|
| `#default` | 预览区内容，传入需要演示的组件实例 |
| `#tag` | 标题栏右侧徽标区。默认显示 "Playground" 胶囊标签；可替换为"重置配置"按钮（见 1.2.4） |
| `#left` | 控制面板底部的追加内容（自定义操作按钮、说明等） |

#### 1.2.2 Controls 数据结构（真实类型定义，来自 Playground.vue 源码）

```ts
/** 单个控件配置 */
interface PlaygroundControlItem {
  /** 控件标签 */
  label: string;
  /** v-model 绑定到 modelValue 中的 key */
  key: string;
  /** 渲染的控件类型（共 5 种） */
  component: "select" | "input" | "checkbox" | "slider" | "color-picker";
  /** 传递给控件的额外 props（如 select 的 options、slider 的 min/max/step 等） */
  props?: Record<string, any>;
  /** 默认值，用于代码生成时过滤掉未修改项 */
  defaultValue?: any;
  /** 是否隐藏该控件，接收当前字段值和整个状态对象，支持返回 Promise（异步显隐） */
  hide?: (value: any, modelValue: Record<string, any>) => boolean | Promise<boolean>;
}

/** 控件分组 */
interface PlaygroundControlGroup {
  /** 一级分组标题 */
  title: string;
  /** 子控件列表 */
  children: PlaygroundControlItem[];
}
```

控件与底层组件的对应关系：`select` → `RebornSelect`、`input` → `RebornInput`、`checkbox` → `RebornCheckbox`、`slider` → `RebornSlider`（label 右侧自动显示当前值）、`color-picker` → `RebornColorPicker`。数值类属性（速度、数量、角度、间距）**优先使用 `slider`**，色彩属性使用 `color-picker`，避免全部堆 select。

#### 1.2.3 Playground 内置功能

1. **自动代码生成**：组件会对比 `modelValue` 与 `defaultValue`，仅将有差异的属性拼接到代码片段中。支持布尔（简写）、数字（`:key="1"`）、字符串和对象（JSON 序列化）。注意：自动生成**固定假设组件有 `v-model="value"`**；若组件没有 v-model 或结构复杂（多插槽、嵌套子组件如 Menu），请传入自定义 `:code`（用 `computed` 拼接，参考 `RebornMenuDemo.vue` 的 `codeString`）。
2. **控制面板**：根据 `controls` 配置自动渲染，分组标题带彩色竖线标识（按 `bg-primary / bg-info / bg-success / bg-warning / bg-error` 顺序轮换）。
3. **预览区**：通过 `#default` 插槽展示组件，最小高度 560px，带模糊光效装饰背景（primary→info 渐变 blur）。
4. **传参明细**：预览区左上角 `lucide:code-xml` 图标按钮，点击通过 `RebornPopover` 弹出当前代码。
5. **条件显隐**：通过 `hide` 回调联动控件（如"仅拖拽开启时可见"），支持异步判断（内部有 visibilityMap 管理，参考 `RebornFabDemo.vue` 的同步/异步 hide 示例）。

#### 1.2.4 使用模板（含推荐的 defaultState + 重置模式）

```vue
<script setup lang="ts">
import RebornXxx from "~/components/reborn/ui/reborn-xxx/RebornXxx.vue";

// 1. 抽出默认状态，便于一键重置
const defaultState = {
  size: "md",
  speed: 8,
  disabled: false,
};
const state = ref<Record<string, any>>({ ...defaultState });

function resetState() {
  state.value = { ...defaultState };
}

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
        label: "速度",
        key: "speed",
        component: "slider" as const,
        defaultValue: 8,
        props: { min: 1, max: 30, step: 1 },
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
  <Playground v-model="state" :controls="controls" component-name="RebornXxx"
    title="交互演练场" description="实时调节参数，在预览区查看视觉反馈">
    <!-- 可选：将默认 Playground 标签替换为重置按钮 -->
    <template #tag>
      <button
        class="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary/20 active:scale-95 cursor-pointer"
        @click="resetState">
        <Icon name="lucide:rotate-ccw" size="12" />
        重置配置
      </button>
    </template>

    <RebornXxx v-model="state.value" :size="state.size" :speed="state.speed" :disabled="state.disabled" />
  </Playground>
</template>
```

### 1.3 详情展示区 (Showcases) - [可选]
使用 `grid grid-cols-1 md:grid-cols-2 gap-8`（或 `lg:grid-cols-2`）布局展示更多维度：
- **变体矩阵**: 平铺展示所有 `variant` 与 `color` 的组合。
- **尺寸与图标**: 展示不同尺寸梯度及图标插槽的使用。
- **功能特写**: 针对组件特有 Prop（如 `teleport`、`gap`、`expandable`）的专项演示，标题中可用 `<code class="text-sm font-normal text-violet-400">propName</code>` 点出关键 Prop。
- **特性说明卡**: 用带编号（01/02/03）的卡片罗列组件的高级交互特性（参考 `RebornFabDemo.vue` 的"高级交互特性"卡片）。
- **创意组合**: 模拟真实业务场景（营销卡片、活动入口、点赞按钮等），让 Demo 讲故事而不是摆零件。

## 2. 特殊组件的演示模式（以真实代码为准）

### 2.1 固定定位 / 悬浮类组件（Fab、BackTop 等）

参考 `RebornFabDemo.vue`：

- 这类组件是 `fixed` 定位，**不会渲染在 Playground 预览区内部**，而是直接悬浮于视口。Playground 的 description 应引导用户"尝试拖动右侧按钮"。
- 演示时显式传 `:z-index="500"`，避免被文档站导航遮挡；用 `:gap="{ top: 32, bottom: 32, left: 32, right: 32 }"` 控制吸边间距。
- 多个 `variant`（float/capsule/circle）通过 `v-if="state.variant === 'xxx'"` 切换渲染不同实例，并给每个实例不同的 `top` 坐标避免重叠。
- 自定义触发器（`#trigger` 插槽）用独立的 checkbox（如 `useTriggerSlot`）切换演示。
- 用 `hide` 回调演示控件联动（如"同步显隐(仅拖拽可见)"、"异步显隐"）。

### 2.2 命令式 Overlay 类组件（Dialog、Drawer 等，基于 useOverlay）

参考 `RebornDialogDemo.vue` 与 `app/composables/useOverlay.ts`：

```ts
import { useOverlay } from "~/composables/useOverlay";

const overlay = useOverlay();

// 在 setup 顶层创建实例（可传初始 props，open 时可再覆盖）
const playgroundDialog = overlay.create(RebornDialog, { props: state.value });

async function openPlaygroundDialog() {
  // open 返回 Promise，resolve 值为 'confirm' / 'cancel' / close(value)
  const result = await playgroundDialog.open(state.value);
}
```

- **必须演示两条路线**：① 直接用原始组件 + Playground 状态透传；② 二次封装组件（放 `dialogs/` 子目录）演示表单、嵌套、异步流程等真实业务形态。
- `OverlayOptions` 支持 `defaultOpen`、`props`、`destroyOnClose`、`content/header/footer`（VNode 插槽）以及 **`onConfirm` 异步确认回调**：提供后点击确认按钮自动进入 loading 并执行回调，回调正常返回则自动关闭且 `open()` 解析为 `'confirm'`，抛出则保持打开可重试——高质量 Demo 应包含一个"异步提交（如云端同步）"示例来展示这一能力。
- 实例方法：`open(props?)`、`close(value?)`、`patch(props)`（动态更新 props 也值得演示）。

### 2.3 声明式遮罩 / 提示类组件（Overlay、Tooltip、Popover）

- **Overlay**：必须同时演示"全屏遮罩"（`v-model`）与"指定节点遮罩"（`absolute` prop + 父容器 `relative h-[300px] overflow-hidden`），并用 checkbox 联动 `closeOnClickOverlay`（参考 `RebornOverlayDemo.vue`）。
- **Tooltip**：12 个 `placement` 用 `grid grid-cols-3 gap-4 w-fit` 的九宫格环形布局平铺展示（参考 `RebornTooltipDemo.vue`）；同时覆盖 `effect="dark|light"`、`:arrow="false"`、`:open-delay`、`disabled` 等配置项。多行内容用 `#content` 插槽。

### 2.4 滚动依赖类组件（Sticky、Affix、BackTop）

参考 `RebornStickyDemo.vue`：

- 依赖页面滚动，Demo 需生成足量占位列表（`v-for="item in 30"` 的卡片项）制造滚动空间，并在页面末尾放置 `<RebornBackTop />` 方便回顶。
- 多个吸附示例应使用**不同 `offset-top`（0 / 40 / 80）与不同主题色的横条**，滚动时形成层叠吸附的直观对比。
- Sticky 已支持吸底模式：`position="top|bottom"`、`bottomBoundary="parent|target"`、`bottomPlaceholder="auto|keep|none"`——新 Demo 应补充吸底与占位策略的对比演示。

### 2.5 宽幅 / 富媒体组件（Carousel、Marquee 等）

参考 `RebornCarouselDemo.vue`：

- 全宽预览优先：要么给 Playground 传 `direction="vertical"`，要么像 Carousel 一样使用自定义控制面板（`grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` 的 Select 网格 + `RebornPopover` 实时代码弹层 + 复制按钮）。
- 轮播内容严禁使用占位灰块：用渐变色卡（`bg-gradient-to-br from-... via-... to-...`）配 eyebrow/标题/描述的编辑感排版，让每一帧都像真实业务 Banner。
- 自定义 `#prev` / `#next` / `#indicators` 作用域插槽（`{ prev }`、`{ next }`、`{ activeIndex, count, goTo }`）应有专项展示。

## 3. 视觉与美学标准

- **高级感**: 严禁使用纯色块。多用 `bg-white/60 dark:bg-slate-900/40`、`backdrop-blur-2xl`、`border-slate-200/50 dark:border-white/5` 等半透明层级增加通透感。
- **色彩体系**: 语义色统一使用主题 token：`primary / secondary / success / info / warning / error / neutral`（与各组件 `config.ts` 的 `colors` 枚举一致）。装饰性渐变可用具体色值（violet/fuchsia 系是暗色卡片的常用点缀）。
- **微动效**:
    - 使用 `transition-all` 确保交互顺滑；按钮类交互配 `active:scale-95`、图标配 `hover:scale-110` / `hover:rotate-12`。
    - 合理使用 `ColourfulText`、`RadiantText` 或自定义 `@keyframes` 增强关键状态的视觉反馈。
    - 状态切换（计数、提示文案）用 `<Transition name="fade" mode="out-in">` 过渡，动画样式写在 `<style scoped>`。
- **暗色模式**: 每一处颜色都必须成对提供 `dark:` 变体，Demo 在两种模式下都要"高级"。
- **响应式**: 适配移动端。Playground 的 horizontal 布局在 lg 以下自动堆叠；Showcase 网格从 `grid-cols-1` 起步。

## 4. 代码实现规范

1. **注释语言**: 所有注释、Prop 说明、分组标题必须使用中文（项目硬性要求，严禁英文注释）。
2. **导入路径**: 统一使用 `~/components/reborn/ui/...` 绝对别名路径（不要用 `../../ui/...` 相对路径）。
3. **数据绑定**:
    - 从组件的 `reborn-xxx.config.ts` 中导入枚举（如 `menuModes`、`menuColors`），在 setup 中 `.map()` 为 `{ label, value }` 供 select 使用，保证 Demo 选项与组件真实能力永远同步。
    - 使用统一的 `state` 响应式对象（而非一堆零散 `ref`），配合 Playground 的 `v-model`。
    - 需要值修正时用 `watch` 收敛（如 Fireworks Demo 对 `particleScale` 做 0.1 步进取整）。
4. **事件反馈**: 演示回调用中文提示（`console.log('点击了动作: ' + name)` 或 Toast），让交互"有回应"。
5. **样式隔离**: 复杂动画（`@keyframes`、Transition 类名）放在 `<style scoped>` 中。
6. **跨端一致性**: 编写前核对 uniapp 端同名组件的 Props/Emit 命名，文档 markdown 的 API 表格需标注"通用/Web"平台列。

## 参考示例 (Reference)

按质量与新鲜度排序，新 Demo 优先对齐前三个：

- `Playground 组件源码`: [查看源码](../../../app/components/common/play-ground/Playground.vue)（类型定义在此，配套样式见同目录 `play-ground.config.ts`）
- `RebornFireworksDemo.vue`（最新标杆：Header 规范 + slider 控件 + 重置按钮 + Showcase 对比）: [查看代码实现](../../../app/components/reborn/examples/reborn-fireworks/RebornFireworksDemo.vue)
- `RebornFabDemo.vue`（固定定位组件 + hide 联动 + 变体切换）: [查看代码实现](../../../app/components/reborn/examples/reborn-fab/RebornFabDemo.vue)
- `RebornDialogDemo.vue`（useOverlay 命令式演示全集）: [查看代码实现](../../../app/components/reborn/examples/reborn-dialog/RebornDialogDemo.vue)
- `RebornMenuDemo.vue`（自定义 :code + config 枚举驱动选项）: [查看代码实现](../../../app/components/reborn/examples/reborn-menu/RebornMenuDemo.vue)
- `RebornCarouselDemo.vue`（宽幅组件的自定义控制面板与富媒体内容）: [查看代码实现](../../../app/components/reborn/examples/reborn-carousel/RebornCarouselDemo.vue)
- `RebornInputNumberDemo.vue` / `RebornButtonDemo.vue`（经典 Playground 基础用法）: [InputNumber](../../../app/components/reborn/examples/reborn-input-number/RebornInputNumberDemo.vue) · [Button](../../../app/components/reborn/examples/reborn-button/RebornButtonDemo.vue)

---
> 如果你的 Demo 看起来"平庸且简陋"，那么你即告失败。请始终追求极致的视觉表现力。
