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

// 只替代共享外壳，不替代时间选择器、面板或时间计算逻辑；几何样式另用真实浏览器验收。
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { createApp, h, ref, nextTick } = await import("vue");
const root = path.resolve("app/components/reborn/ui/reborn-time-picker");
const stubs = {
  "RebornButton.vue": `import { h } from 'vue'; export default { setup(_, { slots }) { return () => h('button', slots.default?.()); } };`,
  "RebornScrollbar.vue": `import { h, ref } from 'vue'; export default { emits:['scroll'], setup(_, { slots, expose, emit }) { const wrapRef=ref(null); expose({wrapRef,setScrollTop(value){if(wrapRef.value)wrapRef.value.scrollTop=value}}); return () => h('div',{ref:wrapRef,'data-scrollbar':'',onScroll:()=>emit('scroll')}, slots.default?.()); } };`,
  "RebornFieldTrigger.vue": `import { h } from 'vue'; export default { props:['clearable','disabled'], emits:['click','clear'], setup(p,{slots,emit}) { return () => h('div', {onClick:()=>emit('click')}, [slots.default?.(),p.clearable?h('button',{'data-clear':'',disabled:p.disabled,onClick:e=>{e.stopPropagation();emit('clear')}},'清空'):null]); } };`,
  "RebornSelectTrigger.vue": `import { h } from 'vue'; export default { props:['isOpen','closeOn'], emits:['close','keydown','after-enter'], setup(p,{slots}) { return () => h('div',{'data-close-on':p.closeOn},[slots.trigger?.(),p.isOpen?slots.content?.():null]); } };`,
};
const result = await build({
  entryPoints: [path.join(root, "RebornTimePicker.vue")], bundle: true, write: false,
  platform: "node", format: "cjs", packages: "external",
  plugins: [{ name: "测试编译Vue", setup(builder) {
    builder.onResolve({ filter: /^~\// }, args => ({ path: path.resolve("app", `${args.path.slice(2)}.ts`) }));
    builder.onLoad({ filter: /\.vue$/ }, args => {
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
const Picker = module.exports.default;
const mounted = [];
function mount(props = {}, value = "") {
  const model = ref(value);
  const events = { change: [], invalid: [], confirm: [], clear: [] };
  const container = document.createElement("div"); document.body.append(container);
  const app = createApp({ setup: () => () => h(Picker, {
    ...props, modelValue: model.value, "onUpdate:modelValue": value => { model.value = value; },
    onChange: value => events.change.push(value), onInvalid: value => events.invalid.push(value),
    onConfirm: value => events.confirm.push(value), onClear: () => events.clear.push(true),
  }) });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  return { container, model, events, input: () => container.querySelector("input") };
}
async function open(picker) { picker.input().click(); await nextTick(); await nextTick(); }
async function type(picker, value, key = "Enter") {
  picker.input().value = value; picker.input().dispatchEvent(new Event("input", { bubbles: true }));
  await nextTick(); picker.input().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })); await nextTick();
}
const button = (p, text) => [...p.container.querySelectorAll("button")].find(el => el.textContent.trim() === text);
after(() => { mounted.forEach(cleanup => cleanup()); dom.window.close(); });

it("空值打开不回写，点击选项后提交，确定关闭", async () => {
  const p = mount(); await open(p);
  assert.equal(p.model.value, ""); assert.deepEqual(p.events.change, []);
  p.container.querySelector('[aria-label="时"] [data-value="10"]').click(); await nextTick();
  assert.match(p.model.value, /^10:\d{2}:\d{2}$/);
  button(p,"确定").click(); await nextTick();
  assert.equal(p.container.querySelector('[role="dialog"]'), null); assert.equal(p.events.confirm.length, 1);
});
it("六种精度只渲染对应时间列，支持严格输入及外部更新", async () => {
  for (const [format,value,count] of [["HH:mm:ss","10:20:30",3],["HH","10",1],["mm","20",1],["ss","30",1],["HH:mm","10:20",2],["mm:ss","20:30",2]]) {
    const p = mount({format}); await open(p);
    assert.equal(p.container.querySelectorAll('[role="listbox"]').length, count);
    await type(p,value); assert.equal(p.model.value,value);
    p.model.value=""; await nextTick(); assert.equal(p.input().value,"");
  }
});
it("非法和禁用输入不会覆盖值，Escape 恢复输入", async () => {
  const p = mount({disabledSeconds:()=>[59]},"10:20:30");
  for (const value of ["24:00:00","10:20:59","9:00:00"]) { await type(p,value); assert.equal(p.model.value,"10:20:30"); assert.equal(p.input().getAttribute("aria-invalid"),"true"); }
  assert.equal(p.events.invalid.length,3);
  await type(p,"bad","Escape"); assert.equal(p.input().value,"10:20:30"); assert.equal(p.input().getAttribute("aria-invalid"),"false");
});
it("禁用组件不打开面板，只读模式不提交文本", async () => {
  const p=mount({disabled:true},"08:00:00"); await open(p); assert.equal(p.container.querySelector('[role="dialog"]'),null); assert.equal(p.input().disabled,true);
  const readonly=mount({allowInput:false},"08:00:00"); await type(readonly,"10:00:00"); assert.equal(readonly.model.value,"08:00:00"); assert.equal(readonly.input().readOnly,true);
});
it("清空后面板保持空值，禁用项不可点击，全禁用不确认", async () => {
  const p=mount({disabledHours:()=>[11]},"10:20:30"); await open(p);
  p.container.querySelector('[aria-label="时"] [data-value="11"]').click(); await nextTick(); assert.equal(p.model.value,"10:20:30");
  p.container.querySelector('[data-clear]').click(); await nextTick(); assert.equal(p.model.value,""); assert.equal(p.events.clear.length,1);
  const blocked=mount({disabledHours:()=>Array.from({length:24},(_,i)=>i)}); await open(blocked);
  button(blocked,"此刻").click(); await nextTick(); assert.equal(blocked.model.value,""); assert.equal(blocked.events.confirm.length,0); assert.equal(button(blocked,"确定").disabled,true);
});
it("键盘逐秒切换跳过禁用项，此刻及毫秒格式可确认", async () => {
  const p=mount({disabledSeconds:()=>[31]},"10:20:30"); await open(p);
  p.container.querySelector('[aria-label="秒"]').dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true})); await nextTick(); assert.equal(p.model.value,"10:20:32");
  button(p,"此刻").click(); await nextTick(); assert.equal(p.events.confirm.length,1); assert.notEqual(p.model.value.slice(-2),"31");
  const precise=mount({format:"HH:mm:ss.SSS"},"10:20:30.123"); await open(precise); assert.equal(precise.container.querySelectorAll('[role="listbox"]').length,4); button(precise,"确定").click(); await nextTick(); assert.equal(precise.model.value,"10:20:30.123");
});
it("范围保持数组绑定与起止顺序", async () => {
  const p=mount({isRange:true},["09:00:00","18:00:00"]);
  p.container.firstElementChild.firstElementChild.click(); await nextTick();
  assert.equal(p.container.querySelectorAll('[role="listbox"]').length,6);
  p.container.querySelector('[aria-label="开始时"] [data-value="20"]').click(); await nextTick();
  assert.deepEqual([...p.model.value],["18:00:00","20:00:00"]);
});


it("基础面板和底部同级，默认按钮先此刻后确定", async () => {
  const p = mount(); await open(p);
  const panel = p.container.querySelector('[role="dialog"]');
  assert.equal(panel.children.length, 2);
  const [body, footer] = panel.children;
  assert.ok(body.classList.contains('px-1'));
  assert.ok(body.classList.contains('py-2'));
  assert.equal(body.querySelectorAll('[role="listbox"]').length, 3);
  assert.deepEqual([...footer.querySelectorAll('button')].map(el => el.textContent.trim()), ['此刻', '确定']);
});


it("默认底部等宽且此刻为文本、确定为实体按钮", async () => {
  const p = mount(); await open(p);
  const now = button(p, '此刻'); const confirm = button(p, '确定');
  assert.equal(now.getAttribute('variant'), 'text');
  assert.equal(confirm.getAttribute('variant'), 'filled');
  for (const el of [now, confirm]) {
    assert.ok(el.classList.contains('w-full'));
    assert.ok(el.parentElement.classList.contains('grid-cols-2'));
    assert.ok(el.classList.contains('justify-center'));
  }
});

it("关闭时机默认点击并可透传按下模式", async () => {
  for (const closeOn of [undefined, 'click', 'mousedown']) {
    const p = mount(closeOn ? { closeOn } : {}); await open(p);
    assert.equal(p.container.firstElementChild.getAttribute('data-close-on'), closeOn ?? 'click');
  }
});

it("自定义底部替换默认按钮并提供清空、此刻、确定方法", async () => {
  const value = ref('09:30:00'); const confirms = [];
  const container = document.createElement('div'); document.body.append(container);
  const app = createApp({ setup: () => () => h(Picker, {
    modelValue: value.value, 'onUpdate:modelValue': v => { value.value = v; },
    onConfirm: v => confirms.push(v),
  }, { footer: ({ clear, now, confirm }) => h('div', { 'data-custom-footer': '', class: 'w-full' }, [
    h('button', { onClick: clear }, '自定义清空'),
    h('button', { onClick: now }, '自定义此刻'),
    h('button', { onClick: confirm }, '自定义确定'),
  ]) }) });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  const p = { container, input: () => container.querySelector('input') }; await open(p);
  assert.ok(container.querySelector('[data-custom-footer]'));
  assert.equal(button(p, '确定'), undefined);
  button(p, '自定义清空').click(); await nextTick(); assert.equal(value.value, '');
  button(p, '自定义此刻').click(); await nextTick(); assert.match(value.value, /^\d{2}:\d{2}:\d{2}$/);
  await open(p); button(p, '自定义确定').click(); await nextTick();
  assert.equal(confirms.length, 2); assert.equal(container.querySelector('[role="dialog"]'), null);
});


it("隐藏底部不保留容器，选取时间仍更新且 Escape 可关闭", async () => {
  const p = mount({ showFooter: false }, "09:30:00"); await open(p);
  const panel = p.container.querySelector('[role="dialog"]');
  assert.equal(panel.children.length, 1);
  assert.equal(button(p, "此刻"), undefined);
  assert.equal(button(p, "确定"), undefined);
  panel.querySelector('[aria-label="时"] [data-value="10"]').click(); await nextTick();
  assert.equal(p.model.value, "10:30:00");
  assert.equal(p.events.change.length, 1);
  p.input().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await nextTick();
  assert.equal(p.container.querySelector('[role="dialog"]'), null);
});

it("底部开关支持动态切换并控制自定义插槽", async () => {
  const showFooter = ref(false);
  const container = document.createElement("div"); document.body.append(container);
  const app = createApp({ setup: () => () => h(Picker, { showFooter: showFooter.value }, {
    footer: () => h("button", { "data-custom-footer": "" }, "自定义操作"),
  }) });
  app.mount(container); mounted.push(() => { app.unmount(); container.remove(); });
  const p = { container, input: () => container.querySelector("input") }; await open(p);
  assert.equal(container.querySelector('[data-custom-footer]'), null);
  assert.equal(container.querySelector('[role="dialog"]').children.length, 1);
  showFooter.value = true; await nextTick();
  assert.ok(container.querySelector('[data-custom-footer]'));
  showFooter.value = false; await nextTick();
  assert.equal(container.querySelector('[data-custom-footer]'), null);
  assert.equal(container.querySelector('[role="dialog"]').children.length, 1);
});
