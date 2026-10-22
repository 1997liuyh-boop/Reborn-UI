/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = process.env.MOTION_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 使用真实 Vue、Motion 与 Tailwind，验证进出动画、列表补位及虚拟行的即时回收。 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import Toast from '~/components/reborn/ui/reborn-toast/RebornToast.vue';
        import Notification from '~/components/reborn/ui/reborn-notification/RebornNotification.vue';
        import Draggable from '~/components/reborn/ui/reborn-draggable/RebornDraggable.vue';
        import Tree from '~/components/reborn/ui/reborn-tree/RebornTree.vue';
        import Avatar from '~/components/reborn/ui/reborn-avatar/RebornAvatar.vue';
        import Group from '~/components/reborn/ui/reborn-avatar-group/RebornAvatarGroup.vue';
        import {addMessage,destroyMessages,messageState} from '~/components/reborn/ui/reborn-toast/reborn-toast.config';
        import {addNotification,destroyNotifications,notificationState} from '~/components/reborn/ui/reborn-notification/reborn-notification.config';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({items:[{label:'A'},{label:'B'},{label:'C'}],expanded:[],virtual:false,avatars:['A','B','C','D'],limit:3});
        const changes=[];
        window.listFixture={state,changes,flush:nextTick,toast:options=>{void addMessage({duration:0,...options})},clearToast:key=>destroyMessages(key),notification:options=>{addNotification({duration:0,...options})},clearNotification:key=>destroyNotifications(key),messageState,notificationState};
        const treeData=[{key:'parent',title:'父节点',children:Array.from({length:24},(_,index)=>({key:'child-'+index,title:'子节点'+index}))},{key:'tail',title:'末尾'}];
        const app=createApp({render:()=>h('main',[
          h(Toast),h(Notification),
          h('section',{class:'fixture-drag',style:'width:300px'},[h(Draggable,{modelValue:state.items,'onUpdate:modelValue':items=>state.items=items,onChange:items=>changes.push(items.map(item=>item.label))},{item:({item})=>h('div',{style:'height:40px;background:#eee'},item.label)})]),
          h('section',{class:'fixture-tree',style:'width:300px;margin-top:24px'},[h(Tree,{treeData,expandedKeys:state.expanded,virtual:state.virtual,height:state.virtual?84:undefined,animated:true,'onUpdate:expandedKeys':keys=>state.expanded=keys})]),
          h('section',{class:'fixture-group',style:'margin-top:24px'},[h(Group,{collapseAvatars:true,maxCollapseAvatars:state.limit},{default:()=>state.avatars.map(name=>h(Avatar,{key:name,alt:name},{default:()=>name}))})])
        ])});
        app.component('Icon',props=>h('svg',{'data-icon':props.name,viewBox:'0 0 24 24'}));
        app.component('RebornCheckbox',{render:()=>h('input',{type:'checkbox'})});
        app.mount('#app');
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'list-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'motion-list-browser', setup(builder) {
      builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'icons', namespace: 'fixture-icons' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture-icons' }, () => ({ contents: `import {h} from 'vue';export const Icon=props=>h('svg',{'data-icon':props.name,viewBox:'0 0 24 24'});`, loader: 'js', resolveDir: resolve('.') }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const sources = ['reborn-toast', 'reborn-notification', 'reborn-draggable', 'reborn-tree', 'reborn-avatar', 'reborn-avatar-group'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false }));
  const css = compiler.build(new Scanner({ sources }).scan());
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="margin:24px"><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ executablePath, headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

async function withLists(run: (page: Page) => Promise<void>, reducedMotion: 'reduce' | 'no-preference' = 'no-preference') {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, reducedMotion });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('.fixture-drag [draggable]').first().waitFor();
    await run(page);
    assert.deepEqual(errors, [], '真实组件不应抛出运行时异常');
  } finally { await page.close(); }
}

async function settle(page: Page) {
  await page.waitForTimeout(360);
}

