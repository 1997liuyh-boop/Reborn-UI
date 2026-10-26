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

// 只替代共享外壳（按钮、输入框、下拉、分页、滚动层、复选框），穿梭框自身的状态与模板按源码编译
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { createApp, h, ref, nextTick, provide, reactive } = await import("vue");
const root = path.resolve("app/components/reborn/ui/reborn-transfer");
/** 记录复选框桩的渲染次数，用来确认 v-memo 跳过了未变化的条目 */
globalThis.__transferCheckboxRenders = 0;
const stubs = {
  "RebornButton.vue": `import { h } from 'vue'; export default { props:['disabled'], emits:['click'], setup(p, { slots, emit }) { return () => h('button', { disabled: p.disabled, 'data-op': '', onClick: () => emit('click') }, slots.default?.()); } };`,
  "RebornInput.vue": `import { h } from 'vue'; export default { props:['modelValue','disabled'], emits:['update:modelValue'], setup(p, { emit }) { return () => h('input', { value: p.modelValue, disabled: p.disabled, onInput: e => emit('update:modelValue', e.target.value) }); } };`,
  "RebornSelect.vue": `import { h } from 'vue'; export default { props:['modelValue','options','disabled'], setup(p, { slots }) { return () => h('div', { 'data-select': '', 'data-disabled': String(!!p.disabled) }, slots.default?.()); } };`,
  "RebornPagination.vue": `import { h } from 'vue'; export default { setup() { return () => h('nav'); } };`,
  "RebornScrollbar.vue": `import { h, ref } from 'vue'; export default { emits:['scroll'], setup(_, { slots, expose, emit }) { const wrapRef = ref(null); expose({ wrapRef, setScrollTop() {} }); return () => h('div', { ref: wrapRef, 'data-wrap': '', onScroll: e => emit('scroll', { scrollTop: e.target.scrollTop }) }, slots.default?.()); } };`,
  "RebornCheckbox.vue": `import { h } from 'vue'; export default { props:['modelValue','disabled','indeterminate','label'], emits:['change'], setup(p, { slots, emit }) { return () => { globalThis.__transferCheckboxRenders++; return h('label', { 'data-checkbox': '' }, [h('input', { type: 'checkbox', checked: !!p.modelValue, disabled: !!p.disabled, onChange: () => emit('change') }), slots.default?.() ?? p.label]); }; } };`,
};
const result = await build({
  entryPoints: [path.join(root, "RebornTransfer.vue")], bundle: true, write: false,
  platform: "node", format: "cjs", packages: "external",
  plugins: [{ name: "测试编译Vue", setup(builder) {
    builder.onResolve({ filter: /^~\// }, (args) => {
      const target = path.resolve("app", args.path.slice(2));
      if (args.path === "~/composables/useFieldGroup") return { path: `${target}.ts`, external: true };
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
const Transfer = module.exports.default;
const { FORM_KEY } = createRequire(import.meta.url)(path.resolve("app/composables/useFieldGroup.ts"));

const dataSource = Array.from({ length: 6 }, (_, i) => ({ key: `k${i}`, label: `条目${i}` }));
const mounted = [];
/** 挂载穿梭框；form 传入时模拟所在 RebornForm 提供的上下文 */
function mount(initial = {}, { form, slots } = {}) {
  const props = reactive({ dataSource, ...initial });
  const model = ref(initial.modelValue ?? []);
  const container = document.createElement("div"); document.body.append(container);
  const app = createApp({ setup() {
    if (form) provide(FORM_KEY, form);
    return () => h(Transfer, { ...props, modelValue: model.value, "onUpdate:modelValue": (v) => { model.value = v; } }, slots);
  } });
  app.component("Icon", { render: () => h("i") });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  // 条目复选框带 w-full，头部全选框没有；右侧为空时头部全选框本就禁用，断言只看条目
  const checkboxes = () => [...container.querySelectorAll("[data-checkbox].w-full input")];
  const rows = () => [...container.querySelectorAll("[data-checkbox].w-full")].map(el => el.parentElement.parentElement);
  return { container, props, model, checkboxes, rows };
}
after(() => { mounted.forEach(cleanup => cleanup()); dom.window.close(); });

it("disabled 从 true 切回 false 后，勾选与穿梭恢复可用", async () => {
  const t = mount({ disabled: true });
  assert.ok(t.checkboxes().every(el => el.disabled));
  t.props.disabled = false; await nextTick();
  assert.ok(t.checkboxes().every(el => !el.disabled));
  t.checkboxes()[1].dispatchEvent(new Event("change")); await nextTick();
  t.container.querySelector("[data-op]").click(); await nextTick();
  assert.deepEqual(t.model.value, ["k1"]);
});

it("所在表单解除禁用后，穿梭框随之解除禁用", async () => {
  const form = { props: reactive({ disabled: true }) };
  const t = mount({}, { form });
  assert.ok(t.checkboxes().every(el => el.disabled));
  form.props.disabled = false; await nextTick();
  assert.ok(t.checkboxes().every(el => !el.disabled));
});

it("整体禁用时条目不再套用悬停底色", async () => {
  const t = mount({ disabled: true });
  const rows = t.rows();
  assert.equal(rows.length, dataSource.length);
  for (const row of rows) {
    assert.ok(row.className.includes("cursor-not-allowed"));
    assert.ok(!row.className.includes("hover:bg-gray-2"));
  }
});

it("dataSource 异步到达时 defaultTargetKeys 仍会生效，且只初始化一次", async () => {
  const t = mount({ dataSource: [], defaultTargetKeys: ["k2", "k9"] });
  assert.deepEqual(t.model.value, []);
  t.props.dataSource = dataSource; await nextTick();
  assert.deepEqual(t.model.value, ["k2"]);
  t.model.value = []; await nextTick();
  t.props.dataSource = [...dataSource]; await nextTick();
  assert.deepEqual(t.model.value, []);
});

it("setup 阶段即应用 defaultTargetKeys，v-model 已有值时不覆盖", async () => {
  assert.deepEqual(mount({ defaultTargetKeys: ["k1"] }).model.value, ["k1"]);
  assert.deepEqual(mount({ defaultTargetKeys: ["k1"], modelValue: ["k3"] }).model.value, ["k3"]);
});

it("勾选一条只重新渲染该条复选框，内容变化仍能更新", async () => {
  const t = mount();
  globalThis.__transferCheckboxRenders = 0;
  t.checkboxes()[2].dispatchEvent(new Event("change")); await nextTick();
  // 被勾选的条目加两侧头部全选框；其余条目整行跳过
  assert.ok(globalThis.__transferCheckboxRenders <= 3, `复选框渲染了 ${globalThis.__transferCheckboxRenders} 次`);
  assert.equal(t.checkboxes()[2].checked, true);
  // 被勾选行换成选中底色，相邻行保持原样
  assert.ok(t.rows()[2].className.includes("bg-brand-1"));
  assert.ok(!t.rows()[1].className.includes("bg-brand-1"));
  t.props.dataSource = dataSource.map(item => (item.key === "k3" ? { ...item, label: "已改名" } : item)); await nextTick();
  assert.ok(t.container.textContent.includes("已改名"));
});

it("提供自定义条目插槽时不缓存，插槽读取的外部状态变化能更新", async () => {
  const suffix = ref("甲");
  const t = mount({}, { slots: { default: ({ item }) => `${item.label}-${suffix.value}` } });
  assert.ok(t.container.textContent.includes("条目0-甲"));
  suffix.value = "乙"; await nextTick();
  assert.ok(t.container.textContent.includes("条目0-乙"));
});

for (const virtualScroll of [false, true]) {
  it(`同一条目原地修改禁用与文案仍更新，虚拟滚动=${virtualScroll}`, async () => {
    const t = mount({ dataSource: [{ key: "local", label: "旧名称", description: "旧说明", disabled: true }], virtualScroll });
    const item = t.props.dataSource[0];
    assert.equal(t.checkboxes()[0].disabled, true);
    item.disabled = false; await nextTick();
    assert.equal(t.props.dataSource[0], item);
    assert.equal(t.checkboxes()[0].disabled, false);
    assert.ok(!t.rows()[0].className.includes("cursor-not-allowed"));
    t.checkboxes()[0].dispatchEvent(new Event("change")); await nextTick();
    assert.equal(t.checkboxes()[0].checked, true);
    item.disabled = true; await nextTick();
    assert.equal(t.checkboxes()[0].disabled, true);
    assert.ok(t.rows()[0].className.includes("cursor-not-allowed"));
    item.label = "新名称"; item.description = "新说明"; await nextTick();
    assert.ok(t.rows()[0].textContent.includes("新名称"));
    assert.ok(t.rows()[0].textContent.includes("新说明"));
    item.description = ""; await nextTick();
    assert.ok(!t.rows()[0].textContent.includes("新说明"));
  });
}

it("单向右侧同一条目的禁用变化同步撤回按钮", async () => {
  const t = mount({ oneWay: true, dataSource: [{ key: "undo", label: "可撤回", disabled: false }] });
  const item = t.props.dataSource[0];
  t.checkboxes()[0].dispatchEvent(new Event("change")); await nextTick();
  t.container.querySelector("[data-op]").click(); await nextTick();
  const undo = () => t.container.querySelector('[aria-label="撤回到左侧"]');
  assert.equal(undo().disabled, false);
  item.disabled = true; await nextTick();
  assert.equal(undo().disabled, true);
  assert.ok(undo().className.includes("cursor-not-allowed"));
  item.disabled = false; await nextTick();
  assert.equal(undo().disabled, false);
  undo().click(); await nextTick();
  assert.deepEqual(t.model.value, []);
});

it("虚拟滚动只在跨行时更新窗口，同一行内的像素滚动不重渲染", async () => {
  const many = Array.from({ length: 200 }, (_, i) => ({ key: `v${i}`, label: `虚拟${i}` }));
  const t = mount({ dataSource: many, virtualScroll: true });
  const wrap = t.container.querySelector("[data-wrap]");
  const scrollTo = async (top) => { wrap.scrollTop = top; wrap.dispatchEvent(new Event("scroll")); await nextTick(); };
  await scrollTo(10 * 32);
  // 首行 = 滚动行号 10 减去 4 行缓冲
  assert.equal(t.rows()[0].textContent, "虚拟6");
  globalThis.__transferCheckboxRenders = 0;
  await scrollTo(10 * 32 + 20);
  assert.equal(globalThis.__transferCheckboxRenders, 0);
  await scrollTo(12 * 32);
  assert.equal(t.rows()[0].textContent, "虚拟8");
});
