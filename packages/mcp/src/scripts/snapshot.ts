import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

interface Provenance {
  sourceCommit: string;
  sourceDirty: boolean;
  registryVersion: string;
  registryHash: string;
}

interface SnapshotManifest extends Provenance {
  snapshotVersion: string;
  schemaVersion: number;
  componentCount: number;
  files: Record<string, string>;
}

interface SnapshotOptions {
  source: string;
  target: string;
  demoRoot: string;
  provenance: Provenance;
}

interface SnapshotIndex {
  schemaVersion: number;
  components: Array<{ id: string }>;
}

interface SnapshotComponent {
  id: string;
  examples?: Array<{ path?: string; code?: string }>;
}

const manifestFile = "manifest.json";
const snapshotEntries = ["index.json", "components", "schema", "report.json", "design-patterns.json", "README.md"];

export function sha256(data: string | Buffer) {
  return createHash("sha256").update(data).digest("hex");
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function filesIn(dir: string, prefix = ""): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = prefix + entry.name;
    if (entry.isDirectory()) return filesIn(path.join(dir, entry.name), `${name}/`);
    if (entry.isFile()) return [name];
    throw new Error(`快照中存在不支持的文件类型：${name}`);
  });
}

function describeSnapshot(dir: string, provenance: Provenance): SnapshotManifest {
  const index = readJson<SnapshotIndex>(path.join(dir, "index.json"));
  if (!Number.isInteger(index.schemaVersion) || !index.components?.length) {
    throw new Error("快照索引缺少 Schema 版本或组件");
  }
  const ids = index.components.map(({ id }) => id).sort();
  if (ids.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) || new Set(ids).size !== ids.length) {
    throw new Error("快照索引存在无效或重复的组件 ID");
  }
  const componentFiles = filesIn(path.join(dir, "components")).sort();
  if (JSON.stringify(componentFiles) !== JSON.stringify(ids.map((id) => `${id}.json`).sort())) {
    throw new Error("快照索引与条目的组件集合不一致");
  }
  for (const id of ids) {
    const component = readJson<SnapshotComponent>(path.join(dir, "components", `${id}.json`));
    if (component.id !== id) throw new Error(`快照条目的组件 ID 不一致：${id}`);
    if (component.examples?.some((example) => !example.code?.trim())) {
      throw new Error(`快照条目缺少离线示例代码：${id}`);
    }
  }
  const files = Object.fromEntries(
    filesIn(dir).filter((name) => name !== manifestFile).sort()
      .map((name) => [name, sha256(fs.readFileSync(path.join(dir, name)))]),
  );
  const { sourceCommit, sourceDirty, registryVersion, registryHash } = provenance;
  const metadata = {
    schemaVersion: index.schemaVersion,
    sourceCommit,
    sourceDirty,
    registryVersion,
    registryHash,
    componentCount: ids.length,
    files,
  };
  return { snapshotVersion: sha256(JSON.stringify(metadata)), ...metadata };
}

export function verifySnapshot(dir: string): SnapshotManifest {
  const manifest = readJson<SnapshotManifest>(path.join(dir, manifestFile));
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(manifest.sourceCommit)
    || typeof manifest.sourceDirty !== "boolean"
    || typeof manifest.registryVersion !== "string" || !manifest.registryVersion.trim()
    || !/^[a-f0-9]{64}$/.test(manifest.registryHash)) {
    throw new Error("快照清单缺少有效的构建来源");
  }
  const names = filesIn(dir).filter((name) => name !== manifestFile).sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(manifest.files).sort())) {
    throw new Error("快照文件集合与清单不一致");
  }
  for (const name of names) {
    if (manifest.files[name] !== sha256(fs.readFileSync(path.join(dir, name)))) {
      throw new Error(`快照文件校验值不一致：${name}`);
    }
  }
  const actual = describeSnapshot(dir, manifest);
  if (actual.snapshotVersion !== manifest.snapshotVersion
    || actual.componentCount !== manifest.componentCount || actual.schemaVersion !== manifest.schemaVersion) {
    throw new Error("快照版本或元数据不一致");
  }
  return manifest;
}

function inlineExamples(dir: string, demoRoot: string) {
  const componentsDir = path.join(dir, "components");
  const root = fs.realpathSync(demoRoot);
  for (const name of filesIn(componentsDir)) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(componentsDir, name);
    const component = readJson<SnapshotComponent>(file);
    let changed = false;
    for (const example of component.examples ?? []) {
      if (example.code || !example.path) continue;
      const source = fs.realpathSync(path.resolve(root, example.path));
      const relative = path.relative(root, source);
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error(`示例文件必须位于仓库内：${example.path}`);
      }
      example.code = fs.readFileSync(source, "utf8").replace(/\r\n/g, "\n");
      changed = true;
    }
    // 组件原有的 contentHash 用于仓库内漂移检测。发布文件另算 SHA-256。
    if (changed) fs.writeFileSync(file, `${JSON.stringify(component, null, 2)}\n`, "utf8");
  }
}

export function buildSnapshot({ source, target, demoRoot, provenance }: SnapshotOptions): SnapshotManifest {
  const parent = fs.realpathSync(path.dirname(target));
  const output = path.join(parent, path.basename(target));
  const lock = `${output}.lock`;
  const lockFd = fs.openSync(lock, "wx");
  let stage: string | undefined;
  let preserveStage = false;
  try {
    stage = fs.mkdtempSync(path.join(parent, ".kb-snapshot-"));
    const candidate = path.join(stage, "candidate");
    const previous = path.join(stage, "previous");
    fs.mkdirSync(candidate);
    for (const name of snapshotEntries) {
      const entry = path.join(source, name);
      if (fs.existsSync(entry)) fs.cpSync(entry, path.join(candidate, name), { recursive: true });
    }
    inlineExamples(candidate, demoRoot);
    const manifest = describeSnapshot(candidate, provenance);
    fs.writeFileSync(path.join(candidate, manifestFile), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    verifySnapshot(candidate);

    // 候选快照通过校验后才替换。替换失败时恢复上一次的目录。
    const hasPrevious = fs.existsSync(output);
    if (hasPrevious) fs.renameSync(output, previous);
    try {
      fs.renameSync(candidate, output);
    } catch (error) {
      if (hasPrevious) {
        preserveStage = true;
        fs.renameSync(previous, output);
        preserveStage = false;
      }
      throw error;
    }
    return manifest;
  } finally {
    try {
      if (stage && !preserveStage && path.dirname(stage) === parent) {
        fs.rmSync(stage, { recursive: true, force: true });
      }
    } finally {
      fs.closeSync(lockFd);
      fs.unlinkSync(lock);
    }
  }
}
