/**
 * 组件文档正文裁剪：示例卡片已经承担「标题 + 描述 + 参数」，正文里重复的部分不再渲染。
 *
 * - `## 简介`：整节不渲染（其中的何时使用 / 何时不使用已先由 DocsPage 搬进 suggestion 面板）。
 * - `## 用法`：标题与 demo 里某个 DemoSection 标题一致的 `### 小节` 不渲染，
 *   该小节首段文字与涉及的参数收进 usage 映射，交给对应的示例卡片展示；
 *   对不上的小节原样保留（有的 demo 没用 DemoSection，一刀切会丢内容）。
 *   全部小节都对上时，`## 用法` 标题与它的引言一并去掉。
 *
 * 只改传给 ContentRenderer 的 AST，md 源文件不动——知识库与 AI 仍读完整正文。
 */

/** 描述文本片段：普通文字 / 行内代码 */
export interface DemoUsageSegment {
    type: 'text' | 'code'
    value: string
}

/** 一个示例分组从文档里拿到的补充信息 */
export interface DemoUsage {
    /** md 小节标题的锚点 id，示例卡片标题沿用它，目录链接才不会断 */
    id: string
    /** 小节首段文字 */
    description: DemoUsageSegment[]
    /** 小节正文里提到、且在 API 表中存在的参数 */
    params: string[]
}

export interface TrimmedComponentBody {
    value: unknown[]
    /** 已从正文去掉的二级标题 id（目录据此裁剪） */
    removedH2: Set<string>
    /** 分组标题 -> 补充信息 */
    usage: Record<string, DemoUsage>
}

/** 单张卡片最多展示的参数个数，超出的通常是正文顺带提及，不是这组示例的主角 */
const MAX_PARAMS = 8

type Element = [string, Record<string, any>, ...unknown[]]

function isElement(node: unknown): node is Element {
    return Array.isArray(node) && typeof node[0] === 'string'
}

function headingLevel(node: unknown): number {
    if (!isElement(node) || !/^h[1-6]$/.test(node[0])) return 0
    return Number(node[0].slice(1))
}

function headingId(node: unknown): string {
    return isElement(node) ? String(node[1]?.id ?? '') : ''
}

function nodeText(node: unknown): string {
    if (typeof node === 'string') return node
    if (!isElement(node)) return ''
    return node.slice(2).map(nodeText).join('')
}

/** 从 start 处的标题起，找到本节结束位置（下一个同级或更高级标题） */
function sectionEnd(value: unknown[], start: number, level: number): number {
    let i = start + 1
    while (i < value.length) {
        const l = headingLevel(value[i])
        if (l && l <= level) break
        i++
    }
    return i
}

/**
 * 参数名归一化，用来和 API 表比对：
 * `v-model:active-key` / `@change` / `#extra` / `:closable="false"` / `ui.header`
 * 分别归到 activekey / change / extra / closable / ui。
 */
function normalizeParam(raw: string): string {
    let s = raw.trim()
    if (s === 'v-model' || s.startsWith('v-model=')) return 'modelvalue'
    s = s.replace(/^v-model:/, '').replace(/^[@#:]/, '')
    s = s.split(/[=\s(.[]/)[0] ?? ''
    return s.replace(/-/g, '').toLowerCase()
}

/** 卡片上展示的参数写法：保留 v-model: / @ / # 前缀，去掉取值部分与动态绑定的冒号 */
function displayParam(raw: string): string {
    return (raw.trim().split(/[=\s(]/)[0] ?? '').replace(/^:/, '')
}

function collectCodes(node: unknown, out: string[]) {
    if (!isElement(node)) return
    if (node[0] === 'code') {
        out.push(nodeText(node))
        return
    }
    for (const child of node.slice(2)) collectCodes(child, out)
}

/** 收集 `## API` 下所有表格首列里的参数名（含 tabs 里分端的表） */
function collectApiNames(value: unknown[]): Set<string> {
    const names = new Set<string>()
    const start = value.findIndex(node => headingLevel(node) === 2 && headingId(node) === 'api')
    if (start === -1) return names

    const walk = (node: unknown) => {
        if (!isElement(node)) return
        if (node[0] === 'tr') {
            const firstCell = node.slice(2).find(child => isElement(child) && child[0] === 'td')
            if (!firstCell) return
            const codes: string[] = []
            collectCodes(firstCell, codes)
            for (const code of codes.length ? codes : [nodeText(firstCell)]) {
                const name = normalizeParam(code)
                if (name) names.add(name)
            }
            return
        }
        for (const child of node.slice(2)) walk(child)
    }

    for (const node of value.slice(start + 1, sectionEnd(value, start, 2))) walk(node)
    return names
}

function toSegments(node: unknown, out: DemoUsageSegment[]) {
    if (typeof node === 'string') {
        const last = out[out.length - 1]
        if (last?.type === 'text') last.value += node
        else out.push({ type: 'text', value: node })
        return
    }
    if (!isElement(node)) return
    if (node[0] === 'code') {
        out.push({ type: 'code', value: nodeText(node) })
        return
    }
    // strong / em / a 等行内元素只取文字
    for (const child of node.slice(2)) toSegments(child, out)
}

function buildUsage(heading: Element, nodes: unknown[], apiNames: Set<string>): DemoUsage {
    const description: DemoUsageSegment[] = []
    const firstParagraph = nodes.find(node => isElement(node) && node[0] === 'p')
    if (firstParagraph) toSegments(firstParagraph, description)

    // 只看小节里的直接段落：代码块、表格、提示块里的代码多是取值或示例片段，不是参数名
    const params: string[] = []
    const seen = new Set<string>()
    for (const node of nodes) {
        if (!isElement(node) || node[0] !== 'p') continue
        const codes: string[] = []
        collectCodes(node, codes)
        for (const code of codes) {
            const key = normalizeParam(code)
            if (!key || seen.has(key) || !apiNames.has(key)) continue
            seen.add(key)
            params.push(displayParam(code))
        }
    }

    return {
        id: headingId(heading),
        description,
        params: params.slice(0, MAX_PARAMS),
    }
}

export function trimComponentDocBody(value: unknown[], demoTitles: string[]): TrimmedComponentBody {
    const titles = new Set(demoTitles)
    const apiNames = collectApiNames(value)
    const out: unknown[] = []
    const removedH2 = new Set<string>()
    const usage: Record<string, DemoUsage> = {}

    let i = 0
    while (i < value.length) {
        const node = value[i]
        const level = headingLevel(node)
        const id = headingId(node)

        if (level === 2 && id === '简介') {
            removedH2.add(id)
            i = sectionEnd(value, i, 2)
            continue
        }

        if (level === 2 && id === '用法' && titles.size) {
            const end = sectionEnd(value, i, 2)
            const intro: unknown[] = []
            const kept: unknown[] = []
            let total = 0
            let matched = 0

            let j = i + 1
            while (j < end && headingLevel(value[j]) !== 3) intro.push(value[j++])
            while (j < end) {
                const heading = value[j] as Element
                const subEnd = Math.min(sectionEnd(value, j, 3), end)
                const title = nodeText(heading).trim()
                total++
                if (titles.has(title)) {
                    matched++
                    usage[title] = buildUsage(heading, value.slice(j + 1, subEnd), apiNames)
                }
                else {
                    kept.push(...value.slice(j, subEnd))
                }
                j = subEnd
            }

            if (total && matched === total) removedH2.add(id)
            else out.push(node, ...intro, ...kept)
            i = end
            continue
        }

        out.push(node)
        i++
    }

    return { value: out, removedH2, usage }
}
