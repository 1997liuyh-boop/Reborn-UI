import type { Collections, DocsCollectionItem } from '@nuxt/content'
import type { MaybeRefOrGetter } from 'vue'
import { findPageHeadline } from '@nuxt/content/utils'
import { kebabCase } from 'scule'
import { navigationKey } from '~/utils/docsNavigation'
import { addPrerenderPath } from '~/utils/prerender'

/** 文档页面共用取数、错误处理与标题派生，页面自身决定 SEO 和布局。 */
export function useDocsPageData(collectionName: MaybeRefOrGetter<string>) {
  const route = useRoute()
  const navigation = inject(navigationKey, undefined)
  const collection = computed(() => toValue(collectionName) as keyof Collections)
  const key = computed(() => `content-${collection.value}-${kebabCase(route.path || 'index')}`)
  const pageRequest = useAsyncData(key, () => queryCollection(collection.value).path(route.path).first() as Promise<DocsCollectionItem | null>)
  const surroundRequest = useAsyncData(() => `${key.value}-surround`, () =>
    queryCollectionItemSurroundings(collection.value, route.path, { fields: ['description'] }),
  )
  const headline = computed(() => findPageHeadline(navigation?.value, pageRequest.data.value?.path))
  addPrerenderPath(`/raw${route.path}.md`)

  return Promise.all([pageRequest, surroundRequest]).then(() => {
    if (pageRequest.error.value) {
      throw createError({ statusCode: 500, statusMessage: pageRequest.error.value.message || 'Internal Server Error', fatal: true })
    }
    if (!pageRequest.data.value) {
      throw createError({ statusCode: 404, statusMessage: `Page not found: ${route.path} in collection ${collection.value}`, fatal: true })
    }
    return { page: pageRequest.data, surround: surroundRequest.data, headline }
  })
}
