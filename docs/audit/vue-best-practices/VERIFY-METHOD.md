# 整改复核：口径与约束

整改已经完成（工作区里 `d0474cc` 之后的未提交改动）。本轮是**独立复核**：用 `vuejs-ai/skills` 的 `vue-best-practices` 技能逐条确认审查问题是否真的修好，并找出整改本身引入的新问题。**只读，不改源码。**

## 依据

1. 先读 `.agents/skills/vue-best-practices/SKILL.md` 和四篇核心参考：`references/reactivity.md`、`references/sfc.md`、`references/component-data-flow.md`、`references/composables.md`；涉及插槽、透传属性、Teleport、Transition、KeepAlive、渲染函数、列表性能时再读对应专题参考。调试类问题参考 `.agents/skills/vue-debug-guides/`。
2. 项目规则见 [METHOD.md](METHOD.md)「项目规则优先」一节；整改时定下的决策见 [FIX-METHOD.md](FIX-METHOD.md)「已定的决策」：公开 API 直接改并按破坏性变更处理、全仓库写法统一（`shallowRef` / Web 端 `useTemplateRef`）、UniApp 端运行时是 **Vue 3.4.21**（禁止 `useTemplateRef`、`useId`、`onWatcherCleanup` 等 3.5 API）。按这些决策判断，不要把决策本身当问题。
3. 原审查报告是 `W1.md` … `P1.md`；整改方的自述在 `fixes/<分片>.md`。**自述只作线索，不作证据**：每条都要回到当前源码确认。

## 要做的两件事

### 一、原问题是否真的修好

对本分片对应的原审查报告里的**每一条**（高 / 中 / 低），对照当前代码判定：

| 判定 | 含义 |
| --- | --- |
| 已修复 | 问题的触发条件在当前代码下不再成立，改法合理 |
| 部分修复 | 只修了一部分位置或一部分触发条件 |
| 未修复 | 问题仍然存在 |
| 修复有误 | 改了，但改法本身有缺陷，或引入了副作用 |
| 无法确认 | 必须真机 / 浏览器实测才能定论，写清验证方法 |

「已修复」只需一行依据（文件:行）；其余判定按下面「新问题」的格式写全。

### 二、整改引入的新问题

审查本分片范围内的整改差异：`git diff HEAD -- <路径>`，以及范围内的新增未跟踪文件（`git ls-files --others --exclude-standard -- <路径>`）、被删除的文件（`git diff HEAD --diff-filter=D --name-only -- <路径>`）。重点怀疑：

- **批量写法替换的副作用**：`ref` → `shallowRef` 后仍被就地修改（`.value.push(...)`、`.value.xxx = ...`、`.value[i] = ...`）或传给依赖深层响应性的地方，导致界面不更新；`useTemplateRef('key')` 的 key 与模板 `ref="key"` 不一致、用在 `v-for` 里、被赋值、或模板 ref 实际是组件而类型写成了元素。
- **UniApp 端用了 Vue 3.5 才有的 API**，或小程序端不支持的写法（渲染函数未包在 `#ifdef H5` 里、Teleport、直接操作 DOM），条件编译注释被破坏。
- **删除 / 改名的文件、组件、导出、props、事件、插槽**仍有调用方（`Grep` 全仓搜索，含 demo、文档 md 代码块、知识库 `knowledge/overrides`、CLI 模板、UniApp 页面）。
- **破坏性 API 变更**没有同步到文档 API 表、知识库覆盖、两端同名组件、演示代码；或两端行为不一致。
- 新写的逻辑本身的 bug：响应性丢失、watch / computed 依赖不全、副作用（定时器、监听、观察器、rAF、WebGL）没随卸载清理、SSR / 水合不一致、`defineModel` 布尔强转（类型含 Boolean 必须 `default: undefined`）、受控 model 赋值后同步读旧值、`useFormInject` 的 `disabled` 未用 `=== true` 判断、事件派发重复或丢失。
- 新拆出来的组件 / 组合式函数边界是否合理（技能 SKILL.md「Choose useful boundaries」），是否只是换了个地方转发。
- 文档改动与源码不符：API 表行名与源码成员逐字一致、默认值、示例代码能否按现有 API 运行。

## 严重度

同 [METHOD.md](METHOD.md)：高（常见用法下就出错）/ 中（特定条件下出错或明确隐患）/ 低（写法、可读性、小幅性能）。

## 条目格式

```markdown
### [高] RebornXxx：一句话说清问题
- 类型：原问题未修复 / 部分修复 / 修复有误 / 新问题
- 原条目：（原报告里的标题；新问题写「无」）
- 位置：`path/to/File.vue:123`
- 依据：技能参考文件与要点
- 现状：引用 1~5 行关键代码，说明触发条件与后果
- 建议改法：具体到怎么改
```

每条都要对照源码确认并写明行号；拿不准就标「无法确认」并写清要验证什么，不写臆测。

## 输出

报告写到 `verify/<分片>.md`，结构：

1. 开头：范围、读过的差异文件数、原条目判定计数（已修复 / 部分 / 未修复 / 有误 / 无法确认）、新问题计数（高 / 中 / 低）。
2. 「原条目判定」表：原报告**每一条**一行，判定 + 依据（文件:行）。
3. 「需要处理的问题」：所有非「已修复」的原条目与全部新问题，按严重度排序，格式见上。
4. 「覆盖清单」：本分片差异涉及的每个文件一行，写「无问题」或对应条数。

**边审边写**：先建文件写好开头，每审完一个组件就追加，最后补齐计数与覆盖清单，防止中断丢进度。若文件已存在，说明是续跑，先读它，跳过已完成的部分。

## 约束

- 只读：不修改源码、文档、测试，只写自己的 `verify/<分片>.md`。
- 不执行会改变仓库状态的 git 命令（`add`、`commit`、`stash`、`checkout`、`reset`、`restore` 等）。
- 不启动 / 重启 / 停止 dev server（`127.0.0.1:3000` 由使用者维护），不跑 `nuxi typecheck`、构建、`pnpm install`、`kb:build`。可以运行本分片组件已有的测试（`npx tsx --test tests/<目录>/*.test.ts`、`node --test tests/<目录>/*.test.mjs`）来佐证，但全量测试与类型检查由协调者统一跑。
