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

// 历史记录的读写只看 v-model:history 与本地存储，内部输入框换成桩
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "localStorage"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
const { createApp, h, nextTick, reactive } = await import("vue");

const stubs = {
  "RebornInput.vue": `import { h } from 'vue'; export default { setup(_, { expose }) { expose({ blur() {} }); return () => h('input'); } };`,
};
const root = path.resolve("app/components/reborn/ui/reborn-search-box");
const result = await build({
  entryPoints: [path.join(root, "RebornSearchBox.vue")], bundle: true, write: false,
  platform: "node", format: "cjs", packages: "external",
  plugins: [{ name: "测试编译Vue", setup(builder) {
    builder.onResolve({ filter: /^~\// }, (args) => {
      const target = path.resolve("app", args.path.slice(2));
      return { path: existsSync(target) ? target : `${target}.ts` };
    });
    builder.onLoad({ filter: /\.vue$/ }, (args) => {
      const stub = stubs[path.basename(args.path)];
      if (stub) return { contents: stub, loader: "js" };
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
const SearchBox = module.exports.default;

const mounted = [];
/** 挂载搜索框；bindings 原样作为 props 传入，dropdown 插槽把作用域交给测试调用 */
function mount(bindings) {
  let scope;
  const container = document.createElement("div");
  document.body.append(container);
  const app = createApp({ render: () => h(SearchBox, bindings(), {
    dropdown: (slotScope) => { scope = slotScope; return h("div", { "data-history": "" }, slotScope.history.join(",")); },
  }) });
  app.component("Icon", { render: () => h("i") });
  app.mount(container);
  mounted.push(() => { app.unmount(); container.remove(); });
  return {
    scope: () => scope,
    shown: () => container.querySelector("[data-history]").textContent,
  };
}
after(() => { mounted.forEach(cleanup => cleanup()); dom.window.close(); });

it("绑定 v-model:history：只请求父级更新，拒收时界面维持父值，不写本地存储", async () => {
  localStorage.clear();
  const state = reactive({ history: ["初始"], updates: [], accept: false });
  const t = mount(() => ({ historyKey: "bound", history: state.history, "onUpdate:history": (value) => {
    state.updates.push(value);
    if (state.accept) state.history = value;
  } }));
  t.scope().selectHistory("新词"); await nextTick();
  assert.deepEqual(state.updates, [["新词", "初始"]]);
  assert.equal(t.shown(), "初始", "父级拒收，展示仍是父值");
  state.accept = true;
  t.scope().selectHistory("新词"); await nextTick();
  assert.equal(t.shown(), "新词,初始");
  assert.equal(localStorage.getItem("bound"), null, "绑定时不读写本地存储");
});

it("未绑定 history：读写本地存储，不发 update:history", async () => {
  localStorage.clear();
  localStorage.setItem("local", JSON.stringify(["存量"]));
  const updates = [];
  const t = mount(() => ({ historyKey: "local", "onUpdate:history": value => updates.push(value) }));
  await nextTick();
  assert.equal(t.shown(), "存量", "挂载后从本地存储恢复");
  t.scope().selectHistory("新词"); await nextTick();
  assert.equal(t.shown(), "新词,存量");
  assert.deepEqual(JSON.parse(localStorage.getItem("local")), ["新词", "存量"]);
  assert.deepEqual(updates, [], "未绑定时历史由组件自己持有，不向父级请求更新");
});

it("只传 :history 不监听更新：展示与写入是同一份数据，不会写本地存储", async () => {
  localStorage.clear();
  const t = mount(() => ({ historyKey: "oneway", history: ["父值"] }));
  t.scope().removeHistoryItem("父值"); await nextTick();
  assert.equal(t.shown(), "", "写入后展示随之更新，不再一边写本地值一边读父值");
  assert.equal(localStorage.getItem("oneway"), null);
});
