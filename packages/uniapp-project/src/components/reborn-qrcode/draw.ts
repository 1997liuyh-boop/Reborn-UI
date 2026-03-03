/**
 * 导入所需的工具函数和依赖
 */
import { generateFrame } from "./qrcode";

export type ClQrcodeMode = "rect" | "circular" | "line" | "rectSmall";

export enum eccLevel {
	L = "L",
	M = "M",
	Q = "Q",
	H = "H"
}

export type QrcodeOptions = {
	ecc: eccLevel; // 纠错级别
	text: string; // 二维码内容
	size: number; // 二维码尺寸,单位px
	foreground: string; // 前景色
	background: string; // 背景色
	padding: number; // 内边距
	logo: string; // logo图片地址
	logoSize: number; // logo尺寸
	mode: ClQrcodeMode; // 二维码样式模式
	pdColor: string | null; // 定位点颜色
	pdRadius: number; // 定位图案圆角半径（兼容旧版）
	pdOuterRadius?: number; // 码眼外框圆角半径
	pdInnerRadius?: number; // 码眼内点圆角半径
	dotsGradient?: any;
	dotsImage?: string | null;
	backgroundGradient?: any;
	backgroundTransparent?: boolean;
	logoOptions?: any;
	cornersSquareGradient?: any;
	cornersDotGradient?: any;
	cornersSquareOptions?: any;
	cornersDotOptions?: any;
};

/**
 * 绘制圆角矩形
 */
function drawRoundedRect(
	ctx: any,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	if (radius <= 0) {
		ctx.fillRect(x, y, width, height);
		return;
	}

	const maxRadius = Math.min(width, height) / 2;
	const r = Math.min(radius, maxRadius);

	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + width - r, y);
	ctx.arcTo(x + width, y, x + width, y + r, r);
	ctx.lineTo(x + width, y + height - r);
	ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
	ctx.lineTo(x + r, y + height);
	ctx.arcTo(x, y + height, x, y + height - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
	ctx.fill();
}

function createFillStyle(ctx: any, styleConfig: any, size: number) {
	if (!styleConfig) return null;
	try {
		if (styleConfig.type === 'linear') {
			let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
			switch (styleConfig.direction) {
				case 'horizontal': x2 = size; break;
				case 'vertical': y2 = size; break;
				case 'diagonal': x2 = size; y2 = size; break;
				case 'center': x1 = size / 2; y1 = size / 2; x2 = size; y2 = size; break;
				default: x2 = size; break;
			}
			const grd = ctx.createLinearGradient(x1, y1, x2, y2);
			if (styleConfig.colorStops) {
				styleConfig.colorStops.forEach((stop: any) => {
					grd.addColorStop(stop.offset, stop.color);
				});
			}
			return grd;
		} else if (styleConfig.type === 'radial') {
			const grd = ctx.createCircularGradient ? ctx.createCircularGradient(size / 2, size / 2, size / 2) : ctx.createLinearGradient(0, 0, size, size);
			if (styleConfig.colorStops) {
				styleConfig.colorStops.forEach((stop: any) => {
					grd.addColorStop(stop.offset, stop.color);
				});
			}
			return grd;
		}
	} catch (e) {
		console.warn('创建渐变失败', e);
	}
	return null;
}

/**
 * 绘制定位图案（码眼）
 */
