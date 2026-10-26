/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
const available = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

before(async () => {
  if (!available) return;
  const result = await build({
    stdin: { contents: `
      import {createApp,h,reactive,nextTick,shallowRef,inject,onBeforeUnmount} from 'vue';
      import Menu from '~/components/reborn/ui/reborn-menu/RebornMenu.vue';
      import SubMenu from '~/components/reborn/ui/reborn-menu/RebornSubMenu.vue';
      import MenuItem from '~/components/reborn/ui/reborn-menu/RebornMenuItem.vue';
      import MenuItems from '~/components/reborn/ui/reborn-menu/RebornMenuItems.vue';
      import MenuGroup from '~/components/reborn/ui/reborn-menu/RebornMenuItemGroup.vue';
      import MenuDivider from '~/components/reborn/ui/reborn-menu/RebornMenuDivider.vue';
      import Search from '~/components/reborn/ui/reborn-search-box/RebornSearchBox.vue';
      import {LAYOUT_ANIMATION_KEY} from '~/composables/useLayoutAnimation';
      import Sticky from '~/components/reborn/ui/reborn-sticky/RebornSticky.vue';
      import Result from '~/components/reborn/ui/reborn-result/RebornResult.vue';
      import Segmented from '~/components/reborn/ui/reborn-segmented/RebornSegmented.vue';
      globalThis.useRouter=()=>({push:()=>{}});
      const menuScenario=new URLSearchParams(location.search).get('menu');
      const state=reactive({open:menuScenario?['parent','child']:[],accept:!!menuScenario,events:[],clicks:0,history:['初始'],acceptHistory:false,query:{inputValue:'新词',selectValue:''},leading:false,resultTitle:false,sticky:true,position:'top',placeholder:'auto',height:40,selected:'a',mounted:true,slotCount:2});
      const menu=shallowRef(),sticky=shallowRef();
      let searchScope; const localScopes={};
      const animation=shallowRef(false);
      const StickyChild={setup(){const ctx=inject(LAYOUT_ANIMATION_KEY);const unregister=ctx.register(animation);onBeforeUnmount(unregister);return()=>h('div',{id:'sticky-content',style:'height:'+state.height+'px;background:red'},'吸附内容');}};
      const app=createApp({render:()=>h('main',[
        h(Menu,{id:'default-menu',onOpen:()=>state.events.push(['default-open']),onClose:()=>state.events.push(['default-close']),defaultOpeneds:['initial'],expandType:'normal',menuTrigger:'click',tooltip:false},{default:()=>[h(SubMenu,{index:'initial'},{title:()=> '默认展开',default:()=>h(MenuItem,{index:'initial-item'},()=> '默认子项')})]}),
        h(Menu,{id:'ellipsis',mode:'horizontal',ellipsis:true,tooltip:false},{default:()=>Array.from({length:state.slotCount},(_,i)=>h(MenuItem,{key:i,index:'slot-'+i},()=> '条目'+i))}),
        h('section',{id:'menus',onClick:()=>state.clicks++},[
          h(Menu,{ref:menu,...(menuScenario?.startsWith('default')?{defaultOpeneds:['parent','child']}:{openKeys:state.open}),expandMutex:menuScenario==='mutex','onUpdate:openKeys':v=>{state.events.push(['update',v]);if(state.accept)state.open=v;},onOpen:(key,path)=>state.events.push(['open',key,path]),expandType:'normal',menuTrigger:'click',tooltip:false,items:menuScenario?.endsWith('slot')?undefined:[{key:'parent',label:'父级',children:[{key:'child',label:'子级',children:[{key:'leaf',label:'叶子'}]}]},{key:'other',label:'同级',children:[{key:'other-leaf',label:'同级叶子'}]}]},menuScenario?.endsWith('slot')?{default:()=>h(SubMenu,{index:'parent'},{title:()=> '父级',default:()=>h(SubMenu,{index:'child'},{title:()=> '子级',default:()=>h(MenuItem,{index:'leaf'},()=> '叶子')})})}:undefined),
        ]),
        state.mounted?h(Search,{id:'search',history:state.history,'onUpdate:history':v=>{state.events.push(['history',v]);if(state.acceptHistory)state.history=v;},modelValue:state.query,'onUpdate:modelValue':v=>state.query=v},{...(state.leading?{leading:()=>h('button',{id:'leading'},'前置')}:{}),dropdown:scope=>{searchScope=scope;return h('div',{id:'history'},scope.history.join(','));}}):null,
        ...['a','b'].map(key=>h(Search,{id:'local-'+key,historyKey:'fixture-'+key},{dropdown:scope=>{localScopes[key]=scope;return h('div',{id:'local-history-'+key},scope.history.join(','));}})),
        h(Result,{id:'result'},{...(state.resultTitle?{title:()=>h('span',{id:'result-title'},'动态标题')}: {})}),
        h(Segmented,{id:'segmented',modelValue:state.selected,fieldNames:{value:'key',label:'text',disabled:'locked'},options:[{key:'a',text:'选项甲'},{key:'b',text:'选项乙',locked:true}]}),
        h('div',{id:'target',style:'position:relative;margin-top:300px;height:1000px;width:600px'},[
          h(Sticky,{ref:sticky,id:'sticky',target:'#target',sticky:state.sticky,position:state.position,bottomPlaceholder:state.placeholder,offsetTop:10},()=>h(StickyChild)),
        ]),h('div',{style:'height:1600px'})
      ])});
      for(const [name,component] of Object.entries({RebornMenuItems:MenuItems,RebornSubMenu:SubMenu,RebornMenuItem:MenuItem,RebornMenuItemGroup:MenuGroup,RebornMenuDivider:MenuDivider,Icon:props=>h('svg',{'data-icon':props.name})}))app.component(name,component);
      app.directive('tooltip',{});
      app.mount('#app');
      window.fixture={state,flush:nextTick,menu,sticky,animation,localScopes,search:()=>searchScope};
    `, resolveDir: resolve('.'), loader: 'ts' },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'w46-sfc', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : 'text/html');
    response.end(request.url === '/app.js' ? script : '<!doctype html><style>.reborn-sticky-wrapper{position:relative}#ellipsis>ul{display:flex;width:240px;padding:0;list-style:none}#ellipsis>ul>li{flex:0 0 90px;width:90px}</style><body style="margin:0"><div id="app"></div><script type="module" src="/app.js"></script></body>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ executablePath, headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});
async function fixture(run: (page: Page) => Promise<void>, menuScenario = '') {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try { await page.goto(menuScenario ? `${url}?menu=${menuScenario}` : url); await page.waitForFunction(() => !!(window as any).fixture); await run(page); assert.deepEqual(errors, []); }
  finally { await page.close(); }
}

it('Menu 受控拒收保持父值；嵌套 open 携带完整路径；点击可冒泡', { skip: !available }, async () => fixture(async page => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.menu.value.open('child'); await f.flush(); });
  const events = await page.evaluate(() => (window as any).fixture.state.events);
  assert.deepEqual(events.find((item: any[]) => item[0] === 'open'), ['open', 'child', ['parent', 'child']]);
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.open), []);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.accept = true; f.menu.value.open('child'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.open), ['parent', 'child']);
  await page.locator('#menus').getByText('叶子', { exact: true }).click();
  assert.equal(await page.evaluate(() => (window as any).fixture.state.clicks), 1);
}));

