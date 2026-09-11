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
- **文档写作规范正文（唯一真源）**：`docs/authoring/component-doc.md` —— 章节骨架、各节写法、
  文风与反例都在这里，动笔前通读一遍
- **唯一参考范本**：`content/2.components/button/reborn-button.md` —— 全库结构最完整的一份，
  拿不准某节该写成什么样就照它抄结构（注意：旧版本手册曾把 `reborn-waterfall.md` 列为样板，
  那份缺 `简介` / `何时使用` / `两端差异对照`，已作废）
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

文档偏薄（无简介、只有一个 ComponentViewer + API 表）的组件，按规范正文补齐。

**结构、各节写法、文风要求一律以 `docs/authoring/component-doc.md` 为准**，本手册不再重复描述
（此前重复的一份已与范本脱节，是批次产出参差的直接原因）。只补充批次场景下的额外约束：

1. **素材来源**：`## 简介` / `### 何时使用` / `### 何时不使用` / `## 注意事项` 的内容改写自知识
   档案的 whenToUse / whenNotToUse / pitfalls，再补上你在源码里发现的真实坑点；不要凭想象编造。
   frontmatter `description` 若空泛，一并改写为一句准确定位 —— 它同时是知识库 `description`
   的真源（`kb:build` 直接取这一句），规则见 `knowledge/README.md`「描述规范」。
2. **分节数量按组件复杂度收敛**：`## 用法` 下 2-4 个 `###` 节，简单组件 1-2 个即可；选择依据是
   有 size/color/variant 枚举必做对应节，有 v-model 做交互节，有插槽做插槽节。
3. **示例直接内联**：当前架构**没有 demo-block**，批次代理不要新建独立示例文件，示例写在文档的
   ```vue 代码块里（5-15 行，可运行的最小示例）。
4. **API 表格中缺描述的行顺手补上**，与你在第 1 步给源码写的注释同语义。
5. **不确定就少写**：宁可缺一节并在报告里注明原因，也不要写源码里不存在的 prop / 事件 / 插槽
   ——CI 会挂（规范正文「API 的 CI 强校验」一节有完整规则）。

## 3. 手写区修正（仅必要时）

`knowledge/overrides/<id>.json` 的 description/whenToUse/whenNotToUse/pitfalls 若与源码实际
行为不符（如引用了不存在的 prop），一并修正；否则不动。

## 验收自查（每组件）

- [ ] 知识档案缺描述成员清单逐条对照：源码已补注释（或报告中注明无法补的原因）
- [ ] 章节序列与 `docs/authoring/component-doc.md` 的骨架一致：`## 简介` / `### 何时使用` /
      `### 何时不使用` 都在位，`## 用法` 有至少 2 个节（简单组件 1 个），示例代码语法正确
- [ ] `### 何时不使用` 的每一条都给出了替代组件 id
- [ ] `## 注意事项` 每条都是「粗体结论句 + 机制 + 后果」，不是空泛提醒
- [ ] API 表格行名未新增源码不存在的成员；ui 键位表 / CSS 变量表放在非 API 标题下
- [ ] 未改动 knowledge/components/、packages/*/registry/ 下任何文件
