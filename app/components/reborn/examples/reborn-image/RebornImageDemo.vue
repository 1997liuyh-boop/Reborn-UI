<script setup lang="ts">


const src = ref("https://cms-image.leyifan.cn/img_reborn/ques-4.jpg");
const previewList = ref(["https://cms-image.leyifan.cn/resources/image/2026/01/27/767453852479557.png", "https://cms-image.leyifan.cn/resources/image/2026/01/30/768516482351173.png"]);
</script>

<template>
    <div class="p-10 space-y-10">
        <div>
            <h3 class="mb-2 font-bold">基础用法</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornImage :src="src" />
            </div>
        </div>

        <div>
            <h3 class="mb-2 font-bold">预览</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornImage :src="src" preview />
                <RebornImage :src="src" preview :preview-list="previewList" />
            </div>
        </div>

        <div>
            <h3 class="mb-4 text-xl font-bold border-b pb-2">Taobao 商品详情风格放大镜</h3>
            <div class="grid grid-cols-3 gap-10">
                <div class="flex flex-col items-center">
                    <span class="text-sm text-gray-400 mb-2">默认 (Lens: 100, Zoom: 2x)</span>
                    <RebornImage :src="src" magnifier width="200" height="200" />
                </div>
                <div class="flex flex-col items-center">
                    <span class="text-sm text-gray-400 mb-2">小透镜高倍率 (Lens: 40, Zoom: 5x)</span>
                    <RebornImage :src="src" magnifier :magnifier-size="40" :magnifier-zoom="5" width="200"
                        height="200" />
                </div>
                <div class="flex flex-col items-center">
                    <span class="text-sm text-gray-400 mb-2">自定义视口 (Box: 150x300, Zoom: 1.5x)</span>
                    <RebornImage :src="src" magnifier :magnifier-size="60" :magnifier-zoom="1.5" magnifier-width="150"
                        magnifier-height="300" width="200" height="200" />
                </div>
            </div>
        </div>

        <div>
            <h3 class="mb-2 font-bold">状态/自定义大小</h3>
            <div class="grid grid-cols-3 gap-2">
                <RebornImage src="https://example.com/error.jpg" width="180" height="180"
                    :ui="{ errorIcon: 'size-10 text-red-5' }" />
                <RebornImage src="" width="200" height="200" :ui="{ loadingIcon: 'size-12' }" />
            </div>
        </div>
        <div>
            <h3 class="mb-2 font-bold">圆角</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornImage :src="src" lazy-load custom-class="rounded-lg" />
                <RebornImage :src="src" lazy-load custom-class="rounded-xl" />
                <RebornImage :src="src" lazy-load custom-class="rounded-2xl" />
                <RebornImage :src="src" lazy-load custom-class="rounded-3xl" />
                <RebornImage :src="src" lazy-load custom-class="rounded-full" />
            </div>
        </div>
        <div>
            <h3 class="mb-2 font-bold">延迟加载</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornImage src="https://picsum.photos/200/200" lazy-load custom-class="rounded-lg" />
                <RebornImage src="https://p.upyun.com/demo/webp/webp/animated-gif-0.webp" lazy-load
                    custom-class="rounded-xl" />
                <RebornImage
                    src="https://img.iplaysoft.com/wp-content/uploads/2019/free-images/free_stock_photo.jpg!0x0.webp"
                    lazy-load custom-class="rounded-2xl" />
                <RebornImage src="https://img.iplaysoft.com/wp-content/uploads/2019/free-images/unsplash.jpg!0x0.webp"
                    lazy-load custom-class="rounded-2xl" />
            </div>
        </div>
    </div>
</template>
