<script setup lang="ts">
import type { PlaygroundControlGroup } from '~/components/common/play-ground/Playground.vue'
import type { TableChange, TableColumn, TableExpose, TableKey, TableProps, TableRow, TableSize } from '~/components/reborn/ui/reborn-table/table.types'
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from '#components'
import { computed, h, ref, watch } from 'vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornCheckbox from '~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue'
import RebornInputNumber from '~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue'
import RebornSwitch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue'
import { tableSizes } from '~/components/reborn/ui/reborn-table/reborn-table.config'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import RebornTableColumn from '~/components/reborn/ui/reborn-table/RebornTableColumn.vue'
import RebornText from '~/components/reborn/ui/reborn-text/RebornText.vue'

/** 所有示例共用稳定行键，金额为数字，便于排序和合计。 */
const rows: TableRow[] = [
  { id: 101, name: '林晓', department: '研发', city: '杭州', amount: 1280, status: '已确认', email: 'lin@example.com' },
  { id: 102, name: '陈晨', department: '研发', city: '上海', amount: 960, status: '待审核', email: 'chen@example.com' },
  { id: 103, name: '周宁', department: '设计', city: '北京', amount: 1680, status: '已确认', email: 'zhou@example.com' },
  { id: 104, name: '许青', department: '设计', city: '杭州', amount: 720, status: '待审核', email: 'xu@example.com' },
  { id: 105, name: '宋言', department: '运营', city: '上海', amount: 2100, status: '已确认', email: 'song@example.com' },
  { id: 106, name: '陆遥', department: '运营', city: '北京', amount: 850, status: '待审核', email: 'lu@example.com' },
  { id: 107, name: '方禾', department: '财务', city: '杭州', amount: 1320, status: '已确认', email: 'fang@example.com' },
  { id: 108, name: '顾安', department: '财务', city: '上海', amount: 600, status: '已确认', email: 'gu@example.com' },
]

/** 数据驱动列使用字段名与表头文案，不需要转换为其他库的字段。 */
const columns: TableColumn[] = [
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'department', label: '部门', minWidth: 100 },
  { prop: 'city', label: '城市', minWidth: 100 },
  { prop: 'amount', label: '报销金额', minWidth: 140, align: 'right' },
]

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场包含真实外观、状态和行为开关；空数据开关只切换数据源。 */
const defaultState = {
  size: 'md' as TableSize,
  border: false,
  stripe: false,
  showHeader: true,
  headerBackground: false,
  hover: true,
  height: 280,
  fixedHeader: true,
  tableLayout: 'fixed' as NonNullable<TableProps['tableLayout']>,
  showOverflowTooltip: false,
  loading: false,
  highlightCurrentRow: false,
  pagination: false,
  showSummary: false,
  emptyText: '暂无数据',
  emptyData: false,
}
/** 当前演练参数。 */
const state = ref({ ...defaultState })
/** 重建实例时同时清除内部排序等非模型状态。 */
const previewKey = ref(0)
/** 演练场的五个具名模型。 */
const selectedKeys = ref<TableKey[]>([])
const expandedRowKeys = ref<TableKey[]>([])
const currentRowKey = ref<TableKey>()
const currentPage = ref(1)
const pageSize = ref(10)
/** 最近一次交互的可读回显。 */
const lastEvent = ref('尚未操作')
/** 演练列只包含可序列化字段，复制代码时无需补齐回调。 */
const playgroundColumns: TableColumn[] = [
  { type: 'selection', width: 48 },
  { type: 'expand', width: 48 },
  ...columns.map(column => ({ ...column, sortable: column.prop === 'amount' })),
]
/** 去掉演示辅助字段，避免向组件传入不存在的属性。 */
const previewProps = computed<TableProps>(() => {
  const { emptyData, ...props } = state.value
  return { ...props, data: emptyData ? [] : rows, columns: playgroundColumns, rowKey: 'id', ariaLabel: '报销明细演练场' }
})
/** 从组件配置读取尺寸，场景从宽松到紧凑依次展示。 */
const sizes: TableSize[] = [...tableSizes].reverse()
/** 控制项直接绑定预览参数。 */
const controls: PlaygroundControlGroup[] = [
  {
    title: '尺寸与外观',
    children: [
      { label: '行高尺寸', key: 'size', component: 'select', defaultValue: 'md', props: { options: sizes.map(size => ({ label: `${size}（${{ lg: 56, md: 48, sm: 36 }[size]}px）`, value: size })) } },
      { label: '表体高度（px）', key: 'height', component: 'input-number', defaultValue: 280, props: { min: 160, max: 600, step: 40 } },
      { label: '固定表头', key: 'fixedHeader', component: 'checkbox', defaultValue: true },
      { label: '列宽布局', key: 'tableLayout', component: 'select', defaultValue: 'fixed', props: { options: [{ label: '固定布局', value: 'fixed' }, { label: '自动布局', value: 'auto' }] } },
      { label: '溢出提示', key: 'showOverflowTooltip', component: 'checkbox', defaultValue: false },
      { label: '显示边框', key: 'border', component: 'checkbox', defaultValue: false },
      { label: '斑马纹', key: 'stripe', component: 'checkbox', defaultValue: false },
      { label: '显示表头', key: 'showHeader', component: 'checkbox', defaultValue: true },
      { label: '表头灰背景', key: 'headerBackground', component: 'checkbox', defaultValue: false },
      { label: '整行悬停背景', key: 'hover', component: 'checkbox', defaultValue: true },
    ],
  },
  {
    title: '状态与行为',
    children: [
      { label: '加载状态', key: 'loading', component: 'checkbox', defaultValue: false },
      { label: '显示空数据', key: 'emptyData', component: 'checkbox', defaultValue: false, codeIgnore: true },
      { label: '空数据文案', key: 'emptyText', component: 'input', defaultValue: '暂无数据' },
      { label: '高亮当前行', key: 'highlightCurrentRow', component: 'checkbox', defaultValue: false },
      { label: '启用本地分页', key: 'pagination', component: 'checkbox', defaultValue: false },
      { label: '显示合计', key: 'showSummary', component: 'checkbox', defaultValue: false },
    ],
  },
]

