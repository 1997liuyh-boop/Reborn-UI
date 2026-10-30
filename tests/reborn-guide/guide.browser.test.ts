/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = process.env.GUIDE_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);

/** 编译真实引导和按钮，只有图标替换为本地字符，避免测试依赖图标网络。 */
async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import Guide from '~/components/reborn/ui/reborn-guide/RebornGuide.vue';
        import Button from '~/components/reborn/ui/reborn-button/RebornButton.vue';
        import {createApp,defineComponent,h,markRaw,nextTick,reactive,ref} from 'vue';
        const query=new URLSearchParams(location.search);
        const uncontrolled=query.has('default');
        const stickyLayout=query.has('sticky');
        if(stickyLayout)document.body.style.overflow='visible';
        const state=reactive({current:-1,defaultCurrent:Number(query.get('default')||-1),steps:[
          {element:'#target',title:'认识面板',body:'引导内容'},
          {element:'#target',title:'下一项',body:'第二步内容'},
        ],ui:{guideBox:'fixture-panel',dialogBox:'fixture-panel',guideArrow:'fixture-arrow',counter:'fixture-counter',buttonGroup:'fixture-buttons',guideTitle:'fixture-title',guideBody:'fixture-body',guideFooter:'fixture-footer',closeRow:'fixture-close-row',cover:'fixture-cover',indicators:'fixture-dots',indicatorDot:'fixture-dot'}});
        const mounted=ref(true);const guide=ref();const events=[];let targetClicks=0;
        const custom=markRaw(defineComponent({props:['step','current','total','next','prev','finish','close','message'],setup:props=>()=>h('section',{'data-custom-step':''},[
          h('strong',props.message+' '+props.current+'/'+props.total+' '+props.step.title),
          h('button',{onClick:props.next},'自定义继续'),h('button',{onClick:props.close},'自定义关闭')
        ])}));
        const fixture={
          configure:value=>Object.assign(state,value),
          custom:()=>{state.steps=[{element:'#target',title:'自定义步骤',body:'不应显示默认正文',component:custom,componentProps:{message:'组件内容'}},{element:'#target',title:'普通步骤',body:'恢复默认内容'}];state.current=0;},
          unmount:()=>{mounted.value=false;},next:()=>guide.value?.next(),close:()=>guide.value?.close(),getCurrent:()=>state.current,flush:nextTick,events,getClicks:()=>targetClicks,
        };window.guideFixture=fixture;
        const app=createApp({render(){const props={...state};if(uncontrolled)delete props.current;return h('main',[
          stickyLayout?h('header',{style:'height:72px'},'文档页顶部'):null,
          h('div',{style:stickyLayout?'display:grid;grid-template-columns:180px minmax(0,1fr) 180px;gap:32px;margin:0 32px;align-items:start':'display:contents'},[
          stickyLayout?h('aside',{id:'left-sidebar',style:'position:sticky;top:96px;height:400px;background:#eee'},'左侧导航'):null,
          h('article',[
          h('div',{style:'height:1400px'},'可滚动页面'),
          h('button',{id:'target',style:'display:block;width:160px;height:64px;margin:auto;border:2px solid black',onClick:()=>targetClicks++},'受保护目标'),
          stickyLayout?h('div',{style:'height:600px'}):null,
          stickyLayout?h('button',{id:'second-target',style:'display:block;width:160px;height:64px;margin:auto;border:2px solid black'},'第二个目标'):null,
          h('div',{style:'height:1600px'}),
          h('div',{id:'nested',tabindex:0,style:'position:fixed;top:24px;left:24px;width:120px;height:100px;overflow:auto;background:#ddd'},[
            h('div',{style:'height:600px'},'嵌套滚动'),h('button',{id:'nested-target'},'嵌套目标'),h('div',{style:'height:600px'})
          ]),
          mounted.value?h(Guide,{...props,ref:guide,...(uncontrolled?{}:{'onUpdate:current':value=>state.current=value}),onChange:(current,context)=>events.push({type:'change',current,total:context?.total}),onFinish:context=>events.push({type:'finish',current:context.current,total:context.total}),onClose:context=>events.push({type:'close',current:context.current,total:context.total})}):null
          ]),
          stickyLayout?h('aside',{id:'right-sidebar',style:'position:sticky;top:96px;height:360px;background:#eee'},'右侧目录'):null,
          ])
        ])}});
        app.component('RebornButton',Button);app.component('Icon',{render:()=>h('span',{'aria-hidden':true},'×')});app.mount('#app');
      `,
      sourcefile: 'guide-fixture.ts', loader: 'ts', resolveDir: resolve('.'),
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') }, define: { 'import.meta.client': 'true' },
    plugins: [{ name: 'guide-test', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';@import './app/assets/theme/motion.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: ['reborn-guide', 'reborn-button', 'reborn-loading'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  return { script: result.outputFiles[0]!.text, css: compiler.build(scanner.scan()) };
}

async function withGuide(run: (page: Page) => Promise<void>, query = '') {
  const { script, css } = await buildFixture();
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="overflow:auto"><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
  });
  let browser;
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    page.setDefaultTimeout(3500);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}${query}`);
    await page.locator('#target').waitFor({ state: 'attached' });
    await run(page);
    assert.deepEqual(errors, [], '真实组件运行不应抛出错误');
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

