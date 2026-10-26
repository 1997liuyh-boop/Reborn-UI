/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { after, it } from 'node:test';
import { compileScript, parse } from '@vue/compiler-sfc';
import { createInitialForm, createRules } from '../../../app/components/reborn/examples/reborn-form/reborn-form-demo.config';
import { createDemoTasks } from '../../../app/components/reborn/examples/shared/demo-tasks';
import { installDom, wait } from '../../composables/harness';
import { loadDemo } from './harness';

const dom = installDom();
const { createApp, defineComponent, h, shallowRef } = await import('vue');

it('初始表单数组跨实例隔离，密码规则在校验时读取当前值', () => {
  const first = createInitialForm();
  first.contacts.push({id:1,name:'联系人',phone:'13800000000',email:'a@qq.com',no:1});
  first.interest.push('a');
  first.dateRange.push('2026-01-01');
  const second = createInitialForm();
  assert.deepEqual([second.contacts,second.interest,second.dateRange],[[],[],[]]);
  const rules = createRules(first);
  first.password = 'DifferentPassword2!';
  const result = rules.safeParse({...first,newPassword:first.password});
  assert.equal(result.success,false);
  if (!result.success) assert.ok(result.error.issues.some(issue=>issue.path.join('.')==='newPassword'));
});

it('卸载立即结束等待，取消定时回写，重复销毁安全', async () => {
  const tasks = createDemoTasks();
  let writes = 0;
  tasks.schedule(()=>writes++,20);
  const waiting = tasks.wait(2000);
  tasks.dispose();
  tasks.dispose();
  assert.equal(await waiting,false);
  assert.equal(await tasks.wait(20),false);
  await wait(35);
  assert.equal(writes,0);
});

const FormDemo = await loadDemo('app/components/reborn/examples/reborn-form/RebornFormDemo.vue',['form','state','formRef','addContact','removeContact','reset']);
interface FormApi {
  form: ReturnType<typeof createInitialForm>;
  state: {immediateValidate:boolean};
  formRef: {validateField:(prop:string)=>Promise<string|null>};
  addContact:()=>void;
  removeContact:(index:number)=>Promise<void>;
  reset:()=>void;
};

function mountForm() {
  const ref = shallowRef<FormApi>();
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({render:()=>h(FormDemo,{ref})});
  app.config.warnHandler=()=>{};
  const Container=defineComponent({setup(_, {slots}){return()=>h('div',slots.default?.());}});
  for(const name of ['Playground','DemoSection','DemoBlock','DemoNote','Icon'])app.component(name,Container);
  app.mount(host);
  return {get api(){return ref.value!;},host,unmount(){app.unmount();host.remove();}};
}

it('删除首行后保留下一联系人的节点与正确路径，手动校验模式不继承旧错误',async()=>{
  const view=mountForm();
  view.api.state={...view.api.state,immediateValidate:false};
  view.api.addContact();view.api.addContact();view.api.addContact();
  view.api.form.contacts[1]!.name='第二位';
  await wait();
  assert.ok(await view.api.formRef.validateField('contacts-0-name'));
  const second=view.host.querySelectorAll('[placeholder="请输入姓名"]')[1];
  await view.api.removeContact(0);
  assert.equal(view.api.form.contacts[0]!.name,'第二位');
  assert.equal(view.host.querySelector('[placeholder="请输入姓名"]'),second);
  assert.ok(!view.host.textContent?.includes('Name 最少两个字符'));
  assert.equal(await view.api.formRef.validateField('contacts-0-name'),null);
  view.api.reset();await wait();
  assert.deepEqual(view.api.form.contacts,[]);
  view.unmount();
  const remount=mountForm();
  assert.deepEqual(remount.api.form.contacts,[]);
  remount.unmount();
});

it('菜单各示例模型互不影响，复制当前状态生成的代码可以编译',async()=>{
  const MenuDemo=await loadDemo('app/components/reborn/examples/reborn-menu/RebornMenuDemo.vue',['activePath','verticalPath','expandedMenus','showcaseOpenKeys','codeString']);
  const ref=shallowRef<{activePath:string[];verticalPath:string[];expandedMenus:string[];showcaseOpenKeys:string[];codeString:string}>();
  const host=document.createElement('div');document.body.append(host);
  const app=createApp({render:()=>h(MenuDemo,{ref})});app.config.warnHandler=()=>{};app.mount(host);
  ref.value!.activePath=['2-1'];ref.value!.expandedMenus=['2'];await wait();
  assert.deepEqual(ref.value!.verticalPath,['1']);
  assert.deepEqual(ref.value!.showcaseOpenKeys,[]);
  assert.ok(ref.value!.codeString.includes('shallowRef(["2-1"])'));
  const {descriptor,errors}=parse(ref.value!.codeString);
  assert.deepEqual(errors,[]);
  assert.doesNotThrow(()=>compileScript(descriptor,{id:'generated-menu',inlineTemplate:true}));
  app.unmount();host.remove();
});

