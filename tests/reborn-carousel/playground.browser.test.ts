/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = process.env.CAROUSEL_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
const demoEntry = `import Demo from '~/components/reborn/examples/reborn-carousel/RebornCarouselDemo.vue';import {createApp,h} from 'vue';const app=createApp(Demo);app.component('Icon',{render:()=>h('span','›')});app.mount('#app');`;

/** 保留真实 Demo、Playground、Carousel 和回显；无关控件用轻量占位，避免依赖 Nuxt 运行时。 */
async function buildPlayground(contents = demoEntry) {
  const result = await build({
    stdin: {
      contents,
      sourcefile: 'playground.ts', loader: 'ts', resolveDir: resolve('.'),
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') }, define: { 'import.meta.client': 'true' },
    plugins: [{ name: 'carousel-playground-test', setup(builder) {
      builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'components', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: `import {h} from 'vue';export {default as Playground} from '~/components/common/play-ground/Playground.vue';export {default as DemoNote} from '~/components/common/demo/DemoNote.vue';export const DemoSection={render(){return null}};export const Icon={render:()=>h('span','›')};`,
        resolveDir: resolve('.'), loader: 'js',
      }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        // 无关浮层保留代码节点但不占布局，以验证真实 Playground 生成的代码且不遮挡操作。
        if (path.includes('reborn-popover')) return { contents: `import {h} from 'vue';export default {render(){return h('div',{},[this.$slots.default?.(),h('div',{hidden:true},this.$slots.content?.())])}};`, loader: 'js' };
        // 参数控件只替换外观，保留公开的模型事件，用于验证演练场配置联动。
        if (path.includes('reborn-select')) return { contents: `import {h} from 'vue';export default {props:['modelValue','options'],emits:['update:modelValue'],render(){return h('select',{value:this.modelValue,onChange:event=>this.$emit('update:modelValue',this.options[event.target.selectedIndex].value)},this.options.map(option=>h('option',{value:option.value},option.label)))}};`, loader: 'js' };
        if (path.includes('reborn-checkbox')) return { contents: `import {h} from 'vue';export default {props:['modelValue','label'],emits:['update:modelValue'],render(){return h('input',{type:'checkbox','aria-label':this.label,checked:this.modelValue,onChange:event=>this.$emit('update:modelValue',event.target.checked)})}};`, loader: 'js' };
        if (path.includes('HeroBanner') || (/reborn-(?:select|input|checkbox|popover|slider|color-picker)/.test(path) && !path.includes('carousel'))) {
          return { contents: `import {h} from 'vue';export default {inheritAttrs:false,render(){return h('div',{},this.$slots.default?.())}};`, loader: 'js' };
        }
        let source = await readFile(path, 'utf8');
        if (path.endsWith('DemoNote.vue')) source = source.replace("import { tv }", "import {computed} from 'vue';import { tv }");
        const { descriptor } = parse(source, { filename: path });
        if (path.endsWith('RebornCarouselDemo.vue')) {
          const template = descriptor.template!;
          const start = template.content.indexOf('<Playground');
          const end = template.content.indexOf('</Playground>') + '</Playground>'.length;
          // 直接编译演练场源码，保证布局或模型回写回归时测试能发现，而不是验证另一个手写演示。
          template.content = `<div>${template.content.slice(start, end)}</div>`;
        }
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [
    'app/components/reborn/ui/reborn-carousel', 'app/components/reborn/ui/reborn-progress', 'app/components/reborn/examples/reborn-carousel',
    'app/components/common/play-ground', 'app/components/common/demo', 'app/components/reborn/ui/reborn-button', 'app/components/reborn/ui/reborn-loading',
  ].map(base => ({ base: resolve(base), pattern: '**/*', negated: false })) });
  // 对照色不依赖组件是否正确使用，避免错误样式让期望令牌也被裁剪。
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'bg-gray-2', 'text-gray-2', 'enabled:hover:bg-gray-2', 'enabled:hover:border-gray-2', 'hover:text-gray-2', 'left-(--carousel-indicator-offset)', 'right-auto', 'order-first', 'ml-0', 'mr-(--carousel-indicator-offset)']) };
}

it('演练场切换时轮播宽度保持稳定，悬停和箭头不被回显文字挤压干扰', { skip: !browserAvailable }, async () => {
  const { script, css } = await buildPlayground();
  const folder = await mkdtemp(resolve('tests/reborn-carousel/.runtime-browser-'));
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app" style="max-width:900px;margin:auto"></div><script type="module" src="/app.js"></script></body></html>');
  });
  let browser;
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-background-timer-throttling'], downloadsPath: folder });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const url = `http://127.0.0.1:${address.port}`;
    const carousel = page.getByRole('region', { name: '轮播内容' });
    const viewport = carousel.locator('[data-direction]');
    const note = page.locator('p').filter({ hasText: '当前索引' });
    for (const width of [900, 690]) {
      await page.goto(url);
      await page.locator('#app').evaluate((element, value) => { element.style.maxWidth = `${value}px`; }, width);
      await viewport.waitFor();
      await page.waitForTimeout(700);
      const before = (await viewport.boundingBox())!;
      await carousel.getByRole('button', { name: '下一项', exact: true }).click();
      await page.waitForTimeout(850);
      assert.match(await note.textContent() ?? '', /当前索引 1/);
      const after = (await viewport.boundingBox())!;
      assert.ok(Math.abs(after.width - before.width) < 1, `回显挤压轮播：${before.width}px → ${after.width}px`);
      assert.ok(Math.abs(after.x - before.x) < 1, '切换后轮播左边缘不应移动');
      await carousel.getByRole('button', { name: '切换到第 3 项', exact: true }).hover();
      await page.waitForTimeout(850);
      assert.match(await note.textContent() ?? '', /当前索引 2/);
      await page.waitForTimeout(1200);
      assert.match(await note.textContent() ?? '', /当前索引 2/, '鼠标停留后不应误触其他指示器');
      // 遍历首尾接缝，真实 v-model 和 change 回显同时更新，不得重新挤压视口。
      await page.mouse.move(0, 0);
      for (const expected of [3, 0, 1]) {
        await carousel.getByRole('button', { name: '下一项', exact: true }).click();
        await page.waitForTimeout(850);
        assert.match(await note.textContent() ?? '', new RegExp(`当前索引 ${expected}`));
        assert.ok(Math.abs((await viewport.boundingBox())!.width - before.width) < 1);
      }
      const noteBox = (await note.boundingBox())!;
      assert.ok(noteBox.y >= after.y + after.height, '事件回显应在轮播下方，不与预览抢占横向空间');
    }
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
    // 只清理由本测试创建的文件，避免递归删除浏览器临时目录。
    const { readdir } = await import('node:fs/promises');
    for (const entry of await readdir(folder, { withFileTypes: true })) if (entry.isFile()) await unlink(resolve(folder, entry.name));
    await rmdir(folder);
  }
});

