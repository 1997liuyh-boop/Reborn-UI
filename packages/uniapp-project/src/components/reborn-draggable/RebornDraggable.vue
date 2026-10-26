<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, onUnmounted, shallowRef, watch } from "vue";
// #ifdef H5
import DraggableItemContent from "./DraggableItemContent";
// #endif
import theme from "./reborn-draggable.config";
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'


defineOptions({
    name: "reborn-draggable"
});

const props = withDefaults(defineProps<Props>(), { className: '', ui: () => ({}), disabled: false, columns: 1, longPress: true, gap: 4 })

const emit = defineEmits<{ change: [value: any[]]; start: [index: number]; end: [index: number] }>()

const slots = defineSlots<{
    item(props: {
        item: any;
        index: number;
        dragging: boolean;
        dragIndex: number;
        insertIndex: number;
    }): any;
}>();

// 项目位置信息类型定义
type ItemPosition = {
    top: number;
    left: number;
    width: number;
    height: number;
};

// H5 没有 WXS，阻滚由拖拽期间注册的原生监听处理；其他端直接使用同名 WXS 模块。
// #ifdef H5
const dragWxs = { touchmove: () => true, touchend: () => true };
// #endif

// 位移偏移量类型定义
type TranslateOffset = {
    x: number;
    y: number;
};

interface Props {
  className?: string
  ui?: { root?: string; item?: string }
  disabled?: boolean
  columns?: number
  longPress?: boolean
  gap?: number
}
const model = defineModel<any[]>({ default: () => [] })

const { proxy } = getCurrentInstance()!;

/** 数据列表 */
const list = shallowRef<any[]>([]);

/** 是否正在拖拽 */
const dragging = shallowRef(false);
/** 当前拖拽元素的原始索引 */
const dragIndex = shallowRef(-1);
/** 预期插入的目标索引 */
const insertIndex = shallowRef(-1);
// 起点经模板 data-start-x / data-start-y 交给小程序 WXS 计算跟手位移，属于渲染依赖，必须是响应式状态
/** 触摸开始时的Y坐标 */
const startY = shallowRef(0);
/** 触摸开始时的X坐标 */
const startX = shallowRef(0);
/** Y轴偏移量 */
const offsetY = shallowRef(0);
/** X轴偏移量 */
const offsetX = shallowRef(0);
// 非 H5 跟手位移由 WXS 直接更新，逻辑层只缓存坐标以计算换位。
let pointerOffsetX = 0;
let pointerOffsetY = 0;
/** 当前拖拽的数据项 */
/** 所有项目的位置信息缓存 */
let itemPositions: ItemPosition[] = [];
/** 是否处于放下动画状态 */
const dropping = shallowRef(false);
/** 动态计算的项目高度 */
const itemHeight = shallowRef(0);
/** 动态计算的项目宽度 */
const itemWidth = shallowRef(0);
/** 是否已开始排序模拟（防止误触） */
const sortingStarted = shallowRef(false);

// #ifdef H5
/**
 * H5 端专用：以 passive:false 模式注册到 document，
 * 使得拖拽期间可以调用 preventDefault() 阻止页面滚动
 */
function h5PreventScroll(e: TouchEvent) {
    if (dragging.value) {
        e.preventDefault();
    }
}

function h5PreventNativeGesture(e: any) {
    if (e?.cancelable !== false && typeof e?.preventDefault == "function") {
        e.preventDefault();
    }
}
// #endif


const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
    const styles = b({
        disabled: props.disabled,
        columns: props.columns > 1,
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        item: styles.item({ class: cn(uiOverrides.value.item) }),
    }
})

/**
 * 重置所有拖拽相关的状态
 * 在拖拽结束后调用，确保组件回到初始状态
 */
let dragToken = 0;
function reset() {
    dragToken++;
    dragging.value = false; // 拖拽状态
    dropping.value = false; // 放下动画状态
    dragIndex.value = -1; // 拖拽元素索引
    insertIndex.value = -1; // 插入位置索引
    offsetX.value = 0; // X轴偏移
    offsetY.value = 0; // Y轴偏移
    pointerOffsetX = 0;
    pointerOffsetY = 0;
    itemPositions = []; // 位置信息缓存
    itemHeight.value = 0; // 动态计算的高度
    itemWidth.value = 0; // 动态计算的宽度
    sortingStarted.value = false; // 排序模拟状态
}

