<script lang="ts">
// Tabs组件的单项类型
export interface TabsItem {
    label: string; // 标签文本
    value: string | number; // 对应值
    disabled?: boolean; // 是否禁用
};

</script>
<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from "vue";
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { TabsColors, TabsSizes, TabsVariants } from "./reborn-tabs.config";


interface Item extends TabsItem {
    isActive: boolean;
}

interface Props {
    customClass?: string;
    // modelValue: string | number;
    list: TabsItem[];
    fill?: boolean; // 是否填充标签
    color?: typeof TabsColors[number];
    variant?: typeof TabsVariants[number]; // 标签类型
    size?: typeof TabsSizes[number]; // 标签大小
    disabled?: boolean; // 是否禁用
    justify?: 'start' | 'center' | 'end'; // 对齐方式
    ui?: {
        tabs?: string;
        scrollbar?: string;
        inner?: string;
        item?: string;
        text?: string;
        line?: string;
        slider?: string;
        active?: string;
    }
}

defineSlots<{
    item(props: { item: Item; active: boolean }): any;
}>();

// 定义事件发射器
const emit = defineEmits(["update:modelValue", "change"]);

const props = withDefaults(defineProps<Props>(), {
    list: () => [],
    fill: false,
    color: TabsColors[0],
    variant: TabsVariants[0],
    size: TabsSizes[0],
    disabled: false,
    justify: 'start'
});
const active = defineModel<string | number>('modelValue')

// 获取当前组件实例的proxy对象
const { proxy } = getCurrentInstance()!;
const b = tv(theme)

const color = toRef(props, 'color')
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')
const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => b({
    color: color.value,
    variant: variant.value,
    size: size.value,
    fill: props.fill,
    justify: props.justify
}))

// 当前选中的标签值
// const active = ref(props.modelValue);

// 计算标签列表，增加isActive和disabled属性，便于渲染和状态判断
const list = computed(() =>
    props.list.map((e) => {
        return {
            label: e.label,
            value: e.value,
            // 如果未传disabled则默认为false
            disabled: e.disabled ?? false,
            // 判断当前标签是否为激活状态
            isActive: e.value == active.value
        } as Item;
    })
);
// 切换标签时触发，参数为索引
async function change(index: number) {
    // 如果整个Tabs被禁用，则不响应点击
    if (props.disabled) {
        return false;
    }

    // 获取当前点击标签的值
    const { value, disabled } = list.value[index];

    // 如果标签被禁用，则不响应点击
    if (disabled) {
        return false;
    }
    // 触发v-model的更新
    emit("update:modelValue", value, list.value[index], index);
    // 触发change事件
    emit("change", value, list.value[index], index);
}

// tab区域宽度
const tabWidth = ref(0);
// tab区域左侧偏移
const tabLeft = ref(0);
// 下划线左侧偏移
const lineLeft = ref(0);
// 下划线宽度
const lineWidth = ref(0);
// 滑块左侧偏移
const sliderLeft = ref(0);
// 滑块宽度
const sliderWidth = ref(0);
// 滚动条左侧偏移
const scrollLeft = ref(0);

// 单个标签的位置信息类型，包含left和width
type ItemRect = {
    left: number;
    width: number;
};

// 所有标签的位置信息，响应式数组
const itemRects = ref<ItemRect[]>([]);
const textRects = ref<ItemRect[]>([]);

// 获取当前选中标签的下标，未找到则返回0
function getIndex() {
    const index = list.value.findIndex((e) => e.isActive);
    return index == -1 ? 0 : index;
}

// 更新下划线、滑块、滚动条等位置
// 更新下划线、滑块、滚动条等位置
function updatePosition() {
    nextTick(() => {
        if (itemRects.value?.length) {
            const index = getIndex();
            // 获取当前选中标签的位置信息
            const item = itemRects.value[index];
            const text = textRects.value?.[index];

            if (!!item) {
                // 计算滚动条偏移，使选中项居中
                // x = Content_Center - Container_Half_Width
                // 由于 item.left 已经标准化（相对于内容区域），公式简化为：
                let x = item.left - (tabWidth.value - item.width) / 2;
                // 防止滚动条偏移为负
                if (x < 0) {
                    x = 0;
                }
                // 设置滚动条偏移
                scrollLeft.value = x;

                // 设置下划线偏移 (Text based)
                if (text) {
                    // text.left 已经是 relative to content
                    lineLeft.value = text.left;
                    lineWidth.value = text.width;
                } else {
                    // Fallback
                    lineLeft.value = item.left + item.width / 2 - 20 / 2;
                    lineWidth.value = 20;
                }

                // 设置滑块左侧偏移
                sliderLeft.value = item.left;
                // 设置滑块宽度
                sliderWidth.value = item.width;
            }
        }
    });
}

