<script setup lang="ts">
/**
 * RebornCascader 级联选择器
 * 用于多层级的数据选择，如省市区、分类层级等。
 */
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-cascader.config'
import type { CascaderUI, CascaderColor, CascaderSize, CascaderOption, CascaderProps, CascaderValue } from './reborn-cascader.config'
import RebornSelectTrigger from '../reborn-select-trigger/RebornSelectTrigger.vue'
import RebornText from '../reborn-text/RebornText.vue'
import RebornPopup from '../reborn-popup/RebornPopup.vue'
import RebornBadge from '../reborn-badge/RebornBadge.vue'
import RebornButton from '../reborn-button/RebornButton.vue'
import RebornLoading from '../reborn-loading/RebornLoading.vue'

defineOptions({
    name: 'RebornCascader',
})



const props = withDefaults(defineProps<CascaderProps>(), {
    options: () => [],
    title: '请选择',
    placeholder: '请选择',
    showTrigger: true,
    disabled: false,
    textSeparator: ' / ',
    height: 600,
    size: 'md',
    color: 'primary',
    customClass: '',
    customStyle: '',
    ui: () => ({}),
    lazy: false,
    leafLevel: 0,
    multiple: false,
    checkStrictly: false,
    ellipsis: true,
    lines: 1,
})

const emit = defineEmits<{
    (e: 'change', value: (string | number)[] | (string | number)[][]): void
}>()
const model = defineModel<CascaderValue>({ default: undefined })

// 字段别名：未在 fieldNames 中配置的字段沿用默认名
const labelField = computed(() => props.fieldNames?.label ?? 'label')
const valueField = computed(() => props.fieldNames?.value ?? 'value')
const childrenField = computed(() => props.fieldNames?.children ?? 'children')

// 样式系统
const b = tv(theme)

const styles = computed(() => b({ color: props.color, size: props.size }))

const ui = computed(() => {
    const s = styles.value
    const u = props.ui || {}
    return {
        root: (opts?: { class?: any }) => s.root({ class: cn(opts?.class, props.customClass, u.root) }),
        popup: (opts?: { class?: any }) => s.popup({ class: cn(opts?.class, u.popup) }),
        tabsScroll: (opts?: { class?: any }) => s.tabsScroll({ class: cn(opts?.class, u.tabsScroll) }),
        tabs: (opts?: { class?: any }) => s.tabs({ class: cn(opts?.class, u.tabs) }),
        tab: (opts?: { class?: any }) => s.tab({ class: cn(opts?.class, u.tab) }),
        list: (opts?: { class?: any }) => s.list({ class: cn(opts?.class, u.list) }),
        item: s.item({ class: cn(u.item) }),
        itemActive: s.itemActive({ class: cn(u.itemActive) }),
        itemText: s.itemText({ class: cn(u.itemText) }),
        itemTextActive: s.itemTextActive({ class: cn(u.itemTextActive) }),
        footer: (opts?: { class?: any }) => s.footer({ class: cn(opts?.class, u.footer) }),
        footerText: (opts?: { class?: any }) => s.footerText({ class: cn(opts?.class, u.footerText) }),
        loading: (opts?: { class?: any }) => s.loading({ class: cn(opts?.class, u.loading) }),
        loadingText: (opts?: { class?: any }) => s.loadingText({ class: cn(opts?.class, u.loadingText) }),
        listScroll: (opts?: { class?: any }) => s.listScroll({ class: cn(opts?.class, u.listScroll) }),
        listInner: (opts?: { class?: any }) => s.listInner({ class: cn(opts?.class, u.listInner) }),
        column: (opts?: { class?: any }) => s.column({ class: cn(opts?.class, u.column) }),
        columnScroll: (opts?: { class?: any }) => s.columnScroll({ class: cn(opts?.class, u.columnScroll) }),
        itemInner: s.itemInner({ class: cn(u.itemInner) }),
        checkbox: s.checkbox({ class: cn(u.checkbox) }),
        nodeLoading: s.nodeLoading({ class: cn(u.nodeLoading) }),
        nodeArrow: s.nodeArrow({ class: cn(u.nodeArrow) }),
        footerActions: (opts?: { class?: any }) => s.footerActions({ class: cn(opts?.class, u.footerActions) }),
    }
})

