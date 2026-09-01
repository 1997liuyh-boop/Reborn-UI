<template>
    <div ref="host" class="playground-editor h-full min-h-0 w-full overflow-hidden" />
</template>

<script setup lang="ts">
/**
 * Playground 代码编辑器(CodeMirror 6)
 *
 * - 语法高亮:@codemirror/lang-vue(SFC 模板/脚本分区着色),主题跟随全局明暗模式
 * - 智能提示:三级补全 —— 组件标签(<Reborn…)、属性与事件(含类型和中文说明)、
 *   枚举属性值(variant="filled|outlined|…"),数据来自知识库构建产物
 *   /playground-completions.json(modules/playground-completions.ts 生成)
 * - Ctrl/Cmd+S 触发 format 事件,由页面调用 prettier 完成一键格式化
 */
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { vue } from "@codemirror/lang-vue";
import type { CompletionContext, CompletionResult, Completion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";

/** 与生成模块保持一致的补全数据结构 */
interface CompletionProp {
    name: string;
    type?: string;
    description?: string;
    options?: string[];
}
interface CompletionEntry {
    tag: string;
    description?: string;
    props: CompletionProp[];
    events: string[];
    slots: string[];
}

const model = defineModel<string>({ required: true });

const emit = defineEmits<{
    /** 请求格式化当前代码(Ctrl/Cmd+S 触发) */
    (e: "format"): void;
}>();

const host = ref<HTMLElement>();
const colorMode = useColorMode();

let view: EditorView | null = null;

/** 补全数据:挂载后异步加载,加载前编辑器退化为纯高亮 */
let entries: CompletionEntry[] = [];
const byTag = new Map<string, CompletionEntry>();

/** 组件标签、属性/事件、枚举值三级补全源 */
function rebornCompletions(context: CompletionContext): CompletionResult | null {
    if (entries.length === 0) return null;

    // 一级:标签名 —— 光标处于 "<" 或 "<Reb…" 之后
    const tagMatch = context.matchBefore(/<[\w]*$/);
    if (tagMatch) {
        return {
            from: tagMatch.from + 1,
            options: entries.map<Completion>((e) => ({
                label: e.tag,
                type: "class",
                detail: "Reborn 组件",
                info: e.description,
            })),
            validFor: /^[\w]*$/,
        };
    }

    // 定位光标所在的未闭合组件标签(向前最近的 "<PascalTag …" 且尚未出现 ">")
    const before = context.state.sliceDoc(0, context.pos);
    const openTag = before.match(/<([A-Z][\w]*)(?:\s[^<>]*)?$/);
    if (!openTag) return null;
    const entry = byTag.get(openTag[1]!);
    if (!entry) return null;

    // 三级:枚举属性值 —— 形如 variant=" 或 :size="… 的引号内
    const valueMatch = context.matchBefore(/[:@]?[\w-]+="[^"]*$/);
    if (valueMatch) {
        const propName = valueMatch.text.match(/^:?([\w-]+)=/)?.[1];
        const prop = entry.props.find((p) => p.name === propName);
        if (!prop?.options?.length) return null;
        return {
            from: valueMatch.from + valueMatch.text.indexOf('"') + 1,
            options: prop.options.map<Completion>((v) => ({ label: v, type: "enum" })),
            validFor: /^[\w-]*$/,
        };
    }

    // 二级:属性与事件 —— 处于属性位(前一个字符为空白)
    const attrMatch = context.matchBefore(/[@:]?[\w-]*$/);
    if (!attrMatch) return null;
    if (attrMatch.from === attrMatch.to && !context.explicit) return null;
    const prevChar = context.state.sliceDoc(Math.max(0, attrMatch.from - 1), attrMatch.from);
    if (!/\s/.test(prevChar)) return null;

    return {
        from: attrMatch.from,
        options: [
            ...entry.props.map<Completion>((p) => ({
                label: p.name,
                type: "property",
                detail: p.type,
                info: p.description,
                boost: 2,
            })),
            ...entry.events.map<Completion>((ev) => ({
                label: `@${ev}`,
                type: "method",
                detail: "事件",
                boost: 1,
            })),
        ],
        validFor: /^[@:]?[\w-]*$/,
    };
}

/** 主题隔间:明暗切换时热替换,无需重建编辑器 */
const themeCompartment = new Compartment();

/** 基础外观:等宽小号字体,占满容器 */
const baseTheme = EditorView.theme({
    "&": { height: "100%", fontSize: "13px", backgroundColor: "transparent" },
    ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
    "&.cm-focused": { outline: "none" },
});

function themeExtension() {
    return colorMode.value === "dark" ? oneDark : [];
}

onMounted(async () => {
    view = new EditorView({
        parent: host.value!,
        state: EditorState.create({
            doc: model.value,
            extensions: [
                basicSetup,
                vue(),
                keymap.of([
                    // Ctrl/Cmd+S:格式化而非浏览器保存
                    {
                        key: "Mod-s",
                        preventDefault: true,
                        run: () => {
                            emit("format");
                            return true;
                        },
                    },
                    indentWithTab,
                ]),
                // 全局注册补全源:对任意语言分区生效,与 lang-vue 默认补全并存
                EditorState.languageData.of(() => [{ autocomplete: rebornCompletions }]),
                themeCompartment.of(themeExtension()),
                baseTheme,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const value = update.state.doc.toString();
                        if (value !== model.value) model.value = value;
                    }
                }),
            ],
        }),
    });

    // 异步加载补全数据,失败仅降级不报错
    try {
        const base = (useRuntimeConfig().app.baseURL || "/").replace(/\/$/, "");
        const res = await fetch(`${base}/playground-completions.json`);
        if (res.ok) {
            entries = await res.json();
            entries.forEach((e) => byTag.set(e.tag, e));
        }
    } catch {
        // 静默降级:无组件提示但编辑器功能完整
    }
});

// 外部改写(哈希载入/格式化/重置)时同步进编辑器
watch(model, (value) => {
    if (view && value !== view.state.doc.toString()) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
});

// 明暗模式热切换
watch(
    () => colorMode.value,
    () => {
        view?.dispatch({ effects: themeCompartment.reconfigure(themeExtension()) });
    },
);

onUnmounted(() => {
    view?.destroy();
    view = null;
});
</script>

<style scoped>
/* CodeMirror 挂载节点占满编辑列 */
.playground-editor :deep(.cm-editor) {
    height: 100%;
}
</style>