/**
 * 计算网格布局中元素的位移偏移
 * @param index 当前元素索引
 * @param dragIdx 拖拽元素索引
 * @param insertIdx 插入位置索引
 * @returns 包含 x 和 y 坐标偏移的对象
 */
function calculateGridOffset(index: number, dragIdx: number, insertIdx: number): TranslateOffset {
    const cols = props.columns;

    // 计算当前元素在网格中的行列位置
    const currentRow = Math.floor(index / cols);
    const currentCol = index % cols;

    // 计算元素在拖拽后的新位置索引
    let newIndex = index;

    if (dragIdx < insertIdx) {
        // 向后拖拽：dragIdx+1 到 insertIdx 之间的元素需要向前移动一位
        if (index > dragIdx && index <= insertIdx) {
            newIndex = index - 1;
        }
    } else if (dragIdx > insertIdx) {
        // 向前拖拽：insertIdx 到 dragIdx-1 之间的元素需要向后移动一位
        if (index >= insertIdx && index < dragIdx) {
            newIndex = index + 1;
        }
    }

    // 计算新位置的行列坐标
    const newRow = Math.floor(newIndex / cols);
    const newCol = newIndex % cols;

    // 使用动态计算的网格尺寸
    const cellWidth = itemWidth.value;
    const cellHeight = itemHeight.value;

    // 计算实际的像素位移
    const offsetX = (newCol - currentCol) * cellWidth;
    const offsetY = (newRow - currentRow) * cellHeight;

    return { x: offsetX, y: offsetY };
}

/**
 * 计算网格布局的插入位置
 * @param dragCenterX 拖拽元素中心点X坐标
 * @param dragCenterY 拖拽元素中心点Y坐标
 * @returns 最佳插入位置索引
 */
function calculateGridInsertIndex(dragCenterX: number, dragCenterY: number): number {
    if (itemPositions.length == 0) {
        return dragIndex.value;
    }

    let closestIndex = dragIndex.value;
    let minDistance = Infinity;

    // 使用欧几里得距离找到最近的网格位置（包括原位置）
    for (let i = 0; i < itemPositions.length; i++) {
        const position = itemPositions[i];

        // 计算到元素中心点的距离
        const centerX = position.left + position.width / 2;
        const centerY = position.top + position.height / 2;

        // 使用欧几里得距离公式
        const distance = Math.sqrt(
            Math.pow(dragCenterX - centerX, 2) + Math.pow(dragCenterY - centerY, 2)
        );

        // 更新最近的位置
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }

    return closestIndex;
}

/**
 * 计算单列布局的插入位置
 * @param clientY Y坐标
 * @returns 最佳插入位置索引
 */
function calculateSingleColumnInsertIndex(clientY: number): number {
    let closestIndex = dragIndex.value;
    let minDistance = Infinity;

    // 遍历所有元素，找到距离最近的元素中心
    for (let i = 0; i < itemPositions.length; i++) {
        const position = itemPositions[i];

        // 计算到元素中心点的距离
        const itemCenter = position.top + position.height / 2;
        const distance = Math.abs(clientY - itemCenter);

        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }

    return closestIndex;
}

/**
 * 计算拖拽元素的最佳插入位置
 * @param clientPosition 在主轴上的坐标（仅用于单列布局的Y轴坐标）
 * @returns 最佳插入位置的索引
 */
function calculateInsertIndex(clientPosition: number): number {
    // 如果没有位置信息，保持原位置
    if (itemPositions.length == 0) {
        return dragIndex.value;
    }

    // 根据布局类型选择计算方式
    if (props.columns > 1) {
        // 多列网格布局：计算拖拽元素的中心点坐标，使用2D坐标计算最近位置
        const dragPos = itemPositions[dragIndex.value];
        const dragCenterX = dragPos.left + dragPos.width / 2 + pointerOffsetX;
        const dragCenterY = dragPos.top + dragPos.height / 2 + pointerOffsetY;
        return calculateGridInsertIndex(dragCenterX, dragCenterY);
    } else {
        // 单列布局：基于Y轴距离计算最近的元素中心
        return calculateSingleColumnInsertIndex(clientPosition);
    }
}

