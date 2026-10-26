# 复核后整改：口径与约束

[verify/README.md](verify/README.md) 汇总了复核结论。本轮把复核报告里**所有没修好的原条目和所有新问题**修掉。

## 任务清单

每个修复分片对应一份复核报告 `verify/<Vn>.md`，要处理其中：

- 判定为「部分修复」「修复有误」「未修复」的原条目；
- 判定为「无法确认」的条目：能从代码层面落实的就按建议改法改，改不了的写进「待实测」；
- 全部新问题，高 / 中 / 低都改。

判定为「已修复」的条目不要再动。

## 已定的决策（沿用 [FIX-METHOD.md](FIX-METHOD.md)）

- 公开 API 可以直接改，按破坏性变更处理，并同步文档 API 表、知识库覆盖 `knowledge/overrides/<组件>.json` 和两端同名组件。更新日志不要直接改，写进进度文件的「更新日志」一节。
- 注释一律中文；props 用接口式 `defineProps<Props>()`；双向绑定用 `defineModel`，布尔类型的 model 写 `default: undefined`；UniApp 端尺寸用 `rpx`；`// #ifdef` / `// #endif` 条件编译原样保留。
- UniApp 运行时是 uni-mp-vue 内置的 **Vue 3.4.21**：禁止使用 `useTemplateRef`、`useId`、`onWatcherCleanup` 等 3.5 才有的 API。UniApp 端还要兼容 iOS 15.4 以下的小程序 / WebView：**不要使用 ES2022 及以后的内置方法**，例如 `Object.hasOwn`、`Array.prototype.at`、`findLast`、`structuredClone`。
- 小程序端不支持渲染函数（只能放在 `#ifdef H5` 里）、Teleport 和直接操作 DOM；小程序编译器会忽略插槽上的 `v-if`，把具名插槽一律当作「已传入」，不要依赖 `$slots.xxx` 在小程序端判断插槽是否存在。
- `useFormInject` 返回的 `disabled` 可能是数组，组件侧必须用 `=== true` 判断。

## 归属

所有修复代理共用一个工作区。**一个文件只由一个分片修改**：文件落在哪个分片的范围（见 [verify/_scopes.md](verify/_scopes.md)），就归哪个分片。组件对应的文档 `content/2.components/**/<组件>.md`、知识库覆盖与测试，归该组件所在的分片。

报告里某条问题需要改的文件不在本分片范围内：**不要动手**，写进进度文件的「转交」一节，写清目标文件、要做的改动和原因。协调者最后统一处理转交。

已预先指派的跨分片条目：

- [verify/_coordinator.md](verify/_coordinator.md) 的 C-2（iPhone 样机、MultiStepLoader 两处文档示例）归 V1。
- C-3（RebornSku 的 `defineSlots` 类型）归 V5。
- C-1、C-4 由协调者处理。

## 流程

1. 先读 `.agents/skills/vue-best-practices/SKILL.md` 及四篇核心参考，涉及插槽、透传属性、Transition、渲染函数时再读专题参考。
2. 每条问题都要先回到当前源码确认还存在。改公开组件、组合式函数或被多处引用的符号之前，先用 GitNexus 的 `impact` 做影响分析（`repo: "Reborn-UI"`，`direction: "upstream"`）；结果是 `UNKNOWN` 或找不到符号时，改用 Grep 搜索调用处确认，不能把它当成没人用。
3. 改动尽量小，不顺手重构无关代码。高、中级问题能写回归测试的就补上：参照 `tests/` 下现有写法，用 `node:test`，由 `npx tsx --test` 或 `node --test` 运行。复核发现，现有测试覆盖不到以下几类情况，补测试时优先覆盖：
   - 开发环境的模块加载；
   - 小程序模板编译后的插槽行为；
   - 布局高度；
   - tabBar 多页面；
   - 文档站从 demo 文件抽取章节。
4. 每改完一条，就把结果追加到进度文件，不要攒到最后，防止中断后丢失进度。

## 验证

- **eslint**：对每个要改的文件，改之前先跑一次 `npx eslint <文件>` 记下问题数，改完再跑一次，问题数不能增加。**禁止 `--fix`**，它会破坏 UniApp 的条件编译。
- **测试**：本分片相关的测试（`tests/<组件>/`，以及复核报告里提到的测试目录）全部跑一遍，不能新增失败。
- **浏览器**（选做）：使用者的 dev server 在 `http://127.0.0.1:3000`，可以写 playwright-core 脚本访问验证，脚本放在系统临时目录，不放进仓库。加载 playwright-core 的方式是 `createRequire('D:/demo2/Reborn-UI/package.json')('playwright-core')`。其他代理在同时改代码，页面偶尔会因为热更新报错，稍后重试即可。
- **小程序编译**（选做）：可以用仓库里的 `@dcloudio/uni-mp-compiler` 编译单个模板做断言，参考 `tests/uniapp-mp-model/` 的写法。

## 禁止

- 任何会改变仓库状态的 git 命令：`add`、`commit`、`stash`、`checkout`、`reset`、`restore` 等。
- 启动、重启或停止 dev server；运行 `nuxi typecheck` 或全项目 `vue-tsc`、构建、`pnpm install`、`kb:build`、`registry:build`。
- 修改 `content/3.changelogs/index.md`、审查与复核报告，以及其他分片的进度文件。

## 进度文件

写在 `fixes2/<Vn>.md`。文件已存在说明是续跑：先读它，跳过已完成的条目。

```markdown
# <Vn> 复核后整改

## 条目
| 复核条目（标题） | 状态 | 改动文件 | 说明 |
| --- | --- | --- | --- |
| [高] …… | 已修 / 转交 / 待实测 / 不修（写理由） | `path:行` | 关键改法 |

## 新增测试
## 转交
## 更新日志
## 待实测
## 验证记录
```

「条目」表必须覆盖本分片复核报告里每一个需要处理的条目，状态不能留空。
