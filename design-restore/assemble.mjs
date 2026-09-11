// 拼装脚本：把 fragments/section-*.html 按分区序号拼进根画板容器，输出带占位符的完整 HTML
// 产物 assembled.html 仍含 @@SVG:...@@ 与 T{i}|{nodeId} 占位符，需再经 mcp applyDesign 注入真实数据
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fragmentsDir = path.join(here, "fragments");

const files = fs
  .readdirSync(fragmentsDir)
  .filter((f) => /^section-\d{3}\.html$/.test(f))
  .sort();

if (files.length !== 125) {
  console.error(`片段数量不对：${files.length}/125，缺失的分区先补齐再拼装`);
  process.exit(1);
}

const body = files
  .map((f) => `<!-- ===== ${f} ===== -->\n${fs.readFileSync(path.join(fragmentsDir, f), "utf8").trim()}`)
  .join("\n\n");

// 根容器样式来自 getDesignSections 的 rootContainer
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reborn Design-PC 组件总览</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #F4F4F6; }
  .design-root {
    position: relative;
    width: 2648px;
    min-height: 8912px;
    background: #FFFFFF; /* token: paint_22:128591 */
    overflow: hidden;
    margin: 0 auto;
    font-family: "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif;
  }
</style>
</head>
<body>
<div class="design-root">
${body}
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(here, "assembled.html"), html);
console.log(`拼装完成：assembled.html（${files.length} 个分区，${(html.length / 1024).toFixed(0)} KB）`);