/** 真实轮播与静态主题 CSS，用于测量分页和循环轨迹，不替换组件内部滚动实现。 */
async function withCarousel(run: (page: Page) => Promise<void>, contents?: string) {
  const { script, css } = await buildPlayground(contents ?? `
    import Carousel from '~/components/reborn/ui/reborn-carousel/RebornCarousel.vue';
    import {createApp,h,nextTick,reactive,ref} from 'vue';
    const query=new URLSearchParams(location.search);
    const props=reactive({height:240,loop:true,slidesPerView:Number(query.get('perView')||1),direction:query.get('direction')||'horizontal',modelValue:Number(query.get('model')||0),pagination:{type:'line'},trigger:'click',ui:{root:'fixture-main',indicators:'fixture-indicators'}});
    const carousel=ref();const changes=[];const updates=[];
    window.carouselFixture={configure:value=>Object.assign(props,value),next:()=>carousel.value.next(),prev:()=>carousel.value.prev(),goTo:value=>carousel.value.goTo(value),flush:nextTick,changes,updates};
    const app=createApp({render:()=>h(Carousel,{...props,ref:carousel,onChange:index=>changes.push(index),'onUpdate:modelValue':index=>{updates.push(index);props.modelValue=index;}},{default:()=>Array.from({length:Number(query.get('count')||12)},(_,i)=>h('article',{class:'h-full w-full bg-gray-2'},'内容 '+i))})});
    app.component('Icon',{render:()=>h('span','›')});app.mount('#app');
  `);
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app" style="width:600px;margin:auto"></div><script type="module" src="/app.js"></script></body></html>');
  });
  let browser;
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('[data-direction]').waitFor(); await page.waitForTimeout(700);
    await run(page);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

it('指示器默认偏移为 8px，横纵向和内外位置一致，自定义 0px 与 24px 仍生效', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    for (const direction of ['horizontal', 'vertical']) for (const position of ['inside', 'outside']) for (const offset of [undefined, 0, 24]) {
      await page.evaluate(value => (window as any).carouselFixture.configure(value), {
        direction, indicatorPosition: position, indicatorOffset: offset, pagination: { type: 'dot' },
      });
      await page.evaluate(() => (window as any).carouselFixture.flush());
      const actual = await page.locator('.fixture-indicators').evaluate((element, value) => {
        const style = getComputedStyle(element.parentElement!);
        return value.direction === 'vertical' ? value.position === 'inside' ? style.right : style.marginLeft : value.position === 'inside' ? style.bottom : style.marginTop;
      }, { direction, position });
      assert.equal(actual, `${offset ?? 8}px`, `${direction}/${position}/${offset ?? '默认'}`);
    }
  });
});

it('outside 指示器背景和阴影不被外层裁剪，轮播内容仍由主图区域裁剪', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    for (const direction of ['horizontal', 'vertical']) for (const type of ['line', 'dot', 'fraction', 'button']) {
      await page.evaluate(value => (window as any).carouselFixture.configure(value), { direction, indicatorPosition: 'outside', pagination: { type } });
      await page.evaluate(() => (window as any).carouselFixture.flush());
      await page.waitForTimeout(350);
      const clippedBy = await page.locator('.fixture-indicators').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const clipped: string[] = [];
        // shadow-md 的投影会超出底板，检查真实祖先的裁剪边界而非仅判断某个类名。
        for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
          const style = getComputedStyle(parent); const bounds = parent.getBoundingClientRect();
          const clipX = style.overflowX !== 'visible' && (rect.left - 12 < bounds.left || rect.right + 12 > bounds.right);
          const clipY = style.overflowY !== 'visible' && (rect.top - 12 < bounds.top || rect.bottom + 12 > bounds.bottom);
          if (clipX || clipY) clipped.push(`${parent.className}（${style.overflowX}/${style.overflowY}）`);
        }
        return clipped;
      });
      assert.deepEqual(clippedBy, [], `${direction}/${type} 背景投影被裁剪`);
      assert.equal(await page.locator('.fixture-main').evaluate(element => getComputedStyle(element).overflow), 'hidden', '不能为显示分页阴影而放开轮播内容的裁剪');
    }
  });
});

it('指示器 hover 支持内外位置、五种类型和键盘焦点；隐藏时不拦截点击且不改变布局', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const carousel = page.getByRole('region', { name: '轮播内容' });
    for (const position of ['inside', 'outside']) for (const type of ['line', 'dot', 'progress', 'fraction', 'button']) {
      await page.mouse.move(0, 600);
      await page.evaluate(value => (window as any).carouselFixture.configure(value), {
        pagination: { type, display: 'hover' }, indicatorPosition: position,
      });
      await page.evaluate(() => (window as any).carouselFixture.flush());
      // 类型切换沿用既有尺寸过渡，等待其结束再比较显隐前后的布局。
      await page.waitForTimeout(350);
      const indicators = page.locator('.fixture-indicators');
      const height = await carousel.evaluate(element => element.getBoundingClientRect().height);
      assert.equal(await indicators.evaluate(element => getComputedStyle(element).visibility), 'hidden', `${position}/${type}`);
      assert.equal(await indicators.evaluate(element => {
        const box = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }), false, '隐藏指示器不能阻挡轮播内容');
      await carousel.locator('[data-direction]').hover();
      assert.equal(await indicators.evaluate(element => getComputedStyle(element).visibility), 'visible');
      await indicators.hover();
      assert.equal(await indicators.evaluate(element => getComputedStyle(element).visibility), 'visible', '移到外部分页仍然可见');
      await page.mouse.move(0, 600);
      await carousel.locator('[data-direction]').focus();
      assert.equal(await indicators.evaluate(element => getComputedStyle(element).visibility), 'visible', '键盘聚焦轮播也显示分页');
      await page.locator('body').evaluate(element => { element.tabIndex = -1; element.focus(); });
      assert.equal(await indicators.evaluate(element => getComputedStyle(element).visibility), 'hidden');
      assert.equal(await carousel.evaluate(element => element.getBoundingClientRect().height), height, '显隐不能引起布局抖动');
    }
    assert.deepEqual(await page.evaluate(() => (window as any).carouselFixture.changes), []);
    await page.evaluate(() => (window as any).carouselFixture.configure({ pagination: { type: 'button', display: 'always' } }));
    assert.equal(await page.locator('.fixture-indicators').evaluate(element => getComputedStyle(element).visibility), 'visible');
    await page.evaluate(() => (window as any).carouselFixture.configure({ pagination: { display: 'never' } }));
    assert.equal(await page.locator('.fixture-indicators').count(), 0);
  });
});

