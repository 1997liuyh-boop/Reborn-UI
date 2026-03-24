<script setup lang="ts">
import { computed } from "vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";

/** 单个控件配置 */
export interface PlaygroundControlItem {
    /** 控件标签 */
    label: string;
    /** v-model 绑定到 modelValue 中的 key */
    key: string;
    /** 渲染的组件类型 */
    component: "select" | "input" | "checkbox";
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
}

const props = withDefaults(defineProps<PlaygroundProps>(), {
    title: "交互体验",
    description: "通过左侧面板实时调节组件属性，在右侧查看视觉反馈",
    componentName: "Component",
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
</script>

<template>
    <section class="space-y-4">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                    {{ title }}
                </h2>
                <p class="mt-2 text-gray-500">{{ description }}</p>
            </div>
            <span
                class="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                Playground
            </span>
        </div>

        <!-- 主体容器 -->
        <div
            class="grid overflow-hidden rounded-ui-base border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-12">

            <!-- ========== 左侧控制面板 ========== -->
            <div
                class="flex flex-col gap-8 border-r border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50 lg:col-span-4">
                <div v-for="(group, gi) in controls" :key="gi" class="space-y-4">
                    <!-- 分组标题 -->
                    <div class="flex items-center gap-2">
                        <div class="h-4 w-1 rounded-full" :class="getAccentColor(gi)" />
                        <span class="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">
                            {{ group.title }}
                        </span>
                    </div>

                    <!-- 控件列表 -->
                    <div class="grid gap-1">
                        <template v-for="item in group.children" :key="item.key">
                            <!-- Checkbox：不需要外包 label -->
                            <RebornCheckbox v-if="item.component === 'checkbox'" :model-value="getField(item.key)"
                                :label="item.label" v-bind="item.props" size="sm"
                                @update:model-value="updateField(item.key, $event)" />

                            <!-- Select / Input：统一外包 label -->
                            <div v-else class="space-y-2">
                                <label class="text-xs font-bold text-gray-400">{{ item.label }}</label>
                                <RebornSelect v-if="item.component === 'select'" :model-value="getField(item.key)"
                                    v-bind="item.props" class="w-full" size="sm"
                                    @update:model-value="updateField(item.key, $event)" />
                                <RebornInput v-else-if="item.component === 'input'" :model-value="getField(item.key)"
                                    v-bind="item.props" size="sm" class="bg-white! dark:bg-gray-800!"
                                    @update:model-value="updateField(item.key, $event)" />
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- ========== 右侧预览区 ========== -->
            <div class="relative flex min-h-[560px] flex-col bg-white dark:bg-gray-950 lg:col-span-8">

                <!-- 左上角：传参明细 Popover -->
                <div v-if="activeCode" class="absolute top-5 left-5 z-20">
                    <RebornPopover :content="{ side: 'bottom', align: 'start', sideOffset: 8 }">
                        <button type="button"
                            class="flex items-center gap-1.5 rounded-xl bg-gray-100/80 px-3 py-2 text-xs font-bold text-gray-500 shadow-xs backdrop-blur-sm transition-all hover:bg-gray-200/80 hover:text-gray-700 active:scale-95 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80">
                            <Icon name="lucide:code-xml" class="size-4" />
                            <span>传参明细</span>
                        </button>

                        <template #content>
                            <div
                                class="w-[420px] overflow-hidden rounded-2xl bg-gray-900 p-5 font-mono text-sm leading-relaxed text-indigo-300 shadow-2xl">
                                <pre class="overflow-x-auto"><code>{{ activeCode }}</code></pre>
                            </div>
                        </template>
                    </RebornPopover>
                </div>

                <!-- 背景装饰 -->
                <div class="absolute inset-0 z-0 opacity-40 select-none pointer-events-none overflow-hidden">
                    <div
                        class="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-primary/20 to-info/20 blur-[100px]" />
                </div>

                <!-- 预览插槽 -->
                <div class="relative z-10 flex flex-1 items-center justify-center p-12">
                    <slot />
                </div>
            </div>
        </div>
    </section>
</template>
