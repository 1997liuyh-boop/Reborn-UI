import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { after, it, mock } from "node:test";
/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import { runInThisContext } from "node:vm";
import { compileScript, parse } from "@vue/compiler-sfc";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

// 独立面板：SSR 首帧确定性、挂载后切到此刻、禁用回调变化只校正不重置
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { createApp, createSSRApp, h, ref, nextTick } = await import("vue");
const { renderToString } = await import("@vue/server-renderer");
const root = path.resolve("app/components/reborn/ui/reborn-time-picker");
const stubs = {
  "RebornButton.vue": `import { h } from 'vue'; export default { setup(_, { slots }) { return () => h('button', slots.default?.()); } };`,
  "RebornScrollbar.vue": `import { h, ref } from 'vue'; export default { emits:['scroll'], setup(_, { slots, expose }) { const wrapRef=ref(null); expose({wrapRef,setScrollTop(){}}); return () => h('div',{ref:wrapRef}, slots.default?.()); } };`,
};
const result = await build({
  entryPoints: [path.join(root, "RebornTimePanel.vue")], bundle: true, write: false,
  platform: "node", format: "cjs", packages: "external",
  plugins: [{ name: "测试编译Vue", setup(builder) {
    builder.onResolve({ filter: /^~\// }, args => ({ path: path.resolve("app", `${args.path.slice(2)}.ts`) }));
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
const Panel = module.exports.default;
const mounted = [];
after(() => { mounted.forEach(cleanup => cleanup()); dom.window.close(); mock.timers.reset(); });

/** 各列当前选中项的值，按列顺序返回 */
const selectedValues = container => [...container.querySelectorAll('[role="listbox"]')]
  .map(column => column.querySelector('[aria-selected="true"]')?.getAttribute("data-value"));

it("空值时服务端首帧固定为 00:00:00，与渲染时刻无关", async () => {
  const render = () => renderToString(createSSRApp({ render: () => h(Panel, { modelValue: "" }) }));
  mock.timers.enable({ apis: ["Date"], now: new Date(2026, 0, 1, 9, 30, 45) });
  const first = await render();
  mock.timers.setTime(new Date(2026, 0, 1, 17, 5, 12).getTime());
  const second = await render();
  mock.timers.reset();
  assert.equal(first, second);
  const holder = document.createElement("div");
  holder.innerHTML = first;
  assert.deepEqual(selectedValues(holder), ["0", "0", "0"]);
});

it("挂载后空值切到此刻，且不写绑定值", async () => {
  mock.timers.enable({ apis: ["Date"], now: new Date(2026, 0, 1, 9, 30, 45) });
  const model = ref("");
  const container = document.createElement("div"); document.body.append(container);
  const app = createApp({ render: () => h(Panel, { "modelValue": model.value, "onUpdate:modelValue": (v) => { model.value = v; } }) });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  await nextTick();
  mock.timers.reset();
  assert.deepEqual(selectedValues(container), ["9", "30", "45"]);
  assert.equal(model.value, "");
});

it("禁用回调换成新函数时只按规则校正，不回退到此刻", async () => {
  mock.timers.enable({ apis: ["Date"], now: new Date(2026, 0, 1, 9, 30, 45) });
  const tick = ref(0);
  const container = document.createElement("div"); document.body.append(container);
  // 父级每次渲染都传一个新的内联函数，模拟带时钟等高频状态的父组件
  const app = createApp({ render: () => {
    const blocked = tick.value >= 2 ? [45] : [];
    return h(Panel, { modelValue: "", disabledSeconds: () => blocked });
  } });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  await nextTick();
  mock.timers.setTime(new Date(2026, 0, 1, 11, 0, 3).getTime());
  tick.value = 1; await nextTick();
  assert.deepEqual(selectedValues(container), ["9", "30", "45"]);
  // 规则真的变化时按新规则校正到最近的可选值
  tick.value = 2; await nextTick();
  mock.timers.reset();
  assert.deepEqual(selectedValues(container), ["9", "30", "46"]);
});

it("秒值变化时仅秒列重绘，毫秒列保持独立缓存", async () => {
  const value = ref('10:20:30.400');
  const counts = new Map();
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({ render: () => h(Panel, { modelValue: value.value, format: 'HH:mm:ss.SSS' }) });
  app.mixin({ updated() {
    if (this.$options.__name === 'TimePanelOptions') counts.set(this.$props.unit, (counts.get(this.$props.unit) ?? 0) + 1);
  } });
  app.mount(container);
  mounted.push(() => { app.unmount(); container.remove(); });
  await nextTick();
  counts.clear();
  value.value = '10:20:31.400';
  await nextTick();
  assert.equal(counts.get('second'), 1);
  assert.equal(counts.get('hour') ?? 0, 0);
  assert.equal(counts.get('minute') ?? 0, 0);
  assert.equal(counts.get('millisecond') ?? 0, 0);
  assert.equal(container.querySelectorAll('[role="listbox"]')[3].querySelectorAll('[role="option"]').length, 3000);
});

it("整面板禁用时所有选项 aria-disabled，但选中项保留高亮样式", async () => {
  const container = document.createElement("div"); document.body.append(container);
  const app = createApp({ render: () => h(Panel, { modelValue: "10:20:30", disabled: true }) });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  await nextTick();
  const hour = container.querySelectorAll('[role="listbox"]')[0];
  const selected = hour.querySelector('[aria-selected="true"]');
  const other = hour.querySelector('[aria-selected="false"]');
  assert.equal(selected.getAttribute("data-value"), "10");
  assert.equal(selected.getAttribute("aria-disabled"), "true");
  assert.equal(other.getAttribute("aria-disabled"), "true");
  assert.notEqual(selected.className, other.className, "选中项与未选项的样式应不同");
  // 点击被整面板禁用拦截，不改变选中项
  other.click(); await nextTick();
  assert.equal(hour.querySelector('[aria-selected="true"]').getAttribute("data-value"), "10");
});
