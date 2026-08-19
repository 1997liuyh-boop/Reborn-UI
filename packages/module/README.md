# reborn-ui-registry

**纯 registry 数据分发包，不含任何代码。** 存放 CLI 生成的 registry JSON，供 `reborn-ui` 的 `add` 命令读取并向用户项目写入组件文件。

## 使用场景

`reborn-ui` CLI 自带一份 registry（`registry: "builtin"`，默认），普通用户无需安装本包。本包的用途是**让 registry 数据与 CLI 独立升级**：在项目的 `components.json` 中设置：

```json
{ "registry": "reborn-ui-registry" }
```

即可不升级 CLI 而获取最新组件数据。

## 数据来源与更新

由仓库根目录的 `pnpm registry:build` 生成（`packages/cli` 的 build 命令通过 `--also-out` 自动写入本包），**禁止手改**：

- `registry/registry.json` — 全量清单（含 title/description/category/tags 元数据，来自 `knowledge/index.json`）
- `registry/components/*.json` — 每组件一份（含 fileCount 与 contentHash）

> 注意：目录名 `packages/module` 是历史遗留，本包不是 Nuxt module。


