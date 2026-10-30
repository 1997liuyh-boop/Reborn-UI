/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
let fixture: Promise<{ script: string; css: string }>;

/** 运行真实气泡、路由、缓存页面和动画，复现传送浮层跨页面残留。 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import Tooltip from '~/components/reborn/ui/reborn-tooltip/RebornTooltip.vue';
        import Popover from '~/components/reborn/ui/reborn-popover/RebornPopover.vue';
        import Popconfirm from '~/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue';
        import {createApp,h,KeepAlive,nextTick,reactive} from 'vue';
        import {createMemoryHistory,createRouter,RouterView} from 'vue-router';
        const params=new URLSearchParams(location.search);
        const Component=params.get('kind')==='tooltip'?Tooltip:params.get('kind')==='popconfirm'?Popconfirm:Popover;
        const state=reactive({mode:'click',open:false,showCached:true,mounted:true,modal:false,
          placement:undefined,arrow:undefined,sideOffset:undefined,content:undefined,ui:undefined,
          triggerStyle:undefined,triggerButtonStyle:undefined,contentStyle:{width:'168px',height:'60px'},closeDelay:120});
        const updates=[];
        const slots=scope=>({
          default:()=>h('button',{id:scope+'-trigger',style:state.triggerButtonStyle},scope+'触发器'),
          content:()=>h('p',{'data-popup':scope,style:state.contentStyle},'气泡内容'),
          title:()=>h('span',{'data-popup':scope},'确认操作')
        });
        const Cached={name:'CachedPopoverPage',render:()=>h(Component,{id:'cached'},slots('cached'))};
        const Empty={name:'EmptyPage',render:()=>h('p','其他页面')};
        const router=createRouter({history:createMemoryHistory(),routes:[
          {path:'/one',component:Cached},{path:'/two',component:Empty},{path:'/blocked',component:Empty}
        ]});
        router.beforeEach(to=>to.path==='/blocked'?false:undefined);
        window.popoverFixture={state,updates,flush:nextTick,navigate:async path=>{await router.push(path);await nextTick()}};
        const app=createApp({render:()=>state.mounted?h('main',{class:'flex flex-col gap-12 p-12'},[
          h(Component,{id:'persistent',style:state.triggerStyle,mode:state.mode,open:state.open,openDelay:300,closeDelay:state.closeDelay,
            placement:state.placement,arrow:state.arrow,sideOffset:state.sideOffset,content:state.content,ui:state.ui,
            modal:state.modal,dismissible:false,closeOnScroll:false,
            'onUpdate:open':value=>{state.open=value;updates.push(value)}
          },slots('persistent')),
          params.has('noRouter')?null:h(RouterView,null,{default:({Component:Page})=>h(KeepAlive,null,{
            default:()=>state.showCached?h(Page):h(Empty)
          })})
        ]):null});
        if(!params.has('noRouter')){app.use(router);await router.push('/one');await router.isReady()}
        app.mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'popover-navigation-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'popover-navigation', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/lib'), pattern: 'floating-arrow.ts', negated: false }, ...['reborn-tooltip', 'reborn-popover', 'reborn-popconfirm', 'reborn-button', 'reborn-transition'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false }))] });
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'flex', 'flex-col', 'gap-12', 'p-12', 'p-0']) };
}

async function withPopover(kind: string, run: (page: Page) => Promise<void>, noRouter = false) {
  fixture ??= buildFixture();
  const { script, css } = await fixture;
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
  });
  let browser;
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}/?kind=${kind}${noRouter ? '&noRouter' : ''}`);
    await page.locator('#persistent-trigger').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

async function navigate(page: Page, path: string) {
  await page.evaluate(path => (window as any).popoverFixture.navigate(path), path);
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    Object.assign((window as any).popoverFixture.state, value);
    await (window as any).popoverFixture.flush();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  }, value);
}

async function popupsClosed(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('[data-popup]').length === 0, undefined, { timeout: 1500 });
}

for (const kind of ['popover', 'popconfirm']) {
  it(`${kind} 常驻浮层在路径、查询或锚点改变后关闭，重复或取消导航保持展开`, { skip: !existsSync(executablePath) }, async () => {
    await withPopover(kind, async (page) => {
      for (const path of ['/two', '/two?source=popup', '/two?source=popup#details']) {
        await page.locator('#persistent-trigger').click();
        await page.locator('[data-popup="persistent"]').waitFor();
        const current = await page.evaluate(() => (window as any).popoverFixture.state.open);
        assert.equal(current, true);
        // 重复导航及守卫取消都没有离开当前页面，不应误关。
        if (path === '/two') {
          await navigate(page, '/one');
          await navigate(page, '/blocked');
          assert.equal(await page.locator('[data-popup="persistent"]').count(), 1);
        }
        await navigate(page, path);
        await popupsClosed(page);
        assert.equal(await page.evaluate(() => (window as any).popoverFixture.state.open), false);
      }
      assert.deepEqual(await page.evaluate(() => (window as any).popoverFixture.updates), [true, false, true, false, true, false]);
    });
  });

  it(`${kind} 缓存停用关闭传送浮层，重新激活和路由返回不恢复旧状态`, { skip: !existsSync(executablePath) }, async () => {
    await withPopover(kind, async (page) => {
      await page.locator('#cached-trigger').click();
      await page.locator('[data-popup="cached"]').waitFor();
      await configure(page, { showCached: false });
      await popupsClosed(page);
      await configure(page, { showCached: true });
      assert.equal(await page.locator('[data-popup]').count(), 0);
      await page.locator('#cached-trigger').click();
      await page.locator('[data-popup="cached"]').waitFor();
      await navigate(page, '/two');
      await popupsClosed(page);
      await navigate(page, '/one');
      assert.equal(await page.locator('[data-popup]').count(), 0);
      await page.locator('#cached-trigger').click();
      await page.locator('[data-popup="cached"]').waitFor();
      await configure(page, { mounted: false });
      await popupsClosed(page);
    });
  });

  it(`${kind} 在没有安装路由的 Vue 应用中仍能打开关闭`, { skip: !existsSync(executablePath) }, async () => {
    await withPopover(kind, async (page) => {
      await page.locator('#persistent-trigger').click();
      await page.locator('[data-popup="persistent"]').waitFor();
      await page.locator('#persistent-trigger').click();
      await popupsClosed(page);
    }, true);
  });
}

it('popover 导航取消待打开的悬停计时器，重新悬停后正常打开', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popover', async (page) => {
    await configure(page, { mode: 'hover' });
    await page.locator('#persistent').dispatchEvent('mouseenter');
    await navigate(page, '/two');
    await page.waitForTimeout(400);
    assert.equal(await page.locator('[data-popup]').count(), 0, '旧页面的悬停任务不能在新页面打开浮层');
    await page.locator('#persistent').dispatchEvent('mouseenter');
    await page.locator('[data-popup="persistent"]').waitFor();
    await page.locator('#persistent').dispatchEvent('mouseleave');
    await popupsClosed(page);
  });
});

it('popover 导航关闭遮罩并取消已打开气泡的待关闭悬停任务', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popover', async (page) => {
    await configure(page, { modal: true });
    await page.locator('#persistent-trigger').click();
    await page.locator('[data-popup="persistent"]').waitFor();
    await page.mouse.move(900, 600);
    await configure(page, { mode: 'hover' });
    await page.locator('#persistent').dispatchEvent('mouseleave');
    await navigate(page, '/two');
    assert.equal(await page.evaluate(() => (window as any).popoverFixture.state.open), false, '导航立即关闭，不等待悬停关闭延迟');
    await popupsClosed(page);
    assert.equal(await page.locator('.bg-black\\/30').count(), 0);
    await page.waitForTimeout(200);
    assert.deepEqual(await page.evaluate(() => (window as any).popoverFixture.updates), [true, false]);
  });
});

/** 读取实际布局，避免只核对类名而遗漏箭头露出高度或动画缩放造成的误差。 */
async function geometry(page: Page) {
  return page.locator('[data-popup="persistent"]').evaluate((element) => {
    const panel = element.parentElement!;
    const arrow = (panel.getAttribute('role') === 'tooltip' ? panel.parentElement! : panel).querySelector<HTMLElement>('[data-floating-arrow]');
    const style = getComputedStyle(panel);
    return {
      panel: panel.getBoundingClientRect().toJSON(), trigger: document.querySelector('#persistent-trigger')!.getBoundingClientRect().toJSON(),
      arrow: arrow ? arrow.getBoundingClientRect().toJSON() : null,
      border: style.borderTopWidth, radius: style.borderTopLeftRadius, padding: style.paddingTop,
      shadow: style.boxShadow, background: style.backgroundColor,
      arrowBackground: arrow ? getComputedStyle(arrow).backgroundColor : null,
    };
  });
}

