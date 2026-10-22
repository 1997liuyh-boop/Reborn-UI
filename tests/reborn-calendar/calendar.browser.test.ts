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

const executablePath = process.env.CALENDAR_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 真实编译日历和 Tailwind；工具栏替身只负责转发原生点击，避免测试依赖 Nuxt 自动导入。 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import Calendar from '~/components/reborn/ui/reborn-calendar/RebornCalendar.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({modelValue:'2026-10-20',valueFormat:'YYYY-MM-DD',mode:'month',controllerType:'button',border:false,lunar:false,titleAlign:'right',timezone:'Asia/Shanghai',events:[],customCell:false});
        const changes=[];
        const context=[];
        const ui={root:'fixture-calendar',body:'fixture-body',cell:'fixture-cell',cellHeader:'fixture-cell-header',date:'fixture-date',lunar:'fixture-lunar',content:'fixture-content',eventTitle:'fixture-event-title'};
        window.calendarFixture={configure:props=>Object.assign(state,props),flush:nextTick,state,changes,context,props:Object.keys(Calendar.props),emits:Calendar.emits};
        const app=createApp({render:()=>{const {customCell,...props}=state;return h('section',{style:'width:960px;max-width:100%'},[
          h(Calendar,{...props,ui,'onUpdate:modelValue':value=>state.modelValue=value,'onUpdate:mode':value=>state.mode=value,onPanelChange:(date,mode)=>changes.push({date:date.toISOString(),mode})},customCell?{
            'date-cell':({data,events})=>h('div',{'data-day':data.day,class:'fixture-custom-cell',onContextmenu:event=>{event.preventDefault();context.push({day:data.day,date:data.date.toISOString(),lunar:data.lunar?.text,events:events.map(event=>event.title)})}},data.day+' '+events.map(event=>event.title).join('、'))
          }:undefined)
        ])}});
        app.component('Icon',props=>h('svg',{'data-icon':props.name,viewBox:'0 0 24 24'}));
        app.mount('#app');
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'calendar-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'calendar-browser', setup(builder) {
      builder.onResolve({ filter: /Reborn(Button|RadioGroup|Select)\.vue$/ }, ({ path }) => ({ path, namespace: 'calendar-toolbar' }));
      builder.onLoad({ filter: /.*/, namespace: 'calendar-toolbar' }, ({ path }) => ({
        contents: path.includes('RadioGroup')
          ? `import {defineComponent,h} from 'vue';export default defineComponent({props:['modelValue','options','type','size','color'],emits:['update:modelValue'],setup:(props,{emit})=>()=>h('div',props.options.map(option=>h('button',{'data-mode':option.value,onClick:()=>emit('update:modelValue',option.value)},option.label)))})`
          : path.includes('Select')
            ? `import {defineComponent,h} from 'vue';export default defineComponent({props:['modelValue','options','size','color','clearable'],emits:['update:modelValue'],setup:(props,{emit})=>()=>h('select',{value:props.modelValue,onChange:event=>emit('update:modelValue',Number(event.target.value))},props.options.map(option=>h('option',{value:option.value},option.label)))})`
            : `import {defineComponent,h} from 'vue';export default defineComponent({props:['size','color','variant','borderStyle','disabled'],setup:(props,{slots})=>()=>h('button',{type:'button',disabled:props.disabled},slots.default?.())})`,
        loader: 'js', resolveDir: resolve('.'),
      }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-calendar'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan());
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

async function withCalendar(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  try {
    await page.goto(url);
    await page.locator('[role="gridcell"]').first().waitFor();
    await run(page);
    assert.deepEqual(errors, [], '真实日历不应抛出运行时异常');
  } finally { await page.close(); }
}

async function configure(page: Page, props: Record<string, unknown>) {
  await page.evaluate(value => (window as any).calendarFixture.configure(value), props);
  await page.evaluate(() => (window as any).calendarFixture.flush());
}

function near(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) < 0.2, `${message}：实际 ${actual}，预期 ${expected}`);
}

it('边框模式的月、年网格保持直角，日期选中胶囊继续显示圆角', { skip: !browserAvailable }, async () => {
  await withCalendar(async (page) => {
    for (const mode of ['month', 'year']) {
      await configure(page, { mode, border: true });
      const style = await page.locator('[role="grid"]').evaluate(element => {
        const computed = getComputedStyle(element);
        return { radius: [computed.borderTopLeftRadius, computed.borderTopRightRadius, computed.borderBottomLeftRadius, computed.borderBottomRightRadius], border: computed.borderTopWidth };
      });
      assert.deepEqual(style.radius, ['0px', '0px', '0px', '0px'], `${mode} 网格四角均无圆角`);
      assert.equal(style.border, '1px', `${mode} 保留可见外框`);
      const radius = await page.locator('[aria-selected="true"] .fixture-date').evaluate(element => Number.parseFloat(getComputedStyle(element).borderRadius));
      assert.ok(radius > 0, `${mode} 日期自身圆角不受外框影响`);
    }
  });
});

