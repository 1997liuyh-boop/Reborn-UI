# Vue 最佳实践整改：口径与约束

按 [README.md](README.md) 汇总的审查结论，对各分片报告（`W1.md` … `P1.md`）里的问题**全部整改**。本文件是所有整改代理共用的口径，分片报告是各自的任务清单。

## 已定的决策

1. **全部条目都改**：高、中、低一视同仁。标「待确认」的条目也按报告里的改法改，在进度文件里列入「待实测」，由使用者在小程序开发者工具 / 真机或浏览器里确认。
2. **公开 API 直接改，按破坏性变更处理**：不做兼容别名。改了 props / emits / 插槽 / expose / 默认行为的，必须同步：
   - 组件文档 `content/2.components/**/<组件>.md`（API 表格行名与源码逐字一致，CI 会校验），写法遵守 `docs/authoring/component-doc.md`；
   - 知识库手写覆盖 `knowledge/overrides/<组件>.json`（如有相关字段）；
   - Web 与 UniApp 同名组件两端一致（见「归属」一节的转交规则）；
   - 在进度文件的「更新日志」一节写一条（`破坏` / `调整` / `修复` 前缀，格式同 `content/3.changelogs/index.md`），**不要直接改更新日志文件**，最后统一汇总。
3. **全仓库写法统一**，在自己分片的文件里一并处理：
   - **原始值 `ref` → `shallowRef`**：值是原始类型，或只会被整体替换、从不就地修改（不 `push`、不改属性）时才换。对象 / 数组被就地修改的、传给依赖深层响应性的 API 的，保留 `ref`。拿不准就保留 `ref`。
   - **模板引用 → `useTemplateRef`（仅 Web 端）**：`const el = ref<HTMLElement>()` 配 `ref="el"` 改为 `const el = useTemplateRef<HTMLElement>('el')`，变量名与模板里的 key 保持一致。`useTemplateRef` 返回只读引用，代码里若有 `el.value = ...` 赋值的不能换；函数式 ref（`:ref="fn"`）不动。
   - **UniApp 端运行时是 uni-mp-vue 内置的 Vue 3.4.21**：只能用 Vue 3.4 已有的 API。`shallowRef`、`defineModel` 可以用；**禁止**使用 `useTemplateRef`、`useId`、`onWatcherCleanup` 等 3.5 才有的 API，模板引用保持 `ref` 写法。审查报告里若给 UniApp 端的改法用到了 3.5 API，换成 3.4 可用的等价写法。

## 归属（避免多个代理改同一个文件）

所有代理共用同一个工作区，**只改自己分片范围内的文件**，外加：

- 本分片组件对应的文档 `content/2.components/**/<组件>.md`、知识库覆盖 `knowledge/overrides/<组件>.json`、测试 `tests/<组件>/**`；
- 本分片报告里明确点名、且不属于任何其他分片的文件。

需要改别处的（例如 W2 的 Cascader 依赖 W6 的 SelectTrigger 先转发属性、Web 端修复需要 UniApp 端同步、组件修复需要演示跟着改），**不要自己动手**，在进度文件的「转交」一节写清：目标文件、要做的改动、原因。整改按批次推进，后一批或最后的整合阶段会处理这些转交。

批次安排：第一批 W1 ~ W8、C1；第二批 U1 ~ U3、S1；第三批 E1 ~ E5、P1。第二、三批开始前，先读前一批各分片进度文件里转给自己的条目，一并处理。

## 每条的处理流程

1. 重读报告里这一条，对照**当前代码**确认问题仍然存在（基线提交后代码可能已变）。已不存在的记「无需修改」并写明原因。
2. 改公开组件、组合式函数或被多处引用的符号前，先做影响分析：GitNexus `impact`（`repo: "Reborn-UI"`，`direction: "upstream"`）。结果为 `UNKNOWN` 或找不到符号时，用 Grep 搜调用处确认，不要当成无人使用。
3. 按报告的改法修改。注释一律中文；props 用接口式 `defineProps<Props>()`，双向绑定用 `defineModel`（布尔类型 model 写 `default: undefined`）；UniApp 尺寸用 `rpx`；`// #ifdef` / `// #endif` 条件编译原样保留。
4. 每改完一条（或一个组件），立刻追加到进度文件，不要攒到最后，以便中断后续跑。

## 验证

- **eslint**：对改过的文件运行 `npx eslint <文件...>`，问题数不得多于改动前。对比改动前用 `git show HEAD:<文件> | npx eslint --stdin --stdin-filename <文件>`。**禁止 `--fix`**（会破坏 UniApp 条件编译，也会产生无关改动）。
- **测试**：本分片组件在 `tests/<组件>/` 下有测试的，用 `npx tsx --test tests/<组件>/*.test.ts` 运行。整改前已失败的用例见 [fixes/_test-baseline.md](fixes/_test-baseline.md)；新增失败必须修好或说明原因。行为变更导致旧断言过时的，更新断言并在进度文件里说明。
- **浏览器**（选做，高级问题建议做）：使用者的 dev server 在 `http://127.0.0.1:3000`，可以用 playwright-core 脚本访问验证（脚本放在系统临时目录，不放进仓库；`createRequire('D:/demo2/Reborn-UI/package.json')('playwright-core')`）。其他代理同时在改代码，页面偶尔会因编译中断报错，稍后重试即可。

## 禁止

- 任何改变仓库状态的 git 命令：`add`、`commit`、`stash`、`checkout`、`reset`、`restore` 等（提交由协调者按分片统一做）。
- 启动 / 重启 / 停止 dev server；运行 `nuxi typecheck` 或全项目 `vue-tsc`（会打断 dev server，由协调者统一跑）；`pnpm install`；`pnpm kb:build` / `registry:build`（全局产物，由协调者统一重建）。
- 修改 `content/3.changelogs/index.md`、本目录下的审查报告与他人的进度文件。

## 进度文件

每个分片一份：`fixes/<分片>.md`，格式：

```markdown
# <分片> 整改进度

## 条目
| 报告条目 | 状态 | 改动文件 | 说明 |
| --- | --- | --- | --- |
| [高] RebornXxx：……（报告里的标题） | 已修 / 无需修改 / 转交 / 未完成 | `path:行` | 关键改法，或不改的理由 |

## 写法统一
改了哪些文件的 shallowRef / useTemplateRef，保留 ref 的特殊情况。

## 转交
- 目标文件 / 分片：要做的改动；原因。

## 更新日志
- 破坏 **Xxx**（Web）：……

## 待实测
- 条目、平台（微信小程序 / H5 / 浏览器）、验证方法。

## 验证记录
eslint 前后问题数、测试结果、浏览器验证结果。
```

最后一定要有「条目」表覆盖报告里的**每一条**，状态不能留空。
