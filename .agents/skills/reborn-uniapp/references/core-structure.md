# 目录结构与路径规范 (UniApp)

## 1. 核心路径

组件开发涉及以下核心目录：

| 类别 | 绝对路径 | 说明 |
|------|----------|------|
| 组件目录 | `packages/uniapp-project/src/components/reborn-[name]/` | 包含 .vue、.config.ts 及可选 index.ts |
| Demo 目录 | `packages/uniapp-project/src/pages/reborn-[name]/` | 包含 Demo.vue 及配套组件 |
| 路由配置 | `packages/uniapp-project/src/pages.json` | 注册 Demo 页面路由 |
| 库工具 | `packages/uniapp-project/src/lib/` | 包含 tv.ts, utils.ts, util.ts 等 |
| 组合式函数 | `packages/uniapp-project/src/composables/` | 包含 useLockScroll、useChildren、useDarkMode 等 |

## 2. Web 端参照路径（跨端一致性检索）

开发前必须先检索 Web 端（本仓库 Nuxt 版）是否存在同名组件，作为 API 对齐基准：

| 类别 | 绝对路径 | 说明 |
|------|----------|------|
| Web 组件目录 | `app/components/reborn/ui/reborn-[name]/` | 包含 `Reborn[Name].vue` 与 `reborn-[name].config.ts` |
| Web 组合式函数 | `app/composables/` | 如 `useOverlay.ts`（命令式浮层管理） |

## 3. 文件命名规范

- **组件主文件**: `Reborn[Name].vue` (大驼峰命名，与 Web 端一致，如 `RebornBadge.vue`)
- **样式配置文件**: `reborn-[name].config.ts` (全小写横杠，同步组件文件夹命名)
- **入口文件（可选）**: `index.ts` (统一导出组件与类型)
- **Demo 页面**: `Reborn[Name]Demo.vue` (大驼峰命名)
- **Demo 文件夹**: `reborn-[name]` (小写横杠)
