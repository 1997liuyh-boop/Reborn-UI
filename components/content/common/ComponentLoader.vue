<template>
  <div class="my-4 w-full space-y-8">
    <ClientOnly>
      <CodeGroup>
        <div label="预览" icon="lucide:laptop-minimal">
          <div class="w-full space-y-8">
            <client-only>
              <div v-if="component" ref="componentContainer">
                <div
                  :class="[props.class, { 'overflow-hidden': props.overflowHidden, 'dark:bg-neutral-950/50': props.elevated }]">
                  <component :is="component" v-bind="{ ...componentProps, ...componentEvents }">
                    <template v-for="slotName in Object.keys(slots || {})" :key="slotName" #[slotName]>
                      <slot :name="slotName" mdc-unwrap="p" />
                    </template>
                  </component>
                </div>
              </div>
            </client-only>
          </div>
        </div>
        <div label="code" icon="lucide:laptop-minimal">
          <MDCRenderer v-if="ast" :body="ast.body" :data="ast.data"
            class="[&_pre]:!rounded-t-none [&_div.my-5]:!mt-0" />
        </div>
      </CodeGroup>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { pascalCase, kebabCase } from 'scule';
import { hash } from 'ohash'
import json5 from 'json5'
import { get, set } from '../utils';


interface Props {
  prefix?: string;
  prose?: boolean;
  id?: string;
  componentName?: string;
  type?: string;
  label?: string;
  class?: string;
  icon?: string;
  slug?: string;
  /** 在脚本设置中需要外部化的属性列表 */
  external?: string[]
  /** 外部化属性的类型 */
  externalTypes?: string[]
  // 高亮行号
  highlights?: number[]
  // 是否启用 prettier
  prettier?: boolean;
  // 是否隐藏溢出
  overflowHidden?: boolean
  // 是否启用阴影
  elevated?: boolean
  /** 需要使用v-model的属性列表 */
  model?: string[]
  /** 可从代码和选择中进行类型转换的属性列表 */
  cast?: { [key: string]: string }
  /** 组件的属性列表 */
  props?: { [key: string]: any }
  /** 组件的插槽列表 */
  slots?: { [key: string]: any }
}

const route = useRoute()
const { $prettier } = useNuxtApp()

const rebornComponentModules = import.meta.glob('../reborn/**/*.vue') as Record<string, () => Promise<any>>
const props = withDefaults(defineProps<Props>(), {
  icon: "lucide:square-terminal",
});

// 使用真实 Vue slots（来自 MDC 组件块正文），用于向预览组件转发 slot 内容
const slots = useSlots()