it('演练场快捷预设同步真实配置与代码，切页回显事件，重置恢复默认', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const hoverPreset = page.getByRole('button', { name: '悬停指示', exact: true });
    assert.equal(await hoverPreset.count(), 1, '提供悬停指示快捷预设');
    for (const group of ['布局', '指示器', '操作', '自动播放', '缩略图']) {
      assert.ok(await page.getByText(group, { exact: true }).count() > 0, `存在${group}分组`);
    }
    await hoverPreset.click();
    const code = page.locator('pre');
    assert.match(await code.textContent() ?? '', /"display":"hover"/);
    const indicators = page.getByRole('region', { name: '轮播内容' }).locator('.group\\/carousel-pagination');
    assert.equal(await indicators.evaluate(element => getComputedStyle(element).visibility), 'hidden');
    await page.getByRole('button', { name: '下一张', exact: true }).click();
    const note = page.locator('p').filter({ hasText: '当前索引' });
    assert.match(await note.textContent() ?? '', /change：第 2 项（索引 1）.*当前索引 1/);
    await page.getByRole('button', { name: '上一张', exact: true }).click();
    assert.match(await note.textContent() ?? '', /当前索引 0/);
    await page.getByRole('button', { name: '纵向浏览', exact: true }).click();
    assert.equal(await page.locator('[data-direction]').getAttribute('data-direction'), 'vertical');
    assert.match(await code.textContent() ?? '', /:direction='"vertical"'/);
    await page.getByRole('button', { name: '多项卡片', exact: true }).click();
    assert.match(await code.textContent() ?? '', /:slides-per-view='2'/);
    await page.getByRole('button', { name: '重置', exact: true }).click();
    assert.match(await code.textContent() ?? '', /"display":"always"/);
    assert.match(await code.textContent() ?? '', /:slides-per-view='1'/);
    assert.match(await code.textContent() ?? '', /:indicator-offset='8'/);
    assert.equal(await page.locator('[data-direction]').getAttribute('data-direction'), 'horizontal');
    assert.match(await note.textContent() ?? '', /尚未切换.*当前索引 0/);
    const field = (label: string) => page.getByText(label, { exact: true }).locator('..').locator('select');
    await field('显示模式').selectOption('never');
    assert.equal(await indicators.count(), 0);
    assert.equal(await page.getByText('指示器类型', { exact: true }).count(), 0, '不显示分页时收起相关控件');
    assert.match(await code.textContent() ?? '', /"display":"never"/);
    await field('显示模式').selectOption('always');
    await field('指示器类型').selectOption('progress');
    assert.equal(await page.getByText('指示器背景', { exact: true }).count(), 0, '进度条不展示无效背景开关');
    await page.getByRole('checkbox', { name: '循环', exact: true }).uncheck();
    await field('每屏数量').selectOption('2');
    for (let index = 1; index <= 2; index++) {
      await page.getByRole('button', { name: '下一张', exact: true }).click();
      await page.waitForTimeout(850);
      assert.match(await note.textContent() ?? '', new RegExp(`当前索引 ${index}`));
    }
    assert.equal(await page.getByRole('button', { name: '下一张', exact: true }).isDisabled(), true, '多项非循环末个可视组不能继续切页');
  }, demoEntry);
});

it('不支持悬停的触屏设备上，hover 指示器降级为始终可见', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const touchPage = await page.context().browser()!.newPage({ hasTouch: true, isMobile: true, viewport: { width: 800, height: 600 } });
    try {
      await touchPage.goto(page.url());
      await touchPage.evaluate(() => (window as any).carouselFixture.configure({ pagination: { type: 'dot', display: 'hover' } }));
      await touchPage.locator('.fixture-indicators').waitFor();
      assert.equal(await touchPage.evaluate(() => matchMedia('(hover: none)').matches), true);
      assert.equal(await touchPage.locator('.fixture-indicators').evaluate(element => getComputedStyle(element).visibility), 'visible');
    } finally { await touchPage.close(); }
  });
});

/** 包装原生方法记录真实偏移，仍完整执行浏览器滚动，不替换动画。 */
async function recordInstantMoves(page: Page) {
  await page.evaluate(`(() => {
    const viewport=document.querySelector('[data-direction]');
    const scroll=viewport.scrollTo.bind(viewport);window.instantMoves=[];
    viewport.scrollTo=options=>{const before=viewport.scrollLeft;scroll(options);if(options.behavior==='instant')window.instantMoves.push([before,viewport.scrollLeft]);};
  })()`);
}

it('按住拖拽跨过半张时保持跟手，不在松手前归位克隆页', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const url = page.url();
    for (const direction of ['horizontal', 'vertical']) for (const step of [-1, 1]) {
      await page.goto(`${url}?direction=${direction}&model=${step === 1 ? 11 : 0}`);
      await page.evaluate(() => (window as any).carouselFixture.configure({ draggable: true, indicatorPosition: 'none', arrow: 'never' }));
      const viewport = page.locator('[data-direction]');
      await viewport.waitFor(); await page.waitForTimeout(700);
      const box = (await viewport.boundingBox())!;
      const size = direction === 'vertical' ? box.height : box.width;
      const origin = await viewport.evaluate(element => element.getAttribute('data-direction') === 'vertical' ? element.scrollTop : element.scrollLeft);
      const x = box.x + box.width * (direction === 'vertical' ? 0.5 : step === 1 ? 0.85 : 0.15);
      const y = box.y + box.height * (direction === 'vertical' ? step === 1 ? 0.85 : 0.15 : 0.3);
      await page.mouse.move(x, y); await page.mouse.down();
      try {
        for (const fraction of [0.3, 0.6, 0.55, 0.65]) {
          await page.mouse.move(x - (direction === 'horizontal' ? step * size * fraction : 0), y - (direction === 'vertical' ? step * size * fraction : 0));
          await page.waitForTimeout(180);
          const held = await viewport.evaluate(element => element.getAttribute('data-direction') === 'vertical' ? element.scrollTop : element.scrollLeft);
          assert.ok(Math.abs(held - (origin + step * size * fraction)) <= 1, `${direction}/${step} 拖拽途中发生跳转：${held}，预期 ${origin + step * size * fraction}`);
        }
      } finally { await page.mouse.up(); }
      await page.waitForTimeout(800);
      const final = await viewport.evaluate(element => element.getAttribute('data-direction') === 'vertical' ? element.scrollTop : element.scrollLeft);
      assert.ok(Math.abs(final - (step === 1 ? 4 : 15) * size) <= 1, '松手后吸附一次并归位到对应真实页');
      assert.deepEqual(await page.evaluate(() => (window as any).carouselFixture.changes), [step === 1 ? 0 : 11], '拖拽过程中不来回派发切换事件');
    }
  });
});