/**
 * 计算单列布局的位移偏移
 * @param index 元素索引
 * @param dragIdx 拖拽元素索引
 * @param insertIdx 插入位置索引
 * @returns 位移偏移对象
 */
function calculateSingleColumnOffset(
    index: number,
    dragIdx: number,
    insertIdx: number
): TranslateOffset {
    if (dragIdx < insertIdx) {
        // 向下拖拽：dragIdx+1 到 insertIdx 之间的元素向上移动
        if (index > dragIdx && index <= insertIdx) {
            return { x: 0, y: -itemHeight.value };
        }
    } else if (dragIdx > insertIdx) {
        // 向上拖拽：insertIdx 到 dragIdx-1 之间的元素向下移动
        if (index >= insertIdx && index < dragIdx) {
            return { x: 0, y: itemHeight.value };
        }
    }

    return { x: 0, y: 0 };
}

/**
 * 计算非拖拽元素的位移偏移量
 * @param index 元素索引
 * @returns 包含 x 和 y 坐标偏移的对象
 */
function getItemTranslateOffset(index: number): TranslateOffset {
    // 只在满足所有条件时才计算位移：拖拽中、非放下状态、已开始排序
    if (!dragging.value || dropping.value || !sortingStarted.value) {
        return { x: 0, y: 0 };
    }

    const dragIdx = dragIndex.value;
    const insertIdx = insertIndex.value;

    // 跳过正在拖拽的元素（拖拽元素由位置控制）
    if (index == dragIdx) {
        return { x: 0, y: 0 };
    }

    // 没有位置变化时不需要位移（拖回原位置）
    if (dragIdx == insertIdx) {
        return { x: 0, y: 0 };
    }

    // 根据布局类型计算位移
    if (props.columns > 1) {
        // 多列网格布局：使用2D位移计算
        return calculateGridOffset(index, dragIdx, insertIdx);
    } else {
        // 单列布局：使用简单的纵向位移
        return calculateSingleColumnOffset(index, dragIdx, insertIdx);
    }
}

/**
 * 计算项目的完整样式对象
 * @param index 项目索引
 * @returns 样式对象
 */
function getItemStyle(index: number) {
    const style: Record<string, string> = {};
    const isCurrent = dragIndex.value == index;

    // 多列布局时设置等宽分布
    // 用 calc 精确扣除 gap 占用空间：(100% - (columns-1) * gapSize) / columns
    // Tailwind gap-N 对应 N * 0.25rem
    if (props.columns > 1) {
        const gapRem = props.gap * 0.25;
        const totalGapRem = (props.columns - 1) * gapRem;
        const calcWidth = totalGapRem > 0
            ? `calc((100% - ${totalGapRem}rem) / ${props.columns})`
            : `${100 / props.columns}%`;
        style["flex-basis"] = calcWidth;
        style["width"] = calcWidth;
        style["box-sizing"] = "border-box";
    }

    // 放下动画期间，只保留基础样式
    if (dropping.value) {
        return style;
    }

    // 拖拽状态下的样式处理
    if (dragging.value) {
        if (isCurrent) {
            // 拖拽元素：跟随移动
            // #ifdef H5
            style["transform"] = `translate(${offsetX.value}px, ${offsetY.value}px)`;
            // #endif
            style["z-index"] = "100";
        } else {
            // 其他元素：显示排序预览位移
            const translateOffset = getItemTranslateOffset(index);
            style["transform"] = `translate(${translateOffset.x}px, ${translateOffset.y}px)`;
        }
    }

    return style;
}

/**
 * 获取所有项目的位置信息
 */
async function getItemPosition(token: number): Promise<void> {
    return new Promise((resolve) => {
        uni.createSelectorQuery()
            .in(proxy)
            .select(".reborn-draggable")
            .boundingClientRect()
            .exec((res) => {
                if (token !== dragToken) { resolve(); return; }
                const box = res?.[0];
                if (!box) { resolve(); return; }

                itemWidth.value = (box.width ?? 0) / props.columns;

                uni.createSelectorQuery()
                    .in(proxy)
                    .selectAll(".reborn-draggable__item")
                    .boundingClientRect()
                    .exec((res) => {
                        if (token !== dragToken) { resolve(); return; }
                        const rects = (res?.[0] ?? []) as any[];
                        const positions: ItemPosition[] = [];

                        for (let i = 0; i < rects.length; i++) {
                            const rect = rects[i];

                            if (i == 0) {
                                itemHeight.value = rect.height ?? 0;
                            }

                            positions.push({
                                top: rect.top ?? 0,
                                left: rect.left ?? 0,
                                width: itemWidth.value,
                                height: itemHeight.value
                            });
                        }

                        itemPositions = positions;

                        resolve();
                    });
            });
    });
}

