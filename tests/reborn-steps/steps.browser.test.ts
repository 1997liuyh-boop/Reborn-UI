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

const executablePath = process.env.STEPS_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 编译真实组件与 Tailwind；本地图标避免网络请求影响尺寸验收。 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import Steps from '~/components/reborn/ui/reborn-steps/RebornSteps.vue';
        import Step from '~/components/reborn/ui/reborn-steps/RebornStep.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({active:0,direction:'horizontal',size:'md',type:'default',lineType:'solid',alignCenter:false,simple:false,space:'',color:'primary',ui:{},members:[
          {key:'a',title:'第一步',description:'简短说明'},
          {key:'b',title:'第二步',description:'另一说明'},
          {key:'c',title:'第三步',description:'完成说明'},
        ]});
        const ui={marker:'fixture-marker',title:'fixture-title',description:'fixture-description',connector:'fixture-connector',line:'fixture-line',lineFill:'fixture-line-fill',arrow:'fixture-arrow'};
        window.stepsFixture={configure:props=>Object.assign(state,props),flush:nextTick};
        createApp({render:()=>{const {members,...props}=state;return h('section',{id:'fixture-container',style:'width:960px;max-width:100%'},[
          h(Steps,props,{default:()=>members.map(item=>h(Step,{ui,...item}))})
        ])}}).mount('#app');
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'steps-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app') },
    plugins: [{ name: 'steps-browser', setup(builder) {
      builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'icons', namespace: 'steps-browser' }));
      builder.onLoad({ filter: /.*/, namespace: 'steps-browser' }, () => ({ contents: `import {h} from 'vue';export const Icon=(props)=>h('svg',{'data-icon':props.name,viewBox:'0 0 24 24'});`, loader: 'js', resolveDir: resolve('.') }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';@import './app/assets/theme/motion.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-steps'), pattern: '**/*', negated: false }] });
  const candidates = [...scanner.scan(), 'size-12', 'text-2xl', 'h-1', 'fixture-root'];
  const css = compiler.build(candidates);
  // 演示站只重置盒模型，未引入 preflight；使用相同环境验证组件不会依赖全局边框重置。
  const withoutPreflight = await compile(`@import 'tailwindcss/theme.css';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';@import './app/assets/theme/motion.css';@import 'tailwindcss/utilities.css';*{box-sizing:border-box}`, { base: resolve('.'), onDependency() {} });
  const cssWithoutPreflight = withoutPreflight.build(candidates);
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    const stylesheet = request.url === '/style.css' ? css : request.url === '/without-preflight.css' ? cssWithoutPreflight : undefined;
    const stylesheetPath = request.url === '/without-preflight' ? '/without-preflight.css' : '/style.css';
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : stylesheet ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : stylesheet ?? `<!doctype html><html><head><link rel="stylesheet" href="${stylesheetPath}"></head><body style="margin:24px"><div id="app"></div><script type="module" src="/app.js"></script></body></html>`);
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

async function withSteps(run: (page: Page) => Promise<void>, preflight = true) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  try {
    await page.goto(preflight ? url : `${url}/without-preflight`);
    await page.locator('li[data-step-index="2"]').waitFor();
    await run(page);
    assert.deepEqual(errors, [], '真实组件不应抛出运行时异常');
  } finally { await page.close(); }
}

async function configure(page: Page, props: Record<string, unknown>) {
  await page.evaluate(value => (window as any).stepsFixture.configure(value), props);
  await page.evaluate(() => (window as any).stepsFixture.flush());
}

async function geometry(page: Page) {
  return page.locator('li[data-step-index]').evaluateAll(items => items.map(item => {
    const [marker, title, description, connector, line] = ['.fixture-marker', '.fixture-title', '.fixture-description', '.fixture-connector', '.fixture-line'].map((selector) => {
      const element = item.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    return { marker: marker!, title: title!, description, connector, line };
  }));
}

function near(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) < 0.1, `${message}：实际 ${actual}，预期 ${expected}`);
}

it('水平默认布局保持标记到标题 8px、标题与连接线两侧 24px，末项没有连接线', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    const items = await geometry(page);
    for (const [index, item] of items.entries()) {
      near(item.title.left - item.marker.right, 8, '标记与标题间隔');
      near(item.description!.top - item.title.bottom, 8, '标题与描述间隔');
      if (index === items.length - 1) {
        assert.equal(item.connector, null);
        continue;
      }
      near(item.line!.left - item.title.right, 24, '标题与线间隔');
      near(items[index + 1]!.marker.left - item.line!.right, 24, '线与下一个标记间隔');
      near(item.marker.y, item.line!.y, '连接线与标记中轴对齐');
      near(item.line!.height, 2, '实线粗细');
    }
    const radius = await page.locator('.fixture-line').first().evaluate(element => Number.parseFloat(getComputedStyle(element).borderRadius));
    assert.ok(radius >= 1, '实线两端有圆角');
  });
});

it('长描述换行不会改变上行连接线的高度或前后间隔', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    const before = await geometry(page);
    await configure(page, { members: [
      { key: 'a', title: '第一步', description: '这是一段需要换行的详细描述。'.repeat(12) },
      { key: 'b', title: '第二步', description: '另一说明' },
      { key: 'c', title: '第三步', description: '完成说明' },
    ] });
    const after = await geometry(page);
    assert.ok(after[0]!.description!.height > before[0]!.description!.height, '描述真实增加高度');
    near(after[0]!.line!.y, before[0]!.line!.y, '描述不影响线高度');
    near(after[0]!.line!.left, before[0]!.line!.left, '描述不挤走连接线起点');
    near(after[0]!.line!.right, before[0]!.line!.right, '描述不挤走连接线终点');
  });
});

it('末项与前项均分宽度，长描述在可用轨道内换行并保留连接留白', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    const originalWidths = await page.locator('li[data-step-index]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
    for (const width of originalWidths) near(width, 320, '默认每一步获得相同宽度');
    await configure(page, { members: [
      { key: 'a', title: '第一步', description: '简短说明' },
      { key: 'b', title: '第二步', description: '另一说明' },
      { key: 'c', title: '第三步', description: '末项的长说明也需要限制在布局轨道之内。'.repeat(12) },
    ] });
    const items = await geometry(page);
    const widths = await page.locator('li[data-step-index]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
    for (const width of widths) near(width, 320, '末项长内容不改变每一步分配到的宽度');
    const container = await page.locator('#fixture-container').evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth, right: element.getBoundingClientRect().right }));
    assert.ok(container.scroll <= container.width + 1, '长末项不产生横向溢出');
    assert.ok(items[2]!.description!.height > 24, '末项描述真实换行');
    assert.ok(items[2]!.description!.width > 200, '末项描述使用分配到的宽度，不压缩到标题宽度');
    assert.ok(items[2]!.marker.right <= container.right, '最后的标记仍位于容器内');
    for (let index = 0; index < 2; index++) {
      assert.ok(items[index]!.line!.width > 0, '前两项保留可见连接线');
      near(items[index + 1]!.marker.left - items[index]!.line!.right, 24, '长末项不破坏连接间隔');
    }
  });
});

it('进度圆环在各尺寸和方向真实绘制，保留 3px 空隙、2px 线宽与完整可见边界', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    function progressMembers(progress: number) {
      return [
        { key: 'a', title: '第一步', description: '简短说明', progress },
        { key: 'b', title: '第二步', description: '另一说明' },
        { key: 'c', title: '第三步', description: '完成说明' },
      ];
    }
    async function ringGeometry() {
      return page.locator('svg[role="progressbar"]').evaluate((element) => {
        const ring = element as SVGSVGElement;
        const marker = ring.parentElement!.getBoundingClientRect();
        const root = ring.closest('ol')!.getBoundingClientRect();
        const svg = ring.getBoundingClientRect();
        const circles = Array.from(ring.querySelectorAll('circle')).map((circle) => {
          const box = circle.getBBox();
          const style = getComputedStyle(circle);
          return {
            x: box.x, y: box.y, width: box.width, height: box.height,
            stroke: style.stroke, strokeWidth: Number.parseFloat(style.strokeWidth),
            fill: style.fill, dasharray: style.strokeDasharray,
            length: circle.getTotalLength(), pathLength: circle.pathLength.baseVal,
          };
        });
        // 通过浏览器解析同一主题变量，避免十六进制与 rgb 序列化形式不同而误报。
        const probe = document.createElement('span');
        ring.parentElement!.append(probe);
        probe.style.color = 'var(--color-gray-3)';
        const gray = getComputedStyle(probe).color;
        probe.style.color = 'var(--step-color)';
        const color = getComputedStyle(probe).color;
        probe.remove();
        return {
          marker: { left: marker.left, right: marker.right, top: marker.top, bottom: marker.bottom },
          root: { left: root.left, right: root.right, top: root.top, bottom: root.bottom },
          svg: { left: svg.left, right: svg.right, top: svg.top, bottom: svg.bottom, width: svg.width, height: svg.height },
          circles, gray, color,
        };
      });
    }
    function verifyRing(paint: Awaited<ReturnType<typeof ringGeometry>>, scale: number, label: string) {
      const track = paint.circles[0]!;
      near(track.strokeWidth, 2 * scale, `${label} 实际圆环线宽`);
      assert.ok(track.width > 0 && track.height > 0 && track.length > 0, `${label} 浏览器生成真实圆路径`);
      near(track.width, track.height, `${label} 轨道保持正圆`);
      near(paint.marker.left - (paint.svg.left + track.x + track.strokeWidth / 2), 3 * scale, `${label} 左侧内部空隙`);
      near((paint.svg.left + track.x + track.width - track.strokeWidth / 2) - paint.marker.right, 3 * scale, `${label} 右侧内部空隙`);
      near(paint.marker.top - (paint.svg.top + track.y + track.strokeWidth / 2), 3 * scale, `${label} 顶部内部空隙`);
      near((paint.svg.top + track.y + track.height - track.strokeWidth / 2) - paint.marker.bottom, 3 * scale, `${label} 底部内部空隙`);
      assert.equal(track.stroke, paint.gray, `${label} 灰色轨道使用 gray-3`);
      assert.equal(track.fill, 'none', `${label} 圆环中心透明`);
      assert.ok(paint.svg.left >= paint.root.left - 0.1 && paint.svg.right <= paint.root.right + 0.1, `${label} 根节点留白完整容纳首步圆环左右边界`);
      assert.ok(paint.svg.top >= paint.root.top - 0.1 && paint.svg.bottom <= paint.root.bottom + 0.1, `${label} 根节点留白完整容纳首步圆环上下边界`);
      return track;
    }
    for (const size of ['sm', 'md', 'lg']) {
      for (const type of ['default', 'dot']) {
        for (const direction of ['horizontal', 'vertical']) {
          const label = `${size} ${type} ${direction}`;
          await configure(page, { size, type, direction, members: progressMembers(0) });
          assert.equal(await page.locator('svg[role="progressbar"]').count(), 1, `${label} 仅当前步骤显示圆环`);
          assert.ok(await page.locator('svg[role="progressbar"]').isVisible(), `${label} 进度圆环可见`);
          const zero = await ringGeometry();
          verifyRing(zero, 1, label);
          assert.equal(zero.circles.length, 1, `${label} 0% 只显示灰轨`);
          for (const progress of [50, 100]) {
            await configure(page, { members: progressMembers(progress) });
            const paint = await ringGeometry();
            const track = verifyRing(paint, 1, `${label} ${progress}%`);
            const foreground = paint.circles[1]!;
            assert.equal(paint.circles.length, 2, `${label} 非零进度绘制前景圆环`);
            near(foreground.width, track.width, `${label} 进度和轨道使用相同半径`);
            near(foreground.strokeWidth, 2, `${label} 进度线宽`);
            assert.equal(foreground.stroke, paint.color, `${label} 进度使用当前步骤主题色`);
            assert.equal(foreground.pathLength, 100, `${label} 路径以百分比归一化`);
            assert.deepEqual(foreground.dasharray.split(/[,\s]+/).filter(Boolean).map(Number.parseFloat), [progress, 100], `${label} 实际绘制 ${progress}% 弧长`);
          }
        }
      }
    }
    await configure(page, { size: 'md', type: 'default', direction: 'horizontal', members: progressMembers(50), color: 'success' });
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    const scaled = await ringGeometry();
    verifyRing(scaled, 1.25, '根字号 20px');
    assert.equal(scaled.circles[1]!.stroke, scaled.color, '替换主题后前景沿用步骤颜色');
    near(scaled.circles[1]!.strokeWidth, 2.5, '根字号 20px 时前景线宽随 Tailwind 刻度缩放');
    await page.screenshot({ path: resolve('node_modules/.cache/steps-progress-browser.png') });
  });
});

it('窄容器横向滚动保留最短连线和 24px 间隔，滚动后仍与标记相接', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await page.locator('#fixture-container').evaluate(element => { (element as HTMLElement).style.width = '320px'; });
    await configure(page, { members: [
      { key: 'a', title: '第一步' }, { key: 'b', title: '第二步' }, { key: 'c', title: '第三步' }, { key: 'd', title: '第四步' },
    ] });
    const overflow = await page.locator('ol').evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth, overflow: getComputedStyle(element).overflowX }));
    assert.ok(overflow.scroll > overflow.width, '窄容器保留完整轨道并在组件内部滚动');
    assert.equal(overflow.overflow, 'auto');
    for (const scrollEnd of [false, true]) {
      if (scrollEnd) await page.locator('ol').evaluate(element => { element.scrollLeft = element.scrollWidth; });
      const items = await geometry(page);
      for (let index = 0; index < items.length - 1; index++) {
        const item = items[index]!;
        assert.ok(item.line!.width >= 16, '窄容器仍保留最短可见线段');
        near(item.line!.left - item.title.right, 24, '窄容器标题与线段间隔');
        near(items[index + 1]!.marker.left - item.line!.right, 24, '滚动不改变连接线与下个标记间隔');
        near(item.line!.y, item.marker.y, '窄容器连接线保持中轴');
      }
    }
  });
});

it('三个尺寸档位与点状尺寸正确，原生 Tailwind 尺寸随根字号缩放', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const [size, marker, title, description, dot] of [['sm', 24, 14, 12, 4], ['md', 32, 16, 14, 6], ['lg', 40, 18, 16, 8]] as const) {
      await configure(page, { size, type: 'default' });
      const item = (await geometry(page))[0]!;
      near(item.marker.width, marker, `${size} 圆形宽度`);
      near(item.description!.top - item.title.bottom, 8, `${size} 标题与描述间隔`);
      assert.equal(await page.locator('.fixture-title').first().evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)), title);
      assert.equal(await page.locator('.fixture-description').first().evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)), description);
      await configure(page, { type: 'dot' });
      near((await geometry(page))[0]!.marker.width, dot, `${size} 圆点宽度`);
      assert.equal(await page.locator('.fixture-marker').first().textContent(), '');
    }
    await configure(page, { size: 'md', type: 'default', space: 220 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    const item = (await geometry(page))[0]!;
    near(item.marker.width, 40, '标记沿用原生 rem 刻度');
    near(item.title.left - item.marker.right, 10, '间距沿用原生 rem 刻度');
    near(item.title.y, item.marker.y, '根字号变化后标题仍与标记垂直居中');
    near(item.line!.y, item.marker.y, '根字号变化后连线仍与标记垂直居中');
    near(item.line!.height, 2.5, '线宽沿用原生 rem 刻度');
    assert.equal(await page.locator('li').first().evaluate(element => element.getBoundingClientRect().width), 220, '数字 space 仍以 px 计');
    assert.equal(await page.locator('.fixture-title').first().evaluate(element => getComputedStyle(element).fontSize), '16px', '字号使用固定 px 的现有令牌');
  });
});

it('居中标题位于标记下方，横向连接线与两个圆形边缘均相距 24px', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await configure(page, { alignCenter: true });
    const items = await geometry(page);
    for (let index = 0; index < items.length; index++) {
      const item = items[index]!;
      near(item.title.x, item.marker.x, '标题水平居中');
      near(item.title.top - item.marker.bottom, 8, '圆形与标题间隔');
      near(item.description!.top - item.title.bottom, 8, '标题与描述间隔');
      if (!item.line) continue;
      near(item.line.y, item.marker.y, '居中连接线中轴');
      near(item.line.left - item.marker.right, 24, '连接线起点离开圆形');
      near(items[index + 1]!.marker.left - item.line.right, 24, '连接线终点离开下一圆形');
    }
  });
});

it('横竖步骤支持四个文案方位，节点与文案组及两段文案均间隔 8px', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const direction of ['horizontal', 'vertical']) {
      for (const placement of ['top', 'bottom', 'left', 'right']) {
        const label = `${direction} ${placement}`;
        await configure(page, { direction, placement });
        const items = await geometry(page);
        for (const item of items) {
          near(item.description!.top - item.title.bottom, 8, `${label} 标题与描述间隔`);
          if (placement === 'top') near(item.marker.top - item.description!.bottom, 8, `${label} 文案组在节点上方`);
          if (placement === 'bottom') near(item.title.top - item.marker.bottom, 8, `${label} 文案组在节点下方`);
          if (placement === 'top' || placement === 'bottom') {
            near(item.title.left, item.marker.left, `${label} 标题与节点左侧对齐`);
            near(item.description!.left, item.marker.left, `${label} 描述与节点左侧对齐`);
          }
          if (placement === 'left') near(item.marker.left - item.title.right, 8, `${label} 文案组在节点左侧`);
          if (placement === 'right') near(item.title.left - item.marker.right, 8, `${label} 文案组在节点右侧`);
        }
        const axes = items.map(item => direction === 'horizontal' ? item.marker.y : item.marker.x);
        for (const axis of axes) near(axis, axes[0]!, `${label} 所有节点保持在同一连接轴`);
        for (const item of items.slice(0, -1)) {
          assert.ok(item.line && item.line.width > 0 && item.line.height > 0, `${label} 保留可见连接线`);
          for (const textItem of items) {
            for (const text of [textItem.title, textItem.description!]) {
              const horizontalOverlap = Math.min(item.line.right, text.right) - Math.max(item.line.left, text.left);
              const verticalOverlap = Math.min(item.line.bottom, text.bottom) - Math.max(item.line.top, text.top);
              assert.ok(horizontalOverlap <= 0.1 || verticalOverlap <= 0.1, `${label} 连接线不穿过文案`);
            }
          }
        }
        assert.equal(items.at(-1)!.connector, null, `${label} 末项没有多余连接线`);
      }
    }
  });
});

it('上下方默认布局从容器左侧起排，容器宽度与步距变化不会添加半步留白', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const direction of ['horizontal', 'vertical']) {
      for (const placement of ['top', 'bottom']) {
        for (const type of ['default', 'dot']) {
          for (const size of ['sm', 'lg']) {
            for (const width of [640, 960]) {
              for (const space of direction === 'horizontal' ? ['', 200, '25%'] : ['', 200]) {
                const label = `${direction} ${placement} ${type} ${size} ${width} ${space || '自动步距'}`;
                await configure(page, { direction, placement, type, size, width, space });
                const items = await geometry(page);
                const root = await page.locator('ol').evaluate(element => ({
                  left: element.getBoundingClientRect().left, padding: Number.parseFloat(getComputedStyle(element).paddingLeft),
                }));
                near(items[0]!.marker.left, root.left + root.padding, `${label} 首个节点无额外前导空白`);
                const text = await page.locator('li[data-step-index]').evaluateAll(elements => elements.map(element => ['.fixture-title', '.fixture-description'].map(selector => {
                  // 检查真实文字位置，避免仅比较铺满步宽的文本盒掩盖居中留白。
                  const range = document.createRange();
                  range.selectNodeContents(element.querySelector(selector)!);
                  return range.getBoundingClientRect().left;
                })));
                for (const [index, item] of items.entries()) {
                  near(text[index]![0]!, item.marker.left, `${label} 标题文字从节点左侧起排`);
                  near(text[index]![1]!, item.marker.left, `${label} 描述文字从节点左侧起排`);
                }
              }
            }
          }
        }
      }
    }
    for (const placement of ['top', 'bottom']) {
      await configure(page, { direction: 'horizontal', placement, type: 'default', size: 'md', width: 960, space: '' });
      await page.screenshot({ path: resolve(`node_modules/.cache/steps-${placement}-alignment-review.png`), fullPage: true });
    }
  });
});

it('显式开启居中时保留上下方节点与文字的居中效果，关闭后恢复靠左', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const placement of ['top', 'bottom']) {
      await configure(page, { placement, alignCenter: true });
      const centered = await geometry(page);
      const firstStep = await page.locator('li[data-step-index]').first().boundingBox();
      near(centered[0]!.marker.x, firstStep!.x + firstStep!.width / 2, `${placement} 居中时节点位于步宽中点`);
      for (const item of centered) {
        near(item.title.x, item.marker.x, `${placement} 居中标题`);
        near(item.description!.x, item.marker.x, `${placement} 居中描述`);
      }
      await configure(page, { alignCenter: false });
      const aligned = await geometry(page);
      near(aligned[0]!.marker.left, firstStep!.x, `${placement} 动态关闭居中后无前导留白`);
      for (let index = 0; index < aligned.length - 1; index++) {
        near(aligned[index]!.line!.left - aligned[index]!.marker.right, 24, `${placement} 动态切换不改变连线起点间隔`);
        near(aligned[index + 1]!.marker.left - aligned[index]!.line!.right, 24, `${placement} 动态切换不改变连线终点间隔`);
      }
    }
  });
});

it('单步上下方覆盖与右侧文案混排时仍从左侧起排，进度环只增加必要的边界空间', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const direction of ['horizontal', 'vertical']) {
      await configure(page, { direction, placement: 'right', active: 0, members: [
        { key: 'a', title: '第一步', description: '上方说明', placement: 'top', progress: 35 },
        { key: 'b', title: '第二步', description: '右侧说明', placement: 'right' },
        { key: 'c', title: '第三步', description: '下方说明', placement: 'bottom' },
      ] });
      const items = await geometry(page);
      const root = await page.locator('ol').boundingBox();
      near(items[0]!.marker.left - root!.x, 5, `${direction} 只保留圆环所需 5px 边界`);
      const ring = await page.locator('[role="progressbar"]').boundingBox();
      near(ring!.x, root!.x, `${direction} 进度环紧贴容器左边界且完整可见`);
      const axis = direction === 'horizontal' ? items[0]!.marker.y : items[0]!.marker.x;
      for (const item of items) near(direction === 'horizontal' ? item.marker.y : item.marker.x, axis, `${direction} 混排共用节点轴`);
      if (direction === 'vertical') {
        for (const item of items.slice(0, -1)) near(item.line!.x, item.marker.x, '纵向混排的连线与靠左节点共轴');
      }
    }
  });
});

it('左侧末项短标题的实际文字与节点保持 8px，剩余步宽不进入标题列', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const direction of ['horizontal', 'vertical']) {
      for (const type of ['default', 'dot']) {
        for (const space of direction === 'horizontal' ? ['', 240, '25%'] : ['', 160]) {
          const label = `${direction} ${type} ${space || '自动步距'}`;
          await configure(page, { direction, placement: 'left', type, space, members: [
            { key: 'a', title: '第一步', description: '说明' },
            { key: 'b', title: '第二步', description: '说明' },
            { key: 'c', title: '第三步', description: '说明' },
          ] });
          const gaps = await page.locator('li[data-step-index]').evaluateAll(items => items.map(item => {
            const title = item.querySelector('.fixture-title')!;
            // 标题盒本身可能被拉伸，使用真实文字范围捕获视觉空白。
            const range = document.createRange();
            range.selectNodeContents(title);
            return item.querySelector('.fixture-marker')!.getBoundingClientRect().left - range.getBoundingClientRect().right;
          }));
          for (const gap of gaps) near(gap, 8, `${label} 实际文字与节点间隔`);
          const items = await geometry(page);
          for (const item of items) near(item.title.left, item.description!.left, `${label} 标题与描述左对齐`);
          if (direction === 'horizontal') {
            const widths = await page.locator('li[data-step-index]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
            for (const width of widths) near(width, space ? 240 : 320, `${label} 末项保留相同步宽`);
            for (let index = 0; index < items.length - 1; index++) {
              near(items[index]!.line!.left - items[index]!.marker.right, 24, `${label} 节点与连接线间隔`);
              near(items[index + 1]!.title.left - items[index]!.line!.right, 24, `${label} 连接线与下一标题间隔`);
            }
          }
          if (process.env.STEPS_CAPTURE_LEFT === '1' && direction === 'horizontal' && type === 'default' && space === '') {
            await page.screenshot({ path: resolve('node_modules/.cache/steps-left-spacing-review.png'), fullPage: true });
          }
        }
      }
    }
  });
});

it('四向长描述、点状节点和进度圆环保持可用空间，末项不压缩且连接线不穿字', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const direction of ['horizontal', 'vertical']) {
      for (const placement of ['top', 'bottom', 'left', 'right']) {
        for (const type of ['default', 'dot']) {
          const label = `${direction} ${placement} ${type}`;
          await configure(page, { direction, placement, type, active: 1, members: [
            { key: 'a', title: '第一步', description: '说明'.repeat(20) },
            { key: 'b', title: '第二步', description: '正在处理的说明'.repeat(15), progress: 45 },
            { key: 'c', title: '第三步', description: '最后一步说明'.repeat(20) },
          ] });
          const items = await geometry(page);
          assert.ok(items.every(item => item.description && item.description.width > 0 && item.description.height > 0), `${label} 所有描述均可见`);
          const ring = await page.locator('[role="progressbar"]').evaluate(element => {
            const box = element.getBoundingClientRect();
            const root = element.closest('ol')!.getBoundingClientRect();
            return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, root: { left: root.left, right: root.right, top: root.top, bottom: root.bottom } };
          });
          assert.ok(ring.left >= ring.root.left - 0.1 && ring.right <= ring.root.right + 0.1 && ring.top >= ring.root.top - 0.1 && ring.bottom <= ring.root.bottom + 0.1, `${label} 进度环完整位于可视区域`);
          assert.equal(await page.locator('[role="progressbar"]').getAttribute('aria-valuenow'), '45', `${label} 方位变化保留当前步骤进度`);
          for (const item of items.slice(0, -1)) {
            assert.ok(item.line && item.line.width > 0 && item.line.height > 0, `${label} 长内容下连接线仍可见`);
            for (const textItem of items) {
              for (const text of [textItem.title, textItem.description!]) {
                const horizontalOverlap = Math.min(item.line.right, text.right) - Math.max(item.line.left, text.left);
                const verticalOverlap = Math.min(item.line.bottom, text.bottom) - Math.max(item.line.top, text.top);
                assert.ok(horizontalOverlap <= 0.1 || verticalOverlap <= 0.1, `${label} 连接线不穿过长文案`);
              }
            }
          }
          if (direction === 'horizontal') {
            const widths = await page.locator('li[data-step-index]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
            near(widths[2]!, widths[0]!, `${label} 末项继续参与等宽分配`);
          }
        }
      }
    }
  });
});

it('同组步骤混用四个方位时节点共用连接轴，动态覆盖后保持文字间隔与可见连线', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const direction of ['horizontal', 'vertical']) {
      for (const type of ['default', 'dot']) {
        const members = [
          { key: 'a', title: '上方文案', description: '上方说明'.repeat(20), placement: 'top' },
          { key: 'b', title: '右侧文案', description: '短说明', placement: 'right' },
          { key: 'c', title: '下方文案', description: '下方说明'.repeat(15), placement: 'bottom' },
          { key: 'd', title: '左侧文案', description: '末项说明', placement: 'left' },
        ];
        await configure(page, { direction, type, placement: 'right', members });
        for (const phase of ['初始混排', '动态覆盖', '移除上方文案']) {
          if (phase === '动态覆盖') {
            members[0]!.placement = 'bottom';
            members[2]!.placement = 'top';
            await configure(page, { members });
          }
          if (phase === '移除上方文案') {
            members[2]!.placement = 'bottom';
            await configure(page, { members });
          }
          const label = `${direction} ${type} ${phase}`;
          if (process.env.STEPS_CAPTURE_PLACEMENT === '1' && type === 'default' && phase === '初始混排') {
            await page.screenshot({ path: resolve(`node_modules/.cache/steps-placement-${direction}-review.png`), fullPage: true });
          }
          const items = await geometry(page);
          const axis = direction === 'horizontal' ? items[0]!.marker.y : items[0]!.marker.x;
          for (const [index, item] of items.entries()) {
            near(direction === 'horizontal' ? item.marker.y : item.marker.x, axis, `${label} 节点保持同轴`);
            near(item.description!.top - item.title.bottom, 8, `${label} 标题与描述间隔`);
            const placement = members[index]!.placement;
            const gap = placement === 'top' ? item.marker.top - item.description!.bottom
              : placement === 'bottom' ? item.title.top - item.marker.bottom
                : placement === 'left' ? item.marker.left - Math.max(item.title.right, item.description!.right)
                  : Math.min(item.title.left, item.description!.left) - item.marker.right;
            // 混排先保持所有节点同轴，文案位于指定侧且至少保留基础间距。
            assert.ok(gap >= 7.9, `${label} ${placement} 文案组与节点至少间隔 8px，实际 ${gap}`);
            const next = items[index + 1];
            const nextPlacement = members[index + 1]?.placement;
            if (direction === 'horizontal' && (placement === 'top' || placement === 'bottom') && next && (nextPlacement === 'left' || nextPlacement === 'right')) {
              const nextGroupStart = Math.min(next.marker.left, next.title.left, next.description!.left);
              near(nextGroupStart - item.line!.right, 24, `${label} 连接线避开下一步的完整内容组`);
            }
            if (!item.line) continue;
            assert.ok(item.line.width > 0 && item.line.height > 0, `${label} 连接线仍可见`);
            for (const textItem of items) {
              for (const text of [textItem.title, textItem.description!]) {
                const horizontalOverlap = Math.min(item.line.right, text.right) - Math.max(item.line.left, text.left);
                const verticalOverlap = Math.min(item.line.bottom, text.bottom) - Math.max(item.line.top, text.top);
                assert.ok(horizontalOverlap <= 0.1 || verticalOverlap <= 0.1, `${label} 连接线不穿字`);
              }
            }
          }
          const lastTitle = await page.locator('.fixture-title').last().evaluate(element => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return range.getBoundingClientRect().right;
          });
          near(items.at(-1)!.marker.left - lastTitle, 8, `${label} 左侧短标题实际文字紧邻节点`);
        }
      }
    }
  });
});

it('垂直各尺寸圆形与圆点到连线首尾均为 8px，长描述与固定 space 保持间隔', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    const shortMembers = [
      { key: 'a', title: '第一步', description: '简短说明' },
      { key: 'b', title: '第二步', description: '另一说明' },
      { key: 'c', title: '第三步', description: '完成说明' },
    ];
    const longMembers = [
      { key: 'a', title: '第一步', description: '长描述'.repeat(120) },
      { key: 'b', title: '第二步', description: '简短' },
      { key: 'c', title: '第三步', description: '简短' },
    ];
    function verifyGaps(items: Awaited<ReturnType<typeof geometry>>, label: string) {
      for (let index = 0; index < items.length - 1; index++) {
        const item = items[index]!;
        near(item.line!.x, item.marker.x, `${label} 竖向连接线中轴`);
        near(item.line!.top - item.marker.bottom, 8, `${label} 竖线起点间隔`);
        near(items[index + 1]!.marker.top - item.line!.bottom, 8, `${label} 竖线终点间隔`);
        near(item.line!.width, 2, `${label} 竖线粗细`);
        assert.ok(item.line!.height > 0, `${label} 连接线可见`);
      }
      assert.equal(items.at(-1)!.connector, null, `${label} 末项没有连接线`);
    }
    for (const size of ['sm', 'md', 'lg']) {
      for (const type of ['default', 'dot']) {
        for (const lineType of ['solid', 'dashed']) {
          const label = `${size} ${type} ${lineType}`;
          await configure(page, { direction: 'vertical', size, type, lineType, space: '', members: shortMembers });
          const before = await geometry(page);
          verifyGaps(before, label);
          await configure(page, { space: 160 });
          verifyGaps(await geometry(page), `${label} 固定 space`);
          near(await page.locator('li').first().evaluate(element => element.getBoundingClientRect().height), 160, `${label} 固定 space 决定单步高度`);
          await configure(page, { space: '', members: longMembers });
          const after = await geometry(page);
          verifyGaps(after, `${label} 长描述`);
          assert.ok(after[0]!.line!.height > before[0]!.line!.height, `${label} 竖向内容增高时线轨拉长`);
          near(after[0]!.line!.x, before[0]!.line!.x, `${label} 竖向内容不移动标记轴`);
        }
      }
    }
  });
});

it('原生虚线在横竖方向保持 2px 粗细，箭头通过 lineType 与圆形和点状节点组合', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const type of ['default', 'dot']) {
      for (const direction of ['horizontal', 'vertical']) {
        await configure(page, { type, lineType: 'dashed', direction });
        const horizontal = direction === 'horizontal';
        const paint = await page.locator('.fixture-line').first().evaluate((element) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return {
            top: { style: style.borderTopStyle, width: Number.parseFloat(style.borderTopWidth) },
            left: { style: style.borderLeftStyle, width: Number.parseFloat(style.borderLeftWidth) },
            background: style.backgroundImage, width: bounds.width, height: bounds.height,
          };
        });
        const stroke = horizontal ? paint.top : paint.left;
        assert.equal(stroke.style, 'dashed', `${type  } ${  direction  } 使用浏览器原生虚线`);
        near(stroke.width, 2, `${type  } ${  direction  } 边框粗细`);
        near(horizontal ? paint.height : paint.width, 2, `${type  } ${  direction  } 轨道厚度`);
        assert.equal(paint.background, 'none', '虚线不再使用背景平铺');
        await configure(page, { lineType: 'arrow' });
        assert.equal(await page.locator('.fixture-line').count(), 0, '箭头不渲染线轨');
        assert.equal(await page.locator('.fixture-arrow').count(), 2, '每个连接位置渲染一个箭头');
        assert.equal(await page.locator('.fixture-arrow').first().getAttribute('data-icon'), 'lucide:chevron-right');
      }
    }
  });
});

it('未引入 preflight 时，横竖虚线的底轨和填充层都只绘制一侧边框', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const direction of ['horizontal', 'vertical']) {
      for (const active of [0, 1, 3]) {
        await configure(page, { lineType: 'dashed', direction, active, members: [
          { key: 'a', title: '创建订单' },
          { key: 'b', title: '确认付款' },
          { key: 'c', title: '安排配送' },
        ] });
        const lines = await page.locator('.fixture-line').evaluateAll(elements => elements.map((element) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return {
            borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(Number.parseFloat),
            width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y,
          };
        }));
        for (const line of lines) {
          assert.deepEqual(line.borders, direction === 'horizontal' ? [2, 0, 0, 0] : [0, 0, 0, 2], `${direction} active=${active} 仅绘制单条虚线`);
          near(direction === 'horizontal' ? line.height : line.width, 2, '虚线轨道保持 2px 粗细');
        }
        for (let index = 0; index < lines.length; index += 2) {
          assert.deepEqual(lines[index + 1], lines[index], '填充层与底轨完全重合');
        }
      }
    }
  }, false);
});

it('实线与虚线切换步骤时沿连接方向填充，真实中间帧、结束帧及回退均正确', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const direction of ['horizontal', 'vertical']) {
      for (const lineType of ['solid', 'dashed']) {
        await configure(page, { active: 0, direction, lineType });
        const frames = await page.locator('.fixture-line-fill').first().evaluate(async (element, direction) => {
          const fixture = (window as any).stepsFixture;
          const axis = direction === 'horizontal' ? 'width' : 'height';
          const track = element.previousElementSibling!;
          const paint = {
            fraction() {
              const values = getComputedStyle(element).clipPath.slice(6, -1).split(/\s+/).map(Number.parseFloat);
              const inset = axis === 'width' ? values[1] ?? values[0]! : values[2] ?? values[0]!;
              return 1 - inset / 100;
            },
            color() { return getComputedStyle(track).color; },
            transition() {
              // 强制解析新样式，随后暂停真实 CSS 过渡以精确取样，避免机器速度影响断言。
              getComputedStyle(element).clipPath;
              const animation = element.getAnimations()[0];
              if (!animation) throw new Error('连接线应产生 CSS 过渡');
              animation.pause();
              return animation;
            },
          };
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          for (const animation of element.getAnimations()) animation.finish();
          const initial = paint.fraction();
          const trackColor = paint.color();
          fixture.configure({ active: 1 });
          await fixture.flush();
          const forward = paint.transition();
          const timing = forward.effect!.getTiming();
          const duration = Number(timing.duration);
          forward.currentTime = 0;
          const start = paint.fraction();
          forward.currentTime = duration / 2;
          const middle = paint.fraction();
          forward.finish();
          const end = paint.fraction();
          const completedTrackColor = paint.color();
          fixture.configure({ active: 0 });
          await fixture.flush();
          const backward = paint.transition();
          const backwardDuration = Number(backward.effect!.getTiming().duration);
          backward.currentTime = 0;
          const returnStart = paint.fraction();
          backward.currentTime = backwardDuration / 2;
          const returnMiddle = paint.fraction();
          backward.finish();
          const returnEnd = paint.fraction();
          return { initial, start, middle, end, returnStart, returnMiddle, returnEnd, duration, easing: timing.easing, trackColor, completedTrackColor, scale: getComputedStyle(element).scale, transform: getComputedStyle(element).transform, trackBounds: track.getBoundingClientRect().toJSON(), fillBounds: element.getBoundingClientRect().toJSON() };
        }, direction);
        const label = `${direction  } ${  lineType}`;
        near(frames.initial, 0, `${label  } 未完成线没有主题填充`);
        near(frames.start, 0, `${label  } 从连接起点开始填充`);
        assert.ok(frames.middle > 0 && frames.middle < 1, `${label  } 真实中间帧逐渐延长`);
        near(frames.end, 1, `${label  } 完成时铺满线轨`);
        near(frames.returnStart, 1, `${label  } 回退从完整线轨开始`);
        assert.ok(frames.returnMiddle > 0 && frames.returnMiddle < 1, `${label  } 回退存在真实缩短的中间帧`);
        near(frames.returnEnd, 0, `${label  } 回退结束收回主题填充`);
        assert.equal(frames.scale, 'none', `${label  } 不缩放原生虚线图案`);
        assert.equal(frames.transform, 'none', `${label  } 保持线条实际几何尺寸`);
        near(frames.fillBounds.width, frames.trackBounds.width, `${label  } 主题层与灰轨宽度一致`);
        near(frames.fillBounds.height, frames.trackBounds.height, `${label  } 主题层与灰轨厚度一致`);
        assert.equal(frames.duration, 200, `${label  } 使用默认动效时长`);
        assert.equal(frames.easing, 'cubic-bezier(0.33, 1, 0.67, 1)', `${label  } 使用项目缓出曲线`);
        assert.equal(frames.completedTrackColor, frames.trackColor, `${label  } 灰色底轨不会被主题色替换`);
      }
    }
  });
});

it('连续快速切换可中断线条填充，最后一次激活状态决定最终显示', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    const result = await page.locator('.fixture-line-fill').first().evaluate(async (element) => {
      const fixture = (window as any).stepsFixture;
      const track = element.previousElementSibling!;
      const paint = {
        fraction() {
          const values = getComputedStyle(element).clipPath.slice(6, -1).split(/\s+/).map(Number.parseFloat);
          return 1 - (values[1] ?? values[0]!) / 100;
        },
        pauseAt(fractionOfDuration: number) {
          getComputedStyle(element).clipPath;
          const animation = element.getAnimations()[0];
          if (!animation) throw new Error('快速切换仍应产生连接线过渡');
          animation.pause();
          animation.currentTime = Number(animation.effect!.getTiming().duration) * fractionOfDuration;
          return animation;
        },
      };
      track.getBoundingClientRect();
      fixture.configure({ active: 2 });
      await fixture.flush();
      paint.pauseAt(0.3);
      const forward = paint.fraction();
      fixture.configure({ active: 0 });
      await fixture.flush();
      paint.pauseAt(0);
      const reverseStart = paint.fraction();
      paint.pauseAt(0.5);
      const reverseMiddle = paint.fraction();
      fixture.configure({ active: 2 });
      await fixture.flush();
      paint.pauseAt(0);
      const resumed = paint.fraction();
      for (const fill of document.querySelectorAll('.fixture-line-fill')) {
        getComputedStyle(fill).clipPath;
        for (const animation of fill.getAnimations()) animation.finish();
      }
      const final = Array.from(document.querySelectorAll('.fixture-line-fill'), fill => {
        const values = getComputedStyle(fill).clipPath.slice(6, -1).split(/\s+/).map(Number.parseFloat);
        return 1 - (values[1] ?? values[0]!) / 100;
      });
      return { forward, reverseStart, reverseMiddle, resumed, final, statuses: Array.from(document.querySelectorAll('li[data-status]'), item => item.getAttribute('data-status')) };
    });
    assert.ok(result.forward > 0 && result.forward < 1, '首次填充尚未完成时触发回退');
    near(result.reverseStart, result.forward, '回退从当前长度继续，不跳回端点');
    assert.ok(result.reverseMiddle < result.reverseStart && result.reverseMiddle > 0, '中断后主题线继续缩短');
    near(result.resumed, result.reverseMiddle, '再次前进沿用当前长度');
    for (const fill of result.final) near(fill, 1, '最后一次前进完成全部已结束步骤的连接线');
    assert.deepEqual(result.statuses, ['finish', 'finish', 'process']);
  });
});

it('箭头连接在前进与回退时过渡颜色，降低动态偏好时所有连接样式直接更新', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await configure(page, { lineType: 'arrow' });
    const frames = await page.locator('.fixture-arrow').first().evaluate(async (element) => {
      const fixture = (window as any).stepsFixture;
      const paint = { color() { return getComputedStyle(element).color; } };
      const initial = paint.color();
      fixture.configure({ active: 1 });
      await fixture.flush();
      paint.color();
      const forward = element.getAnimations()[0];
      if (!forward) throw new Error('箭头前进应产生颜色过渡');
      forward.pause();
      forward.currentTime = Number(forward.effect!.getTiming().duration) / 2;
      const middle = paint.color();
      forward.finish();
      const end = paint.color();
      fixture.configure({ active: 0 });
      await fixture.flush();
      paint.color();
      const backward = element.getAnimations()[0];
      if (!backward) throw new Error('箭头回退应产生颜色过渡');
      backward.pause();
      backward.currentTime = Number(backward.effect!.getTiming().duration) / 2;
      const returnMiddle = paint.color();
      backward.finish();
      return { initial, middle, end, returnMiddle, returnEnd: paint.color() };
    });
    assert.notEqual(frames.middle, frames.initial, '箭头颜色存在真实前进中间帧');
    assert.notEqual(frames.middle, frames.end, '箭头前进中间帧尚未到达主题色');
    assert.notEqual(frames.returnMiddle, frames.initial, '箭头颜色存在真实回退中间帧');
    assert.notEqual(frames.returnMiddle, frames.end, '箭头回退中间帧已离开主题色');
    assert.equal(frames.returnEnd, frames.initial, '箭头回退最终恢复原始颜色');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const lineType of ['solid', 'dashed', 'arrow']) {
      for (const direction of ['horizontal', 'vertical']) {
        await configure(page, { active: 0, lineType, direction });
        await configure(page, { active: 1 });
        const paint = await page.locator(lineType === 'arrow' ? '.fixture-arrow' : '.fixture-line-fill').first().evaluate((element, direction) => {
          const style = getComputedStyle(element);
          const axis = direction === 'horizontal' ? 'width' : 'height';
          const values = style.clipPath.slice(6, -1).split(/\s+/).map(Number.parseFloat);
          const inset = axis === 'width' ? values[1] ?? values[0]! : values[2] ?? values[0]!;
          return { transition: style.transitionProperty, animations: element.getAnimations().length, fraction: 1 - inset / 100 };
        }, direction);
        assert.equal(paint.transition, 'none', `${lineType  } ${  direction  } 遵循降低动态偏好`);
        assert.equal(paint.animations, 0, `${lineType  } ${  direction  } 没有仍在播放的过渡`);
        if (lineType !== 'arrow') near(paint.fraction, 1, `${lineType  } ${  direction  } 立即显示完整主题线`);
      }
    }
  });
});

it('整体默认撑满居中 flex 父级，手动宽度支持 px、响应式百分比和竖向布局', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await page.locator('#fixture-container').evaluate((element) => {
      const container = element as HTMLElement;
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
    });
    near(await page.locator('ol').evaluate(element => element.getBoundingClientRect().width), 960, '默认在居中 flex 父级中占满可用宽度');
    await configure(page, { width: 640 });
    near(await page.locator('ol').evaluate(element => element.getBoundingClientRect().width), 640, '数字整体宽度以 px 计');
    await configure(page, { width: '50%' });
    near(await page.locator('ol').evaluate(element => element.getBoundingClientRect().width), 480, '百分比宽度相对父容器');
    await page.locator('#fixture-container').evaluate(element => { (element as HTMLElement).style.width = '800px'; });
    near(await page.locator('ol').evaluate(element => element.getBoundingClientRect().width), 400, '父容器变化后百分比宽度同步响应');
    await configure(page, { direction: 'vertical' });
    near(await page.locator('ol').evaluate(element => element.getBoundingClientRect().width), 400, '竖向同样应用整体百分比宽度');
    await configure(page, { width: 640, space: 160 });
    near(await page.locator('ol').evaluate(element => element.getBoundingClientRect().width), 640, '竖向同样应用整体数字宽度');
    near(await page.locator('li').first().evaluate(element => element.getBoundingClientRect().height), 160, '整体宽度不改变单步 space 的含义');
    await configure(page, { width: '' });
    near(await page.locator('ol').evaluate(element => element.getBoundingClientRect().width), 800, '空宽度恢复父容器的全部可用宽度');
  });
});

it('space 支持数字与百分比，父级 ui 可以覆盖标记、标题和线条尺寸', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    await configure(page, { space: 240 });
    near(await page.locator('li').first().evaluate(element => element.getBoundingClientRect().width), 240, '数字宽度');
    await configure(page, { space: '25%' });
    near(await page.locator('li').first().evaluate(element => element.getBoundingClientRect().width), 240, '百分比宽度');
    await configure(page, { direction: 'vertical', space: 160 });
    const vertical = await geometry(page);
    near(await page.locator('li').first().evaluate(element => element.getBoundingClientRect().height), 160, '竖向数字高度');
    near(vertical[1]!.marker.top - vertical[0]!.marker.top, 160, '竖向 space 决定标记间距');
    await configure(page, { direction: 'horizontal', space: '', ui: { root: 'fixture-root', marker: 'size-12', title: 'text-2xl', connector: 'h-1' } });
    near((await geometry(page))[0]!.marker.width, 48, '外部标记尺寸覆盖');
    assert.equal(await page.locator('.fixture-title').first().evaluate(element => getComputedStyle(element).fontSize), '24px');
    near((await geometry(page))[0]!.line!.height, 4, '外部连接线高度覆盖');
    assert.equal(await page.locator('.fixture-root').count(), 1);
  });
});

it('上下方文案使用显式 space 时保留数字与百分比步距，竖向各方位仍保留单步高度', { skip: !browserAvailable }, async () => {
  await withSteps(async (page) => {
    for (const placement of ['top', 'bottom']) {
      for (const [space, expected] of [[200, 200], ['25%', 240]] as const) {
        await configure(page, { width: 960, direction: 'horizontal', placement, space });
        const items = await geometry(page);
        const widths = await page.locator('li[data-step-index]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
        for (const width of widths) near(width, expected, `${placement} ${space} 单步宽度`);
        for (let index = 1; index < items.length; index++) near(items[index]!.marker.x - items[index - 1]!.marker.x, expected, `${placement} ${space} 节点实际步距`);
      }
    }
    for (const placement of ['top', 'bottom', 'left']) {
      await configure(page, { direction: 'vertical', placement, space: 200 });
      const heights = await page.locator('li[data-step-index]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
      for (const height of heights) near(height, 200, `${placement} 竖向 space 决定单步高度`);
      const items = await geometry(page);
      for (let index = 1; index < items.length; index++) near(items[index]!.marker.y - items[index - 1]!.marker.y, 200, `${placement} 竖向节点实际步距`);
    }
  });
});