function near(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) < 0.5, `${message}：${actual}，预期 ${expected}`);
}

for (const kind of ['popover', 'tooltip', 'popconfirm']) {
  it(`${kind} 四个侧向起止方位的箭头随触发器高度居中，翻转后仍保持指向`, { skip: !existsSync(executablePath) }, async () => {
    await withPopover(kind, async (page) => {
      await configure(page, { open: true, arrow: true, placement: 'left-start', triggerStyle: { position: 'fixed', left: '500px', top: '300px' } });
      await page.locator('[data-popup="persistent"]').waitFor();
      await page.waitForTimeout(250);
      for (const height of [24, 32, 64]) {
        for (const placement of ['left-start', 'left-end', 'right-start', 'right-end']) {
          await configure(page, { placement, triggerButtonStyle: { height: `${height}px` } });
          await page.waitForTimeout(40);
          const arrow = await page.locator('[data-floating-arrow]').boundingBox();
          const trigger = await page.locator('#persistent-trigger').boundingBox();
          assert.ok(arrow && trigger);
          near(arrow.y + arrow.height / 2, trigger.y + trigger.height / 2, `${placement} 高度 ${height}px 对准触发器中心`);
        }
      }
      for (const side of ['left', 'right']) {
        for (const align of ['start', 'end']) {
          await configure(page, {
            placement: `${side}-${align}`,
            triggerButtonStyle: { height: '32px' },
            triggerStyle: { position: 'fixed', [side]: '2px', top: '6px' },
          });
          await page.waitForTimeout(40);
          const arrow = await page.locator('[data-floating-arrow]').boundingBox();
          const trigger = await page.locator('#persistent-trigger').boundingBox();
          assert.ok(arrow && trigger);
          near(arrow.y + arrow.height / 2, trigger.y + trigger.height / 2, `${side}-${align} 翻转与贴边后仍对准中心`);
          near(side === 'left' ? arrow.x - trigger.x - trigger.width : trigger.x - arrow.x - arrow.width, 4, '翻转后保持 4px 尖端间距');
        }
      }
    }, true);
  });
}

