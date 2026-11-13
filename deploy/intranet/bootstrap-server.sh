#!/usr/bin/env bash
# 内网服务器一次性初始化脚本（在宝塔「终端」里以 root 执行一次即可）
#
# 用法：
#   RUNNER_TOKEN=<GitLab Runner 令牌> APP_PORT=3100 bash bootstrap-server.sh
#
# RUNNER_TOKEN 获取方式（二选一，取决于 GitLab 版本）：
#   - GitLab 16+：项目 → 设置 → CI/CD → Runners → 新建项目 Runner，标签填 reborn-intranet，
#     复制以 glrt- 开头的令牌
#   - 旧版本：同一页面里的「注册令牌」（registration token）
#
# 脚本做的事：
#   1. 准备 Node 20、pnpm、pm2（优先复用宝塔已装的 Node）
#   2. 安装并注册 GitLab Runner（shell 执行器，以 root 运行，标签 reborn-intranet）
#   3. 生成 /www/server/reborn-ui/runtime.env（端口、会话密码等运行时配置，只在本机）
#   4. 放行应用端口
# 可重复执行：已完成的步骤会跳过，已有的 runtime.env 不会被覆盖。
set -euo pipefail

# 也可以不用环境变量，直接把令牌填在下面引号里（例如 glrt-xxxx），再执行 bash bootstrap-server.sh
RUNNER_TOKEN="${RUNNER_TOKEN:-}"

# 全部输出同时写入日志，便于在宝塔「文件」里打开 /root/bootstrap.log 整体复制
exec > >(tee -a /root/bootstrap.log) 2>&1
echo "######## $(date '+%F %T') 开始初始化 ########"

APP_PORT="${APP_PORT:-3100}"
GITLAB_URL="${GITLAB_URL:-https://gitlab.rebornnet.cn}"
RUNNER_TAG="reborn-intranet"
PNPM_VERSION="10.26.2"
NODE_VERSION="v20.18.1"
RUNTIME_DIR="/www/server/reborn-ui"
DEPLOY_DIR="/www/wwwroot/reborn-ui"
MIRROR="https://registry.npmmirror.com"

[ "$(id -u)" -eq 0 ] || { echo "❌ 请用 root 执行"; exit 1; }

step() { printf '\n==== %s ====\n' "$1"; }

# ---------- 1. Node / pnpm / pm2 ----------
step "准备 Node.js"
node_major() { "$1/node" -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/'; }
NODE_BIN_DIR=""
# 先找宝塔 Node 版本管理器装的 20+，再看系统 PATH
for dir in $(ls -1d /www/server/nodejs/v2*/bin 2>/dev/null | sort -V -r) "$(dirname "$(command -v node 2>/dev/null || echo /nonexistent/node)")"; do
  if [ -x "$dir/node" ] && [ "$(node_major "$dir")" -ge 20 ] 2>/dev/null; then
    NODE_BIN_DIR="$dir"
    break
  fi
done
if [ -z "$NODE_BIN_DIR" ]; then
  case "$(uname -m)" in
    x86_64) node_arch=x64 ;;
    aarch64) node_arch=arm64 ;;
    *) echo "❌ 不支持的架构 $(uname -m)"; exit 1 ;;
  esac
  echo "未找到 Node 20+，从 npmmirror 下载 $NODE_VERSION"
  mkdir -p /usr/local/lib/nodejs
  curl -fL "$MIRROR/-/binary/node/$NODE_VERSION/node-$NODE_VERSION-linux-$node_arch.tar.gz" \
    | tar -xz -C /usr/local/lib/nodejs
  NODE_BIN_DIR="/usr/local/lib/nodejs/node-$NODE_VERSION-linux-$node_arch/bin"
fi
export PATH="$NODE_BIN_DIR:$PATH"
echo "使用 Node：$NODE_BIN_DIR/node $(node -v)"

step "安装 pnpm 与 pm2"
npm install -g "pnpm@$PNPM_VERSION" pm2 --registry "$MIRROR"
echo "pnpm $(pnpm -v) / pm2 $(pm2 -v)"

step "检查 git 与 curl"
if ! command -v git >/dev/null; then
  if command -v yum >/dev/null; then yum install -y git; else apt-get update && apt-get install -y git; fi
fi
git --version

# ---------- 2. GitLab Runner ----------
step "安装 GitLab Runner"
if ! command -v gitlab-runner >/dev/null; then
  case "$(uname -m)" in
    x86_64) runner_arch=amd64 ;;
    aarch64) runner_arch=arm64 ;;
  esac
  # 国内机房访问 S3 经常失败：先限时尝试官方二进制，失败再走清华镜像的软件源
  if ! curl -fL --connect-timeout 10 --max-time 300 -o /usr/local/bin/gitlab-runner \
    "https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-$runner_arch"; then
    rm -f /usr/local/bin/gitlab-runner
    echo "官方下载失败，改用清华镜像安装"
    if command -v apt-get >/dev/null; then
      . /etc/os-release
      # trusted=yes 跳过签名校验：GitLab 公钥地址在国内同样经常不可达
      echo "deb [trusted=yes] https://mirrors.tuna.tsinghua.edu.cn/gitlab-runner/ubuntu $VERSION_CODENAME main" \
        > /etc/apt/sources.list.d/gitlab-runner.list
      apt-get update && apt-get install -y gitlab-runner
    else
      cat > /etc/yum.repos.d/gitlab-runner.repo <<'REPO'
