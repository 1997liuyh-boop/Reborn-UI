<template>
    <view :style="{ width: size + 'px', height: size + 'px' }">
        <!-- #ifdef MP-WEIXIN -->
        <canvas class="relative z-1" type="2d" :id="qrcodeId"
            :style="{ width: size + 'px', height: size + 'px' }"></canvas>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <canvas :canvas-id="qrcodeId" :id="qrcodeId" :style="{ width: size + 'px', height: size + 'px' }"></canvas>
        <!-- #endif -->
    </view>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
    onMounted,
    getCurrentInstance,
    nextTick,
    computed,
    onUnmounted,
} from "vue";

import { drawQrcode, eccLevel, type ClQrcodeMode } from "./draw";
import { canvasToPng, uuid } from "../../lib/file";
import { isAppIOS, isHarmony } from "../../lib/device";

defineOptions({
    name: "reborn-qrcode",
    inheritAttrs: false
});

interface RebornQrcodeOptions {
    size?: number;
    foreground?: string;
    background?: string;
    pdColor?: string | null;
    pdRadius?: number;
    text?: string;
    logo?: string;
    logoSize?: number;
    padding?: number;
    mode?: ClQrcodeMode;
    ecc?: eccLevel;
    pdOuterRadius?: number;
    pdInnerRadius?: number;
    dotsGradient?: any;
    dotsImage?: string | null;
    backgroundGradient?: any;
    backgroundTransparent?: boolean;
    logoOptions?: any;
    cornersSquareGradient?: any;
    cornersDotGradient?: any;
    cornersSquareOptions?: any;
    cornersDotOptions?: any;
}

const props = withDefaults(defineProps<RebornQrcodeOptions>(), {
    size: 200,
    foreground: "#131313",
    background: "#FFFFFF",
    pdColor: null,
    pdRadius: 10,
    text: "https://cool-js.com/",
    logo: "",
    logoSize: 40,
    padding: 5,
    mode: "circular",
    ecc: eccLevel.H,
    pdOuterRadius: undefined,
    pdInnerRadius: undefined
});


const { proxy } = getCurrentInstance()!;

// 二维码组件id
const qrcodeId = ref<string>("cl-qrcode-" + uuid());

/**
 * 主绘制方法，根据当前 props 生成二维码并绘制到 canvas。
 * 支持多平台（APP、H5、微信小程序），自动适配高分屏。
 * 内部调用 drawQrcode 进行二维码点阵绘制。
 */
function drawer() {
    const data = {
        ecc: props.ecc,
        text: props.text,
        size: props.size,
        foreground: props.foreground,
        background: props.background,
        padding: props.padding,
        logo: props.logo,
        logoSize: props.logoSize,
        mode: props.mode,
        pdColor: props.pdColor,
        pdRadius: props.pdRadius,
        pdOuterRadius: props.pdOuterRadius,
        pdInnerRadius: props.pdInnerRadius,
        dotsGradient: props.dotsGradient,
        dotsImage: props.dotsImage,
        backgroundGradient: props.backgroundGradient,
        backgroundTransparent: props.backgroundTransparent,
        logoOptions: props.logoOptions,
        cornersSquareGradient: props.cornersSquareGradient, // 优先使用外框的渐变
        cornersDotGradient: props.cornersDotGradient,    // 优先使用内点的渐变
        cornersSquareOptions: props.cornersSquareOptions,
        cornersDotOptions: props.cornersDotOptions,
    };

    nextTick(() => {
        // #ifdef MP-WEIXIN
        const query = uni.createSelectorQuery().in(proxy as any);
        (query.select('#' + qrcodeId.value) as any)
            .fields({ node: true, size: true }, (res: any) => {
                if (res?.node) {
                    const canvas = res.node as any;
                    const ctx = canvas.getContext('2d') as any;
                    const dpr = uni.getSystemInfoSync().pixelRatio;
                    canvas.width = props.size * dpr;
                    canvas.height = props.size * dpr;
                    ctx.scale(dpr, dpr);
                    drawQrcode(ctx, data, canvas);
                }
            })
            .exec();
        // #endif

        // #ifndef MP-WEIXIN
        const context = uni.createCanvasContext(qrcodeId.value, proxy);
        drawQrcode(context, data);
        // #endif
    });
}
/**
 * 获取当前二维码图片的临时文件地址
 * @param call 回调函数，返回图片路径，失败返回空字符串
 */
function toPng(): Promise<string> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // #ifdef MP-WEIXIN
            const query = uni.createSelectorQuery().in(proxy as any);
            (query.select('#' + qrcodeId.value) as any)
                .fields({ node: true }, (res: any) => {
                    if (res?.node) {
                        const canvas = res.node as any;
                        (uni.canvasToTempFilePath as any)({
                            canvas,
                            destWidth: props.size * 3,
                            destHeight: props.size * 3,
                            success: (result: any) => {
                                resolve(result.tempFilePath);
                            },
                            fail: (err: any) => {
                                reject(err);
                            }
                        });
                    } else {
                        reject(new Error('未找到 canvas 节点'));
                    }
                })
                .exec();
            // #endif

            // #ifndef MP-WEIXIN
            uni.canvasToTempFilePath({
                canvasId: qrcodeId.value,
                destWidth: props.size * 3,
                destHeight: props.size * 3,
                success: (res) => {
                    resolve(res.tempFilePath);
                },
                fail: (err) => {
                    reject(err);
                }
            }, proxy);
            // #endif
        }, 100);
    });
}

// 自动重绘
const stopWatch = watch(
    computed(() => [
        props.pdColor,
        props.pdRadius,
        props.pdOuterRadius,
        props.pdInnerRadius,
        props.dotsGradient,
        props.dotsImage,
        props.backgroundGradient,
        props.backgroundTransparent,
        props.logoOptions,
        props.cornersSquareGradient,
        props.cornersDotGradient,
        props.cornersSquareOptions,
        props.cornersDotOptions,
        props.foreground,
        props.background,
        props.text,
        props.logo,
        props.logoSize,
        props.mode,
        props.padding,
        props.ecc
    ]),
    () => {
        drawer();
    }
);

onMounted(() => {
    setTimeout(
        () => {
            drawer();
        },
        isHarmony() || isAppIOS() ? 50 : 0
    );
});

onUnmounted(() => {
    stopWatch();
});

defineExpose({
    toPng
});
</script>