/** 记录事件，不序列化鼠标事件与元素，避免循环引用。 */
function recordEvent(name: string, value: unknown) {
  lastEvent.value = `${name}：${JSON.stringify(value)}`
}

/** 重置配置、五个模型、内部状态和事件回显。 */
function resetState() {
  state.value = { ...defaultState }
  selectedKeys.value = []
  expandedRowKeys.value = []
  currentRowKey.value = undefined
  currentPage.value = 1
  pageSize.value = 10
  lastEvent.value = '已重置，等待操作'
  previewKey.value++
}

/** 生成完整单文件组件，包含数据、所有演练参数、模型、插槽与重置回显。 */
const tableCode = computed(() => {
  const propsCode = JSON.stringify(previewProps.value, null, 2).replaceAll('<', '\\u003c')
  return `<script setup lang="ts">
import { ref } from 'vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableKey, TableProps } from '~/components/reborn/ui/reborn-table/table.types'

const props: TableProps = ${propsCode}
const selectedKeys = ref<TableKey[]>(${JSON.stringify(selectedKeys.value)})
const expandedRowKeys = ref<TableKey[]>(${JSON.stringify(expandedRowKeys.value)})
const currentRowKey = ref<TableKey | undefined>(${JSON.stringify(currentRowKey.value) ?? 'undefined'})
const currentPage = ref(${currentPage.value})
const pageSize = ref(${pageSize.value})
const tableKey = ref(0)
const lastEvent = ref('尚未操作')
function reset() {
  selectedKeys.value = []
  expandedRowKeys.value = []
  currentRowKey.value = undefined
  currentPage.value = 1
  pageSize.value = 10
  lastEvent.value = '已重置，等待操作'
  tableKey.value++
}
<\/script>

<template>
  <RebornButton variant="outlined" @click="reset">重置交互</RebornButton>
  <RebornTable
    :key="tableKey" v-bind="props"
    v-model:selected-keys="selectedKeys" v-model:expanded-row-keys="expandedRowKeys"
    v-model:current-row-key="currentRowKey" v-model:current-page="currentPage" v-model:page-size="pageSize"
    @selection-change="lastEvent = '已选 ' + $event.length + ' 行'"
    @row-click="lastEvent = '点击行：' + $event.name"
    @expand-change="lastEvent = '展开变化：' + $event.name"
    @change="lastEvent = JSON.stringify($event)"
  >
    <template #expand="{ row, $index }"><p class="p-4">第 {{ $index + 1 }} 行：{{ row.email }}</p></template>
  </RebornTable>
  <p class="mt-3 text-base text-gray-9" aria-live="polite">{{ lastEvent }}</p>
</template>`
})

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 宽表示例独立补齐业务字段，不改变分页与合并示例的数据。 */
const fixedRows = rows.map((row, index) => ({
  ...row,
  orderNo: `BX-202610-${String(index + 1).padStart(3, '0')}`,
  project: ['文档平台', '客户工作台', '品牌升级', '运营活动'][Math.floor(index / 2)],
  costType: index % 2 === 0 ? '差旅交通' : '会议物料',
  submittedAt: `2026-10-${String(index + 1).padStart(2, '0')}`,
}))
/** 十列均有实际数据，左右固定列保留，中间列形成自然横向滚动。 */
const fixedColumns: TableColumn[] = [
  { prop: 'name', label: '姓名', width: 120, fixed: 'left' },
  { prop: 'department', label: '部门', width: 180 },
  { prop: 'email', label: '邮箱', width: 280, showOverflowTooltip: true },
  { prop: 'city', label: '城市', width: 180 },
  { prop: 'orderNo', label: '报销单号', width: 200 },
  { prop: 'project', label: '所属项目', width: 180 },
  { prop: 'costType', label: '费用类型', width: 160 },
  { prop: 'submittedAt', label: '提交日期', width: 160 },
  { prop: 'status', label: '审核状态', width: 180 },
  { prop: 'amount', label: '金额', width: 140, fixed: 'right', align: 'right' },
]
/** 固定区域实例可恢复滚动位置。 */
const fixedTable = ref<TableExpose>()
/** 分组列的叶子节点仍然使用普通列配置。 */
const groupedColumns: TableColumn[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { label: '组织信息', headerAlign: 'center', children: columns.slice(1, 3) },
  { label: '报销信息', headerAlign: 'center', children: [{ prop: 'status', label: '审核状态' }, columns[3]!] },
]
/** 选择列禁用待审核行，并保留数据批次切换前的选择。 */
const selectionColumns: TableColumn[] = [
  { type: 'selection', width: 48, reserveSelection: true, selectable: row => row.status === '已确认' },
  ...columns,
  { prop: 'status', label: '审核状态', minWidth: 120 },
]
/** 多选专用两批各八条，键跨批次唯一，不扩容共享数据。 */
const selectionBatches = [
  rows.map(row => ({ ...row })),
  rows.map(row => ({ ...row, id: Number(row.id) + 100, name: `${row.name}（第二批）`, amount: Number(row.amount) + 120 })),
]
/** 两批数据复用同一实例，用于验证跨数据选择保留。 */
const selectionBatch = ref(0)
const selectionData = computed(() => selectionBatches[selectionBatch.value] ?? [])
const batchKeys = ref<TableKey[]>([])
const selectionTable = ref<TableExpose>()
const selectionEvent = ref('勾选已确认行，再切换数据批次')
/** 本示例只维护一个当前键，双向映射为选择数组，让两种交互同步。 */
const radioCurrentKey = ref<TableKey>()
const radioKeys = computed<TableKey[]>({
  get: () => radioCurrentKey.value === undefined ? [] : [radioCurrentKey.value],
  set: keys => { radioCurrentKey.value = keys[0] },
})
/** 隐藏单选列只改变列结构，当前键与行点击高亮继续生效。 */
const showRadio = ref(true)
const radioColumns = computed<TableColumn[]>(() => showRadio.value ? [{ type: 'radio', width: 48 }, ...columns] : columns)

