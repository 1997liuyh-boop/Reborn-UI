export interface UseComponentCodeOptions {
  componentId?: string
  componentFiles?: string[]
  demoFile?: string
  type?: 'ui' | 'examples' | 'configs'
  uniapp?: boolean
  uniappFiles?: string[]
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
    uniappFiles = [],
    uniappComponentId,
    paths: initialPaths = [],
    format = 'both'
  } = options
  const componentsList = ref<ComponentCodeItem[]>([])
  const componentCode = ref<string>('')
  const demoCode = ref<string>('')
  const uniappCode = ref<string>('')
  /** demo 原始源码（未包 markdown 围栏），供展示卡片抽取分组、复制与询问 AI 使用 */
  const demoRawCode = ref<string>('')
  /** UniApp demo 原始源码 */
  const uniappRawCode = ref<string>('')
  /** UniApp demo 文件名（约定 <PascalCase>Demo.vue） */
  const uniappDemoFile = ref<string>('')
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
        pathList?.map(async (path) => {
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
      demoRawCode.value = ''
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
        demoRawCode.value = code

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
      const promises = componentFiles?.map(async (fileName) => {
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
${componentsList.value?.map((item) => `\`\`\`${item.ext} [${item.fileName}]\n${item.code}\n\`\`\`\n`).join('\n')}
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
      uniappRawCode.value = ''
      uniappDemoFile.value = ''
      return
    }

    try {
      // Convert kebab-case to PascalCase (e.g., reborn-button -> RebornButton)
      const pascalCaseName = uniappComponentId
        .split('-')
        ?.map(part => part.charAt(0).toUpperCase() + part.slice(1))
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
          uniappRawCode.value = code
          uniappDemoFile.value = demoFileName

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
      const uniappComponentCodeItems: ComponentCodeItem[] = []

      // Convert kebab-case to PascalCase (e.g., reborn-button -> RebornButton)
      const pascalCaseName = uniappComponentId
        .split('-')
        ?.map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')

      let targetFiles = uniappFiles?.length ? uniappFiles : componentFiles;
      // If no componentFiles provided, fallback to default files
      if (!targetFiles || targetFiles.length === 0) {
        targetFiles = [
          `${pascalCaseName}.vue`,
          'index.ts',
          `${uniappComponentId}.config.ts`
        ]
      }

      for (const fileName of targetFiles) {
        // Handle relative paths (e.g. "../reborn-form-item/RebornFormItem.vue")
        // We need to determine the correct ID (folder) and filename
        let targetId = uniappComponentId;
        let targetFileName = fileName;

        if (fileName.includes('/')) {
          const parts = fileName.split('/');
          targetFileName = parts.pop()!; // Get the file name
          // If it's a relative path like "../reborn-form-item/RebornFormItem.vue"
          // We need to resolve the correct component ID (folder name)
          // Assuming the structure is consistent with packages/uniapp-project/src/components/{componentId}/
          const folderName = parts[parts.length - 1];
          if (folderName && folderName !== '..') {
            targetId = folderName;
          }
        } else if (targetFileName.toLowerCase().startsWith('reborn')) {
          // Auto-resolve component ID from flat file name (e.g., RebornButton.vue -> reborn-button)
          const baseName = targetFileName.split('.')[0];
          if (baseName) {
            targetId = baseName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
          }
        }

        const codeGetter = getComponentCode({
          id: targetId,
          fileName: targetFileName,
          type: 'uniapp-components',
        })

        if (codeGetter) {
          try {
            const code = (await codeGetter()) as unknown as string
            uniappComponentCodeItems.push({
              fileName: targetFileName,
              ext: targetFileName.split('.').at(-1)!,
              code,
            })
          } catch {
            // File doesn't exist, skip
          }
        }
      }

      // Format as code-group markdown
      if (uniappComponentCodeItems.length > 0) {
        uniappComponentCode.value = `
::code-group
${uniappComponentCodeItems?.map((item) => `\`\`\`${item.ext} [${item.fileName}]\n${item.code}\n\`\`\`\n`).join('\n')}
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
  watch(() => [componentFiles, uniappFiles, demoFile, initialPaths] as const, () => {
    loadAll()
  }, { deep: true })

  return {
    componentsList: readonly(componentsList),
    componentCode: readonly(componentCode),
    demoCode: readonly(demoCode),
    uniappCode: readonly(uniappCode),
    demoRawCode: readonly(demoRawCode),
    uniappRawCode: readonly(uniappRawCode),
    uniappDemoFile: readonly(uniappDemoFile),
    uniappComponentCode: readonly(uniappComponentCode),
    mdcCode: readonly(mdcCode),
    isLoading: readonly(isLoading),
    error: readonly(error),
    reload: loadAll,
    loadFilesByPath
  }
}
