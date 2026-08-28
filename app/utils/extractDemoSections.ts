/**
 * 从 demo 源文件中按 <DemoSection title="..."> 抽取每个分组的模板源码
 *
 * 目的：demo 文件里已经写好的分组内容既是「跑起来的示例」，也是「要展示的代码」，
 * 二者同源——分组只需声明 title，代码由这里从原始文件文本中切出来，避免维护两份。
 *
 * 约定：分组标题必须是字面量（title="..."），动态绑定（:title）无法作为抽取键。
 */

/** 分组标题 -> 分组内模板源码 */
export type DemoSectionSourceMap = Record<string, string>

const OPEN_TAG = /<DemoSection\b([^>]*?)(\/?)>/g

/** 标题 / 描述插槽属于文档说明，不算示例代码，抽取时剔除 */
const DOC_SLOT = /<template\s+#(?:title|description)\b[^>]*>[\s\S]*?<\/template>\s*/g

/**
 * 从 start 位置开始寻找与之配对的 </DemoSection>，支持嵌套
 * @returns 闭合标签的起始下标；找不到返回 -1
 */
function findMatchingClose(raw: string, start: number): number {
    let depth = 1
    let i = start
    while (i < raw.length) {
        const open = raw.indexOf('<DemoSection', i)
        const close = raw.indexOf('</DemoSection>', i)
        if (close === -1) return -1
        if (open !== -1 && open < close) {
            // 自闭合的 <DemoSection ... /> 不增加深度
            const tagEnd = raw.indexOf('>', open)
            if (tagEnd !== -1 && raw[tagEnd - 1] !== '/') depth++
            i = tagEnd === -1 ? open + 12 : tagEnd + 1
            continue
        }
        depth--
        if (depth === 0) return close
        i = close + 14
    }
    return -1
}

/** 去掉整体的公共缩进并裁掉首尾空行，让分组代码从第 0 列开始 */
function dedent(source: string): string {
    const lines = source.replace(/\r\n/g, '\n').split('\n')
    while (lines.length && !lines[0]!.trim()) lines.shift()
    while (lines.length && !lines[lines.length - 1]!.trim()) lines.pop()

    let indent = Number.POSITIVE_INFINITY
    for (const line of lines) {
        if (!line.trim()) continue
        indent = Math.min(indent, line.length - line.trimStart().length)
    }
    if (!Number.isFinite(indent) || indent <= 0) return lines.join('\n')
    return lines.map(line => line.slice(indent)).join('\n')
}

/**
 * 解析 demo 源文件，返回「分组标题 -> 分组内模板源码」映射
 *
 * 以 title 作为键而非出现顺序：v-if / v-for 会让实例挂载顺序与源码顺序不一致，
 * 而同一个 demo 内分组标题天然唯一，按标题取更稳。
 */
export function extractDemoSections(raw: string): DemoSectionSourceMap {
    const map: DemoSectionSourceMap = {}
    if (!raw) return map

    OPEN_TAG.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = OPEN_TAG.exec(raw))) {
        const [, attrs = '', selfClosing = ''] = match
        if (selfClosing) continue

        const title = attrs.match(/(?:^|\s)title="([^"]*)"/)?.[1]
        if (!title) continue

        const start = OPEN_TAG.lastIndex
        const end = findMatchingClose(raw, start)
        if (end === -1) continue

        map[title] = dedent(raw.slice(start, end).replace(DOC_SLOT, ''))
    }

    return map
}