it('云同步封装把服务注入的按钮 loading 传给内部 Dialog',async()=>{
  const Cloud=await loadDemo('app/components/reborn/examples/reborn-dialog/dialogs/CloudSyncDialog.vue',[]);
  const host=document.createElement('div');document.body.append(host);
  const app=createApp({render:()=>h(Cloud,{open:true,confirmBtn:{loading:true}})});app.config.warnHandler=()=>{};app.mount(host);
  assert.equal(host.querySelector('[data-loading]')?.getAttribute('data-loading'),'true');
  app.unmount();host.remove();
});

it('旧服务导出与旧组合式包装已移除，业务和测试继续使用真实模块路径',()=>{
  const source=readFileSync('app/composables/useLoading.ts','utf8');
  assert.doesNotMatch(source,/export\s+(?:const|function)\s+useLoading\b/);
  assert.match(source,/export function showLoading\b/);
  assert.equal(existsSync('app/utils/isRootPage.ts'),false);
});

it('服务式加载流程在演示卸载时中止，遮罩立即开始关闭且后续不再追加日志',async()=>{
  const LoadingDemo=await loadDemo('app/components/reborn/examples/reborn-loading/RebornLoadingDirectiveDemo.vue',['runPublishFlow','pushLog','serviceLogs']);
  const ref=shallowRef<{runPublishFlow:()=>Promise<void>;pushLog:(text:string)=>void;serviceLogs:{id:number;msg:string}[]}>();
  const host=document.createElement('div');document.body.append(host);
  const app=createApp({render:()=>h(LoadingDemo,{ref})});app.config.warnHandler=()=>{};
  const Box=defineComponent({setup(_, {slots}){return()=>h('div',slots.default?.());}});
  for(const name of ['Playground','DemoSection','DemoBlock','DemoNote','RebornButton','Icon'])app.component(name,Box);
  app.mount(host);
  const api=ref.value!;
  for(let index=0;index<9;index++)api.pushLog(`同秒日志${index}`);
  assert.deepEqual(api.serviceLogs.map(log=>log.id),[3,4,5,6,7,8,9]);
  const run=api.runPublishFlow();await wait();
  assert.ok(document.querySelector('[data-e3-mask]')?.textContent?.includes('正在连接服务器'));
  app.unmount();host.remove();
  await run;
  const count=api.serviceLogs.length;
  await wait(500);
  assert.equal(document.querySelector('[data-e3-mask]'),null);
  assert.equal(api.serviceLogs.length,count);
  assert.ok(!api.serviceLogs.some(log=>log.msg.includes('上传资源')));
});

it('服务式加载流程成功结束时只关闭一次，遮罩先淡出再由兜底定时器销毁',async(context)=>{
  const LoadingDemo=await loadDemo('app/components/reborn/examples/reborn-loading/RebornLoadingDirectiveDemo.vue',['runPublishFlow','serviceLogs']);
  const ref=shallowRef<{runPublishFlow:()=>Promise<void>;serviceLogs:{id:number;msg:string;tone:string}[]}>();
  const host=document.createElement('div');document.body.append(host);
  const app=createApp({render:()=>h(LoadingDemo,{ref})});app.config.warnHandler=()=>{};
  const Box=defineComponent({setup(_, {slots}){return()=>h('div',slots.default?.());}});
  for(const name of ['Playground','DemoSection','DemoBlock','DemoNote','RebornButton','Icon'])app.component(name,Box);
  app.mount(host);
  // 只接管 setTimeout：演示的等待与 useLoading 的淡出兜底都走它，可以逐段推进而不必真实等待
  context.mock.timers.enable({apis:['setTimeout']});
  const flush=async()=>{for(let index=0;index<10;index++)await Promise.resolve();};
  const run=ref.value!.runPublishFlow();
  for(const ms of [900,900,900,1100]){context.mock.timers.tick(ms);await flush();}
  await run;
  assert.equal(ref.value!.serviceLogs.at(-1)?.tone,'success');
  // 二次 close() 会在同一帧直接销毁容器；只关一次时容器仍在，正处于淡出
  assert.ok(document.querySelector('[data-e3-mask]'),'成功路径关闭后遮罩应保留到淡出结束');
  context.mock.timers.tick(400);await flush();
  assert.equal(document.querySelector('[data-e3-mask]'),null);
  app.unmount();host.remove();
});

after(() => dom.window.close());
