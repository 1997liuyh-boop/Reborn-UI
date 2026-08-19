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
  title?: string; // 中文名（来自知识库 index.json）
  description?: string; // Agent 友好的一句话描述（来自知识库 index.json）
  category?: string; // 分类枚举（来自知识库 index.json）
  tags?: string[]; // 检索标签（来自知识库 index.json）
  dependencies: string[];
  files: Array<{
    path: string; // relative to component root
    content: string;
    target?: "web" | "uniapp";
  }>;
}