async function configure(page: Page, props: Record<string, unknown>) {
  await page.evaluate(value => (window as any).guideFixture.configure(value), props);
  await page.evaluate(() => (window as any).guideFixture.flush());
  await page.waitForTimeout(300);
  await page.waitForFunction(() => {
    const panel = document.querySelector<HTMLElement>('.fixture-panel');
    if (!panel) return true;
    const style = getComputedStyle(panel);
    return style.visibility === 'visible' && Number(style.opacity) === 1
      && panel.getAnimations().every(animation => animation.playState !== 'running');
  });
}

/** 每帧读取实际渲染值，避免只断言类名而漏掉未生效的过渡。 */
async function sampleStepTransition(page: Page, current: number) {
  return page.evaluate(async (index) => {
    const fixture = (window as any).guideFixture;
    const samples: Array<{ title: string; counter: string; opacity: number; offset: number; visibility: string }> = [];
    fixture.configure({ current: index });
    await fixture.flush();
    const start = performance.now();
    while (performance.now() - start < 500) {
      await new Promise(requestAnimationFrame);
      const panel = document.querySelector<HTMLElement>('.fixture-panel');
      if (!panel) continue;
      const style = getComputedStyle(panel);
      const rect = panel.getBoundingClientRect();
      samples.push({
        title: panel.querySelector('h3')?.textContent ?? '',
        counter: panel.querySelector('.fixture-counter')?.textContent?.replace(/\s/g, '') ?? '',
        opacity: Number(style.opacity),
        offset: Math.hypot(rect.left - Number.parseFloat(style.left), rect.top - Number.parseFloat(style.top)),
        visibility: style.visibility,
      });
    }
    return samples;
  }, current);
}