it('触屏按住拖至首尾边界后松手，页码和进度仍同步', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const url = page.url();
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    for (const direction of ['horizontal', 'vertical']) for (const step of [1, -1]) {
      await page.goto(`${url}?count=4&direction=${direction}&model=${step === 1 ? 2 : 1}`);
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('#app')!.style.marginTop = '120px';
        (window as any).carouselFixture.configure({ loop: false, pagination: { type: 'progress' }, arrow: 'never' });
      });
      const viewport = page.locator('[data-direction]');
      await viewport.waitFor(); await page.waitForTimeout(700);
      const box = (await viewport.boundingBox())!;
      const startX = box.x + box.width * (direction === 'vertical' ? 0.5 : step === 1 ? 0.9 : 0.1);
      const startY = box.y + box.height * (direction === 'vertical' ? step === 1 ? 0.9 : 0.1 : 0.3);
      const distance = (direction === 'vertical' ? box.height : box.width) * 1.3;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: startY }] });
      try {
        for (let i = 1; i <= 24; i++) {
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
            x: startX - (direction === 'horizontal' ? step * distance * i / 24 : 0),
            y: startY - (direction === 'vertical' ? step * distance * i / 24 : 0),
          }] });
          await page.waitForTimeout(25);
        }
        // 边界按住至滚动完全结束，松手后不会再靠新的 scroll 事件补偿索引。
        await page.waitForTimeout(350);
        const offset = await viewport.evaluate(element => element.getAttribute('data-direction') === 'vertical' ? element.scrollTop : element.scrollLeft);
        assert.equal(offset, step === 1 ? (direction === 'vertical' ? 720 : 1800) : 0, `${direction}/${step} 原生手势应抵达边界`);
      } finally {
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await page.waitForTimeout(350);
      assert.deepEqual(await page.evaluate(() => (window as any).carouselFixture.changes), [step === 1 ? 3 : 0]);
      assert.deepEqual(await page.evaluate(() => (window as any).carouselFixture.updates), [step === 1 ? 3 : 0]);
      assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), step === 1 ? '100' : '25');
    }
    await session.detach();
  });
});

it('触屏松手不覆盖进行中的外部模型切页', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const url = page.url();
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    for (const direction of ['horizontal', 'vertical']) for (const loop of [false, true]) {
      await page.goto(`${url}?count=4&direction=${direction}`);
      await page.evaluate(loop => (window as any).carouselFixture.configure({ loop, pagination: { type: 'progress' }, arrow: 'never' }), loop);
      const viewport = page.locator('[data-direction]');
      await viewport.waitFor(); await page.waitForTimeout(700);
      const box = (await viewport.boundingBox())!;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
      try {
        await page.evaluate(() => (window as any).carouselFixture.configure({ modelValue: 2 }));
        await page.waitForTimeout(60);
      } finally {
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await page.waitForTimeout(850);
      assert.deepEqual(await page.evaluate(() => (window as any).carouselFixture.changes), [], '外部切页不应被松手时的中途位置覆盖');
      assert.deepEqual(await page.evaluate(() => (window as any).carouselFixture.updates), []);
      assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '75');
      const offset = await viewport.evaluate(element => element.getAttribute('data-direction') === 'vertical' ? element.scrollTop : element.scrollLeft);
      assert.equal(offset, (loop ? 6 : 2) * (direction === 'vertical' ? 240 : 600));
    }
    await session.detach();
  });
});

it('单项占满视口时前后无间距，多项显示仍保留 spaceBetween', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    for (const direction of ['horizontal', 'vertical']) for (const perView of [1, 2, 1]) {
      await page.evaluate(value => (window as any).carouselFixture.configure(value), { direction, slidesPerView: perView, spaceBetween: 16 });
      await page.waitForTimeout(350);
      const gap = await page.locator('[data-direction] > div').evaluate((track) => {
        const first = track.children[0]!.getBoundingClientRect();
        const second = track.children[1]!.getBoundingClientRect();
        return track.parentElement!.getAttribute('data-direction') === 'vertical' ? second.top - first.bottom : second.left - first.right;
      });
      assert.equal(gap, perView === 1 ? 0 : 16, `${direction}/${perView} 项的相邻内容间距`);
    }
  });
});

it('line 为 24×2px，dot 为 6×6px 和 10×6px 描边，间距和容器内边距为 8px', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    for (const type of ['line', 'dot']) {
      await page.evaluate(type => (window as any).carouselFixture.configure({ pagination: { type } }), type);
      // 等待真实切换与尺寸动画完成，避免并行测试时固定等待先于绘制结束。
      await page.waitForFunction((type) => {
        const active = document.querySelector('[aria-current="true"]')!;
        const rect = active.getBoundingClientRect();
        return rect.width === (type === 'line' ? 24 : 10) && rect.height === (type === 'line' ? 2 : 6);
      }, type);
      const dimensions = await page.getByRole('button', { name: '切换到第 1 项', exact: true }).evaluate((active) => {
        const inactive = active.nextElementSibling!;
        const style = getComputedStyle(active.parentElement!);
        return { active: [active.getBoundingClientRect().width, active.getBoundingClientRect().height], inactive: [inactive.getBoundingClientRect().width, inactive.getBoundingClientRect().height], padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft], gap: style.gap, border: getComputedStyle(active).borderTopWidth };
      });
      assert.deepEqual(dimensions.active, type === 'line' ? [24, 2] : [10, 6], `${type} 激活项尺寸`);
      assert.deepEqual(dimensions.inactive, type === 'line' ? [24, 2] : [6, 6], `${type} 普通项尺寸`);
      assert.deepEqual(dimensions.padding, ['8px', '8px', '8px', '8px']);
      assert.equal(dimensions.gap, '8px');
      assert.equal(dimensions.border, type === 'dot' ? '1px' : '0px');
    }
  });
});

it('button 分页容器随方向交换留白，切换前后激活与未激活项的可见尺寸保持一致', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    await page.goto(`${page.url()}?count=4`);
    for (const direction of ['horizontal', 'vertical']) for (const indicatorPosition of ['inside', 'outside']) for (const indicatorBackground of [true, false]) {
      await page.evaluate(value => (window as any).carouselFixture.configure(value), {
        direction, indicatorPosition, modelValue: 0, pagination: { type: 'button', indicatorBackground },
      });
      for (const index of [0, 1]) {
        const selected = page.getByRole('button', { name: `切换到第 ${index + 1} 项`, exact: true });
        await selected.click();
        await page.waitForTimeout(350);
        assert.equal(await selected.getAttribute('aria-current'), 'true');
        const padding = await page.locator('.fixture-indicators').evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
        });
        assert.deepEqual(padding, direction === 'vertical' ? ['8px', '4px', '8px', '4px'] : ['4px', '8px', '4px', '8px'], '背景开关与内外位置不应改变当前方向的 button 容器留白');
        const dimensions = await page.locator('.fixture-indicators button').evaluateAll(buttons => buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          const shadow = getComputedStyle(button).boxShadow;
          // 外扩描边不计入布局尺寸，必须连同可见外径一起检查。
          const spread = Math.max(0, ...shadow.split(/,(?![^(]*\))/).filter(part => !part.includes('inset')).map(part => Number.parseFloat(part.match(/-?[\d.]+px/g)?.[3] ?? '0')));
          return { active: button.getAttribute('aria-current') === 'true', layout: [rect.width, rect.height], visible: [rect.width + spread * 2, rect.height + spread * 2], shadow };
        }));
        for (const item of dimensions) {
          const label = `${direction}/${indicatorPosition}/${indicatorBackground}/${item.active ? '激活' : '未激活'}`;
          assert.deepEqual(item.layout, [20, 20], `${label} 布局尺寸`);
          assert.deepEqual(item.visible, [20, 20], `${label} 可见尺寸，描边：${item.shadow}`);
        }
      }
    }
  });
});