it('popover 十二方位保持 4px 可见间距，侧向箭头指向触发器中心且面板无描边', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popover', async (page) => {
    await configure(page, { open: true, arrow: true, triggerStyle: { position: 'fixed', left: '500px', top: '300px' } });
    await page.locator('[data-popup="persistent"]').waitFor();
    await page.waitForTimeout(250);
    for (const side of ['top', 'bottom', 'left', 'right']) {
      for (const align of ['center', 'start', 'end']) {
        await configure(page, { placement: align === 'center' ? side : `${side}-${align}` });
        await page.waitForTimeout(40);
        const { panel, trigger, arrow, ...style } = await geometry(page);
        assert.ok(arrow);
        const vertical = side === 'top' || side === 'bottom';
        near(arrow.width, vertical ? 17.5 : 7, '箭头宽度');
        near(arrow.height, vertical ? 7 : 17.5, '箭头高度');
        const overlap = side === 'top' ? panel.bottom - arrow.top
          : side === 'bottom' ? arrow.bottom - panel.top
            : side === 'left' ? panel.right - arrow.left : arrow.right - panel.left;
        near(overlap, 2, `${side}-${align} 箭头根部嵌入面板`);
        const gap = side === 'top' ? trigger.top - arrow.bottom
          : side === 'bottom' ? arrow.top - trigger.bottom
            : side === 'left' ? trigger.left - arrow.right : arrow.left - trigger.right;
        near(gap, 4, `${side}-${align} 箭头尖端间距`);
        const arrowCenter = vertical ? arrow.left + arrow.width / 2 : arrow.top + arrow.height / 2;
        const panelStart = vertical ? panel.left : panel.top;
        const panelEnd = vertical ? panel.right : panel.bottom;
        const triggerCenter = vertical ? trigger.left + trigger.width / 2 : trigger.top + trigger.height / 2;
        near(arrowCenter, !vertical || align === 'center' ? triggerCenter : align === 'start' ? panelStart + 25 : panelEnd - 25, '箭头中心');
        assert.equal(style.border, '0px');
        assert.equal(style.radius, '8px');
        assert.equal(style.padding, '12px');
        assert.equal(style.background, style.arrowBackground);
        assert.match(style.shadow, /rgba\(0, 0, 0, 0\.15\) 0px 2px 12px 0px/);
        if (process.env.REBORN_POPOVER_SCREENSHOT && align === 'center') {
          await page.screenshot({ path: `${process.env.REBORN_POPOVER_SCREENSHOT}-${side}.png` });
        }
      }
    }
    // 关闭箭头后定位应立即回到面板边缘与触发器相距 4px。
    await configure(page, { placement: 'bottom', arrow: false });
    await page.waitForTimeout(40);
    const result = await geometry(page);
    assert.equal(result.arrow, null);
    near(result.panel.top - result.trigger.bottom, 4, '无箭头间距');
  });
});

