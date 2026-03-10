# 目录结构与路径规范 (UniApp)

## 1. 核心路径

组件开发涉及以下核心目录：

| 类别 | 绝对路径 | 说明 |
|------|----------|------|
| 组件目录 | `packages/uniapp-project/src/components/reborn-[name]/` | 包含 .vue 和 .config.ts |
| Demo 目录 | `packages/uniapp-project/src/pages/reborn-[name]/` | 包含 Demo.vue 及配套组件 |
| 路由配置 | `packages/uniapp-project/src/pages.json` | 注册 Demo 页面路由 |
| 库工具 | `packages/uniapp-project/src/lib/` | 包含 tv.ts, utils.ts, util.ts |

## 2. 文件命名规范

- **组件主文件**: `reborn-[name].vue` (全小写横杠命名)
- **样式配置文件**: `reborn-[name].config.ts` (同步组件命名)
- **Demo 页面**: `Reborn[Name]Demo.vue` (大驼峰命名)
- **Demo 文件夹**: `reborn-[name]` (小写横杠)