it('pagination.indicatorBackground 控制全部内置分页背景，关闭不影响指示项配色', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    for (const position of ['inside', 'outside']) for (const type of ['line', 'dot', 'fraction', 'button']) {
      const styles = [];
      for (const indicatorBackground of [true, false]) {
        await page.evaluate(value => (window as any).carouselFixture.configure(value), { indicatorPosition: position, pagination: { type, indicatorBackground } });
        await page.waitForTimeout(350);
        styles.push(await page.locator('.fixture-indicators').evaluate((container) => {
          const style = getComputedStyle(container);
          const item = getComputedStyle(container.firstElementChild!);
          return { background: style.backgroundColor, border: style.borderTopWidth, shadow: style.boxShadow, blur: style.backdropFilter, itemColor: item.color, itemBackground: item.backgroundColor };
        }));
      }
      assert.notEqual(styles[0]!.background, 'rgba(0, 0, 0, 0)', `${position}/${type} 默认显示背景`);
      assert.notEqual(styles[0]!.shadow, 'none', `${position}/${type} 显示背景时带阴影`);
      assert.deepEqual([styles[1]!.background, styles[1]!.border, styles[1]!.shadow, styles[1]!.blur], ['rgba(0, 0, 0, 0)', '0px', 'none', 'none'], `${position}/${type} 关闭背景`);
      assert.equal(styles[0]!.itemColor, styles[1]!.itemColor);
      assert.equal(styles[0]!.itemBackground, styles[1]!.itemBackground);
    }
  });
});

it('fraction 由分数字符自然撑开，横纵轮播均横向排列', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    for (const direction of ['horizontal', 'vertical']) {
      await page.evaluate(value => (window as any).carouselFixture.configure(value), { direction, modelValue: 0, pagination: { type: 'fraction' } });
      await page.waitForTimeout(700);
      const container = page.locator('.fixture-indicators');
      const first = await container.evaluate((element) => ({ width: element.getBoundingClientRect().width, min: getComputedStyle(element).minWidth, height: element.getBoundingClientRect().height }));
      await page.evaluate(() => (window as any).carouselFixture.configure({ modelValue: 10 }));
      await page.waitForTimeout(700);
      const second = (await container.boundingBox())!;
      assert.equal(first.min, '0px'); assert.ok(first.width < 90, `分数容器不应保留固定宽度：${first.width}`);
      assert.ok(second.width > first.width + 4, '双位数应自然增加横向容器宽度');
      assert.equal(second.height, first.height, '页码位数改变不影响容器高度');
      const items = await container.locator('span').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y };
      }));
      assert.ok(items[0]!.x < items[1]!.x && items[1]!.x < items[2]!.x, '当前页、分隔符、总页数从左到右排列');
      assert.equal(items[0]!.y, items[2]!.y, '当前页与总页数保持同一行');
    }
    for (const indicatorPosition of ['inside', 'outside']) for (const side of ['right', 'left']) for (const indicatorOffset of [undefined, 0, 24]) {
      await page.evaluate(async value => {
        const api = (window as any).carouselFixture; api.configure(value); await api.flush();
      }, {
        direction: 'vertical', modelValue: 0, indicatorPosition, indicatorOffset, pagination: { type: 'fraction' },
        ui: { root: 'fixture-main', indicators: 'fixture-indicators', indicatorWrapper: side === 'right' ? '' : indicatorPosition === 'inside' ? 'left-(--carousel-indicator-offset) right-auto' : 'order-first ml-0 mr-(--carousel-indicator-offset)' },
      });
      const bounds = await page.locator('.fixture-indicators').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const main = document.querySelector('.fixture-main')!.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { top: rect.top - main.top, innerLeft: rect.left - main.left, innerRight: main.right - rect.right, outerLeft: main.left - rect.right, outerRight: rect.left - main.right, padding: [style.paddingTop, style.paddingRight] };
      });
      const offset = indicatorOffset ?? 8;
      const label = `${indicatorPosition}/${side}/${offset}`;
      assert.equal(bounds.top, indicatorPosition === 'inside' ? offset : 0, `${label} 分数应位于顶部`);
      assert.equal(indicatorPosition === 'inside' ? side === 'left' ? bounds.innerLeft : bounds.innerRight : side === 'left' ? bounds.outerLeft : bounds.outerRight, offset, `${label} 保留左右间距`);
      assert.deepEqual(bounds.padding, ['16px', '4px'], `${label} 保留现有内边距`);
    }
  });
});

