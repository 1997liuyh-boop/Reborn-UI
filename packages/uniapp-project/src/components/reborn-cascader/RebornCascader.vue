<script setup lang="ts">
/**
 * RebornCascader 级联选择器
 * 用于多层级的数据选择，如省市区、分类层级等。
 */
import { ref, computed, nextTick, watch } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-cascader.config'
import type { CascaderUI, CascaderColor, CascaderSize, CascaderOption, CascaderProps } from './reborn-cascader.config'
import RebornSelectTrigger from '../reborn-select-trigger/RebornSelectTrigger.vue'
import RebornText from '../reborn-text/RebornText.vue'
import RebornPopup from '../reborn-popup/RebornPopup.vue'
import RebornBadge from '../reborn-badge/RebornBadge.vue'
import RebornButton from '../reborn-button/RebornButton.vue'
import RebornCheckbox from '../reborn-checkbox/RebornCheckbox.vue'
import RebornLoading from '../reborn-loading/RebornLoading.vue'

import RebornTransition from '../reborn-transition/RebornTransition.vue'

defineOptions({
    name: 'RebornCascader',
})



const props = withDefaults(defineProps<CascaderProps>(), {
    modelValue: () => [],
    options: () => [],
    title: '请选择',
    placeholder: '请选择',
    showTrigger: true,
    disabled: false,
    labelKey: 'label',
    valueKey: 'value',
    textSeparator: ' / ',
    height: 600,
    size: 'md',
    color: 'primary',
    customClass: '',
    customStyle: '',
    ui: () => ({}),
    lazy: false,
    childrenKey: 'children',
    leafLevel: 0,
    multiple: false,
    ellipsis: true,
    lines: 1,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: (string | number)[] | (string | number)[][]): void
    (e: 'change', value: (string | number)[] | (string | number)[][]): void
}>()

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
        item: (opts?: { class?: any }) => s.item({ class: cn(opts?.class, u.item) }),
        itemActive: (opts?: { class?: any }) => s.itemActive({ class: cn(opts?.class, u.itemActive) }),
        itemText: (opts?: { class?: any }) => s.itemText({ class: cn(opts?.class, u.itemText) }),
        itemTextActive: (opts?: { class?: any }) => s.itemTextActive({ class: cn(opts?.class, u.itemTextActive) }),
        footer: (opts?: { class?: any }) => s.footer({ class: cn(opts?.class, u.footer) }),
        footerText: (opts?: { class?: any }) => s.footerText({ class: cn(opts?.class, u.footerText) }),
        loading: (opts?: { class?: any }) => s.loading({ class: cn(opts?.class, u.loading) }),
        loadingText: (opts?: { class?: any }) => s.loadingText({ class: cn(opts?.class, u.loadingText) }),
        listScroll: (opts?: { class?: any }) => s.listScroll({ class: cn(opts?.class, u.listScroll) }),
        listInner: (opts?: { class?: any }) => s.listInner({ class: cn(opts?.class, u.listInner) }),
        column: (opts?: { class?: any }) => s.column({ class: cn(opts?.class, u.column) }),
        columnScroll: (opts?: { class?: any }) => s.columnScroll({ class: cn(opts?.class, u.columnScroll) }),
        itemInner: (opts?: { class?: any }) => s.itemInner({ class: cn(opts?.class, u.itemInner) }),
        checkbox: (opts?: { class?: any }) => s.checkbox({ class: cn(opts?.class, u.checkbox) }),
        nodeLoading: (opts?: { class?: any }) => s.nodeLoading({ class: cn(opts?.class, u.nodeLoading) }),
        nodeArrow: (opts?: { class?: any }) => s.nodeArrow({ class: cn(opts?.class, u.nodeArrow) }),
        footerActions: (opts?: { class?: any }) => s.footerActions({ class: cn(opts?.class, u.footerActions) }),
    }
})

// 状态
const visible = ref(false)
const isRootLoading = ref(false)
const current = ref(0) // 当前操作的层级索引
const activePath = ref<(string | number)[]>([]) // 当前显示的路径
const selectedPaths = ref<(string | number)[][]>([]) // 多选选中的路径集合
const tabScrollIntoViewId = ref('') // 顶部标签滚动 ID
const listScrollIntoViewId = ref('') // 列表区域滚动 ID
const loadingNodes = ref<Record<string, boolean>>({}) // 记录加载状态
const internalOptions = ref<CascaderOption[]>([])

// 监听当前层级变化进行辅助对齐（居中显示）
watch(current, (val) => {
    nextTick(() => {
        setTimeout(() => {
            // 设置 ID 时让其滚动到前一个索引节点，形成“居中”显示效果（让当前/新节点在中间）
            const scrollIndex = Math.max(0, val - 1)
            tabScrollIntoViewId.value = `tab-${scrollIndex}`
            listScrollIntoViewId.value = `column-${scrollIndex}`
        }, 100)
    })
})

