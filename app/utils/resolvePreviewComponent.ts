import { previewComponentNames as registeredPreviewNames } from '#build/preview-component-names';

/**
 * /preview 独立预览路由的组件白名单
 *
 * 构建时从 examples / configs 的组件注册信息生成纯名称列表，避免服务端打包演示组件。
 * 路由参数必须命中白名单才允许渲染，防止任意组件名注入。
 */

/** 可预览的组件名集合（文件名去掉 .vue 后缀，与全局组件注册名一致） */
export const previewComponentNames = new Set<string>(registeredPreviewNames)

/** 组件名格式守卫：仅允许 PascalCase 标识符（拦截路径穿越等非法输入） */
const NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/

/** 校验路由参数是否为合法的可预览组件名 */
export function isValidPreviewComponent(name: string): boolean {
    return NAME_PATTERN.test(name) && previewComponentNames.has(name)
}
