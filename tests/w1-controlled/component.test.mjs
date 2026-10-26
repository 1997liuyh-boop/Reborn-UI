/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { it } from 'node:test';
import { runInThisContext } from 'node:vm';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { createApp, h, shallowRef, nextTick } = require('vue');
async function compile(relative) {
  const filename = path.resolve('app/components/reborn/ui', relative);
  const result = await build({ entryPoints: [filename], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', plugins: [{name:'测试编译Vue',setup(builder) {
    builder.onResolve({filter:/^[@~]\//},args=>({path:path.resolve('app',`${args.path.slice(2)}.ts`)}));
    builder.onLoad({filter:/\.vue$/},args=>{const {descriptor}=parse(readFileSync(args.path,'utf8'),{filename:args.path});return {contents:compileScript(descriptor,{id:args.path.replaceAll('\\','/'),inlineTemplate:true,fs:{fileExists:existsSync,readFile:file=>readFileSync(file,'utf8')}}).content,loader:'ts',resolveDir:path.dirname(args.path)};});
  }}] });
  const module = { exports: {} };
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0].text}\n})`)(module, module.exports, require);
  return module.exports.default;
}
const fixtures = [
  { component: await compile('input/IInput.vue'), name: 'IInput', key: 'modelValue', initial: '初值', props: { defaultValue: '默认' }, expected: '', read: root => root.querySelector('input').value, interact(root) { const input=root.querySelector('input');input.value='用户输入';input.dispatchEvent(new window.Event('input',{bubbles:true})); } },
  { component: await compile('balance-slider/BalanceSlider.vue'), name: 'BalanceSlider', key: 'modelValue', initial: 25, props: { initialValue: 40 }, expected: '40', read: root => root.querySelector('input').value, interact(root) { const input=root.querySelector('input');input.value='75';input.dispatchEvent(new window.Event('input',{bubbles:true})); } },
  { component: await compile('compare/Compare.vue'), name: 'Compare', key: 'percentage', initial: 25, props: { initialSliderPercentage: 40 }, expected: '40%', read: root => root.querySelector('.z-30').style.left, interact(root) { const slider=root.firstElementChild;slider.getBoundingClientRect=()=>({left:0,width:100});slider.dispatchEvent(new window.MouseEvent('mouseenter'));slider.dispatchEvent(new window.MouseEvent('mousemove',{clientX:75})); } },
];
for (const fixture of fixtures) {
  it(`${fixture.name} 真实挂载：用户交互后显式 undefined/null 不回显旧副本`, async () => {
    const value=shallowRef(fixture.initial);const root=document.createElement('div');document.body.append(root);
    const app=createApp({render:()=>h(fixture.component,{...fixture.props,[fixture.key]:value.value,[`onUpdate:${fixture.key}`]:next=>value.value=next})});
    try {
      app.component('Icon',()=>null);app.component('StarField',()=>null);app.mount(root);
      for (const empty of [undefined,null]) {
        fixture.interact(root);await new Promise(resolve=>setTimeout(resolve,5));await nextTick();
        assert.notEqual(value.value,fixture.initial);
        value.value=empty;await nextTick();await nextTick();assert.equal(fixture.read(root),fixture.expected);
      }
    } finally {app.unmount();root.remove();}
  });
  it(`${fixture.name} 未绑定模型时保留非受控初值与交互`, async () => {
    const root=document.createElement('div');document.body.append(root);const app=createApp({render:()=>h(fixture.component,fixture.props)});
    try { app.component('Icon',()=>null);app.component('StarField',()=>null);app.mount(root);assert.equal(fixture.read(root),fixture.name==='IInput'?'默认':fixture.expected);fixture.interact(root);await new Promise(resolve=>setTimeout(resolve,5));await nextTick();assert.equal(fixture.read(root),fixture.name==='IInput'?'用户输入':fixture.name==='Compare'?'75%':'75'); }
    finally {app.unmount();root.remove();}
  });
  it(`${fixture.name} 从非受控交互切到显式空模型立即复位`,async()=>{
    const props=shallowRef({...fixture.props});const root=document.createElement('div');document.body.append(root);
    const app=createApp({render:()=>h(fixture.component,props.value)});app.component('Icon',()=>null);app.component('StarField',()=>null);
    try {app.mount(root);fixture.interact(root);await new Promise(resolve=>setTimeout(resolve,5));await nextTick();props.value={...props.value,[fixture.key]:undefined};await nextTick();assert.equal(fixture.read(root),fixture.expected);}
    finally {app.unmount();root.remove();}
  });
}

const Alert=await compile('reborn-alert/RebornAlert.vue');
const Badge=await compile('reborn-badge/RebornBadge.vue');
const Collapse=await compile('reborn-collapse/RebornCollapse.vue');
const {renderToString}=require('@vue/server-renderer');const {createSSRApp}=require('vue');
for (const [name,Component] of [['Alert',Alert],['Badge',Badge]]) {
  it(`${name} 布尔模型缺省可见，显式 undefined/null 隐藏且不借用默认值`,async()=>{
    const render=async props=>{const app=createSSRApp({render:()=>h(Component,props,{default:()=>h('span','可见内容')})});app.component('Icon',()=>null);return renderToString(app);};
    assert.ok((await render({})).includes('可见内容'));
    for(const show of [undefined,null,false]) assert.equal((await render({show})).includes('可见内容'),false);
    assert.ok((await render({show:true})).includes('可见内容'));
  });
}
it('Badge 非受控选中可往返，受控 checked 清空后下一次点击仍选中',async()=>{
  const props=shallowRef({check:true,label:'选中测试'});const changes=[];const root=document.createElement('div');document.body.append(root);
  const app=createApp({render:()=>h(Badge,{...props.value,onChange:value=>changes.push(value)})});app.component('Icon',()=>null);
  try {app.mount(root);root.querySelector('span span').click();await nextTick();root.querySelector('span span').click();await nextTick();assert.deepEqual(changes,[true,false]);
    for(const checked of [true,undefined,null]) {props.value={...props.value,checked};await nextTick();root.querySelector('span span').click();await nextTick();}
    assert.deepEqual(changes,[true,false,false,true,true]);
  } finally {app.unmount();root.remove();}
});
it('Collapse 非受控默认收起并可切换，受控空值按收起渲染',async()=>{
  const props=shallowRef({});const root=document.createElement('div');document.body.append(root);
  const app=createApp({render:()=>h(Collapse,props.value,{default:({open})=>h('button',String(open)),content:()=>h('p','内容')})});
  try {app.mount(root);assert.equal(root.querySelector('button').textContent,'false');root.querySelector('button').click();await nextTick();assert.equal(root.querySelector('button').textContent,'true');
    for(const modelValue of [undefined,null]) {props.value={modelValue};await nextTick();assert.equal(root.querySelector('button').textContent,'false');}
  } finally {app.unmount();root.remove();}
});

// 非受控写过的值不能成为受控输出的去重基准；父级必须实际收到并回写模型事件。
const transitionFixtures = [
  ...fixtures.map(fixture => ({...fixture, submitted:fixture.name==='IInput'?'用户输入':75,
    displayed:fixture.name==='IInput'?'用户输入':fixture.name==='Compare'?'75%':'75'})),
  {component:Collapse,name:'Collapse',key:'modelValue',props:{},submitted:true,expected:'false',displayed:'true',
    read:root=>root.querySelector('button').textContent,interact:root=>root.querySelector('button').click(),
    slots:{default:({open})=>h('button',String(open)),content:()=>h('p','内容')}},
  {component:Badge,name:'Badge.checked',key:'checked',props:{check:true,label:'徽标',ui:{base:'fixture-badge'}},submitted:true,expected:false,displayed:true,
    read:root=>!root.querySelector('.fixture-badge').classList.contains('bg-gray-2'),interact:root=>root.querySelector('.fixture-badge').click()},
];
async function settleModel() {await new Promise(resolve=>setTimeout(resolve,5));await nextTick();await nextTick();}
for(const fixture of transitionFixtures) {
  for(const empty of [undefined,null]) for(const accept of [true,false]) {
    it(`${fixture.name} 非受控→${String(empty)}→相同值：父级${accept?'回写':'拒收'}，update 载荷不丢失`,async()=>{
      const controlled=shallowRef(false);const value=shallowRef(empty);const revision=shallowRef(0);const updates=[];
      const root=document.createElement('div');document.body.append(root);
      const app=createApp({render:()=>h(fixture.component,{...fixture.props,'data-revision':revision.value,
        ...(controlled.value?{[fixture.key]:value.value,[`onUpdate:${fixture.key}`]:next=>{updates.push(next);if(accept)value.value=next;revision.value++;}}:{})},fixture.slots)});
      app.component('Icon',()=>null);app.component('StarField',()=>null);
      try {
        app.mount(root);fixture.interact(root);await settleModel();assert.equal(fixture.read(root),fixture.displayed);
        controlled.value=true;await settleModel();assert.equal(fixture.read(root),fixture.expected);assert.deepEqual(updates,[]);
        for(let attempt=0;attempt<2;attempt++) {
          if(accept&&attempt===1) {value.value=empty;await settleModel();assert.equal(fixture.read(root),fixture.expected);}
          fixture.interact(root);await settleModel();
          assert.equal(updates.length,attempt+1);assert.equal(updates[attempt],fixture.submitted);
          assert.equal(value.value,accept?fixture.submitted:empty);assert.equal(fixture.read(root),accept?fixture.displayed:fixture.expected);
        }
      } finally {app.unmount();root.remove();}
    });
  }
}

// show 的关闭也走真实父模型；拒收关闭后按钮保持可操作，不能退回本地隐藏态。
for(const [name,Component,slotName] of [['Alert.show',Alert,'close-element'],['Badge.show',Badge,'close']]) {
  for(const empty of [undefined,null]) for(const accept of [true,false]) {
    it(`${name} 缺省关闭→${String(empty)}→父级重开：${accept?'接收':'拒收'}两次关闭事件`,async()=>{
      const controlled=shallowRef(false);const value=shallowRef(empty);const revision=shallowRef(0);const updates=[];
      const root=document.createElement('div');document.body.append(root);
      const slots={default:()=>h('span',{class:'fixture-content'},'可见内容'),[slotName]:()=>h('button',{class:'fixture-close'},'关闭')};
      const app=createApp({render:()=>h(Component,{closable:true,'data-revision':revision.value,
        ...(controlled.value?{show:value.value,'onUpdate:show':next=>{updates.push(next);if(accept)value.value=next;revision.value++;}}:{})},slots)});
      app.component('Icon',()=>null);
      const settleVisibility=async()=>{await settleModel();await new Promise(resolve=>setTimeout(resolve,230));};
      try {
        app.mount(root);assert.ok(root.querySelector('.fixture-content'));root.querySelector('.fixture-close').click();await settleVisibility();assert.equal(root.querySelector('.fixture-content'),null);
        controlled.value=true;await settleVisibility();assert.equal(root.querySelector('.fixture-content'),null);assert.deepEqual(updates,[]);
        for(let attempt=0;attempt<2;attempt++) {
          value.value=true;await settleVisibility();root.querySelector('.fixture-close').click();await settleVisibility();
          assert.deepEqual(updates,new Array(attempt+1).fill(false));assert.equal(value.value,!accept);
          assert.equal(!!root.querySelector('.fixture-content'),!accept);
        }
      } finally {app.unmount();root.remove();}
    });
  }
}
