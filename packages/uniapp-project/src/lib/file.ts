export function uuid(): string {
	let uuid = "";
	let i: number;
	let random: number;

	for (i = 0; i < 36; i++) {
		if (i == 8 || i == 13 || i == 18 || i == 23) {
			uuid += "-";
		} else if (i == 14) {
			uuid += "4";
		} else if (i == 19) {
			random = (Math.random() * 16) | 0;
			uuid += ((random & 0x3) | 0x8).toString(16);
		} else {
			random = (Math.random() * 16) | 0;
			uuid += random.toString(16);
		}
	}
	return uuid;
}


export function base64ToBlob(data: string, type: string = "image/jpeg"): Blob {
	// #ifdef H5
	let bytes = window.atob(data.split(",")[1]);
	let ab = new ArrayBuffer(bytes.length);
	let ia = new Uint8Array(ab);
	for (let i = 0; i < bytes.length; i++) {
		ia[i] = bytes.charCodeAt(i);
	}
	return new Blob([ab], { type });
	// #endif
}

/**
 * 将canvas转换为png图片
 * @param options 转换参数
 * @returns 图片路径
 */
export function canvasToPng(canvasRef: any): Promise<string> {
	return new Promise((resolve) => {
		// #ifdef APP
		canvasRef.parentElement!.takeSnapshot({
			success(res: any) {
				resolve(res.tempFilePath);
			},
			fail(err: any) {
				console.error(err);
				resolve("");
			}
		});
		// #endif

		// #ifdef H5
		const url = URL.createObjectURL(
			base64ToBlob(
				(canvasRef as unknown as HTMLCanvasElement)?.toDataURL("image/png", 1) ?? ""
			)
		);

		resolve(url);
		// #endif

		// #ifdef MP
		uni.createCanvasContextAsync({
			id: canvasRef.id,
			component: canvasRef.$vm,
			success(context: any) {
				// 获取2D绘图上下文
				const ctx = context.getContext("2d")!;

				// 获取canvas对象
				const canvas = ctx.canvas;

				// 将canvas转换为base64格式的PNG图片数据
				const data = canvas.toDataURL("image/png", 1);

				// 获取文件系统管理器
				const fileMg = uni.getFileSystemManager();

				// 生成临时文件路径
				// @ts-ignore
				const filepath = `${wx.env.USER_DATA_PATH}/${uuid()}.png`;

				// 将base64数据写入文件
				fileMg.writeFile({
					filePath: filepath,
					data: data.split(",")[1],
					encoding: "base64",
					success() {
						resolve(filepath);
					},
					fail(err) {
						console.error(err);
						resolve("");
					}
				});
			},
			fail(err: any) {
				console.error(err);
				resolve("");
			}
		});
		// #endif
	});
}