it('五种分页在明暗主题下按七种 color 使用第 6 阶，灰阶和 ui 覆盖仍生效', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    // 本用例只检查颜色终态，去掉过渡避免把插值颜色当成回归。
    await page.addStyleTag({ content: '* { transition: none !important; }' });
    const container = page.locator('.fixture-indicators');
    const active = container.locator('[aria-current="true"]');
    const inactive = container.locator('button').nth(1);
    const current = container.locator('span').first();
    const colorTokens = { primary: 'brand-6', secondary: 'secondary-6', success: 'green-6', info: 'blue-6', warning: 'orange-6', error: 'red-6', neutral: 'gray-6' };
    const configure = async (value: Record<string, unknown>) => {
      await page.mouse.move(0, 600);
      await page.evaluate(async (value) => { const api = (window as any).carouselFixture; api.configure(value); await api.flush(); }, value);
    };
    for (const dark of [false, true]) {
      const palette = await page.evaluate(({ dark, tokens }) => {
        document.documentElement.classList.toggle('dark', dark);
        const probe = document.createElement('span'); document.body.append(probe);
        const colors: Record<string, string> = {};
        for (const token of [...Object.values(tokens), 'gray-1', 'gray-2', 'gray-4', 'gray-5', 'gray-9', 'gray-10']) {
          probe.style.color = `var(--color-${token})`; colors[token] = getComputedStyle(probe).color;
        }
        probe.remove(); return colors;
      }, { dark, tokens: colorTokens });
      for (const [color, token] of Object.entries(colorTokens)) for (const indicatorPosition of ['inside', 'outside']) {
        for (const type of ['line', 'dot', 'progress', 'fraction', 'button']) {
          const label = `${dark ? '深色' : '浅色'}/${color}/${indicatorPosition}/${type}`;
          await configure({ color, indicatorPosition, pagination: { type } });
          if (type === 'line' || type === 'dot') {
            const property = type === 'line' ? 'backgroundColor' : 'borderTopColor';
            const base = palette[type === 'dot' ? 'gray-10' : indicatorPosition === 'inside' ? 'gray-1' : 'gray-5'];
            assert.equal(await active.evaluate((element, property) => getComputedStyle(element)[property], property), base, `${label} 默认保留灰阶`);
            await active.hover();
            assert.equal(await active.evaluate((element, property) => getComputedStyle(element)[property], property), palette[token], `${label} 激活项悬停使用第 6 阶`);
            await inactive.hover();
            assert.equal(await inactive.evaluate(element => getComputedStyle(element).backgroundColor), palette[type === 'line' ? 'gray-4' : 'gray-10'], `${label} 普通项悬停不染色`);
            await configure({ pagination: { type, clickable: false } });
            await active.hover();
            assert.equal(await active.evaluate((element, property) => getComputedStyle(element)[property], property), base, `${label} 禁用交互后悬停不染色`);
          } else if (type === 'progress') {
            assert.equal(await page.getByRole('progressbar').count(), 1, `${label} 使用真实进度条`);
            assert.equal(await container.locator('[data-progress-fill]').evaluate(element => getComputedStyle(element).backgroundColor), palette[token], `${label} 实际填充使用第 6 阶`);
          } else if (type === 'fraction') {
            const base = await current.evaluate(element => getComputedStyle(element).color);
            await container.locator('span').last().hover();
            assert.equal(await current.evaluate(element => getComputedStyle(element).color), base, `${label} 仅悬停总数不改变当前页颜色`);
            assert.equal(await container.locator('span').last().evaluate(element => getComputedStyle(element).fontWeight), '700', `${label} 容器悬停仍强调总数`);
            await current.hover();
            assert.equal(await current.evaluate(element => getComputedStyle(element).color), palette[token], `${label} 当前页自身悬停使用第 6 阶`);
          } else {
            assert.equal(await active.evaluate(element => getComputedStyle(element).backgroundColor), palette[token], `${label} 激活填充使用第 6 阶`);
          }
        }
      }
      for (const type of ['line', 'dot', 'progress', 'fraction', 'button']) {
        await configure({ color: 'error', pagination: { type }, ui: {
          root: 'fixture-main', indicators: 'fixture-indicators',
          indicatorActive: type === 'button' ? 'bg-gray-2' : 'enabled:hover:bg-gray-2 enabled:hover:border-gray-2',
          indicatorCurrent: 'hover:text-gray-2', progress: 'text-gray-2',
        } });
        const target = type === 'progress' ? container.locator('[data-progress-fill]') : type === 'fraction' ? current : active;
        if (type !== 'progress') await target.hover();
        const property = type === 'dot' ? 'borderTopColor' : type === 'fraction' ? 'color' : 'backgroundColor';
        assert.equal(await target.evaluate((element, property) => getComputedStyle(element)[property], property), palette['gray-2'], `${dark ? '深色' : '浅色'}/${type} 保留 ui 覆盖优先级`);
      }
      await configure({ ui: { root: 'fixture-main', indicators: 'fixture-indicators' } });
    }
  });
});

it('分页背景按类型与内外位置使用灰阶和毛玻璃，文字悬停只强调当前页和总数', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const palette = await page.evaluate(() => {
      const probe = document.createElement('div'); document.body.append(probe);
      const colors: Record<string, string> = {};
      for (const key of ['gray-1', 'gray-2', 'gray-4', 'gray-5', 'gray-10', 'primary']) {
        probe.style.backgroundColor = `var(--color-${key})`; colors[key] = getComputedStyle(probe).backgroundColor;
      }
      probe.style.backgroundColor = 'color-mix(in oklab, var(--color-gray-1) 30%, transparent)';
      colors['pagination-background'] = getComputedStyle(probe).backgroundColor;
      probe.style.backgroundColor = 'color-mix(in oklab, var(--color-gray-1) 80%, transparent)';
      colors['compact-background'] = getComputedStyle(probe).backgroundColor;
      probe.style.backgroundColor = 'color-mix(in oklab, var(--color-gray-10) 30%, transparent)';
      colors['inside-line-background'] = getComputedStyle(probe).backgroundColor;
      probe.remove(); return colors;
    });
    for (const position of ['inside', 'outside']) for (const type of ['line', 'dot', 'fraction', 'button']) {
      await page.mouse.move(0, 0);
      await page.evaluate(value => (window as any).carouselFixture.configure(value), { indicatorPosition: position, pagination: { type } });
      await page.waitForTimeout(350);
      const container = page.locator('.fixture-indicators');
      const styles = await container.evaluate((element) => {
        const style = getComputedStyle(element);
        const first = getComputedStyle(element.children[0]!); const second = getComputedStyle(element.children[1]!);
        return { background: style.backgroundColor, blur: style.backdropFilter, radius: style.borderRadius, height: element.getBoundingClientRect().height, font: style.fontSize, padding: [style.paddingTop, style.paddingRight], active: first.backgroundColor, inactive: second.backgroundColor, border: first.borderTopColor };
      });
      const background = type === 'line' && position === 'inside' ? 'inside-line-background' : ['line', 'dot'].includes(type) ? 'compact-background' : 'pagination-background';
      assert.equal(styles.background, palette[background]);
      assert.equal(styles.blur, 'blur(24px)');
      assert.ok(Number.parseFloat(styles.radius) >= styles.height / 2, '胶囊圆角至少为容器高度的一半');
      if (type === 'line') {
        assert.equal(styles.active, palette[position === 'inside' ? 'gray-1' : 'gray-5']); assert.equal(styles.inactive, palette['gray-4']);
      } else if (type === 'dot') {
        assert.equal(styles.active, 'rgba(0, 0, 0, 0)'); assert.equal(styles.inactive, palette['gray-10']); assert.equal(styles.border, palette['gray-10']);
      } else if (type === 'fraction') {
        assert.equal(styles.font, '14px'); assert.deepEqual(styles.padding, ['4px', '16px']);
        await container.locator('span').first().hover(); await page.waitForTimeout(350);
        const emphasis = await container.evaluate(element => ({ current: getComputedStyle(element.firstElementChild!).color, total: getComputedStyle(element.lastElementChild!).fontWeight, text: element.textContent }));
        assert.equal(emphasis.current, palette.primary); assert.equal(emphasis.total, '700'); assert.equal(emphasis.text?.replace(/\s/g, ''), '1/12');
      }
    }
  });
});