// 获取所有标签的位置信息，便于后续计算
function getRects() {
    // 创建选择器查询
    const query = uni.createSelectorQuery().in(proxy);

    query.selectAll(".reborn-tabs__item").boundingClientRect();
    query.selectAll(".reborn-tabs__text").boundingClientRect();
    query.select(".reborn-tabs__scroll-view").scrollOffset(() => { });

    query.exec((nodes: any) => {
        const scrollNode = nodes?.[2];
        const currentScrollLeft = scrollNode?.scrollLeft ?? 0;

        // 解析查询结果, 转换为相对于内容区域的坐标
        // Relative_Left = Viewport_Left - Tab_Viewport_Left + Current_Scroll
        itemRects.value = nodes?.[0]?.map((e: any) => ({
            left: (e.left ?? 0) - tabLeft.value + currentScrollLeft,
            width: e.width ?? 0
        } as ItemRect)) ?? [];

        textRects.value = nodes?.[1]?.map((e: any) => ({
            left: (e.left ?? 0) - tabLeft.value + currentScrollLeft,
            width: e.width ?? 0
        } as ItemRect)) ?? [];

        // 更新下划线、滑块等位置
        updatePosition();
    });
}

// 刷新tab区域的宽度和位置信息
function refresh() {
    // 使用 setTimeout 替代 nextTick，确保在视图层渲染完成后再获取布局信息
    // 尤其是在修改 size 等导致几何变化的属性时，需要一定延迟
    setTimeout(() => {
        // 创建选择器查询
        uni.createSelectorQuery()
            // 作用域限定为当前组件
            .in(proxy)
            // 选择tab容器
            .select(".reborn-tabs")
            // 获取容器的left和width
            .boundingClientRect((node: any) => {
                // 设置tab左侧偏移
                tabLeft.value = node?.left ?? 0;
                // 设置tab宽度
                tabWidth.value = node?.width ?? 0;

                // 获取所有标签的位置信息
                getRects();
            })
            .exec();
    }, 50);
}



onMounted(() => {
    watch(
        () => active.value,
        () => {
            // 更新下划线、滑块等位置
            updatePosition();
        },
        {
            // 立即执行一次
            immediate: true
        }
    );

    // 监听标签列表变化，刷新布局
    watch(
        computed(() => props.list),
        () => {
            refresh();
        },
        {
            immediate: true,
            deep: true
        }
    );

    // 监听其他影响布局的属性的变化
    watch(
        [
            computed(() => props.size),
            computed(() => props.variant),
            computed(() => props.fill),
            computed(() => props.justify)
        ],
        () => {
            refresh();
        }
    );
});
</script>

<template>
    <view class="reborn-tabs" :class="ui.tabs({ class: cn(props.customClass, uiOverrides.tabs) })">
        <scroll-view class="reborn-tabs__scroll-view" :class="ui.scrollbar({ class: uiOverrides.scrollbar })"
            :scroll-with-animation="true" :scroll-x="true" direction="horizontal" :scroll-left="scrollLeft"
            :show-scrollbar="false">
            <view :class="ui.inner({ class: uiOverrides.inner })">
                <view class="reborn-tabs__item" :class="ui.item({ class: uiOverrides.item })"
                    :data-state="item.isActive ? 'active' : 'inactive'"
                    :data-disabled="item.disabled ? 'true' : undefined" v-for="(item, index) in list" :key="index"
                    @tap="change(index)">
                    <slot name="item" :item="item" :active="item.isActive">
                        <text v-if="item.isActive" class="reborn-tabs__text"
                            :class="ui.active({ class: cn(uiOverrides.active, item.disabled || props.disabled ? 'text-gray-5 cursor-not-allowed' : '') })">
                            {{ item.label }}
                        </text>
                        <text v-else class="reborn-tabs__text"
                            :class="ui.text({ class: cn(uiOverrides.text, item.disabled || props.disabled ? 'text-gray-5 cursor-not-allowed' : '') })">
                            {{ item.label }}
                        </text>
                    </slot>
                </view>
                <template v-if="lineLeft > 0">
                    <view :class="ui.line({ class: uiOverrides.line })"
                        :style="{ transform: `translateX(${lineLeft}px)`, width: `${lineWidth}px` }"
                        v-if="variant == 'line'"></view>
                    <view :class="ui.slider({ class: uiOverrides.slider })"
                        :style="{ transform: `translateX(${sliderLeft}px)`, width: `${sliderWidth}px` }"
                        v-if="variant == 'card'"></view>
                </template>
            </view>
        </scroll-view>
    </view>
</template>