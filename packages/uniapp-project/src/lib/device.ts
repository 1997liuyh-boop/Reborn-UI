/**
 * 检查是否为小程序环境
 * @returns 是否为小程序环境
 */
export const isMp = (): boolean => {
	// #ifdef MP
	return true;
	// #endif

	return false;
};

/**
 * 检查是否为App环境
 * @returns 是否为App环境
 */
export const isApp = (): boolean => {
	// #ifdef APP
	return true;
	// #endif

	return false;
};

/**
 * 检查是否为App-IOS环境
 * @returns 是否为App-IOS环境
 */
export const isAppIOS = (): boolean => {
	// #ifdef APP-IOS
	return true;
	// #endif
	return false;
};

/**
 * 检查是否为App-Android环境
 * @returns 是否为App-Android环境
 */
export const isAppAndroid = (): boolean => {
	// #ifdef APP-ANDROID
	return true;
	// #endif
	return false;
};

/**
 * 检查是否为H5环境
 * @returns 是否为H5环境
 */
export const isH5 = (): boolean => {
	// #ifdef H5
	return true;
	// #endif

	return false;
};

/**
 * 检查是否为鸿蒙环境
 * @returns 是否为鸿蒙环境
 */
export const isHarmony = (): boolean => {
	// #ifdef APP-HARMONY
	return true;
	// #endif

	return false;
};

export const initTheme = () => {
	let value: string | null;

	// #ifdef APP
	const appInfo = uni.getAppBaseInfo();
	// @ts-ignore
	const appTheme = appInfo.appTheme as string;
	const osTheme = uni.getSystemInfoSync().osTheme!;

	// 如果 appTheme 为 auto，则跟随系统主题，否则使用 appTheme
	value = appTheme == "auto" ? osTheme : appTheme;
	// #endif

	// #ifdef H5 || MP
	const hostTheme = uni.getAppBaseInfo().hostTheme;
	if (hostTheme) {
		// 如果有 hostTheme，则使用 hostTheme
		value = hostTheme;
	} else {
		// 默认使用 light 主题
		value = "light";
	}
	// #endif
	console.log(value)
	return value;
};