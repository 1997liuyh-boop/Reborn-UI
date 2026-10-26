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

// 消息容器按源码编译；动画组合式函数换成空实现，只验证渲染与状态
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node", "Event", "MouseEvent"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { createApp, defineComponent, h, nextTick, onMounted, ref } = await import("vue");
const motionStub = `export function useMotionList() { const noop = (_el, done) => done?.(); return { directive: {}, enter: noop, leave: noop, cancel() {} }; }`;
const result = await build({
  stdin: {
    contents: `export { default as RebornToast } from "./RebornToast.vue"; export * from "./reborn-toast.config";`,
    resolveDir: path.resolve("app/components/reborn/ui/reborn-toast"), loader: "ts",
  },
  bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
  plugins: [{ name: "测试编译Vue", setup(builder) {
    builder.onResolve({ filter: /useMotionList$/ }, () => ({ path: "motion-stub", namespace: "stub" }));
    builder.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: motionStub, loader: "js" }));
    builder.onResolve({ filter: /^[~@]\// }, args => ({ path: path.resolve("app", `${args.path.slice(2)}.ts`) }));
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
const { RebornToast, addMessage, destroyMessages, messageState } = module.exports;

const container = document.createElement("div"); document.body.append(container);
const app = createApp({ render: () => h(RebornToast) });
app.component("Icon", { props: ["name"], render() { return h("i", { "data-icon": this.name }); } });
app.mount(container);
after(() => { destroyMessages(); app.unmount(); dom.window.close(); });

it("VNode 内容在其他消息增删时不被卸载重建", async () => {
  let mounts = 0;
  const Counter = defineComponent({ setup() { const count = ref(0); onMounted(() => { mounts++; }); return () => h("button", { onClick: () => count.value++ }, `计数 ${count.value}`); } });
  void addMessage({ content: h(Counter), duration: 0, key: "vnode" });
  await nextTick();
  container.querySelector("button").click(); await nextTick();
  assert.equal(container.querySelector("button").textContent, "计数 1");
  void addMessage({ content: "另一条", duration: 0, key: "other" }); await nextTick();
  void addMessage({ content: "另一条", duration: 0, key: "other", type: "success" }); await nextTick();
  destroyMessages("other"); await nextTick();
  assert.equal(mounts, 1);
  assert.equal(container.querySelector("button").textContent, "计数 1");
  destroyMessages(); await nextTick();
});

it("同 key 更新配色后类名跟着变化", async () => {
  void addMessage({ content: "配色", duration: 0, key: "color", color: "success", variant: "filled" }); await nextTick();
  const before = container.querySelector(".reborn-message").className;
  void addMessage({ content: "配色", duration: 0, key: "color", color: "error", variant: "filled" }); await nextTick();
  assert.notEqual(container.querySelector(".reborn-message").className, before);
  destroyMessages(); await nextTick();
});

it("对外导出的 messageState 只读，不能绕过 addMessage 改写", async () => {
  const warn = console.warn; console.warn = () => {};
  try {
    messageState.top = 999;
    messageState.list.push({ id: -1 });
  } catch {}
  finally { console.warn = warn; }
  assert.notEqual(messageState.top, 999);
  assert.equal(messageState.list.length, 0);
});