const pascalName = computed(() => pascalCase(props.slug ?? route.path.split('/').pop() ?? ''))
const codeKey = computed(() => `component-code-${pascalName.value}-${hash(props)}`)
const code = computed(() => {
  let code = ''

  code += `\`\`\`vue${props.highlights?.length ? ` {${props.highlights.join('-')}}` : ''}`

  if (props.external?.length) {
    code += `
<script setup lang="ts">
`
    // Collect imports from cast types
    const importsBySource = new Map<string, Set<string>>()
    // Generate import statements
    for (const [source, names] of importsBySource) {
      code += `import { ${Array.from(names).join(', ')} } from '${source}'
`
    }

    if (props.externalTypes?.length) {
      const removeArrayBrackets = (type: string): string => type.endsWith('[]') ? removeArrayBrackets(type.slice(0, -2)) : type

      const types = props.externalTypes.map(type => removeArrayBrackets(type))
      code += `import type { ${types.join(', ')} } from '@nuxt/ui'
`
    }

    if (importsBySource.size > 0 || props.externalTypes?.length) {
      code += `
`
    }

    for (const [i, key] of props.external.entries()) {
      // const cast = props.cast?.[key]
      const value = json5.stringify(componentProps[key], null, 2)?.replace(/,([ |\t\n]+[}|\]])/g, '$1')
      const type = props.externalTypes?.[i] ? `<${props.externalTypes[i]}>` : ''
      const refType = 'ref'

      code += `const ${key === 'modelValue' ? 'value' : key} = ${refType}${type}(${value})
`
    }
    code += `<\/script>
`
  }

  code += `
<template>
  <${pascalName.value}`
  for (const [key, value] of Object.entries(componentProps)) {
    if (key === 'modelValue') {
      code += ` v-model="value"`
      continue
    }

    if (props.model?.includes(key)) {
      code += ` v-model:${key}="${key}"`
      continue
    }

    if (value === undefined || value === null || value === '') {
      continue
    }

    // const propDefault = prop && (prop.default ?? prop.tags?.find(tag => tag.name === 'defaultValue')?.text ?? componentTheme?.defaultVariants?.[prop.name])
    const name = kebabCase(key)

    if (typeof value === 'boolean') {

      code += value ? ` ${name}` : ` :${name}="false"`
    } else if (typeof value === 'object') {
      const parsedValue = !props.external?.includes(key) ? json5.stringify(value, null, 2).replace(/,([ |\t\n]+[}|\])])/g, '$1') : key

      code += ` :${name}="${parsedValue}"`
    } else {

      code += ` ${typeof value === 'number' ? ':' : ''}${name}="${value}"`
    }
  }

  if (props.slots) {
    code += `>`
    for (const [key, value] of Object.entries(props.slots)) {
      if (key === 'default') {
        code += props.slots.default
      } else {
        code += `
  <template #${key}>
    ${value}
  </template>\n`
      }
    }
    code += (Object.keys(props.slots).length > 1 ? '\n' : '') + `</${pascalName.value}>`
  } else {
    code += ' />'
  }
  code += `\n</template>
\`\`\`
`

  return code
})

const component = defineAsyncComponent(() => {
  const folder = props.componentName ?? props.id ?? route.path.split('/').pop() ?? ''
  console.log(route.path, folder, pascalName.value)
  const key = `../reborn/${folder}/${pascalName.value}.vue`
  const loader = rebornComponentModules[key]
  if (loader) return loader()

  // 兼容：有些页面可能未传 id，或目录名与路由段不同；尝试回退到路由段
  const fallbackFolder = route.path.split('/').pop() ?? ''
  const fallbackKey = `../reborn/${fallbackFolder}/${pascalName.value}.vue`
  const fallbackLoader = rebornComponentModules[fallbackKey]
  if (fallbackLoader) return fallbackLoader()

  // 让错误信息更友好，便于定位缺失的组件文件
  throw new Error(
    `[ComponentLoader] 找不到组件文件：尝试了 "${key}" 与 "${fallbackKey}"。请确认 markdown 传入的 id/slug 与 components/content/reborn 下的目录与文件名一致。`
  )
})

const componentProps = reactive({
  ...Object.fromEntries(Object.entries(props.props || {}).map(([key, value]) => {

    return [key, value]
  }))
})
const componentEvents = reactive({
  ...Object.fromEntries((props.model || []).map(key => [`onUpdate:${key}`, (e: any) => setComponentProp(key, e)])),
  ...(componentProps.modelValue ? { [`onUpdate:modelValue`]: (e: any) => setComponentProp('modelValue', e) } : {})
})


function getComponentProp(name: string) {
  return get(componentProps, name) ?? undefined
}

function setComponentProp(name: string, value: any) {
  set(componentProps, name, value)
}


const { data: ast } = await useAsyncData(codeKey, async () => {
  console.log(codeKey.value)
  if (!props.prettier) {
    return parseMarkdown(code.value)
  }

  let formatted = ''
  try {
    formatted = await $prettier.format(code.value, {
      trailingComma: 'none',
      semi: false,
      singleQuote: true,
      printWidth: 100
    })
  } catch {
    formatted = code.value
  }

  return parseMarkdown(formatted)
}, { watch: [code] })
</script>
