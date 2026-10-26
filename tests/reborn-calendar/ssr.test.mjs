/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { it } from 'node:test';
import { runInThisContext } from 'node:vm';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><body></body>', {url:'http://localhost'});
for (const key of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver']) Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]});
globalThis.requestAnimationFrame=callback=>setTimeout(callback,0);
globalThis.cancelAnimationFrame=clearTimeout;
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
const { compileScript, parse } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { build } = require('esbuild');
const { createSSRApp, h, nextTick } = require('vue');
const result=await build({entryPoints:[path.resolve('app/components/reborn/ui/reborn-calendar/RebornCalendar.vue')],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'~':path.resolve('app'),'@':path.resolve('app')},plugins:[{name:'日历隔离编译',setup(builder){
 builder.onResolve({filter:/Reborn(Button|RadioGroup|Select)\.vue$/},args=>({path:args.path,namespace:'toolbar'}));
 builder.onLoad({filter:/.*/,namespace:'toolbar'},()=>({contents:`import {h} from 'vue';export default {setup:()=>()=>h('span')}`,loader:'js',resolveDir:process.cwd()}));
 builder.onLoad({filter:/\.vue$/},args=>{const {descriptor}=parse(readFileSync(args.path,'utf8'),{filename:args.path});return {contents:compileScript(descriptor,{id:args.path,inlineTemplate:true,fs:{fileExists:existsSync,readFile:file=>readFileSync(file,'utf8')}}).content,loader:'ts',resolveDir:path.dirname(args.path)}});
}}]});
const compiled={exports:{}};runInThisContext(`(function(module,exports,require){${result.outputFiles[0].text}\n})`)(compiled,compiled.exports,require);
const Calendar=compiled.exports.default;
it('普通 Vue 的日历跨时区和午夜水合保留服务器首帧，再刷新本地今天',async()=>{
 const RealDate=Date;const originalZone=process.env.TZ;let now=RealDate.parse('2026-10-31T23:59:59Z');
 globalThis.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
 const warnings=[];const originalWarn=console.warn;const originalError=console.error;
 const makeApp=id=>{const app=createSSRApp({render:()=>h(Calendar,id?{id}:undefined)});app.component('Icon',()=>null);app.config.warnHandler=message=>warnings.push(message);return app;};
 try {
  for(const id of [undefined,'business-calendar']) {
   process.env.TZ='UTC';now=RealDate.parse('2026-10-31T23:59:59Z');
   delete globalThis.document;const html=await renderToString(makeApp(id));globalThis.document=dom.window.document;
   assert.match(html,/data-calendar-zone="UTC"/);assert.match(html,/data-calendar-today="2026-10-31"/);
   const container=document.createElement('div');container.innerHTML=html;document.body.append(container);
   const firstId=container.firstElementChild.id;assert.equal(firstId,id??'v-0');
   process.env.TZ='Asia/Shanghai';now=RealDate.parse('2026-11-01T00:00:01Z');warnings.length=0;
   console.warn=(...args)=>warnings.push(args.join(' '));console.error=(...args)=>warnings.push(args.join(' '));
   const app=makeApp(id);try {app.mount(container);await nextTick();await nextTick();
   assert.equal(warnings.filter(message=>/hydration|mismatch/i.test(message)).length,0,warnings.join('\n'));
   assert.equal(container.firstElementChild.id,firstId);assert.equal(container.querySelector('[aria-current="date"]').getAttribute('aria-label'),'2026-11-01');
   } finally {app.unmount();container.remove();}
  }
 }finally{globalThis.document=dom.window.document;globalThis.Date=RealDate;process.env.TZ=originalZone;console.warn=originalWarn;console.error=originalError;}
});