/** 读取公开实例方法，展示实际选择行而不是仅统计键。 */
function inspectSelection() {
  selectionEvent.value = `getSelectionRows：${selectionTable.value?.getSelectionRows().map(row => row.name).join('、') || '无'}`
}

/** 排序和筛选均在本地执行，金额按数值而不是字符串比较。 */
const sortableColumns: TableColumn[] = [
  { type: 'index', label: '序号', width: 64, index: 1 },
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'department', label: '部门', minWidth: 120, filters: ['研发', '设计', '运营', '财务'].map(value => ({ text: value, value })), filterMethod: (value, row) => row.department === value },
  { prop: 'amount', label: '报销金额', minWidth: 140, align: 'right', sortable: true, sortMethod: (a, b) => Number(a.amount) - Number(b.amount), sortOrders: ['ascending', 'descending', null] },
]
const sortTable = ref<TableExpose>()
const sortEvent = ref('点击金额表头切换排序方向')
/** 本地分页仅传完整数据，由组件截取当前页。 */
const localPage = ref(1)
const localPageSize = ref(3)

/** 模拟接口的请求状态；真实项目可将定时器替换为接口调用。 */
const remoteQuery = ref<TableChange>({ action: 'paginate', page: 1, pageSize: 3, sort: { prop: '', order: null }, filters: {} })
const remotePage = ref(1)
const remotePageSize = ref(3)
const remoteRows = ref<TableRow[]>(rows.slice(0, 3))
const remoteTotal = ref(rows.length)
const remoteLoading = ref(false)
const remoteCount = ref(0)
/** 远程排序只发送意图，筛选与切片全部在模拟接口中完成。 */
const remoteColumns: TableColumn[] = sortableColumns.filter(column => column.type !== 'index').map(column => ({ ...column, sortable: column.prop === 'amount' ? 'custom' : false }))

