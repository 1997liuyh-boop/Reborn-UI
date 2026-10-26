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
    entryPoints: [path.resolve('app/components/reborn/ui/reborn-cascader', filename)], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: '测试编译Vue', setup(builder) {
      builder.onResolve({filter:/RebornSelectTrigger\.vue$/},args=>({path:args.path,namespace:'trigger'}));
      builder.onLoad({filter:/.*/,namespace:'trigger'},()=>({contents:`import {defineComponent,h} from 'vue';export default defineComponent({props:['modelValue','ui'],setup:(props,{slots,expose})=>{expose({});return ()=>h('section',[slots.trigger?.(),slots.content?.()])}})`,loader:'js',resolveDir:process.cwd()}));
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
const Panel=await compileComponent('RebornCascaderPanel.vue');
const Cascader=await compileComponent('RebornCascader.vue');
const mounted=[];afterEach(()=>mounted.splice(0).forEach(fn=>fn()));
function mount(initial,Component=Panel) {
 const props=shallowRef(initial);const root=document.createElement('div');document.body.append(root);
 const app=createApp({setup:()=>()=>h(Component,{...props.value,'onUpdate:modelValue':value=>props.value={...props.value,modelValue:value}})});
 app.component('Icon',()=>null);app.mount(root);mounted.push(()=>{app.unmount();root.remove()});return {props,root};
}
it('懒加载支持冻结 options 且不修改业务数据',async()=>{
 const option=Object.freeze({label:'父项',value:'parent'});let done;const p=mount({options:Object.freeze([option]),loadMore:(_option,callback)=>{done=callback}});
 const row=[...p.root.querySelectorAll('[data-disabled]')].find(el=>el.textContent.includes('父项'));assert.ok(row);row.click();await nextTick();
 done([{label:'子项',value:'child',isLeaf:true}]);await nextTick();assert.ok(p.root.textContent.includes('子项'));assert.equal(option.children,undefined);
});
it('换 options 后旧懒加载回调不能写入新树',async()=>{
 let done;const old={label:'旧项',value:'parent'};const p=mount({options:[old],loadMore:(_option,callback)=>{done=callback}});
 [...p.root.querySelectorAll('[data-disabled]')].find(el=>el.textContent.includes('旧项')).click();await nextTick();
 p.props.value={...p.props.value,options:[{label:'新项',value:'parent'}]};await nextTick();done([{label:'过期子项',value:'child'}]);await nextTick();assert.equal(old.children,undefined);assert.equal(p.root.textContent.includes('过期子项'),false);
});

it('包装器动态 attrs 透传，搜索使用虚拟窗口并在滚动后变化',async()=>{
 const options=Array.from({length:100},(_,i)=>({label:`项目${i}`,value:i}));
 const p=mount({options,allowSearch:true,popupVisible:true,inputValue:'项目',virtualListProps:{height:30,buffer:1},ui:{searchList:'fixture-search'},'data-state':'old'},Cascader);await nextTick();
 assert.equal(p.root.firstElementChild.dataset.state,'old');p.props.value={...p.props.value,'data-state':'new'};await nextTick();assert.equal(p.root.firstElementChild.dataset.state,'new');
 const search=p.root.querySelector('.fixture-search');assert.ok(search);assert.ok(search.textContent.includes('项目0'));assert.equal(search.textContent.includes('项目99'),false);
 search.scrollTop=1800;search.dispatchEvent(new window.Event('scroll'));await nextTick();assert.equal(search.textContent.includes('项目0'),false);assert.ok(search.textContent.includes('项目60'));
});
it('关闭搜索浮层会取消待派发的关键词',async()=>{
 const searches=[];const p=mount({options:[],allowSearch:true,popupVisible:true,searchDelay:20,onSearch:value=>searches.push(value)},Cascader);await nextTick();
 const input=p.root.querySelector('input');input.value='旧关键词';input.dispatchEvent(new window.Event('input',{bubbles:true}));await nextTick();
 p.props.value={...p.props.value,popupVisible:false};await nextTick();await new Promise(resolve=>setTimeout(resolve,35));assert.deepEqual(searches,[]);
});

for (const height of [30, 50]) {
 it(`搜索结果变化同步真实滚动位置，虚拟行步长为 ${height}`,async()=>{
  const options=Array.from({length:100},(_,i)=>({label:`项目${i}`,value:i}));
  const p=mount({options,allowSearch:true,popupVisible:true,inputValue:'项目',virtualListProps:{height,buffer:1},ui:{searchList:'fixture-search'}},Cascader);
  await nextTick();const search=p.root.querySelector('.fixture-search');
  for (const update of [{inputValue:'项目1'},{inputValue:'项目',options:options.map(item=>({...item,label:`${item.label}更新`}))}]) {
   search.scrollTop=1800;search.dispatchEvent(new window.Event('scroll'));await nextTick();
   p.props.value={...p.props.value,...update};await nextTick();await nextTick();
   assert.equal(search.scrollTop,0);assert.equal(search.querySelector('.absolute').style.transform,'translateY(0px)');
   const rows=[...search.querySelectorAll('[data-disabled]')];assert.ok(rows.length>1);
   assert.equal(rows[0].style.height,`${height}px`);assert.equal(rows[0].style.boxSizing,'border-box');
   assert.equal(rows[0].parentElement.style.gap,'0px');
  }
 });
}

it('loadMore 与 fieldNames 写成内联表达式时，父级重渲染不清空已加载的下级',async()=>{
 const options=[{name:'父项',id:'parent'}];const calls=[];const model=shallowRef(undefined);const labelKey=shallowRef('name');
 const root=document.createElement('div');document.body.append(root);
 // 模板里的内联箭头函数与对象字面量：父级每次渲染都生成新引用
 const app=createApp({setup:()=>()=>h(Panel,{options,modelValue:model.value,'onUpdate:modelValue':value=>{model.value=value},
  fieldNames:{label:labelKey.value,value:'id'},loadMore:(option,done)=>calls.push(done)})});
 app.component('Icon',()=>null);app.mount(root);mounted.push(()=>{app.unmount();root.remove()});
 [...root.querySelectorAll('[data-disabled]')].find(el=>el.textContent.includes('父项')).click();await nextTick();
 assert.equal(calls.length,1);calls[0]([{name:'子项',id:'child',isLeaf:true}]);await nextTick();
 const child=[...root.querySelectorAll('[data-disabled]')].find(el=>el.textContent.includes('子项'));assert.ok(child);
 // 选中子项：v-model 回写让父级重渲染，loadMore / fieldNames 都换了引用
 child.click();await nextTick();await nextTick();
 assert.deepEqual(model.value,'child');
 assert.ok(root.textContent.includes('子项'),'换引用但取值不变，缓存应保留');
 assert.equal(calls.length,1,'不应重新发起懒加载');
 // fieldNames 的取值真的变了：缓存按新字段语义作废
 labelKey.value='label';await nextTick();await nextTick();
 assert.equal(root.textContent.includes('子项'),false);
});
