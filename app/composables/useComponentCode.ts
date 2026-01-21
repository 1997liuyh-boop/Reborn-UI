export interface UseComponentCodeOptions {
  componentId: string
  componentFiles?: string[]
  demoFile?: string
  type?: 'ui' | 'examples' | 'configs'
}

export interface ComponentCodeItem {
  fileName: string
  ext: string
  code: string
}

export function useComponentCode(options: UseComponentCodeOptions) {
  const { componentId, componentFiles = [], demoFile, type = 'ui' } = options

  const componentsList = ref<ComponentCodeItem[]>([])
  const componentCode = ref<string>('')
  const demoCode = ref<string>('')
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function loadDemoCode() {
    if (!demoFile) {
      demoCode.value = ''
      return
    }

    try {
      const codeGetter = getComponentCode({
        fileName: demoFile,
        id: componentId,
        type: 'examples',
      })

      if (codeGetter) {
        const code = (await codeGetter()) as unknown as string
        const fileExt = demoFile.split('.').at(-1)
        
        demoCode.value = `
## Component Usage


::code-collapse

\`\`\`${fileExt} [${demoFile}]
${code}
\`\`\`

::
        `
      }
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load demo code:', e)
    }
  }

  async function loadComponentCodes() {
    if (!componentFiles || componentFiles.length === 0) {
      componentCode.value = ''
      return
    }

    isLoading.value = true
    error.value = null
    componentsList.value = []

    try {
      const promises = componentFiles.map(async (fileName) => {
        const codeGetter = getComponentCode({
          fileName,
          id: componentId,
          type,
        })

        if (codeGetter) {
          const code = (await codeGetter()) as unknown as string
          return {
            fileName,
            ext: fileName.split('.').at(-1)!,
            code,
          }
        }
        return null
      })

      const results = await Promise.all(promises)
      componentsList.value = results.filter((item): item is ComponentCodeItem => item !== null)

      // Format as code-group markdown
      componentCode.value = `
::code-group
${componentsList.value.map((item) => `\`\`\`${item.ext} [${item.fileName}]\n${item.code}\n\`\`\`\n`).join('\n')}
::`
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load component codes:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function loadAll() {
    await Promise.all([
      loadDemoCode(),
      loadComponentCodes()
    ])
  }

  // Auto-load on mount
  onMounted(() => {
    loadAll()
  })

  // Watch for changes
  watch(() => [componentFiles, demoFile] as const, () => {
    loadAll()
  }, { deep: true })

  return {
    componentsList: readonly(componentsList),
    componentCode: readonly(componentCode),
    demoCode: readonly(demoCode),
    isLoading: readonly(isLoading),
    error: readonly(error),
    reload: loadAll,
  }
}
