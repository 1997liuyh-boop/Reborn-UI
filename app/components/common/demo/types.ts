import type { InjectionKey, Ref } from 'vue'
import type { DemoSectionSourceMap } from '~/utils/extractDemoSections'
import type { ComponentThemeGroup } from '~/utils/getComponentTheme'

/**
 * 示例容器的边界标记属性，由 DemoSection 写在自己的示例本体容器上。
 *
 * Theme slots 面板靠它区分两类节点：
 * · 落在某个 `[data-demo-scope]` 里的 —— 属于那张示例卡片，只有本卡片才该统计它；
 * · 不落在任何 `[data-demo-scope]` 里的 —— 是 Teleport 到 body 的弹层
 *   （Popup / Dialog / Tooltip / Popover / ContextMenu / Guide 等一批组件都这么干），
 *   DOM 上已经和示例卡片脱钩，只按卡片作用域查是永远查不到的。
 *
 * 写入方（DemoSection）与查询方（ThemeSlotsPanel）必须共用这一个常量，不能各写字面量。
 */
export const DEMO_SCOPE_ATTR = 'data-demo-scope'

/** DemoSection 从上层拿到的上下文：源码映射 + 用于「预览 / 询问 AI」的定位信息 */
export interface DemoContext {
    /** 分组标题 -> 分组内模板源码 */
    sources: Ref<DemoSectionSourceMap>
    /** 分组标题 -> 可独立运行的完整 SFC（补全了 script 依赖与 template 包裹），供 Playground 使用 */
    runnableSources?: Ref<DemoSectionSourceMap>
    /** 当前组件 id（kebab-case），用于拼「询问 AI」提示词 */
    componentId?: string
    /** demo 文件名，用于代码块头部标题 */
    demoFile?: string
    /** demo 组件名（不含 .vue），用于拼 /preview 预览路由 */
    demoName?: string
    /**
     * 当前组件主题的 slot 结构，供每张示例卡片的 Theme slots 面板使用。
     * 整页只加载一次（配置是同一份），不必每张卡片各读一遍。
     */
    themeGroups?: Ref<ComponentThemeGroup[]>
}

/** demo 上下文注入键（由 ComponentTabs 提供，DemoSection 消费） */
export const demoContextKey: InjectionKey<DemoContext> = Symbol('reborn.demo-context')
