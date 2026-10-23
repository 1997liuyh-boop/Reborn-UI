# Vue 最佳实践全量审查：方法与口径

本目录是对仓库全部 Vue 代码按 `vue-best-practices` 技能（`.agents/skills/vue-best-practices/`）做的一次只读审查。**只列问题与改法，不改源码**；改不改、先改哪条，由清单评审后再定。

## 范围

| 分片 | 范围 |
| --- | --- |
| W1 ~ W8 | Web 组件库 `app/components/reborn/ui/**`（按目录名字母序连续切成 8 片） |
| U1 ~ U3 | UniApp 组件库 `packages/uniapp-project/src/components/**`（同上，3 片） |
| C1 | 组合式函数 `app/composables/**`、`packages/uniapp-project/src/composables/**`，以及 `app/lib/**`、`app/utils/**` |
| S1 | 文档站外壳：`app/app.vue`、`app/components/{app,docs,common,content}/**`、`app/layouts/**`、`app/pages/**` |
| E1 ~ E5 | Web 演示 `app/components/reborn/examples/**` 与演练场配置 `app/components/reborn/configs/**` |
| P1 | UniApp 演示页 `packages/uniapp-project/src/pages/**` 与 `packages/uniapp-project/src/App.vue` |

每个分片一份报告：`W1.md`、`U2.md`……汇总与优先级见 `README.md`。

## 依据

先读 `.agents/skills/vue-best-practices/SKILL.md`，以及它要求的四篇核心参考：`references/reactivity.md`、`references/sfc.md`、`references/component-data-flow.md`、`references/composables.md`。遇到对应场景再读专题参考（插槽、透传属性、Teleport、Transition / TransitionGroup、KeepAlive、异步组件、自定义指令、渲染函数、列表性能 `perf-*`、`updated-hook-performance` 等）。调试类问题可参考 `.agents/skills/vue-debug-guides/`，组合式函数的入参写法参考 `.agents/skills/create-adaptable-composable/`。

## 项目规则优先

技能是通用建议，与本仓库规则冲突时以仓库为准，不要把下面这些当成问题上报：

- 注释与文案一律中文；props 用接口式 `defineProps<Props>()`，双向绑定用 `defineModel`；UniApp 端尺寸用 `rpx`。
- Web 与 UniApp 同名组件的 props / emits / slots 命名要尽量一致；改法若会让两端 API 不一致，必须在「影响」里写明。
- 已知且是有意为之的写法（提建议前先确认不属于这些情况）：
  - `defineModel` 的类型含 `Boolean`（包括 `false | Fn` 这类联合）时必须写 `default: undefined`，否则未传会被强转成 `false`；受控绑定下赋值后同步读到的仍是旧值，事件载荷要用本地新值。
  - `useFormInject` 返回的 `disabled` 可能是数组，组件侧必须用 `=== true` 判断，不要改成真值判断。
  - UniApp 小程序端（uni-mp-vue）不支持渲染函数，只能放在 `#ifdef H5` 里；`// #ifdef` / `// #endif` 条件编译注释必须原样保留。
  - `RebornScrollbar` 每次滚动都会重跑默认插槽，重内容要包进独立子组件，这是规避手段，不是多余的抽象。
  - 弹层遮罩不要套 `Transition`（时序问题），这是刻意的。
  - 组件总览缩略图（`*Overview.vue`）挂载后不卸载，禁止 WebGL 与常驻循环。
- 只做 Vue 层面的审查：响应性、数据流、组件边界、模板、生命周期与清理、性能、SSR / 水合、插槽与透传、`Teleport` / `Transition` 的用法等。纯样式取值、设计令牌、文案措辞不在本次范围。

## 严重度

| 级别 | 含义 |
| --- | --- |
| 高 | 常见用法下就会出错：行为 bug、内存或监听泄漏、SSR 水合不一致、明显卡顿，能指出触发条件 |
| 中 | 特定条件下出错，或明确的性能 / 维护隐患（例如违反单向数据流、响应性丢失的边界情况） |
| 低 | 写法统一、可读性、小幅性能改进 |

## 每条问题的格式

```markdown
### [高] RebornXxx：一句话说清问题
- 位置：`app/components/reborn/ui/reborn-xxx/RebornXxx.vue:123`（多处时逐一列出）
- 类别：响应性 / 数据流 / 组件边界 / 模板 / 生命周期与清理 / 性能 / SSR / 插槽与透传 / 其他
- 依据：对应参考文件与要点，例如 `references/reactivity.md`「解构 props 会丢失响应性」
- 现状：引用 1~5 行关键代码，说明为什么有问题、在什么条件下触发
- 改法：具体到怎么改，必要时给出改后的代码片段
- 影响：是否改动公开 API（props / emits / slots / expose）、是否要同步 UniApp 端 / 文档 / 知识库、回归风险
```

要求：

- 每条都必须对照源码确认，写明行号；拿不准的标「待确认」，并写清需要验证什么。不写臆测。
- 同一种问题在多个文件重复出现时合成一条，列出全部位置。
- 报告末尾附「覆盖清单」：分片内每个文件一行，写「无问题」或对应的问题条数，保证全量覆盖、没有漏看的文件。
- 报告开头写分片范围、文件数、各级问题数。

## 约束

- 只读：不修改任何源码，不执行会改变仓库状态的 git 命令，只写自己分片的报告文件。
- 不启动或重启 dev server（`127.0.0.1:3000` 由使用者维护），不跑构建、类型检查与测试。
