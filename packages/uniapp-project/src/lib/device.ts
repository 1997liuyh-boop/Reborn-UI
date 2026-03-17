/**
 * 系统信息接口，包含项目中实际使用的字段
 */
export interface SystemInfo {
  /** 窗口宽度 */
  windowWidth: number
  /** 窗口高度 */
  windowHeight: number
  /** 窗口顶部位置 */
  windowTop: number
  /** 设备像素比 */
  pixelRatio: number
  /** 平台信息 */
  platform: string
  /** 主题模式 */
  theme?: string
  /** 状态栏高度 */
  statusBarHeight?: number
  /** 安全区域信息 */
  safeArea?: UniApp.SafeArea
  /** 屏幕高度 */
  screenHeight: number
  /** 安全区域插入信息 */
  safeAreaInsets?: UniApp.SafeAreaInsets
  // 未尽字段
  [key: string]: any
}

/**
 * 检查是否为小程序环境
 * @returns 是否为小程序环境
 */
export function isMp(): boolean {
  // #ifdef MP
  return true
  // #endif

  return false
}

/**
 * 检查是否为App环境
 * @returns 是否为App环境
 */
export function isApp(): boolean {
  // #ifdef APP
  return true
  // #endif

  return false
}

/**
 * 检查是否为App-IOS环境
 * @returns 是否为App-IOS环境
 */
export function isAppIOS(): boolean {
  // #ifdef APP-IOS
  return true
  // #endif
  return false
}

/**
 * 检查是否为App-Android环境
 * @returns 是否为App-Android环境
 */
export function isAppAndroid(): boolean {
  // #ifdef APP-ANDROID
  return true
  // #endif
  return false
}

/**
 * 检查是否为H5环境
 * @returns 是否为H5环境
 */
export function isH5(): boolean {
  // #ifdef H5
  return true
  // #endif

  return false
}

/**
 * 检查是否为鸿蒙环境
 * @returns 是否为鸿蒙环境
 */
export function isHarmony(): boolean {
  // #ifdef APP-HARMONY
  return true
  // #endif

  return false
}

export function initTheme() {
  let value: string | null

  // #ifdef APP
  const appInfo = uni.getAppBaseInfo()
  // @ts-ignore
  const appTheme = appInfo.appTheme as string
  const osTheme = uni.getSystemInfoSync().osTheme!

  // 如果 appTheme 为 auto，则跟随系统主题，否则使用 appTheme
  value = appTheme == 'auto' ? osTheme : appTheme
  // #endif

  // #ifdef H5 || MP
  const hostTheme = uni.getAppBaseInfo().hostTheme
  if (hostTheme) {
    // 如果有 hostTheme，则使用 hostTheme
    value = hostTheme
  }
  else {
    // 默认使用 light 主题
    value = 'light'
  }
  // #endif
  return value
}

/**
 * 获取安全区域高度
 * @param type 类型
 * @returns 安全区域高度
 */
export function getSafeAreaHeight(type: 'top' | 'bottom') {
  const { safeAreaInsets } = uni.getWindowInfo()

  let h: number

  if (type == 'top') {
    h = safeAreaInsets.top
  }
  else {
    h = safeAreaInsets.bottom

    // #ifdef APP-ANDROID
    if (h == 0) {
      h = 16
    }
    // #endif
  }

  return h
}

/**
 * 兼容微信小程序端获取系统信息的方法
 * 在微信小程序端使用新的API替代getSystemInfoSync，在其他端仍然使用getSystemInfoSync
 * @returns 系统信息对象
 */
export function getSystemInfo(): SystemInfo {
  let systemInfo: SystemInfo
  // #ifdef MP-WEIXIN
  try {
    // const systemSetting = uni.getSystemSetting() // 暂时不需要
    const deviceInfo = uni.getDeviceInfo()
    const windowInfo = uni.getWindowInfo()
    const appBaseInfo = uni.getAppBaseInfo()
    systemInfo = {
      ...deviceInfo,
      ...windowInfo,
      ...appBaseInfo
    }
  } catch (error) {
    console.warn('获取系统信息失败，降级使用uni.getSystemInfoSync:', error)
    // 降级处理，使用原来的方法
    systemInfo = uni.getSystemInfoSync()
  }
  // #endif
  // #ifndef MP-WEIXIN
  systemInfo = uni.getSystemInfoSync()
  // #endif
  return systemInfo
}