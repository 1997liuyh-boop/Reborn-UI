import type { ThemeColorName } from '~/utils/themeColor'

/** 全站共用一份状态，选择器卸载后仍保留当前色系。 */
export function useThemeColor() {
  return useState<ThemeColorName>('site-theme-color', () => 'blue')
}
