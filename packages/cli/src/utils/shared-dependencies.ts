import { posix } from "node:path";
import { TEMPLATES } from "../generated/templates.js";
import { extractNpmDependenciesFromText } from "./imports.js";

/** 沿公共模板的引用递归取依赖，避免组件经 composable 引入的 npm 包在安装时遗漏。 */
export function extractSharedNpmDependencies(
    content: string,
    platform: "web" | "uniapp",
    templates: Readonly<Record<string, string>> = TEMPLATES[platform],
): string[] {
    const dependencies = new Set<string>();
    const visited = new Set<string>();
    const imports = /\bfrom\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)|\brequire\(\s*["']([^"']+)["']\s*\)/g;

    function visit(source: string, sourcePath = "") {
        for (const dependency of extractNpmDependenciesFromText(source)) dependencies.add(dependency);
        for (const match of source.matchAll(imports)) {
            const specifier = match[1] ?? match[2] ?? match[3];
            if (!specifier) continue;
            const base = /^[~@]\/(?:lib|composables)\//.test(specifier)
                ? specifier.slice(2)
                : specifier.startsWith(".") && sourcePath
                    ? posix.normalize(posix.join(posix.dirname(sourcePath), specifier))
                    : "";
            if (!base) continue;
            const path = [base, `${base}.ts`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`]
                .find(candidate => Object.hasOwn(templates, candidate));
            if (!path || visited.has(path)) continue;
            visited.add(path);
            visit(templates[path]!, path);
        }
    }

    visit(content);
    return [...dependencies].sort();
}
