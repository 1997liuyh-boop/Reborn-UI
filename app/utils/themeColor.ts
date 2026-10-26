/** 主题色只保存预设名，色阶由主题样式统一提供。 */
export const themeColors = [
  { name: 'blue', preset: 'brand', label: '品牌蓝' },
  { name: 'orange', preset: 'orange', label: '橙色' },
  { name: 'green', preset: 'green', label: '绿色' },
  { name: 'red', preset: 'red', label: '红色' },
] as const

export type ThemeColorName = typeof themeColors[number]['name']

export function normalizeThemeColor(value: unknown): ThemeColorName {
  return themeColors.find(color => color.name === value)?.name ?? 'blue'
}

/** 主题色名 → 主题预设的白名单，内联脚本与运行时共用这一份 */
const presetByName = JSON.stringify(Object.fromEntries(themeColors.map(color => [color.name, color.preset])))

/**
 * 首屏恢复主题色的内联脚本源码。
 * 必须先单独声明、再在下一行导出：Nuxt 自动导入用正则扫描 export 语句，
 * 同一行里「逗号 + 标识符」的片段（脚本里的局部变量）会被误认成额外的导出名，
 * 于是给全站模块注入一个并不存在的 import，开发环境下模块一加载就报 SyntaxError。
 */
const bootstrapSource = [
  '(()=>{',
  'let name=\'blue\';',
  'try{',
  'const cookie=document.cookie.split(\'; \').find(item=>item.startsWith(\'theme-color=\'));',
  'if(cookie){name=decodeURIComponent(cookie.slice(12));try{name=JSON.parse(name)}catch{}}',
  '}catch{}',
  `const presets=${presetByName};`,
  'document.documentElement.dataset.themeColor=Object.prototype.hasOwnProperty.call(presets,name)?presets[name]:\'brand\'',
  '})()',
].join('')

/** 静态预渲染也在首次绘制前恢复用户偏好，仅接受固定白名单。 */
export const themeColorBootstrap = bootstrapSource
