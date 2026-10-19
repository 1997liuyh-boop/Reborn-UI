/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { resolveDependencies } from '../../packages/cli/src/utils/dependencies';

/** 先提供浏览器环境，再加载 Vue，确保图片事件与 Teleport 运行真实 DOM。 */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'http://localhost' });
const previous = new Map<string, PropertyDescriptor | undefined>();
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  const value = key.endsWith('AnimationFrame') ? dom.window[key].bind(dom.window) : dom.window[key];
  Object.defineProperty(globalThis, key, { value, configurable: true });
}
const { Comment, createApp, createSSRApp, Fragment, h, nextTick, reactive } = await import('vue');
const { renderToString } = await import('@vue/server-renderer');
const folder = await mkdtemp(resolve('tests/reborn-avatar/.runtime-'));
const output = resolve(folder, 'components.mjs');
after(async () => {
  await unlink(output).catch(() => {});
  await rmdir(folder);
  dom.window.close();
  for (const [key, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

/** 仅替换 Nuxt 图标解析，头像、提示层与过渡组件均使用真实源码。 */
await build({
  stdin: {
    contents: `export {default as Avatar} from '~/components/reborn/ui/reborn-avatar/RebornAvatar.vue';export {default as Group} from '~/components/reborn/ui/reborn-avatar-group/RebornAvatarGroup.vue';export {default as GroupFixture} from './tests/reborn-avatar/AvatarGroupFixture.vue';`,
    resolveDir: resolve('.'), loader: 'ts',
  },
  outfile: output, bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
  plugins: [{ name: 'avatar-test', setup(builder) {
    builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'icons', namespace: 'avatar-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'avatar-test' }, () => ({ contents: `import {h} from 'vue';export const Icon=(p)=>h('svg',{'data-icon':p.name});`, loader: 'js', resolveDir: resolve('.') }));
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
      return { contents: compileScript(descriptor, {
        id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
      }).content, loader: 'ts' };
    });
  } }],
});
const { Avatar, Group, GroupFixture } = await import(pathToFileURL(output).href);

/** 挂载响应式参数；插槽函数在渲染时执行，可验证成员动态增删。 */
async function mount(component: typeof Avatar, initial: Record<string, unknown> = {}, slots = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const props = reactive(initial);
  const warnings: string[] = [];
  const app = createApp({ render: () => h(component, props, slots) });
  app.config.warnHandler = message => warnings.push(message);
  app.mount(root);
  await nextTick();
  return { root, props, warnings, stop: () => { app.unmount(); root.remove(); } };
}

/** 按默认延迟推进提示层，检查真实键盘与鼠标交互。 */
async function settleTooltip() {
  await new Promise(resolve => setTimeout(resolve, 450));
  await nextTick(); await nextTick();
}

it('图片优先，保留原生图片候选与替代文字；失败后触发 error 并回退', async () => {
  const errors: Event[] = [];
  const view = await mount(Avatar, { src: '/a.png', srcSet: '/a.png 1x, /b.png 2x', alt: '林舟', onError: (event: Event) => errors.push(event) }, { default: () => '林' });
  try {
    const image = view.root.querySelector('img')!;
    assert.equal(image.alt, '林舟');
    assert.equal(image.getAttribute('srcset'), '/a.png 1x, /b.png 2x');
    assert.equal(view.root.textContent, '');
    image.dispatchEvent(new dom.window.Event('error'));
    await nextTick();
    assert.equal(errors.length, 1);
    assert.equal(errors[0]!.type, 'error');
    assert.equal(view.root.querySelector('img'), null);
    assert.equal(view.root.textContent, '林');
    assert.equal(view.root.firstElementChild?.getAttribute('aria-label'), '林舟');
    view.props.src = '/new.png'; await nextTick();
    assert.equal(view.root.querySelector('img')?.getAttribute('src'), '/new.png');
    assert.equal(view.root.textContent, '');
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('可单独使用 srcSet，失败后切换候选重新创建图片', async () => {
  const view = await mount(Avatar, { srcSet: '/a.png 1x' });
  try {
    const image = view.root.querySelector('img')!;
    assert.equal(image.hasAttribute('src'), false);
    image.dispatchEvent(new dom.window.Event('error')); await nextTick();
    assert.equal(view.root.querySelector('img'), null);
    view.props.srcSet = '/b.png 2x'; await nextTick();
    assert.equal(view.root.querySelector('img')?.getAttribute('srcset'), '/b.png 2x');
  } finally { view.stop(); }
});

it('图标支持字符串和组件，优先于文字插槽，并响应样式覆盖', async () => {
  const ComponentIcon = () => h('svg', { 'data-profile': true });
  const view = await mount(Avatar, {
    icon: 'lucide:user-round', class: 'avatar-class', ui: { root: 'bg-primary/10', icon: 'size-5', fallback: 'fallback-test' },
  }, { default: () => '林' });
  try {
    assert.equal(view.root.querySelector('svg')?.getAttribute('data-icon'), 'lucide:user-round');
    assert.ok(view.root.querySelector('svg.size-5'));
    assert.equal(view.root.querySelector('.avatar-class')?.classList.contains('bg-gray-3'), false);
    assert.equal(view.root.textContent, '');
    view.props.icon = ComponentIcon; await nextTick();
    assert.ok(view.root.querySelector('svg[data-profile]'));
    view.props.icon = ''; await nextTick();
    assert.equal(view.root.querySelector('.fallback-test')?.textContent, '林');
  } finally { view.stop(); }
});

it('默认尺寸与形状正确，数值尺寸有兜底，图片适应与 ui 可覆盖', async () => {
  const view = await mount(Avatar, { src: '/a.png' });
  try {
    const root = view.root.firstElementChild as HTMLElement;
    assert.ok(root.classList.contains('size-[32px]'));
    assert.ok(root.classList.contains('rounded-full'));
    view.props.size = 'sm'; await nextTick();
    assert.ok(root.classList.contains('size-[24px]'));
    view.props.size = 'lg'; await nextTick();
    assert.ok(root.classList.contains('size-[40px]'));
    Object.assign(view.props, { size: 56, shape: 'square', fit: 'contain', ui: { root: 'rounded-xl', image: 'grayscale' } }); await nextTick();
    assert.equal(root.style.getPropertyValue('--rb-avatar-size'), '56px');
    assert.ok(root.classList.contains('rounded-xl'));
    assert.equal(root.classList.contains('rounded-md'), false);
    assert.ok(view.root.querySelector('img.object-contain.grayscale'));
    view.props.size = Number.NaN; await nextTick();
    assert.equal(root.style.getPropertyValue('--rb-avatar-size'), '32px');
    view.props.size = -5; await nextTick();
    assert.equal(root.style.getPropertyValue('--rb-avatar-size'), '32px');
  } finally { view.stop(); }
});

it('头像组尺寸与形状响应式继承，子项显式配置优先', async () => {
  const view = await mount(Group, { size: 'lg', shape: 'square' }, { default: () => [
    h(Avatar, { 'data-member': 'a' }, () => '林'), h(Avatar, { 'data-member': 'b', size: 'sm', shape: 'circle' }, () => '陈'),
  ] });
  try {
    const first = view.root.querySelector('[data-member="a"]')!;
    const second = view.root.querySelector('[data-member="b"]')!;
    assert.ok(first.classList.contains('size-[40px]'));
    assert.ok(first.classList.contains('rounded-md'));
    assert.ok(first.classList.contains('ring-2'));
    assert.ok(second.classList.contains('size-[24px]'));
    assert.ok(second.classList.contains('rounded-full'));
    Object.assign(view.props, { size: 64, shape: 'circle' }); await nextTick();
    assert.equal((first as HTMLElement).style.getPropertyValue('--rb-avatar-size'), '64px');
    assert.ok(first.classList.contains('rounded-full'));
    assert.ok(second.classList.contains('size-[24px]'));
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('片段与条件注释不占数量，折叠上限可切换，动态成员更新计数', async () => {
  const members = reactive(['林', '陈', '周', '苏']);
  const view = await mount(Group, { collapseAvatars: true, maxCollapseAvatars: 2 }, {
    default: () => [h(Comment), h(Fragment, null, members.map(name => h(Avatar, { key: name }, () => name)))],
  });
  try {
    assert.equal(view.root.textContent, '林陈+2');
    assert.equal(view.root.querySelector('button'), null);
    assert.equal(view.root.querySelectorAll('.reborn-avatar').length, 3);
    members.push('许'); await nextTick();
    assert.equal(view.root.textContent, '林陈+3');
    view.props.maxCollapseAvatars = 3.9; await nextTick();
    assert.equal(view.root.textContent, '林陈周+2');
    view.props.maxCollapseAvatars = -1; await nextTick();
    assert.equal(view.root.textContent, '林+4');
    view.props.maxCollapseAvatars = Number.NaN; await nextTick();
    assert.equal(view.root.textContent, '林+4');
    view.props.collapseAvatars = false; await nextTick();
    assert.equal(view.root.textContent, '林陈周苏许');
    members.splice(0); await nextTick();
    assert.equal(view.root.textContent, '');
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('浮层开关依赖实际折叠，数量未超限时不创建计数头像', async () => {
  const view = await mount(Group, { collapseAvatarsTooltip: true }, { default: () => [h(Avatar, null, () => '林'), h(Avatar, null, () => '陈')] });
  try {
    assert.equal(view.root.textContent, '林陈');
    assert.equal(view.root.querySelector('button'), null);
    Object.assign(view.props, { collapseAvatars: true, maxCollapseAvatars: 2 }); await nextTick();
    assert.equal(view.root.querySelector('button'), null);
    view.props.maxCollapseAvatars = 1; await nextTick();
    assert.equal(view.root.querySelector('button')?.textContent, '+1');
  } finally { view.stop(); }
});

it('聚焦计数头像展示全部隐藏头像，主题与自定义样式生效，Escape 关闭', async () => {
  const view = await mount(Group, {
    size: 'lg', collapseAvatars: true, collapseAvatarsTooltip: true, effect: 'dark', placement: 'bottom-end',
    collapseClass: 'counter-test', collapseStyle: 'color: red', popperClass: 'popup-test', popperStyle: { padding: '20px' },
    ui: { root: 'group-test', item: 'item-test', collapse: 'bg-primary/10', tooltip: 'border-primary/30' },
  }, { default: () => ['林', '陈', '周', '苏'].map(name => h(Avatar, { key: name, alt: name }, () => name)) });
  try {
    assert.equal(view.root.textContent, '林+3');
    assert.equal(document.querySelector('[role="tooltip"]'), null);
    assert.equal(view.root.querySelectorAll('.item-test').length, 2);
    const counter = view.root.querySelector<HTMLElement>('.counter-test')!;
    assert.ok(counter.classList.contains('bg-primary/10'));
    assert.ok(counter.classList.contains('size-[40px]'));
    assert.equal(counter.style.color, 'red');
    const button = view.root.querySelector<HTMLButtonElement>('button')!;
    assert.equal(button.getAttribute('aria-label'), '另外 3 位成员');
    button.focus(); await settleTooltip();
    const popup = document.querySelector<HTMLElement>('.popup-test')!;
    assert.ok(popup);
    assert.equal(popup.textContent, '陈周苏');
    assert.equal(popup.dataset.effect, 'dark');
    assert.ok(popup.classList.contains('bg-gray-10'));
    assert.ok(popup.classList.contains('border-primary/30'));
    assert.equal(popup.style.padding, '20px');
    assert.equal(popup.querySelectorAll('.size-\\[40px\\]').length, 3);
    view.props.popperStyle = 'padding: 12px'; await nextTick();
    assert.equal(popup.style.padding, '12px');
    view.props.effect = 'light'; await nextTick();
    assert.equal(document.querySelector('.popup-test')?.textContent, '陈周苏');
    window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' })); await settleTooltip();
    assert.equal(document.querySelector('[role="tooltip"]'), null);
    button.blur(); button.focus(); await settleTooltip();
    assert.equal(document.querySelector('.popup-test')?.textContent, '陈周苏');
    assert.equal(document.querySelector('.popup-test')?.querySelectorAll('.reborn-avatar').length, 3);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
  assert.equal(document.querySelector('.popup-test'), null);
});

it('头像与折叠头像组可服务端渲染，不提前挂载隐藏头像', async () => {
  const html = await renderToString(createSSRApp({ render: () => h(Group, { size: 'sm', collapseAvatars: true, collapseAvatarsTooltip: true }, {
    default: () => [h(Avatar, { src: '/a.png', alt: '林舟' }), h(Avatar, { src: '/b.png', alt: '陈雨' })],
  }) }));
  assert.match(html, /size-\[24px\]/);
  assert.match(html, /src="\/a.png"/);
  assert.doesNotMatch(html, /src="\/b.png"/);
  assert.match(html, /\+1/);
});

it('编译后的循环插槽反复打开、主题更新与人数更新后，隐藏头像仍保持在当前面板', async () => {
  const view = await mount(GroupFixture, { people: ['林', '陈', '周'], effect: 'light' });
  try {
    const button = view.root.querySelector<HTMLButtonElement>('button')!;
    button.focus(); await settleTooltip();
    assert.equal(document.querySelector('[data-effect]')?.textContent, '陈周');
    view.props.effect = 'dark'; await nextTick();
    assert.equal(document.querySelector('[data-effect]')?.textContent, '陈周');
    view.props.people = ['林', '陈', '周', '苏']; await nextTick();
    assert.equal(view.root.textContent, '林+3');
    assert.equal(document.querySelector('[data-effect]')?.textContent, '陈周苏');
    window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' })); await settleTooltip();
    button.blur(); button.focus(); await settleTooltip();
    assert.equal(document.querySelector('[data-effect]')?.textContent, '陈周苏');
    assert.equal(document.querySelectorAll('[data-effect] .reborn-avatar').length, 3);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('CLI 安装头像组会带上头像、提示层及提示层的过渡依赖', async () => {
  const names = ['reborn-avatar-group', 'reborn-avatar', 'reborn-tooltip', 'reborn-transition'];
  const registryComponents = await Promise.all(names.map(async name => {
    const file = `${name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}.vue`;
    return { name, dependencies: [], files: [{ path: file, content: await readFile(resolve(`app/components/reborn/ui/${name}/${file}`), 'utf8') }] };
  }));
  const result = resolveDependencies({ registryComponents, targets: ['reborn-avatar-group'], platform: 'web' });
  assert.deepEqual(new Set(result.components), new Set(['reborn-avatar', 'reborn-tooltip', 'reborn-transition']));
});
