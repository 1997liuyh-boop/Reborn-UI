/**
 * 文档正文的平台限定块：`::platform-only{platform="uniapp"}` 包裹的内容只在对应平台档位下出现。
 *
 * 在数据层处理，与 trimComponentDocBody 同一思路：只改传给 ContentRenderer 的 AST，md 源文件不动。
 * - 平台相符：把块「拆包」，子节点原样提到顶层。块里的标题因此和普通标题一样参与目录、
 *   参与「用法」小节的裁剪；不拆包的话它会被当成上一个小节的尾巴，上一节被示例卡片裁掉时会被一起带走。
 * - 平台不符：整块剔除，块内标题的 id 记进 hiddenIds，供调用方从构建期目录里同步删掉，
 *   否则目录会指向一个不存在的锚点。
 *
 * 只处理顶层节点；嵌在 tabs 等组件里的平台块交给 PlatformOnly 内容组件在渲染期判断。
 */
import type { DocsPlatform } from '~/composables/useDocsPlatform'

/** MDC 块组件 `::platform-only` 在 AST 里的标签名 */
export const PLATFORM_ONLY_TAG = 'platform-only'

export interface PlatformScopedBody {
    /** 处理后的正文；没有平台块时原样返回同一个数组引用 */
    value: unknown[]
    /** 被剔除的块里出现过的标题 id */
    hiddenIds: Set<string>
}

type Element = [string, Record<string, any>, ...unknown[]]

function isElement(node: unknown): node is Element {
    return Array.isArray(node) && typeof node[0] === 'string'
}

/** 递归收集标题 id（h1–h6 的 props.id） */
function collectHeadingIds(nodes: unknown[], out: Set<string>) {
    for (const node of nodes) {
        if (!isElement(node)) continue
        if (/^h[1-6]$/.test(node[0]) && node[1]?.id) out.add(String(node[1].id))
        collectHeadingIds(node.slice(2), out)
    }
}

export function applyPlatformScopes(value: unknown[], platform: DocsPlatform): PlatformScopedBody {
    const hiddenIds = new Set<string>()
    let touched = false
    const out: unknown[] = []

    for (const node of value) {
        if (!isElement(node) || node[0] !== PLATFORM_ONLY_TAG) {
            out.push(node)
            continue
        }
        touched = true
        const children = node.slice(2)
        if (node[1]?.platform === platform) out.push(...children)
        else collectHeadingIds(children, hiddenIds)
    }

    return { value: touched ? out : value, hiddenIds }
}