function drawPositionPattern(
	ctx: any,
	startX: number,
	startY: number,
	px: number,
	pdSquareFillStyle: any,
	pdDotFillStyle: any,
	background: string,
	outerRadius: number,
	centerRadius: number
) {
	const patternSize = px * 7;

	const safeOuterRadius = Math.max(0, outerRadius);
	const safeCenterRadius = Math.max(0, centerRadius);

	ctx.setFillStyle(pdSquareFillStyle);
	drawRoundedRect(ctx, startX, startY, patternSize, patternSize, safeOuterRadius);

	if (background !== 'transparent') {
		ctx.setFillStyle(background);
		const innerStartX = startX + px;
		const innerStartY = startY + px;
		const innerSize = px * 5;
		const innerRadius = Math.max(0, safeOuterRadius - px);
		drawRoundedRect(ctx, innerStartX, innerStartY, innerSize, innerSize, innerRadius);
	} else {
		// 在透明背景下，如果只用上面的方法，内圈会实心。所以我们改用 clip+填充 的方式，或者绘制两层来避免遮挡：
		// 实际上透明背景应该清空内圈，由于 Canvas 是叠加的，这里比较难直接在图案上抠洞，
		// 通常做法是用 clip 或 composite 模式。为了简单处理，透明背景不填充中间层
		// 由于第一步已经填充了实心外框，如果背景透明，中间会是一整块。
		// 这里我们用 clearRect 加上 clear 的圆角实现不太容易。
		// 采用最保险的方式：用 path 绘制一个带有内孔的圆角矩形环
	}

	// 我们修改 drawPositionPattern 的实现，让它支持带洞的圆环和中心的点
	ctx.beginPath();

	// 绘制外环（顺时针）
	const r = Math.min(safeOuterRadius, patternSize / 2);
	if (r <= 0) {
		ctx.moveTo(startX, startY);
		ctx.lineTo(startX + patternSize, startY);
		ctx.lineTo(startX + patternSize, startY + patternSize);
		ctx.lineTo(startX, startY + patternSize);
		ctx.lineTo(startX, startY);
	} else {
		ctx.moveTo(startX + r, startY);
		ctx.lineTo(startX + patternSize - r, startY);
		ctx.arcTo(startX + patternSize, startY, startX + patternSize, startY + r, r);
		ctx.lineTo(startX + patternSize, startY + patternSize - r);
		ctx.arcTo(startX + patternSize, startY + patternSize, startX + patternSize - r, startY + patternSize, r);
		ctx.lineTo(startX + r, startY + patternSize);
		ctx.arcTo(startX, startY + patternSize, startX, startY + patternSize - r, r);
		ctx.lineTo(startX, startY + r);
		ctx.arcTo(startX, startY, startX + r, startY, r);
	}

	// 绘制内环（逆时针）以便留空
	const innerStartX = startX + px;
	const innerStartY = startY + px;
	const innerSize = px * 5;
	const innerR = Math.max(0, r - px);

	if (innerR <= 0) {
		ctx.moveTo(innerStartX, innerStartY);
		ctx.lineTo(innerStartX, innerStartY + innerSize);
		ctx.lineTo(innerStartX + innerSize, innerStartY + innerSize);
		ctx.lineTo(innerStartX + innerSize, innerStartY);
		ctx.lineTo(innerStartX, innerStartY);
	} else {
		ctx.moveTo(innerStartX + innerR, innerStartY);
		ctx.arcTo(innerStartX, innerStartY, innerStartX, innerStartY + innerR, innerR);
		ctx.lineTo(innerStartX, innerStartY + innerSize - innerR);
		ctx.arcTo(innerStartX, innerStartY + innerSize, innerStartX + innerR, innerStartY + innerSize, innerR);
		ctx.lineTo(innerStartX + innerSize - innerR, innerStartY + innerSize);
		ctx.arcTo(innerStartX + innerSize, innerStartY + innerSize, innerStartX + innerSize, innerStartY + innerSize - innerR, innerR);
		ctx.lineTo(innerStartX + innerSize, innerStartY + innerR);
		ctx.arcTo(innerStartX + innerSize, innerStartY, innerStartX + innerSize - innerR, innerStartY, innerR);
	}
	ctx.closePath();

	ctx.setFillStyle(pdSquareFillStyle);
	ctx.fill('evenodd'); // 用 evenodd 填充带洞的多边形

	// 绘制中心点
	ctx.setFillStyle(pdDotFillStyle);
	const centerStartX = startX + px * 2;
	const centerStartY = startY + px * 2;
	const centerSize = px * 3;
	drawRoundedRect(ctx, centerStartX, centerStartY, centerSize, centerSize, safeCenterRadius);
}

/**
 * 在二维码中心绘制Logo
 */
