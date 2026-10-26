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
    entryPoints: [path.resolve('app/components/reborn/ui', filename)], bundle: true, write: false,
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

const Alert=await compileComponent('reborn-alert/RebornAlert.vue');
const Meteors=await compileComponent('meteors/Meteors.vue');
const Affix=await compileComponent('reborn-affix/RebornAffix.vue');
const Tabs=await compileComponent('morphing-tabs/MorphingTabs.vue');
const MorphingText=await compileComponent('morphing-text/MorphingText.vue');
const {renderToString}=require('@vue/server-renderer');
const {createSSRApp}=require('vue');
const mounted=[];afterEach(()=>mounted.splice(0).forEach(fn=>fn()));
function mount(Component,initial) {
 const props=shallowRef(initial);const root=document.createElement('div');document.body.append(root);
 const app=createApp({setup:()=>()=>h(Component,props.value)});app.component('Icon',()=>null);app.mount(root);
 const close=()=>{app.unmount();root.remove()};mounted.push(close);return {props,root};
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
it('Alert 关闭后停止切换，重新打开后恢复；卸载后不再派发',async()=>{
 const changes=[];const p=mount(Alert,{messages:['甲','乙'],interval:12,onChange:value=>changes.push(value)});
 await delay(35);assert.ok(changes.length>0);p.props.value={...p.props.value,show:false};await nextTick();const count=changes.length;
 await delay(35);assert.equal(changes.length,count);p.props.value={...p.props.value,show:true};await nextTick();await delay(20);assert.ok(changes.length>count);
 mounted.splice(0).forEach(fn=>fn());const end=changes.length;await delay(25);assert.equal(changes.length,end);
});
it('Meteors 的属性有单根落点，普通更新不重随机，count 变化更新颗数',async()=>{
 const p=mount(Meteors,{count:2,'data-state':'first',style:'opacity:0.5'});await nextTick();const styles=[...p.root.querySelectorAll('span span')].map(el=>el.style.cssText);
 p.props.value={...p.props.value,'data-state':'second'};await nextTick();assert.equal(p.root.firstElementChild.dataset.state,'second');assert.equal(p.root.firstElementChild.style.opacity,'0.5');
 // 根节点必须是生成盒子的定位层（不是 display: contents），透传的非继承样式才有视觉效果
 const layer=p.root.firstElementChild.classList;assert.equal(layer.contains('contents'),false);assert.ok(layer.contains('absolute')&&layer.contains('inset-0')&&layer.contains('pointer-events-none'));
 assert.deepEqual([...p.root.querySelectorAll('span span')].map(el=>el.style.cssText),styles);p.props.value={...p.props.value,count:3};await nextTick();assert.equal(p.root.querySelectorAll('span span').length,3);
});
it('Affix SSR 用原生定位尺寸，不输出 Infinity 或 NaN',async()=>{
 const html=await renderToString(createSSRApp({render:()=>h(Affix,{right:24,bottom:16,size:40})}));assert.doesNotMatch(html,/Infinity|NaN/);assert.match(html,/right:24px/);assert.match(html,/bottom:16px/);
});
it('多个 Morphing 实例生成独立滤镜 id',async()=>{
 const html=await renderToString(createSSRApp({render:()=>h('div',[h(Tabs,{tabs:['甲','乙'],activeTab:'甲'}),h(Tabs,{tabs:['丙','丁'],activeTab:'丙'}),h(MorphingText,{texts:['甲','乙']}),h(MorphingText,{texts:['丙','丁']})])}));
 const ids=[...html.matchAll(/<filter id="([^"]+)"/g)].map(match=>match[1]);assert.equal(ids.length,4);assert.equal(new Set(ids).size,4);
 const allIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(allIds).size,allIds.length);
});

