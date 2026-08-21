/**
 * 进程内滑动窗口限流器(单实例部署前提,与 SQLite 聊天存储一致)。
 *
 * key 维度由调用方决定(如 `assistant:<用户id>`);进程重启即清零,属可接受损耗。
 * 若未来水平扩容,需替换为 Redis 等共享存储实现。
 */
const buckets = new Map<string, number[]>();

/** 超过该条目数时顺带清扫,防止 Map 随用户数无限增长 */
const SWEEP_THRESHOLD = 2000;
/** 清扫判据:超过该时长无新请求的 key 直接删除 */
const SWEEP_MAX_AGE_MS = 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  /** 被拒绝时:距最早一次请求滑出窗口还需等待的秒数 */
  retryAfterSec: number;
}

/** 记录一次请求并判定是否超限:窗口内已满 limit 次则拒绝(本次不计数) */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > SWEEP_THRESHOLD) sweep(now);

  let hits = buckets.get(key);
  if (!hits) {
    hits = [];
    buckets.set(key, hits);
  }
  while (hits.length > 0 && hits[0]! <= now - windowMs) hits.shift();

  if (hits.length >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000)),
    };
  }
  hits.push(now);
  return { allowed: true, retryAfterSec: 0 };
}

function sweep(now: number) {
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || hits[hits.length - 1]! <= now - SWEEP_MAX_AGE_MS) {
      buckets.delete(key);
    }
  }
}
