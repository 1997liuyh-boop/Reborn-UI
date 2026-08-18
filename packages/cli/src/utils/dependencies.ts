import type { RegistryComponent } from "../types.js";
import { extractNpmDependenciesFromText } from "./imports.js";

export interface ResolvedDependencies {
    components: string[]; // 需要一并安装的前置组件（按发现顺序）
    npmDependencies: string[]; // 需要安装的 npm 依赖
}

// 无法从 import 语句推断的补充依赖（如运行时包对应的类型包）
const EXTRA_NPM_DEPS: Record<string, string[]> = {
    "lodash-es": ["@types/lodash-es"],
};

// 匹配组件间引用，两种写法：
// 1. 别名形式：@/components/<组件名>/...
// 2. 相对形式：../<组件名>/...（组件目录互为兄弟目录）
const COMPONENT_IMPORT_RE = /["'](?:@\/components|\.\.)\/([a-zA-Z0-9-]+)\//g;

/**
 * 取出组件在指定平台下会被安装的文件
 * 规则与 add 的写盘过滤一致：无 target 视为通用文件，两个平台都算
 */
function filesForPlatform(component: RegistryComponent, platform: "web" | "uniapp") {
    return component.files.filter((f) => !f.target || f.target === platform);
}

/**
 * 基于 registry 内容解析依赖（替代旧的手写映射表）
 * - 组件依赖：扫描平台内文件的 `@/components/xxx` 引用，递归收集
 * - npm 依赖：对平台内文件重新抽取 import，避免 registry 里 web/uniapp 依赖混在一起
 */
export function resolveDependencies(params: {
    registryComponents: RegistryComponent[];
    targets: string[];
    platform: "web" | "uniapp";
}): ResolvedDependencies {
    const { registryComponents, targets, platform } = params;
    const byName = new Map(registryComponents.map((c) => [c.name, c]));

    const visited = new Set<string>(targets);
    const components: string[] = [];
    const npmDeps = new Set<string>();

    const queue = [...targets];
    while (queue.length > 0) {
        const name = queue.shift()!;
        const component = byName.get(name);
        if (!component) continue; // 不存在的组件由 add 的主流程报错，这里跳过

        for (const f of filesForPlatform(component, platform)) {
            const ext = f.path.slice(f.path.lastIndexOf(".")).toLowerCase();
            if (![".ts", ".js", ".vue"].includes(ext)) continue;

            // 组件间引用 → 前置组件
            for (const match of f.content.matchAll(COMPONENT_IMPORT_RE)) {
                const dep = match[1];
                if (!dep || dep === name || !byName.has(dep)) continue;
                if (!visited.has(dep)) {
                    visited.add(dep);
                    components.push(dep);
                    queue.push(dep); // 递归解析前置组件自身的依赖
                }
            }

            // npm 依赖（按平台文件重新抽取，比 registry 的全平台并集更精确）
            for (const dep of extractNpmDependenciesFromText(f.content)) {
                npmDeps.add(dep);
            }
        }
    }

    // 补充类型包等无法从 import 推断的依赖（先快照，避免边遍历边插入）
    const snapshot = Array.from(npmDeps);
    for (const dep of snapshot) {
        for (const extra of EXTRA_NPM_DEPS[dep] ?? []) {
            npmDeps.add(extra);
        }
    }

    return { components, npmDependencies: [...npmDeps].sort() };
}