it('打开时目标居中且不可激活，锁定页面和嵌套滚动，关闭后恢复', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    const original = await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText }));
    await configure(page, { current: 0 });
    await page.locator('.fixture-panel').waitFor();
    const target = (await page.locator('#target').boundingBox())!;
    assert.ok(Math.abs(target.y + target.height / 2 - 400) < 2, '激活目标滚动到视口中央');
    const before = await page.evaluate(() => ({ page: scrollY, nested: document.querySelector('#nested')!.scrollTop }));
    await page.mouse.move(85, 75);
    await page.mouse.wheel(0, 400);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(150);
    assert.deepEqual(await page.evaluate(() => ({ page: scrollY, nested: document.querySelector('#nested')!.scrollTop })), before, '滚轮和键盘不能滚动背景');
    await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
    await page.locator('#target').evaluate(element => element.focus());
    assert.notEqual(await page.evaluate(() => document.activeElement?.id), 'target', '高亮目标不能获得键盘焦点');
    assert.equal(await page.evaluate(() => (window as any).guideFixture.getClicks()), 0, '高亮目标不能通过鼠标或键盘激活');
    await page.getByRole('button', { name: '关闭引导', exact: true }).click();
    await page.locator('.fixture-panel').waitFor({ state: 'hidden' });
    assert.deepEqual(await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText })), original, '关闭还原原始页面样式');
    await page.mouse.move(85, 75);
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(150);
    assert.ok(await page.locator('#nested').evaluate(element => element.scrollTop > 0), '关闭后嵌套容器恢复滚动');
    await page.locator('#target').click();
    assert.equal(await page.evaluate(() => (window as any).guideFixture.getClicks()), 1, '关闭后恢复目标交互');
  });
});

it('children 与 chidren 按父子顺序展开并继承目标，计数和步骤按钮同步', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    await configure(page, { current: 0, steps: [
      { element: '#target', title: '父步骤', body: '父内容', nextButtonProps: { label: '查看子步骤' }, children: [
        { title: '子步骤', body: '子内容', prevButtonProps: { label: '返回父步骤' }, chidren: [{ title: '孙步骤', body: '孙内容' }] },
      ] },
      { element: '#target', title: '末步骤', body: '末内容' },
    ] });
    assert.equal((await page.locator('.fixture-counter').textContent())?.replace(/\s/g, ''), '1/4');
    await page.getByRole('button', { name: '查看子步骤', exact: true }).click();
    await page.getByRole('heading', { name: '子步骤', exact: true }).waitFor();
    assert.equal((await page.locator('.fixture-counter').textContent())?.replace(/\s/g, ''), '2/4');
    assert.ok(await page.locator('.fixture-arrow').isVisible(), '子步骤继承父步骤目标');
    await page.getByRole('button', { name: '返回父步骤', exact: true }).click();
    await page.getByRole('heading', { name: '父步骤', exact: true }).waitFor();
    await page.getByRole('button', { name: '查看子步骤', exact: true }).click();
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('heading', { name: '孙步骤', exact: true }).waitFor();
    assert.equal((await page.locator('.fixture-counter').textContent())?.replace(/\s/g, ''), '3/4');
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('heading', { name: '末步骤', exact: true }).waitFor();
    await page.getByRole('button', { name: '完成', exact: true }).click();
    await page.locator('.fixture-panel').waitFor({ state: 'hidden' });
    assert.deepEqual(await page.evaluate(() => (window as any).guideFixture.events.filter((event: any) => event.type === 'finish')), [{ type: 'finish', current: 3, total: 4 }]);
  });
});

