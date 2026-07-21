import { defineNuxtPlugin } from '#imports';
import { vLoading } from '~/directives/loading';

/**
 * 注册 v-loading 指令
 * 插件在服务端与客户端同时注册（避免 SSR 渲染时报「无法解析指令」告警），
 * 指令自身通过 getSSRProps 保证服务端零输出，DOM 操作全部在客户端钩子中执行。
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('loading', vLoading);
});
