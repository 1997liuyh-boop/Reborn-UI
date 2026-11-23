<script setup lang="ts">
import { tv } from "tailwind-variants";
import { computed, onBeforeUnmount, onScopeDispose, reactive, shallowRef, toRaw, watch } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornDrawer from "~/components/reborn/ui/reborn-drawer/RebornDrawer.vue";
import RebornForm from "~/components/reborn/ui/reborn-form/RebornForm.vue";
import RebornFormItem from "~/components/reborn/ui/reborn-form/RebornFormItem.vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";
import RebornTooltip from "~/components/reborn/ui/reborn-tooltip/RebornTooltip.vue";
import config from "./play-ground.config";
import { claimDrawer, releaseDrawer } from "./play-ground.drawer";
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
    description: "点「参数修改」调节组件属性，在下方查看视觉反馈",
    componentName: "Component",
    surface: true
});

const emit = defineEmits<{
    /** 点了抽屉里的「重置」，参数已恢复到初始值 */
    reset: [];
}>();

const model = defineModel<Record<string, any>>({ required: true });

/** 挂载时的参数快照，抽屉里的「重置」恢复到它（即 demo 的 defaultState） */
const initialModel = cloneState(model.value);

function cloneState(value: Record<string, any>) {
    try {
        return structuredClone(toRaw(value));
    }
    catch {
        // 含函数等不可克隆的值时退回浅拷贝
        return { ...value };
    }
}

/** 重置全部参数 */
function resetModel() {
    model.value = cloneState(initialModel);
    emit("reset");
}

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

/** 抽屉表单里要显示的分组：去掉被 hide 隐藏的控件，空分组整组不出现 */
const visibleGroups = computed(() =>
    controlGroups.value
        .map(group => ({ ...group, children: group.children.filter(item => !visibilityMap[item.key]) }))
        .filter(group => group.children.length > 0),
);

/* ── 参数抽屉 ──────────────────────────────────────────────── */

/** 抽屉是否打开 */
const drawerOpen = shallowRef(false);
/**
 * 抽屉的挂载点：文档页右栏目录（DocsToc）里留的宿主节点，抽屉落在它里面，宽度与位置就和目录栏一致。
 * 找不到宿主（窄屏目录收成折叠条、或演练场不在文档页里）时为 undefined，抽屉退回贴视口右缘。
 */
const drawerHost = shallowRef<HTMLElement>();
/** 没有宿主时的抽屉宽度 */
const FALLBACK_DRAWER_WIDTH = 320;
/** 抽屉是否正占着右栏目录的位置；app.vue 据此把右下角的回顶按钮让到抽屉左边 */
const drawerDocked = usePlaygroundDrawerDocked();
watch(drawerOpen, (open) => {
    drawerDocked.value = open && !!drawerHost.value;
});

function resolveDrawerHost() {
    const host = document.querySelector<HTMLElement>("[data-playground-drawer-host]");
    // 宿主在窄屏是 display: none，量不到盒子就当它不存在
    drawerHost.value = host?.getClientRects().length ? host : undefined;
}

function closeDrawer() {
    drawerOpen.value = false;
}

function toggleDrawer() {
    if (drawerOpen.value) {
        closeDrawer();
        return;
    }
    // 一页有多个演练场时，先关掉别处开着的抽屉
    claimDrawer(closeDrawer);
    resolveDrawerHost();
    drawerOpen.value = true;
}

onBeforeUnmount(() => {
    releaseDrawer(closeDrawer);
    if (drawerOpen.value) drawerDocked.value = false;
});

/** 问号提示的内容：参数名 + 当前值（字符串带引号，对象转 JSON） */
function paramTip(key: string) {
    const value = model.value[key];
    const text = value === undefined ? "undefined" : typeof value === "string" ? `"${value}"` : JSON.stringify(value);
    return `${key}: ${text}`;
}

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
      <div :class="ui.headerActions()">
        <!-- 参数入口：控件都在抽屉里，这里只留一个开关 -->
        <RebornButton
          v-if="controls.length" size="md" :variant="drawerOpen ? 'filled' : 'soft'" color="primary"
          :aria-expanded="drawerOpen" @click="toggleDrawer"
        >
          <template #leading>
            <Icon name="lucide:sliders-horizontal" size="12" />
          </template>
          参数修改
        </RebornButton>
        <slot name="tag">
          <span :class="ui.headerTag()">
            演练场
          </span>
        </slot>
      </div>
    </div>

    <!-- 主体容器：补充内容（如有）在上、预览区在下 -->
    <div :class="ui.container()">
      <!-- 演练场的补充内容（如事件回执） -->
      <div v-if="$slots.extra" :class="ui.extraPanel()">
        <slot name="extra" />
      </div>

      <!-- ========== 预览区 ========== -->
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

    <!--
      参数抽屉：不要遮罩、不锁滚动、抽屉之外可以照常点（modal-penetrable），
      改参数的同时预览区一直看得见、摸得着。
    -->
    <RebornDrawer
      v-model="drawerOpen" :modal="false" modal-penetrable :lock-scroll="false"
      :append-to="drawerHost" :size="drawerHost ? '100%' : FALLBACK_DRAWER_WIDTH"
      with-header title="参数修改" :aria-label="`${title}参数`"
      :ui="{ root: ui.drawerRoot(), header: ui.drawerHeader(), title: ui.drawerTitle(), body: ui.drawerBody(), footer: ui.drawerFooter() }"
    >
      <template #close="{ close }">
        <RebornButton size="md" variant="text" color="neutral" class="size-8 p-0" aria-label="关闭抽屉" @click="close">
          <Icon name="lucide:x" class="size-5" />
        </RebornButton>
      </template>

      <RebornForm :model-value="model" label-position="top" size="md" :class="ui.form()">
        <section v-for="(group, gi) in visibleGroups" :key="gi" :class="ui.group()">
          <!-- 分组标题 -->
          <div :class="ui.groupTitleWrapper()">
            <span :class="ui.groupTitleText()">{{ group.title }}</span>
            <span :class="ui.groupTitleLine()" aria-hidden="true" />
          </div>

          <RebornFormItem
            v-for="item in group.children" :key="item.key"
            :ui="{ label: ui.formItemLabel(), content: ui.formItemContent() }"
          >
            <template #label>
              <span :class="ui.fieldLabelText()">{{ item.label }}</span>
              <!-- 问号提示：参数名 + 当前值 -->
              <RebornTooltip :content="paramTip(item.key)" placement="top" :z-index="2100">
                <button type="button" :class="ui.fieldHelp()" :aria-label="`查看「${item.label}」的参数名与当前值`">
                  <Icon name="lucide:circle-help" class="size-3.5" />
                </button>
              </RebornTooltip>
              <span v-if="item.component === 'slider'" :class="ui.fieldValue()">{{ getField(item.key) }}</span>
            </template>
            <PlaygroundField :item="item" :value="getField(item.key)" @update:value="updateField(item.key, $event)" />
          </RebornFormItem>
        </section>
      </RebornForm>

      <template #footer="{ close }">
        <RebornButton size="md" variant="soft" color="neutral" @click="resetModel">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置
        </RebornButton>
        <RebornButton size="md" color="primary" @click="close">
          关闭
        </RebornButton>
      </template>
    </RebornDrawer>
  </section>
</template>
