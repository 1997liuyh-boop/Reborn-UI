<script setup lang="ts">
import type { TreeItemToggleEvent } from 'reka-ui'
import type { TreeItem } from '@nuxt/ui'

interface Props {
    defaultFile?: string
    tree: TreeItem[]
}

const {
    defaultFile = 'assets/css/main.css',
    tree = [],
} = defineProps<Props>();

const files = import.meta.glob('~/assets/**/*.css', { query: '?raw', import: 'default', eager: true })
const selectedFileCode = ref<string>("")
const { $prettier } = useNuxtApp()


async function loadFile(filePath: string) {
    const content = Object.entries(files).find(([path]) => path.endsWith(filePath))?.[1]

    if (content) {

        try {
            let formatted = content as string
            formatted = await $prettier.format(formatted, {
                parser: 'css',
                trailingComma: 'none',
                semi: false,
                singleQuote: true,
                printWidth: 100
            })
            const filename = filePath.split('/').pop() || ''
            const ext = filename.split('.').pop() || 'css'

            formatted = `

::code-collapse

\`\`\`${ext} [${filename}]
${formatted}
\`\`\`

::
    `;
            selectedFileCode.value = formatted
        } catch (e) {
            console.warn('Prettier formatting failed', e)
            selectedFileCode.value = ''
        }


    } else {
        // Fallback or clear
        selectedFileCode.value = `File content not found for path: ${filePath}`
    }
}

onMounted(() => {
    if (defaultFile) {
        loadFile(defaultFile)
    }
})

function fileIcon(name: string) {
    if (name.endsWith('.css')) return 'i-vscode-icons-file-type-css'
    if (name.endsWith('.ts')) return 'i-vscode-icons-file-type-typescript'
    if (name.endsWith('.vue')) return 'i-vscode-icons-file-type-vue'
    if (name.endsWith('.json')) return 'i-vscode-icons-file-type-json'
    return 'i-vscode-icons-file-type-text'
}

function folderIcon() {
    return 'i-vscode-icons-folder-type-css-opened'
}

function mapTree(
    input: Array<Record<string, any>>
): TreeItem[] {
    return input.flatMap((node) =>
        Object.entries(node).map(([folderName, folderChildren]) => {
            const children: TreeItem[] = folderChildren.flatMap(
                (child: Record<string, any>) =>
                    Object.entries(child).map(([name, value]) => {
                        if (Array.isArray(value)) {
                            return {
                                label: `${name}`,
                                type: 'folder',
                                icon: folderIcon(),
                                defaultExpanded: true,
                                children: value.map((file: string) => ({
                                    label: file,
                                    type: 'file',
                                    icon: fileIcon(file),
                                    path: `${folderName}/${name}/${file}`
                                })),
                            }
                        }
                        return []
                    })
            )

            return {
                label: `${folderName}`,
                type: 'folder',
                icon: folderIcon(),
                defaultExpanded: true,
                children,
            }
        })
    )
}

const items = computed(() => mapTree(tree))

async function onToggle(e: TreeItemToggleEvent<TreeItem>, item: TreeItem & { path?: string }) {
    if (item.type === 'file' && item.path) {
        await loadFile(item.path)
    }
}
</script>

<template>
    <div class="grid grid-cols-4 gap-4 no-scrollbar">
        <UTree propagate-select bubble-select virtualize :items="items" @toggle="onToggle" />

        <MDC :key="selectedFileCode" :value="selectedFileCode" class="col-span-3" />
    </div>
</template>