/**
 * 获取项目是否禁用
 * @param index 项目索引
 * @returns 是否禁用
 */
function getItemDisabled(index: number): boolean {
    return !!(list.value[index] && typeof list.value[index] === "object" && list.value[index].disabled);
}

/**
 * 检查拖拽元素的中心点是否移动到其他元素区域
 */
function checkMovedToOtherElement(): boolean {
    // 如果没有位置信息，默认未移出
    if (itemPositions.length == 0) return false;

    const dragIdx = dragIndex.value;
    const dragPosition = itemPositions[dragIdx];

    // 计算拖拽元素当前的中心点位置（考虑拖拽偏移）
    const dragCenterX = dragPosition.left + dragPosition.width / 2 + pointerOffsetX;
    const dragCenterY = dragPosition.top + dragPosition.height / 2 + pointerOffsetY;

    // 根据布局类型采用不同的判断策略
    if (props.columns > 1) {
        // 多列网格布局：检查中心点是否与其他元素区域重叠
        for (let i = 0; i < itemPositions.length; i++) {
            if (i == dragIdx) continue;

            const otherPosition = itemPositions[i];
            const isOverlapping =
                dragCenterX >= otherPosition.left &&
                dragCenterX <= otherPosition.left + otherPosition.width &&
                dragCenterY >= otherPosition.top &&
                dragCenterY <= otherPosition.top + otherPosition.height;

            if (isOverlapping) {
                return true;
            }
        }
    } else {
        // 检查是否向上移动超过上一个元素的中线
        if (dragIdx > 0) {
            const prevPosition = itemPositions[dragIdx - 1];
            const prevCenterY = prevPosition.top + prevPosition.height / 2;
            if (dragCenterY <= prevCenterY) {
                return true;
            }
        }

        // 检查是否向下移动超过下一个元素的中线
        if (dragIdx < itemPositions.length - 1) {
            const nextPosition = itemPositions[dragIdx + 1];
            const nextCenterY = nextPosition.top + nextPosition.height / 2;
            if (dragCenterY >= nextCenterY) {
                return true;
            }
        }
    }

    return false;
}

// #ifdef H5
/**
 * H5 长按模式下屏蔽浏览器长按菜单（Android 长按触发 contextmenu）。
 * 不能在 touchstart 阶段 preventDefault：那会取消这次触摸的页面滚动和兼容点击，手指落在列表上页面就滚不动；
 * 文本选择与 iOS 长按呼出由样式 user-select / -webkit-touch-callout 处理。
 */
function onContextMenu(event: any) {
    if (props.longPress && !props.disabled) h5PreventNativeGesture(event);
}
// #endif

/**
 * 触摸开始事件处理
 * @param event 触摸事件对象
 * @param index 触摸的项目索引
 */
async function onTouchStart(event: any, index: number, type: string) {
    // 检查是否禁用或索引无效
    if (props.disabled) return;
    if (index < 0 || index >= list.value.length) return;
    if (getItemDisabled(index)) return;

    // 如果是长按触发，但未开启长按功能，则直接返回
    if (type == "longpress" && !props.longPress) return;
    // 如果是普通触摸触发，但已开启长按功能，则直接返回
    if (type == "touch" && props.longPress) return;

    // 获取触摸点
    const touch = event.touches[0];

    // 初始化拖拽状态
    const token = ++dragToken;
    dragging.value = true;
    emit("start", index);
    

    // 初始化拖拽索引
    dragIndex.value = index;
    insertIndex.value = index; // 初始插入位置为原位置
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    offsetX.value = 0;
    offsetY.value = 0;
    // 初始化拖拽数据项
    

    // 先获取所有项目的位置信息，为后续计算做准备
    await getItemPosition(token);
    // 测量返回时，早松手、取消、卸载或下一轮手势都可能已使本轮失效。
    if (token !== dragToken || !dragging.value) return;

    // H5 端：注册 passive:false 的全局 touchmove 拦截，防止页面跟随滚动
    // #ifdef H5
    document.addEventListener("touchmove", h5PreventScroll, { passive: false });
    // #endif

    // 震动
    uni.$emit("cool.vibrate");

    // 阻止事件冒泡
    if (event.stopPropagation) {
        event.stopPropagation();
    }
    // 阻止默认行为：只在判定进入拖拽之后执行；H5 拖拽期间的页面滚动由上面注册的 document 监听拦截
    // #ifdef H5
    h5PreventNativeGesture(event);
    // #endif
    // #ifndef H5
    if (event.cancelable !== false && event.preventDefault) {
        event.preventDefault();
    }
    // #endif
}

