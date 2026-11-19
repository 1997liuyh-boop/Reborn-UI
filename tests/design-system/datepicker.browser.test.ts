/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

it('日期选择器真实布局、按压与展开、周悬停、禁用项和多选间距符合设计', async () => {
  const bundle = await build({ stdin: { resolveDir: resolve('.'), loader: 'ts', contents: `
    import {createApp,h,reactive,computed,shallowRef,nextTick} from 'vue';
    import Picker from '~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue';
    import Panel from '~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue';
    import cascaderTheme from '~/components/reborn/ui/reborn-cascader/reborn-cascader.config';
    import {tv} from '~/lib/tv';
    const state=reactive({type:'date',size:'md',modelValue:null,disabled:false,error:false,blocked:false,withShortcuts:false});
    globalThis.useFormInject=()=>({disabled:shallowRef(false),size:shallowRef(null),isError:computed(()=>state.error),validate(){}});
    const ui={header:'fixture-header',days:'fixture-days',weekRow:'fixture-week',grid4Month:'fixture-months',grid4Year:'fixture-years',grid2Quarter:'fixture-quarters',dateTimeTrigger:'fixture-time',shortcut:'fixture-shortcut'};
    const cell=cell=>h('span',{'data-date':[cell.date.getFullYear(),String(cell.date.getMonth()+1).padStart(2,'0'),String(cell.date.getDate()).padStart(2,'0')].join('-')},cell.text);
    window.dateFixture={configure:props=>Object.assign(state,props),flush:nextTick,state};
    const app=createApp({render:()=>{
      const props={...state,defaultValue:new Date(2026,0,1),valueFormat:'YYYY-MM-DD',disabledMethod:state.blocked?date=>date.getDate()===8:undefined,'onUpdate:modelValue':value=>state.modelValue=value};
      return h('main',[
        h('section',{class:'picker',style:'width:320px'},[h(Picker,{...props,key:state.type,panelUi:ui,triggerUi:{trigger:'fixture-field'}},{cell})]),
        h('section',{class:'standalone',style:'margin-top:24px'},[h(Panel,{...props,key:state.type,ui,shortcuts:state.withShortcuts?[{text:'三个日期',value:()=>[new Date(2026,0,5),new Date(2026,0,8),new Date(2026,0,10)]}]:[]},{default:cell})]),
        h('div',{class:tv(cascaderTheme)({size:state.size}).tagList(),'data-tags':''},[h('span','甲'),h('span','乙')]),
        h('i',{id:'pressed',class:'border-brand-7'}),h('i',{id:'error-pressed',class:'border-red-7'}),h('i',{id:'normal',class:'border-primary'}),h('i',{id:'gray5',class:'text-gray-5'}),h('i',{id:'gray2',class:'bg-gray-2'})
      ]);
    }});
    app.component('Icon',props=>h('svg',{'data-icon':props.name}));app.mount('#app');
  ` }, bundle: true, platform: 'browser', format: 'iife', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
  plugins: [{ name: '日期浏览器编译', setup(builder) {
    builder.onLoad({ filter: /\.vue$/ }, args => {
      const { descriptor } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      return { contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts' };
    });
  } }],
  });
  const compiler = await compile("@import './app/assets/css/main.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui'), pattern: '**/*', negated: false }] });
  const css = compiler.build([...scanner.scan(), 'border-brand-7', 'border-red-7', 'border-primary', 'text-gray-5', 'bg-gray-2']);
  const browser = await chromium.launch({ executablePath: process.env.GUIDE_BROWSER_PATH || chromium.executablePath(), headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(10000);
    await page.setContent(`<style>${css} *{transition:none!important;animation:none!important}</style><div id="app"></div>`);
    await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
    await page.addScriptTag({ content: 'globalThis.__name=value=>value;' });
    const configure = async (props: Record<string, unknown>) => {
      await page.evaluate(value => (window as any).dateFixture.configure(value), props);
      await page.evaluate(() => (window as any).dateFixture.flush());
    };
    const padding = (selector: string) => page.locator(selector).first().evaluate(el => getComputedStyle(el).padding);
    for (const [type, selector, columns] of [['date', '.fixture-days', 7], ['month', '.fixture-months', 3], ['year', '.fixture-years', 3], ['quarter', '.fixture-quarters', 4]] as const) {
      await configure({ type });
      assert.equal(await padding(`.standalone ${selector}`), '8px 16px 12px');
      assert.equal(await padding('.standalone .fixture-header'), '16px 20px 12px');
      assert.equal(await page.locator(`.standalone ${selector}`).evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), columns);
    }
    await configure({ type: 'week' });
    const row = page.locator('.standalone .fixture-week').nth(2);
    await row.hover();
    assert.equal(await row.evaluate(el => getComputedStyle(el).backgroundColor), await page.locator('#gray2').evaluate(el => getComputedStyle(el).backgroundColor));
    assert.equal(await row.locator(':scope > div').count(), 7);
    await configure({ type: 'date' });
    const field = page.locator('.fixture-field');
    await field.hover(); await page.mouse.down();
    assert.equal(await field.evaluate(el => getComputedStyle(el).borderColor), await page.locator('#pressed').evaluate(el => getComputedStyle(el).borderColor));
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.fixture-field')?.getAttribute('data-state') === 'open');
    assert.equal(await field.evaluate(el => getComputedStyle(el).borderColor), await page.locator('#normal').evaluate(el => getComputedStyle(el).borderColor));
    assert.match(await field.evaluate(el => getComputedStyle(el).boxShadow), /2px/);
    await configure({ error: true });
    await field.hover(); await page.mouse.down();
    assert.equal(await field.evaluate(el => getComputedStyle(el).borderColor), await page.locator('#error-pressed').evaluate(el => getComputedStyle(el).borderColor));
    await page.mouse.up(); await configure({ error: false });
    for (const [size, expected] of [['sm', '10px'], ['md', '12px'], ['lg', '16px']]) {
      await configure({ type: 'dates', size, modelValue: [] });
      assert.deepEqual(await field.evaluate(el => [getComputedStyle(el).paddingLeft, getComputedStyle(el).paddingRight]), [expected, expected]);
      await configure({ modelValue: ['2026-01-05'] });
      assert.deepEqual(await field.evaluate(el => [getComputedStyle(el).paddingLeft, getComputedStyle(el).paddingRight]), ['4px', expected]);
      assert.equal(await page.locator('[data-tags]').evaluate(el => getComputedStyle(el).gap), '4px');
    }
    await configure({ type: 'date', size: 'md', blocked: true, modelValue: '2026-01-08' });
    const disabled = page.locator('.standalone [data-date="2026-01-08"]').locator('..');
    assert.equal(await disabled.evaluate(el => getComputedStyle(el).color), await page.locator('#gray5').evaluate(el => getComputedStyle(el).color));
    assert.equal(await disabled.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await configure({ type: 'datetime', modelValue: null, blocked: false });
    assert.equal(await page.locator('.standalone .fixture-time').evaluate(el => getComputedStyle(el).paddingTop), '12px');
    await configure({ type: 'dates', modelValue: [], disabled: true, withShortcuts: true });
    const shortcut = page.locator('.standalone .fixture-shortcut');
    await shortcut.hover(); await page.mouse.down();
    assert.equal(await shortcut.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.equal(await shortcut.evaluate(el => getComputedStyle(el).color), await page.locator('#gray5').evaluate(el => getComputedStyle(el).color));
    await page.mouse.up();
    assert.deepEqual(errors, []);
  }
  finally { await browser.close(); }
});
