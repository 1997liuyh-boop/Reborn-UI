# 目录结构与路径规范 (Web)

## 1. 核心路径

Web 组件开发涉及以下核心目录：

| 类别 | 绝对路径 | 说明 |
|------|----------|------|
| 组件目录 | `app/components/reborn/ui/reborn-[name]/` | 包含 [Name].vue, index.ts 和 .config.ts |
| Playground | `app/components/reborn/configs/reborn-[name]/` | 包含 Reborn[Name]Config.vue |
| 组件文档 | `content/2.components/[category]/reborn-[name].md` | Markdown 说明文档 |
| 库工具 | `app/lib/` | 包含 tv.ts, utils.ts, util.ts |

## 2. 文件命名规范

- **组件主文件**: `[Name].vue` (大驼峰命名)
- **文件夹名称**: `reborn-[name]` (全小写横杠)
- **样式配置文件**: `reborn-[name].config.ts` (同步文件夹命名)
- **入口文件**: `index.ts` (导出组件类型或组件本身)
- **文档文件**: `reborn-[name].md` (小写横杠)