it('消息进出有中间帧，移除首项后其余消息平滑补位，快速增删无残留', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    await page.evaluate(() => { const f = (window as any).listFixture; for (const key of ['A', 'B', 'C']) f.toast({ content: key, key }); });
    await page.waitForTimeout(70);
    const opacity = await page.locator('.reborn-message').first().evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(opacity > 0 && opacity < 1, `入场有中间透明度 ${opacity}`);
    await settle(page);
    const second = page.locator('.reborn-message').filter({ hasText: 'B' });
    const before = (await second.boundingBox())!.y;
    await page.evaluate(async () => { const f = (window as any).listFixture; f.clearToast('A'); await f.flush(); });
    await page.waitForTimeout(50);
    const during = (await second.boundingBox())!.y;
    await settle(page);
    const after = (await second.boundingBox())!.y;
    assert.ok(during > after + 1 && during < before, `补位应存在中间落点：${before} → ${during} → ${after}`);
    await page.evaluate(async () => { const f = (window as any).listFixture; f.clearToast(); await f.flush(); f.toast({ content: '最终消息', key: 'final' }); });
    await settle(page);
    assert.deepEqual(await page.locator('.reborn-message').allTextContents(), ['最终消息']);
    assert.equal(await page.locator('.reborn-message[style*="absolute"]').count(), 0, '离场占位全部回收');
  });
});

it('通知保留侧向入场与悬停暂停计时，离开后正常销毁', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    await page.evaluate(() => (window as any).listFixture.notification({ title: '暂停通知', message: '正文', key: 'pause', duration: 500, placement: 'top-end' }));
    const notice = page.locator('.reborn-notification');
    await notice.hover();
    await page.waitForTimeout(650);
    assert.equal(await notice.count(), 1, '悬停期间不被计时器移除');
    await page.mouse.move(600, 500);
    await page.waitForTimeout(850);
    assert.equal(await notice.count(), 0, '恢复后完成离场并销毁');
  });
});

it('六个方位的消息离场保持原位置，底部逆序栈不会向下跳动', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    for (const placement of ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end']) {
      await page.evaluate(({ placement }) => { const f = (window as any).listFixture; f.toast({ content: '离场项', key: 'leave', placement }); f.toast({ content: '保留项', key: 'keep', placement }); }, { placement });
      await settle(page);
      const removed = page.locator('.reborn-message').filter({ hasText: '离场项' });
      const before = (await removed.boundingBox())!.y;
      await page.evaluate(async () => { const f = (window as any).listFixture; f.clearToast('leave'); await f.flush(); });
      const during = (await removed.boundingBox())!.y;
      assert.ok(Math.abs(during - before) < 12, `${placement} 离场起点应保持：${before} → ${during}`);
      await page.evaluate(() => (window as any).listFixture.clearToast());
      await settle(page);
    }
  });
});

it('原生拖拽保持无业务 key 对象的 DOM 身份，顺序和事件继续正确', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    const items = page.locator('.fixture-drag [draggable]');
    await items.first().evaluate(element => { element.setAttribute('data-identity', 'A'); });
    await items.first().dispatchEvent('dragstart');
    await items.nth(2).dispatchEvent('dragenter');
    await items.nth(2).dispatchEvent('drop');
    await items.nth(2).dispatchEvent('dragend');
    await settle(page);
    assert.deepEqual(await items.allTextContents(), ['B', 'C', 'A']);
    assert.equal(await items.nth(2).getAttribute('data-identity'), 'A', '重排沿用原对象的节点');
    assert.deepEqual(await page.evaluate(() => (window as any).listFixture.changes), [['B', 'C', 'A']]);
    const style = await items.nth(2).evaluate(element => ({ transform: (element as HTMLElement).style.transform, translate: (element as HTMLElement).style.translate, contentScale: (element.firstElementChild as HTMLElement).style.scale }));
    assert.deepEqual(style, { transform: '', translate: '', contentScale: '' }, '拖拽结束无缩放或位移残留');
  });
});

it('拖拽相对原有 scale 抬升，保留内外层 transform，快速连续拖拽也能清理', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    const items = page.locator('.fixture-drag [draggable]');
    await items.first().evaluate(element => {
      const root = element as HTMLElement;
      const content = element.firstElementChild as HTMLElement;
      root.style.transform = 'rotate(2deg)';
      root.style.scale = '0.95';
      content.style.transform = 'translateX(7px)';
      content.style.scale = '0.9 1.1';
    });
    await items.first().dispatchEvent('dragstart');
    await page.waitForTimeout(70);
    const lifted = await items.first().evaluate(element => {
      const content = element.firstElementChild as HTMLElement;
      return { scale: getComputedStyle(content).scale.split(' ').map(Number), transform: content.style.transform };
    });
    assert.ok(lifted.scale[0]! > 0.9 && lifted.scale[0]! <= 0.9361, '横向缩放从原有值继续抬升');
    assert.ok(lifted.scale[1]! > 1.1 && lifted.scale[1]! <= 1.1441, '纵向缩放从原有值继续抬升');
    assert.equal(lifted.transform, 'translateX(7px)', '抬升不覆盖既有 transform');
    await items.first().dispatchEvent('dragend');
    // 第一项尚未结束时立刻拖第二项，清理回调必须各自生效。
    await items.nth(1).dispatchEvent('dragstart');
    await items.nth(1).dispatchEvent('dragend');
    await settle(page);
    const styles = await items.evaluateAll(elements => elements.map(element => {
      const root = element as HTMLElement;
      const content = element.firstElementChild as HTMLElement;
      return { transform: root.style.transform, scale: root.style.scale, contentTransform: content.style.transform, contentScale: content.style.scale };
    }));
    assert.deepEqual(styles[0], { transform: 'rotate(2deg)', scale: '0.95', contentTransform: 'translateX(7px)', contentScale: '0.9 1.1' });
    assert.deepEqual(styles[1], { transform: '', scale: '', contentTransform: '', contentScale: '' }, '第二项无新样式残留');
  });
});

