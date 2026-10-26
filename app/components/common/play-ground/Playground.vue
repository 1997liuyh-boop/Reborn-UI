<script setup lang="ts">
import { tv } from "tailwind-variants";
import { computed, onScopeDispose, reactive, shallowRef, watch } from "vue";
import RebornCollapse from "~/components/reborn/ui/reborn-collapse/RebornCollapse.vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";
import config from "./play-ground.config";
import PlaygroundField from "./PlaygroundField.vue";

/** 单个控件配置 */
export interface PlaygroundControlItem {
    /** 控件标签 */
    label: string;
    /** v-model 绑定到 modelValue 中的 key */
    key: string;
    /** 渲染的组件类型 */
    component: "select" | "input" | "input-number" | "checkbox" | "slider" | "color-picker";
    /** 传递给控件的额外 props（如 options、type 等） */
    props?: Record<string, any>;
    /** 默认值，用于检测是否需要在代码中展示此属性 */
    defaultValue?: any;
    /** 生成传参明细时忽略该控件（如仅演示用的辅助开关） */
    codeIgnore?: boolean;
    /** 值为空字符串时不写入传参明细（用于「空 = 未传该参数」语义的选项，如 controlsPosition） */
    codeSkipEmpty?: boolean;
    /** 是否隐藏该控件，接受当前字段值和状态对象，支持 Promise */
    hide?: (value: any, modelValue: Record<string, any>) => boolean | Promise<boolean>;
}

/** 控件分组 */
export interface PlaygroundControlGroup {
    /** 一级标题 */
    title: string;
    /** 子控件列表 */
    children: PlaygroundControlItem[];
}

export interface PlaygroundProps {
    /** 控制面板配置 */
    controls: PlaygroundControlGroup[];
    /** 选填：手动指定的代码字符串。若不传则根据 controls 和 modelValue 自动生成 */
    code?: string;
    /** 追加到自动生成传参明细末尾的额外行（如 placeholder、@change 监听）；手动传 code 时不生效 */
    codeExtras?: string[];
    /** 组件名称，用于自动生成代码（如 'RebornButton'） */
    componentName?: string;
    /** 标题；同时作为标题 h2 的 id，文档页的本页目录据此给演练场加一条锚点（见 DocsPage 的 tocLinks） */
    title?: string;
    /** 描述 */
    description?: string;
    /**
     * 是否自成一张卡片（补回描边与内边距，与 DemoSection 同形态：只描边、不填充）。
     * 默认 true：演练场与相邻的分组卡片同级，需要一条边把自己圈出来。
     * 嵌进别的表面里（例如已有卡片内部）时传 false，连描边一起去掉。
     */
    surface?: boolean;
}

const props = withDefaults(defineProps<PlaygroundProps>(), {
    title: "交互体验",
    description: "通过上方面板实时调节组件属性，在下方查看视觉反馈",
    componentName: "Component",
    surface: true
});

const model = defineModel<Record<string, any>>({ required: true });

/** 更新状态对象中某个 key 的值 */
function updateField(key: string, value: any) {
    model.value = { ...model.value, [key]: value };
}

/**
 * 规范化 select 控件 props。
 * 历史 demo 曾把选项写成 items（Nuxt UI 习惯），但 RebornSelect 只认 options；
 * 这里做兼容，避免下拉空列表。
 */
function normalizeSelectProps(raw?: Record<string, any>) {
    if (!raw) return {};
    const { items, options, ...rest } = raw;
    return {
        ...rest,
        options: options ?? items ?? [],
    };
}

/** 从状态对象中获取某个 key 的值 */
function getField(key: string) {
    return model.value[key];
}

/** 显回状态管理 */
const visibilityMap = reactive<Record<string, boolean>>({});
let visibilityVersion = 0;
onScopeDispose(() => { visibilityVersion++; });

async function updateVisibility() {
    const version = ++visibilityVersion;
    const promises: Promise<void>[] = [];

    props.controls.forEach(group => {
        group.children.forEach(item => {
            if (item.hide) {
                const res = item.hide(model.value[item.key], model.value);
                if (res instanceof Promise) {
                    promises.push(res.then(hidden => {
                        if (version === visibilityVersion) visibilityMap[item.key] = !!hidden;
                    }));
                } else {
                    visibilityMap[item.key] = !!res;
                }
            } else {
                visibilityMap[item.key] = false;
            }
        });
    });

    if (promises.length > 0) {
        await Promise.all(promises);
    }
}

// 深度监听 modelValue 或 controls 的变化
watch([model, () => props.controls], updateVisibility, { deep: true, immediate: true });

/** select 的兼容字段只在配置变化时归一化。 */
const controlGroups = computed(() => props.controls.map(group => ({
    ...group,
    children: group.children.map(item => ({
        ...item,
        normalizedProps: item.component === 'select' ? normalizeSelectProps(item.props) : item.props,
    })),
})));

/** 控制区每行放几个控件（lg 及以上），与 controlGrid 的列数一致 */
const COLUMNS = 4;
/** 默认展开的控件行数，其余收进「展开全部参数」 */
const VISIBLE_ROWS = 2;

type ControlGroupView = (typeof controlGroups.value)[number] & { continued: boolean };

/**
 * 控件按分组逐行排布：分组标题独占一行，组内每行 COLUMNS 个控件。
 * 只数控件行、不数标题行，数满 VISIBLE_ROWS 行后剩下的控件进入折叠区；
 * 一个分组被拆开时，折叠区里的后半段不再重复标题（continued），展开后视觉上接着上半段。
 * 被 hide 隐藏的控件不占位置，所以显隐变化后会重新分行。
 */
