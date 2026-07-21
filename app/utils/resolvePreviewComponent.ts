/**
 * /preview 独立预览路由的组件白名单
 *
 * 通过 import.meta.glob 仅收集 examples / configs 目录下的组件文件名（不加载模块本体），
 * 路由参数必须命中白名单才允许渲染，防止任意组件名注入。
 */

// 只取 keys：eager:false 且从不调用值，构建产物中不会额外打包任何组件
const previewModules = import.meta.glob('~/components/reborn/{examples,configs}/**/*.vue')

/** 可预览的组件名集合（文件名去掉 .vue 后缀，与全局组件注册名一致） */
export const previewComponentNames = new Set(
    Object.keys(previewModules).map((path) => path.split('/').pop()!.replace(/\.vue$/, '')),
)

/** 组件名格式守卫：仅允许 PascalCase 标识符（拦截路径穿越等非法输入） */
const NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/

/** 校验路由参数是否为合法的可预览组件名 */
export function isValidPreviewComponent(name: string): boolean {
    return NAME_PATTERN.test(name) && previewComponentNames.has(name)
}