it('popover 保留零间距与旧写法优先级，窄面板箭头居中，并在视口边缘翻转', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popover', async (page) => {
    await configure(page, { open: true, arrow: true, content: { side: 'left', sideOffset: 9 }, triggerStyle: { position: 'fixed', left: '500px', top: '300px' } });
    await page.locator('[data-popup="persistent"]').waitFor();
    await page.waitForTimeout(250);
    let result = await geometry(page);
    near(result.trigger.left - result.arrow!.right, 9, '旧写法间距');
    await configure(page, { placement: 'bottom-start', sideOffset: 0, ui: { content: 'p-0' }, contentStyle: { width: '16px', height: '16px' } });
    await page.waitForTimeout(40);
    result = await geometry(page);
    near(result.arrow!.top - result.trigger.bottom, 0, '显式零间距优先');
    near(result.arrow!.left + result.arrow!.width / 2 - result.panel.left, 8, '窄面板箭头居中');
    await configure(page, { placement: 'bottom', sideOffset: 4, ui: undefined, contentStyle: { width: '168px', height: '60px' }, triggerStyle: { position: 'fixed', left: '500px', bottom: '0px' } });
    await page.waitForTimeout(40);
    result = await geometry(page);
    assert.ok(result.panel.bottom < result.trigger.top, '底部空间不足时翻到上方');
    near(result.trigger.top - result.arrow!.bottom, 4, '翻转后仍保持尖端间距');
  });
});

it('popover 悬停桥覆盖箭头和 4px 间隙，零关闭延迟时仍能进入面板', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popover', async (page) => {
    await configure(page, { mode: 'hover', arrow: true, closeDelay: 0, triggerStyle: { position: 'fixed', left: '500px', top: '300px' } });
    for (const side of ['top', 'bottom', 'left', 'right']) {
      await configure(page, { placement: side });
      await page.locator('#persistent-trigger').hover();
      await page.locator('[data-popup="persistent"]').waitFor();
      await page.waitForTimeout(250);
      const { trigger, panel } = await geometry(page);
      const x = side === 'left' ? trigger.left - 2 : side === 'right' ? trigger.right + 2 : trigger.left + trigger.width / 2;
      const y = side === 'top' ? trigger.top - 2 : side === 'bottom' ? trigger.bottom + 2 : trigger.top + trigger.height / 2;
      await page.mouse.move(x, y);
      await page.waitForTimeout(40);
      assert.equal(await page.locator('[data-popup="persistent"]').count(), 1, `${side} 间隙不能关闭`);
      await page.mouse.move(panel.left + panel.width / 2, panel.top + panel.height / 2);
      await page.waitForTimeout(40);
      assert.equal(await page.locator('[data-popup="persistent"]').count(), 1, `${side} 面板可进入`);
      await page.mouse.move(1000, 650);
      await popupsClosed(page);
    }
  });
});

