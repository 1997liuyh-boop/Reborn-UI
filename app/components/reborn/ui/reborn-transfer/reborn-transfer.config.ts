/** 选中框外观：square 方形 | rounded 圆角 | circle 圆形 */
export const transferCheckShapes = ['square', 'rounded', 'circle'] as const
export type TransferCheckShape = (typeof transferCheckShapes)[number]

/** 形态变体：outlined 描边面板 | borderless 无边框且不渲染头部 */
export const transferVariants = ['outlined', 'borderless'] as const
export type TransferVariant = (typeof transferVariants)[number]

/** 语义色：决定复选框的勾选色与选中条目的底色 */
export const transferColors = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const
export type TransferColor = (typeof transferColors)[number]

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

/**
 * 不设尺寸档位：面板高度由父元素决定（根节点 h-full），文字统一取七级令牌的 text-sm，
 * 搜索框与操作按钮分别交给 RebornInput / RebornButton 的 sm 档。
 */
const config = {
  slots: {
    /** h-full：父元素给了高度就撑满并在列表内滚动；父元素高度为 auto 时列表随内容增高 */
    root: 'reborn-transfer flex h-full items-stretch gap-3',

    /** 单个列表面板容器（overflow-hidden 保证外框圆角与边框一致） */
    panel:
      'flex flex-col overflow-hidden rounded-lg border border-gray-4 bg-gray-1 flex-1 min-w-0',

    /**
     * 面板头部：左侧全选复选框（文案为计数）+ 下拉菜单，右侧标题。
     * 内边距与条目一致取 px-1.5，复选框列才能和下方条目的复选框上下对齐
     */
    panelHeader:
      'relative z-10 flex shrink-0 items-center gap-2 border-b border-gray-4 px-1.5 py-2',

    /** 头部勾选控件区（title 插槽 + 下拉菜单） */
    headerSelectControls: 'flex min-w-0 items-center gap-2',
    /** 头部下拉：作为 RebornSelect 的 class，落在触发器外层；默认 w-full，这里收成内容宽度 */
    headerSelectMenu: 'w-auto shrink-0',
    /**
     * 下拉触发器：传给 RebornSelect 的 triggerUi.trigger。
     * sm 档自带 h-input-sm（24px），twMerge 识别不出这个自定义高度与 h-auto 同组，
     * 两个类会同时保留，所以这里用 h-auto! 强制按内容高度，避免撑高面板头部；禁用态去掉灰底
     */
    headerSelectTrigger: 'h-auto! w-auto gap-1 bg-transparent text-gray-7',
    /** 下拉浮层：传给 RebornSelect 的 triggerUi.dropdown，浮层挂到 body；触发器只有计数文字宽，这里给出最小宽度 */
    headerSelectDropdown: 'min-w-40 max-w-64',
    /** 单个选项：传给 RebornSelect 的 ui.option，默认留空沿用下拉选择的选项样式 */
    headerSelectItem: '',

    /** 标题区域（extra 插槽的默认内容）：靠右排列，左侧留给全选控件 */
    panelTitleArea: 'flex min-w-0 flex-1 items-center justify-end gap-2',
    panelTitle: 'text-sm font-semibold text-gray-9 truncate',
    /** 计数文案：显示全选复选框时作为它的 label，隐藏时单独显示在头部左侧 */
    panelCount: 'shrink-0 whitespace-nowrap text-sm text-gray-7',

    /** 搜索 + 列表 + 底部的内容区，占满头部以下的全部高度 */
    panelContent: 'flex min-h-0 flex-1 flex-col',
    /** 搜索框外层：并入内容区，不画上下分隔线，左右内边距与条目对齐 */
    panelSearch: 'shrink-0 px-1.5 pt-2 pb-1',
    /** 搜索框：作为 class 传给 RebornInput，落在带边框的输入外壳（wrapper）上 */
    searchInput: 'w-full',
    /** 可滚动列表区域（RebornScrollbar 的根节点），占满内容区剩余高度 */
    panelBody: 'min-h-0 flex-1',
    /**
     * 列表内层（RebornScrollbar 的 contentClass）：上下留 4px，条目之间间隔 4px。
     * min-h-full 让空状态能在列表区内垂直居中
     */
    panelList: 'flex min-h-full flex-col gap-1 py-1',
    /**
     * 虚拟滚动的占位层：高度由 JS 按「条数 × 步长」写成行内样式，撑出与真实列表等长的滚动条。
     * shrink-0 防止被 panelList 的 flex 列压缩
     */
    virtualPhantom: 'relative w-full shrink-0',
    /**
     * 虚拟滚动的窗口层：脱离文档流贴在占位层顶部，靠行内 translateY 滑到当前区间的位置。
     * gap-1 须与 panelList 一致，组件按 4px 行间距计算步长（virtualItemHeight）
     */
    virtualWindow: 'absolute inset-x-0 top-0 flex flex-col gap-1',
    /** 底部区域：分页与 footer 插槽，固定在面板底部 */
    panelFooter: 'mt-auto shrink-0 flex flex-col gap-2 border-t border-gray-4 px-2 py-2',
    /** 分页栏 */
    panelPagination: 'flex justify-center',

    /** 空状态容器 */
    panelEmpty: 'flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-sm text-gray-5',

    /** 头部全选复选框的勾选框，作为 RebornCheckbox 的 ui.control 传入 */
    checkAll: '',
    /** 条目复选框的勾选框，作为 RebornCheckbox 的 ui.control 传入 */
    itemCheck: '',

    /** 单个列表项。shrink-0 防止条目较多时被列表的 flex 布局压扁 */
    item: 'flex shrink-0 items-center gap-2 cursor-pointer transition-colors select-none px-1.5 py-1',
    /** 选中条目的底色，具体色值由 color 变体给出 */
    itemSelected: '',
    itemContent: 'flex-1 min-w-0',
    /** 条目主文案。行高由 text-sm 令牌自带，不写 leading-（令牌行高 = 字号 + 8px） */
    itemLabel: 'text-sm text-gray-9',
    itemDesc: 'text-sm text-gray-5 truncate mt-0.5',

    /** 单向模式右侧条目撤回按钮 */
    itemUndoBtn:
      'flex size-7 shrink-0 items-center justify-center rounded-md text-gray-5 transition-colors hover:bg-gray-3/80 hover:text-primary active:scale-95',
    itemUndoIcon: 'size-3.5 shrink-0',

    /** 中间操作按钮区 */
    operations: 'flex flex-col items-center justify-center gap-2.5 shrink-0 self-center px-1',
    /** 操作按钮（RebornButton 的根节点），高度与字号由按钮的 sm 档决定 */
    operationBtn: 'shrink-0',
    /** 只有图标、没有文案时收成正方形 */
    operationBtnIconOnly: 'aspect-square px-0',
    /** 操作按钮内图标容器，防止 flex 挤压导致图标不可见 */
    operationBtnIcon: 'inline-flex shrink-0 items-center justify-center',
    operationBtnLabel: 'shrink-0 whitespace-nowrap',
  },

  variants: {
    /** 勾选框圆角；rounded 沿用 RebornCheckbox 自带的 rounded-sm，不再额外覆盖 */
    checkShape: {
      square: {
        checkAll: 'rounded-none',
        itemCheck: 'rounded-none',
      },
      rounded: {},
      circle: {
        checkAll: 'rounded-full',
        itemCheck: 'rounded-full',
      },
    },
    /** borderless 去掉面板外框与底部分隔线；头部由组件直接不渲染 */
    variant: {
      outlined: {},
      borderless: {
        panel: 'border-0',
        panelFooter: 'border-t-0',
      },
    },
    /**
     * 选中条目取对应色阶 1 档填充，并把 hover 钉在同一色上，避免悬停时跳回灰底。
     * 头部下拉的选中项颜色由 RebornSelect 自己的 color 决定，这里不重复下发。
     * neutral 例外：gray-1 是面板底色，用它会看不出选中，改取 2 档
     */
    color: {
      primary: {
        itemSelected: 'bg-brand-1 hover:bg-brand-1',
      },
      secondary: {
        itemSelected: 'bg-secondary-1 hover:bg-secondary-1',
      },
      success: {
        itemSelected: 'bg-green-1 hover:bg-green-1',
      },
      info: {
        itemSelected: 'bg-blue-1 hover:bg-blue-1',
      },
      warning: {
        itemSelected: 'bg-orange-1 hover:bg-orange-1',
      },
      error: {
        itemSelected: 'bg-red-1 hover:bg-red-1',
      },
      neutral: {
        itemSelected: 'bg-gray-2 hover:bg-gray-2',
      },
    },
  },

  defaultVariants: {
    checkShape: 'rounded' as TransferCheckShape,
    variant: 'outlined' as TransferVariant,
    color: 'primary' as TransferColor,
  },
} as const

export default config
