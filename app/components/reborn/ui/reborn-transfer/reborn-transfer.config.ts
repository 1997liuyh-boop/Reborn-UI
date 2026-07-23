/** 穿梭框尺寸预设 */
export const transferSizes = ['sm', 'md', 'lg'] as const
export type TransferSize = (typeof transferSizes)[number]

/** 选中框外观：square 方形 | rounded 圆角 | circle 圆形 */
export const transferCheckShapes = ['square', 'rounded', 'circle'] as const
export type TransferCheckShape = (typeof transferCheckShapes)[number]

/**
 * 穿梭框单条数据项结构（默认字段名）
 */
export interface TransferItem {
  /** 唯一标识 */
  key: string
  /** 显示文字 */
  label: string
  /** 条目描述（可选，显示在 label 下方） */
  description?: string
  /** 是否禁用此条目，禁用后无法勾选和移动 */
  disabled?: boolean
}

/** 任意字段结构的数据源条目 */
export type TransferDataRecord = Record<string, unknown>

/**
 * dataSource 字段别名映射
 * 当后端字段名与默认的 key / label / description / disabled 不一致时配置
 */
export interface TransferFieldNames {
  /** 唯一标识字段名，默认 `key` */
  key?: string
  /** 展示文案字段名，默认 `label` */
  label?: string
  /** 描述字段名，默认 `description` */
  description?: string
  /** 禁用字段名，默认 `disabled` */
  disabled?: string
}

/** 字段别名默认值 */
export const defaultTransferFieldNames = {
  key: 'key',
  label: 'label',
  description: 'description',
  disabled: 'disabled',
} as const satisfies TransferFieldNames

/** 中间操作区单个按钮的自定义配置 */
export interface TransferOperationButtonConfig {
  /** 悬停提示（title） */
  title?: string
  /** 按钮可见文案；位于前置图标与后置图标之间 */
  label?: string
  /**
   * 前置图标（Nuxt Icon name）
   * 与 `leadingIcon` 等价，二者同时设置时优先 `leadingIcon`
   */
  icon?: string
  /** 前置图标样式 class */
  iconClass?: string
  /** 前置图标（与 icon 等价，命名更直观） */
  leadingIcon?: string
  /** 前置图标样式 class（与 iconClass 等价，命名更直观） */
  leadingIconClass?: string
  /** 后置图标（显示在文案右侧） */
  trailingIcon?: string
  /** 后置图标样式 class */
  trailingIconClass?: string
  /** 无障碍 aria-label，默认回退到 title 或 label */
  ariaLabel?: string
  /** 是否显示前置图标，默认 true */
  showIcon?: boolean
  /** 是否显示后置图标，默认在配置了 trailingIcon 时为 true */
  showTrailingIcon?: boolean
}

/** 中间三个操作按钮的自定义配置 */
export interface TransferOperationButtons {
  /** 移至右侧 */
  toRight?: TransferOperationButtonConfig
  /** 移回左侧 */
  toLeft?: TransferOperationButtonConfig
  /** 撤回上一步 */
  undo?: TransferOperationButtonConfig
}

