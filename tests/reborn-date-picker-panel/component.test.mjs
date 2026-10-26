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
    entryPoints: [path.resolve('app/components/reborn/ui/reborn-date-picker-panel', filename)], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: '测试编译Vue', setup(builder) {
      builder.onResolve({ filter: /^[@~]\// }, args => ({ path: path.resolve('app', `${args.path.slice(2)}.ts`) }));
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
const Panel=await compileComponent('RebornDatePickerPanel.vue');
const mounted=[];afterEach(()=>mounted.splice(0).forEach(fn=>fn()));
function mount(initial) {
 const props=shallowRef(initial);const root=document.createElement('div');document.body.append(root);const updates=[];
 const app=createApp({setup:()=>()=>h(Panel,{...props.value,'onUpdate:modelValue':value=>updates.push(value)}, {default:cell=>h('span',{'data-day':`${cell.date.getFullYear()}-${String(cell.date.getMonth()+1).padStart(2,'0')}-${String(cell.date.getDate()).padStart(2,'0')}`,'data-selected':String(cell.selected),'data-range':String(cell.inRange)},cell.text)})});
 app.component('Icon',props=>h('i',{'data-icon':props.name}));app.mount(root);mounted.push(()=>{app.unmount();root.remove()});return {props,root,updates};
}
const tick=async()=>{await nextTick();await nextTick()};
function day(p,date) {return p.root.querySelector(`[data-day="${date}"]`)}
it('范围模型清空或只剩起点时清掉旧终点',async()=>{
 const p=mount({type:'daterange',singlePanel:true,valueFormat:'YYYY-MM-DD',modelValue:['2026-01-05','2026-01-10']});await tick();
 for(const value of [[],['',''],['2026-01-05'],['invalid']]) {
 p.props.value={...p.props.value,modelValue:value};await tick();assert.equal(day(p,'2026-01-10').dataset.selected,'false');assert.equal(day(p,'2026-01-08').dataset.range,'false');
 }
});
it('不绑定模型时多选连续累积',async()=>{
 const p=mount({type:'dates',defaultValue:'2026-01-01',valueFormat:'YYYY-MM-DD'});await tick();day(p,'2026-01-05').click();await tick();day(p,'2026-01-06').click();await tick();
 assert.deepEqual(p.updates.at(-1),['2026-01-05','2026-01-06']);
});
it('范围 hover 不重新执行禁用日期规则',async()=>{
 let checks=0;const p=mount({type:'daterange',singlePanel:true,defaultValue:'2026-01-01',disabledMethod:()=>{checks++;return false}});await tick();day(p,'2026-01-05').click();await tick();checks=0;
 day(p,'2026-01-08').parentElement.dispatchEvent(new window.MouseEvent('mouseenter'));await tick();assert.equal(checks,0);
});

it('年、月、季度选择与四种头部导航保留原交互',async()=>{
 for (const [type,text] of [['year','2027'],['month','3'],['quarter','2']]) {
  const p=mount({type,defaultValue:'2026-01-01',valueFormat:'YYYY-MM-DD'});await tick();
  const cells=[...p.root.querySelectorAll('[data-day]')];
  const choice=cells.find(cell=>cell.textContent===text);
  assert.ok(choice,`${type}存在目标单元格 ${text}`);choice.parentElement.click();await tick();assert.ok(p.updates.length,`${type}选择可写模型`);
 }
 for(const type of ['date','year','month','quarter']) {
  const changes=[];const p=mount({type,defaultValue:'2026-01-01',onPanelChange:(...args)=>changes.push(args)});await tick();
  const next=p.root.querySelector('[data-icon="lucide:chevron-right"]');assert.ok(next);next.parentElement.click();await tick();assert.equal(changes.length,1,`${type}翻页只派发一次`);
 }
});
it('联动双面板跨年翻页，取消联动只更新点击的一侧',async()=>{
 for(const unlinkPanels of [false,true]) {
  const changes=[];const p=mount({type:'daterange',defaultValue:['2026-11-01','2027-01-01'],unlinkPanels,onPanelChange:(...args)=>changes.push(args)});await tick();
  const next=[...p.root.querySelectorAll('[data-icon="lucide:chevron-right"]')].at(-1);next.parentElement.click();await tick();
  const [left,right]=changes.at(-1)[0];assert.equal(right.getFullYear(),2027);assert.equal(right.getMonth(),1);
  assert.equal(left.getMonth(),unlinkPanels?10:0);
 }
});

it('日期时间范围同步两端时分秒，清空后不沿用旧时间',async()=>{
 const p=mount({type:'datetimerange',singlePanel:true,valueFormat:'YYYY-MM-DD HH:mm:ss',modelValue:['2026-01-05 13:14:15','2026-01-10 16:17:18']});await tick();
 assert.ok(p.root.textContent.includes('13:14:15'));assert.ok(p.root.textContent.includes('16:17:18'));
 p.props.value={...p.props.value,modelValue:[]};await tick();day(p,'2026-01-06').click();await tick();assert.ok(p.root.textContent.includes('00:00:00'));assert.equal(p.root.textContent.includes('13:14:15'),false);
});

it('showToday 与年 / 月 / 季度范围悬停时不重新执行禁用规则',async()=>{
 for(const [type,text] of [['daterange','8'],['monthrange','5'],['quarterrange','3'],['yearrange','2028']]) {
  let checks=0;const p=mount({type,showToday:true,defaultValue:'2026-01-01',disabledMethod:()=>{checks++;return false}});await tick();
  const first=[...p.root.querySelectorAll('[data-day]')].find(cell=>cell.textContent===(type==='yearrange'?'2027':'1'));
  first.parentElement.click();await tick();checks=0;
  const target=[...p.root.querySelectorAll('[data-day]')].find(cell=>cell.textContent===text);
  target.parentElement.dispatchEvent(new window.MouseEvent('mouseenter'));await tick();
  assert.equal(checks,0,`${type} 悬停调用了 ${checks} 次 disabledMethod`);
  assert.equal(target.dataset.range,'true',`${type} 悬停预览仍生效`);
 }
});

it('服务端首帧：未定位时隐藏内容区（固定基准月不可见），有 defaultValue 或绑定值时直接显示对应月份',async()=>{
 const { createSSRApp } = await import(pathToFileURL(require.resolve('vue')).href);
 const { renderToString } = await import(pathToFileURL(require.resolve('vue/server-renderer')).href);
 const render=props=>{const app=createSSRApp({render:()=>h(Panel,props)});app.component('Icon',()=>null);return renderToString(app);};
 const hidden=await render({type:'date'});
 assert.match(hidden,/visibility:\s*hidden/);
 const located=await render({type:'date',defaultValue:'2026-03-15'});
 assert.doesNotMatch(located,/visibility:\s*hidden/);
 assert.match(located,/2026年/);assert.match(located,/3月/);
 const valued=await render({type:'month',modelValue:'2025-07-01',valueFormat:'YYYY-MM-DD'});
 assert.doesNotMatch(valued,/visibility:\s*hidden/);assert.match(valued,/2025年/);
});

it('挂载后显示内容区并定位到本月',async()=>{
 const p=mount({type:'date'});await tick();
 const content=[...p.root.querySelectorAll('div')].find(div=>div.style.visibility==='hidden');
 assert.equal(content,undefined);
 const now=new Date();assert.ok(p.root.textContent.includes(`${now.getFullYear()}年`));
});