function drawLogo(ctx: any, options: QrcodeOptions, imagePath: string) {
	ctx.save();

	const contentSize = options.size - options.padding * 2;
	const contentCenterX = options.padding + contentSize / 2;
	const contentCenterY = options.padding + contentSize / 2;

	let logoSize = options.logoSize;
	if (options.logoOptions && options.logoOptions.size) {
		switch (options.logoOptions.size) {
			case 'small': logoSize = 30; break;
			case 'large': logoSize = 60; break;
			default: logoSize = 45; break; // medium
		}
	}

	let backgroundPadding = 3;
	if (options.logoOptions && options.logoOptions.margin) {
		switch (options.logoOptions.margin) {
			case 'none': backgroundPadding = 0; break;
			case 'small': backgroundPadding = 3; break;
			case 'medium': backgroundPadding = 6; break;
			case 'large': backgroundPadding = 10; break;
		}
	}

	const backgroundSize = logoSize + backgroundPadding * 2;
	const backgroundX = contentCenterX - backgroundSize / 2;
	const backgroundY = contentCenterY - backgroundSize / 2;

	let cornerRadius = Math.min(backgroundSize * 0.1, 6);
	if (options.logoOptions && options.logoOptions.shape) {
		switch (options.logoOptions.shape) {
			case 'rectangle': cornerRadius = 0; break;
			case 'circle': cornerRadius = backgroundSize / 2; break;
			case 'rounded-rectangle': cornerRadius = Math.min(backgroundSize * 0.2, 12); break;
		}
	}

	if (options.logoOptions && options.logoOptions.shadow) {
		ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 4;
	}

	// 绘制Logo背景
	if (!options.logoOptions || options.logoOptions.hideBackgroundDots !== false) {
		ctx.setFillStyle(options.backgroundTransparent ? '#ffffff' : options.background);
		drawRoundedRect(ctx, backgroundX, backgroundY, backgroundSize, backgroundSize, cornerRadius);
	}

	// 重置阴影，避免影响图片
	ctx.shadowColor = 'transparent';
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	// 绘制图片（如果需要裁剪的话可以加clip）
	const logoX = contentCenterX - logoSize / 2;
	const logoY = contentCenterY - logoSize / 2;

	if (cornerRadius > 0) {
		ctx.save();
		ctx.beginPath();
		const innerRadius = Math.max(0, cornerRadius - backgroundPadding);
		ctx.moveTo(logoX + innerRadius, logoY);
		ctx.lineTo(logoX + logoSize - innerRadius, logoY);
		ctx.arcTo(logoX + logoSize, logoY, logoX + logoSize, logoY + innerRadius, innerRadius);
		ctx.lineTo(logoX + logoSize, logoY + logoSize - innerRadius);
		ctx.arcTo(logoX + logoSize, logoY + logoSize, logoX + logoSize - innerRadius, logoY + logoSize, innerRadius);
		ctx.lineTo(logoX + innerRadius, logoY + logoSize);
		ctx.arcTo(logoX, logoY + logoSize, logoX, logoY + logoSize - innerRadius, innerRadius);
		ctx.lineTo(logoX, logoY + innerRadius);
		ctx.arcTo(logoX, logoY, logoX + innerRadius, logoY, innerRadius);
		ctx.closePath();
		ctx.clip();
	}

	ctx.drawImage(imagePath, logoX, logoY, logoSize, logoSize);

	if (cornerRadius > 0) {
		ctx.restore();
	}

	ctx.restore();
}

/**
 * 绘制二维码到Canvas上下文
 */
