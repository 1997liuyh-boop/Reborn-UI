# 内容补齐作业手册 v2（批次代理共用）

> 你是 Reborn UI 内容补齐批次代理。对分派给你的每个组件，**依次完成以下 3 项**。
> 完成后返回：每个组件的完成清单（补了几条成员描述 / 文档新增哪些节）。
> **不要运行 pnpm kb:build / registry:build / lint / format**（主线统一跑）。不要动其他组件的文件。
> 本手册 v1 版基于旧知识库架构（coverage.json / AUTOGEN 区 / demo-block），已废弃；
> 当前架构：知识库 `knowledge/components/<id>.json`（生成物，禁止手改），文档站用 ComponentViewer。

## 0. 素材与路径

- Web 源码：`app/components/reborn/ui/<id>/`；UniApp 源码：`packages/uniapp-project/src/components/<id>/`
- 知识档案（只读参考）：`knowledge/components/<id>.json` —— props/events/slots/exposes 中
  `description` 为空的成员即为缺口；whenToUse/whenNotToUse/pitfalls 是人工内容可改写进文档
- 人工内容层：`knowledge/overrides/<id>.json`（只在需要修正手写区时编辑）
- 文档：`content/2.components/<分类目录>/<id>.md`
- 文档结构样板：`content/2.components/layout/reborn-waterfall.md`（完整结构：frontmatter →
  ComponentViewer → 简介 → 用法分节 → API → 自定义样式 → 注意事项）
- 历史素材（如主线提供）：Wave1 挖掘的人写描述素材库 legacy-descriptions.json，
  可由 `git show 52c264b:knowledge/legacy-descriptions.json` 提取；语句质量甄别后可直接采用

## 1. 源码成员描述补齐（Web 端 + UniApp 端）

对知识档案里 `description` 为空的每个 prop / emit / slot / expose 成员，在源码补中文注释：

- 位置：成员**上方 JSDoc**（`/** 一句话中文描述 */`）或**行尾 `//` 注释**均可被抽取器识别；
  保持该文件既有注释风格
- emits（数组元素或类型成员）、defineSlots 成员、defineModel 语句、defineExpose 成员同样适用
- 两端源码都要查：知识档案合并双端成员，缺口成员可能只在其中一端
- 模板 `<slot>` 兜底抽出的插槽无处写注释——改在 defineSlots 中声明（带 JSDoc）**仅当组件已用
  defineSlots**；否则跳过该成员并在报告中注明
- 描述写实际语义（含单位/取值范围/联动行为），禁止「xxx 属性」式废话；一律中文
- **只加注释，不改任何逻辑/类型/默认值**

## 2. 文档充实（content/2.components/.../<id>.md）

文档偏薄（无简介、只有一个 ComponentViewer + API 表）的组件，按 waterfall 样板补齐：

1. frontmatter `description` 若空泛，改写为一句准确定位（≤60 字，Agent 选型第一依据）
2. `## 简介`：组件定位 + 适用/不适用场景（改写知识档案 whenToUse/whenNotToUse，
   不适用场景给出替代组件名）
3. `## 用法` 下 2-4 个 `###` 功能分节（简单组件 1-2 个）：节首一句话说明（关键 prop 用反引号），
   配 ```vue 静态代码块（5-15 行，可运行的最小示例）；当前架构**没有 demo-block**，
   不要创建独立示例文件，示例直接写在文档代码块里
4. 功能点选择依据：有 size/color/variant 枚举必做对应节；有 v-model 做交互节；有插槽做插槽节
5. `## 注意事项`：改写知识档案 pitfalls + 源码里发现的真实坑点；uniapp 示例尺寸用 rpx
6. **API 表格约束（CI 强校验）**：`## API` 下 `### Props/### Emits/### Slots/### Expose`
   标准标题内的表格行名必须与源码成员名一致（写了源码没有的名字 CI 会挂）；
   ui 键位表 / 类型字段表放在非 API 标题下（如「### 自定义样式（ui）」）
7. API 表格中缺描述的行顺手补上（与源码注释同语义）

## 3. 手写区修正（仅必要时）

`knowledge/overrides/<id>.json` 的 description/whenToUse/whenNotToUse/pitfalls 若与源码实际
行为不符（如引用了不存在的 prop），一并修正；否则不动。

## 验收自查（每组件）

- [ ] 知识档案缺描述成员清单逐条对照：源码已补注释（或报告中注明无法补的原因）
- [ ] 文档有简介与至少 2 个用法节（简单组件 1 个），示例代码语法正确
- [ ] API 表格行名未新增源码不存在的成员
- [ ] 未改动 knowledge/components/、packages/*/registry/ 下任何文件