it('指示器线段、激活圆点和按钮留白跟随轮播方向，内外位置一致', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    await page.goto(`${page.url()}?count=4`);
    await page.addStyleTag({ content: '* { transition: none !important; }' });
    for (const direction of ['horizontal', 'vertical']) for (const indicatorPosition of ['inside', 'outside']) for (const type of ['line', 'dot', 'button']) {
      await page.evaluate(async value => {
        const api = (window as any).carouselFixture; api.configure(value); await api.flush();
      }, { direction, indicatorPosition, pagination: { type } });
      const styles = await page.locator('.fixture-indicators').evaluate(element => {
        const style = getComputedStyle(element);
        const active = element.querySelector('[aria-current="true"]')!.getBoundingClientRect();
        const inactive = element.querySelector('button:not([aria-current])')!.getBoundingClientRect();
        return { active: [active.width, active.height], inactive: [inactive.width, inactive.height], padding: [style.paddingTop, style.paddingRight], direction: style.flexDirection };
      });
      const vertical = direction === 'vertical'; const label = `${direction}/${indicatorPosition}/${type}`;
      assert.equal(styles.direction, vertical ? 'column' : 'row', label);
      if (type === 'line') {
        assert.deepEqual(styles.active, vertical ? [2, 24] : [24, 2], label);
        assert.deepEqual(styles.inactive, styles.active, label);
      } else if (type === 'dot') {
        assert.deepEqual(styles.active, vertical ? [6, 10] : [10, 6], label);
        assert.deepEqual(styles.inactive, [6, 6], label);
      } else {
        assert.deepEqual(styles.active, [20, 20], label);
        assert.deepEqual(styles.padding, vertical ? ['8px', '4px'] : ['4px', '8px'], label);
      }
    }
  });
});

it('progress 使用 2px 平端进度条显示页数比例，横向贴顶或贴底，纵向贴侧边从上向下', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    await page.goto(`${page.url()}?count=4`);
    for (const direction of ['horizontal', 'vertical']) for (const position of ['inside', 'outside']) for (const indicatorBackground of [true, false]) {
      await page.evaluate(value => (window as any).carouselFixture.configure(value), { direction, modelValue: 0, indicatorPosition: position, indicatorOffset: 32, pagination: { type: 'progress', indicatorBackground } });
      const progress = page.getByRole('progressbar');
      assert.equal(await progress.count(), 1, '渲染真实 RebornProgress 而非导航按钮');
      assert.equal(await progress.getAttribute('aria-orientation'), direction);
      await page.waitForTimeout(700);
      for (const [modelValue, percent] of [[0, 25], [3, 100], [0, 25]]) {
        await page.evaluate(value => (window as any).carouselFixture.configure({ modelValue: value }), modelValue);
        await page.waitForTimeout(700);
        assert.equal(Number(await progress.getAttribute('aria-valuenow')), percent);
        const bounds = await page.evaluate(() => {
          const main = document.querySelector('.fixture-main')!.getBoundingClientRect();
          const container = document.querySelector('.fixture-indicators')!;
          const track = container.querySelector('[data-progress-track]')!; const fill = container.querySelector('[data-progress-fill]')!;
          const rect = track.getBoundingClientRect(); const style = getComputedStyle(container);
          const filled = fill.getBoundingClientRect();
          return { x: rect.x - main.x, y: rect.y - main.y, width: rect.width, height: rect.height, mainWidth: main.width, mainHeight: main.height, radius: [getComputedStyle(track).borderRadius, getComputedStyle(fill).borderRadius], fillWidth: filled.width / rect.width * 100, fillHeight: filled.height / rect.height * 100, fillTop: filled.top - rect.top, fillLeft: filled.left - rect.left, blur: style.backdropFilter, background: style.backgroundColor, shadow: style.boxShadow };
        });
        if (direction === 'vertical') {
          assert.deepEqual([bounds.y, bounds.width, bounds.height], [0, 2, bounds.mainHeight]);
          assert.equal(bounds.x, position === 'inside' ? bounds.mainWidth - 2 : bounds.mainWidth);
          assert.equal(bounds.fillTop, 0, '纵向进度从顶部开始');
          assert.ok(Math.abs(bounds.fillHeight - percent) < 0.1);
          assert.equal(bounds.fillWidth, 100);
        } else {
          assert.deepEqual([bounds.x, bounds.width, bounds.height], [0, bounds.mainWidth, 2]);
          assert.equal(bounds.y, position === 'inside' ? 0 : bounds.mainHeight);
          assert.equal(bounds.fillLeft, 0);
          assert.ok(Math.abs(bounds.fillWidth - percent) < 0.1);
        }
        assert.deepEqual(bounds.radius, ['0px', '0px']);
        assert.deepEqual([bounds.blur, bounds.background, bounds.shadow], ['none', 'rgba(0, 0, 0, 0)', 'none']);
      }
    }
    // 断点生效后同样按纵向绘制，并保留将内外进度条移到左侧的样式覆盖。
    for (const indicatorPosition of ['inside', 'outside']) {
      await page.evaluate(async value => {
        const api = (window as any).carouselFixture; api.configure(value); await api.flush();
      }, {
        direction: 'horizontal', breakpoints: { 0: { direction: 'vertical' } }, modelValue: 1,
        indicatorPosition, pagination: { type: 'progress' },
        ui: { root: 'fixture-main', indicators: 'fixture-indicators', indicatorWrapper: indicatorPosition === 'inside' ? 'left-0 right-auto' : 'order-first' },
      });
      await page.waitForTimeout(700);
      const bounds = await page.evaluate(() => {
        const main = document.querySelector('.fixture-main')!.getBoundingClientRect();
        const track = document.querySelector('[data-progress-track]')!.getBoundingClientRect();
        const fill = document.querySelector('[data-progress-fill]')!.getBoundingClientRect();
        return { x: track.x - main.x, y: track.y - main.y, height: track.height, mainHeight: main.height, fill: fill.height / track.height * 100 };
      });
      assert.equal(await page.getByRole('progressbar').getAttribute('aria-orientation'), 'vertical');
      assert.deepEqual([bounds.x, bounds.y, bounds.height], [indicatorPosition === 'inside' ? 0 : -2, 0, bounds.mainHeight]);
      assert.ok(Math.abs(bounds.fill - 50) < 0.1, '左侧进度条仍按页数从上往下填充');
    }
  });
});