const controlLayout = computed(() => {
    const head: ControlGroupView[] = [];
    const tail: ControlGroupView[] = [];
    let rowsLeft = VISIBLE_ROWS;
    for (const group of controlGroups.value) {
        const items = group.children.filter(item => !visibilityMap[item.key]);
        if (!items.length) continue;
        const headCount = Math.min(items.length, Math.max(0, rowsLeft) * COLUMNS);
        if (headCount > 0) head.push({ ...group, children: items.slice(0, headCount), continued: false });
        if (headCount < items.length) tail.push({ ...group, children: items.slice(headCount), continued: headCount > 0 });
        rowsLeft -= Math.ceil(headCount / COLUMNS);
    }
    return { head, tail, hiddenCount: tail.reduce((sum, group) => sum + group.children.length, 0) };
});

/** 折叠区是否展开；默认收起 */
const expanded = shallowRef(false);

/** camelCase 的状态 key 转为模板里的 kebab-case 属性名（如 showPassword → show-password） */
function toKebabCase(key: string) {
    return key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/** 自动生成代码明细：完整列出当前所有参数（含等于默认值的项），便于整段拷贝复现 */
const activeCode = computed(() => {
    if (props.code) return props.code;

    const s = model.value;
    const parts = [`<${props.componentName}`];

    // 假设都有 v-model
    parts.push(`  v-model="value"`);

    props.controls.forEach(group => {
        group.children.forEach(item => {
            const val = s[item.key];
            const name = toKebabCase(item.key);

            if (item.codeIgnore) return;
            if (item.codeSkipEmpty && val === "") return;

            if (val !== undefined) {
                if (typeof val === "boolean") {
                    parts.push(`  :${name}="${val}"`);
                } else if (typeof val === "number") {
                    parts.push(`  :${name}="${val}"`);
                } else if (typeof val === "string") {
                    parts.push(`  ${name}="${val}"`);
                } else {
                    parts.push(`  :${name}='${JSON.stringify(val)}'`);
                }
            }
        });
    });

    // 追加 controls 之外的固定参数与事件监听
    (props.codeExtras || []).forEach(line => parts.push(`  ${line}`));

    parts.push("/>");
    return parts.join("\n");
});

const ui = computed(() => tv(config)({ surface: props.surface }));
</script>

<template>
  <section :class="ui.wrapper()">
    <!-- 标题栏 -->
    <div :class="ui.header()">
      <div :class="ui.headerTitleWrapper()">
        <h2 :id="title" :class="ui.headerTitle()">
          {{ title }}
        </h2>
        <p :class="ui.headerDesc()">{{ description }}</p>
      </div>
      <slot name="tag">
        <span :class="ui.headerTag()">
          演练场
        </span>
      </slot>
    </div>

    <!-- 主体容器：上方控制区、下方预览区 -->
    <div :class="ui.container()">
      <!-- ========== 上方控制区 ========== -->
      <div :class="ui.controlPanel()">
        <template v-for="(group, gi) in controlLayout.head" :key="`head-${gi}`">
          <div :class="ui.group()">
            <!-- 分组标题独占一行 -->
            <div :class="ui.groupTitleWrapper()">
              <span :class="ui.groupTitleText()">{{ group.title }}</span>
              <span :class="ui.groupTitleLine()" aria-hidden="true" />
            </div>
            <div :class="ui.controlGrid()">
              <div v-for="item in group.children" :key="item.key" :class="ui.fieldWrapper()">
                <PlaygroundField :item="item" :value="getField(item.key)" @update:value="updateField(item.key, $event)" />
              </div>
            </div>
          </div>
        </template>

        <!-- 超出默认行数的控件收进折叠区，点击下方按钮展开 -->
        <RebornCollapse
          v-if="controlLayout.hiddenCount > 0"
          v-model="expanded"
          position="top"
          :ui="{ content: ui.collapseContent() }"
        >
          <template #content>
            <div :class="ui.collapseInner()">
              <template v-for="(group, gi) in controlLayout.tail" :key="`tail-${gi}`">
                <div :class="ui.group()">
                  <div v-if="!group.continued" :class="ui.groupTitleWrapper()">
                    <span :class="ui.groupTitleText()">{{ group.title }}</span>
                    <span :class="ui.groupTitleLine()" aria-hidden="true" />
                  </div>
                  <div :class="ui.controlGrid()">
                    <div v-for="item in group.children" :key="item.key" :class="ui.fieldWrapper()">
                      <PlaygroundField :item="item" :value="getField(item.key)" @update:value="updateField(item.key, $event)" />
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>
          <button type="button" :class="ui.collapseToggle()" :aria-expanded="expanded">
            <span>{{ expanded ? '收起参数' : '展开全部参数' }}</span>
            <span v-if="!expanded" :class="ui.collapseCount()">+{{ controlLayout.hiddenCount }}</span>
            <Icon name="lucide:chevron-down" :class="ui.collapseIcon({ class: expanded ? 'rotate-180' : '' })" />
          </button>
        </RebornCollapse>

        <!-- 演练场的补充内容（如事件回执），排在控件下方 -->
        <slot name="extra" />
      </div>

      <!-- ========== 下方预览区 ========== -->
      <div :class="ui.previewPanel()">
        <!-- 右上角：传参明细 Popover -->
        <div v-if="activeCode" :class="ui.popoverWrapper()">
          <RebornPopover placement="bottom-start">
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

        <!-- 预览插槽 -->
        <div :class="ui.previewContent()">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>