const config = {
  slots: {
    root: 'reborn-transfer flex items-stretch gap-3',

    /** 单个列表面板容器（overflow-hidden 保证外框圆角与边框一致） */
    panel:
      'flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 flex-1 min-w-0',

    /** 面板头部（rounded-t-xl 与面板顶角对齐，避免背景溢出圆角） */
    panelHeader:
      'relative z-10 flex shrink-0 items-center rounded-t-xl border-b border-gray-200 bg-gray-50 dark:border-gray-700/60 dark:bg-gray-800/60',

    /** 头部勾选控件区（全选框 / 扩展菜单），与列表条目复选框列对齐 */
    headerSelectControls: 'flex shrink-0 items-center',
    /** 头部全选下拉：触发器 + 菜单容器（宽高与 checkAll / itemCheck 一致） */
    headerSelectMenu: 'relative flex size-4 shrink-0 items-center justify-center',
    headerSelectTrigger:
      'flex size-4 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/80 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-200',
    headerSelectIcon: 'size-3 shrink-0 transition-transform duration-200',
    headerSelectDropdown:
      'absolute top-full left-0 z-50 mt-1 min-w-[7.5rem] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900',
    headerSelectDropdownInner: 'w-full py-1',
    headerSelectItem:
      'block w-full cursor-pointer whitespace-nowrap px-3 text-left text-gray-700 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200 dark:hover:bg-primary/15',

    /** 标题 + 计数区域 */
    panelTitleArea: 'flex-1 min-w-0 flex items-baseline justify-between',
    panelTitle: 'font-semibold text-gray-700 dark:text-gray-200 truncate',
    panelCount: 'text-gray-400 dark:text-gray-500 shrink-0',

    /** 搜索框外层容器 */
    panelSearch: 'border-b border-gray-200 dark:border-gray-700/60 shrink-0',
    /** 搜索框：图标与输入框横向排列，聚焦样式作用于输入框本体 */
    searchWrapper: 'flex w-full items-center',
    searchIcon: 'shrink-0 text-gray-400 dark:text-gray-500',
    searchInput:
      'min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200 dark:placeholder:text-gray-500',

    /** 列表 + 分页容器（开启分页时占满面板剩余高度，分页贴底） */
    panelContent: 'flex min-h-0 flex-1 flex-col overflow-hidden',
    /** 可滚动列表区域 */
    panelBody: 'overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900',
    /** 开启分页时列表区撑满内容区剩余空间 */
    panelBodyFill: 'flex min-h-0 flex-1 flex-col',
    panelBodyRounded: 'rounded-b-xl',
    /** 分页栏（固定在面板底部） */
    panelFooter:
      'mt-auto shrink-0 flex justify-center border-t border-gray-200 bg-gray-50/80 px-2 py-2 dark:border-gray-700/60 dark:bg-gray-800/40',

    /** 空状态容器 */
    panelEmpty: 'flex flex-col items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500',

    /** 全选复选框 */
    checkAll: 'flex shrink-0 items-center justify-center size-4 border transition-all',
    /** 条目复选框 */
    itemCheck:
      'flex shrink-0 items-center justify-center size-4 border transition-all self-center',

    /** 单个列表项 */
    item: 'flex items-center cursor-pointer transition-colors select-none',
    itemContent: 'flex-1 min-w-0',
    itemLabel: 'text-gray-800 dark:text-gray-100 leading-normal',
    itemDesc: 'text-gray-400 dark:text-gray-500 truncate mt-0.5',

    /** 单向模式右侧条目撤回按钮 */
    itemUndoBtn:
      'flex shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200/80 hover:text-primary active:scale-95 dark:text-gray-500 dark:hover:bg-gray-700/60 dark:hover:text-primary',
    itemUndoIcon: 'size-3.5 shrink-0',

    /** 中间操作按钮区 */
    operations: 'flex flex-col items-center justify-center gap-2.5 shrink-0 self-center px-1',
    operationBtn: 'flex items-center justify-center rounded-lg border transition-all active:scale-95',
    /** 带可见文案时的操作按钮（横向排列；仅放宽宽度，高度仍由 size 变体控制） */
    operationBtnLabeled: '!w-auto min-w-0 max-w-none shrink-0 gap-1.5 px-2.5',
    /** 操作按钮内图标容器，防止 flex 挤压导致图标不可见 */
    operationBtnIcon: 'inline-flex shrink-0 items-center justify-center',
    operationBtnLabel: 'shrink-0 whitespace-nowrap font-medium leading-none text-current',
  },

  variants: {
    checkShape: {
      square: {
        checkAll: 'rounded-none',
        itemCheck: 'rounded-none',
      },
      rounded: {
        checkAll: 'rounded-md',
        itemCheck: 'rounded-md',
      },
      circle: {
        checkAll: 'rounded-full',
        itemCheck: 'rounded-full',
      },
    },
    size: {
      sm: {
        panelHeader: 'px-3 py-2 gap-2',
        headerSelectControls: 'gap-2',
        headerSelectItem: 'py-1.5 text-xs',
        panelTitle: 'text-xs',
        panelCount: 'text-[10px]',
        panelSearch: 'px-2.5 py-1.5',
        searchWrapper: 'gap-1.5',
        searchIcon: 'size-3.5',
        searchInput: 'px-2.5 py-1 text-xs leading-normal',
        panelContent: 'min-h-[100px] max-h-[200px]',
        panelBody: 'min-h-[100px] max-h-[200px]',
        panelEmpty: 'min-h-[100px] text-xs',
        item: 'px-3 gap-2',
        itemContent: 'py-1.5',
        itemLabel: 'text-xs',
        itemDesc: 'text-[10px]',
        itemUndoBtn: 'size-6',
        operationBtn: 'size-7',
        operationBtnLabeled: 'px-2 gap-1',
        operationBtnLabel: 'text-[9px]',
      },
      md: {
        panelHeader: 'px-4 py-3 gap-2',
        headerSelectControls: 'gap-2',
        headerSelectItem: 'py-2 text-sm',
        panelTitle: 'text-sm',
        panelCount: 'text-xs',
        panelSearch: 'px-3 py-2',
        searchWrapper: 'gap-2',
        searchIcon: 'size-4',
        searchInput: 'px-3 py-1.5 text-sm leading-normal',
        panelContent: 'min-h-[160px] max-h-[300px]',
        panelBody: 'min-h-[160px] max-h-[300px]',
        panelEmpty: 'min-h-[160px] text-sm',
        item: 'px-4 gap-3',
        itemContent: 'py-2.5',
        itemLabel: 'text-sm',
        itemDesc: 'text-xs',
        itemUndoBtn: 'size-7',
        operationBtn: 'size-8',
        operationBtnLabeled: 'px-2.5 gap-1.5',
        operationBtnLabel: 'text-[10px]',
      },
      lg: {
        panelHeader: 'px-5 py-3.5 gap-3',
        headerSelectControls: 'gap-3',
        headerSelectItem: 'py-2 text-sm',
        panelTitle: 'text-base',
        panelCount: 'text-xs',
        panelSearch: 'px-4 py-2.5',
        searchWrapper: 'gap-2',
        searchIcon: 'size-4',
        searchInput: 'px-3 py-2 text-sm leading-normal',
        panelContent: 'min-h-[200px] max-h-[380px]',
        panelBody: 'min-h-[200px] max-h-[380px]',
        panelEmpty: 'min-h-[200px] text-sm',
        item: 'px-5 gap-3',
        itemContent: 'py-3',
        itemLabel: 'text-base',
        itemDesc: 'text-sm',
        itemUndoBtn: 'size-8',
        operationBtn: 'size-9',
        operationBtnLabeled: 'px-3 gap-1.5',
        operationBtnLabel: 'text-[11px]',
      },
    },
  },

  defaultVariants: {
    size: 'md' as TransferSize,
    checkShape: 'rounded' as TransferCheckShape,
  },
} as const

export default config
