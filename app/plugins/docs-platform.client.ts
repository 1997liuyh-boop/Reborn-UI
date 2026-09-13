import { defineNuxtPlugin, onNuxtReady, watch } from "#imports";
import { DOCS_PLATFORM_STORAGE_KEY, isDocsPlatform, useDocsPlatform } from "~/composables/useDocsPlatform";

/**
 * 平台开关（Web / UniApp）的持久化
 *
 * 文档页会被预渲染成静态 HTML，服务端无法得知用户上次的选择，
 * 因此首屏一律按默认档位（web）输出，等水合完成（onNuxtReady）后再从
 * localStorage 恢复；之后的每次切换都写回 localStorage。
 * 直接在 setup 期恢复会让侧栏首帧与预渲染结果不一致，触发水合告警。
 */
export default defineNuxtPlugin(() => {
    const { platform, setPlatform } = useDocsPlatform();

    onNuxtReady(() => {
        try {
            const stored = localStorage.getItem(DOCS_PLATFORM_STORAGE_KEY);
            if (isDocsPlatform(stored)) setPlatform(stored);
        }
        catch {
            // 隐私模式等禁用 localStorage 的环境：保持默认档位即可
        }

        watch(platform, (value) => {
            try {
                localStorage.setItem(DOCS_PLATFORM_STORAGE_KEY, value);
            }
            catch {
                // 写入失败不影响本次会话内的切换
            }
        });
    });
});
