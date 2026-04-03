<script setup lang="ts">
import { computed } from "vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue";
import { tv } from "tailwind-variants";
import config from "./play-ground.config";

/** 单个控件配置 */
export interface PlaygroundControlItem {
    /** 控件标签 */
    label: string;
    /** v-model 绑定到 modelValue 中的 key */
    key: string;
    /** 渲染的组件类型 */
    component: "select" | "input" | "checkbox" | "slider";
    /** 传递给控件的额外 props（如 options、type 等） */
    props?: Record<string, any>;
    /** 默认值，用于检测是否需要在代码中展示此属性 */
    defaultValue?: any;
}

/** 控件分组 */
export interface PlaygroundControlGroup {
    /** 一级标题 */
    title: string;
    /** 子控件列表 */
    children: PlaygroundControlItem[];
}

export interface PlaygroundProps {
    /** 双向绑定的状态对象 */
    modelValue: Record<string, any>;
    /** 控制面板配置 */
    controls: PlaygroundControlGroup[];
    /** 选填：手动指定的代码字符串。若不传则根据 controls 和 modelValue 自动生成 */
    code?: string;
    /** 组件名称，用于自动生成代码（如 'RebornButton'） */
    componentName?: string;
    /** 标题 */
    title?: string;
    /** 描述 */
    description?: string;
    /** 方向 */
    direction?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<PlaygroundProps>(), {
    title: "交互体验",
    description: "通过左侧面板实时调节组件属性，在右侧查看视觉反馈",
    componentName: "Component",
    direction: 'horizontal'
});

const emit = defineEmits<{
    (e: "update:modelValue", value: Record<string, any>): void;
}>();

/** 更新状态对象中某个 key 的值 */
function updateField(key: string, value: any) {
    emit("update:modelValue", { ...props.modelValue, [key]: value });
}

/** 从状态对象中获取某个 key 的值 */
function getField(key: string) {
    return props.modelValue[key];
}

/** 自动生成代码明细 */
const activeCode = computed(() => {
    if (props.code) return props.code;

    const s = props.modelValue;
    const parts = [`<${props.componentName}`];

    // 假设都有 v-model
    parts.push(`  v-model="value"`);

    props.controls.forEach(group => {
        group.children.forEach(item => {
            const val = s[item.key];
            const def = item.defaultValue;

            // 仅在值不等于默认值时展示
            if (val !== undefined && val !== def) {
                if (typeof val === "boolean") {
                    if (val) parts.push(`  ${item.key}`);
                } else if (typeof val === "number") {
                    parts.push(`  :${item.key}="${val}"`);
                } else if (typeof val === "string") {
                    parts.push(`  ${item.key}="${val}"`);
                } else {
                    parts.push(`  :${item.key}='${JSON.stringify(val)}'`);
                }
            }
        });
    });

    parts.push("/>");
    return parts.join("\n");
});

/** 装饰色轮换 */
const accentColors = ["bg-primary", "bg-info", "bg-success", "bg-warning", "bg-error"];
function getAccentColor(index: number) {
    return accentColors[index % accentColors.length];
}

const ui = computed(() => tv(config)({ direction: props.direction }));
</script>

<template>
    <section :class="ui.wrapper()">
        <!-- 标题栏 -->
        <div :class="ui.header()">
            <div :class="ui.headerTitleWrapper()">
                <h2 :class="ui.headerTitle()">
                    {{ title }}
                </h2>
                <p :class="ui.headerDesc()">{{ description }}</p>
            </div>
            <span :class="ui.headerTag()">
                Playground
            </span>
        </div>

        <!-- 主体容器 -->
        <div :class="ui.container()">

            <!-- ========== 左侧控制面板 ========== -->
            <div :class="ui.controlPanel()">
                <div v-for="(group, gi) in controls" :key="gi" class="space-y-4">
                    <!-- 分组标题 -->
                    <div :class="ui.groupTitleWrapper()">
                        <div :class="[ui.groupTitleAccent(), getAccentColor(gi)]" />
                        <span :class="ui.groupTitleText()">
                            {{ group.title }}
                        </span>
                    </div>

                    <!-- 控件列表 -->
                    <div :class="ui.controlList()">
                        <template v-for="item in group.children" :key="item.key">
                            <!-- Checkbox：不需要外包 label -->
                            <RebornCheckbox v-if="item.component === 'checkbox'" :model-value="getField(item.key)"
                                :label="item.label" v-bind="item.props" size="sm"
                                @update:model-value="updateField(item.key, $event)" />

                            <!-- Select / Input：统一外包 label -->
                            <div v-else :class="ui.fieldWrapper()">
                                <label :class="ui.fieldLabel()">
                                    {{ item.label }}
                                    <span v-if="item.component === 'slider'" :class="ui.fieldValue()">
                                        {{ getField(item.key) }}
                                    </span>
                                </label>
                                <RebornSelect v-if="item.component === 'select'" :model-value="getField(item.key)"
                                    v-bind="item.props" class="w-full" size="sm"
                                    @update:model-value="updateField(item.key, $event)" />
                                <RebornInput v-else-if="item.component === 'input'" :model-value="getField(item.key)"
                                    v-bind="item.props" size="sm" class="bg-white! dark:bg-gray-800!"
                                    @update:model-value="updateField(item.key, $event)" />
                                <RebornSlider v-else-if="item.component === 'slider'" :model-value="getField(item.key)"
                                    v-bind="item.props" size="sm" class="bg-white! dark:bg-gray-800!"
                                    @update:model-value="updateField(item.key, $event)" />
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- ========== 右侧预览区 ========== -->
            <div :class="ui.previewPanel()">

                <!-- 左上角：传参明细 Popover -->
                <div v-if="activeCode" :class="ui.popoverWrapper()">
                    <RebornPopover :content="{ side: 'bottom', align: 'start', sideOffset: 8 }">
                        <button type="button" :class="ui.popoverBtn()">
                            <Icon name="lucide:code-xml" :class="ui.popoverIcon()" />
                            <span>传参明细</span>
                        </button>

                        <template #content>
                            <div :class="ui.popoverContent()">
                                <pre :class="ui.popoverPre()"><code>{{ activeCode }}</code></pre>
                            </div>
                        </template>
                    </RebornPopover>
                </div>

                <!-- 背景装饰 -->
                <div :class="ui.bgDecorationWrapper()">
                    <div :class="ui.bgDecoration()" />
                </div>

                <!-- 预览插槽 -->
                <div :class="ui.previewContent()">
                    <slot />
                </div>
            </div>
        </div>
    </section>
</template>