export async function drawQrcode(ctx: any, options: QrcodeOptions) {
	if (!ctx) return;

	// 生成二维码数据矩阵
	const frame = generateFrame(options.text, options.ecc);
	const points = frame.frameBuffer; // 点阵数据
	const width = frame.width; // 矩阵宽度

	// 计算二维码内容区域大小
	const contentSize = options.size - options.padding * 2;
	const px = contentSize / width;
	const offsetX = options.padding;
	const offsetY = options.padding;

	// 绘制整个画布背景
	if (options.backgroundTransparent) {
		ctx.clearRect(0, 0, options.size, options.size);
	} else {
		const bgGradient = createFillStyle(ctx, options.backgroundGradient, options.size);
		ctx.setFillStyle(bgGradient || options.background);
		ctx.fillRect(0, 0, options.size, options.size);
	}

	function isPositionDetectionPattern(i: number, j: number, width: number): boolean {
		if (i < 7 && j < 7) return true; // 左上角
		if (i > width - 8 && j < 7) return true; // 右上角
		if (i < 7 && j > width - 8) return true; // 左下角
		return false;
	}

	function isInLogoArea(
		i: number,
		j: number,
		width: number,
		baseLogoSize: number,
		px: number
	): boolean {
		let logoSize = baseLogoSize;
		if (options.logoOptions && options.logoOptions.size) {
			switch (options.logoOptions.size) {
				case 'small': logoSize = 30; break;
				case 'large': logoSize = 60; break;
				default: logoSize = 45; break; // medium
			}
		}
		let backgroundPadding = 3;
		if (options.logoOptions && options.logoOptions.margin) {
			switch (options.logoOptions.margin) {
				case 'none': backgroundPadding = 0; break;
				case 'small': backgroundPadding = 3; break;
				case 'medium': backgroundPadding = 6; break;
				case 'large': backgroundPadding = 10; break;
			}
		}

		if (logoSize <= 0) return false;

		const maxLogoRatio = 0.3;
		const maxLogoPoints = Math.floor(width * maxLogoRatio);
		const logoPoints = Math.min(Math.ceil((logoSize + backgroundPadding * 2) / px), maxLogoPoints);

		const buffer = logoPoints > width * 0.1 ? 1 : 0;
		const totalLogoPoints = logoPoints + buffer * 2;

		const centerI = Math.floor(width / 2);
		const centerJ = Math.floor(width / 2);

		const halfSize = Math.floor(totalLogoPoints / 2);
		const minI = centerI - halfSize;
		const maxI = centerI + halfSize;
		const minJ = centerJ - halfSize;
		const maxJ = centerJ + halfSize;

		return i >= minI && i <= maxI && j >= minJ && j <= maxJ;
	}

	const pdColor = options.pdColor ?? options.foreground;

	const baseRadius = options.pdRadius;
	const outerRadius = options.pdOuterRadius !== undefined ? options.pdOuterRadius : baseRadius;
	const centerRadius = options.pdInnerRadius !== undefined ? options.pdInnerRadius : Math.max(0, outerRadius - px * 2);

	const fgGradient = createFillStyle(ctx, options.dotsGradient, options.size);
	const fgStyle = fgGradient || options.foreground;

	const pdSquareGradient = options.cornersSquareGradient || options.dotsGradient;
	const pdDotGradient = options.cornersDotGradient || options.dotsGradient;

	const pdSquareFillStyle = createFillStyle(ctx, pdSquareGradient, options.size) || (options.cornersSquareOptions && options.cornersSquareOptions.color) || ((options.pdColor && options.pdColor !== options.foreground) ? options.pdColor : fgStyle);
	const pdDotFillStyle = createFillStyle(ctx, pdDotGradient, options.size) || (options.cornersDotOptions && options.cornersDotOptions.color) || ((options.pdColor && options.pdColor !== options.foreground) ? options.pdColor : fgStyle);

	drawPositionPattern(ctx, offsetX, offsetY, px, pdSquareFillStyle, pdDotFillStyle, options.backgroundTransparent ? 'transparent' : options.background, outerRadius, centerRadius);
	drawPositionPattern(
		ctx,
		offsetX + (width - 7) * px,
		offsetY,
		px,
		pdSquareFillStyle,
		pdDotFillStyle,
		options.backgroundTransparent ? 'transparent' : options.background,
		outerRadius,
		centerRadius
	);
	drawPositionPattern(
		ctx,
		offsetX,
		offsetY + (width - 7) * px,
		px,
		pdSquareFillStyle,
		pdDotFillStyle,
		options.backgroundTransparent ? 'transparent' : options.background,
		outerRadius,
		centerRadius
	);

	const dot = px * 0.1;

	// 加载前景图
	let fgImgInfo: any = null;
	if (options.dotsImage) {
		try {
			let src = options.dotsImage;
			// #ifdef MP-WEIXIN
			// 对于 http/https 或以 /、data: 开头的路径，直接使用原路径
			if (
				!src.startsWith('http://') &&
				!src.startsWith('https://') &&
				!src.startsWith('/') &&
				!src.startsWith('data:')
			) {
				// 微信小程序中 uni.getImageInfo 需要的是绝对路径，如果是 static/xx 则补上 /
				src = '/' + src;
			}
			// #endif
			fgImgInfo = await new Promise<any>((resolve, reject) => {
				uni.getImageInfo({
					src: src,
					success: (res) => {
						// uni.getImageInfo 在小程序中有时返回的 res.path 是不带 / 的相对路径
						// 此时如果直接用 res.path 传给 ctx.drawImage() 会导致基于当前组件的相对路径解析错误（如 /components/...）
						// 因此我们需要确保返回给 ctx.drawImage() 的 path 是绝对路径
						if (
							!res.path.startsWith('http://') &&
							!res.path.startsWith('https://') &&
							!res.path.startsWith('/') &&
							!res.path.startsWith('data:') &&
							!res.path.startsWith('wxfile://')
						) {
							res.path = '/' + res.path;
						}
						resolve(res);
					},
					fail: reject
				});
			});
		} catch (e) {
			console.error("加载前景图失败", e);
		}
	}

	if (fgImgInfo) {
		ctx.save();
		ctx.beginPath();
	}

	for (let i = 0; i < width; i++) {
		for (let j = 0; j < width; j++) {
			if (points[j * width + i] > 0) {
				if (isPositionDetectionPattern(i, j, width)) {
					continue;
				}

				if (options.logo != "" && isInLogoArea(i, j, width, options.logoSize, px)) {
					if (!options.logoOptions || options.logoOptions.hideBackgroundDots !== false) {
						continue;
					}
				}

				if (!fgImgInfo) {
					ctx.setFillStyle(fgStyle);
				}

				const x = offsetX + px * i;
				const y = offsetY + px * j;

				switch (options.mode) {
					case "line":
						if (fgImgInfo) ctx.rect(x, y, px, px / 2);
						else ctx.fillRect(x, y, px, px / 2);
						break;

					case "circular":
						if (!fgImgInfo) ctx.beginPath();
						const rx = x + px / 2 - dot;
						const ry = y + px / 2 - dot;
						if (fgImgInfo) ctx.moveTo(rx + px / 2 - dot, ry);
						ctx.arc(rx, ry, px / 2 - dot, 0, 2 * Math.PI);
						if (!fgImgInfo) {
							ctx.fill();
							ctx.closePath();
						}
						break;

					case "rectSmall":
						if (fgImgInfo) ctx.rect(x + dot, y + dot, px - dot * 2, px - dot * 2);
						else ctx.fillRect(x + dot, y + dot, px - dot * 2, px - dot * 2);
						break;

					default:
						if (fgImgInfo) ctx.rect(x, y, px, px);
						else ctx.fillRect(x, y, px, px);
				}
			}
		}
	}

	if (fgImgInfo) {
		ctx.clip();
		ctx.drawImage(fgImgInfo.path, 0, 0, options.size, options.size);
		ctx.restore();
	}

	if (options.logo != "") {
		try {
			let logoSrc = options.logo;

			// #ifdef H5
			if (logoSrc.startsWith("http")) {
				try {
					logoSrc = await new Promise<string>((resolve, reject) => {
						const img = new Image();
						img.crossOrigin = "Anonymous";
						img.onload = () => {
							const canvas = document.createElement("canvas");
							canvas.width = img.width;
							canvas.height = img.height;
							const context = canvas.getContext("2d");
							context?.drawImage(img, 0, 0);
							try {
								const dataUrl = canvas.toDataURL("image/png");
								resolve(dataUrl);
							} catch (err) {
								reject(err);
							}
						};
						img.onerror = reject;
						img.src = logoSrc;
					});
				} catch (e) {
					console.warn("Logo CORS load failed, using original URL. Canvas export may fail.", e);
				}
			}
			// #endif

			// #ifdef MP-WEIXIN
			// 对于 http/https 或以 /、data: 开头的路径，直接使用原路径
			if (
				!logoSrc.startsWith('http://') &&
				!logoSrc.startsWith('https://') &&
				!logoSrc.startsWith('/') &&
				!logoSrc.startsWith('data:')
			) {
				// 微信小程序中 uni.getImageInfo 需要的是绝对路径，如果是 static/xx 则补上 /
				logoSrc = '/' + logoSrc;
			}
			// #endif

			const imgInfo = await new Promise<any>((resolve, reject) => {
				uni.getImageInfo({
					src: logoSrc,
					success: (res) => {
						if (
							!res.path.startsWith('http://') &&
							!res.path.startsWith('https://') &&
							!res.path.startsWith('/') &&
							!res.path.startsWith('data:') &&
							!res.path.startsWith('wxfile://')
						) {
							res.path = '/' + res.path;
						}
						resolve(res);
					},
					fail: reject
				});
			});
			drawLogo(ctx, options, imgInfo.path);
		} catch (err) {
			console.error("二维码 Logo 加载失败", err);
		}
	}

	// 执行绘制
	ctx.draw(false);
}
