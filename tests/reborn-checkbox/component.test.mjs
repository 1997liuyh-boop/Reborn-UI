/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { runInThisContext } from 'node:vm';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><head><style>.reborn-descriptions { padding: 0; border: 0 solid transparent; }</style></head><body><div id="teleports"></div></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
HTMLElement.prototype.getBoundingClientRect = () => ({ width: 900, height: 48, top: 0, left: 0, right: 900, bottom: 48 });
const observers = new Set();
class TestResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe(target) { this.target = target; observers.add(this); }
  disconnect() { observers.delete(this); }
}
globalThis.ResizeObserver = dom.window.ResizeObserver = TestResizeObserver;
const { createApp, h, shallowRef, nextTick } = await import(pathToFileURL(require.resolve('vue')).href);

async function compileComponent(filename) {
  const result = await build({
    entryPoints: [path.resolve('app/components/reborn/ui/reborn-checkbox', filename)], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: '测试编译Vue', setup(builder) {
      builder.onResolve({ filter: /^~\// }, args => ({ path: path.resolve('app', `${args.path.slice(2)}.ts`) }));
      builder.onLoad({ filter: /\.vue$/ }, args => {
        const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
        assert.deepEqual(errors, []);
        return { contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    } }],
  });
  const module = { exports: {} };
  runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, require);
  return module.exports.default;
}
const Checkbox = await compileComponent('RebornCheckbox.vue');
const Group = await compileComponent('RebornCheckboxGroup.vue');
const mounted=[];
afterEach(()=>mounted.splice(0).forEach(fn=>fn()));
function mount(component, initial) {
 const props=shallowRef(initial);const root=document.createElement('div');document.body.append(root);
 const app=createApp({setup:()=>()=>h(component,{...props.value,'onUpdate:modelValue':value=>props.value={...props.value,modelValue:value}})});
 app.component('Icon',()=>null);app.mount(root);mounted.push(()=>{app.unmount();root.remove()});return {props,root};
}
async function click(p,index=0) { const input=p.root.querySelectorAll('input')[index];input.checked=!input.checked;input.dispatchEvent(new window.Event('change',{bubbles:true}));await nextTick(); }
it('受控 checkbox 显式 undefined 清空，不回落到旧交互值',async()=>{
 const p=mount(Checkbox,{modelValue:false});await click(p);assert.equal(p.root.querySelector('input').checked,true);
 p.props.value={...p.props.value,modelValue:undefined};await nextTick();assert.equal(p.root.querySelector('input').checked,false);
});
it('受控 group null 清空，随后从空数组重新选择',async()=>{
 const p=mount(Group,{modelValue:[],options:['A','B']});await click(p);p.props.value={...p.props.value,modelValue:null};await nextTick();
 assert.deepEqual([...p.root.querySelectorAll('input')].map(input=>input.checked),[false,false]);await click(p,1);assert.deepEqual(p.props.value.modelValue,['B']);
});
it('动态 attrs 与 style 更新落点，indeterminate 为 DOM 属性',async()=>{
 const p=mount(Checkbox,{'data-state':'old',style:'width: 99px',indeterminate:true});
 p.props.value={'data-label':'new',style:'width: 123px',indeterminate:false};await nextTick();
 assert.equal(p.root.querySelector('label').style.width,'123px');const input=p.root.querySelector('input');assert.equal(input.hasAttribute('data-state'),false);assert.equal(input.dataset.label,'new');assert.equal(input.indeterminate,false);
});

it('从非受控默认选中切到显式 undefined 时清空',async()=>{
 const p=mount(Checkbox,{defaultChecked:true});assert.equal(p.root.querySelector('input').checked,true);
 p.props.value={...p.props.value,modelValue:undefined};await nextTick();assert.equal(p.root.querySelector('input').checked,false);
});

it('只传 model-value 不接更新事件时严格受控：点击只派发 change，选中态与原生 input 都保持父值',async()=>{
 const changes=[];const root=document.createElement('div');document.body.append(root);
 const app=createApp({setup:()=>()=>[h(Checkbox,{modelValue:false,onChange:value=>changes.push(value)}),h(Group,{modelValue:['A'],options:['A','B']})]});
 app.component('Icon',()=>null);app.mount(root);mounted.push(()=>{app.unmount();root.remove()});
 const inputs=()=>[...root.querySelectorAll('input')];
 for (const index of [0,2]) {
  const input=inputs()[index];input.checked=!input.checked;input.dispatchEvent(new window.Event('change',{bubbles:true}));
  await nextTick();await nextTick();
 }
 assert.deepEqual(changes,[true]);
 assert.deepEqual(inputs().map(input=>input.checked),[false,true,false],'父级未回写，DOM 回到父值');
});
