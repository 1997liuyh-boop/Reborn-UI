import type { InjectionKey, Ref } from "vue";

/**
 * 「使用建议」面板的内容。
 *
 * 这几节（何时使用 / 何时不使用 / 注意事项）写在 md 正文里、是 ComponentViewer 的兄弟节点，
 * 组件自己拿不到。由 DocsPage 在渲染前从正文 AST 里切出来，经这里下发给 ComponentTabs。
 */
export interface SuggestionContext {
  /** ContentRenderer 可直接渲染的文档片段；文档里没有这几节时为 null，对应的 Tab 整个不出现 */
  value: Ref<Record<string, any> | null>;
}

/** 使用建议注入键（由 DocsPage 提供，ComponentTabs 消费） */
export const suggestionContextKey: InjectionKey<SuggestionContext>
  = Symbol("reborn.suggestion-context");

/**
 * Sandbox 面板与 ComponentPlayground 之间的握手。
 *
 * 参数调节区在 ComponentPlayground 的 #config 插槽里，而承载它的 Tab 面板在 ComponentTabs，
 * 两者隔着 `<component :is="config" />` 这层动态组件，只能靠 Teleport 搬运。
 * 麻烦在于顺序：Vue 自下而上挂载，ComponentPlayground 挂载时上层还不知道该不该开这个 Tab，
 * 传送目标自然也还不存在。于是拆成两步——子组件挂载后 register()，上层建好目标再把 ready 置为 true。
 */
export interface SandboxContext {
  /** 传送目标元素的 id */
  targetId: string;
  /** 目标节点是否已挂好。为 false 时不能渲染 Teleport：选择器解析不到目标会报 Invalid Teleport target */
  ready: Ref<boolean>;
  /** 由 ComponentPlayground 在挂载时调用，告知上层「本组件有可调参数」 */
  register: () => void;
}

/** Sandbox 注入键（由 ComponentTabs 提供，ComponentPlayground 消费） */
export const sandboxContextKey: InjectionKey<SandboxContext>
  = Symbol("reborn.sandbox-context");

export interface ComponentViewerProps {
  /** 组件依赖 */
  devDependencies?: string;
  /** 组件依赖 */
  dependencies?: string;
  /** 组件ID */
  componentId: string;
  /** 是否显示安装 */
  showInstallation?: boolean;
  /** 示例文件 */
  demoFile: string;
  /** 组件文件 */
  componentFiles?: string[];
  /** 组件配置 */
  config: string;
  /** 组件文件夹 */
  folderName?: string;
  /** 组件名称 */
  componentName?: string;
  /** 组件类 */
  componentClass?: string;
  /** 在脚本设置中需要外部化的属性列表 */
  external?: string[]
  /** 外部化属性的类型 */
  externalTypes?: string[]
  // 高亮行号
  highlights?: number[]
  // 是否启用 prettier
  prettier?: boolean;
  // 是否隐藏溢出
  overflowHidden?: boolean
  // 是否启用阴影
  elevated?: boolean
  /** 需要使用v-model的属性列表 */
  model?: string[]
  /** 组件的属性列表 */
  props?: { [key: string]: any }
  /** 组件的插槽列表 */
  slots?: { [key: string]: any }
}