it('SearchBox 受控历史支持父级拒收、单条删除和清空；原生属性落在根节点', { skip: !available }, async () => fixture(async page => {
  assert.equal(await page.locator('#search').getAttribute('id'), 'search');
  await page.evaluate(async () => { const f = (window as any).fixture; f.search().selectHistory('新词'); await f.flush(); });
  assert.equal(await page.locator('#history').textContent(), '初始');
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.acceptHistory = true; f.search().selectHistory('新词'); await f.flush(); });
  assert.equal(await page.locator('#history').textContent(), '新词,初始');
  await page.evaluate(async () => { const f = (window as any).fixture; f.search().removeHistoryItem('初始'); await f.flush(); });
  assert.equal(await page.locator('#history').textContent(), '新词');
  await page.evaluate(async () => { const f = (window as any).fixture; f.search().clearHistory(); await f.flush(); });
  assert.equal(await page.locator('#history').textContent(), '');
}));

it('动态 Result 插槽与 Segmented 字段映射在渲染时生效', { skip: !available }, async () => fixture(async page => {
  assert.equal(await page.locator('#result-title').count(), 0);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.resultTitle = true; await f.flush(); });
  assert.equal(await page.locator('#result-title').textContent(), '动态标题');
  assert.equal(await page.locator('#segmented input').nth(0).isChecked(), true);
  assert.equal(await page.locator('#segmented input').nth(1).isDisabled(), true);
  assert.equal(await page.locator('#segmented').getByText('选项乙').count(), 1);
}));

it('Sticky 前台滚动吸顶、目标底部停靠、异步高度与只读 expose', { skip: !available }, async () => fixture(async page => {
  await page.evaluate(() => { const target = document.querySelector('#target')!; window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY + 20); });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#sticky-content')!.parentElement!).position === 'fixed');
  assert.equal(await page.locator('#sticky-content').evaluate(element => Math.round(element.getBoundingClientRect().top)), 10);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.height = 70; await f.flush(); });
  await page.waitForFunction(() => (window as any).fixture.sticky.value.height === 70);
  await page.evaluate(() => { (window as any).fixture.sticky.value.rect.height = 999; });
  assert.equal(await page.evaluate(() => (window as any).fixture.sticky.value.height), 70);
  await page.evaluate(() => { const target = document.querySelector('#target')!; window.scrollTo(0, target.getBoundingClientRect().bottom + window.scrollY - 40); });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#sticky-content')!.parentElement!).position === 'absolute');
  const edges = await page.evaluate(() => ({ target: document.querySelector('#target')!.getBoundingClientRect().bottom, content: document.querySelector('#sticky-content')!.getBoundingClientRect().bottom }));
  assert.ok(Math.abs(edges.target - edges.content) <= 1);
}));