// Affix 窗口变化：未拖动过按 props 重新锚定；拖动过保留位置，开启吸附时贴回原侧边缘
// scrollbar：页面竖向滚动条宽度，innerWidth 含滚动条，documentElement.clientWidth 不含（与真实浏览器一致）
function setWindowSize(width,height,scrollbar=0) {
 Object.defineProperty(window,'innerWidth',{configurable:true,value:width});Object.defineProperty(window,'innerHeight',{configurable:true,value:height});
 Object.defineProperty(document.documentElement,'clientWidth',{configurable:true,value:width-scrollbar});Object.defineProperty(document.documentElement,'clientHeight',{configurable:true,value:height});
 window.dispatchEvent(new window.Event('resize'));
}
function pointer(el,type,x,y) {el.dispatchEvent(new window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y}));}
async function drag(el,from,to) {
 pointer(el,'pointerdown',from[0],from[1]);pointer(el,'pointermove',to[0],to[1]);pointer(el,'pointerup',to[0],to[1]);await nextTick();await nextTick();
}
it('Affix 未拖动时窗口变化按 right / top 重新锚定，点击抖动不算拖动',async()=>{
 HTMLElement.prototype.setPointerCapture=()=>{};HTMLElement.prototype.releasePointerCapture=()=>{};
 setWindowSize(1200,800);const p=mount(Affix,{right:20,top:30,size:40});await nextTick();const el=p.root.firstElementChild;
 assert.equal(el.style.left,'1140px');assert.equal(el.style.bottom,'730px');
 setWindowSize(1600,900);await nextTick();assert.equal(el.style.left,'1540px');assert.equal(el.style.bottom,'830px');
 // 2px 抖动的点击：松手吸附到右缘留 gap，但仍按未拖动处理
 await drag(el,[1550,50],[1552,50]);assert.equal(el.style.left,'1550px');
 setWindowSize(1000,900);await nextTick();assert.equal(el.style.left,'940px');
});
it('Affix 拖动过后窗口变化保留位置：关闭吸附只夹边，开启吸附贴回原侧边缘',async()=>{
 HTMLElement.prototype.setPointerCapture=()=>{};HTMLElement.prototype.releasePointerCapture=()=>{};
 setWindowSize(1200,800);const free=mount(Affix,{right:20,bottom:16,size:40,noSnapping:true});await nextTick();const freeEl=free.root.firstElementChild;
 await drag(freeEl,[1160,700],[460,700]);assert.equal(freeEl.style.left,'440px');
 setWindowSize(1600,800);await nextTick();assert.equal(freeEl.style.left,'440px');
 setWindowSize(400,800);await nextTick();assert.equal(freeEl.style.left,'360px');
 setWindowSize(1200,800);const snap=mount(Affix,{left:20,bottom:16,size:40});await nextTick();const snapEl=snap.root.firstElementChild;
 await drag(snapEl,[40,700],[1100,700]);assert.equal(snapEl.style.left,'1150px');
 setWindowSize(1600,800);await nextTick();assert.equal(snapEl.style.left,'1550px');
 setWindowSize(1200,800);await nextTick();assert.equal(snapEl.style.left,'1150px');
 // 大幅变宽：按变化前的中线判断吸附侧，原先贴右缘的按钮（1150 < 新中线 1300）不能被判到左侧
 setWindowSize(2600,800);await nextTick();assert.equal(snapEl.style.left,'2550px');
 // 贴左缘的按钮窗口变化后仍贴左缘
 await drag(snapEl,[2560,700],[100,700]);assert.equal(snapEl.style.left,'10px');
 setWindowSize(500,800);await nextTick();assert.equal(snapEl.style.left,'10px');
});
it('Affix 有竖向滚动条时左右吸附留边一致，right 定位不压到滚动条上',async()=>{
 HTMLElement.prototype.setPointerCapture=()=>{};HTMLElement.prototype.releasePointerCapture=()=>{};
 // 视口 1440，滚动条 10px：可视区宽 1430，贴右缘时元素右边到可视区右缘应留 gap（10px），与左侧一致
 setWindowSize(1440,900,10);const p=mount(Affix,{left:20,bottom:100,size:48});await nextTick();const el=p.root.firstElementChild;
 await drag(el,[44,776],[1300,500]);assert.equal(el.style.left,'1372px','1430 - 48 - 10');
 await drag(el,[1396,500],[150,500]);assert.equal(el.style.left,'10px');
 const anchored=mount(Affix,{right:20,bottom:400,size:40});await nextTick();assert.equal(anchored.root.firstElementChild.style.left,'1370px','right=20 相对不含滚动条的可视区');
});
it('Affix 按元素中心判断吸附侧：中心过中线就贴右，左边缘还没过中线也一样',async()=>{
 HTMLElement.prototype.setPointerCapture=()=>{};HTMLElement.prototype.releasePointerCapture=()=>{};
 setWindowSize(1000,800);const p=mount(Affix,{left:20,bottom:100,size:100});await nextTick();const el=p.root.firstElementChild;
 // 拖到 left=460：左边缘 460 < 中线 500，但中心 510 已过中线
 await drag(el,[70,650],[510,650]);assert.equal(el.style.left,'890px','1000 - 100 - 10');
 // 拖到 left=440：中心 490 在中线左侧
 await drag(el,[940,650],[490,650]);assert.equal(el.style.left,'10px');
});
