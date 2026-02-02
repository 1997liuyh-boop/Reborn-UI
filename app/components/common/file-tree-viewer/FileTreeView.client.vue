<script setup lang="ts">
import type { TreeItemToggleEvent } from 'reka-ui'
import type { TreeItem } from '@nuxt/ui'

interface Props {
    defaultFile?: string
    rootPath?: string
    tree: any[]
}

const {
    defaultFile = '',
    rootPath = '',
    tree = [],
} = defineProps<Props>();

const initialPath = defaultFile ? (rootPath ? `${rootPath}/${defaultFile}` : defaultFile) : '';

const { mdcCode, loadFilesByPath } = useComponentCode({
    paths: initialPath ? [initialPath] : [],
    format: 'collapse'
});

const selectedFileCode = computed(() => mdcCode.value);

async function loadFile(filePath: string) {
    await loadFilesByPath([filePath]);
}

function fileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase()
    switch (ext) {
        case 'css': return 'i-vscode-icons-file-type-css'
        case 'ts': return 'i-vscode-icons-file-type-typescript'
        case 'js': return 'i-vscode-icons-file-type-js'
        case 'vue': return 'i-vscode-icons-file-type-vue'
        case 'json': return 'i-vscode-icons-file-type-json'
        case 'scss': return 'i-vscode-icons-file-type-scss'
        case 'md': return 'i-vscode-icons-file-type-markdown'
        default: return 'i-vscode-icons-file-type-text'
    }
}

function folderIcon() {
    return 'i-vscode-icons-folder-type-src-opened'
}

function mapTree(input: any[], parentPath = ''): TreeItem[] {
    return input.flatMap((item) => {
        if (typeof item === 'string') {
            return {
                label: item,
                type: 'file',
                icon: fileIcon(item),
                path: parentPath ? `${parentPath}/${item}` : item
            } as any
        }
        return Object.entries(item)?.map(([name, children]) => {
            const currentPath = parentPath ? `${parentPath}/${name}` : name
            return {
                label: name,
                type: 'folder',
                icon: folderIcon(),
                defaultExpanded: true,
                children: Array.isArray(children) ? mapTree(children, currentPath) : []
            }
        })
    })
}

const items = computed(() => mapTree(tree, rootPath))

async function onToggle(e: TreeItemToggleEvent<TreeItem>, item: any) {
    if (item.type === 'file' && item.path) {
        await loadFile(item.path)
    }
}
</script>

<template>
    <div
        class="not-prose my-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-zinc-950">
        <div class="flex h-[500px] flex-col md:flex-row">
            <!-- Left Sidebar: File Tree -->
            <div
                class="w-full border-b border-gray-200 bg-gray-50/50 p-4 md:w-64 md:border-b-0 md:border-r dark:border-gray-800 dark:bg-zinc-900/50">
                <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Files
                </div>
                <div class="h-full overflow-y-auto no-scrollbar">
                    <UTree propagate-select bubble-select virtualize :items="items" @toggle="onToggle" :ui="{
                        trigger: 'hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors px-2 py-1',
                        label: 'text-sm'
                    }" />
                </div>
            </div>

            <!-- Right Content: Code Viewer -->
            <div class="relative min-w-0 flex-1 bg-white dark:bg-zinc-950">
                <div class="h-full overflow-y-auto p-4 custom-scrollbar">
                    <MDC v-if="selectedFileCode" :key="selectedFileCode" :value="selectedFileCode"
                        class="prose-sm prose-zinc dark:prose-invert max-w-none" />
                    <div v-else class="flex h-full items-center justify-center text-gray-400 dark:text-zinc-600">
                        Select a file to view its content
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 3px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #27272a;
}.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}/* 隐藏 UTree 默认可能带有的外层样式影响 */
:deep(.prose pre) {
    margin: 0 !important;
    background-color: transparent !important;
}
</style>
