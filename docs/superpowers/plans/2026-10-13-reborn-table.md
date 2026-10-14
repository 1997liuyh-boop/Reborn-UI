# RebornTable Implementation Plan

> **For agentic workers:** 使用 subagent-driven-development；主线程实现状态和渲染，独立任务实现纯函数及文档 Demo，最后统一回归。

**Goal:** 提供用户已确认范围的 Web 表格、文档、Demo 与回归测试。
**Architecture:** 列入口归一化 → 筛选排序 → 根节点分页 → 展开树行 → 语义化表格；状态独立于 DOM，固定布局使用实际测量。
**Tech Stack:** Vue 3、TypeScript、Tailwind CSS、tailwind-variants、Node test。
**Spec:** docs/superpowers/specs/2026-10-13-reborn-table-design.md

## Global Constraints

- 中文注释；Vue 模板无 TS 断言；无下划线方法名；不触碰已有未提交改动。
- 14px / 22px 沿用 text-base，不覆盖行高；行高 36/48/56px；gray-2 悬停、gray-3 边框。
- 新增符号 impact 为 UNKNOWN，已文本确认无既有定义；不修改被复用组件。
- 本轮不提交、不发布；生成 registry/知识库只运行构建器，不手工修改。

## Task 1: 数据与类型

文件：app/components/reborn/ui/reborn-table/{table.types.ts,table.utils.ts}、tests/reborn-table/utils.test.ts。
- [x] 先编写排序、筛选、树遍历、分组表头及合并测试并运行确认失败。
- [x] 实现类型契约与纯函数；输入不变，0/false 保留，空值安全。
- [x] 执行 `node --import tsx --test tests/reborn-table/utils.test.ts`，确认通过。

## Task 2: 状态、渲染和样式

文件：同目录 RebornTable.vue、RebornTableColumn.vue、TableView.ts、table.state.ts、table.columns.ts、reborn-table.config.ts、index.ts；tests/reborn-table/component.test.ts。
- [x] 测试具名模型、选择/禁选/保留选择、远程事件、页码钳制、SSR 声明列与动态更新。
- [x] 主组件仅公开 API；渲染时读取声明列，避免 setup 外调用插槽造成 SSR 缺列。
- [x] 接入复用组件、固定列测量与 ResizeObserver 清理；加载时拦截内置操作。
- [x] 执行组件测试和 ESLint，只修复本轮文件。

## Task 3: 文档与示例

文件：examples/reborn-table/RebornTableDemo.vue、configs/reborn-table/RebornTableConfig.vue、content/2.components/data/reborn-table.md、knowledge/overrides/reborn-table.json。
- [x] 阅读 component-demo / component-doc 范本，按同名同序能力分节。
- [x] Playground 与场景演示仅传真实参数；选择、分页和排序有事件回显。
- [x] 以源码校准完整 API 表，披露远程模式、键要求和未实现范围。

## Task 4: 集成与验收

- [x] 生成知识库索引，再运行 registry:build --strict-kb，重建知识库并 kb:check。
- [x] 全量 Node 测试、针对新增文件 ESLint、类型检查和浏览器固定布局冒烟。
- [x] 审查只读输入、事件时序、SSR 与清理逻辑；修复实际发现，报告验证结果与限制。

## 验收记录

- 新增表格测试 58 项，全仓 348 项通过；新增文件 ESLint 通过。
- registry 和知识库均为 162 个组件，文档偏差 0，kb:check 通过。
- 浏览器实测 sm/md/lg 为 36/48/56px，14px 字号、22px 行高、500 字重；固定头列、maxHeight、选择、筛选和排序通过。
- 定向审查的七项问题与复审发现的混合类型行键焦点问题均已补测试修复，复审通过。
- vue-tsc 仍报告工作区其他组件和文档站的 271 项现有类型错误；输出未包含 reborn-table 路径。未修改这些无关代码。
- 本轮未提交代码、未发布 npm。
