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

// 只替代浮层外壳与徽标等共享组件，Select 自身的选中逻辑与模板按源码编译
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { createApp, h, nextTick, reactive, shallowRef } = await import("vue");

// 表单上下文是自动导入的组合式函数，这里给一个不在表单里的最小实现
globalThis.useFormInject = () => ({ disabled: shallowRef(false), size: shallowRef(undefined), isError: shallowRef(false), validate: () => {} });

const stubs = {
  // 触发器与下拉内容同时渲染，测试直接点选项、读触发器文本
  "RebornSelectTrigger.vue": `import { h } from 'vue'; export default { setup(_, { slots }) { return () => h('div', [h('div', { 'data-trigger': '' }, slots.trigger?.()), h('div', { 'data-content': '' }, slots.content?.())]); } };`,
  "RebornBadge.vue": `import { h } from 'vue'; export default { props:['label','closable'], emits:['close'], setup(p, { emit }) { return () => h('span', { 'data-tag': p.label }, [p.label, p.closable ? h('button', { 'data-close': p.label, onClick: e => emit('close', e) }) : null]); } };`,
  "RebornTooltip.vue": `import { h } from 'vue'; export default { setup(_, { slots }) { return () => h('span', slots.default?.()); } };`,
  "RebornLoading.vue": `import { h } from 'vue'; export default { setup() { return () => h('i'); } };`,
};
const root = path.resolve("app/components/reborn/ui/reborn-select");
const result = await build({
  entryPoints: [path.join(root, "RebornSelect.vue")], bundle: true, write: false,
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
const Select = module.exports.default;

const localOptions = [{ label: "甲", value: "a" }, { label: "乙", value: "b" }];
/** 远程搜索换回来的结果：不含已选的 a / b */
const remoteOptions = [{ label: "丙", value: "c" }];

const mounted = [];
/** 挂载受控 Select：accept 为 false 时父级拒收所有改动，绑定值保持原样 */
function mount(initial) {
  const state = reactive({ options: localOptions, accept: false, updates: [], ...initial });
  const container = document.createElement("div");
  document.body.append(container);
  const app = createApp({ render: () => h(Select, {
    options: state.options,
    multiple: state.multiple,
    clearable: true,
    modelValue: state.modelValue,
    "onUpdate:modelValue": (value) => {
      state.updates.push(value);
      if (state.accept) state.modelValue = value;
    },
  }) });
  app.component("Icon", { render: () => h("i") });
  app.mount(container);
  mounted.push(() => { app.unmount(); container.remove(); });
  return {
    state,
    triggerText: () => container.querySelector("[data-trigger]").textContent.trim(),
    tags: () => [...container.querySelectorAll("[data-trigger] [data-tag]")].map(el => el.dataset.tag),
    click: async (selector) => { container.querySelector(selector).dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); await nextTick(); },
  };
}
after(() => { mounted.forEach(cleanup => cleanup()); dom.window.close(); });

it("单选：远程结果不含已选值时，父级拒收新选项仍回显原已选项", async () => {
  const t = mount({ modelValue: "a" });
  t.state.options = remoteOptions; await nextTick();
  assert.equal(t.triggerText(), "甲", "换成远程结果后靠缓存回显");

  await t.click("[data-content] [data-index='0']");
  assert.deepEqual(t.state.updates, ["c"], "选中照常上报");
  assert.equal(t.state.modelValue, "a", "父级拒收，绑定值不变");
  assert.equal(t.triggerText(), "甲", "缓存没有在选中瞬间被整体替换，原已选项仍能回显");

  t.state.accept = true;
  await t.click("[data-content] [data-index='0']");
  assert.equal(t.triggerText(), "丙", "父级接收后显示新选项");
});

it("单选：父级拒收清空时，原已选项仍能回显", async () => {
  const t = mount({ modelValue: "a" });
  t.state.options = remoteOptions; await nextTick();
  await t.click("[data-trigger] span[class*='cursor-pointer']");
  assert.equal(t.state.modelValue, "a");
  assert.equal(t.triggerText(), "甲");
});

it("多选：父级拒收移除标签 / 取消选中时，标签不消失；接收后才移除", async () => {
  const t = mount({ multiple: true, modelValue: ["a", "b"] });
  t.state.options = remoteOptions; await nextTick();
  assert.deepEqual(t.tags(), ["甲", "乙"]);

  await t.click("[data-close='甲']");
  assert.deepEqual(t.state.updates.at(-1), ["b"]);
  assert.deepEqual(t.tags(), ["甲", "乙"], "拒收后 a 仍在绑定值里，标签照常回显");

  t.state.accept = true;
  await t.click("[data-close='甲']");
  assert.deepEqual(t.tags(), ["乙"], "接收后标签移除");

  // 回到本地列表后取消选中 b 再被拒收：b 不在远程结果里也不能丢
  t.state.accept = false;
  t.state.options = localOptions; await nextTick();
  await t.click("[data-content] [data-index='1']");
  t.state.options = remoteOptions; await nextTick();
  assert.deepEqual(t.tags(), ["乙"], "取消选中被拒收，换成远程结果后仍回显");
});
