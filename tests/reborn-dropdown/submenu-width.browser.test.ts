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

/**
 * 回归：带子菜单的 Dropdown 面板宽度。
 * 此前 RebornDsubmenu 的外层是 inline-flex，几个子菜单入口在父面板里是并排的行内元素：
 * 面板按内容求宽（max-content）时把它们排成一行，宽度成了各入口宽度之和（三项约 274px），
 * 实际排版时各入口又因 w-full 各占一行，于是面板比普通下拉宽出一大截、右侧大片留白。
 * 入口改为块级 flex 后，面板宽度应只由最宽的一行决定（不足触发器宽度时取触发器宽度）。
 */

const executablePath = chromium.executablePath();
let fixture: Promise<{ script: string; css: string }>;

async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import Dropdown from '~/components/reborn/ui/reborn-dropdown/RebornDropdown.vue';
        import Dsubmenu from '~/components/reborn/ui/reborn-dropdown/RebornDsubmenu.vue';
        import Doption from '~/components/reborn/ui/reborn-dropdown/RebornDoption.vue';
        import {createApp,h,shallowRef} from 'vue';
        const dropdown=shallowRef(null);
        const submenus=[
          {label:'查看详情',children:[{label:'基本信息',value:'info'},{label:'操作记录',value:'history'}]},
          {label:'导出文件',children:[{label:'PDF 文档',value:'pdf'},{label:'Excel 表格',value:'excel'}]},
          {label:'更多操作',children:[{label:'复制链接',value:'copy'},{label:'归档记录',value:'archive'}]},
        ];
        const panelEl=()=>document.querySelector('[role=menu]')?.closest('.rb-transition')??null;
        // 入口行自身的最大内容宽度：临时改成 max-content 取一次再还原
        const naturalWidth=(el)=>{const prev=el.style.width;el.style.width='max-content';const w=el.getBoundingClientRect().width;el.style.width=prev;return w;};
        window.submenuFixture={
          open:()=>dropdown.value.open(),
          settled:()=>{const panel=panelEl();return !!panel&&panel.style.height===''&&panel.style.opacity==='';},
          measure:()=>{
            const panel=panelEl();
            const rows=[...panel.querySelectorAll('[aria-haspopup=menu]')];
            const ps=getComputedStyle(panel.querySelector('[role=menu]').parentElement);
            const chrome=panel.offsetWidth-panel.clientWidth+parseFloat(ps.paddingLeft)+parseFloat(ps.paddingRight);
            return {
              panel:panel.getBoundingClientRect().width,
              trigger:document.querySelector('#trigger').getBoundingClientRect().width,
              widest:Math.max(...rows.map(naturalWidth)),
              chrome,
              tops:rows.map(row=>row.getBoundingClientRect().top),
            };
          },
        };
        createApp({render:()=>h('main',{class:'flex h-[600px] items-start justify-center pt-20'},[
          h(Dropdown,{ref:dropdown,closeOn:'click'},{
            default:()=>h('button',{id:'trigger',class:'h-8 w-24'},'右侧箭头'),
            content:()=>submenus.map(item=>h(Dsubmenu,{key:item.label,title:item.label},
              {default:()=>item.children.map(child=>h(Doption,{key:child.value,value:child.value},{default:()=>child.label}))})),
          }),
        ])}).mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'dropdown-submenu-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'dropdown-submenu', setup(builder) {
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
  const scanner = new Scanner({ sources: ['reborn-select-trigger', 'reborn-transition', 'reborn-dropdown'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'flex', 'h-[600px]', 'items-start', 'justify-center', 'pt-20', 'h-8', 'w-24']) };
}

async function withDropdown(run: (page: Page) => Promise<void>) {
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
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('#trigger').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

interface Measure { panel: number; trigger: number; widest: number; chrome: number; tops: number[] }

it('子菜单入口各占一行，面板宽度只由最宽的一行决定', { skip: !existsSync(executablePath) }, async () => {
  await withDropdown(async (page) => {
    await page.evaluate(() => (window as any).submenuFixture.open());
    await page.waitForFunction(() => (window as any).submenuFixture.settled());
    const m: Measure = await page.evaluate(() => (window as any).submenuFixture.measure());
    assert.equal(new Set(m.tops.map(Math.round)).size, m.tops.length, '每个子菜单入口应各占一行');
    const expected = Math.max(m.trigger, m.widest + m.chrome);
    assert.ok(
      Math.abs(m.panel - expected) <= 1,
      `面板宽 ${m.panel.toFixed(1)}px，应为 max(触发器 ${m.trigger}px, 最宽一行 ${m.widest.toFixed(1)}px + 内边距与描边 ${m.chrome}px) = ${expected.toFixed(1)}px`,
    );
  });
});