it('面板样式、点状步骤及四方向定位满足规范，箭头与目标相距 8px', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    await configure(page, { current: 0, indicator: 'dots' });
    const style = await page.locator('.fixture-panel').evaluate(element => {
      const value = getComputedStyle(element);
      return { radius: value.borderRadius, padding: value.padding, shadow: value.boxShadow };
    });
    assert.equal(style.radius, '8px');
    assert.equal(style.padding, '16px');
    assert.equal(style.shadow.replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px, /g, ''), 'rgba(0, 0, 0, 0.15) 0px 2px 12px 0px');
    assert.equal(await page.locator('.fixture-title').evaluate(element => getComputedStyle(element).fontSize), '14px');
    assert.equal(await page.locator('.fixture-title').evaluate(element => getComputedStyle(element).fontWeight), '500');
    assert.equal(await page.locator('.fixture-body').evaluate(element => getComputedStyle(element).fontSize), '14px');
    assert.equal(await page.locator('.fixture-buttons button').first().evaluate(element => element.getBoundingClientRect().height), 24);
    assert.equal(await page.locator('.fixture-footer').evaluate(element => getComputedStyle(element).gap), '8px');
    assert.equal(await page.getByRole('button', { name: '关闭引导', exact: true }).locator('svg').evaluate(element => element.getBoundingClientRect().width), 20);
    const dots = await page.locator('.fixture-dot').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height };
    }));
    assert.deepEqual(dots, [{ width: 10, height: 6 }, { width: 6, height: 6 }]);
    assert.equal(await page.locator('.fixture-dots').evaluate(element => getComputedStyle(element).gap), '8px');
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('heading', { name: '下一项', exact: true }).waitFor();
    assert.deepEqual(await page.locator('.fixture-dot').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)), [6, 10], '切换后激活点同步移动');
    for (const placement of ['top', 'bottom', 'left', 'right']) {
      await configure(page, { current: 0, steps: [{ element: '#target', title: '定位验证', body: '面板内容', placement, highlightPadding: 24 }] });
      const target = (await page.locator('#target').boundingBox())!;
      const panel = (await page.locator('.fixture-panel').boundingBox())!;
      const arrow = (await page.locator('.fixture-arrow').boundingBox())!;
      const gap = placement === 'top' ? target.y - (panel.y + panel.height) : placement === 'bottom' ? panel.y - (target.y + target.height) : placement === 'left' ? target.x - (panel.x + panel.width) : panel.x - (target.x + target.width);
      const arrowGap = placement === 'top' ? target.y - (arrow.y + arrow.height) : placement === 'bottom' ? arrow.y - (target.y + target.height) : placement === 'left' ? target.x - (arrow.x + arrow.width) : arrow.x - (target.x + target.width);
      assert.ok(Math.abs(gap - (6 * Math.SQRT2 + 8)) < 0.5, `${placement} 面板间距包含箭头和 8px 间隙，实际间距 ${gap}`);
      assert.ok(Math.abs(arrowGap - 8) < 0.5, `${placement} 箭头与目标应相距 8px，实际间距 ${arrowGap}`);
    }
  });
});

it('整体组件替换获得上下文和导航动作，缺失目标退回屏幕中心', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    await page.evaluate(() => (window as any).guideFixture.custom());
    await page.getByText('组件内容 1/2 自定义步骤', { exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: '自定义步骤', exact: true }).count(), 0, '自定义组件替换整步内容');
    assert.equal(await page.getByText('不应显示默认正文', { exact: true }).count(), 0);
    await page.getByRole('button', { name: '自定义继续', exact: true }).click();
    await page.getByRole('heading', { name: '普通步骤', exact: true }).waitFor();
    await page.getByRole('button', { name: '上一步', exact: true }).click();
    await page.getByRole('button', { name: '自定义关闭', exact: true }).click();
    await page.locator('.fixture-panel').waitFor({ state: 'hidden' });
    await configure(page, { current: 0, steps: [{ element: '#missing', title: '目标不存在', body: '仍可关闭' }] });
    const box = (await page.locator('.fixture-panel').boundingBox())!;
    assert.ok(Math.abs(box.x + box.width / 2 - 600) <= 1);
    assert.ok(Math.abs(box.y + box.height / 2 - 400) <= 1);
    assert.equal(await page.locator('.fixture-arrow').count(), 0);
    await page.getByRole('button', { name: '关闭引导', exact: true }).click();
    await page.locator('.fixture-panel').waitFor({ state: 'hidden' });
  });
});

it('defaultCurrent 首次挂载生效，无遮罩也保护目标，卸载恢复锁定与焦点能力', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    await page.getByRole('heading', { name: '下一项', exact: true }).waitFor();
    assert.equal((await page.locator('.fixture-counter').textContent())?.replace(/\s/g, ''), '2/2');
    await configure(page, { showOverlay: false });
    const box = (await page.locator('#target').boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    assert.equal(await page.evaluate(() => (window as any).guideFixture.getClicks()), 0);
    await page.evaluate(() => (window as any).guideFixture.unmount());
    await page.locator('.fixture-panel').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'auto');
    await page.locator('#target').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => (window as any).guideFixture.getClicks()), 1);
    const before = await page.evaluate(() => scrollY);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(250);
    assert.ok(await page.evaluate(() => scrollY) > before, '卸载后键盘恢复页面滚动');
  }, '?default=1');
});

