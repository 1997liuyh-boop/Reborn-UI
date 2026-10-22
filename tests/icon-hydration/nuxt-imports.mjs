import { shallowRef } from "vue";

export { defineComponent, onServerPrefetch } from "vue";

export const state = {};
export const useAppConfig = () => ({ icon: state.options });
export const useRuntimeConfig = () => ({ app: { baseURL: "/" } });
export const useNuxtApp = () => ({ payload: state.payload });
export const defineNuxtPlugin = value => value;
export const defineCachedEventHandler = handler => handler;
export const getRequestURL = event => new URL(event.url, "http://localhost");

// 只替代 Nuxt 的上下文与请求去重，图标加载、缓存及渲染均使用真实运行时代码。
export async function useAsyncData(key, handler) {
  state.pending[key] ??= handler().then((data) => {
    state.payload.data[key] = data;
    return { data: shallowRef(data) };
  });
  return state.pending[key];
}
