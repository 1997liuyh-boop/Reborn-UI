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
