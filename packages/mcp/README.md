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
| `get_authoring_spec` | 写作规范全文：`kind="doc"` 组件文档 / `kind="demo"` 组件 demo，`includeTemplate` 附带参考范本 |

## Agent 推荐工作流

1. `search_components` 或 `list_components` 找候选；
2. `get_component` 读 `whenToUse` / `whenNotToUse` / `pitfalls` 确认选型与端支持（`platforms`）；
3. `get_install_command` 安装组件；
4. `get_component_example` 参照示例写页面，props 用法以知识条目为准。

若要**为本组件库编写文档或 demo**（而非用组件写业务页面），先调 `get_authoring_spec` 取规范全文再动笔。压缩版骨架与硬规则已写在 server instructions 里，客户端会自动注入系统提示，无需 tool call 即可看到；全文与唯一参考范本（`reborn-button`）需要本工具。

规范正文的真源是仓库的 [`docs/authoring/`](../../docs/authoring/)：发布包内置一份 `spec/` 快照（`prepack` 时由 `spec:snapshot` 生成）；仓库内开发时自动解析 monorepo 根的 `docs/authoring/`，也可用 `--spec-dir` / `REBORN_SPEC_DIR` 指向快照目录做发布前验证。

## 本地调试

```bash
pnpm -F reborn-ui-mcp build
npx @modelcontextprotocol/inspector node packages/mcp/dist/index.js --kb-dir knowledge
```
