import { readonly, shallowRef } from 'vue'
import { initTheme as readSystemTheme } from '../lib/device'

/**
 * 暗色模式开关（演示页共用）
 *
 * 状态放在模块级、只初始化一次：uni-app 用 navigateTo 打开新页面时，上一页留在页面栈里不卸载，
 * 每页各持一份 isDark 时，在后一页切换主题再返回，前一页的开关图标与 page-meta 的 root-class 都是旧值。
 * UniApp 端没有 SSR，模块级单例不会跨请求共享。
 */
const isDark = shallowRef(false)
let initialized = false

/** 写入存储，并在 H5 同步 <html> 上的 dark 类 */
function updateTheme() {
  const value = isDark.value
  uni.setStorageSync('darkMode', value)

  // #ifdef H5
  if (value) {
    document.documentElement.classList.add('dark')
  }
  else {
    document.documentElement.classList.remove('dark')
  }
  // #endif
}

/**
 * 从存储恢复上次的主题。存储里没有记录时只按宿主 / 系统主题取初值，不写存储、不碰 <html> 的类名：
 * PickerView 这类组件也会调用 useDarkMode 读主题，使用方自己管理暗色时，
 * 首次渲染组件不能把它设好的 dark 类去掉，也不能替它写下一条 darkMode 记录
 */
function initTheme() {
  const saved = uni.getStorageSync('darkMode')
  if (saved === '') {
    // 低版本基础库没有 getAppBaseInfo 等接口时读不到宿主主题，按浅色处理
    try { isDark.value = readSystemTheme() === 'dark' }
    catch { isDark.value = false }
    return
  }
  isDark.value = !!saved
  updateTheme()
}

/** 应用外部指定的主题，页面栈、存储与 H5 根节点保持同步。 */
function setDarkMode(value: boolean) {
  isDark.value = value
  updateTheme()
}

function toggleDarkMode() {
  setDarkMode(!isDark.value)
}

export function useDarkMode() {
  if (!initialized) {
    initialized = true
    initTheme()
  }

  return {
    /** 只读：当前是否暗色，修改请调用 setDarkMode 或 toggleDarkMode */
    isDark: readonly(isDark),
    setDarkMode,
    toggleDarkMode,
  }
}
