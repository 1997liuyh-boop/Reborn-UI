<script setup lang="ts">
import type { TreeItemToggleEvent } from 'reka-ui'
import type { TreeItem } from '@nuxt/ui'

interface Props {
    defaultFile?: string
    tree: any[]
}

const {
    defaultFile = '',
    tree = [],
} = defineProps<Props>();

// Glob all potential source files in the project
const files = import.meta.glob<string>([
    '~/assets/**/*.{css,scss,ts,js,vue,json}',
    '@/../packages/uniapp-project/src/**/*.{vue,ts,js,css,json,scss}'
], {
    query: '?raw',
    import: 'default',
    eager: true
})

const selectedFileCode = ref<string>("")
const { $prettier } = useNuxtApp()

async function loadFile(filePath: string) {
    // Try to find the file in the globbed files
    // The key might be relative or absolute, we check if it ends with the provided path
    const content = Object.entries(files).find(([path]) =>
        path.replaceAll('\\', '/').endsWith(filePath.replaceAll('\\', '/'))
    )?.[1]

    if (content) {
        try {
            let formatted = content as string
            const filename = filePath.split('/').pop() || ''
            const ext = filename.split('.').pop() || ''

            // Simple formatting for CSS
            if (['css', 'scss', 'less'].includes(ext)) {
                try {
                    formatted = await $prettier.format(formatted, {
                        parser: 'css',
                        trailingComma: 'none',
                        semi: false,
                        singleQuote: true,
                        printWidth: 100
                    })
                } catch (e) {
                    console.warn('Prettier CSS formatting failed', e)
                }
            }

            selectedFileCode.value = `
::code-collapse
\`\`\`${ext} [${filename}]
${formatted}
\`\`\`
::
    `;
        } catch (e) {
            console.warn('Processing file failed', e)
            selectedFileCode.value = content as string
        }
    } else {
        selectedFileCode.value = `File content not found for path: ${filePath}`
    }
}

onMounted(() => {
    if (defaultFile) {
        loadFile(defaultFile)
    }
})

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

const items = computed(() => mapTree(tree))

async function onToggle(e: TreeItemToggleEvent<TreeItem>, item: any) {
    if (item.type === 'file' && item.path) {
        await loadFile(item.path)
    }
}
</script>

<template>
    <div class="grid grid-cols-4 gap-4 no-scrollbar">
        <div class="col-span-1 border-r border-gray-200 dark:border-gray-800 pr-4">
            <UTree propagate-select bubble-select virtualize :items="items" @toggle="onToggle" />
        </div>

        <div class="col-span-3">
            <MDC :key="selectedFileCode" :value="selectedFileCode" />
        </div>
    </div>
</template>