/**
 * 触摸移动事件处理
 * @param event 触摸事件对象
 */
function onTouchMove(event: TouchEvent): void {
    if (!dragging.value) return;

    const touch = event.touches[0];

    // 更新拖拽偏移量
    pointerOffsetX = touch.clientX - startX.value;
    pointerOffsetY = touch.clientY - startY.value;
    // #ifdef H5
    offsetX.value = pointerOffsetX;
    offsetY.value = pointerOffsetY;
    // #endif

    // 智能启动排序模拟：只有移出原元素区域才开始
    if (!sortingStarted.value) {
        if (checkMovedToOtherElement()) {
            sortingStarted.value = true;
        }
    }

    // 只有开始排序模拟后才计算插入位置
    if (sortingStarted.value) {
        // 计算拖拽元素当前的中心点坐标
        const dragPos = itemPositions[dragIndex.value];
        const dragCenterX = dragPos.left + dragPos.width / 2 + pointerOffsetX;
        const dragCenterY = dragPos.top + dragPos.height / 2 + pointerOffsetY;

        // 根据布局类型选择坐标轴：网格布局使用X坐标，单列布局使用Y坐标
        const dragCenter = props.columns > 1 ? dragCenterX : dragCenterY;

        // 计算最佳插入位置
        const newIndex = calculateInsertIndex(dragCenter);
        if (newIndex != insertIndex.value) {
            insertIndex.value = newIndex;
        }
    }

    // 阻止默认行为
    if (event.cancelable !== false && event.preventDefault) {
        event.preventDefault();
    }
}

/**
 * 触摸结束事件处理
 */
function onTouchEnd(): void {
    if (!dragging.value) return;

    // 旧索引
    const oldIndex = dragIndex.value;

    // 新索引
    const newIndex = insertIndex.value;

    // 如果位置发生变化，立即更新数组
    if (oldIndex != newIndex && newIndex >= 0) {
        const newList = [...list.value];
        const item = newList.splice(oldIndex, 1)[0];
        newList.splice(newIndex, 0, item);
        list.value = newList;

        // 触发变化事件
        model.value = [...list.value];
        emit("change", list.value);
    }

    // 开始放下动画
    dropping.value = true;
    dragging.value = false;

    // H5 端：移除全局 touchmove 拦截
    // #ifdef H5
    document.removeEventListener("touchmove", h5PreventScroll);
    // #endif

    // 重置所有状态
    reset();

    // 等待放下动画完成后重置所有状态
    emit("end", newIndex >= 0 ? newIndex : oldIndex);
    nextTick(() => { if (!dragging.value) list.value = [...model.value]; });
}

function onTouchCancel() {
    if (!dragging.value) return;
    const index = dragIndex.value;
    reset();
    list.value = [...model.value];
    // #ifdef H5
    document.removeEventListener('touchmove', h5PreventScroll);
    // #endif
    emit('end', index);
}

/**
 * 根据平台选择合适的key
 * @param item 数据项
 * @param index 索引
 * @returns 合适的key
 */
const objectKeys = new WeakMap<object, string>();
let keySeed = 0;
function getItemKey(item: any, index: number): string {
    // #ifdef MP
    return String(index);
    // #endif
    // #ifndef MP
    if (item !== null && typeof item === 'object') {
        if (!objectKeys.has(item)) objectKeys.set(item, `item-${++keySeed}`);
        return objectKeys.get(item)!;
    }
    const occurrence = list.value.slice(0, index).filter(value => Object.is(value, item)).length;
    return `${typeof item}:${String(item)}:${occurrence}`;
    // #endif
}
watch(() => [...model.value], val => {
    if (!dragging.value) list.value = [...val];
}, { immediate: true });
onUnmounted(() => { dragToken++; });
// #ifdef H5
// 组件卸载时兜底清理，防止拖拽中途组件被销毁导致监听器残留
onUnmounted(() => {
    document.removeEventListener("touchmove", h5PreventScroll);
});
// #endif
</script>

