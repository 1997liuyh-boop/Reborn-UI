const IMPORT_RE =
  /\bfrom\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)|\brequire\(\s*["']([^"']+)["']\s*\)/g;

function normalizePackageName(specifier: string) {
  // ignore relative/alias/virtual
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("@/") ||
    specifier.startsWith("~/") ||
    specifier.startsWith("#") ||
    specifier.startsWith("virtual:")
  ) {
    return null;
  }

  // scoped package: @scope/name[/...]
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return specifier;
  }

  // normal package: name[/...]
  return specifier.split("/")[0] ?? null;
}

export function extractNpmDependenciesFromText(text: string) {
  const out = new Set<string>();

  for (const match of text.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2] ?? match[3];
    if (!spec) continue;
    const pkg = normalizePackageName(spec);
    if (!pkg) continue;
    out.add(pkg);
  }

  // 常见“框架自带/不应自动安装”的虚拟模块
  out.delete("nuxt");
  out.delete("vue");

  return [...out].sort();
}


