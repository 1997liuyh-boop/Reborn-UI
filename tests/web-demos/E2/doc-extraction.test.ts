/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
/**
 * 文档站与知识库都按 demo 主文件的文本抽取章节（nuxt.config.ts 的 demo-heading-meta、
 * ComponentTabs 注入的 demo 源码、trimComponentDocBody 的正文裁剪）。
 * 日期选择器与日期面板的演示曾把 DemoSection / Playground 拆进子组件，抽取随之失效：
 * 正文重复、卡片丢了代码与复制按钮、目录缺「交互演练场」。这里直接对主文件跑同一套抽取函数。
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { buildRunnableDemoSections } from "../../../app/utils/demoSectionSfc";
import { extractDemoSections } from "../../../app/utils/extractDemoSections";
import { trimComponentDocBody } from "../../../app/utils/trimComponentDocBody";

const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const baseline = JSON.parse(readFileSync(new URL("./content-baseline.json", import.meta.url), "utf8")) as Record<
  string,
  { chapters: string[] }
>;

/** 与 nuxt.config.ts 里 demo-heading-meta 的写法保持一致：目录据此给演练场加锚点 */
function playgroundTitleOf(raw: string): string {
  return raw.match(/<Playground\s[^>]*?\stitle="([^"]*)"/)?.[1] ?? "";
}

/** 把 md 的「## 用法」一节转成 trimComponentDocBody 认识的最小 AST：每个小节一个标题加一段文字 */
function usageAst(markdown: string): unknown[] {
  const nodes: unknown[] = [];
  let inUsage = false;
  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      inUsage = h2[1]!.trim() === "用法";
      if (inUsage) nodes.push(["h2", { id: "用法" }, "用法"]);
      continue;
    }
    const h3 = inUsage ? line.match(/^### (.+)$/) : null;
    if (h3) {
      const title = h3[1]!.trim();
      nodes.push(["h3", { id: title }, title], ["p", {}, `${title}的说明`]);
    }
  }
  return nodes;
}

for (const [componentId, demoPath, docPath, brokenTitles] of [
  [
    "reborn-date-picker",
    "app/components/reborn/examples/reborn-date-picker/RebornDatePickerDemo.vue",
    "content/2.components/input-and-forms/reborn-date-picker.md",
    ["自定义单元格与导航图标", "事件", "与表单联动"],
  ],
  [
    "reborn-date-picker-panel",
    "app/components/reborn/examples/reborn-date-picker-panel/RebornDatePickerPanelDemo.vue",
    "content/2.components/input-and-forms/reborn-date-picker-panel.md",
    ["自定义单元格", "事件"],
  ],
] as const) {
  it(`${componentId}：主文件抽取出全部章节与演练场标题，卡片拿得到源码，正文同名小节被裁掉`, () => {
    const raw = read(demoPath);
    const titles = Object.keys(extractDemoSections(raw));
    assert.deepEqual(titles, baseline[componentId]!.chapters);
    assert.equal(titles.length, componentId === "reborn-date-picker" ? 15 : 11);
    assert.equal(playgroundTitleOf(raw), "交互演练场");

    // 抽不到源码时 DemoSection 会隐藏「展开代码 / 复制 / 询问 AI / 在 Playground 运行」
    const runnable = buildRunnableDemoSections(raw);
    for (const title of titles) assert.ok(runnable[title]?.includes("<template>"), title);

    // 曾经失效的几节：文档「用法」里的同名小节应当被裁掉，并把首段交给示例卡片
    const { usage } = trimComponentDocBody(usageAst(read(docPath)), titles);
    for (const title of brokenTitles) {
      assert.ok(usage[title], `正文小节「${title}」没有对上示例卡片`);
      assert.equal(usage[title]!.id, title);
    }
  });
}

it("日期面板引用配色与尺寸的章节，卡片源码只带上 appearance，不带整套演练场配置", () => {
  const runnable = buildRunnableDemoSections(read("app/components/reborn/examples/reborn-date-picker-panel/RebornDatePickerPanelDemo.vue"));
  const source = runnable["自定义单元格"]!;
  assert.match(source, /const appearance = shallowRef/);
  assert.match(source, /const defaultAppearance/);
  assert.doesNotMatch(source, /const state =/);
  assert.doesNotMatch(source, /const controls =/);
});