[gitlab-runner]
name=gitlab-runner
baseurl=https://mirrors.tuna.tsinghua.edu.cn/gitlab-runner/yum/el$releasever-$basearch/
gpgcheck=0
enabled=1
REPO
      yum install -y gitlab-runner
    fi
  fi
  [ -f /usr/local/bin/gitlab-runner ] && chmod +x /usr/local/bin/gitlab-runner
fi
gitlab-runner --version | head -1
# 必须以 root 运行：部署要写 /www/wwwroot 并操作 root 的 pm2。
# apt/yum 包默认以 gitlab-runner 用户装服务，因此不论之前怎么装的，都重新以 root 安装一次服务
mkdir -p /home/gitlab-runner
gitlab-runner uninstall >/dev/null 2>&1 || true
gitlab-runner install --user=root --working-directory=/home/gitlab-runner
gitlab-runner start
# Ubuntu 的 .bash_logout 会调用 clear_console，在 shell 执行器里导致「准备环境」阶段失败
if [ -f /root/.bash_logout ] && grep -q clear_console /root/.bash_logout; then
  sed -i 's/^\(.*clear_console.*\)$/# \1/' /root/.bash_logout
fi

step "注册 GitLab Runner"
if grep -q "$GITLAB_URL" /etc/gitlab-runner/config.toml 2>/dev/null; then
  echo "已注册过（/etc/gitlab-runner/config.toml 中已有 $GITLAB_URL），跳过"
elif [ -z "${RUNNER_TOKEN:-}" ]; then
  echo "⚠️ 未提供 RUNNER_TOKEN，跳过注册。拿到令牌后重新执行本脚本即可"
else
  common_args=(--non-interactive --url "$GITLAB_URL" --executor shell --description "reborn-intranet-$(hostname)")
  if [[ "$RUNNER_TOKEN" == glrt-* ]]; then
    # 新版令牌：标签在 GitLab 页面创建 Runner 时就已设定
    gitlab-runner register "${common_args[@]}" --token "$RUNNER_TOKEN"
  else
    gitlab-runner register "${common_args[@]}" --registration-token "$RUNNER_TOKEN" \
      --tag-list "$RUNNER_TAG" --run-untagged=false --locked=false
  fi
  gitlab-runner restart
fi

# ---------- 3. 运行时配置 ----------
step "生成运行时配置"
mkdir -p "$RUNTIME_DIR" "$DEPLOY_DIR/releases" "$DEPLOY_DIR/shared/.data"
if [ -f "$RUNTIME_DIR/runtime.env" ]; then
  echo "$RUNTIME_DIR/runtime.env 已存在，保留原配置（如需改端口请直接编辑该文件后重跑流水线）"
else
  session_password="$(head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  cat > "$RUNTIME_DIR/runtime.env" <<EOF
# Reborn-UI 内网部署运行时配置（只存在本机，CI 每次部署都会读取）
PORT=$APP_PORT
HOST=0.0.0.0
DEPLOY_DIR=$DEPLOY_DIR
NODE_BIN_DIR=$NODE_BIN_DIR
NUXT_SESSION_PASSWORD=$session_password
# 以下为可选项：不填时站点正常运行，仅 AI 助手 / 飞书登录不可用
NUXT_AI_PROVIDER_API_KEY=
NUXT_AI_PROVIDER_BASE_URL=
NUXT_FEISHU_APP_ID=
NUXT_FEISHU_APP_SECRET=
EOF
  chmod 600 "$RUNTIME_DIR/runtime.env"
  echo "已写入 $RUNTIME_DIR/runtime.env"
fi

# ---------- 4. 端口与开机自启 ----------
step "检查并放行端口 $APP_PORT"
if ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$APP_PORT\$"; then
  echo "⚠️ 端口 $APP_PORT 已被占用（若是本应用的旧进程可忽略）："
  ss -ltnp | grep -E "[:.]$APP_PORT\b" || true
fi
if command -v firewall-cmd >/dev/null && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port="$APP_PORT/tcp" && firewall-cmd --reload
elif command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow "$APP_PORT/tcp"
fi
echo "提示：若宝塔「安全」页启用了防火墙，也请在那里放行 $APP_PORT"

# pm2 开机自启，服务器重启后站点自动恢复
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

step "完成"
gitlab-runner list 2>&1 || true
echo "下一步：在 GitLab 对 main 推送或手动运行流水线，部署成功后访问 http://<本机IP>:$APP_PORT/"
