export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface CliConfig {
  schemaVersion: 1;
  componentsDir: string; // 组件安装目录
  libDir: string; // 工具库目录（cn/utils）
  composablesDir: string; // composables 目录
  registry: string;
  aliasSymbol?: string;
  platform?: "web" | "uniapp"; // init 时选择的默认目标平台
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
    target?: "web" | "uniapp";
  }>;
}


