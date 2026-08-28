import type { InjectionKey, Ref } from 'vue'
import type { DemoSectionSourceMap } from '~/utils/extractDemoSections'

/** DemoSection 从上层拿到的上下文：源码映射 + 用于「预览 / 询问 AI」的定位信息 */
export interface DemoContext {
    /** 分组标题 -> 分组内模板源码 */
    sources: Ref<DemoSectionSourceMap>
    /** 当前组件 id（kebab-case），用于拼「询问 AI」提示词 */
    componentId?: string
    /** demo 文件名，用于代码块头部标题 */
    demoFile?: string
    /** demo 组件名（不含 .vue），用于拼 /preview 预览路由 */
    demoName?: string
}

/** demo 上下文注入键（由 ComponentTabs 提供，DemoSection 消费） */
export const demoContextKey: InjectionKey<DemoContext> = Symbol('reborn.demo-context')
