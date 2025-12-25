export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface CliConfig {
  schemaVersion: 1;
  componentsDir: string; // 组件安装目录
  libDir: string; // 工具库目录（cn/utils）
  composablesDir: string; // composables 目录
  registry: string;
  /**
   * 项目根目录映射别名符号（例如 @ 或 ~）
   * - 仅用于改写生成/写入文件中的 "@/" 前缀
   * - 默认 "@"
   */
  aliasSymbol?: string;
}

export interface RegistryFile {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    rootDir: string;
    componentsDir: string;
  };
  components: RegistryComponent[];
}

export interface RegistryComponent {
  name: string;
  dependencies: string[];
  files: Array<{
    path: string; // relative to component root
    content: string;
  }>;
}


