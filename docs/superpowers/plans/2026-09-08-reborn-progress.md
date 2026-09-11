# RebornProgress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 新增完整 Web 进度条，涵盖六种形态、状态、文字与颜色能力。
**Architecture:** 独立纯函数处理进度、颜色区间与弧线；tv 配置负责尺寸与静态样式；Vue 组件负责响应式渲染和无障碍语义。
**Tech Stack:** Vue 3、TypeScript、Tailwind CSS 4、SVG、Node test、现有 Nuxt 文档站。
**Spec:** docs/superpowers/specs/2026-09-08-reborn-progress-design.md

## Global Constraints

- 只新增 Web 组件，不修改旧组件及已有工作区修改；不自动提交。
- 六种形态、全部尺寸严格按设计；中文注释，模板不写 TS 语法。
- 所有生成物通过 registry/kb 命令生成，禁止手改。

### Task 1: 数据与几何
**Files:** 新增 app/components/reborn/ui/reborn-progress/reborn-progress.utils.ts、reborn-progress.config.ts；测试 tests/reborn-progress/progress.test.ts。
**Interfaces:** normalizePercent、normalizeSteps、getColorRanges、getArcGeometry、getArcPath、getStepRanges；颜色类型与尺寸常量。
- [x] 先写边界值、区间、尺寸、圆弧及间隔测试并确认失败。
- [x] 实现纯函数和配置，运行测试到通过。

### Task 2: 组件
**Files:** 新增 app/components/reborn/ui/reborn-progress/RebornProgress.vue、index.ts；测试 tests/reborn-progress/render.test.ts。
**Interfaces:** percent/type/size/status/steps/strokeColor/segments/textInside/format/showText/ariaLabel/ui；默认插槽 { percent, status }。
- [x] 写 SSR 渲染测试，覆盖六形态、无障碍、图标/格式化/插槽、独立渐变 ID，确认失败。
- [x] 实现组件并通过测试。

### Task 3: 示例与交付
**Files:** 新增 app/components/reborn/examples/reborn-progress/RebornProgressDemo.vue、app/components/reborn/configs/reborn-progress/RebornProgressConfig.vue、content/2.components/miscellaneous/reborn-progress.md、knowledge/overrides/reborn-progress.json；生成更新 knowledge/index.json。
- [x] 编写演练场、尺寸与状态矩阵、渐变、步骤颜色、分段、内嵌文字、格式化与插槽示例。
- [x] 运行定向 ESLint、测试、类型检查；构建 registry 与知识库并检查。
- [x] 浏览器核查实际尺寸、响应式变化及控制台，检查最终变更范围。


## 验证结果（2026-09-08）

- 工具函数与真实 Vue SSR：16/16 通过，包含渐变角度、分段端帽和步骤内嵌文字回归。
- 定向 ESLint 通过。
- registry:build 与 kb:build 成功，149 个组件，无文档偏差。
- kb:check 仅剩既有 reborn-select 的 Web/UniApp 文档键位两项错误；Progress 无检查错误。
- 定向 vue-tsc 无 Progress 错误，但被既有 app/lib/tv.ts:61 的 TS2352 阻断，不能宣称类型检查全通过。
- 独立 Chrome 检查 55 个实例、六种形态、三档尺寸/图标、任务推进与重置、窄容器步骤滚动及 sm 内嵌文字，均符合预期，无页面脚本错误。
- 390px 文档站页面存在公共页头溢出至 508px，来源于现有公共导航，不在本次修改范围；Progress 内容未发现未裁切溢出。
- 只交付 Web，未进行 UniApp 构建；保留所有已有修改，未提交。
