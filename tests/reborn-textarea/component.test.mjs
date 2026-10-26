import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { after, it } from "node:test";
/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import { runInThisContext } from "node:vm";
import { compileScript, parse } from "@vue/compiler-sfc";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

// 文本域按源码编译，在 JSDOM 中验证 v-model 同步与字数统计
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node", "Event", "FocusEvent"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { createApp, h, ref, nextTick } = await import("vue");
const result = await build({
  entryPoints: [path.resolve("app/components/reborn/ui/reborn-textarea/RebornTextarea.vue")], bundle: true, write: false,
  platform: "node", format: "cjs", packages: "external",
  plugins: [{ name: "测试编译Vue", setup(builder) {
    builder.onResolve({ filter: /^~\// }, args => ({ path: path.resolve("app", `${args.path.slice(2)}.ts`) }));
    builder.onLoad({ filter: /\.vue$/ }, (args) => {
      const { descriptor, errors } = parse(readFileSync(args.path, "utf8"), { filename: args.path });
      assert.deepEqual(errors, []);
      const compiled = compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: {
        fileExists: existsSync, readFile: file => readFileSync(file, "utf8"),
      } });
      return { contents: compiled.content, loader: "ts", resolveDir: path.dirname(args.path) };
    });
  } }],
});
const module = { exports: {} };
runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, createRequire(import.meta.url));
const Textarea = module.exports.default;
const mounted = [];
function mount(value, props = {}) {
  const model = ref(value);
  const changes = [];
  const updates = [];
  const container = document.createElement("div"); document.body.append(container);
  const app = createApp({ setup: () => () => h(Textarea, {
    showWordLimit: true, ...props, modelValue: model.value,
    "onUpdate:modelValue": (v) => { updates.push(v); model.value = v; },
    onChange: v => changes.push(v),
  }) });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  return { container, model, changes, updates, textarea: () => container.querySelector("textarea") };
}
after(() => { mounted.forEach(cleanup => cleanup()); dom.window.close(); });

it("父级重置为 undefined 或 null 时清空内容与字数，不抛错", async () => {
  const t = mount("你好");
  assert.equal(t.textarea().value, "你好");
  t.model.value = undefined; await nextTick();
  assert.equal(t.textarea().value, "");
  assert.ok(t.container.textContent.includes("0 / 100"));
  t.model.value = "回填"; await nextTick();
  t.model.value = null; await nextTick();
  assert.equal(t.textarea().value, "");
  assert.ok(t.container.textContent.includes("0 / 100"));
});

it("输入时 update:modelValue 与 change 各派发一次，载荷为最新文本", async () => {
  const t = mount("");
  t.textarea().value = "新内容"; t.textarea().dispatchEvent(new Event("input")); await nextTick();
  assert.deepEqual(t.updates, ["新内容"]);
  assert.deepEqual(t.changes, ["新内容"]);
  assert.ok(t.container.textContent.includes("3 / 100"));
});

it("autofocus 不预设聚焦态，以真实 focus 事件为准", async () => {
  const t = mount("", { autofocus: true });
  const root = t.container.firstElementChild;
  const before = root.className;
  t.textarea().dispatchEvent(new FocusEvent("focus")); await nextTick();
  assert.notEqual(root.className, before);
});
