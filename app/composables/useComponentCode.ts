import type { MaybeRefOrGetter } from 'vue'

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

/** 补齐默认值后的入参 */
interface ResolvedOptions {
  componentId: string
  componentFiles: string[]
  demoFile?: string
  type: 'ui' | 'examples' | 'configs'
  uniapp: boolean
  uniappFiles: string[]
  uniappComponentId?: string
  paths: string[]
  format: 'collapse' | 'group' | 'both' | 'none'
}

function resolveOptions(options: UseComponentCodeOptions = {}): ResolvedOptions {
  const paths = options.paths ?? []
  return {
    componentId: options.componentId ?? '',
    componentFiles: options.componentFiles ?? [],
    demoFile: options.demoFile,
    type: options.type ?? 'ui',
    uniapp: options.uniapp ?? false,
    uniappFiles: options.uniappFiles ?? [],
    uniappComponentId: options.uniappComponentId,
    paths: Array.isArray(paths) ? paths : [paths],
    format: options.format ?? 'both',
  }
}

/** kebab-case 转 PascalCase（reborn-button → RebornButton） */
function toPascalCase(id: string) {
  return id
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * 按文件路径或组件目录加载源码，产出供 MdcProse 渲染的 markdown 片段
 *
 * 入参可以是普通对象、ref 或 getter：传 getter（`() => ({ componentId, ... })`）时，
 * 其中任一值变化都会重新加载；源码只在客户端挂载后读取（源码分块只打进客户端构建）。
 * 每类加载都带请求令牌，先发出的慢请求返回时如果已有更新的请求，结果直接丢弃。
 */
export function useComponentCode(options: MaybeRefOrGetter<UseComponentCodeOptions>) {
  const resolved = computed(() => resolveOptions(toValue(options)))

  const componentsList = shallowRef<ComponentCodeItem[]>([])
  const componentCode = shallowRef<string>('')
  const demoCode = shallowRef<string>('')
  const uniappCode = shallowRef<string>('')
  /** demo 原始源码（未包 markdown 围栏），供展示卡片抽取分组、复制与询问 AI 使用 */
  const demoRawCode = shallowRef<string>('')
  /** UniApp demo 原始源码 */
  const uniappRawCode = shallowRef<string>('')
  /** UniApp demo 文件名（约定 <PascalCase>Demo.vue） */
  const uniappDemoFile = shallowRef<string>('')
  const uniappComponentCode = shallowRef<string>('')
  const mdcCode = shallowRef<string>('')
  /** 进行中的加载任务数：多个任务并发时，全部结束才算加载完成 */
  const pending = shallowRef(0)
  const isLoading = computed(() => pending.value > 0)
  const error = shallowRef<Error | null>(null)
  const { $prettier } = useNuxtApp() as any

  /** 最近一次按路径加载的令牌：loadFilesByPath 可被调用方连续调用（文件树快速切换） */
  let filesRequest = 0
  /** 最近一次整体加载的令牌：入参变化会重新加载组件、demo 与 UniApp 源码 */
  let allRequest = 0

  /** 计入加载中，任务结束（无论成败）后扣回 */
  async function track<T>(task: () => Promise<T>): Promise<T> {
    pending.value++
    try {
      return await task()
    }
    finally {
      pending.value--
    }
  }

  function loadFilesByPath(paths?: string | string[]) {
    const token = ++filesRequest
    const opts = resolved.value
    const pathList = paths === undefined ? opts.paths : (Array.isArray(paths) ? paths : [paths])
    /** 只有最近一次请求的结果可以写入，之前的慢请求返回时直接丢弃 */
    const isLatest = () => token === filesRequest

    if (pathList.length === 0) {
      mdcCode.value = ''
      return Promise.resolve()
    }

    return track(async () => {
      error.value = null
      try {
        const results = await Promise.all(
          pathList.map(async (path): Promise<ComponentCodeItem | null> => {
            const codeGetter = getComponentCode({
              fileName: path,
              type: 'all',
            })

            if (codeGetter) {
              try {
                const result = await codeGetter()
                let code = (result as any).default || result
                const fileName = path.split('/').pop() || path
                const ext = fileName.split('.').at(-1) || 'ts'

                // 样式文件先格式化再展示
                if (['css', 'scss', 'less'].includes(ext) && $prettier) {
                  try {
                    code = await $prettier.format(code, {
                      parser: 'css',
                      trailingComma: 'none',
                      semi: false,
                      singleQuote: true,
                      printWidth: 100,
                    })
                  }
                  catch (e) {
                    console.warn('Prettier formatting failed', e)
                  }
                }

                return {
                  fileName,
                  ext,
                  code,
                  path,
                }
              }
              catch (e) {
                console.error(`Failed to load code for ${path}:`, e)
                return null
              }
            }
            return null
          }),
        )

        // 已有更新的请求：本次结果作废，避免覆盖后发出、先返回的那次
        if (!isLatest()) return

        const validFiles = results.filter((f): f is ComponentCodeItem => f !== null)

        let content = ''
        if (validFiles.length === 1) {
          const f = validFiles[0]!
          content = `\`\`\`${f.ext} [${f.fileName}]\n${f.code}\n\`\`\``
        }
        else if (validFiles.length > 1) {
          content = '::code-group\n'
          validFiles.forEach((f) => {
            content += `\`\`\`${f.ext} [${f.fileName}]\n${f.code}\n\`\`\`\n`
          })
          content += '::'
        }

        if ((opts.format === 'collapse' || opts.format === 'both') && content) {
          mdcCode.value = `::code-collapse\n${content}\n::`
        }
        else {
          mdcCode.value = content
        }
      }
      catch (e) {
        if (isLatest()) error.value = e as Error
      }
    })
  }

  async function loadDemoCode(opts: ResolvedOptions, isLatest: () => boolean) {
    const { demoFile, componentId } = opts
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
        if (!isLatest()) return
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
    }
    catch (e) {
      if (isLatest()) error.value = e as Error
      console.error('Failed to load demo code:', e)
    }
  }

  async function loadComponentCodes(opts: ResolvedOptions, isLatest: () => boolean) {
    const { componentFiles, componentId, type } = opts
    if (componentFiles.length === 0) {
      componentsList.value = []
      componentCode.value = ''
      return
    }

    try {
      const results = await Promise.all(componentFiles.map(async (fileName) => {
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
      }))
      if (!isLatest()) return

      const list = results.filter((item): item is ComponentCodeItem => item !== null)
      componentsList.value = list

      // 拼成 code-group 片段
      componentCode.value = `
::code-group
${list.map(item => `\`\`\`${item.ext} [${item.fileName}]\n${item.code}\n\`\`\`\n`).join('\n')}
::`
    }
    catch (e) {
      if (isLatest()) error.value = e as Error
      console.error('Failed to load component codes:', e)
    }
  }

  async function loadUniappCode(opts: ResolvedOptions, isLatest: () => boolean) {
    const { uniapp, uniappComponentId } = opts
    if (!uniapp || !uniappComponentId) {
      uniappCode.value = ''
      uniappRawCode.value = ''
      uniappDemoFile.value = ''
      return
    }

    try {
      // 只加载 packages/uniapp-project/src/pages/{uniappComponentId}/ 下的 demo 页面
      const demoFileName = `${toPascalCase(uniappComponentId)}Demo.vue`
      const demoCodeGetter = getComponentCode({
        id: uniappComponentId,
        fileName: demoFileName,
        type: 'uniapp-pages',
      })

      if (demoCodeGetter) {
        try {
          const code = (await demoCodeGetter()) as unknown as string
          if (!isLatest()) return
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
        }
        catch (e) {
          if (!isLatest()) return
          uniappCode.value = '## UniApp Component Usage\n\nNo UniApp demo file found.'
          console.error('Failed to load UniApp demo:', e)
        }
      }
      else {
        uniappCode.value = '## UniApp Component Usage\n\nNo UniApp demo file found.'
      }
    }
    catch (e) {
      if (isLatest()) error.value = e as Error
      console.error('Failed to load UniApp code:', e)
    }
  }

  async function loadUniappComponentCode(opts: ResolvedOptions, isLatest: () => boolean) {
    const { uniapp, uniappComponentId, uniappFiles, componentFiles } = opts
    if (!uniapp || !uniappComponentId) {
      uniappComponentCode.value = ''
      return
    }

    try {
      const uniappComponentCodeItems: ComponentCodeItem[] = []

      let targetFiles = uniappFiles.length ? uniappFiles : componentFiles
      // 未指定文件时回退到约定的默认文件
      if (targetFiles.length === 0) {
        targetFiles = [
          `${toPascalCase(uniappComponentId)}.vue`,
          'index.ts',
          `${uniappComponentId}.config.ts`,
        ]
      }

      for (const fileName of targetFiles) {
        // 处理相对路径（如 "../reborn-form-item/RebornFormItem.vue"）：拆出真正的目录 id 与文件名
        let targetId = uniappComponentId
        let targetFileName = fileName

        if (fileName.includes('/')) {
          const parts = fileName.split('/')
          targetFileName = parts.pop()!
          // 目录结构约定为 packages/uniapp-project/src/components/{componentId}/
          const folderName = parts[parts.length - 1]
          if (folderName && folderName !== '..') {
            targetId = folderName
          }
        }
        else if (targetFileName.toLowerCase().startsWith('reborn')) {
          // 平铺的文件名按组件名反推目录 id（RebornButton.vue → reborn-button）
          const baseName = targetFileName.split('.')[0]
          if (baseName) {
            targetId = baseName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
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
          }
          catch {
            // 文件不存在，跳过
          }
        }
      }
      if (!isLatest()) return

      // 拼成 code-group 片段
      if (uniappComponentCodeItems.length > 0) {
        uniappComponentCode.value = `
::code-group
${uniappComponentCodeItems.map(item => `\`\`\`${item.ext} [${item.fileName}]\n${item.code}\n\`\`\`\n`).join('\n')}
::`
      }
      else {
        uniappComponentCode.value = ''
      }
    }
    catch (e) {
      if (isLatest()) error.value = e as Error
      console.error('Failed to load UniApp component code:', e)
    }
  }

  function loadAll() {
    const token = ++allRequest
    const opts = resolved.value
    const isLatest = () => token === allRequest
    error.value = null
    return Promise.all([
      track(() => loadDemoCode(opts, isLatest)),
      track(() => loadComponentCodes(opts, isLatest)),
      track(() => loadUniappCode(opts, isLatest)),
      track(() => loadUniappComponentCode(opts, isLatest)),
      loadFilesByPath(),
    ]).then(() => {})
  }

  // 源码分块只打进客户端构建：挂载后首次加载，之后入参内容变化时重新加载
  onMounted(() => {
    watch(() => JSON.stringify(resolved.value), () => {
      void loadAll()
    }, { immediate: true })
  })

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
    isLoading,
    error: readonly(error),
    reload: loadAll,
    loadFilesByPath,
  }
}
