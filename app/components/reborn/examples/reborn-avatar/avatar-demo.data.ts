/** 示例使用内嵌头像插画，不依赖外部图片服务。 */
export const avatarPeople = [
  { name: '林舟', text: '林', background: '#dbeafe', shirt: '#3b82f6' },
  { name: '陈雨', text: '陈', background: '#ede9fe', shirt: '#8b5cf6' },
  { name: '周宁', text: '周', background: '#dcfce7', shirt: '#22c55e' },
  { name: '苏禾', text: '苏', background: '#ffedd5', shirt: '#f97316' },
  { name: '许言', text: '许', background: '#fce7f3', shirt: '#ec4899' },
].map(person => ({
  ...person,
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="${person.background}"/><path d="M14 96c0-23 14-35 34-35s34 12 34 35" fill="${person.shirt}"/><ellipse cx="48" cy="40" rx="19" ry="23" fill="#f4c7a1"/><path d="M29 37c-5-25 37-37 40-2-12-1-22-7-27-13-2 9-7 13-13 15" fill="#334155"/><circle cx="41" cy="42" r="2" fill="#334155"/><circle cx="55" cy="42" r="2" fill="#334155"/><path d="M42 52q6 5 12 0" stroke="#a66048" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`)}`,
}));

/** SVG 默认会再次等比缩放；关闭内部比例适配，让 object-fit 独立决定拉伸与裁剪。 */
export const avatarFitImages = [
  { label: '大图', width: 160, height: 96 },
  { label: '小图', width: 40, height: 24 },
].map(image => ({
  ...image,
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}" viewBox="0 0 160 96" preserveAspectRatio="none"><rect width="160" height="96" fill="#dbeafe"/><rect width="32" height="96" fill="#93c5fd"/><rect x="128" width="32" height="96" fill="#c4b5fd"/><circle cx="80" cy="34" r="18" fill="#f59e0b"/><path d="M24 96 62 50 88 80 108 60 144 96Z" fill="#22c55e"/></svg>`)}`,
}));
