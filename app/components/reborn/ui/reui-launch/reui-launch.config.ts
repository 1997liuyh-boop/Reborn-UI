/** 图形里的字号属于 SVG 坐标，随画布一起缩放，不使用页面字号令牌。 */
export const launchDoodleLayout = {
  viewBox: "0 0 820 470",
  compactViewBox: "0 55 820 285",
  wordmarkFontSize: 132,
  wordmarkWidth: 190,
  screenFontSize: 36,
  screenWidth: 72,
} as const;

/** 屏幕动效只改变亮度和扫描位置，不改变电脑与文字布局。 */
export const launchScreenEffects = ["crt", "blink", "typewriter", "none"] as const;

/** 动画使用 Tailwind 工具类，关键帧与组件一起分发。 */
export const launchScreenClasses = {
  crt: "motion-safe:animate-[reui-launch-flicker_4s_linear_infinite]",
  blink: "motion-safe:animate-[reui-launch-blink_1.8s_steps(1,end)_infinite]",
  typewriter: "",
  none: "",
  character: "motion-safe:animate-[reui-launch-type_4s_steps(1,end)_var(--reui-char-delay)_infinite_backwards]",
  cursor: "motion-safe:animate-[reui-launch-cursor_1.2s_steps(1,end)_infinite]",
  scan: "hidden motion-safe:block motion-safe:animate-[reui-launch-scan_3.6s_linear_infinite]",
} as const;
