export const flameHeroVideoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4";
export const installCommand = "npx reborn-ui@latest init";
export const heroMessage = "很高兴在这里遇见你。用可定制的 Vue 组件，把你的下一个想法变成界面。我们从哪里开始？";

// 将横向移动转换为有界时间，忽略尚未就绪的视频数据。
export function getScrubTime(current: number, delta: number, width: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(delta) || width <= 0) return current;
  return Math.max(0, Math.min(duration, current + delta / width * 0.8 * duration));
}