// 状态
const visible = shallowRef(false)
const isRootLoading = shallowRef(false)
const current = shallowRef(0) // 当前操作的层级索引
const activePath = shallowRef<(string | number)[]>([]) // 当前显示的路径
const selectedPaths = ref<(string | number)[][]>([]) // 多选选中的路径集合
const tabScrollIntoViewId = shallowRef('') // 顶部标签滚动 ID
const listScrollIntoViewId = shallowRef('') // 列表区域滚动 ID
const loadingNodes = ref<Record<string, boolean>>({}) // 记录加载状态
const internalOptions = shallowRef<CascaderOption[]>([])
let optionsToken = 0
let rootLoadToken = 0
let disposed = false
let alignToken = 0
let scrollAlignTimers: ReturnType<typeof setTimeout>[] = []

// 只在父级替换数据时复制结构，保留函数与非JSON字段；懒加载通过替换根数组通知。
function cloneOptions(options: CascaderOption[]): CascaderOption[] {
  return options.map(node => ({ ...node, ...(Array.isArray(node[childrenField.value]) ? { [childrenField.value]: cloneOptions(node[childrenField.value]) } : {}) }))
}
watch(() => props.options, val => {
  optionsToken++
  isRootLoading.value = false
  loadingNodes.value = {}
  internalOptions.value = cloneOptions(val || [])
}, { immediate: true })

/** 根据 v-model（已保存的值）重置面板内的浏览与多选勾选，丢弃上次打开未确认的修改 */
function syncInternalFromModel() {
    const val = model.value
    if (props.multiple) {
        selectedPaths.value = ((val ?? []) as (string | number)[][]).map(path => [...path])
        activePath.value = selectedPaths.value[0] ? [...selectedPaths.value[0]] : []
    } else {
        activePath.value = [...((val as (string | number)[]) ?? [])]
    }
}

// 监听外界 modelValue 变化
watch(() => model.value, () => {
    syncInternalFromModel()
}, { immediate: true, deep: true })

// 计算属性：各级选项列表
const lists = computed<CascaderOption[][]>(() => {
    let data = internalOptions.value
    const result: CascaderOption[][] = [data]

    for (let i = 0; i < activePath.value.length; i++) {
        // 如果达到限定层级，不再增加下一级列表
        if (props.leafLevel > 0 && i + 1 >= props.leafLevel) break

        const val = activePath.value[i]
        const found = data.find(item => item[valueField.value] === val)
        const children = found?.[childrenField.value]
        if (found && children && children.length > 0) {
            data = children
            result.push(data)
        } else {
            break
        }
    }
    return result
})

/**
 * 1～3 列：按列数均分整屏；第 4 列起单列宽度仍为一屏的 1/3，总宽超过一屏则横向滚动。
 */
const columnWidthClass = computed(() => {
    const len = lists.value.filter(l => l && l.length > 0).length
    if (len <= 1) return 'w-full min-w-0 box-border'
    if (len === 2) return 'shrink-0 basis-1/2 w-1/2 min-w-0 box-border'
    return 'shrink-0 basis-1/3 w-1/3 min-w-0 box-border'
})

function clearScrollAlignTimers() {
    alignToken++
    scrollAlignTimers.forEach(timer => clearTimeout(timer))
    scrollAlignTimers = []
}

