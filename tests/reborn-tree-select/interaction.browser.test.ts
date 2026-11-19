/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: "import TreeSelect from '~/components/reborn/ui/reborn-tree-select/RebornTreeSelect.vue';\nimport {createApp,h,reactive,nextTick} from 'vue';\nconst state=reactive({size:'md',multiple:true,maxCount:2,showWordLimit:true,allowSearch:true,checkStrictly:true,collapseTags:true,maxCollapseTags:1,clearable:true,virtual:false,defaultExpandAll:true,modelValue:[]});\nconst treeData=[{key:'root',title:'部门',children:[{key:'a',title:'甲组'},{key:'b',title:'乙组'},{key:'c',title:'丙组'}]}];\nconst app=createApp({render:()=>h(TreeSelect,{...state,treeData,style:{width:'320px'},'onUpdate:modelValue':value=>state.modelValue=value})});\napp.component('Icon',{render(){return h('span',this.$attrs)}});app.mount('#app');\nwindow.treeSelectFixture={state,flush:nextTick};",
      resolveDir: resolve('.'), sourcefile: 'tree-select-interaction-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    outdir: resolve('node_modules/.cache/tree-select-interaction-fixture'),
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'tree-select-interaction', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/base.css';@import './app/assets/theme/typography.css';@import './app/components/reborn/ui/scrollbar/scrollbar.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles.find(file => file.path.endsWith('.js'))!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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

async function withPage(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.getByRole('combobox').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
}


it('多选标签尺寸、空态内边距、搜索图标、最大数量与右侧计数在三档尺寸一致', {skip:!browserAvailable},()=>withPage(async page=>{
  for(const [size,badgeHeight] of [['sm',18],['md',24],['lg',32]]){
    await page.evaluate(async size=>{const f=(window as any).treeSelectFixture;Object.assign(f.state,{size,multiple:false,modelValue:[]});await f.flush()},size);
    const trigger=page.getByRole('combobox');
    const single=await trigger.evaluate(el=>({left:getComputedStyle(el).paddingLeft,right:getComputedStyle(el).paddingRight}));
    await page.evaluate(async()=>{const f=(window as any).treeSelectFixture;f.state.multiple=true;await f.flush()});
    assert.deepEqual(await trigger.evaluate(el=>({left:getComputedStyle(el).paddingLeft,right:getComputedStyle(el).paddingRight})),single);
    await trigger.click();
    await trigger.locator('[name="lucide:search"]').waitFor();
    await page.locator('[data-key="a"]').locator('label').click();
    await page.locator('[data-key="b"]').locator('label').click();
    await page.locator('[data-key="c"]').locator('label').click();
    assert.equal(await page.locator('[data-key="c"]').getByRole('checkbox').isChecked(),false);
    assert.deepEqual(await page.evaluate(()=>(window as any).treeSelectFixture.state.modelValue),['a','b']);
    await page.locator('[data-key="a"]').locator('label').click();
    assert.deepEqual(await page.evaluate(()=>(window as any).treeSelectFixture.state.modelValue),['b']);
    assert.equal(await page.locator('[data-key="c"]').getByRole('checkbox').isChecked(),false);
    await page.locator('[data-key="a"]').locator('label').click();
    const count=trigger.getByRole('status');
    assert.equal((await count.innerText()).replace(/\s/g,''),'2/2');
    assert.equal(await count.evaluate(el=>getComputedStyle(el).fontSize),'12px');
    assert.equal(await count.evaluate(el=>getComputedStyle(el.parentElement!).gap),'4px');
    assert.equal(await trigger.evaluate(el=>getComputedStyle(el).paddingLeft),'4px');
    assert.equal(await trigger.evaluate(el=>getComputedStyle(el).paddingRight),single.right);
    for(const badge of await trigger.locator('.reborn-badge > :first-child').all()) assert.equal((await badge.boundingBox())!.height,badgeHeight);
    await trigger.hover();await trigger.getByRole('button',{name:'清空选择'}).click();
    assert.equal((await count.innerText()).replace(/\s/g,''),'0/2');
    assert.deepEqual(await trigger.evaluate(el=>({left:getComputedStyle(el).paddingLeft,right:getComputedStyle(el).paddingRight})),single);
    await page.keyboard.press('Escape');
  }
}));

it('真实树联动超限不会出现勾选残留，搜索隐藏项仍计入上限', {skip:!browserAvailable},()=>withPage(async page=>{
  await page.evaluate(async()=>{const f=(window as any).treeSelectFixture;Object.assign(f.state,{checkStrictly:false,maxCount:2});await f.flush()});
  const trigger=page.getByRole('combobox');await trigger.click();
  await page.locator('[data-key="root"]').locator('label').click();
  assert.equal(await page.locator('[data-key="root"]').getByRole('checkbox').isChecked(),false);
  assert.deepEqual(await page.evaluate(()=>(window as any).treeSelectFixture.state.modelValue),[]);
  await page.evaluate(async()=>{const f=(window as any).treeSelectFixture;Object.assign(f.state,{checkStrictly:true,maxCount:1,modelValue:['a']});await f.flush()});
  await trigger.getByRole('textbox').fill('乙组');
  await page.locator('[data-key="b"]').locator('label').click();
  assert.equal(await page.locator('[data-key="b"]').getByRole('checkbox').isChecked(),false);
  assert.equal(await trigger.getByRole('textbox').inputValue(),'乙组');
  assert.deepEqual(await page.evaluate(()=>(window as any).treeSelectFixture.state.modelValue),['a']);
}));
