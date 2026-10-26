import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { runInThisContext } from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';

/** 测试真实演示与表单，只替换无关输入控件和展示容器。 */
export async function loadDemo(file: string, exposed: string[]) {
  const entry = path.resolve(file);
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    alias: { '~': path.resolve('app'), '@': path.resolve('app') },
    plugins: [{ name: 'demo-sfc', setup(builder) {
      builder.onResolve({ filter: /^vue$/ }, () => ({ path: 'vue', external: true }));
      builder.onResolve({ filter: /^#components$/ }, args => ({ path: args.path, namespace: 'components' }));
      builder.onLoad({ filter: /.*/, namespace: 'components' }, () => ({contents: `import { defineComponent, h } from 'vue'; const Box = defineComponent({setup(_, {slots}) { return () => h('div', slots.default?.()); }}); export const Playground=Box, DemoSection=Box, DemoBlock=Box, DemoNote=Box, Icon=Box;`, loader: 'ts'}));
      builder.onResolve({ filter: /(?:reborn-menu$|\.vue$)/ }, args => {
        const realForm = /reborn-form\/RebornForm(?:Item)?\.vue$/.test(args.path);
        const root = path.resolve(args.resolveDir, args.path) === entry;
        if (!root && !realForm) return { path: args.path, namespace: 'stub' };
      });
      builder.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ contents: args.path.includes('RebornLoadingMask.vue') ? `
        import { defineComponent, h } from 'vue';
        export default defineComponent({props:['visible','text'],setup(props){return()=>h('div',{'data-e3-mask':''},props.visible?props.text:'');}});
      ` : `
        import { defineComponent, h } from 'vue';
        const Stub = defineComponent({ inheritAttrs: false, props: ['modelValue','label','confirmBtn'], emits: ['update:modelValue','confirm'], setup(props,{attrs,slots,emit}) {
          return () => attrs.placeholder ? h('input', {...attrs, value: props.modelValue}) : h('div', {...attrs, 'data-loading': props.confirmBtn?.loading}, slots.default?.());
        }});
        export default Stub;
        export const RebornMenu = Stub, RebornMenuItem = Stub, RebornMenuItemGroup = Stub, RebornSubMenu = Stub;
      `, loader: 'ts' }));
      builder.onLoad({ filter: /\.vue$/ }, args => {
        let source = readFileSync(args.path,'utf8');
        if (args.path === entry) source = source.replace('</script>', `defineExpose({ ${exposed.join(', ')} });\n</script>`);
        const { descriptor } = parse(source,{filename:args.path});
        const code = compileScript(descriptor,{id:args.path,inlineTemplate:true,fs:{fileExists:existsSync,readFile:f=>readFileSync(f,'utf8')}});
        return {contents:code.content,loader:'ts',resolveDir:path.dirname(args.path)};
      });
    } }],
  });
  const module = { exports: {} as { default: import('vue').Component } };
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0]!.text}\n})`)(module,module.exports,createRequire(import.meta.url));
  return module.exports.default;
}
