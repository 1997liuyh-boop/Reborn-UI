/**
 * 版本发布工作流脚本
 * 
 * 此脚本用于在发布 `reborn-ui` CLI 工具前，自动或手动更新 `package.json` 中的版本号。
 * 它支持：
 * 1. 自动增加 patch 版本号（例如 1.0.0 -> 1.0.1）
 * 2. 手动输入符合 SemVer 规范的版本号
 * 3. 保持当前版本不变
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";

/**
 * 版本处理操作类型
 * - increment: 自动自增 patch
 * - manual: 手动输入
 * - skip: 保持不变
 */
type VersionAction = "increment" | "manual" | "skip";

/** SemVer 正则表达式，用于校验版本号格式是否规范 */
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/**
 * 验证版本号是否符合 SemVer 规范
 * @param version 待验证的版本号字符串
 * @returns 是否有效
 */
function isValidSemver(version: string): boolean {
  return SEMVER_PATTERN.test(version);
}

/**
 * 自动增加 Patch 版本号
 * @param version 当前版本号
 * @returns 增加后的版本号
 * @throws 如果当前版本号不匹配标准的 x.y.z 格式，则抛出错误
 */
function bumpPatch(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?(?:\+.+)?$/);
  if (!match) {
    throw new Error(`当前版本 "${version}" 无法自动自增。`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  return `${major}.${minor}.${patch + 1}`;
}

/**
 * 更新 package.json 文件中的版本字段
 * @param packageJsonPath package.json 的文件系统路径
 * @param nextVersion 要写入的新版本号
 */
async function updatePackageVersion(packageJsonPath: string, nextVersion: string) {
  const raw = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(raw) as Record<string, unknown>;
  packageJson.version = nextVersion;
  // 序列化 JSON 时保持 2 空格缩进，并确保文件末尾有空行以符合规范
  await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

/**
 * 脚本执行主函数
 */
async function main() {
  // 获取当前脚本所在目录
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // 假定此脚本位于 src/scripts/，package.json 位于根目录
  const packageJsonPath = path.resolve(__dirname, "../../package.json");

  // 读取并解析 package.json 中的当前版本
  const raw = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(raw) as { version?: string };
  const currentVersion = packageJson.version;

  // 必须确保当前版本存在且有效
  if (!currentVersion || !isValidSemver(currentVersion)) {
    throw new Error(`packages/cli/package.json 中的版本号无效：${String(currentVersion)}`);
  }

  // 计算自增后的补丁版本
  const incrementedVersion = bumpPatch(currentVersion);

  // 交互式询问用户下一步版本操作
  const { action } = await prompts(
    {
      type: "select",
      name: "action",
      message: `发布前如何处理版本号？当前版本：${currentVersion}`,
      choices: [
        {
          title: "自增版本号",
          description: `按 patch 规则更新为 ${incrementedVersion}`,
          value: "increment",
        },
        {
          title: "手动输入版本号",
          description: "输入一个符合 semver 规范的新版本号",
          value: "manual",
        },
        {
          title: "保持当前版本不变",
          description: "不修改 package.json 中的 version 字段",
          value: "skip",
        },
      ],
      initial: 2, // 默认保持不变
    },
    {
      onCancel: () => {
        throw new Error("已取消发布前的版本处理。");
      },
    },
  ) as { action: VersionAction };

  // 逻辑处理：跳过
  if (action === "skip") {
    console.log(`版本号保持不变：${currentVersion}`);
    return;
  }

  // 逻辑处理：自动自增
  if (action === "increment") {
    await updatePackageVersion(packageJsonPath, incrementedVersion);
    console.log(`版本号已更新：${currentVersion} -> ${incrementedVersion}`);
    return;
  }

  // 逻辑处理：手动输入
  const { manualVersion } = await prompts(
    {
      type: "text",
      name: "manualVersion",
      message: "请输入新的版本号",
      initial: currentVersion,
      validate: (value: string) => {
        if (!isValidSemver(value)) {
          return "版本号必须符合 semver 规范，例如 1.2.3 或 1.2.3-beta.1";
        }
        return true;
      },
    },
    {
      onCancel: () => {
        throw new Error("已取消手动输入版本号。");
      },
    },
  ) as { manualVersion: string };

  await updatePackageVersion(packageJsonPath, manualVersion);
  console.log(`版本号已更新：${currentVersion} -> ${manualVersion}`);
}

// 启动执行
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

