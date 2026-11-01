import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { parse } from '@vue/compiler-sfc';
import ts from 'typescript';

export const semanticColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;
export const semanticRoles = ['', '-hover', '-active', '-foreground', '-hover-foreground', '-active-foreground', '-soft', '-border'] as const;

export interface Violation {
  file: string;
  rule: string;
  detail: string;
}

const semanticPattern = semanticColors.join('|');
/** 描边角色只服务边框类工具，借作背景或文字会在调整描边阶数时连带改变无关部件。 */
const borderRoleMisuse = new RegExp(`^(?!border|ring|outline|divide)[a-z-]+-(?:${semanticPattern})-border$`);
/** 语义实底：默认、悬停、按下三态，不含 /10 这类半透明浅底。 */
const semanticSolid = new RegExp(`^bg-(?:${semanticPattern})(?:-hover|-active)?$`);
/** 固定明暗的前景色无法随语义实底的亮度切换，必须改用对应的 *-foreground 角色。 */
const fixedForeground = /^text-(?:white|black|gray-1)$/;

/** 去掉变体前缀与 important 标记，只保留工具类本体；方括号与圆括号里的冒号不是变体分隔符。 */
function utilityOf(token: string): string {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < token.length; index++) {
    const char = token[index];
    if (char === '[' || char === '(') depth++;
    else if (char === ']' || char === ')') depth--;
    else if (char === ':' && depth === 0) start = index + 1;
  }
  return token.slice(start).replace(/^!|!$/g, '');
}

export function sourceViolations(source: string, filename: string): Violation[] {
  const violations: Violation[] = [];
  const report = (rule: string, detail: string) => violations.push({ file: filename, rule, detail });
  const checkString = (value: string) => {
    if (/(?:^|[\s:'"`])text-xs(?=$|[\s/'"`])/.test(value)) report('字号令牌', '组件使用 text-xs，请使用七级字号令牌');
    for (const match of value.matchAll(/var\(\s*(--text-size-[\w-]+)/g)) report('未定义变量', match[1]!);
    if (/(?:^|[\s:])rounded(?:-[tblrsexy]{1,2})?-ui-/.test(value)) report('圆角令牌', 'Web 组件不再提供 rounded-ui-*');
    const utilities = value.split(/\s+/).filter(Boolean).map(utilityOf);
    for (const utility of utilities) {
      if (borderRoleMisuse.test(utility)) report('角色误用', `${utility} 把描边角色用于非边框属性，请改用对应色板阶数或新增语义角色`);
    }
    // 同一串类名里同时出现语义实底与固定前景，即视为未配对；跨槽位的配对由浏览器回归覆盖。
    const solid = utilities.find(utility => semanticSolid.test(utility));
    const fixed = utilities.find(utility => fixedForeground.test(utility));
    if (solid && fixed) report('实底前景', `${solid} 搭配了固定前景 ${fixed}，请使用对应的 *-foreground 角色`);
  };
  const checkScript = (content: string) => {
    const ast = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) checkString(node.text);
      if (ts.isPropertySignature(node) && node.name.getText(ast).replace(/['"]/g, '') === 'ui' && node.type?.kind === ts.SyntaxKind.AnyKeyword) report('公共类型', 'ui 不得使用 any，请声明可用槽位');
      ts.forEachChild(node, visit);
    };
    visit(ast);
  };
  if (filename.endsWith('.vue')) {
    const { descriptor, errors } = parse(source, { filename });
    for (const error of errors) report('SFC 解析', typeof error === 'string' ? error : error.message);
    for (const script of [descriptor.script, descriptor.scriptSetup]) if (script) checkScript(script.content);
    // 编译器保留模板节点，注释和展示用文本不会被误当成 class。
    const visitTemplate = (node: any) => {
      if (node.type === 1) {
        for (const prop of node.props) {
          if (prop.type === 6 && prop.name === 'class') checkString(prop.value?.content ?? '');
          if (prop.type === 7 && prop.exp?.content) checkScript(prop.exp.content);
        }
      }
      for (const child of node.children ?? []) visitTemplate(child);
    };
    if (descriptor.template?.ast) visitTemplate(descriptor.template.ast);
    for (const style of descriptor.styles) checkString(style.content.replace(/\/\*[\s\S]*?\*\//g, ''));
  }
  else if (filename.endsWith('.css')) checkString(source.replace(/\/\*[\s\S]*?\*\//g, ''));
  else checkScript(source);
  return violations;
}

export function themeViolations(base: string, typography: string): Violation[] {
  const violations: Violation[] = [];
  const clean = (value: string) => value.replace(/\/\*[\s\S]*?\*\//g, '');
  const baseCss = clean(base);
  const typeCss = clean(typography);
  const declarations = new Set([...`${baseCss}\n${typeCss}`.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  const requireDeclaration = (file: string, name: string, value?: string) => {
    const pattern = new RegExp(`${name}\\s*:\\s*${value ?? '[^;]+'}\\s*;`);
    if (!pattern.test(file === 'base.css' ? baseCss : typeCss)) violations.push({ file, rule: '主题契约', detail: `${name}${value ? ` 必须为 ${value}` : ' 缺少定义'}` });
  };
  for (const color of semanticColors) for (const role of semanticRoles) requireDeclaration('base.css', `--color-${color}${role}`);
  for (const [name, size] of Object.entries({ sm: 12, base: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 30, '4xl': 38 })) {
    requireDeclaration('typography.css', `--text-${name}`, `${size}px`);
    requireDeclaration('typography.css', `--text-${name}--line-height`, `${size + 8}px`);
  }
  for (const [name, size] of Object.entries({ sm: 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24 })) requireDeclaration('base.css', `--radius-${name}`, `${size}px`);
  // 仅验证自有主题颜色的引用闭合；文档站 --ui-* 与社区特效色不在此守卫范围内。
  for (const match of baseCss.matchAll(/var\(\s*(--color-[\w-]+)/g)) if (!declarations.has(match[1])) violations.push({ file: 'base.css', rule: '主题引用', detail: `${match[1]} 未定义` });
  return violations;
}

export function checkDesign(root: string): Violation[] {
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (['.vue', '.ts', '.css'].includes(extname(file))) files.push(file);
    }
  };
  walk(join(root, 'app/components/reborn/ui'));
  return [
    ...files.flatMap(file => sourceViolations(readFileSync(file, 'utf8'), relative(root, file))),
    ...themeViolations(readFileSync(join(root, 'app/assets/theme/base.css'), 'utf8'), readFileSync(join(root, 'app/assets/theme/typography.css'), 'utf8')),
  ];
}