function alignCurrentColumn(val = current.value, force = false) {
    clearScrollAlignTimers()
    const align = () => {
        // 设置 ID 时让标签滚动到前一个索引节点，形成“居中”显示效果（让当前/新节点在中间）
        const tabIndex = Math.max(0, val - 1)
        tabScrollIntoViewId.value = `tab-${tabIndex}`

        // 列表区域滚到当前列本身；4 列时 column-2 已在可视区内，H5/App 不会继续右移。
        const columnIndex = Math.min(val, lists.value.length - 1)
        listScrollIntoViewId.value = lists.value.length > 3 ? `column-${columnIndex}` : ''
    }

    if (force) {
        // 只清空目标 ID，不重置横向位置，避免已在最右侧时先向左滑动。
        tabScrollIntoViewId.value = ''
        listScrollIntoViewId.value = ''
    }

    const token = alignToken
    nextTick(() => {
        if (disposed || token !== alignToken || !visible.value) return
        const delays = force ? [60, 180, 360] : [40]
        delays.forEach((delay) => {
            const timer = setTimeout(() => {
                if (!disposed && token === alignToken && visible.value) align()
                scrollAlignTimers = scrollAlignTimers.filter(item => item !== timer)
            }, delay)
            scrollAlignTimers.push(timer)
        })
    })
}

// 监听当前层级变化进行辅助对齐（居中显示）
watch(current, (val) => {
    alignCurrentColumn(val)
})

watch(visible, (val) => {
    if (!val) {
        clearScrollAlignTimers()
    }
})

onBeforeUnmount(() => { disposed = true; optionsToken++; clearScrollAlignTimers() })

const onPopupOpened = () => {
    alignCurrentColumn(current.value, true)
}

// 计算属性：当前页面的标签
const labels = computed(() => {
    const result: string[] = []
    for (let i = 0; i < activePath.value.length; i++) {
        const val = activePath.value[i]
        const found = lists.value[i]?.find(item => item[valueField.value] === val)
        if (found) {
            result.push(found[labelField.value])
        } else {
            break
        }
    }

    // 如果最后一级选完后还有下一级，或者刚开始没选，增加一个“请选择”标签
    const lastIndex = result.length - 1
    const lastVal = activePath.value[lastIndex]
    const lastListData = lists.value[lastIndex]
    const lastFound = lastListData?.find(item => item[valueField.value] === lastVal)
    const children = lastFound?.[childrenField.value]

    // 层级限制判断
    const reachedLeafLevel = props.leafLevel > 0 && result.length >= props.leafLevel

    if (!reachedLeafLevel && (!lastVal || (lastFound && ((children && children.length > 0) || props.lazy)))) {
        if (result.length < lists.value.length || !lastVal) {
            result.push('请选择')
        }
    }
    return result
})

// 触发器显示的文本
const triggerText = computed(() => {
    if (props.multiple) {
        if (selectedPaths.value.length === 0) return ''
        return `已选 ${selectedPaths.value.length} 项`
    }

    const texts: string[] = []
    let data = internalOptions.value

    for (const val of ((model.value ?? []) as (string | number)[])) {
        const found = data.find(item => item[valueField.value] === val)
        if (found) {
            texts.push(found[labelField.value])
            const children = found[childrenField.value]
            if (children) {
                data = children
            } else {
                break
            }
        }
    }
    return texts.join(props.textSeparator)
})