it('农历始终位于公历下方且字号更小，三种标题对齐保留相同日期轴线', { skip: !browserAvailable }, async () => {
  await withCalendar(async (page) => {
    for (const titleAlign of ['left', 'center', 'right']) {
      await configure(page, { lunar: true, titleAlign });
      const layout = await page.getByRole('button', { name: '2026-10-20 农历九月十一', exact: true }).evaluate((button) => {
        const header = button.parentElement!;
        const lunar = header.querySelector('.fixture-lunar')!;
        const dateBox = button.getBoundingClientRect();
        const lunarBox = lunar.getBoundingClientRect();
        const headerBox = header.getBoundingClientRect();
        return {
          date: { left: dateBox.left, right: dateBox.right, center: dateBox.x + dateBox.width / 2, bottom: dateBox.bottom, size: Number.parseFloat(getComputedStyle(button).fontSize), text: button.textContent!.trim() },
          lunar: { left: lunarBox.left, right: lunarBox.right, center: lunarBox.x + lunarBox.width / 2, top: lunarBox.top, size: Number.parseFloat(getComputedStyle(lunar).fontSize), text: lunar.textContent },
          header: { left: headerBox.left, right: headerBox.right, center: headerBox.x + headerBox.width / 2 },
        };
      });
      assert.equal(layout.date.text, '20', '公历在上方保留日期数字');
      assert.equal(layout.lunar.text, '十一', '下方显示对应农历日期');
      assert.ok(layout.lunar.top >= layout.date.bottom, `${titleAlign} 农历排在公历下方，不再并排`);
      assert.equal(layout.date.size, 14, '公历沿用 14px 正文令牌');
      assert.equal(layout.lunar.size, 12, '农历沿用较小的 12px 令牌');
      if (titleAlign === 'left') {
        near(layout.date.left, layout.header.left, '公历靠左');
        near(layout.lunar.left, layout.header.left, '农历靠左');
      } else if (titleAlign === 'right') {
        near(layout.date.right, layout.header.right, '公历靠右');
        near(layout.lunar.right, layout.header.right, '农历靠右');
      } else {
        near(layout.date.center, layout.header.center, '公历居中');
        near(layout.lunar.center, layout.header.center, '农历居中');
      }
    }
    await configure(page, { lunar: false });
    assert.equal(await page.locator('.fixture-lunar').count(), 0, '关闭农历后不保留空白农历行');
  });
});

it('鼠标悬停、键盘聚焦与触屏均不再产生内置编辑或添加入口', { skip: !browserAvailable }, async () => {
  await withCalendar(async (page) => {
    await configure(page, { events: [{ date: '2026-10-20', title: '现有事项' }] });
    for (const day of ['2026-10-20', '2026-10-21']) {
      const date = page.getByRole('button', { name: day, exact: true });
      const content = date.locator('..').locator('..').locator('.fixture-content');
      await content.hover();
      // 原实现会在 150ms 后显示遮罩，等待超过该阈值才能防止定时器遗漏验收。
      await page.waitForTimeout(200);
      await date.focus();
      await content.dispatchEvent('pointerdown', { pointerType: 'touch' });
      assert.equal(await page.getByRole('button', { name: /^(?:编辑|添加事项)$/ }).count(), 0, `${day} 不显示内置编辑按钮`);
    }
    const api = await page.evaluate(() => ({ props: (window as any).calendarFixture.props, emits: (window as any).calendarFixture.emits }));
    assert.ok(!api.props.includes('editable'), '移除 editable 属性');
    assert.ok(!api.emits.includes('add') && !api.emits.includes('edit'), '移除与悬停入口耦合的 add / edit 事件');
    assert.equal(await page.getByText('现有事项', { exact: true }).count(), 1, '删除遮罩不影响原有事项展示');
  });
});