it('普通树平滑展开；切到虚拟滚动时立即清理退出行，滚动不触发入场', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    await page.evaluate(async () => { const f = (window as any).listFixture; f.state.expanded = ['parent']; await f.flush(); });
    await page.waitForTimeout(55);
    const opacity = await page.locator('[data-key="child-0"]').evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(opacity > 0 && opacity < 1, '普通列表的新行有渐入');
    await settle(page);
    await page.evaluate(async () => { const f = (window as any).listFixture; f.state.expanded = []; await f.flush(); f.state.virtual = true; await f.flush(); });
    assert.equal(await page.locator('.fixture-tree [role="treeitem"]').count(), 2, '已在退出中的子节点同步销毁');
    await page.evaluate(async () => { const f = (window as any).listFixture; f.state.expanded = ['parent']; await f.flush(); });
    await page.locator('.fixture-tree [role="tree"]').evaluate(async element => { element.scrollTop = 280; element.dispatchEvent(new Event('scroll')); await new Promise(resolve => requestAnimationFrame(resolve)); });
    const rows = await page.locator('.fixture-tree [role="treeitem"]').evaluateAll(elements => elements.map(element => ({ opacity: getComputedStyle(element).opacity, position: getComputedStyle(element).position, animations: element.getAnimations().length })));
    assert.ok(rows.length < 26, '仅渲染虚拟切片');
    assert.ok(rows.every(row => row.opacity === '1' && row.position !== 'absolute' && row.animations === 0), '虚拟切片无进出动画或退出占位');
  });
});

it('头像成员增删与折叠计数保留重叠布局，动画结束后节点数量正确', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    const group = page.locator('.fixture-group [role="group"]');
    const before = (await group.boundingBox())!.width;
    await page.evaluate(async () => { const f = (window as any).listFixture; f.state.limit = 2; f.state.avatars.push('E'); await f.flush(); });
    await settle(page);
    assert.equal(await group.getByRole('img', { name: '另外 3 位成员' }).count(), 1);
    assert.equal(await group.locator('.reborn-avatar').count(), 3, '可见两名成员和一个计数头像');
    assert.ok((await group.boundingBox())!.width < before, '成员减少后容器收拢，未留空白');
    await page.evaluate(async () => { const f = (window as any).listFixture; f.state.limit = 5; await f.flush(); });
    await settle(page);
    assert.equal(await group.locator('.reborn-avatar').count(), 5);
    assert.equal(await group.locator('[aria-label^="另外"]').count(), 0);
  });
});

it('减少动态效果时所有列表立即更新，关闭消息没有退出占位', { skip: !browserAvailable }, async () => {
  await withLists(async (page) => {
    await page.evaluate(async () => { const f = (window as any).listFixture; f.toast({ content: '静态消息', key: 'reduce' }); f.notification({ title: '静态通知', key: 'reduce' }); f.state.expanded = ['parent']; await f.flush(); });
    assert.equal(await page.locator('.reborn-message').evaluate(element => getComputedStyle(element).opacity), '1');
    assert.equal(await page.locator('[data-key="child-0"]').evaluate(element => getComputedStyle(element).opacity), '1');
    await page.evaluate(async () => { const f = (window as any).listFixture; f.clearToast(); f.clearNotification(); f.state.expanded = []; await f.flush(); });
    assert.equal(await page.locator('.reborn-message,.reborn-notification').count(), 0);
    assert.equal(await page.locator('.fixture-tree [role="treeitem"]').count(), 2);
  }, 'reduce');
});