// 方法
const open = async () => {
    if (props.disabled) return
    const token = optionsToken
    visible.value = true
    // 每次打开都恢复到当前已提交的 modelValue（关闭前未确认的浏览/勾选不保留）
    syncInternalFromModel()

    // 懒加载初始化
    if (props.lazy && internalOptions.value.length === 0) {
        const request = ++rootLoadToken
        isRootLoading.value = true
        try {
            const children = await new Promise<CascaderOption[]>((resolve, reject) => {
                const rootNode = {
                    [labelField.value]: 'root',
                    [valueField.value]: 'root',
                    isRoot: true
                } as unknown as CascaderOption
                props.lazyLoad?.(rootNode, resolve, reject)
            })
            if (disposed || token !== optionsToken || request !== rootLoadToken) return
            internalOptions.value = cloneOptions(children)
        } catch (e) {
            console.error('Initial lazy load failed', e)
        } finally {
            if (!disposed && token === optionsToken && request === rootLoadToken) isRootLoading.value = false
        }
    }

    if (disposed || token !== optionsToken || !visible.value) return

    // 定位到最后一级；打开动画结束后会再次强制对齐，兼容 H5/App 渲染时序。
    const nextCurrent = activePath.value.length > 0
        ? Math.min(activePath.value.length, lists.value.length - 1)
        : 0
    current.value = nextCurrent
    alignCurrentColumn(nextCurrent, true)
}

const close = () => {
    visible.value = false
    clearScrollAlignTimers()
}

const onLabelTap = (index: number) => {
    // 点击标签，回到该级并清除后续选择
    activePath.value = activePath.value.slice(0, index)
    current.value = index
}

const toggleMultiSelection = (node: CascaderOption, path: (string | number)[], isCheck: boolean) => {
    // 严格模式解除父子关联：只写节点自身的路径；关联模式则摊平成该节点名下的全部叶子路径
    const targetPaths = props.checkStrictly ? [path] : getLeafPaths(node, path.slice(0, -1))
    targetPaths.forEach(p => {
        const pStr = JSON.stringify(p)
        const index = selectedPaths.value.findIndex(sp => JSON.stringify(sp) === pStr)
        if (isCheck && index === -1) {
            selectedPaths.value.push(p)
        } else if (!isCheck && index > -1) {
            selectedPaths.value.splice(index, 1)
        }
    })
}

const getLeafPaths = (node: CascaderOption, parentPath: (string | number)[] = []): (string | number)[][] => {
    const currentPath = [...parentPath, node[valueField.value]]
    const children = node[childrenField.value]
    if (!children || children.length === 0) {
        return [currentPath]
    }
    return children.flatMap((child: CascaderOption) => getLeafPaths(child, currentPath))
}

const isLeafNode = (item: CascaderOption, listIndex: number) => {
    const childrenKey = childrenField.value
    return item.leaf === true ||
        (!props.lazy && (!item[childrenKey] || item[childrenKey].length === 0)) ||
        (props.leafLevel > 0 && listIndex + 1 >= props.leafLevel)
}

const getItemRenderKey = (item: CascaderOption, listIndex: number) => {
    const prefix = activePath.value.slice(0, listIndex).join('\u001f')
    return `${listIndex}-${String(item[valueField.value])}-${prefix}`
}

const checkboxControlClass = (checked: boolean) => cn(
    'flex items-center justify-center size-5 rounded-md border border-gray-4 bg-white text-white ring-1 ring-transparent',
    checked ? 'border-primary bg-primary' : ''
)

