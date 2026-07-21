# 目录结构与路径规范 (Web)

## 1. 核心路径

Web 组件开发涉及以下核心目录：

| 类别 | 绝对路径 | 说明 |
|------|----------|------|
| 组件目录 | `app/components/reborn/ui/reborn-[name]/` | 包含 [Name].vue, index.ts 和 .config.ts |
| Playground | `app/components/reborn/configs/reborn-[name]/` | 包含 Reborn[Name]Config.vue |
| 组件文档 | `content/2.components/[category]/reborn-[name].md` | Markdown 说明文档 |
| 组合式函数 | `app/composables/` | 如 useOverlay.ts、useCopyToClipboard.ts，Nuxt 自动导入 |
| 库工具 | `app/lib/` | 包含 tv.ts（createTV 定制实例）与 utils.ts（cn 等工具） |

## 2. 文件命名规范

- **组件主文件**: `[Name].vue` (大驼峰命名)
- **文件夹名称**: `reborn-[name]` (全小写横杠)
- **样式配置文件**: `reborn-[name].config.ts` (同步文件夹命名)
- **入口文件**: `index.ts` (导出组件类型或组件本身)
- **文档文件**: `reborn-[name].md` (小写横杠)
- **组合式函数**: `use[Name].ts` (小驼峰，`use` 前缀，如 `useOverlay.ts`)

## 3. 工具引入约定

- `tv` 必须从 `~/lib/tv`（或 `@/lib/tv`）引入，**禁止**直接从 `tailwind-variants` 引入——项目版本携带了定制的 `twMergeConfig`，直连三方包会导致自定义令牌类（如 `rounded-ui-sm`）合并异常。
- 类名合并统一使用 `~/lib/utils` 中的 `cn`。
