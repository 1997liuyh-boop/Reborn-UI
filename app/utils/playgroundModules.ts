/**
 * Playground 可导入模块的收集与注册
 *
 * 演示代码常从组件 config 里导入常量（如 radioColors / buttonSizes），
 * 这里用 glob 把全部组件 config 一次性收集并注册进 playgroundCode 的
 * 模块注册表，使这类 import 在 Playground 里可以真实解析。
 *
 * 该文件只被 /playground 页面引用：glob 产生的体积只进 playground 分包，
 * 不影响文档页。
 */

import { registerPlaygroundModules } from "./playgroundCode";

/** 收集全部组件 config 模块（eager：注册表需要同步可用） */
const configModules = import.meta.glob("../components/reborn/ui/**/*.config.ts", { eager: true }) as Record<
    string,
    Record<string, unknown>
>;

/** 是否已注册过（模块级单例，重复调用直接跳过） */
let installed = false;

/** 把收集到的模块按演示代码的书写形式（~/components/... 前缀）注册进编译器 */
export function installPlaygroundModules(): void {
    if (installed) return;
    installed = true;

    const mods: Record<string, Record<string, unknown>> = {};
    for (const [path, mod] of Object.entries(configModules)) {
        // glob key 形如 ../components/reborn/ui/reborn-radio/reborn-radio.config.ts
        const rel = path.replace(/^(?:\.\.\/)+/, "");
        mods[`~/${rel}`] = mod;
        mods[`~~/app/${rel}`] = mod;
        mods[`@/${rel}`] = mod;
    }
    registerPlaygroundModules(mods);
}