it('页面左右 sticky 侧栏在打开、切步、关闭与卸载后保持位置和宽度', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    const sidebars = page.locator('#left-sidebar, #right-sidebar');
    const readSidebars = () => sidebars.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { id: element.id, x: rect.x, top: rect.top, width: rect.width };
    }));
    // 先进入已吸顶状态，再打开引导；避免把普通文档流位置当成 sticky 行为。
    await page.locator('#target').evaluate(element => element.scrollIntoView({ block: 'center' }));
    const original = await readSidebars();
    assert.deepEqual(original.map(element => element.top), [96, 96], '左右侧栏初始应相对视口吸顶');
    const originalStyles = await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText }));
    await configure(page, { current: 0, steps: [
      { element: '#target', title: '第一个目标', body: '保持左右导航位置' },
      { element: '#second-target', title: '第二个目标', body: '切步后仍保持导航位置' },
    ] });
    await page.locator('.fixture-panel').waitFor();
    assert.deepEqual(await readSidebars(), original, '打开引导不得改变 sticky 侧栏的定位参照或宽度');
    const firstScroll = await page.evaluate(() => scrollY);
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('heading', { name: '第二个目标', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => scrollY) > firstScroll, '切步确实滚动到另一目标');
    assert.deepEqual(await readSidebars(), original, '切换步骤后左右侧栏保持吸顶');
    await page.getByRole('button', { name: '关闭引导', exact: true }).click();
    await page.locator('.fixture-panel').waitFor({ state: 'hidden' });
    assert.deepEqual(await readSidebars(), original, '关闭后侧栏位置保持稳定');
    assert.deepEqual(await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText })), originalStyles, '关闭恢复原始滚动样式');
    await configure(page, { current: 0 });
    assert.deepEqual(await readSidebars(), original, '重新打开时侧栏不发生位移');
    await page.evaluate(() => (window as any).guideFixture.unmount());
    await page.locator('.fixture-panel').waitFor({ state: 'hidden' });
    assert.deepEqual(await readSidebars(), original, '卸载后侧栏位置保持稳定');
    assert.deepEqual(await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText })), originalStyles, '卸载恢复原始滚动样式');
  }, '?sticky=1');
});

it('步骤切换让旧内容先退出、新内容再进入，结束后仍准确贴合目标边缘', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    await configure(page, { current: 0, steps: [
      { element: '#target', title: '动画第一步', body: '旧内容', placement: 'bottom' },
      { element: '#second-target', title: '动画第二步', body: '新内容', placement: 'top' },
    ] });
    const samples = await sampleStepTransition(page, 1);
    const outgoing = samples.filter(sample => sample.title === '动画第一步' && sample.visibility === 'visible' && sample.opacity > 0 && sample.opacity < 0.99);
    const incoming = samples.filter(sample => sample.title === '动画第二步' && sample.visibility === 'visible' && sample.opacity > 0 && sample.opacity < 0.99);
    assert.ok(outgoing.length > 0, '旧内容应实际经历淡出，不应立即被新标题替换');
    assert.ok(incoming.length > 0, '新内容定位后应实际经历淡入');
    assert.ok(outgoing.every(sample => sample.counter === '1/2'), '旧面板退出时保留与内容一致的步骤编号');
    assert.ok(incoming.every(sample => sample.counter === '2/2'), '新面板进入时更新步骤编号');
    assert.ok([...outgoing, ...incoming].some(sample => sample.offset > 0.25), '过渡中应存在真实的轻微位移');
    const firstNew = samples.findIndex(sample => sample.title === '动画第二步');
    assert.ok(firstNew > 0);
    assert.ok(samples.slice(firstNew).every(sample => sample.title === '动画第二步'), '新内容进入后旧内容不能再次出现');
    assert.equal(samples.at(-1)?.opacity, 1);
    assert.ok(samples.at(-1)!.offset < 0.1, '过渡结束后不得遗留位移');
    const target = (await page.locator('#second-target').boundingBox())!;
    const panel = (await page.locator('.fixture-panel').boundingBox())!;
    const arrow = (await page.locator('.fixture-arrow').boundingBox())!;
    assert.ok(Math.abs(target.y + target.height / 2 - 400) < 2, '新目标完成居中');
    assert.ok(panel.y + panel.height < target.y, '新面板应位于目标上方且不覆盖目标');
    assert.ok(Math.abs(target.y - (arrow.y + arrow.height) - 8) < 0.5, '切步结束后的箭头与新目标相距 8px');
  }, '?sticky=1');
});