it('日期选择、月份切换与年月视图切换继续更新绑定值并通知面板变化', { skip: !browserAvailable }, async () => {
  await withCalendar(async (page) => {
    await page.getByRole('button', { name: '2026-10-21', exact: true }).click();
    assert.equal(await page.evaluate(() => (window as any).calendarFixture.state.modelValue), '2026-10-21');
    assert.equal(await page.locator('[role="gridcell"][aria-selected="true"]').count(), 1, '仅选中一个日期');
    await page.getByRole('button', { name: '下个月', exact: true }).click();
    assert.equal(await page.evaluate(() => (window as any).calendarFixture.state.modelValue), '2026-11-21');
    assert.equal(await page.getByRole('grid', { name: '2026 年 11 月', exact: true }).count(), 1);
    await page.locator('[data-mode="year"]').click();
    assert.equal(await page.locator('[role="gridcell"]').count(), 12, '年视图展示十二个月');
    const changes = await page.evaluate(() => (window as any).calendarFixture.changes);
    assert.deepEqual(changes, [
      { date: '2026-11-20T16:00:00.000Z', mode: 'month' },
      { date: '2026-11-20T16:00:00.000Z', mode: 'year' },
    ], '只有可见面板变化时触发 panelChange，日期使用指定时区零点');
  });
});

it('月份切换保留动画中间帧，快速切换年视图后只保留新网格，减少动态效果直接落定', { skip: !browserAvailable }, async () => {
  await withCalendar(async (page) => {
    await page.getByRole('button', { name: '下个月', exact: true }).click();
    await page.waitForTimeout(45);
    const opacity = await page.getByRole('grid').evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(opacity > 0.5 && opacity < 1, `切换中透明度 ${opacity}`);
    await page.getByRole('button', { name: '下个月', exact: true }).click();
    await page.locator('[data-mode="year"]').click();
    await page.waitForTimeout(250);
    assert.equal(await page.getByRole('grid').count(), 1);
    assert.equal(await page.getByRole('gridcell').count(), 12);
    assert.equal(await page.getByRole('grid').evaluate(element => Number(getComputedStyle(element).opacity)), 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-mode="month"]').click();
    await page.waitForTimeout(40);
    assert.equal(await page.getByRole('grid').evaluate(element => Number(getComputedStyle(element).opacity)), 1);
  });
});

it('date-cell 插槽保留事项、农历和时区日期，允许自定义右键交互', { skip: !browserAvailable }, async () => {
  await withCalendar(async (page) => {
    await configure(page, { customCell: true, lunar: true, timezone: 'America/New_York', events: [{ date: '2026-10-20', title: '自定义事项' }] });
    const cell = page.locator('[data-day="2026-10-20"]');
    assert.equal(await cell.textContent(), '2026-10-20 自定义事项');
    await cell.click({ button: 'right' });
    assert.deepEqual(await page.evaluate(() => (window as any).calendarFixture.context), [{ day: '2026-10-20', date: '2026-10-20T04:00:00.000Z', lunar: '十一', events: ['自定义事项'] }]);
    assert.equal(await page.locator('.fixture-date').count(), 0, '自定义插槽整体替换默认日期标题和事项区');
  });
});

it('年度事项显示完整日期前缀，跨月与跨年时刻按 timezone 落入对应月份', { skip: !browserAvailable }, async () => {
  await withCalendar(async (page) => {
    const events = [
      { date: '2026-11-01T02:00:00Z', title: '跨月事项' },
      { date: '2027-01-01T02:00:00Z', title: '跨年事项' },
      { date: '2026-10-20', title: '固定日期事项' },
      { date: '不是日期', title: '无效事项' },
    ];
    const monthTitles = (month: number) => page.getByRole('button', { name: `${month} 月`, exact: true }).locator('..').locator('..').locator('.fixture-event-title').allTextContents();
    await configure(page, { mode: 'year', timezone: 'America/New_York', events });
    assert.deepEqual(await monthTitles(10), ['2026-10-31：跨月事项', '2026-10-20：固定日期事项']);
    assert.deepEqual(await monthTitles(12), ['2026-12-31：跨年事项']);
    assert.deepEqual(await monthTitles(11), [], '纽约时区的跨月事项不落入十一月');
    assert.equal(await page.getByText('无效事项', { exact: true }).count(), 0, '忽略无法解析日期的事项');
    await configure(page, { timezone: 'Asia/Shanghai' });
    assert.deepEqual(await monthTitles(10), ['2026-10-20：固定日期事项']);
    assert.deepEqual(await monthTitles(11), ['2026-11-01：跨月事项']);
    assert.deepEqual(await monthTitles(12), [], '上海时区的跨年事项不落入上一年');
    await page.getByRole('button', { name: '下一年', exact: true }).click();
    assert.deepEqual(await monthTitles(1), ['2027-01-01：跨年事项']);
  });
});