/** 请求切换或组件卸载时取消旧定时器，避免过期响应覆盖最新一页。 */
watch(remoteQuery, (query, previous, onCleanup) => {
  remoteLoading.value = true
  const timer = setTimeout(() => {
    let result = rows.filter(row => Object.entries(query.filters).every(([key, values]) => {
      const value = row[key]
      return !values.length || ((typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') && values.includes(value))
    }))
    if (query.sort.order) {
      const direction = query.sort.order === 'ascending' ? 1 : -1
      result = [...result].sort((a, b) => (Number(a[query.sort.prop]) - Number(b[query.sort.prop])) * direction)
    }
    remoteTotal.value = result.length
    remoteRows.value = result.slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
    remoteCount.value++
    remoteLoading.value = false
  }, 350)
  onCleanup(() => clearTimeout(timer))
})

/** 展开行与树节点分别维护展开键，避免两个示例互相干扰。 */
const detailKeys = ref<TableKey[]>([])
const treeKeys = ref<TableKey[]>(['group'])
const expandEvent = ref('点击左侧箭头查看详情')
const expandColumns: TableColumn[] = [{ type: 'expand', width: 48 }, ...columns]
/** 父表与子表分别设置边框，开关之间没有依赖。 */
const parentBorder = ref(false)
const childBorder = ref(false)
/** 明细按父行键归属，每笔交通与住宿之和等于该行报销金额。 */
const detailRows: Record<string, TableRow[]> = Object.fromEntries(rows.slice(0, 3).map(row => {
  const travel = Math.round(Number(row.amount) * 0.6)
  return [String(row.id), [
    { id: `${row.id}-travel`, item: `${row.city}市内交通`, invoice: `FP-${row.id}-01`, amount: travel },
    { id: `${row.id}-hotel`, item: `${row.city}出差住宿`, invoice: `FP-${row.id}-02`, amount: Number(row.amount) - travel },
  ]]
}))
/** 子表使用自身列配置，不复用父表的展开列。 */
const detailColumns: TableColumn[] = [
  { prop: 'item', label: '费用明细', minWidth: 180 },
  { prop: 'invoice', label: '发票编号', minWidth: 160 },
  { prop: 'amount', label: '金额（元）', minWidth: 140, align: 'right' },
]
const treeRows: TableRow[] = [{ id: 'group', name: '华东团队', department: '跨部门', children: rows.slice(0, 2) }, { id: 'other', name: '华北团队', department: '设计', children: rows.slice(2, 4) }]

/** 同部门相邻两行合并首列；不与排序混用，以保持连续分组。 */
const mergeColumns: TableColumn[] = [columns[1]!, columns[0]!, columns[3]!]
const mergeCells: NonNullable<TableProps['spanMethod']> = ({ $index, columnIndex }) => {
  if (columnIndex !== 0) return [1, 1]
  return $index % 2 === 0 ? [2, 1] : [0, 0]
}
/** 自定义合计只对金额求和，避免将编号误计为业务金额。 */
const summarize: NonNullable<TableProps['summaryMethod']> = ({ columns: summaryColumns, data }) => summaryColumns.map((column, index) => {
  if (index === 0) return '报销合计'
  return column.prop === 'amount' ? `¥${data.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2)}` : ''
})

/** 列级具名插槽、默认具名插槽及表级通用插槽可以分工。 */
const slotColumns: TableColumn[] = [
  { type: 'selection', width: 48 },
  { prop: 'name', label: '姓名', columnKey: 'person', minWidth: 120 },
  { prop: 'department', label: '部门', minWidth: 100 },
  { prop: 'amount', label: '金额', slotName: 'money', align: 'right', minWidth: 120 },
  { columnKey: 'action', label: '操作', width: 148 },
]
/** 行内删除只操作本示例的副本，其他表格数据不受影响。 */
const slotRows = ref(rows.slice(0, 3).map(row => ({ ...row })))
const slotEvent = ref('行内操作使用事件阻止冒泡，不触发行点击')
/** 删除指定记录并回显名称，不依赖当前排序位置。 */
function deleteSlotRow(row: TableRow) {
  slotRows.value = slotRows.value.filter(item => item.id !== row.id)
  slotEvent.value = `已删除：${row.name}；剩余 ${slotRows.value.length} 条记录`
}
/** 两种表头共享筛选值；清空数字输入时不过滤金额。 */
const minimumAmount = ref<number | null>(null)
const headerRows = computed(() => rows.filter(row => Number(row.amount) >= (minimumAmount.value ?? 0)))
const headerColumns = slotColumns.filter(column => column.prop).map(column => ({ ...column, minWidth: column.prop === 'amount' ? 280 : column.minWidth }))
/** 空态与加载态独立切换，重试按钮真正恢复数据。 */
const statusLoading = ref(false)
const statusEmpty = ref(true)

/** 仅标记指定记录，其余行返回空类名，保留默认样式。 */
const statusColumns: TableColumn[] = [...columns, { prop: 'status', label: '审核状态', minWidth: 120 }]
const statusRowClass: NonNullable<TableProps['rowClassName']> = ({ row }) => row.id === 102 ? 'bg-warning-2' : row.id === 103 ? 'bg-success-2' : ''
/** 长短文本并列，只有实际被截断的内容会打开提示。 */
const overflowRows: TableRow[] = rows.slice(0, 5).map((row, index) => ({
  ...row,
  note: index === 1 ? '无需补充' : '本次报销包含异地交通、连续三晚住宿及跨部门会议费用，请逐项核对所属项目编号、发票抬头、出行日期、费用归属和收款账户。原始票据及审批记录已随申请提交，若存在金额差异，请先联系申请人补齐凭证，再由财务确认入账，避免重复报销。',
  email: index === 1 ? 'chen@example.com' : 'reimbursement-review-team@example.company.com',
}))
const overflowColumns: TableColumn[] = [
  { prop: 'name', label: '姓名', width: 100 },
  { prop: 'department', label: '部门', width: 120 },
  { prop: 'email', label: '联系邮箱', width: 240 },
  { prop: 'note', label: '报销说明', width: 280 },
  { prop: 'amount', label: '金额', width: 140, align: 'right' },
  { prop: 'status', label: '状态（关闭提示）', width: 140, showOverflowTooltip: false },
]
/** 固定表头和流体高度分别使用独立状态。 */
const headerFixed = ref(true)
const fluidExpanded = ref(false)
/** 本地排序与筛选分开演示，远程表仍复用组合列。 */
const localSortColumns: TableColumn[] = sortableColumns.map(({ filters, filterMethod, ...column }) => column)
const filterColumns: TableColumn[] = sortableColumns.filter(column => column.type !== 'index').map(({ sortable, sortMethod, sortOrders, ...column }) => column)
const filterTable = ref<TableExpose>()
const filterEvent = ref('选择部门筛选条件')
/** 懒加载改用 nodes / hasMore 字段，展示自定义字段映射。 */
const lazyRows: TableRow[] = [{ id: 'lazy-team', name: '异步团队', department: '研发', hasMore: true }]
const lazyKeys = ref<TableKey[]>([])
const lazyCount = ref(0)
const lazyEvent = ref('展开异步团队后加载成员，模拟延迟 350ms')
const loadChildren: NonNullable<TableProps['load']> = async (row, treeNode, resolve) => {
  lazyEvent.value = JSON.stringify({ name: row.name, ...treeNode })
  await new Promise<void>(done => setTimeout(done, 350))
  resolve(rows.slice(0, 2).map(member => ({ ...member, id: `${String(row.id)  }-${  String(member.id)}` })))
  lazyCount.value++
}
/** 树选择与展开独立控制，不与上一个示例共用模型。 */
const treeSelection = ref<TableKey[]>([])
const selectableTreeKeys = ref<TableKey[]>(['group'])
const selectableTreeColumns: TableColumn[] = [{ type: 'selection', width: 48 }, ...columns]
/** 横向合并只覆盖首行前两列，不改变后面的金额列。 */
const mergeAcross: NonNullable<TableProps['spanMethod']> = ({ $index, columnIndex }) => {
  if ($index !== 0 || columnIndex > 1) return [1, 1]
  return columnIndex === 0 ? [1, 2] : [0, 0]
}
/** 分页偏移由表格计算，回调只格式化序号，不把展示序号用作行键。 */
const indexPage = ref(1)
const indexPageSize = ref(3)
const indexColumns: TableColumn[] = [
  { type: 'index', label: '编号', width: 100, index: index => `BX-${String(index + 1).padStart(3, '0')}` },
  ...columns,
]
/** 两种布局使用相同的列与数据，避免把内容差异误当布局差异。 */
const layouts = ['fixed', 'auto'] as const
const layoutColumns: TableColumn[] = [{ prop: 'name', label: '姓名', width: 100 }, { prop: 'email', label: '邮箱', width: 140 }]
/** 自定义提示：短文本不弹出，列回调覆盖表回调，插槽可覆盖两者。 */
const tooltipSlot = ref(false)
const tooltipArrow = ref(true)
const tooltipDisabled = ref(false)
const formatTooltip: NonNullable<TableProps['tooltipFormatter']> = ({ column, content }) => `表级格式化 · ${  column.label  }：${  content}`
const tooltipColumns: TableColumn[] = [
  { prop: 'name', label: '姓名', width: 100 },
  { prop: 'note', label: '说明（列级）', width: 180, tooltipOptions: { placement: 'bottom' }, tooltipFormatter: ({ content }) => h('strong', {}, `列级格式化 · ${  content}`) },
  { prop: 'email', label: '邮箱（表级）', width: 160 },
]
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" :code="tableCode" component-name="RebornTable" title="交互演练场" description="调节左侧参数，查看表格外观、选择、展开与分页结果。">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading><Icon name="lucide:rotate-ccw" size="12" /></template>
          重置配置
        </RebornButton>
      </template>
      <div class="flex w-full min-w-0 flex-col gap-3">
        <RebornTable
          :key="previewKey" v-bind="previewProps"
          v-model:selected-keys="selectedKeys" v-model:expanded-row-keys="expandedRowKeys"
          v-model:current-row-key="currentRowKey" v-model:current-page="currentPage" v-model:page-size="pageSize"
          @selection-change="recordEvent('selection-change', $event.map(row => row.id))"
          @row-click="recordEvent('row-click', $event.id)"
          @row-dblclick="recordEvent('row-dblclick', $event.id)"
          @cell-click="(row, column) => recordEvent('cell-click', { id: row.id, prop: column.prop })"
          @current-change="recordEvent('current-change', $event?.id)"
          @expand-change="(row, expanded) => recordEvent('expand-change', expanded.map(item => item.id))"
          @change="recordEvent('change', $event)"
        >
          <template #expand="{ row, $index }"><p class="p-4">第 {{ $index + 1 }} 行：{{ row.email }}</p></template>
        </RebornTable>
        <DemoNote tone="dimmed" class="break-all font-mono text-xs" aria-live="polite">{{ lastEvent }}</DemoNote>
        <DemoNote tone="dimmed">已选键：{{ selectedKeys }}；展开键：{{ expandedRowKeys }}；当前行：{{ currentRowKey ?? '无' }}；页码：{{ currentPage }}；每页：{{ pageSize }}。</DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础表格">
      <template #description><code>data</code> 提供只读行数据，<code>columns</code> 与声明列二选一；传入 <code>columns</code> 时以它为准。</template>
      <DemoBlock layout="stack" class="gap-4">
        <DemoNote>数据驱动列</DemoNote>
        <RebornTable :data="rows.slice(0, 3)" :columns="columns" aria-label="数据驱动报销明细" />
        <DemoNote>声明列：默认插槽可以直接使用行数据。</DemoNote>
        <RebornTable :data="rows.slice(0, 3)" aria-label="声明列报销明细">
          <RebornTableColumn type="index" label="序号" :width="64" />
          <RebornTableColumn prop="name" label="姓名" />
          <RebornTableColumn prop="department" label="部门" />
          <RebornTableColumn prop="amount" label="报销金额" align="right">
            <template #header="{ column }">{{ column.label }}（元）</template>
            <template #default="{ row }">¥{{ Number(row.amount).toFixed(2) }}</template>
          </RebornTableColumn>
        </RebornTable>
        <DemoNote>本地分页传完整数据，由组件切片；每页条数和页码可双向绑定。</DemoNote>
        <RebornTable v-model:current-page="localPage" v-model:page-size="localPageSize" :data="rows" :columns="columns" :pagination="{ pageSizes: [3, 5, 10], layout: 'total, sizes, prev, pager, next' }" aria-label="本地分页报销明细" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="带斑马纹表格">
      <template #description><code>stripe</code> 默认关闭，开启后交替行使用 <code>bg-gray-2</code>，便于沿行阅读。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="rows.slice(0, 5)" :columns="columns" stripe aria-label="斑马纹报销明细" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="带边框表格">
      <template #description><code>size</code> 只改变单行高度，<code>border</code>、<code>stripe</code> 与 <code>headerBackground</code> 分别控制边框、交替底色与表头背景。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div v-for="size in sizes" :key="size" class="w-full min-w-0">
          <DemoNote>{{ size }}：{{ { lg: 56, md: 48, sm: 36 }[size] }}px 单行高度</DemoNote>
          <RebornTable :data="rows.slice(0, 2)" :columns="columns" :size="size" border header-background :aria-label="`${size} 尺寸报销明细`" />
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">文字沿用 <code>text-base font-medium text-gray-9</code> 的 14px / 22px 与 500 字重，不额外覆盖行高；多行内容可撑高。悬停与表头背景使用灰阶 2，边框使用灰阶 3。</DemoNote>
    </DemoSection>

    <DemoSection title="带状态表格">
      <template #description><code>row-class-name</code> 为某一行添加类名，自定义每行样式；回调返回空类名时保留默认样式。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="rows.slice(0, 4)" :columns="statusColumns" :row-class-name="statusRowClass" :hover="false" aria-label="报销审核状态" />
        <DemoNote tone="dimmed">仅陈晨（待审核）使用警告色 <code>bg-warning-2</code>，周宁（已确认）使用成功色 <code>bg-success-2</code>；林晓与许青保持默认底色，不是给所有行着色。下表独立演示加载与空状态。</DemoNote>
        <div class="flex flex-wrap gap-4"><RebornCheckbox v-model="statusLoading" label="加载中" /><RebornCheckbox v-model="statusEmpty" label="无数据" /></div>
        <RebornTable :data="statusEmpty ? [] : rows.slice(0, 3)" :columns="columns" :loading="statusLoading" :height="200" aria-label="加载和空状态演示">
          <template #loading><p class="p-4 text-base font-medium text-gray-9" role="status">正在读取报销记录，请稍候…</p></template>
          <template #empty><div class="flex flex-col items-center gap-3 p-6"><p>当前没有报销记录</p><RebornButton size="sm" variant="outlined" :disabled="statusLoading" @click="statusEmpty = false">载入示例数据</RebornButton></div></template>
        </RebornTable>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="显示溢出工具提示的表格">
      <template #description>表级 <code>showOverflowTooltip</code> 为普通列开启省略与提示；列级 <code>false</code> 可关闭，仅真实溢出时显示 <code>RebornTooltip</code>。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="overflowRows" :columns="overflowColumns" show-overflow-tooltip aria-label="溢出提示报销明细" />
        <DemoNote tone="dimmed">悬停或用 Tab 聚焦被截断的说明可查看完整文本；“无需补充”不溢出，不弹出提示，也不使用原生 title。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="固定表头">
      <template #description><code>height</code> 约束滚动区高度，<code>fixedHeader</code> 默认开启，设为 <code>false</code> 后表头随内容滚动。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornCheckbox v-model="headerFixed" label="固定表头" />
        <RebornTable :data="rows" :columns="columns" :height="220" :fixed-header="headerFixed" header-background aria-label="固定表头报销明细" />
        <DemoNote tone="dimmed">固定表头时纵向滚动轨道从表头底部开始，只占表体；关闭固定表头或隐藏表头后，轨道恢复覆盖整个滚动区高度。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="固定列">
      <template #description>列的 <code>fixed</code> 指定左右固定位置，并配合 <code>width</code> 确定偏移；不设置高度也可单独固定列。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="fixedRows.slice(0, 3)" :columns="fixedColumns" border aria-label="仅固定列的报销明细" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="固定列和表头">
      <template #description><code>height</code> 与列 <code>fixed</code> 可以组合；通过 <code>scrollTo</code> 同时恢复两个方向的滚动位置。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornButton size="sm" variant="outlined" @click="fixedTable?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })">回到左上角</RebornButton>
        <RebornTable ref="fixedTable" :data="fixedRows" :columns="fixedColumns" :height="240" border header-background aria-label="固定表头和列的报销明细" />
        <DemoNote tone="dimmed">十列分别展示人员、项目与费用字段；左右两列固定。按钮用 <code>scrollTo({ top: 0, left: 0, behavior: 'smooth' })</code> 联合平滑滚动；默认 <code>auto</code> 以及原有 <code>setScrollTop</code> / <code>setScrollLeft</code> 都立即定位。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="流体高度">
      <template #description><code>maxHeight</code> 只限制上限，数据少时自然收缩，超出后滚动并固定表头。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornCheckbox v-model="fluidExpanded" label="显示全部八条记录" />
        <RebornTable :data="fluidExpanded ? rows : rows.slice(0, 2)" :columns="columns" :max-height="220" aria-label="流体高度报销明细" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多级表头">
      <template #description>列的 <code>children</code> 生成多级表头，声明式写法则把子列放进父列的 <code>default</code> 插槽。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="rows.slice(0, 3)" :columns="groupedColumns" border header-background aria-label="数据分组表头" />
        <RebornTable :data="rows.slice(0, 2)" border aria-label="声明式分组表头">
          <RebornTableColumn prop="name" label="姓名" />
          <RebornTableColumn label="组织信息" header-align="center">
            <RebornTableColumn prop="department" label="部门" />
            <RebornTableColumn prop="city" label="城市" />
          </RebornTableColumn>
          <RebornTableColumn prop="amount" label="报销金额" align="right" />
        </RebornTable>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="单选">
      <template #description>用一个当前行键双向关联 <code>selectedKeys</code> 与 <code>currentRowKey</code>，让单选按钮、行点击及键盘选择同步高亮。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <RebornSwitch v-model="showRadio" active-label="显示单选列" aria-label="显示单选列" />
          <RebornButton size="sm" variant="outlined" @click="radioCurrentKey = 101">选中林晓</RebornButton>
          <RebornButton size="sm" variant="outlined" @click="radioCurrentKey = undefined">清空单选</RebornButton>
        </div>
        <RebornTable v-model:selected-keys="radioKeys" v-model:current-row-key="radioCurrentKey" :data="rows.slice(0, 3)" :columns="radioColumns" highlight-current-row aria-label="单选与当前报销行" />
        <DemoNote tone="dimmed" aria-live="polite">单选键：{{ radioKeys }}；当前行键：{{ radioCurrentKey ?? '无' }}。本示例用双向计算属性关联组件原本独立的两个模型，不改变其他示例；隐藏单选列后仍可点击行或外部设置、清空。当前行使用 <code>bg-brand-2</code>，悬停时保留高亮。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多选">
      <template #description><code>selection</code> 列绑定 <code>selectedKeys</code>，<code>selectable</code> 禁选待审核行，<code>reserveSelection</code> 保留跨批次选择。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap gap-2">
          <RebornButton size="sm" variant="outlined" @click="selectionBatch = selectionBatch === 0 ? 1 : 0">切换到第 {{ selectionBatch === 0 ? 2 : 1 }} 批数据</RebornButton>
          <RebornButton size="sm" variant="outlined" @click="selectionTable?.toggleAllSelection()">切换本批全选</RebornButton>
          <RebornButton size="sm" variant="outlined" @click="selectionTable?.clearSelection()">清空全部选择</RebornButton>
          <RebornButton size="sm" variant="outlined" @click="inspectSelection">读取已选行</RebornButton>
        </div>
        <RebornTable
          ref="selectionTable" v-model:selected-keys="batchKeys" :data="selectionData" :columns="selectionColumns" row-key="id" aria-label="跨批次多选报销明细"
          @selection-change="selectionEvent = `selection-change：${$event.map(row => row.name).join('、') || '无'}`"
        />
        <DemoNote tone="dimmed" aria-live="polite">第 {{ selectionBatch + 1 }} 批，共 {{ selectionData.length }} 条；两批各八条独立数据。已选键：{{ batchKeys }}。{{ selectionEvent }}。待审核行不可选。</DemoNote>
        <DemoNote tone="dimmed">全选框与行复选框水平、垂直居中，左右内边距 8px；勾选和普通悬停使用 <code>bg-gray-2</code>，不替代当前行品牌色高亮。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="排序">
      <template #description><code>sortable</code> 开启本地排序，<code>sortMethod</code> 指定比较规则；<code>remote</code> 将排序、筛选与分页统一交给接口。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap gap-2">
          <RebornButton size="sm" variant="outlined" @click="sortTable?.sort('amount', 'descending')">金额降序</RebornButton>
          <RebornButton size="sm" variant="outlined" @click="sortTable?.clearSort()">清除排序</RebornButton>
        </div>
        <RebornTable ref="sortTable" :data="rows" :columns="localSortColumns" :default-sort="{ prop: 'amount', order: 'ascending' }" aria-label="可排序的报销明细" @change="sortEvent = JSON.stringify($event)" />
        <DemoNote tone="dimmed" class="break-all font-mono text-xs" aria-live="polite">{{ sortEvent }}</DemoNote>
        <DemoNote>远程分页：模拟接口延迟 350ms，支持部门筛选与金额排序，不发送网络请求。</DemoNote>
        <RebornTable
          v-model:current-page="remotePage" v-model:page-size="remotePageSize" :data="remoteRows" :columns="remoteColumns" remote :loading="remoteLoading"
          :pagination="{ total: remoteTotal, pageSizes: [3, 5, 10], layout: 'total, sizes, prev, pager, next' }" aria-label="远程分页报销明细" @change="remoteQuery = $event"
        />
        <DemoNote tone="dimmed" class="break-all font-mono text-xs" aria-live="polite">已完成请求：{{ remoteCount }}；返回 {{ remoteRows.length }} 行，共 {{ remoteTotal }} 行；参数：{{ JSON.stringify(remoteQuery) }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="筛选">
      <template #description><code>filters</code> 提供候选项，<code>filterMethod</code> 定义本地规则；同列条件取或，不同列取且。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornButton size="sm" variant="outlined" @click="filterTable?.clearFilter()">清除筛选</RebornButton>
        <RebornTable ref="filterTable" :data="rows" :columns="filterColumns" aria-label="按部门筛选报销明细" @filter-change="filterEvent = JSON.stringify($event)" />
        <DemoNote tone="dimmed" class="break-all font-mono text-xs" aria-live="polite">{{ filterEvent }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义列模板">
      <template #description><code>slotName</code>、<code>cell-列标识</code> 与通用 <code>cell</code> 插槽接收行作用域；行内按钮用 <code>@click.stop</code> 避免触发行点击。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="slotRows" :columns="slotColumns" aria-label="自定义报销单元格" @row-click="slotEvent = `点击整行：${$event.name}`">
          <template #cell-person="{ row }"><span>{{ row.name }} / {{ row.id }}</span></template>
          <template #cell="{ row, column }"><span>{{ column.prop ? row[column.prop] : '' }}</span></template>
          <template #money="{ row }"><RebornText :value="Number(row.amount)" type="amount" currency="¥" :color="Number(row.amount) > 1000 ? 'error' : 'primary'" class="text-base" /></template>
          <template #cell-action="{ row }">
            <div class="flex items-center gap-3">
              <RebornButton size="sm" variant="text" @click.stop="slotEvent = `查看详情：${row.name}，${row.email}`">查看</RebornButton>
              <RebornButton size="sm" variant="text" color="error" @click.stop="deleteSlotRow(row)">删除</RebornButton>
            </div>
          </template>
          <template #append><p class="p-3 text-sm text-gray-9">以上为本次提交的报销记录。</p></template>
          <template #footer="{ data, selection }"><p class="p-3 text-sm text-gray-9">传入 {{ data.length }} 条记录，已选择 {{ selection.length }} 条。</p></template>
        </RebornTable>
        <DemoNote tone="dimmed" aria-live="polite">{{ slotEvent }}</DemoNote>
        <DemoNote tone="dimmed"><code>RebornText</code> 当前通过 <code>value</code> 展示数值，没有 <code>defineModel</code>；使用真实的 <code>type="amount"</code> 格式化，超过 1000 元为错误色，其余为主色。删除仅影响本节副本。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义表头">
      <template #description>通用 <code>header</code>、单列 <code>header-列标识</code> 和声明列的 <code>header</code> 插槽均接收 <code>column</code> 与 <code>$index</code>。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="headerRows" :columns="headerColumns" aria-label="自定义数据列表头">
          <template #header="{ column }"><span>{{ column.label }}</span></template>
          <template #header-person="{ column, $index }"><span>{{ column.label }} / 第 {{ $index + 1 }} 列</span></template>
          <template #header-amount="{ column }">
            <div class="flex flex-wrap items-center justify-end gap-2">
              <span>{{ column.label }} ≥</span>
              <RebornInputNumber v-model="minimumAmount" :min="0" :step="100" size="sm" placeholder="不限" aria-label="数据列表头最小金额" class="w-36" />
            </div>
          </template>
          <template #money="{ row }">¥{{ Number(row.amount).toFixed(2) }}</template>
        </RebornTable>
        <RebornTable :data="headerRows" aria-label="自定义声明列表头">
          <RebornTableColumn prop="name" label="姓名" />
          <RebornTableColumn prop="amount" label="金额" align="right" :min-width="280">
            <template #header="{ column }">
              <div class="flex flex-wrap items-center justify-end gap-2">
                <span>{{ column.label }} ≥</span>
                <RebornInputNumber v-model="minimumAmount" :min="0" :step="100" size="sm" placeholder="不限" aria-label="声明列表头最小金额" class="w-36" />
              </div>
            </template>
          </RebornTableColumn>
        </RebornTable>
        <DemoNote tone="dimmed" aria-live="polite">最小金额：{{ minimumAmount ?? '不限' }} 元；匹配 {{ headerRows.length }} / {{ rows.length }} 条。两种写法共享条件，输入后按回车或失焦生效，清空恢复全部记录。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="展开行">
      <template #description><code>expand</code> 列配合表格 <code>expand</code> 插槽展示整行详情，<code>expandedRowKeys</code> 控制展开。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <RebornSwitch v-model="parentBorder" active-label="父表边框" aria-label="父表边框" />
          <RebornSwitch v-model="childBorder" active-label="子表边框" aria-label="子表边框" />
        </div>
        <RebornTable v-model:expanded-row-keys="detailKeys" :data="rows.slice(0, 3)" :columns="expandColumns" :border="parentBorder" aria-label="带详情的报销明细" @expand-change="(row, expanded) => expandEvent = `${row.name} 展开变化；当前 ${expanded.length} 行展开`">
          <template #expand="{ row, $index }">
            <div class="flex min-w-0 flex-col gap-3 p-4">
              <div class="flex flex-wrap gap-6"><span>第 {{ $index + 1 }} 行</span><span>邮箱：{{ row.email }}</span><span>状态：{{ row.status }}</span></div>
              <RebornTable :data="detailRows[String(row.id)]" :columns="detailColumns" :border="childBorder" :aria-label="`${row.name}的报销明细`" />
            </div>
          </template>
        </RebornTable>
        <DemoNote tone="dimmed" aria-live="polite">{{ expandEvent }}；展开键：{{ detailKeys }}。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="树形数据与懒加载">
      <template #description><code>treeProps</code> 映射子节点与待加载标记；<code>lazy</code> 配合 <code>load(row, treeNode, resolve)</code> 按需获取子行。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex gap-2">
          <RebornButton size="sm" variant="outlined" @click="treeKeys = ['group', 'other']">展开团队</RebornButton>
          <RebornButton size="sm" variant="outlined" @click="treeKeys = []">折叠团队</RebornButton>
        </div>
        <RebornTable v-model:expanded-row-keys="treeKeys" :data="treeRows" :columns="columns" :tree-props="{ children: 'children' }" :indent="16" row-key="id" aria-label="团队树形报销明细" />
        <DemoNote>下表使用 nodes / hasMore 字段映射；首次展开才加载，不发出网络请求。</DemoNote>
        <RebornTable v-model:expanded-row-keys="lazyKeys" :data="lazyRows" :columns="columns" row-key="id" lazy :load="loadChildren" :tree-props="{ children: 'nodes', hasChildren: 'hasMore' }" aria-label="懒加载团队成员" />
        <DemoNote tone="dimmed" class="break-all" aria-live="polite">已加载 {{ lazyCount }} 次；回调参数：{{ lazyEvent }}。</DemoNote>
        <DemoNote tone="dimmed">树表按根节点分页，所有层级的行键必须唯一；<code>load</code> 完成后调用 <code>resolve(children)</code>，空结果调用 <code>resolve([])</code>。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="可选择的树形数据">
      <template #description>树数据与 <code>selection</code> 列组合时各行独立选择，不做父子级联；表头全选只处理当前展开可见且允许选择的行。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex gap-2">
          <RebornButton size="sm" variant="outlined" @click="selectableTreeKeys = ['group', 'other']">展开全部团队</RebornButton>
          <RebornButton size="sm" variant="outlined" @click="selectableTreeKeys = []">折叠全部团队</RebornButton>
        </div>
        <RebornTable v-model:selected-keys="treeSelection" v-model:expanded-row-keys="selectableTreeKeys" :data="treeRows" :columns="selectableTreeColumns" row-key="id" aria-label="独立选择的团队树表" />
        <DemoNote tone="dimmed" aria-live="polite">已选键：{{ treeSelection }}。折叠节点不会自动取消已选子行；全选不会选中尚未展开的子行。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="表尾合计行">
      <template #description><code>showSummary</code> 开启默认合计，<code>summaryMethod</code> 返回与叶子列对应的内容，避免把数字编号当金额相加。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="rows.slice(0, 4)" :columns="columns" show-summary sum-text="金额合计" aria-label="默认金额合计" />
        <RebornTable :data="rows" :columns="columns" show-summary :summary-method="summarize" aria-label="自定义金额合计" />
        <DemoNote tone="dimmed">本地合计接收筛选、排序后的全部根节点，远程模式只接收传入的数据；跨页总计需由接口提供。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="合并行或列">
      <template #description><code>spanMethod</code> 返回 <code>[rowspan, colspan]</code> 或同名对象，被覆盖的单元格返回 <code>[0, 0]</code>。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable :data="rows" :columns="mergeColumns" :span-method="mergeCells" :summary-method="summarize" show-summary border aria-label="部门合并与金额合计" />
        <DemoNote tone="dimmed">悬停部门合并格高亮覆盖的所有行；悬停姓名或金额仅高亮该行及相交部门格，不扩散到其他组或合计行。</DemoNote>
        <RebornTable :data="rows.slice(0, 3)" :columns="mergeColumns" :span-method="mergeAcross" border aria-label="首行横向合并" />
        <DemoNote tone="dimmed">上表部门每两行合并，下表首行前两列合并；不同时排序，以免打散连续分组。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义索引">
      <template #description><code>index</code> 可指定数字起点或回调；开启 <code>pagination</code> 后自动计入页偏移，回调只格式化 <code>index + 1</code>，行键仍使用 <code>id</code>。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTable v-model:current-page="indexPage" v-model:page-size="indexPageSize" :data="rows" :columns="indexColumns" :pagination="{ pageSizes: [3, 5, 10] }" row-key="id" aria-label="跨页自定义编号" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="表格布局">
      <template #description><code>tableLayout</code> 默认 <code>fixed</code>，按列宽分配；<code>auto</code> 由浏览器结合内容调整列宽，不表示虚拟滚动。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div v-for="layout in layouts" :key="layout" class="w-full max-w-xl">
          <DemoNote>{{ layout === 'fixed' ? '固定布局：按配置列宽分配' : '自动布局：内容参与列宽分配' }}</DemoNote>
          <RebornTable :data="overflowRows" :columns="layoutColumns" :table-layout="layout" show-overflow-tooltip :aria-label="layout === 'fixed' ? '固定布局示例' : '自动布局示例'" />
        </div>
        <DemoNote tone="dimmed"><code>auto</code> 不保证省略号：长内容可能撑宽列，使单元格本身不溢出；要稳定截断，请使用 <code>fixed</code> 并约束列宽。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="Tooltip 自定义">
      <template #description><code>tooltipOptions</code> 配置提示外观与延迟，<code>tooltipFormatter</code> 自定义内容；优先级为 <code>tooltip</code> 插槽、列回调、表回调、实际显示文本。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap gap-4">
          <RebornCheckbox v-model="tooltipSlot" label="使用最高优先级的提示插槽" />
          <RebornCheckbox v-model="tooltipArrow" label="显示箭头" />
          <RebornCheckbox v-model="tooltipDisabled" label="禁用提示" />
        </div>
        <div class="w-full max-w-xl">
          <RebornTable :data="overflowRows" :columns="tooltipColumns" :show-overflow-tooltip="{ openDelay: 160 }" :tooltip-formatter="formatTooltip" :tooltip-options="{ placement: 'top', closeDelay: 100, arrow: tooltipArrow, disabled: tooltipDisabled, ui: { content: 'max-w-80' } }" aria-label="自定义溢出提示">
            <template v-if="tooltipSlot" #tooltip="{ row, column, cellValue, content }">
              <div class="flex flex-col gap-1">
                <strong>{{ row.name }} · {{ column.label }}</strong>
                <span>显示文本：{{ content }}</span>
                <span>原始值：{{ cellValue }}</span>
              </div>
            </template>
          </RebornTable>
        </div>
        <DemoNote tone="dimmed">说明列使用列级格式化并从下方提示；邮箱使用表级格式化和上方提示。启用插槽后两列都采用插槽内容，未溢出的短文本仍不弹出。</DemoNote>
        <DemoNote tone="dimmed">选项按同名字段从低到高覆盖：表级 <code>tooltipOptions</code> → 表级 <code>showOverflowTooltip</code> 对象 → 列级 <code>tooltipOptions</code> → 列级 <code>showOverflowTooltip</code> 对象。</DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