it('popconfirm 十二方位保持 4px 可见间距和多层阴影', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('popconfirm', async (page) => {
    await configure(page, { open: true, triggerStyle: { position: 'fixed', left: '500px', top: '300px' } });
    await page.locator('[data-popup="persistent"]').waitFor();
    await page.waitForTimeout(250);
    for (const side of ['top', 'bottom', 'left', 'right']) {
      for (const align of ['center', 'start', 'end']) {
        await configure(page, { placement: align === 'center' ? side : `${side}-${align}` });
        await page.waitForTimeout(40);
        const result = await page.locator('[data-popup="persistent"]').evaluate((element) => {
          const panel = element.closest('[class*="shadow-"]')!;
          return {
            arrow: panel.querySelector('[data-floating-arrow]')!.getBoundingClientRect().toJSON(),
            trigger: document.querySelector('#persistent-trigger')!.getBoundingClientRect().toJSON(),
            shadow: getComputedStyle(panel).boxShadow,
          };
        });
        const { arrow, trigger } = result;
        const gap = side === 'top' ? trigger.top - arrow.bottom
          : side === 'bottom' ? arrow.top - trigger.bottom
            : side === 'left' ? trigger.left - arrow.right : arrow.left - trigger.right;
        near(gap, 4, `Popconfirm ${side}-${align} 尖端间距`);
        if (side === 'left' || side === 'right') near(arrow.top + arrow.height / 2, trigger.top + trigger.height / 2, `Popconfirm ${side}-${align} 箭头指向触发器中心`);
        assert.match(result.shadow, /0px 0px 8px 0px/);
        assert.match(result.shadow, /0px 8px 24px 0px/);
      }
    }
  });
});

it('tooltip 十二方位与气泡、下拉共用曲线，长短边比例始终为 2.5:1', { skip: !existsSync(executablePath) }, async () => {
  await withPopover('tooltip', async (page) => {
    await configure(page, { open: true, arrow: true, triggerStyle: { position: 'fixed', left: '500px', top: '300px' } });
    await page.locator('[role="tooltip"]').waitFor();
    await page.waitForTimeout(250);
    for (const side of ['top', 'bottom', 'left', 'right']) {
      for (const align of ['center', 'start', 'end']) {
        await configure(page, { placement: align === 'center' ? side : `${side}-${align}` });
        await page.waitForTimeout(40);
        const { arrow, trigger, panel } = await geometry(page);
        assert.ok(arrow);
        const vertical = side === 'top' || side === 'bottom';
        near(arrow.width, vertical ? 17.5 : 7, '箭头宽度');
        near(arrow.height, vertical ? 7 : 17.5, '箭头高度');
        const gap = side === 'top' ? trigger.top - arrow.bottom
          : side === 'bottom' ? arrow.top - trigger.bottom
            : side === 'left' ? trigger.left - arrow.right : arrow.left - trigger.right;
        near(gap, 4, `Tooltip ${side}-${align} 尖端间距`);
        if (!vertical) near(arrow.top + arrow.height / 2, trigger.top + trigger.height / 2, `Tooltip ${side}-${align} 箭头指向触发器中心`);
        const overlap = side === 'top' ? panel.bottom - arrow.top
          : side === 'bottom' ? arrow.bottom - panel.top
            : side === 'left' ? panel.right - arrow.left : arrow.right - panel.left;
        near(overlap, 2, 'Tooltip 箭头根部嵌入面板');
        const mask = await page.locator('[data-floating-arrow]').evaluate(el => getComputedStyle(el).maskImage);
        assert.match(mask, /data:image\/svg\+xml/, '应使用共用 SVG 曲线遮罩');
      }
    }
  }, true);
});
