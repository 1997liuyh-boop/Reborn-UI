# Reborn UI 组件知识库架构

## 仓库与部署

第一期沿用 `Reborn-UI` 单仓。Web 和 UniApp 源码、组件文档、Demo、人工规则及抽取器随同一次提交更新。现有 `reborn-ui-mcp` 继续作为本地分发入口。远程服务有实际调用方时，可以在同仓独立部署，直接加载 CI 发布的知识库快照。

考虑拆仓的条件是接入第二个需要独立维护的组件库，或服务已经由不同团队负责发布权限、数据接入和运维。满足条件时，将服务建在 `D:\demo2\reborn-ui-knowledge`，通过版本化快照消费 Reborn UI 数据。组件事实和生成器仍在原仓维护。

## 四层职责

| 层级 | 功能 | 功能描述 |
|---|---|---|
| **接入层 ACCESS** | 本地 MCP | **已有。** `reborn-ui-mcp` 通过 stdio 查询组件、示例、安装说明、设计映射及模板检查，发布包内置知识库快照。 |
| | 远程 MCP 和 REST | **按需新增。** Agent 走 `/mcp`，文档站或设计平台走 `/api/v1/components` 等只读接口。远程 MCP 采用 Streamable HTTP。两种入口共用查询逻辑和同一版本快照。 |
| | CI 触发 | **已有构建校验，拟新增产物发布。** PR 验证生成结果，版本发布触发打包并登记快照。重建按源码变更和发布事件触发。 |
| **业务层 APIS** | 选型与 API | **已有。** 按名称、别名、分类查候选，读取 Props、Events、Slots、Expose、用法边界与示例。**拟补齐**一致的平台过滤、平台差异及版本查询。 |
| | 安装与依赖 | **已有安装命令。** **拟新增**按平台返回安装命令、前置组件与 npm 依赖，并绑定对应的 registry 版本。 |
| | 设计映射与用法校验 | **已有。** 将设计节点名、结构信号与样式映射到组件和参数。检查模板中的 `ui` 键、枚举取值及已登记的用法规则。 |
| **能力层 ENGINES** | 结构化抽取 | **已有。** 读取 Vue 源码、组件文档、Demo、registry 和人工补充规则，合并为 JSON，并校验成员、例子及设计配方。 |
| | 检索与关系 | **已有**加权关键词检索。**拟新增**先做平台和分类过滤，再按 ID、名称、别名、说明排序。依赖及替代关系用带来源的结构化数据表达。 |
| **存储层 STORAGE** | Git 和 JSON | **已有。** Git 保存可编辑的源文件、覆盖规则和轻量索引。构建生成组件条目、Schema 与报告。MCP 发布包携带快照，并内联 Demo 源码以供离线读取。 |
| | 版本化产物 | **拟新增。** 将同一次构建的清单、组件条目、索引、规则和可校验文件打包，支持按版本查询及整体回滚。远程服务启用后，可以用制品库或对象存储分发同一份包。 |

参考框架中的会话记忆、仓库同步和跨仓代码检索适合独立业务。组件知识库的维护流程对应 Git PR 和 CI，业务接口面向组件选型、设计还原及安装。现有约 172 个组件，第一期采用结构化数据和关键词索引，保留现有抽取器。

## 数据契约与发布

- **组件身份**沿用 `componentId`，同一 ID 对应 Web 和 UniApp 的实现。读取指定平台时，组合已验证的公共成员与该端成员。同名成员有端差异时保留两条记录。指定端不支持时返回 `PLATFORM_UNSUPPORTED`。缺少端级证据的字段显式标记未知。
- **事实来源**沿用 `sourceRefs`、`docPath` 和示例路径。API 成员以源码为准，安装和依赖以对应 registry 及 CLI 解析结果为准，适用场景、别名和设计规则由文档或人工覆盖提供。包与仓库内示例通过源码路径和提交 SHA 对齐。
- **版本身份**在外层增加 `manifest.json`，登记 `snapshotVersion`、`schemaVersion`、`sourceCommit`、`registryVersion`、`componentCount` 和构建后文件校验值。现有 `_meta.contentHash` 继续供仓库内漂移检测。发布文件的校验值在示例内联完成后计算。已发布版本的内容固定，默认指针指向最近一次通过校验的发布。
- **构建与回滚**按 `registry:build → kb:build → kb:check → 打包 → 校验包 → 发布并切换默认版本` 执行。构建或校验失败时保留上一版。回滚时切换整个快照版本，查询层每次请求固定使用一份快照。客户端可以从返回元数据取得版本并对后续请求显式固定版本。

## 查询示例

| 场景 | 调用 | 结果 |
|---|---|---|
| 找 Web 按钮 | 拟新增 `GET /api/v1/components?q=按钮&platform=web`，或为 `search_components` 补齐 `platform` | 返回支持 Web 的候选及命中原因。 |
| 查 Web 参数 | 现有 `get_component({ id: "reborn-button", platform: "web", fields: ["props"] })` | `size` 支持 `sm`、`md`、`lg`，默认 `md`。 |
| 查 UniApp 的差异 | 现有 `get_component({ id: "reborn-button", platform: "uniapp", fields: ["props"] })` | `size` 还支持 `xs`、`default`、`xl`、`2xl`，默认 `md`。 |
| 获取对应端示例 | 现有 `get_component_example({ id: "reborn-button", platform: "uniapp" })` | 返回 UniApp 示例。 |
| 获取可复现的安装方案 | 拟新增 `GET /api/v1/components/reborn-button/install?platform=uniapp&version=<snapshot>`，或扩展 `get_install_command` | 返回显式 `--platform uniapp`、匹配的 CLI 与 registry 版本、该端的依赖清单。现有工具为通用安装命令，依赖仍是组件级汇总。 |

## 交付顺序与验收

1. **版本化快照。** 复用现有 `kb:snapshot` 的示例内联方式，将清单与发布校验纳入 CI。验收要求包内条目数和索引一致，离线可读取示例，已发布版本能按提交追溯。构建失败后仍可读上一版。
2. **平台一致性。** 统一选型、详情、示例、设计映射及安装的平台规则。验收覆盖双端同名 Prop 的不同选项、只支持一端的组件和两端依赖不同的组件。未提供平台的现有调用保留其默认行为。
3. **按调用方增加远程入口。** 先保留本地 MCP 工作流。有共享访问需求时接入远程 MCP，有网页或其他程序调用需求时提供 REST。对同一版本、同一查询验证两种入口的组件 ID、平台成员及排序一致，验证指定历史版本和回滚。
4. **基于查询评测扩展检索。** 在现有别名与设计回归集上补充真实任务描述，记录 Top 3 命中率和平台误荐数。先修复别名、规则或数据缺失。对仍集中在语义改写的漏召回，可以试验向量召回与 RRF，并用同一批样例比较。多跳依赖或影响查询达到稳定需求、结构化关系查询难以满足时，再评估 Neo4j。只有在出现运行时编辑或多来源协同维护需求时，再评估 MongoDB 等数据库。

## 依据

- [仓库知识库说明](../knowledge/README.md)
- [本地 MCP 工具与快照](../packages/mcp/README.md)
- [知识库 Schema](../scripts/kb/schema.ts)
- [现有 CI 校验顺序](../.github/workflows/kb-check.yml)
- [MCP TypeScript SDK 的 HTTP 接入说明](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/http.md)
