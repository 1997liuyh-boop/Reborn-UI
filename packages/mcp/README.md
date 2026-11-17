# reborn-ui-mcp

Reborn-UI 组件库查询 MCP Server（stdio）。让任意支持 MCP 的 Agent 检索组件、读取 Props/Events/Slots、获取用法示例与使用边界，无需 grep 源码。

数据源是仓库的[组件知识库](../../knowledge/README.md)：发布包内置一份快照；本地开发时自动解析 monorepo 根的 `knowledge/`，也可用 `--kb-dir` / `REBORN_KB_DIR` 显式指定。

## 配置方式

Claude Code：

```bash
claude mcp add reborn-ui -- npx -y reborn-ui-mcp@latest
```

通用 MCP 客户端（JSON 配置）：

```json
{
  "mcpServers": {
    "reborn-ui": {
      "command": "npx",
      "args": ["-y", "reborn-ui-mcp@latest"]
    }
  }
}
```

仓库内开发（用最新知识库而非包内快照）：

```json
{
  "mcpServers": {
    "reborn-ui": {
      "command": "npx",
      "args": ["tsx", "packages/mcp/src/index.ts", "--kb-dir", "knowledge"]
    }
  }
}
```

## 工具一览

| 工具 | 用途 |
|---|---|
| `list_components` | 列出组件（可按 category / platform / tag 过滤），选型第一步 |
| `search_components` | 关键词加权检索（id 精确 > 名称 > 标签 > 描述） |
| `get_component` | 组件完整知识条目：props/events/slots/whenToUse/whenNotToUse/pitfalls |
| `get_component_example` | 用法示例代码（支持按标题/平台过滤） |
| `get_install_command` | CLI 安装命令与 npm 依赖清单 |
| `list_categories` | 全部分类与组件数量 |
| `match_design_nodes` | 设计稿还原：把 MasterGo / Figma 的一批节点（实例名、变体值、子节点名、所属区块）落到组件，返回每个节点的组件、配方（props / 插槽 / ui 键写法、禁止的替代实现）、需显式 import 的子组件，以及图廊这类跨节点的整体提示。节点还可以带结构信号 `signals`（下划线输入、角标、互斥选择组、展开收起列表、下拉触发器）与稿面样式 `style`：命中信号规则的按结构判定并返回必须写的属性 `requires`，带样式的返回按稿面解析的取值 `resolved`（size / shape / variant 与 ui 补充）；配方表见 [`knowledge/design-patterns.json`](../../knowledge/design-patterns.json) |
| `check_usage` | 模板用法检查：传一段模板或整份 `.vue`，核对 `ui` 对象里的键是否是组件真实消费的键（写错的键静默无效）、写死的枚举取值是否合法，并指出知识库登记的绕行写法——组件有现成变体或另有专门组件，却用 ui 覆盖、手写状态硬拼 |
| `get_authoring_spec` | 写作规范全文：`kind="doc"` 组件文档 / `kind="demo"` 组件 demo，`includeTemplate` 附带参考范本 |

## Agent 推荐工作流

1. `search_components` 或 `list_components` 找候选；
2. `get_component` 读 `whenToUse` / `whenNotToUse` / `pitfalls` 确认选型与端支持（`platforms`）；
3. `get_install_command` 安装组件；
4. `get_component_example` 参照示例写页面，props 用法以知识条目为准。

**还原设计稿**时第 1 步换成 `match_design_nodes`：把读到的节点整页或整块一次传入（`name` / `variant` / `children` / `group`，可带 `platform`），按返回的 `component`、`recipe`、`uses`、`subcomponents` 再走第 2–4 步。设计稿里的实例名往往不叫组件名（一列「缩略图」+ 主图 + 箭头其实是一个带 `thumbs` 的 `reborn-carousel`，「计数器」是 `reborn-input-number`），按节点名的字面意思搜会漏掉这些；配方表没覆盖的节点会退回别名检索并标 `status: "search"`，这类要先读 `whenToUse` / `whenNotToUse` 再决定。

节点名看不出是组件的结构要靠 `signals`：名字叫「搜索」的节点如果只有底边一条线，就是 `reborn-input variant="underlined"` 而不是去掉外框的 `reborn-search-box`；「黄点提示」这种压在图标角上的数字是 `reborn-chip`。调用方量得到几何时（设计工作室预读时自动做这一步）把信号与 `style` 一起传入，返回里 `source: "signal"` 的判定优先于节点名，`requires` 必须原样写在标签上，`resolved` 给出按稿面高度、圆角、描边解析的取值。写完模板后调 `check_usage`，`error` 必须修。

若要**为本组件库编写文档或 demo**（而非用组件写业务页面），先调 `get_authoring_spec` 取规范全文再动笔。压缩版骨架与硬规则已写在 server instructions 里，客户端会自动注入系统提示，无需 tool call 即可看到；全文与唯一参考范本（`reborn-button`）需要本工具。

规范正文的真源是仓库的 [`docs/authoring/`](../../docs/authoring/)：发布包内置一份 `spec/` 快照（`prepack` 时由 `spec:snapshot` 生成）；仓库内开发时自动解析 monorepo 根的 `docs/authoring/`，也可用 `--spec-dir` / `REBORN_SPEC_DIR` 指向快照目录做发布前验证。

## 本地调试

```bash
pnpm -F reborn-ui-mcp build
npx @modelcontextprotocol/inspector node packages/mcp/dist/index.js --kb-dir knowledge
```