<script module="dragWxs" lang="wxs">
/* eslint-disable no-var, vars-on-top, object-shorthand, prefer-template -- WXS 仅支持 ES5 语法，保持 var、函数属性与字符串拼接。 */
module.exports = {
    touchmove: function (e, ins) {
        if (e.currentTarget && e.currentTarget.dataset) {
            var dragging = e.currentTarget.dataset.dragging;
            // 判断是否在拖拽中（兼容各端 boolean 和 string)
            if (dragging === true || dragging === 'true') {
                var touch = e.touches[0];
                var target = ins.selectComponent('.reborn-draggable__item--dragging');
                if (touch && target) {
                    var x = touch.clientX - e.currentTarget.dataset.startX;
                    var y = touch.clientY - e.currentTarget.dataset.startY;
                    target.setStyle({ transform: 'translate(' + x + 'px, ' + y + 'px)' });
                }
                return false; // 阻止默认的页面滚动行为
            }
        }
        return true;
    },
    touchend: function (e, ins) {
        var target = ins.selectComponent('.reborn-draggable__item--dragging');
        if (target) target.setStyle({ transform: '' });
        return true;
    }
}
</script>

<template>
  <!-- 插槽公开参数保留 dragIndex、insertIndex，避免改变调用方的解构名称。 -->
  <!-- eslint-disable vue/attribute-hyphenation -->
  <view
    class="reborn-draggable" :class="ui.root({ class: props.className })" :data-dragging="dragging"
    :style="{ gap: `${props.gap * 0.25}rem` }" :data-start-x="startX" :data-start-y="startY"
    @touchmove="dragWxs.touchmove" @touchend="dragWxs.touchend" @touchcancel="dragWxs.touchend"
  >
    <!-- H5 业务内容独立收集依赖，跟手位移不重跑插槽；非 H5 保留 WXS 位移。 -->
    <!-- #ifdef H5 -->
    <!-- @vue-ignore -->
    <view
      v-for="(item, index) in list" :key="getItemKey(item, index)" class="rounded-lg reborn-draggable__item" :class="[
        ui.item,
        {
          'reborn-draggable__item--disabled': disabled,
          'reborn-draggable__item--dragging': dragging && dragIndex === index,
          'reborn-draggable__item--animating': dragging && dragIndex !== index
        }
      ]" :style="getItemStyle(index)" @touchstart="onTouchStart($event, index, 'touch')"
      @longpress="onTouchStart($event, index, 'longpress')"
      @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchCancel"
      @contextmenu="onContextMenu"
    >
      <DraggableItemContent
        :render-item="slots.item" :item="item" :index="index" :dragging="dragging"
        :drag-index="dragIndex" :insert-index="insertIndex"
      />
    </view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <!-- @vue-ignore -->
    <view
      v-for="(item, index) in list" :key="getItemKey(item, index)" class="rounded-lg reborn-draggable__item" :class="[
        ui.item,
        {
          'reborn-draggable__item--disabled': disabled,
          'reborn-draggable__item--dragging': dragging && dragIndex === index,
          'reborn-draggable__item--animating': dragging && dragIndex !== index
        }
      ]" :style="getItemStyle(index)" @touchstart="onTouchStart($event, index, 'touch')"
      @longpress="onTouchStart($event, index, 'longpress')"
      @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchCancel"
    >
      <slot
        name="item" :item="item" :index="index" :dragging="dragging" :dragIndex="dragIndex"
        :insertIndex="insertIndex"
      />
    </view>
    <!-- #endif -->
  </view>
  <!-- eslint-enable vue/attribute-hyphenation -->
</template>

<style lang="scss" scoped>
.reborn-draggable {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;

    &__item {
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -webkit-user-drag: none;

        :deep(*) {
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -webkit-user-drag: none;
        }

        &--dragging {
            @apply opacity-95 z-20 scale-105 shadow-md;
        }

        &--disabled {
            @apply opacity-60;
        }

        &--animating {
            @apply duration-200;
            transition-property: transform;
        }
    }
}
</style>