const onItemTap = async (item: CascaderOption, listIndex: number, fromCheckbox = false) => {
    if (props.disabled) return
    const requestToken = optionsToken
    const val = item[valueField.value]
    const childrenKey = childrenField.value
    const isLeaf = isLeafNode(item, listIndex)

    // 更新当前路径
    const newPath = activePath.value.slice(0, listIndex)
    newPath.push(val)
    activePath.value = newPath
    current.value = listIndex

    if (props.multiple && fromCheckbox) {
        // 多选模式下点击复选框：父子全选逻辑
        const currentlyChecked = isItemSelected(item, listIndex)
        toggleMultiSelection(item, newPath, !currentlyChecked)
        return
    }

    if (isLeaf) {
        if (props.multiple) {
            // 多选点击叶子：切换选中状态
            toggleMultiSelection(item, newPath, !isItemSelected(item, listIndex))
        } else {
            // 单选：直接提交
            model.value = [...activePath.value]
            emit('change', activePath.value)
            close()
        }
    } else {
        // 严格模式单选：非叶子节点点一下即选中，值落在当前路径上；弹窗不关，下一级照常展开供继续往下选
        if (props.checkStrictly && !props.multiple) {
            model.value = [...activePath.value]
            emit('change', [...activePath.value])
        }
        // 需要加载子节点或者显示下一级
        if (props.lazy && !item.leaf && (!item[childrenKey] || item[childrenKey].length === 0)) {
            const nodeId = String(val)
            loadingNodes.value[nodeId] = true
            try {
                const children = await new Promise<CascaderOption[]>((resolve, reject) => {
                    props.lazyLoad?.(item, resolve, reject)
                })
                if (disposed || requestToken !== optionsToken) return
                item[childrenKey] = cloneOptions(children)
                internalOptions.value = [...internalOptions.value]
            } catch (e) {
                console.error('Lazy load failed', e)
                return
            } finally {
                if (!disposed && requestToken === optionsToken) loadingNodes.value[nodeId] = false
            }
        }
        // 自动跳转到新的一级
        nextTick(() => {
            if (!disposed && visible.value && requestToken === optionsToken && newPath.every((value, index) => activePath.value[index] === value) && item[childrenKey]?.length) {
                current.value = listIndex + 1
            }
        })
    }
}


const onConfirm = () => {
    model.value = selectedPaths.value.map(path => [...path])
    emit('change', selectedPaths.value)
    close()
}

const clear = () => {
    activePath.value = []
    selectedPaths.value = []
    current.value = 0
    model.value = []
    emit('change', props.multiple ? [] : [])
}

const selectedKeys = computed(() => new Set(selectedPaths.value.map(path => JSON.stringify(path))))
const isItemSelected = (item: CascaderOption, listIndex: number) => {
    if (props.multiple) {
        const col = lists.value[listIndex]
        // 切换同级（如换城市）时，端上可能一帧内仍带着上一支的 item，与当前列数据引用不一致，错用新 prefix 算 getLeafPaths 会闪勾
        if (!col?.length || !col.includes(item)) {
            return false
        }
        const prefix = activePath.value.slice(0, listIndex)
        // 当前列必须与 activePath 前缀对齐，避免小程序端重绘时列与路径短暂不同步导致误判（含 getLeafPaths 异常结果）
        if (prefix.length !== listIndex) {
            return false
        }
        // 严格模式只认节点自身的路径是否在选中集合里，父子勾选互不影响，也不存在「叶子全选则父选中」的推导
        if (props.checkStrictly) {
            const ownStr = JSON.stringify([...prefix, item[valueField.value]])
            return selectedKeys.value.has(ownStr)
        }
        const leaves = getLeafPaths(item, prefix)
        // [].every(...) 恒为 true，会导致未选却短暂显示为勾选
        if (leaves.length === 0) {
            return false
        }
        return leaves.every(p => {
            const pStr = JSON.stringify(p)
            return selectedKeys.value.has(pStr)
        })
    }
    return activePath.value[listIndex] === item[valueField.value]
}

const selectedState = computed(() => lists.value.map((column, index) => column.map(item => isItemSelected(item, index))))
const checkboxClasses = [checkboxControlClass(false), checkboxControlClass(true)]

defineExpose({
    /** 打开底部弹出层（禁用状态下无效）；懒加载模式下首次打开会请求根级选项 */
    open,
    /** 关闭底部弹出层；关闭前未确认的浏览/勾选不会提交 */
    close,
    /** 清空选中值与展开路径，并触发 update:modelValue 与 change 事件（空数组） */
    clear,
})
</script>

