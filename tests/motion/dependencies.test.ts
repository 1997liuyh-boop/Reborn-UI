/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { it } from 'node:test';
import { resolveDependencies } from '../../packages/cli/src/utils/dependencies';
import { extractSharedNpmDependencies } from '../../packages/cli/src/utils/shared-dependencies';

it('公共模板依赖递归包含相对引用，循环引用只访问一次', () => {
  const templates = {
    'composables/useList.ts': `import {animate} from '../lib/motion';import {ref} from 'vue';`,
    'lib/motion.ts': `import {animate} from 'motion-v';export * from '../composables/useList';`,
    'lib/unrelated.ts': `import gsap from 'gsap';`,
  };
  assert.deepEqual(extractSharedNpmDependencies(`import {useList} from '@/composables/useList'`, 'web', templates), ['motion-v']);
  assert.deepEqual(extractSharedNpmDependencies(`import {useList} from '~/composables/useList'`, 'web', templates), ['motion-v']);
});

it('安装 Motion 组件自动包含间接依赖，同名 UniApp 组件不带入 Web 依赖', async () => {
  const name = 'reborn-avatar-group';
  const registryComponents = [{ name, dependencies: [], files: [
    { path: 'RebornAvatarGroup.vue', target: 'web' as const, content: await readFile('app/components/reborn/ui/reborn-avatar-group/RebornAvatarGroup.vue', 'utf8') },
    { path: 'RebornAvatarGroup.vue', target: 'uniapp' as const, content: `import {ref} from 'vue'` },
  ] }];
  const web = resolveDependencies({ registryComponents, targets: [name], platform: 'web' });
  assert.ok(web.npmDependencies.includes('motion-v'));
  const uniapp = resolveDependencies({ registryComponents, targets: [name], platform: 'uniapp' });
  assert.deepEqual(uniapp.npmDependencies, []);
});

it('没有动画的组件不会被额外安装 Motion', () => {
  const name = 'reborn-text';
  const result = resolveDependencies({ registryComponents: [{ name, dependencies: [], files: [{ path: 'Text.vue', content: `import {cn} from '@/lib/utils'` }] }], targets: [name], platform: 'web' });
  assert.ok(!result.npmDependencies.includes('motion-v'));
});
