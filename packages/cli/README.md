# reborn-ui

通过 `npx reborn-ui@latest` 在你的项目中初始化与安装 Reborn UI 组件。

## 用法

### 初始化

在项目根目录运行：

```bash
npx reborn-ui@latest init
```

该命令会：

- 安装基础依赖（`clsx`、`tailwind-merge`、`tailwindcss`、`postcss`、`autoprefixer`）
- 生成 `components.json`（会询问：组件目录、lib 目录、composables 目录）
- 生成 `lib/utils.ts`（`cn` 实用程序，路径由你的 `components.json` 决定）
- 配置/补全 `tailwind.config.js` 的 `content`
- 生成 CSS 变量文件 `assets/css/reborn-ui.css`，并尽量自动加入 `nuxt.config.ts` 的 `css` 字段

### 添加组件

```bash
npx reborn-ui@latest add <组件名称>
```

该命令会：

- 从内置 registry 读取组件源码
- 将组件写入到 `components.json` 里配置的组件目录
- 自动安装组件需要的依赖

# reborn-ui (CLI)

通过 `npx reborn-ui@latest` 使用：

- `npx reborn-ui@latest init`：初始化项目（生成 `components.json`、安装依赖、写入 cn 工具、配置 Tailwind、写 CSS 变量）
- `npx reborn-ui@latest add <组件名>`：按 `components.json` 将组件复制到项目中并安装缺失依赖

内部（维护者）：

- 先在仓库运行 `pnpm registry:build` 生成 `packages/module/registry/*`
- 发布 `reborn-ui-registry` 与 `reborn-ui`


