import { normalizeThemeColor, themeColorBootstrap, themeColors } from '~/utils/themeColor'

export default defineNuxtPlugin(() => {
  // 不给默认值：服务端渲染结束时 useCookie 会把「与请求不同」的值写回 Set-Cookie，
  // 带默认值会让新访客的每个 SSR 响应都种下 theme-color=blue（共享缓存因此不缓存，也分不清「没选过」与「选了品牌蓝」）。
  // 缺省时由 normalizeThemeColor 回落品牌蓝，只有用户真正切换时才写 cookie
  const cookie = useCookie<string | undefined>('theme-color')
  const themeColor = useThemeColor()
  themeColor.value = normalizeThemeColor(cookie.value)

  useHead({
    htmlAttrs: {
      'data-theme-color': computed(() => themeColors.find(color => color.name === themeColor.value)!.preset),
    },
    script: [{ key: 'theme-color-bootstrap', innerHTML: themeColorBootstrap, tagPosition: 'head', tagPriority: 'critical' }],
  })

  watch(themeColor, value => { cookie.value = normalizeThemeColor(value) })
})