<template>
    <view :class="ui.root()" :style="customStyle">
        <RebornSelectTrigger v-if="showTrigger" :text="triggerText" :placeholder="placeholder" :disabled="disabled"
            :focus="visible" :color="color" :size="size" @open="open" @clear="clear" />

        <RebornPopup v-model="visible" :lazy-render="false" :title="title" position="bottom" round @close="close"
            @opened="onPopupOpened" :color="color" rootPortal>
            <view :class="ui.popup()">
                <!-- 顶部标签页 -->
                <scroll-view v-if="!multiple" scroll-x :class="ui.tabsScroll()" :scroll-into-view="tabScrollIntoViewId"
                    scroll-with-animation>
                    <view :class="ui.tabs()">
                        <view v-for="(label, index) in labels" :key="index" :id="'tab-' + index" :class="ui.tab()"
                            @tap="onLabelTap(index)">
                            <slot name="tabs" :label="label" :index="index" :current="current">
                                <RebornBadge variant="subtle" :color="index === current ? color : 'neutral'"
                                    :size="size">
                                    <template #default>
                                        {{ label }}
                                    </template>
                                </RebornBadge>
                            </slot>
                        </view>
                    </view>
                </scroll-view>

                <!-- 列表内容 -->
                <view :class="ui.list()" :style="{ height: typeof height === 'number' ? height + 'rpx' : height }">
                    <view v-if="isRootLoading" :class="ui.loading()">
                        <RebornLoading type="spinner" :color="color" size="64rpx" />
                        <text :class="ui.loadingText()">正在加载数据...</text>
                    </view>
                    <scroll-view v-else scroll-x :class="ui.listScroll()" :scroll-into-view="listScrollIntoViewId"
                        scroll-with-animation>
                        <view :class="ui.listInner()">
                            <view v-for="(listData, listIndex) in lists"
                                :key="`col-${listIndex}-${activePath.slice(0, listIndex).join('\u001f')}`"
                                :id="`column-${listIndex}`" :class="ui.column({ class: columnWidthClass })">
                                <scroll-view scroll-y :class="ui.columnScroll()">
                                    <view v-for="(item, itemIndex) in listData" :key="getItemRenderKey(item, listIndex)"
                                        :class="[
                                            ui.item,
                                            activePath[listIndex] === item[valueField] ? ui.itemActive : ''
                                        ]" @tap="onItemTap(item, listIndex)">
                                        <view :class="ui.itemInner">
                                            <view v-if="props.multiple" :class="ui.checkbox"
                                                @tap.stop="onItemTap(item, listIndex, true)">
                                                <view :class="checkboxClasses[selectedState[listIndex]?.[itemIndex] ? 1 : 0]">
                                                    <view v-if="selectedState[listIndex]?.[itemIndex]"
                                                        class="i-lucide-check size-4 text-white" />
                                                </view>
                                            </view>
                                            <slot name="item" :item="item" :listIndex="listIndex"
                                                :active="activePath[listIndex] === item[valueField]">
                                                <RebornText
                                                    :custom-class="activePath[listIndex] === item[valueField] ? ui.itemTextActive : ui.itemText"
                                                    :ellipsis="ellipsis" :lines="lines">
                                                    {{ item[labelField] }}
                                                </RebornText>
                                            </slot>
                                        </view>
                                        <view v-if="loadingNodes[String(item[valueField])]" :class="ui.nodeLoading">
                                            <RebornLoading type="outline" :color="color" size="32rpx" />
                                        </view>
                                        <view v-else-if="!isLeafNode(item, listIndex)" :class="ui.nodeArrow" />
                                    </view>
                                </scroll-view>
                            </view>
                        </view>
                    </scroll-view>
                </view>

                <!-- 底部操作栏 (多选模式) -->
                <view v-if="props.multiple" :class="ui.footer()">
                    <text :class="ui.footerText()">已选 {{ selectedPaths.length }} 项</text>
                    <view :class="ui.footerActions()">
                        <RebornButton size="sm" variant="outlined" @tap="clear">清空</RebornButton>
                        <RebornButton size="sm" @tap="onConfirm">确认</RebornButton>
                    </view>
                </view>
            </view>
        </RebornPopup>
    </view>
</template>
