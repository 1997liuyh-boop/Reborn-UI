export interface DependencyInfo {
    components?: string[];
    npmDependencies?: string[];
}

export const DEPENDENCY_MAP: Record<string, DependencyInfo> = {
    // UniApp 版本的 Reborn Select 需要特定的前置组件和 lodash-es
    "reborn-select/uniapp": {
        components: ["reborn-button", "reborn-picker-view", "reborn-popup", "reborn-select-trigger"],
        npmDependencies: ["lodash-es", "@types/lodash-es"],
    },
    "reborn-select-date/uniapp": {
        components: ["reborn-button", "reborn-picker-view", "reborn-popup", "reborn-select-trigger"],
        npmDependencies: ["lodash-es", "@types/lodash-es"],
    },
    // 在此处添加其他已知的依赖映射
};

/**
 * 递归解析组件和 npm 依赖
 * @param componentName 例如 "reborn-select/web" 或 "reborn-select/uniapp"
 * @param platform 例如 "web" | "uniapp"
 */
export function getDependencies(componentName: string, platform?: "web" | "uniapp"): DependencyInfo {
    const result: DependencyInfo = { components: [], npmDependencies: [] };
    const visited = new Set<string>();

    function resolve(name: string) {
        const keyWithPlatform = platform ? `${name}/${platform}` : name;

        // 首先检查是否存在特定平台的映射
        const deps = DEPENDENCY_MAP[keyWithPlatform] || DEPENDENCY_MAP[name];
        if (!deps) return;

        if (deps.components) {
            for (const comp of deps.components) {
                if (!visited.has(comp)) {
                    visited.add(comp);
                    result.components!.push(comp);
                    resolve(comp); // 递归解析依赖
                }
            }
        }

        if (deps.npmDependencies) {
            for (const npmDep of deps.npmDependencies) {
                if (!result.npmDependencies!.includes(npmDep)) {
                    result.npmDependencies!.push(npmDep);
                }
            }
        }
    }

    resolve(componentName);

    return result;
}
