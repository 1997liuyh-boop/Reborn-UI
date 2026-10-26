/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'history', 'location', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'NodeList', 'Event', 'MouseEvent', 'KeyboardEvent', 'File', 'Blob', 'MutationObserver', 'getComputedStyle'])
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
const { compileScript, parse } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { build } = require('esbuild');
const { createApp, createSSRApp, h, shallowRef, nextTick, onMounted, onUnmounted, resolveComponent } = require('vue');
const beforeFile = process.env.CONSISTENCY_BEFORE === 'round2' ? 'before-consistency-round2.json' : 'before-consistency-fix.json';
const before = process.env.CONSISTENCY_BEFORE ? JSON.parse(readFileSync(`.superpowers/sdd/FIX-METHOD/${beforeFile}`, 'utf8')) : {};
const route = shallowRef({ fullPath: '/' });
globalThis.consistencyRoute = route;
globalThis.consistencyRouter=require('vue-router').createRouter({history:require('vue-router').createMemoryHistory(),routes:[{path:'/',component:{render:()=>null}}]});
async function compile(file, exports = '', source) {
  const absolute = path.resolve(file);
  const contents = source ? `${compileScript(parse(source, { filename: absolute }).descriptor, { id: file, inlineTemplate: true }).content}\n${exports}` : `export {default} from ${JSON.stringify(absolute)};${exports}`;
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    define:{'import.meta.server':'true','import.meta.client':'false','import.meta.dev':'false'},
    alias: { '~': path.resolve('app'), '@': path.resolve('app') },
    plugins: [{ name: '真实Vue组件', setup(builder) {
      builder.onResolve({ filter: /^#imports$/ }, () => ({ path: 'nuxt-host', namespace: 'host' }));
      // 路由属于 Nuxt 宿主边界；组件及其子组件、Motion 和 Vue 运行时均使用真实实现。
      builder.onLoad({ filter: /.*/, namespace: 'host' }, () => ({ contents: 'export const useRoute=()=>globalThis.consistencyRoute.value; export const useAppConfig=()=>({ui:{icons:{loading:"lucide:loader-circle"}}});', loader: 'js' }));
      builder.onResolve({filter:/^#build\/app\.config$/},()=>({path:'config',namespace:'config'}));
      builder.onLoad({filter:/.*/,namespace:'config'},()=>({contents:'export default {ui:{}};',loader:'js'}));
      builder.onResolve({filter:/^#build\/ui\//},args=>({path:path.resolve('.nuxt',`${args.path.slice(7)}.ts`)}));
      // 这些回归没有头像；若意外走入图片宿主则失败，避免用替代图片组件证明能力。
      builder.onResolve({filter:/^#build\/ui-image-component$/},()=>({path:'unused-image',namespace:'image'}));
      builder.onLoad({filter:/.*/,namespace:'image'},()=>({contents:'export default {setup(){throw Error("本测试不覆盖Nuxt图片宿主")}};',loader:'js'}));
      builder.onResolve({filter:/^#build\/(nuxt\.config\.mjs|router\.options)$/},()=>({path:'nuxt-config',namespace:'nuxt-config'}));
      builder.onLoad({filter:/.*/,namespace:'nuxt-config'},()=>({contents:'export const nuxtLinkDefaults={prefetch:false};export const hashMode=false;',loader:'js'}));
      builder.onResolve({filter:/^\.\.\/(composables\/(preload|ready|router)\.js|nuxt\.js)$/},args=>args.importer.replaceAll('\\','/').endsWith('/nuxt-link.js')?{path:'nuxt-composables',namespace:'nuxt-composables'}:undefined);
      // 使用真实 NuxtLink；这里只提供其运行所需的 Nuxt 应用与内存路由宿主，不替代链接组件。
      builder.onLoad({filter:/.*/,namespace:'nuxt-composables'},()=>({contents:'export const useRouter=()=>globalThis.consistencyRouter;export const useRuntimeConfig=()=>({app:{baseURL:"/"}});export const useNuxtApp=()=>({});export const preloadRouteComponents=()=>{};export const onNuxtReady=()=>{};export const navigateTo=()=>{throw Error("本测试不导航")};export const resolveRouteObject=x=>x;',loader:'js'}));
      builder.onLoad({ filter: /\.vue$/ }, args => {
        const relative = path.relative(process.cwd(), args.path).replaceAll('\\', '/');
        const { descriptor } = parse(before[relative] ?? readFileSync(args.path, 'utf8'), { filename: args.path });
        return { contents: compileScript(descriptor, { id: relative, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    } }],
  });
  const module = { exports: {} };
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0].text}\n})`)(module, module.exports, require);
  return module.exports;
}
const ui = name => `app/components/reborn/ui/reborn-${name}/Reborn${name.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join('')}.vue`;
const components = Object.fromEntries(await Promise.all(['chip','fab','header','dropdown','drawer','overlay','input','input-number','input-otp','slider','upload'].map(async name=>[name,(await compile(ui(name))).default])));
async function settle(ms = 4) { await nextTick(); await new Promise(resolve=>setTimeout(resolve,ms)); await nextTick(); }
function captureWarnings(app) {
  const warnings = [];
  app.config.warnHandler = message => warnings.push(message);
  return () => assert.deepEqual(warnings, [], 'Vue warnings 必须为空');
}
function mountApp(app, root) {
  const checkWarnings = captureWarnings(app);
  const errors = [];
  // 先记录生命周期错误，让 Vue 完成挂载；此后 unmount 才会真正执行整树清理。
  app.config.errorHandler = error => errors.push(error);
  let closed = false;
  const close = () => {
    if (!closed) {
      closed = true;
      try { app.unmount(); } catch (error) { errors.push(error); } finally { root.remove(); }
    }
    const failures = [...errors];
    try { checkWarnings(); } catch (error) { failures.push(error); }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) throw new AggregateError(failures, 'Vue 宿主捕获到错误与警告', { cause: failures[0] });
  };
  app.mount(root);
  if (errors.length) close();
  return { root, close };
}
async function renderSsr(app) {
  const warnings = [];
  app.config.warnHandler = message => warnings.push(message);
  // 当前 SSR 运行时的警告可能直接写 console；整个渲染范围捕获，不按内容过滤。
  const originalWarn = console.warn;
  console.warn = (...messages) => warnings.push(messages.join(' '));
  try { return await renderToString(app); } finally { console.warn = originalWarn; assert.deepEqual(warnings, [], 'Vue warnings 必须为空'); }
}
function mount(Component, props, slots = {}) {
  const root = document.createElement('div'); document.body.append(root);
  const app = createApp({ render:()=>h(Component, props.value, slots) });
  // 图标仅作为叶子展示；不替代触发器、输入框、过渡、滚动条或其他受测组件。
  app.component('Icon', { render:()=>h('i') });
  app.component('NuxtLink', require('vue-router').RouterLink);
  return mountApp(app, root);
}
after(()=>dom.window.close());

const toggleFixtures = [
  { name:'Fab', Component:components.fab, key:'modelValue', props:{ expandable:true, attract:false }, slots:{ trigger:({isActive})=>h('button',{'data-toggle':''},String(isActive)) } },
  { name:'Header', Component:components.header, key:'open', props:{ title:'',to:'',mode:'popup' }, slots:{ toggle:({open,toggle})=>h('button',{'data-toggle':'',onClick:toggle},String(open)) } },
  { name:'Dropdown', Component:components.dropdown, key:'popupVisible', props:{ trigger:'manual',portal:false }, slots:{ default:({visible,toggle})=>h('button',{'data-toggle':'',onClick:toggle},String(visible)),content:()=>h('span','菜单') } },
];
for(const fixture of toggleFixtures) {
  it(`${fixture.name} 缺省为关闭，未绑定模型时真实点击可往返`,async()=>{
    const p=shallowRef(fixture.props);const m=mount(fixture.Component,p,fixture.slots);
    try {const button=()=>m.root.querySelector('[data-toggle]');assert.equal(button().textContent,'false');button().click();await settle();assert.equal(button().textContent,'true');button().click();await settle();assert.equal(button().textContent,'false');}finally{m.close();}
  });
  for(const empty of [false,undefined,null]) for(const accept of [true,false]) {
    it(`${fixture.name} 非受控→显式${String(empty)}，父级${accept?'接收':'拒收'}两次旧值更新`,async()=>{
      const p=shallowRef({...fixture.props});const updates=[];const m=mount(fixture.Component,p,fixture.slots);
      const button=()=>m.root.querySelector('[data-toggle]');
      try {
        button().click();await settle();assert.equal(button().textContent,'true');
        const update=value=>{updates.push(value);p.value={...p.value,[fixture.key]:accept?value:empty};};
        p.value={...fixture.props,[fixture.key]:empty,[`onUpdate:${fixture.key}`]:update};await settle();assert.equal(button().textContent,'false');assert.deepEqual(updates,[]);
        for(let attempt=0;attempt<2;attempt++) {
          if(accept&&attempt) {p.value={...p.value,[fixture.key]:empty};await settle();}
          button().click();await settle();assert.deepEqual(updates,new Array(attempt+1).fill(true));assert.equal(button().textContent,String(accept));
        }
      } finally {m.close();}
    });
  }
}
it('Fab active 仅提供非受控初值，显式空模型不被初始化覆盖或派发',async()=>{
  for(const props of [{active:true},...([false,undefined,null].map(modelValue=>({active:true,modelValue})))]) {
    const updates=[];const p=shallowRef({...props,'onUpdate:modelValue':value=>updates.push(value),attract:false});
    const m=mount(components.fab,p,{trigger:({isActive})=>h('button',String(isActive))});
    try {assert.equal(m.root.querySelector('button').textContent,String(!Object.hasOwn(props,'modelValue')));assert.deepEqual(updates,[]);}finally{m.close();}
  }
});
it('Header 父级新增显式空模型后，过期 beforeToggle 不能再次打开',async()=>{
  let resolve;const pending=new Promise(done=>resolve=done);const updates=[];
  const p=shallowRef({title:'',to:'',beforeToggle:()=>pending});const fixture=toggleFixtures[1];
  const m=mount(components.header,p,fixture.slots);
  try {m.root.querySelector('button').click();p.value={...p.value,open:undefined,'onUpdate:open':value=>updates.push(value)};await settle();resolve(true);await settle();assert.equal(m.root.querySelector('button').textContent,'false');assert.deepEqual(updates,[]);}finally{m.close();}
});
it('Dropdown 旧悬停延迟不向新增显式空模型发送过期打开事件',async()=>{
  const updates=[];const p=shallowRef({trigger:'hover',portal:false});
  const m=mount(components.dropdown,p,{default:({visible})=>h('button',String(visible))});
  try {m.root.querySelector('button').parentElement.dispatchEvent(new MouseEvent('mouseenter'));p.value={...p.value,popupVisible:undefined,'onUpdate:popupVisible':v=>updates.push(v)};await settle(130);assert.equal(m.root.querySelector('button').textContent,'false');assert.deepEqual(updates,[]);}finally{m.close();}
});
it('Fab 旧悬停关闭延迟不向新增显式空模型发送过期事件',async()=>{
  const updates=[];const p=shallowRef({trigger:'hover',attract:false});
  const m=mount(components.fab,p,{trigger:({isActive})=>h('button',String(isActive))});
  try {m.root.firstElementChild.dispatchEvent(new MouseEvent('mouseenter'));await settle();assert.equal(m.root.querySelector('button').textContent,'true');m.root.firstElementChild.dispatchEvent(new MouseEvent('mouseleave'));p.value={...p.value,modelValue:null,'onUpdate:modelValue':v=>updates.push(v)};await settle(180);assert.equal(m.root.querySelector('button').textContent,'false');assert.deepEqual(updates,[]);}finally{m.close();}
});
it('Chip SSR 缺省可见，显式 false/undefined/null 隐藏，初始化不派发事件',async()=>{
  for(const props of [{},...([true,false,undefined,null].map(show=>({show})))]) {
    const updates=[];const app=createSSRApp({render:()=>h(components.chip,{...props,text:'角标','onUpdate:show':v=>updates.push(v)})});
    const html=await renderSsr(app);assert.equal(html.includes('角标'),!Object.hasOwn(props,'show')||props.show===true);assert.deepEqual(updates,[]);
  }
});
for(const name of ['drawer','overlay']) {
  for(const empty of [false,undefined,null]) for(const accept of [true,false]) {
    it(`${name} 显式空模型关闭，父级${accept?'接收':'拒收'}两次真实关闭更新`,async()=>{
      const updates=[];const key='modelValue';
      const options=name==='drawer'?{duration:0,appendToBody:false,withHeader:true,lockScroll:false}:{duration:0,lockScroll:false};
      const p=shallowRef({...options,[key]:empty});
      const m=mount(components[name],p,{default:()=>h('span',{'data-content':''},'内容')});
      try {
        await settle();assert.equal(m.root.querySelector('[data-content]'),null);assert.deepEqual(updates,[]);
        for(let attempt=0;attempt<2;attempt++) {
          p.value={...options,[key]:true,'onUpdate:modelValue':value=>{updates.push(value);p.value={...p.value,[key]:accept?value:true};}};await settle();
          const target=name==='drawer'?m.root.querySelector('[aria-label="关闭抽屉"]'):m.root.querySelector('[data-content]').parentElement;
          target.click();await settle(15);assert.deepEqual(updates,new Array(attempt+1).fill(false));assert.equal(p.value.modelValue,!accept);
        }
      }finally{m.close();}
    });
  }
}
for(const name of ['input','input-number','input-otp']) {
  it(`${name} 挂载后父级样式与原生属性更新不缓存旧 attrs`,async()=>{
    const p=shallowRef({style:{width:'120px'},'data-state':'初值',inputmode:'numeric'});const m=mount(components[name],p);
    try {assert.equal(m.root.firstElementChild.style.width,'120px');assert.equal(m.root.querySelector('input').dataset.state,'初值');
      p.value={...p.value,style:[{width:'240px'},{color:'red'}],'data-state':'更新',inputmode:'search',...(name==='input-otp'?{inputType:'text'}:{})};await settle();
      assert.equal(m.root.firstElementChild.style.width,'240px');assert.equal(m.root.firstElementChild.style.color,'red');assert.equal(m.root.querySelector('input').dataset.state,'更新');assert.equal(m.root.querySelector('input').getAttribute('inputmode'),name==='input-otp'?'text':'search');
    }finally{m.close();}
  });
}
it('Slider 多滑块插槽与提示收到当前数值，空数组安全渲染',async()=>{
  const values=[];const p=shallowRef({range:true,values:[20,70],showTooltip:true});
  const m=mount(components.slider,p,{thumb:({value})=>{values.push(value);return h('span',{'data-thumb':''},String(value));}});
  try {assert.deepEqual([...m.root.querySelectorAll('[data-thumb]')].map(e=>e.textContent),['20','70']);assert.ok(values.every(Number.isFinite));p.value={...p.value,values:[]};await settle();assert.ok([...m.root.querySelectorAll('[data-thumb]')].every(e=>e.textContent!=='undefined'));}finally{m.close();}
});
it('Upload 历史视频缺地址安全降级，有地址保留媒体片段且无 raw 不显示分片控制',async()=>{
  for(const listType of ['picture','picture-card']) {
    const p=shallowRef({listType,autoUpload:false,fileList:[{uid:1,name:'无地址.mp4',status:'success'},{uid:2,name:'视频.mp4',status:'success',url:'/video.mp4'}]});
    const m=mount(components.upload,p);
    try {await settle();assert.equal(m.root.querySelectorAll('video').length,1);assert.equal(m.root.querySelector('video').getAttribute('src'),'/video.mp4#t=0.1');assert.equal(m.root.querySelector('[aria-label^="暂停"]'),null);m.root.querySelector('video').dispatchEvent(new Event('error'));await settle();assert.equal(m.root.querySelector('video'),null);}finally{m.close();}
  }
});
it('Notification 自定义 VNode 重渲染保留组件实例，空值走文本/图标回退',async()=>{
  const file='app/components/reborn/ui/reborn-notification/RebornNotification.vue';
  const module=await compile(file,`export {addNotification,destroyNotifications,notificationState} from ${JSON.stringify(path.resolve(path.dirname(file),'reborn-notification.config.ts'))};`);
  let mounts=0;let unmounts=0;const Child={setup(){onMounted(()=>mounts++);onUnmounted(()=>unmounts++);return()=>h('button',{'data-node':''},'自定义');}};
  const handle=module.addNotification({message:()=>h(Child),icon:h('b','图标'),footer:h('span','页脚'),duration:0});
  const p=shallowRef({});const m=mount(module.default,p);
  try {await settle();const node=document.querySelector('[data-node]');assert.ok(node);assert.equal(mounts,1);module.notificationState.list[0].title='更新标题';await settle();assert.equal(document.querySelector('[data-node]'),node);assert.equal(mounts,1);assert.equal(unmounts,0);module.notificationState.list[0].message='文本正文';module.notificationState.list[0].footer=undefined;await settle();assert.equal(document.querySelector('[data-node]'),null);assert.equal(unmounts,1);assert.ok(document.body.textContent.includes('文本正文'));}finally{handle.close();module.destroyNotifications();m.close();}
});

// Nuxt 自动导入及应用服务属于宿主；真实 UI Button / Tooltip 的事件链仍完整挂载。
const vueRuntime=require('vue');
Object.assign(globalThis,Object.fromEntries(['computed','shallowRef','watch','inject','nextTick','useTemplateRef','onBeforeUnmount','ref'].map(key=>[key,vueRuntime[key]])));
globalThis.useClipboard=require('@vueuse/core').useClipboard;
globalThis.useToast=()=>({add(){throw new Error('本测试不触发通知服务');}});
globalThis.useAssistant=()=>({isEnabled:shallowRef(false),open(){throw new Error('本测试不触发助手服务');}});
const UBadge=(await compile('node_modules/@nuxt/ui/dist/runtime/components/Badge.vue')).default;
const UButton=(await compile('node_modules/@nuxt/ui/dist/runtime/components/Button.vue')).default;
const UTooltip=(await compile('node_modules/@nuxt/ui/dist/runtime/components/Tooltip.vue')).default;
const NuxtLink=(await compile('node_modules/nuxt/dist/app/components/nuxt-link.js')).default;
const DemoActions=(await compile('app/components/common/demo/DemoActions.vue')).default;
const ThemeSlotsPanel=(await compile('app/components/common/demo/ThemeSlotsPanel.vue')).default;
const {TooltipProvider}=require('reka-ui');
function mountCommon(Component,p,configure) {
  const root=document.createElement('div');document.body.append(root);
  const app=createApp({render:()=>h(TooltipProvider,{delayDuration:0},{default:()=>h(Component,p.value)})});
  app.use(globalThis.consistencyRouter);
  app.component('UBadge',UBadge);app.component('UButton',UButton);app.component('UTooltip',UTooltip);app.component('Icon',{render:()=>h('i')});app.component('NuxtLink',NuxtLink);
  configure?.(app);
  return mountApp(app,root);
}
for(const fixture of [{key:'open',closed:'展开代码',opened:'收起代码'},{key:'themeOpen',closed:'展开 Theme slots',opened:'收起 Theme slots'}]) {
  for(const empty of [false,undefined,null]) for(const accept of [true,false]) {
    it(`DemoActions.${fixture.key} 动态显式${String(empty)}，真实UI按钮${accept?'接收':'拒收'}重复更新`,async()=>{
      const p=shallowRef({code:'<p>示例</p>',hasThemeSlots:true});const updates=[];const m=mountCommon(DemoActions,p);
      const button=()=>m.root.querySelector(`[aria-label="${fixture.closed}"]`);
      try {assert.ok(button());button().click();await settle();assert.ok(m.root.querySelector(`[aria-label="${fixture.opened}"]`));
        p.value={...p.value,[fixture.key]:empty,[`onUpdate:${fixture.key}`]:value=>{updates.push(value);p.value={...p.value,[fixture.key]:accept?value:empty};}};await settle();assert.ok(button());assert.deepEqual(updates,[]);
        for(let attempt=0;attempt<2;attempt++){if(attempt&&accept){p.value={...p.value,[fixture.key]:empty};await settle();}button().click();await settle();assert.deepEqual(updates,new Array(attempt+1).fill(true));assert.ok(m.root.querySelector(`[aria-label="${accept?fixture.opened:fixture.closed}"]`));}
      }finally{m.close();}
    });
  }
}
for(const accept of [true,false]) {
  it(`ThemeSlotsPanel 真实UI关闭按钮两次更新由父级${accept?'接收':'拒收'}`,async()=>{
    const p=shallowRef({groups:[],open:true});const updates=[];const m=mountCommon(ThemeSlotsPanel,p);
    try {for(let attempt=0;attempt<2;attempt++){p.value={...p.value,open:true,'onUpdate:open':v=>{updates.push(v);p.value={...p.value,open:accept?v:true};}};await settle();m.root.querySelector('[aria-label="收起 Theme slots"]').click();await settle();assert.deepEqual(updates,new Array(attempt+1).fill(false));assert.equal(p.value.open,!accept);}}finally{m.close();}
  });
}

// 编译真实父模板，保留 vnode 的连字符键，避免 h() 的驼峰用法掩盖所有权问题。
async function parentTemplate(file, template) {
  const source = `<script setup>import Target from ${JSON.stringify(path.resolve(file))};const {value,binding,record}=globalThis.consistencyParent;</script><template>${template}</template>`;
  return (await compile('tests/consistency/TemplateParent.vue', '', source)).default;
}
function parentState(key, accept = true) {
  const value = shallowRef(true);
  const binding = shallowRef({});
  const events = [];
  return { value, binding, events, record(next) {
    events.push(next);
    if (!accept) return;
    value.value = next;
    if (Object.hasOwn(binding.value, key)) binding.value = { [key]: next };
  } };
}
function mountParent(Parent, state, configure) {
  globalThis.consistencyParent = state;
  return mountCommon(Parent, shallowRef({}), configure);
}
const templateFixtures = [
  { name: 'Dropdown', file: ui('dropdown'), key: 'popup-visible', options: 'trigger="manual" :portal="false"', slots: '<template #default="{visible,toggle}"><button data-parent-toggle @click="toggle">{{ visible }}</button></template><template #content>菜单</template>', read: root => root.querySelector('[data-parent-toggle]').textContent === 'true', click: root => root.querySelector('[data-parent-toggle]').click() },
  { name: 'Fab', file: ui('fab'), key: 'model-value', options: ':attract="false"', slots: '<template #trigger="{isActive}"><button data-parent-toggle>{{ isActive }}</button></template>', read: root => root.querySelector('[data-parent-toggle]').textContent === 'true', click: root => root.querySelector('[data-parent-toggle]').click() },
  { name: 'Drawer', file: ui('drawer'), key: 'model-value', options: ':duration="0" :append-to-body="false" :lock-scroll="false" :with-header="true"', slots: '<span data-parent-content>内容</span>', read: root => { const panel = root.querySelector('[role="dialog"]'); return !!panel && panel.style.display !== 'none'; }, click: root => root.querySelector('[aria-label="关闭抽屉"]').click() },
  { name: 'Overlay', file: ui('overlay'), key: 'model-value', options: ':duration="0" :lock-scroll="false"', slots: '<span data-parent-content>内容</span>', read: root => !!root.querySelector('[data-parent-content]'), click: root => root.querySelector('[data-parent-content]').parentElement.click() },
];
for (const fixture of templateFixtures) {
  const FixedParent = await parentTemplate(fixture.file, `<Target :${fixture.key}="value" @update:${fixture.key}="record" ${fixture.options}>${fixture.slots}</Target>`);
  const DynamicParent = await parentTemplate(fixture.file, `<Target v-bind="binding" @update:${fixture.key}="record" ${fixture.options}>${fixture.slots}</Target>`);
  for (const accept of [true, false]) {
    it(`${fixture.name} 真实父模板连字符初始 true，父级${accept ? '接收' : '拒收'}重复关闭`, async () => {
      const state = parentState(fixture.key, accept); const m = mountParent(FixedParent, state);
      try {
        await settle(); assert.equal(fixture.read(m.root), true); assert.deepEqual(state.events, []);
        for (let attempt = 0; attempt < 2; attempt++) {
          state.value.value = true; await settle(); fixture.click(m.root); await settle(15);
          assert.deepEqual(state.events, new Array(attempt + 1).fill(false)); assert.equal(fixture.read(m.root), !accept);
        }
      } finally { m.close(); }
    });
    for (const empty of [false, undefined, null]) {
      it(`${fixture.name} 真实父模板缺省→连字符${String(empty)}，${accept ? '接收' : '拒收'}重复旧值更新`, async () => {
        const state = parentState(fixture.key, accept); const m = mountParent(DynamicParent, state);
        const togglesOpen = fixture.name === 'Dropdown' || fixture.name === 'Fab';
        try {
          await settle(); assert.equal(fixture.read(m.root), false);
          if (togglesOpen) { fixture.click(m.root); await settle(); assert.equal(fixture.read(m.root), true); state.events.length = 0; }
          state.binding.value = { [fixture.key]: empty }; await settle(15); assert.equal(fixture.read(m.root), false); assert.deepEqual(state.events, []);
          for (let attempt = 0; attempt < 2; attempt++) {
            state.binding.value = { [fixture.key]: togglesOpen ? empty : true }; await settle();
            assert.equal(fixture.read(m.root), !togglesOpen);
            fixture.click(m.root); await settle(15);
            assert.deepEqual(state.events, new Array(attempt + 1).fill(togglesOpen));
            assert.equal(fixture.read(m.root), togglesOpen ? accept : !accept);
          }
        } finally { m.close(); }
      });
    }
  }
}
const NamedModelParent = await parentTemplate(ui('dropdown'), '<Target v-model:popup-visible="value" @update:popup-visible="record" trigger="manual" :portal="false"><template #default="{visible,toggle}"><button data-parent-toggle @click="toggle">{{ visible }}</button></template></Target>');
it('Dropdown 真实 v-model:popup-visible 初始打开并写回父值', async () => {
  const state = parentState('popup-visible'); const m = mountParent(NamedModelParent, state);
  try { assert.equal(m.root.querySelector('button').textContent, 'true'); m.root.querySelector('button').click(); await settle(); assert.equal(state.value.value, false); assert.deepEqual(state.events, [false]); } finally { m.close(); }
});
const ThemeModelParent = await parentTemplate('app/components/common/demo/DemoActions.vue', '<Target v-model:theme-open="value" @update:theme-open="record" :has-theme-slots="true" code="示例" />');
it('DemoActions 真实 v-model:theme-open 外部关闭后点击能重新打开', async () => {
  const state = parentState('theme-open'); const m = mountParent(ThemeModelParent, state);
  try { assert.ok(m.root.querySelector('[aria-label="收起 Theme slots"]')); state.value.value = false; await settle(); m.root.querySelector('[aria-label="展开 Theme slots"]').click(); await settle(); assert.equal(state.value.value, true); assert.deepEqual(state.events, [true]); } finally { m.close(); }
});
const DynamicThemeParent = await parentTemplate('app/components/common/demo/DemoActions.vue', '<Target v-bind="binding" @update:theme-open="record" :has-theme-slots="true" code="示例" />');
for (const empty of [false, undefined, null]) for (const accept of [true, false]) {
  it(`DemoActions 真实父模板缺省→theme-open ${String(empty)}，${accept ? '接收' : '拒收'}重复打开`, async () => {
    const state = parentState('theme-open', accept); const m = mountParent(DynamicThemeParent, state);
    try {
      m.root.querySelector('[aria-label="展开 Theme slots"]').click(); await settle(); assert.ok(m.root.querySelector('[aria-label="收起 Theme slots"]')); state.events.length = 0;
      state.binding.value = { 'theme-open': empty }; await settle(); assert.ok(m.root.querySelector('[aria-label="展开 Theme slots"]'));
      for (let attempt = 0; attempt < 2; attempt++) { state.binding.value = { 'theme-open': empty }; await settle(); m.root.querySelector('[aria-label="展开 Theme slots"]').click(); await settle(); assert.deepEqual(state.events, new Array(attempt + 1).fill(true)); assert.ok(m.root.querySelector(`[aria-label="${accept ? '收起' : '展开'} Theme slots"]`)); }
    } finally { m.close(); }
  });
}
const DropdownHoverParent = await parentTemplate(ui('dropdown'), '<Target v-bind="binding" @update:popup-visible="record" trigger="hover" :portal="false"><template #default="{visible}"><button data-parent-toggle>{{ visible }}</button></template></Target>');
it('Dropdown 连字符 undefined 新增所有权作废旧 hover 打开任务', async () => {
  const state = parentState('popup-visible'); const m = mountParent(DropdownHoverParent, state);
  try { m.root.querySelector('button').parentElement.dispatchEvent(new MouseEvent('mouseenter')); state.binding.value = { 'popup-visible': undefined }; await settle(130); assert.equal(m.root.querySelector('button').textContent, 'false'); assert.deepEqual(state.events, []); } finally { m.close(); }
});
const FabHoverParent = await parentTemplate(ui('fab'), '<Target v-bind="binding" @update:model-value="record" trigger="hover" :attract="false"><template #trigger="{isActive}"><button data-parent-toggle>{{ isActive }}</button></template></Target>');
it('Fab 连字符 undefined 新增所有权作废旧 hover 关闭任务', async () => {
  const state = parentState('model-value'); const m = mountParent(FabHoverParent, state);
  try { const fab = m.root.querySelector('button').parentElement.parentElement; fab.dispatchEvent(new MouseEvent('mouseenter')); await settle(); assert.equal(m.root.querySelector('button').textContent, 'true'); state.events.length = 0; fab.dispatchEvent(new MouseEvent('mouseleave')); state.binding.value = { 'model-value': undefined }; await settle(180); assert.equal(m.root.querySelector('button').textContent, 'false'); assert.deepEqual(state.events, []); } finally { m.close(); }
});
for (const common of [false, true]) {
  it(`${common ? 'Nuxt UI' : '普通'}宿主捕获未解析组件警告，清理后断言失败`, () => {
    const BadComponent = { render: () => h(resolveComponent('MissingWarningProbe')) };
    const m = common ? mountCommon(BadComponent, shallowRef({})) : mount(BadComponent, shallowRef({}));
    assert.throws(() => m.close(), /Vue warnings 必须为空/); assert.equal(m.root.isConnected, false);
  });
}
it('SSR 宿主捕获未解析组件警告并断言失败', async () => {
  const originalWarn = console.warn;
  await assert.rejects(renderSsr(createSSRApp({ render: () => h(resolveComponent('MissingSsrWarningProbe')) })), /Vue warnings 必须为空/);
  assert.equal(console.warn, originalWarn);
});
it('断言失败路径卸载真实 Dropdown，清理 DOM 与待执行悬停任务', async () => {
  const updates = []; const m = mount(components.dropdown, shallowRef({ trigger: 'hover', portal: false, 'onUpdate:popupVisible': value => updates.push(value) }), { default: () => h('button', '悬停') });
  assert.throws(() => { try { m.root.querySelector('button').parentElement.dispatchEvent(new MouseEvent('mouseenter')); throw new Error('模拟断言中断'); } finally { m.close(); } }, /模拟断言中断/);
  await settle(130); assert.equal(m.root.isConnected, false); assert.deepEqual(updates, []);
});

const tabsSource = `<script setup>import Tabs from ${JSON.stringify(path.resolve(ui('tabs')))};import Pane from ${JSON.stringify(path.resolve('app/components/reborn/ui/reborn-tabs/RebornTabPane.vue'))};const {panes,record}=globalThis.consistencyParent;</script><template><Tabs type="text" :animation="false" @change="record"><Pane v-for="pane in panes" :key="pane.id" :pane-key="pane.key" :order="pane.order" :title="pane.title"><span :data-pane-id="pane.id">{{ pane.title }}</span></Pane></Tabs></template>`;
const tabsModule = await compile('tests/consistency/TabsParent.vue', `export {TABS_INJECTION_KEY} from ${JSON.stringify(path.resolve('app/components/reborn/ui/reborn-tabs/reborn-tabs.config.ts'))};`, tabsSource);
for (const explicit of [false, true]) {
  it(`Tabs 真实登记${explicit ? '数字0/字符串键' : '缺省序号'}，重排与移除保持元信息身份`, async () => {
    const panes = shallowRef([{ id: 'a', title: '甲', ...(explicit ? { key: 0 } : {}) }, { id: 'b', title: '乙', ...(explicit ? { key: 'second' } : {}) }]);
    const events = []; const inputs = []; const outputs = []; const removed = [];
    const m = mountParent(tabsModule.default, { panes, record: key => events.push(key) }, app => app.mixin({ created() {
      if (this.$options.name !== 'RebornTabs') return;
      const context = this.$.provides[tabsModule.TABS_INJECTION_KEY];
      const add = context.addPane; const remove = context.removePane;
      context.addPane = meta => { inputs.push(meta); const result = add(meta); outputs.push(result); return result; };
      context.removePane = meta => { removed.push(meta); remove(meta); };
    } }));
    try {
      await settle();
      for (let index = 0; index < inputs.length; index++) assert.equal(outputs[index] === inputs[index], true, '登记返回同一元信息对象');
      // 未传 pane-key 时 v-for 里的面板按「外层-内层」书写位置编号（破坏性变更，见更新日志 Tabs 条目）
      assert.deepEqual(outputs.map(meta => meta.key), explicit ? [0, 'second'] : ['0-0', '0-1']);
      const firstContent = m.root.querySelector('[data-pane-id="a"]'); const secondContent = m.root.querySelector('[data-pane-id="b"]');
      m.root.querySelectorAll('[role="tab"]')[1].click(); await settle(); assert.deepEqual(events, [explicit ? 'second' : '0-1']);
      panes.value = [...panes.value].reverse(); await settle();
      assert.deepEqual([...m.root.querySelectorAll('[role="tab"]')].map(node => node.textContent.trim()), ['乙', '甲']);
      assert.equal(m.root.querySelector('[data-pane-id="a"]'), firstContent); assert.equal(m.root.querySelector('[data-pane-id="b"]'), secondContent);
      panes.value = panes.value.filter(pane => pane.id !== 'a'); await settle();
      assert.equal(removed.length, 1); assert.equal(removed[0], inputs[0]); assert.equal(m.root.querySelectorAll('[role="tab"]').length, 1); assert.equal(m.root.querySelector('[data-pane-id="a"]'), null);
    } finally { m.close(); }
    assert.equal(removed.length, 2); assert.equal(removed[1], inputs[1]);
  });
}

for (const withWarning of [false, true]) {
  it(`真实 Dropdown 挂载 hook 抛错${withWarning ? '并产生 warning' : ''}后卸载整树、清理 timer 并保留原错误`, async () => {
    const root = document.createElement('div'); document.body.append(root);
    const original = new Error('mount-hook-failure'); const events = []; let unmounts = 0; let caught;
    const Parent = { setup() {
      onMounted(() => { root.querySelector('button').parentElement.dispatchEvent(new MouseEvent('mouseenter')); throw original; });
      onUnmounted(() => unmounts++);
      return () => h('div', [h(components.dropdown, { trigger: 'hover', portal: false, 'onUpdate:popupVisible': value => events.push(value) }, { default: () => h('button', '真实悬停') }), withWarning ? h(resolveComponent('MissingMountWarningProbe')) : null]);
    } };
    const app = createApp(Parent); app.component('Icon', { render: () => h('i') });
    try { mountApp(app, root); } catch (error) { caught = error; }
    await settle(150);
    const contains = error => error === original || (error instanceof AggregateError && error.errors.some(contains));
    assert.deepEqual({ rootConnected: root.isConnected, events, unmounts, originalError: contains(caught) }, { rootConnected: false, events: [], unmounts: 1, originalError: true });
    if (withWarning) {
      assert.ok(caught instanceof AggregateError);
      assert.ok(caught.errors.some(error => error.code === 'ERR_ASSERTION' && error.message.includes('MissingMountWarningProbe')));
    } else assert.equal(caught, original);
  });
}