watch(() => props.options, (val) => {
    internalOptions.value = JSON.parse(JSON.stringify(val || []))
}, { immediate: true, deep: true })

// 监听外界 modelValue 变化
watch(() => props.modelValue, (val) => {
    if (props.multiple) {
        selectedPaths.value = JSON.parse(JSON.stringify(val || []))
        activePath.value = selectedPaths.value[0] ? [...selectedPaths.value[0]] : []
    } else {
        activePath.value = [...(val as (string | number)[] || [])]
    }
}, { immediate: true })

// 计算属性：各级选项列表
const lists = computed<CascaderOption[][]>(() => {
    let data = internalOptions.value
    const result: CascaderOption[][] = [data]

    for (let i = 0; i < activePath.value.length; i++) {
        // 如果达到限定层级，不再增加下一级列表
        if (props.leafLevel > 0 && i + 1 >= props.leafLevel) break

        const val = activePath.value[i]
        const found = data.find(item => item[props.valueKey] === val)
        const children = found?.[props.childrenKey]
        if (found && children && children.length > 0) {
            data = children
            result.push(data)
        } else {
            break
        }
    }
    return result
})

const columnWidthClass = computed(() => {
    const len = lists.value.filter(l => l && l.length > 0).length
    if (len === 1) return 'w-full'
    if (len === 2) return 'w-1/2'
    return 'w-1/3'
})

