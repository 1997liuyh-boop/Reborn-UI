export interface UseComponentCodeOptions {
  componentId?: string
  componentFiles?: string[]
  demoFile?: string
  type?: 'ui' | 'examples' | 'configs'
  uniapp?: boolean
  uniappComponentId?: string
  paths?: string | string[]
  format?: 'collapse' | 'group' | 'both' | 'none'
}

export interface ComponentCodeItem {
  fileName: string
  ext: string
  code: string
  path?: string
}

export function useComponentCode(options: UseComponentCodeOptions) {
  const { 
    componentId = '', 
    componentFiles = [], 
    demoFile, 
    type = 'ui', 
    uniapp = false, 
    uniappComponentId,
    paths: initialPaths = [],
    format = 'both'
  } = options

  const componentsList = ref<ComponentCodeItem[]>([])
  const componentCode = ref<string>('')
  const demoCode = ref<string>('')
  const uniappCode = ref<string>('')
  const uniappComponentCode = ref<string>('')
  const mdcCode = ref<string>('')
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const { $prettier } = useNuxtApp() as any

  async function loadFilesByPath(paths?: string | string[]) {
    const targetPaths = paths || (Array.isArray(initialPaths) ? initialPaths : [initialPaths])
    const pathList = Array.isArray(targetPaths) ? targetPaths : [targetPaths]
    
    if (pathList.length === 0) {
      mdcCode.value = ''
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const results = await Promise.all(
        pathList.map(async (path) => {
          const codeGetter = getComponentCode({
            fileName: path,
            type: 'all',
          })

          if (codeGetter) {
            try {
              const result = await codeGetter()
              let code = (result as any).default || result
              const fileName = path.split("/").pop() || path
              const ext = fileName.split(".").at(-1) || "ts"

              // Formatting for CSS/SCSS
              if (['css', 'scss', 'less'].includes(ext) && $prettier) {
                try {
                  code = await $prettier.format(code, {
                    parser: 'css',
                    trailingComma: 'none',
                    semi: false,
                    singleQuote: true,
                    printWidth: 100
                  })
                } catch (e) {
                  console.warn('Prettier formatting failed', e)
                }
              }

              return {
                fileName,
                ext,
                code,
                path
              }
            } catch (e) {
              console.error(`Failed to load code for ${path}:`, e)
              return null
            }
          }
          return null
        })
      )

      const validFiles = results.filter((f): f is ComponentCodeItem => f !== null)
      
      let content = ""
      if (validFiles.length === 1) {
        const f = validFiles[0]!
        content = `\`\`\`${f.ext} [${f.fileName}]\n${f.code}\n\`\`\``
      } else if (validFiles.length > 1) {
        content = "::code-group\n"
        validFiles.forEach((f) => {
          content += `\`\`\`${f.ext} [${f.fileName}]\n${f.code}\n\`\`\`\n`
        })
        content += "::"
      }

      if ((format === 'collapse' || format === 'both') && content) {
        mdcCode.value = `::code-collapse\n${content}\n::`
      } else {
        mdcCode.value = content
      }
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  async function loadDemoCode() {
    if (!demoFile || !componentId) {
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

  async function loadUniappCode() {
    if (!uniapp || !uniappComponentId) {
      uniappCode.value = ''
      return
    }

    try {
      // Convert kebab-case to PascalCase (e.g., reborn-button -> RebornButton)
      const pascalCaseName = uniappComponentId
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
      
      // Only load demo page file from packages/uniapp-project/src/pages/{uniappComponentId}/
      const demoFileName = `${pascalCaseName}Demo.vue`
      const demoCodeGetter = getComponentCode({
        id: uniappComponentId,
        fileName: demoFileName,
        type: 'uniapp-pages',
      })
      
      if (demoCodeGetter) {
        try {
          const code = (await demoCodeGetter()) as unknown as string
          const fileExt = demoFileName.split('.').at(-1)
          
          uniappCode.value = `
## UniApp Component Usage

::code-collapse

\`\`\`${fileExt} [${demoFileName}]
${code}
\`\`\`

::
          `
        } catch (e) {
          uniappCode.value = '## UniApp Component Usage\n\nNo UniApp demo file found.'
          console.error('Failed to load UniApp demo:', e)
        }
      } else {
        uniappCode.value = '## UniApp Component Usage\n\nNo UniApp demo file found.'
      }
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load UniApp code:', e)
    }
  }

  async function loadUniappComponentCode() {
    if (!uniapp || !uniappComponentId) {
      uniappComponentCode.value = ''
      return
    }

    try {
      const uniappFiles: ComponentCodeItem[] = []
      
      // Convert kebab-case to PascalCase (e.g., reborn-button -> RebornButton)
      const pascalCaseName = uniappComponentId
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
      
      // Load component files from packages/uniapp-project/src/components/{uniappComponentId}/
      const componentFileNames = [
        `${pascalCaseName}.vue`,
        'index.ts',
        `${uniappComponentId}.config.ts`
      ]
      
      for (const fileName of componentFileNames) {
        const codeGetter = getComponentCode({
          id: uniappComponentId,
          fileName,
          type: 'uniapp-components',
        })
        
        if (codeGetter) {
          try {
            const code = (await codeGetter()) as unknown as string
            uniappFiles.push({
              fileName,
              ext: fileName.split('.').at(-1)!,
              code,
            })
          } catch {
            // File doesn't exist, skip
          }
        }
      }

      // Format as code-group markdown
      if (uniappFiles.length > 0) {
        uniappComponentCode.value = `
::code-group
${uniappFiles.map((item) => `\`\`\`${item.ext} [${item.fileName}]\n${item.code}\n\`\`\`\n`).join('\n')}
::`
      } else {
        uniappComponentCode.value = ''
      }
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load UniApp component code:', e)
    }
  }

  async function loadAll() {
    await Promise.all([
      loadDemoCode(),
      loadComponentCodes(),
      loadUniappCode(),
      loadUniappComponentCode(),
      loadFilesByPath()
    ])
  }

  // Auto-load on mount
  onMounted(() => {
    loadAll()
  })

  // Watch for changes
  watch(() => [componentFiles, demoFile, initialPaths] as const, () => {
    loadAll()
  }, { deep: true })

  return {
    componentsList: readonly(componentsList),
    componentCode: readonly(componentCode),
    demoCode: readonly(demoCode),
    uniappCode: readonly(uniappCode),
    uniappComponentCode: readonly(uniappComponentCode),
    mdcCode: readonly(mdcCode),
    isLoading: readonly(isLoading),
    error: readonly(error),
    reload: loadAll,
    loadFilesByPath
  }
}
