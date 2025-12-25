// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  
components: true, // 开启默认自动全局注册
  devtools: { enabled: true },
  extends: ['shadcn-docs-nuxt'],
  i18n: {
    defaultLocale: 'en',
    locales: [
      {
        code: 'en',
        name: 'English',
        language: 'en-US',
      },
    ],
  },
  compatibilityDate: '2024-07-06',
});