it('Sticky 吸底 keep 与 none 占位稳定，关闭后恢复文档流', { skip: !available }, async () => fixture(async page => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.position = 'bottom'; f.state.placeholder = 'keep'; await f.flush(); });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#sticky-content')!.parentElement!).position === 'fixed');
  assert.equal(await page.locator('#sticky').evaluate(element => element.getBoundingClientRect().height), 40);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.placeholder = 'none'; await f.flush(); });
  await page.waitForFunction(() => document.querySelector('#sticky')!.getBoundingClientRect().height === 0);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.sticky = false; await f.flush(); });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#sticky-content')!.parentElement!).position === 'relative');
  assert.equal(await page.locator('#sticky').evaluate(element => element.getBoundingClientRect().height), 40);
}));


it('SearchBox 未绑定历史时按键隔离并在刷新后恢复', { skip: !available }, async () => fixture(async page => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.localScopes.a.selectHistory('甲'); f.localScopes.b.selectHistory('乙'); await f.flush(); });
  assert.equal(await page.locator('#local-history-a').textContent(), '甲');
  assert.equal(await page.locator('#local-history-b').textContent(), '乙');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#local-history-a')?.textContent === '甲');
  assert.equal(await page.locator('#local-history-b').textContent(), '乙');
}));

it('Sticky 通过登记的后代动画状态冻结吸顶尺寸，动画结束同步最终高度', { skip: !available }, async () => fixture(async page => {
  await page.waitForFunction(() => (window as any).fixture.sticky.value.height === 40);
  await page.evaluate(async () => { const f = (window as any).fixture; f.animation.value = true; f.state.height = 110; await f.flush(); });
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => (window as any).fixture.sticky.value.height), 40);
  await page.evaluate(() => { (window as any).fixture.animation.value = false; });
  await page.waitForFunction(() => (window as any).fixture.sticky.value.height === 110);
}));


it('Menu 默认展开只初始化一次，未绑定模型的开关保持可用', { skip: !available }, async () => fixture(async page => {
  await page.locator('#default-menu').getByText('默认展开', { exact: true }).click();
  assert.equal(await page.evaluate(() => (window as any).fixture.state.events.filter((item: any[]) => item[0] === 'default-close').length), 1);
  await page.locator('#default-menu').getByText('默认展开', { exact: true }).click();
  assert.equal(await page.evaluate(() => (window as any).fixture.state.events.filter((item: any[]) => item[0] === 'default-open').length), 1);
}));

it('Menu 插槽增删会重算溢出，测量过程不形成回灌循环', { skip: !available }, async () => fixture(async page => {
  assert.equal(await page.locator('#ellipsis [data-reborn-menu-ellipsis]').count(), 0);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.slotCount = 5; await f.flush(); });
  await page.waitForFunction(() => document.querySelector('#ellipsis [data-reborn-menu-ellipsis]') !== null);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.slotCount = 2; await f.flush(); });
  await page.waitForFunction(() => document.querySelector('#ellipsis [data-reborn-menu-ellipsis]') === null);
  assert.equal(await page.locator('#ellipsis>ul>li').count(), 2);
}));


for (const scenario of ['initial', 'initial-slot'])
it(`Menu 初始受控嵌套展开时，关闭祖先会一并移除后代（${scenario}）`, { skip: !available }, async () => fixture(async page => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.menu.value.close('parent'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.open), []);
}, scenario));

for (const scenario of ['default', 'default-slot'])
it(`Menu 嵌套 defaultOpeneds 首次关闭祖先时会一并移除后代（${scenario}）`, { skip: !available }, async () => fixture(async page => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.menu.value.close('parent'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.events.filter((event: any[]) => event[0] === 'update').at(-1)), ['update', []]);
}, scenario));

it('Menu 外部替换展开值后，连续拒收关闭提案不会污染完整路径', { skip: !available }, async () => fixture(async page => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.open = ['parent', 'child']; await f.flush(); f.menu.value.close('parent'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.open), ['parent', 'child']);
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.events.at(-1)), ['update', []]);
  await page.evaluate(async () => { const f = (window as any).fixture; f.menu.value.close('child'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.events.at(-1)), ['update', ['parent']]);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.accept = true; f.menu.value.close('parent'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.open), []);
}));

it('Menu expandMutex 从初始路径收起同级分支及后代，拒收后仍可再次操作', { skip: !available }, async () => fixture(async page => {
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.accept = false; f.menu.value.open('other'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.open), ['parent', 'child']);
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.events.filter((event: any[]) => event[0] === 'update').at(-1)), ['update', ['other']]);
  await page.evaluate(async () => { const f = (window as any).fixture; f.state.accept = true; f.menu.value.open('other'); await f.flush(); });
  assert.deepEqual(await page.evaluate(() => (window as any).fixture.state.open), ['other']);
}, 'mutex'));
