/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { after, it } from 'node:test';
import { installDom, loadAppModule, wait } from '../composables/harness';

const dom = installDom();
Object.defineProperty(globalThis, 'MutationObserver', { configurable: true, value: dom.window.MutationObserver });
// 菜单在 setup 里读取路由；测试不涉及跳转，给一个空实现
Object.assign(globalThis, { useRouter: () => null });

/**
 * 模拟水平布局：每个菜单项宽 100，「更多」触发器宽 56，ul 可用宽度 300，
 * offsetLeft 按前序兄弟累加，scrollWidth 为全部子项宽度之和。
 */
const widthOf = (el: Element) => (el as HTMLElement).dataset?.rebornMenuEllipsis === 'true' ? 56 : 100;
Object.defineProperties(dom.window.HTMLElement.prototype, {
  offsetWidth: { configurable: true, get(this: HTMLElement) { return this.tagName === 'LI' ? widthOf(this) : 0; } },
  offsetLeft: { configurable: true, get(this: HTMLElement) {
    if (this.tagName !== 'LI' || !this.parentElement) return 0;
    let left = 0;
    for (const sibling of this.parentElement.children) {
      if (sibling === this) break;
      left += widthOf(sibling);
    }
    return left;
  } },
  clientWidth: { configurable: true, get(this: HTMLElement) { return this.tagName === 'UL' ? 300 : 0; } },
  scrollWidth: { configurable: true, get(this: HTMLElement) {
    return this.tagName === 'UL' ? [...this.children].reduce((sum, child) => sum + widthOf(child), 0) : 0;
  } },
});

const { createApp, h, onMounted, onUnmounted, ref } = await import('vue');
const { default: Menu } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-menu/RebornMenu.vue')>('app/components/reborn/ui/reborn-menu/RebornMenu.vue');
after(() => dom.window.close());

it('插槽模式开启 ellipsis：选中项回写引起的更新不重切、不重建「更多」，条目数变化才补量', async () => {
  const selected = ref<string[]>([]);
  const count = ref(6);
  let mounts = 0;
  let unmounts = 0;
  // 「更多」子菜单的替身：只记录挂载 / 卸载次数
  const SubMenuStub = {
    props: ['index'],
    setup(_props: unknown, { slots }: { slots: any }) {
      onMounted(() => { mounts++; });
      onUnmounted(() => { unmounts++; });
      return () => h('li', null, slots.default?.());
    },
  };
  const app = createApp({ render: () => h(Menu, {
    'mode': 'horizontal', 'ellipsis': true, 'selectedKeys': selected.value,
    'onUpdate:selectedKeys': (value: string[]) => { selected.value = value; },
  }, () => Array.from({ length: count.value }, (_, index) => h('li', { key: index, class: 'fixture-item' }, `项${index}`))) });
  app.component('RebornSubMenu', SubMenuStub);
  app.component('RebornMenuItems', { render: () => null });
  app.component('Icon', { render: () => h('i') });
  const container = document.createElement('div');
  document.body.append(container);
  app.mount(container);
  const visible = () => [...container.querySelectorAll('ul > .fixture-item')].map(node => node.textContent);
  try {
    for (let i = 0; i < 4; i++) await wait();
    // 可用 300 - 预留 56 = 244：第 3 项（右缘 300）起折叠
    assert.deepEqual(visible(), ['项0', '项1']);
    assert.equal(mounts, 1);
    const ellipsis = container.querySelector('[data-reborn-menu-ellipsis="true"]');
    assert.ok(ellipsis);

    // 父级回写选中项：菜单因 props 变化重渲染，条目数不变，不应重置折叠
    selected.value = ['项1'];
    for (let i = 0; i < 4; i++) await wait();
    assert.deepEqual(visible(), ['项0', '项1']);
    assert.equal(mounts, 1, '「更多」子菜单不应被卸载重挂');
    assert.equal(unmounts, 0);
    assert.equal(container.querySelector('[data-reborn-menu-ellipsis="true"]'), ellipsis);

    // 新增的条目全落在「更多」里，菜单栏 DOM 不变：靠条目数变化补量，结果仍正确
    count.value = 8;
    for (let i = 0; i < 4; i++) await wait();
    assert.deepEqual(visible(), ['项0', '项1']);
    assert.equal(container.querySelector('[data-reborn-menu-ellipsis="true"]')!.querySelectorAll('.fixture-item').length, 6);
  } finally { app.unmount(); container.remove(); }
});