// 计算属性：当前页面的标签
const labels = computed(() => {
    const result: string[] = []
    for (let i = 0; i < activePath.value.length; i++) {
        const val = activePath.value[i]
        const found = lists.value[i]?.find(item => item[props.valueKey] === val)
        if (found) {
            result.push(found[props.labelKey])
        } else {
            break
        }
    }

    // 如果最后一级选完后还有下一级，或者刚开始没选，增加一个“请选择”标签
    const lastIndex = result.length - 1
    const lastVal = activePath.value[lastIndex]
    const lastListData = lists.value[lastIndex]
    const lastFound = lastListData?.find(item => item[props.valueKey] === lastVal)
    const children = lastFound?.[props.childrenKey]

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

    for (const val of (props.modelValue as (string | number)[])) {
        const found = data.find(item => item[props.valueKey] === val)
        if (found) {
            texts.push(found[props.labelKey])
            const children = found[props.childrenKey]
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
    visible.value = true

    // 懒加载初始化
    if (props.lazy && internalOptions.value.length === 0) {
        isRootLoading.value = true
        try {
            const children = await new Promise<CascaderOption[]>((resolve, reject) => {
                const rootNode = {
                    [props.labelKey]: 'root',
                    [props.valueKey]: 'root',
                    isRoot: true
                } as unknown as CascaderOption
                props.lazyLoad?.(rootNode, resolve, reject)
            })
            internalOptions.value = children
        } catch (e) {
            console.error('Initial lazy load failed', e)
        } finally {
            isRootLoading.value = false
        }
    }

    // 定位到最后一级
    if (activePath.value.length > 0) {
        current.value = Math.min(activePath.value.length, lists.value.length - 1)
    } else {
        current.value = 0
    }
}

const close = () => {
    visible.value = false
}

const onLabelTap = (index: number) => {
    // 点击标签，回到该级并清除后续选择
    activePath.value = activePath.value.slice(0, index)
    current.value = index
}

const toggleMultiSelection = (node: CascaderOption, path: (string | number)[], isCheck: boolean) => {
    const leafPaths = getLeafPaths(node, path.slice(0, -1))
    leafPaths.forEach(p => {
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
    const currentPath = [...parentPath, node[props.valueKey]]
    const children = node[props.childrenKey]
    if (!children || children.length === 0) {
        return [currentPath]
    }
    return children.flatMap((child: CascaderOption) => getLeafPaths(child, currentPath))
}

const isLeafNode = (item: CascaderOption, listIndex: number) => {
    const childrenKey = props.childrenKey
    return item.leaf === true ||
        (!props.lazy && (!item[childrenKey] || item[childrenKey].length === 0)) ||
        (props.leafLevel > 0 && listIndex + 1 >= props.leafLevel)
}

const onItemTap = async (item: CascaderOption, listIndex: number, fromCheckbox = false) => {
    if (props.disabled) return
    const val = item[props.valueKey]
    const childrenKey = props.childrenKey
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
            emit('update:modelValue', activePath.value)
            emit('change', activePath.value)
            close()
        }
    } else {
        // 需要加载子节点或者显示下一级
        if (props.lazy && !item.leaf && (!item[childrenKey] || item[childrenKey].length === 0)) {
            const nodeId = String(val)
            loadingNodes.value[nodeId] = true
            try {
                const children = await new Promise<CascaderOption[]>((resolve, reject) => {
                    props.lazyLoad?.(item, resolve, reject)
                })
                item[childrenKey] = children
            } catch (e) {
                console.error('Lazy load failed', e)
            } finally {
                loadingNodes.value[nodeId] = false
            }
        }
        // 自动跳转到新的一级
        nextTick(() => {
            current.value = listIndex + 1
        })
    }
}


const onConfirm = () => {
    emit('update:modelValue', selectedPaths.value)
    emit('change', selectedPaths.value)
    close()
}

const clear = () => {
    activePath.value = []
    selectedPaths.value = []
    current.value = 0
    emit('update:modelValue', props.multiple ? [] : [])
    emit('change', props.multiple ? [] : [])
}

const isItemSelected = (item: CascaderOption, listIndex: number) => {
    const path = [...activePath.value.slice(0, listIndex), item[props.valueKey]]
    if (props.multiple) {
        const leaves = getLeafPaths(item, activePath.value.slice(0, listIndex))
        return leaves.every(p => {
            const pStr = JSON.stringify(p)
            return selectedPaths.value.some(sp => JSON.stringify(sp) === pStr)
        })
    }
    return activePath.value[listIndex] === item[props.valueKey]
}

const isItemIndeterminate = (item: CascaderOption, listIndex: number) => {
    if (!props.multiple) return false
    const leaves = getLeafPaths(item, activePath.value.slice(0, listIndex))
    if (leaves.length <= 1) return false

    const selectedCount = leaves.filter(p => {
        const pStr = JSON.stringify(p)
        return selectedPaths.value.some(sp => JSON.stringify(sp) === pStr)
    }).length

    return selectedCount > 0 && selectedCount < leaves.length
}

defineExpose({ open, close, clear })
</script>

<template>
    <view :class="ui.root()" :style="customStyle">
        <RebornSelectTrigger v-if="showTrigger" :text="triggerText" :placeholder="placeholder" :disabled="disabled"
            :focus="visible" :color="color" :size="size" @open="open" @clear="clear" />

        <RebornPopup v-model="visible" :title="title" position="bottom" round @close="close" :color="color" rootPortal>
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
                            <view v-for="(listData, listIndex) in lists" :key="listIndex" :id="`column-${listIndex}`"
                                :class="ui.column({ class: columnWidthClass })">
                                <RebornTransition :show="true" name="fade-right" :duration="300" custom-class="h-full">
                                    <scroll-view scroll-y :class="ui.columnScroll()">
                                        <view v-for="(item, itemIndex) in listData"
                                            :key="`${listIndex}-${item[valueKey]}`" :class="[
                                                ui.item(),
                                                activePath[listIndex] === item[valueKey] ? ui.itemActive() : ''
                                            ]" @tap="onItemTap(item, listIndex)">
                                            <view :class="ui.itemInner()">
                                                <view v-if="props.multiple" :class="ui.checkbox()"
                                                    @tap.stop="onItemTap(item, listIndex, true)">
                                                    <RebornCheckbox :modelValue="isItemSelected(item, listIndex)"
                                                        :indeterminate="isItemIndeterminate(item, listIndex)" />
                                                </view>
                                                <slot name="item" :item="item" :listIndex="listIndex"
                                                    :active="activePath[listIndex] === item[valueKey]">
                                                    <RebornText
                                                        :custom-class="activePath[listIndex] === item[valueKey] ? ui.itemTextActive() : ui.itemText()"
                                                        :ellipsis="ellipsis" :lines="lines">
                                                        {{ item[labelKey] }}
                                                    </RebornText>
                                                </slot>
                                            </view>
                                            <view v-if="loadingNodes[String(item[valueKey])]" :class="ui.nodeLoading()">
                                                <RebornLoading type="outline" :color="color" size="32rpx" />
                                            </view>
                                            <view v-else-if="!isLeafNode(item, listIndex)" :class="ui.nodeArrow()" />
                                        </view>
                                    </scroll-view>
                                </RebornTransition>
                            </view>
                        </view>
                    </scroll-view>
                </view>

                <!-- 底部操作栏 (多选模式) -->
                <view v-if="props.multiple" :class="ui.footer()">
                    <text :class="ui.footerText()">已选 {{ selectedPaths.length }} 项</text>
                    <view :class="ui.footerActions()">
                        <RebornButton size="sm" variant="outline" @tap="clear">清空</RebornButton>
                        <RebornButton size="sm" @tap="onConfirm">确认</RebornButton>
                    </view>
                </view>
            </view>
        </RebornPopup>
    </view>
</template>