it('快速连续切步以最新步骤为准，切换中关闭或卸载不会重新出现', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    const originalStyles = await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText }));
    await configure(page, { current: 0, steps: [
      { element: '#target', title: '快速第一步', body: '第一步' },
      { element: '#target', title: '快速第二步', body: '第二步' },
      { element: '#target', title: '快速第三步', body: '第三步' },
    ] });
    await page.evaluate(async () => {
      const fixture = (window as any).guideFixture;
      fixture.configure({ current: 1 });
      await new Promise(requestAnimationFrame);
      fixture.configure({ current: 0 });
      await fixture.flush();
      fixture.next();
      await fixture.flush();
      fixture.next();
    });
    await page.getByRole('heading', { name: '快速第三步', exact: true }).waitFor();
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => (window as any).guideFixture.getCurrent()), 2);
    assert.equal(await page.locator('.fixture-panel h3').textContent(), '快速第三步', '过期切步任务不得覆盖最终内容');
    await page.evaluate(async () => {
      const fixture = (window as any).guideFixture;
      fixture.configure({ current: 1 });
      await new Promise(requestAnimationFrame);
      fixture.close();
    });
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.fixture-panel').count(), 0, '关闭后延迟动画不得重新显示面板');
    assert.deepEqual(await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText })), originalStyles, '关闭后恢复页面锁定');
    await configure(page, { current: 0 });
    await page.evaluate(async () => {
      const fixture = (window as any).guideFixture;
      fixture.configure({ current: 1 });
      await new Promise(requestAnimationFrame);
      fixture.unmount();
    });
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.fixture-panel').count(), 0, '卸载后延迟动画不得重新创建面板');
    assert.deepEqual(await page.evaluate(() => ({ body: document.body.style.cssText, html: document.documentElement.style.cssText })), originalStyles, '卸载后恢复页面锁定');
    assert.equal(await page.locator('#app').evaluate(element => element.hasAttribute('inert')), false);
  });
});

it('减少动态偏好保留步骤切换，但消除面板位移', { skip: !browserAvailable }, async () => {
  await withGuide(async (page) => {
    await configure(page, { current: 0 });
    const normal = await sampleStepTransition(page, 1);
    const normalOffset = Math.max(...normal.filter(sample => sample.visibility === 'visible').map(sample => sample.offset));
    assert.ok(normalOffset > 0.25, '默认动效应存在可测量的小幅位移');
    await page.evaluate(() => (window as any).guideFixture.close());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await configure(page, { current: 0 });
    const reduced = await sampleStepTransition(page, 1);
    const reducedOffset = Math.max(...reduced.filter(sample => sample.visibility === 'visible').map(sample => sample.offset));
    assert.ok(reducedOffset < 0.1, '减少动态偏好下不应移动面板');
    assert.equal(reduced.at(-1)?.title, '下一项');
    assert.equal(reduced.at(-1)?.opacity, 1);
  });
});