it('真实滚动双向首尾相邻衔接，连续切换只在抵达克隆目标后静默归位', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const url = page.url();
    for (const direction of ['horizontal', 'vertical']) for (const step of [1, -1]) {
      for (const action of ['arrow', 'model', 'indicator']) {
        // 各输入方式独立挂载，避免上一场景的原生滚动和轴向布局变更污染起点。
        await page.goto(`${url}?direction=${direction}&model=${step === 1 ? 11 : 0}`);
        await page.locator('[data-direction]').waitFor(); await page.waitForTimeout(700);
        const trajectory = await page.evaluate(async ({ direction, step, action }) => {
          const api = (window as any).carouselFixture;
          const changeStart = api.changes.length;
          const updateStart = api.updates.length;
          const viewport = document.querySelector<HTMLElement>('[data-direction]')!;
          const values: number[] = [];
          const targets = step === 1 ? [0, 1] : [11, 10];
          for (let i = 0; i < targets.length; i++) {
            setTimeout(() => {
              if (action === 'model') api.configure({ modelValue: targets[i] });
              else if (action === 'indicator') api.goTo(targets[i]);
              else api[step === 1 ? 'next' : 'prev']();
            }, i * 60);
          }
          const started = performance.now();
          while (performance.now() - started < 1180) {
            values.push(direction === 'vertical' ? viewport.scrollTop : viewport.scrollLeft);
            await new Promise<void>(done => requestAnimationFrame(() => done()));
          }
          return { values, changes: api.changes.slice(changeStart), updates: api.updates.slice(updateStart) };
        }, { direction, step, action });
        const offsets = trajectory.values;
        if (action === 'model') {
          assert.deepEqual(trajectory.changes, []); assert.deepEqual(trajectory.updates, []);
        }
        const size = direction === 'vertical' ? 240 : 600;
        const cloneTarget = (step === 1 ? 17 : 2) * size;
        let rebases = 0;
        for (let i = 1; i < offsets.length; i++) {
          if ((offsets[i]! - offsets[i - 1]!) * step >= -1) continue;
          rebases++;
          assert.ok(Math.abs(offsets[i - 1]! - cloneTarget) < 3, `${direction}/${step}/${action} 抵达目标前提前跳转：${JSON.stringify(trajectory)}`);
        }
        assert.equal(rebases, 1, `${direction}/${step}/${action} 应只在完成后归位一次；轨迹 ${offsets.join(',')}`);
        assert.equal(offsets.at(-1), (step === 1 ? 5 : 14) * size);
      }
    }
  });
});

it('连续步进耗尽缓冲时平移完整周期，不把中间画面吸附到整张', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const url = page.url();
    for (const [count, method, beforeEnd, finalOffset] of [[12, 'next', 6000, 6000], [12, 'prev', 5400, 5400], [4, 'next', 6000, 3600], [4, 'prev', 600, 3000]] as const) {
      await page.goto(`${url}?count=${count}&model=${method === 'next' ? count - 1 : 0}`);
      await page.locator('[data-direction]').waitFor(); await page.waitForTimeout(700);
      await recordInstantMoves(page);
      for (let i = 0; i < 7; i++) {
        await page.evaluate(method => (window as any).carouselFixture[method](), method);
        await page.waitForTimeout(50);
      }
      // 重定位后原生动画可能跨多张，等待转场真正解除，不用固定时长截断测试。
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-direction]')!).scrollSnapType !== 'none', null, { timeout: 3500 });
      const moves = await page.evaluate(() => (window as any).instantMoves as number[][]);
      assert.equal(moves.length, 2, `缓冲耗尽时只平移等价周期一次，完成后再归位：${JSON.stringify(moves)}`);
      assert.ok(Math.abs(Math.abs(moves[0]![1]! - moves[0]![0]!) - count * 600) <= 1, `等价平移不应被吸附改变：${JSON.stringify(moves)}`);
      assert.ok(Math.abs(moves.at(-1)![0]! - beforeEnd) <= 1, '耗尽缓冲后仍保持原有方向，抵达目标后才归位');
      const final = await page.locator('[data-direction]').evaluate(element => element.scrollLeft);
      assert.equal(final, finalOffset);
    }
  });
});

it('真实动画中同帧连点不会取消待执行的等价周期平移', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    const url = page.url();
    for (const [method, origin, finalOffset] of [['next', 3, 3000], ['prev', 0, 3600]] as const) {
      await page.goto(`${url}?count=4&model=${origin}`);
      await page.locator('[data-direction]').waitFor(); await page.waitForTimeout(700);
      await recordInstantMoves(page);
      await page.evaluate(async (method) => {
        const api = (window as any).carouselFixture;
        for (let i = 0; i < 4; i++) { api[method](); await api.flush(); }
      }, method);
      await page.waitForFunction(method => {
        const offset = document.querySelector('[data-direction]')!.scrollLeft;
        return method === 'next' ? offset > 6000 : offset < 600;
      }, method);
      await page.evaluate((method) => { const api = (window as any).carouselFixture; api[method](); api[method](); }, method);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-direction]')!).scrollSnapType !== 'none', null, { timeout: 4000 });
      const moves = await page.evaluate(() => (window as any).instantMoves as number[][]);
      assert.equal(moves.length, 2); assert.equal(Math.abs(moves[0]![1]! - moves[0]![0]!), 2400);
      assert.equal(await page.locator('[data-direction]').evaluate(element => element.scrollLeft), finalOffset);
    }
  });
});

it('真实多项显示的重定位始终平移完整周期', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    await page.goto(`${page.url()}?count=4&model=3&perView=2`);
    await page.locator('[data-direction]').waitFor(); await page.waitForTimeout(700);
    await recordInstantMoves(page);
    await page.evaluate(async () => {
      const api = (window as any).carouselFixture;
      for (let i = 0; i < 5; i++) { api.next(); await api.flush(); }
    });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-direction]')!).scrollSnapType !== 'none', null, { timeout: 4000 });
    const moves = await page.evaluate(() => (window as any).instantMoves as number[][]);
    assert.equal(moves.length, 2); assert.ok(moves.every(([before, after]) => Math.abs(after! - before!) === 1200), JSON.stringify(moves));
    assert.equal(await page.locator('[data-direction]').evaluate(element => element.scrollLeft), 1200);
  });
});

it('真实动画落后于大量指令时不产生越界瞬移，最终仍抵达最后目标', { skip: !browserAvailable }, async () => {
  await withCarousel(async (page) => {
    await page.goto(`${page.url()}?model=3`);
    await page.locator('[data-direction]').waitFor(); await page.waitForTimeout(700);
    await recordInstantMoves(page);
    await page.evaluate(async () => {
      const api = (window as any).carouselFixture;
      for (let i = 0; i < 13; i++) { api.next(); await api.flush(); }
    });
    assert.deepEqual(await page.evaluate(() => (window as any).instantMoves), [], '实际画面尚未进入安全区时不能瞬移');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-direction]')!).scrollSnapType !== 'none', null, { timeout: 6000 });
    const moves = await page.evaluate(() => (window as any).instantMoves as number[][]);
    assert.equal(moves.length, 2); assert.equal(Math.abs(moves[0]![1]! - moves[0]![0]!), 7200);
    assert.equal(await page.locator('[data-direction]').evaluate(element => element.scrollLeft), 4800);
  });
});
