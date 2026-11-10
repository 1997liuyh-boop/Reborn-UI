#!/usr/bin/env bash
# 内网服务器构建与发布脚本：由 .gitlab-ci.yml 在内网 Runner（shell 执行器，root）上调用。
#
# 发布方式是「版本目录 + current 软链」：每次构建拷进 releases/<时间>-<提交>，
# 健康检查通过才算成功，失败则自动切回上一版。相比原地 rsync，切换只有重启进程的几秒，
# 也不会出现「磁盘是新产物、进程还是旧 bundle」的半新半旧状态。
set -euo pipefail

RUNTIME_DIR="${REBORN_RUNTIME_DIR:-/www/server/reborn-ui}"
RUNTIME_ENV="$RUNTIME_DIR/runtime.env"
APP_NAME="reborn-ui"

if [ ! -f "$RUNTIME_ENV" ]; then
  echo "❌ 缺少 $RUNTIME_ENV，请先在服务器上执行 deploy/intranet/bootstrap-server.sh"
  exit 1
fi

# 读取服务器本地配置（端口、Node 路径、会话密码等）
set -a
# shellcheck disable=SC1090
. "$RUNTIME_ENV"
set +a

: "${PORT:?runtime.env 缺少 PORT}"
: "${DEPLOY_DIR:?runtime.env 缺少 DEPLOY_DIR}"
if [ -n "${NODE_BIN_DIR:-}" ]; then
  export PATH="$NODE_BIN_DIR:$PATH"
fi

echo "node $(node -v) / pnpm $(pnpm -v) / pm2 $(pm2 -v)"

# ---------- 构建 ----------
# 构建堆上限按机器内存自动取：总内存留 2GB 给系统与 esbuild 等原生进程，封顶 12GB，最低 4GB。
# GitHub 流水线实测 6GB 会在 Nitro 服务端打包阶段 OOM，内存不足 8GB 的机器需要先加 swap。
total_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
heap_mb=$(( total_mb - 2048 ))
[ "$heap_mb" -gt 12288 ] && heap_mb=12288
[ "$heap_mb" -lt 4096 ] && heap_mb=4096
echo "机器内存 ${total_mb}MB，构建堆上限 ${heap_mb}MB"

pnpm install --no-frozen-lockfile

# registry 与知识库生成物不入库，必须在 Nuxt 构建前生成，否则 Playground 补全会静默消失
pnpm kb:bootstrap

# AI_GATEWAY_API_KEY 只是构建期开关（存在即启用助手 UI），真实凭证在运行时由 runtime.env 注入
NODE_OPTIONS="--max-old-space-size=${heap_mb}" AI_GATEWAY_API_KEY=enabled pnpm run build

# ---------- 发布 ----------
release_id="$(date +%Y%m%d%H%M%S)-${CI_COMMIT_SHORT_SHA:-manual}"
release_dir="$DEPLOY_DIR/releases/$release_id"
shared_dir="$DEPLOY_DIR/shared"
mkdir -p "$release_dir" "$shared_dir/.data"
cp -a .output/. "$release_dir/"
# 聊天记录 SQLite 写在进程 cwd 下的 .data，链到 shared 目录，跨版本保留
ln -sfn "$shared_dir/.data" "$release_dir/.data"

previous_release=""
if [ -L "$DEPLOY_DIR/current" ]; then
  previous_release="$(readlink -f "$DEPLOY_DIR/current")"
fi

# 由 runtime.env 生成 pm2 配置：密钥只经进程环境注入（生产环境 Nitro 不读 .env）
write_ecosystem() {
  node <<'NODE'
const fs = require("fs");
// AI 网关地址补齐 /v1：openai-compatible SDK 会直接拼接 /chat/completions
const normalize = (raw = "") => {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed || /\/v\d+[a-z]*$/i.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
};
const env = {
  NODE_ENV: "production",
  PORT: process.env.PORT,
  NITRO_PORT: process.env.PORT,
  HOST: process.env.HOST || "0.0.0.0",
  NITRO_HOST: process.env.HOST || "0.0.0.0",
  NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD || "",
  NUXT_AI_PROVIDER_API_KEY: process.env.NUXT_AI_PROVIDER_API_KEY || "",
  NUXT_AI_PROVIDER_BASE_URL: normalize(process.env.NUXT_AI_PROVIDER_BASE_URL),
  NUXT_FEISHU_APP_ID: process.env.NUXT_FEISHU_APP_ID || "",
  NUXT_FEISHU_APP_SECRET: process.env.NUXT_FEISHU_APP_SECRET || "",
};
const eco = {
  apps: [{
    name: "reborn-ui",
    script: "server/index.mjs",
    cwd: `${process.env.DEPLOY_DIR}/current`,
    instances: 1,
    exec_mode: "fork",
    env,
  }],
};
const target = `${process.env.RUNTIME_DIR}/ecosystem.config.cjs`;
fs.writeFileSync(target, `module.exports = ${JSON.stringify(eco, null, 2)};\n`, { mode: 0o600 });
NODE
}

# 切换 current 软链并重启进程；delete + start 比 restart 更可靠，能强制加载新的 env 与 cwd
switch_to() {
  ln -sfn "$1" "$DEPLOY_DIR/current.tmp"
  mv -Tf "$DEPLOY_DIR/current.tmp" "$DEPLOY_DIR/current"
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  pm2 start "$RUNTIME_DIR/ecosystem.config.cjs"
  pm2 save >/dev/null
}

# 健康检查：首页必须完整返回并闭合，且是首页本体而不是预渲染的 404 错误页
health_check() {
  local page=/tmp/reborn-ui-health.html
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 20 -o "$page" "http://127.0.0.1:${PORT}/" 2>/dev/null; then
      if tail -c 64 "$page" | grep -q '</html>' && ! grep -q 'Page not found' "$page"; then
        echo "首页健康检查通过（$(wc -c < "$page") 字节）"
        return 0
      fi
    fi
    sleep 2
  done
  return 1
}

export RUNTIME_DIR DEPLOY_DIR
write_ecosystem
switch_to "$release_dir"

if ! health_check; then
  echo "❌ 新版本健康检查失败，最近日志："
  pm2 logs "$APP_NAME" --lines 60 --nostream || true
  if [ -n "$previous_release" ] && [ -d "$previous_release" ]; then
    echo "↩️ 回滚到上一版：$previous_release"
    switch_to "$previous_release"
  fi
  exit 1
fi

# 只保留最近 3 个版本
ls -1dt "$DEPLOY_DIR"/releases/*/ 2>/dev/null | tail -n +4 | xargs -r rm -rf

echo "🎉 部署完成：http://<服务器IP>:${PORT}/  版本 $release_id"
