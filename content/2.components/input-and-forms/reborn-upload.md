---
title: Upload 上传
description: Web 文件上传：text / picture / picture-card 三种列表形态，支持拖拽、选择文件夹、手动上传、自定义请求与分片断点续传，图片与视频均可显示缩略图，参数与钩子对齐 Element Plus。
category: 表单与输入
platform: web
tags: [upload, file, form, web]
badge: New
---

::warning
仅 Web 端组件。UniApp 暂无同名组件，小程序选择文件请使用 `uni.chooseImage` / `uni.chooseMessageFile` 配合 `uni.uploadFile`。
::

::ComponentViewer{demoFile="RebornUploadDemo.vue" config="RebornUploadConfig" componentId="reborn-upload" :componentFiles='["RebornUpload.vue", "reborn-upload.config.ts"]' :uniappFiles='[]'}
::

## 简介

Upload 负责选择文件、发起上传并展示每个文件的进度与结果，仅支持 Web，UniApp 暂无同名同构组件。参数名、钩子名与实例方法对齐 Element Plus，从 `el-upload` 迁移时基本可以原样替换。

三个维度互相独立：`listType` 决定文件列表的形态（纯文字、带缩略图的列表、与上传入口同排的照片墙卡片）；`drag` 与 `directory` 决定文件从哪里来（点击选择、拖拽放入、整个文件夹）；`autoUpload`、`httpRequest` 与 `chunk` 决定何时上传、怎样上传（选完立即走默认 XHR，或手动 `submit()`、换成自己的请求实现，或按分片上传并支持暂停与续传）。

其余参数按用途分组：`action` / `method` / `headers` / `data` / `name` / `withCredentials` 描述请求本身；`accept` / `multiple` / `limit` 约束能选哪些文件、选几个；`beforeUpload` / `beforeRemove` 可以拦截或改写上传与删除，`onChange` / `onProgress` / `onSuccess` / `onError` / `onRemove` / `onExceed` / `onPreview` 是各阶段的回调钩子；`trigger` / `tip` / `file` 插槽替换入口、提示与列表项，实例方法 `submit` / `abort` / `clearFiles` / `handleStart` / `handleRemove` 用于手动控制，开启 `chunk` 后另有 `pause` / `resume` 暂停与继续分片上传。

### 何时使用

- 表单里附带合同、简历等附件——用默认 `text` 列表，失败原因悬停失败图标查看。
- 上传头像、商品图等需要先看到缩略图的图片——用 `listType` 的 `picture` 或 `picture-card`。
- 一次放入一批文件或整个目录——用 `drag` 开启拖放区，必要时加 `directory`。
- 选好一批文件后统一提交——关闭 `autoUpload`，再调用实例的 `submit()`。
- 上传走 SDK 直传或需要签名——用 `httpRequest` 替换默认 XHR，或用 `data` 异步生成签名字段。
- 上传视频、安装包等大文件，需要暂停、断网后续传——用 `chunk` 传入分片适配器，后端提供分片接口。

### 何时不使用

- 只需要选中文件在本地读取（导入 Excel、读取文本），不发请求——改用原生 `<input type="file">`。
- 需要带动画的整块拖放区、文件不需要逐个展示进度——改用 `file-upload`。
- 小程序或 App 端选择图片——改用 `uni.chooseImage` 配合 `uni.uploadFile`。

## 用法

### 基础用法

传入 `action` 即可上传，`v-model:file-list` 双向绑定文件列表。`text` / `picture` 的非拖拽形态不内置按钮，触发区就是默认插槽的内容，放一个按钮即可；点击插槽内任意位置都会打开文件选择框。

```vue
<script setup lang="ts">
import type { UploadUserFile } from "~/components/reborn/ui/reborn-upload";

const files = ref<UploadUserFile[]>([]);
</script>
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload">
    <RebornButton color="neutral" variant="outlined">点击上传</RebornButton>
  </RebornUpload>
</template>
```

### 文件列表形态

`listType` 切换三种列表形态，默认 `text`。三种形态都显示上传中进度条与失败原因，文件名超长时省略并在悬停时显示全名。

| 形态           | 外观                                                          | 典型用途             |
| -------------- | ------------------------------------------------------------- | -------------------- |
| `text`         | 32px 高的文字行，行间 4px，悬停才显示删除按钮，失败的行常驻显示 | 附件、文档类文件     |
| `picture`      | 灰色描边的行，左侧 40px 缩略图，删除常驻                      | 需要辨认内容的图片   |
| `picture-card` | 104px 卡片与上传入口同排，悬停图片出现操作层                  | 头像、商品图等图片墙 |

`picture-card` 自带「+」上传卡片，不需要再放按钮；`picture` 与 `text` 一样在默认插槽里放按钮。

```vue
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" list-type="picture">
    <RebornButton color="neutral" variant="outlined">点击上传</RebornButton>
  </RebornUpload>
  <RebornUpload v-model:file-list="cards" action="/api/upload" list-type="picture-card" />
</template>
```

::tip
选中图片时会用 `URL.createObjectURL` 生成本地预览地址，三种列表均可点击预览；图片类列表（`picture` / `picture-card`）还会为视频生成地址，上传成功前就能看到缩略图。上传失败时地址保留，失败的图片仍显示缩略图并标红，方便辨认是哪一张。地址在文件移除、清空或组件卸载时释放。
::

### 拖拽上传

`drag` 把触发区换成虚线拖放区，点击和拖入都能选择文件；拖入的文件同样按 `accept` 过滤。默认显示加号与「点击或拖拽到此处上传」，`tip` 插槽显示在框内的上传文案下方。

```vue
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" drag multiple>
    <template #tip>
      支持 PDF、Word，单个文件不超过 10MB
    </template>
  </RebornUpload>
</template>
```

### 照片墙与预览

`picture-card` 下悬停图片出现预览按钮，操作层只盖住 88px 的图片区域、不盖卡片的留白。图片默认复用 `RebornImage` 的预览器，支持缩放、旋转、翻转与同组图片切换；`text` / `picture` 列表点击图片文件名也可打开。传入 `onPreview` 后替代内置预览，视频与其他文件的预览由该回调自行实现。

```vue
<script setup lang="ts">
const files = ref([
  { name: "封面.png", url: "/images/cover.png" },
  { name: "详情.png", url: "/images/detail.png" },
]);
</script>
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" list-type="picture-card" accept="image/*" multiple />
</template>
```

### 视频预览

`picture` 与 `picture-card` 下，视频文件的缩略图是视频首帧：组件用静音的 `<video>` 只加载元数据并定位到 0.1 秒处，不自动播放。判断是否视频优先看文件的 MIME 类型，回显文件没有 `raw` 时看 `url` 或文件名的扩展名（mp4 / webm / ogv / mov / m4v / mkv / avi）。点击后播放什么由 `onPreview` 决定，组件不内置播放器。

```vue
<script setup lang="ts">
import type { UploadFile } from "~/components/reborn/ui/reborn-upload";
import { isVideoFile } from "~/components/reborn/ui/reborn-upload";

const previewFile = ref<UploadFile>();
const previewIsVideo = computed(() => !!previewFile.value && isVideoFile(previewFile.value.raw ?? { name: previewFile.value.name }));
</script>
<template>
  <RebornUpload v-model:file-list="videos" action="/api/upload" list-type="picture-card" accept="video/*" multiple :on-preview="file => (previewFile = file)" />
  <video v-if="previewFile?.url && previewIsVideo" :src="previewFile.url" controls autoplay />
</template>
```

::tip
浏览器解码不了的格式（如部分浏览器下的 mkv、avi）拿不到首帧，缩略图退回通用文件图标，上传本身不受影响。
::

### 数量限制

`limit` 限制列表的文件总数；本次选择会超出时触发 `onExceed`，这一批文件都不会加入。

```vue
<template>
  <RebornUpload
    v-model:file-list="files"
    action="/api/upload"
    multiple
    :limit="3"
    :on-exceed="() => message.warning('最多上传 3 个文件')"
  >
    <RebornButton color="neutral" variant="outlined">点击上传</RebornButton>
  </RebornUpload>
</template>
```

### 上传前处理

`beforeUpload` 返回 `false` 或被 reject 时中止上传并移除该文件；返回 `File` / `Blob` 时改为上传它，适合压缩、加水印。

```vue
<script setup lang="ts">
async function compressBeforeUpload(rawFile: File) {
  if (!rawFile.type.startsWith("image/")) return false;
  const blob = await compressImage(rawFile, { maxSide: 1280, quality: 0.8 });
  // 压缩后反而更大时返回 true，继续上传原文件。
  return blob.size < rawFile.size ? blob : true;
}
</script>
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" list-type="picture" accept="image/*" :before-upload="compressBeforeUpload">
    <RebornButton color="neutral" variant="outlined">点击上传</RebornButton>
  </RebornUpload>
</template>
```

### 删除前确认

`beforeRemove` 可以返回 Promise，在它落定前文件保持原样；返回 `false` 或被 reject 都会取消删除。

```vue
<script setup lang="ts">
function confirmBeforeRemove(file: UploadFile) {
  return new Promise<boolean>((resolve) => {
    openConfirm(`确定删除「${file.name}」吗？`, resolve);
  });
}
</script>
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" :before-remove="confirmBeforeRemove">
    <RebornButton color="neutral" variant="outlined">点击上传</RebornButton>
  </RebornUpload>
</template>
```

### 手动上传

`autoUpload` 设为 `false` 后选中的文件停在待上传状态，调用实例的 `submit()` 统一上传。同时用了 `trigger` 插槽时，默认插槽渲染在触发区之后，适合放操作按钮。

```vue
<script setup lang="ts">
const uploadRef = useTemplateRef("uploadRef");
</script>
<template>
  <RebornUpload ref="uploadRef" v-model:file-list="files" action="/api/upload" multiple :auto-upload="false">
    <template #trigger>
      <RebornButton color="neutral" variant="outlined">选择文件</RebornButton>
    </template>
    <RebornButton @click="uploadRef?.submit()">开始上传</RebornButton>
    <RebornButton variant="text" @click="uploadRef?.abort()">中止</RebornButton>
  </RebornUpload>
</template>
```

### 额外参数与请求头

`name` 改文件字段名，`headers` 设置请求头，`data` 附带表单字段；`data` 可以是对象、Promise，或按文件返回它们的函数。

```vue
<script setup lang="ts">
async function resolveExtraData(rawFile: File) {
  const signature = await fetchSignature(rawFile.name);
  return { bizType: "contract", signature };
}
</script>
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" name="attachment" :data="resolveExtraData" :headers="{ Authorization: 'Bearer token' }">
    <RebornButton color="neutral" variant="outlined">点击上传</RebornButton>
  </RebornUpload>
</template>
```

::warning
`data` 的 Promise 被 reject 时，该文件直接标记为失败，不会发出请求；reject 一个 Error 时失败原因取它的 `message`，reject 字符串时直接用该字符串。
::

### 真实接口上传

默认请求只按 HTTP 状态码判断成败；后端用 HTTP 200 加业务码表示失败时，用 `httpRequest` 包一层 `ajaxUpload`：进度与中止照旧，只在成功回调里补业务码判断，业务失败转交 `onError`，`message` 成为失败原因。成功后在 `onSuccess` 里把 `file.url` 换成服务端地址。

```vue
<script setup lang="ts">
import type { UploadFile, UploadRequestHandler } from "~/components/reborn/ui/reborn-upload";
import { ajaxUpload } from "~/components/reborn/ui/reborn-upload";

const uploadRequest: UploadRequestHandler = options => ajaxUpload({
  ...options,
  onSuccess: (response) => {
    const body = response as { code: number; message: string; data: { url: string } | null };
    if (body?.code === 200 && body.data) options.onSuccess(body);
    else options.onError(new Error(body?.message || "上传失败"));
  },
});

function handleSuccess(response: any, file: UploadFile) {
  file.url = response.data.url;
}
</script>
<template>
  <RebornUpload
    v-model:file-list="files"
    action="https://api-admin-letaofun.test.rebornnet.cn/api/admin/upload/image?model=config&pid=0"
    name="multipart"
    accept="image/*"
    list-type="picture"
    :http-request="uploadRequest"
    :on-success="handleSuccess"
  >
    <RebornButton color="neutral" variant="outlined">上传图片</RebornButton>
  </RebornUpload>
</template>
```

::tip
业务码要在 `httpRequest` 里判断，不能放到 `onSuccess`：`onSuccess` 被调用时文件已经标记为成功。
::

### 断点续传

`chunk` 传入分片适配器后，组件负责切片、并发、失败重试与跳过已传分片，调用方只实现与后端约定的四步：`init` 换取上传会话（如 uploadId）、`uploaded` 查询服务端已收到的分片、`uploadChunk` 上传单片、`merge` 合并并返回最终响应。开启后上传中的文件右侧出现暂停按钮，暂停后变为继续按钮，失败的文件出现重试按钮；实例方法 `pause()` / `resume()` 不传参数时作用于全部文件。

```vue
<script setup lang="ts">
import type { UploadChunkAdapter } from "~/components/reborn/ui/reborn-upload";

const uploadRef = useTemplateRef("uploadRef");

const chunkAdapter: UploadChunkAdapter<string> = {
  chunkSize: 5 * 1024 * 1024,
  concurrency: 3,
  retries: 2,
  // 服务端按文件指纹返回同一个 uploadId，删掉文件后重新选择也能接着传。
  async init({ file, chunkCount, signal }) {
    const res = await fetch("/api/multipart/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, lastModified: file.lastModified, chunkCount }),
      signal,
    });
    return (await res.json()).uploadId;
  },
  // 每次开始或继续前调用，返回的分片序号不再上传。
  async uploaded({ context, signal }) {
    const res = await fetch(`/api/multipart/${context}/parts`, { signal });
    return (await res.json()).indexes;
  },
  async uploadChunk({ context, index, blob, signal }) {
    const form = new FormData();
    form.append("index", String(index));
    form.append("chunk", blob);
    const res = await fetch(`/api/multipart/${context}`, { method: "PUT", body: form, signal });
    if (!res.ok) throw new Error(`分片 ${index} 上传失败`);
  },
  // 返回值作为文件的 response，传给 onSuccess。
  async merge({ context, signal }) {
    const res = await fetch(`/api/multipart/${context}/complete`, { method: "POST", signal });
    return res.json();
  },
};
</script>
<template>
  <RebornUpload ref="uploadRef" v-model:file-list="files" :chunk="chunkAdapter" multiple>
    <template #trigger>
      <RebornButton color="neutral" variant="outlined">选择文件</RebornButton>
    </template>
    <RebornButton variant="text" @click="uploadRef?.pause()">全部暂停</RebornButton>
    <RebornButton variant="text" @click="uploadRef?.resume()">全部继续</RebornButton>
  </RebornUpload>
</template>
```

暂停时正在传的分片被中止，进度退回到已完整传完的分片处，继续后这些分片整片重传；单片失败按 `retries` 重试，第 n 次重试前等待 n 秒，重试耗尽后整个文件标记失败，其余并发中的分片一并中止，点重试从断点接着传。

::warning
每个请求都要接上参数里的 `signal`，否则暂停、中止或删除文件后请求仍在后台跑完。`fetch` 拿不到上传进度，`onProgress` 可以不调用，此时进度按整片推进；需要片内进度时用 XHR 的 `upload.onprogress` 回报 0–100。
::

### 上传文件夹

`directory` 只允许选择文件夹，夹内文件递归展开后逐个加入列表；与 `drag` 同时开启时拖入的也只认文件夹。

```vue
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" directory drag :ui="{ list: 'max-h-[200px] overflow-auto' }" />
</template>
```

::tip
选择文件夹时浏览器不会按 `accept` 过滤，组件会对展开后的文件再过滤一遍；文件多时用 `ui.list` 给列表限高。
::

### 自定义文件项

`file` 插槽替换整条列表项（照片墙下为整张卡片）的内容，作用域给出 `file` 与 `index`；删除通过实例的 `handleRemove(file)` 触发，仍会经过 `beforeRemove`。

```vue
<script setup lang="ts">
const uploadRef = useTemplateRef("uploadRef");
</script>
<template>
  <RebornUpload ref="uploadRef" v-model:file-list="files" action="/api/upload">
    <RebornButton color="neutral" variant="outlined">点击上传</RebornButton>
    <template #file="{ file }">
      <span class="truncate">{{ file.name }}</span>
      <span class="ml-auto">{{ file.status === "success" ? "已上传" : `${Math.round(file.percentage ?? 0)}%` }}</span>
      <RebornButton variant="text" size="sm" @click="uploadRef?.handleRemove(file)">移除</RebornButton>
    </template>
  </RebornUpload>
</template>
```

### 禁用

`disabled` 禁止选择文件，列表不再显示删除按钮；内置图片预览与自定义 `onPreview` 仍可用。处于禁用的表单组内时同样生效。插槽里的按钮由调用方提供，组件不会改它的外观，需要给按钮同步 `disabled`。

```vue
<template>
  <RebornUpload v-model:file-list="files" action="/api/upload" disabled>
    <RebornButton color="neutral" variant="outlined" disabled>点击上传</RebornButton>
  </RebornUpload>
</template>
```

## API

### Props

钩子沿用 Element Plus 的写法，以 `on-xxx` / `before-xxx` 形式作为 prop 传入，不是 `@xxx` 事件。

| 属性名            | 类型                                                                                                         | 默认值       | 描述                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------- |
| `fileList`        | `UploadUserFile[]`                                                                                           | `[]`         | 已选文件列表，支持 `v-model:file-list`；回显的文件只需 `name`，缺省的 `status` 补为 `success` |
| `action`          | `string`                                                                                                     | `#`          | 上传地址；使用自定义 `httpRequest` 时可以不传                                                |
| `headers`         | `Headers \| Record<string, string \| number \| null \| undefined>`                                           | -            | 上传请求头，值为 `null` / `undefined` 的项不发送                                             |
| `method`          | `string`                                                                                                     | `post`       | 上传请求方法                                                                                 |
| `multiple`        | `boolean`                                                                                                    | `false`      | 是否允许一次选择多个文件；关闭时只取第一个                                                   |
| `data`            | `UploadData \| Promise<UploadData> \| ((rawFile: UploadRawFile) => UploadAwaitable<UploadData>)`             | `{}`         | 随文件一起提交的额外字段：对象、Promise，或按文件返回对象 / Promise 的函数                   |
| `name`            | `string`                                                                                                     | `file`       | 文件在表单里的字段名                                                                         |
| `withCredentials` | `boolean`                                                                                                    | `false`      | 是否携带 cookie 等跨域凭证                                                                   |
| `showFileList`    | `boolean`                                                                                                    | `true`       | 是否显示已选文件列表                                                                         |
| `drag`            | `boolean`                                                                                                    | `false`      | 是否启用拖拽上传                                                                             |
| `accept`          | `string`                                                                                                     | `""`         | 可选文件类型，写法同原生 input 的 accept；拖拽放入和选择文件夹时组件也按它过滤               |
| `crossorigin`     | `'' \| 'anonymous' \| 'use-credentials'`                                                                     | -            | 列表图片的 crossorigin 属性，原样透传给 img                                                  |
| `listType`        | `'text' \| 'picture' \| 'picture-card'`                                                                      | `text`       | 文件列表形态：纯文字、带缩略图的列表或照片墙卡片                                             |
| `autoUpload`      | `boolean`                                                                                                    | `true`       | 选择文件后是否立即上传；关闭后需调用 `submit()` 手动上传                                     |
| `httpRequest`     | `(options: UploadRequestOptions) => { abort?: () => void } \| Promise<unknown> \| void`                      | `ajaxUpload` | 自定义上传实现，默认使用 XMLHttpRequest 提交 FormData；传入 `chunk` 后不再使用                |
| `chunk`           | `UploadChunkAdapter`                                                                                         | -            | 分片上传适配器，传入后按分片上传并支持暂停、继续与断点续传，字段见下方 `UploadChunkAdapter`    |
| `disabled`        | `boolean`                                                                                                    | `false`      | 是否禁用；禁用后不能选择文件，列表也不再显示删除按钮；继承表单禁用状态                       |
| `limit`           | `number`                                                                                                     | -            | 最多允许的文件数，本次选择会超出时触发 `onExceed`，且这批文件都不加入                        |
| `directory`       | `boolean`                                                                                                    | `false`      | 只能选择文件夹，夹内文件递归展开后逐个加入列表                                               |
| `onPreview`       | `(file: UploadFile) => void`                                                                                 | -            | 自定义文件预览，传入后替代内置的 RebornImage 图片预览，也可预览视频及其他文件                   |
| `onRemove`        | `(file: UploadFile, uploadFiles: UploadFile[]) => void`                                                      | -            | 文件从列表移除后触发                                                                         |
| `onSuccess`       | `(response: unknown, file: UploadFile, uploadFiles: UploadFile[]) => void`                                   | -            | 文件上传成功时触发                                                                           |
| `onError`         | `(error: Error, file: UploadFile, uploadFiles: UploadFile[]) => void`                                        | -            | 文件上传失败时触发，失败的文件保留在列表里                                                   |
| `onProgress`      | `(evt: UploadProgressEvent, file: UploadFile, uploadFiles: UploadFile[]) => void`                            | -            | 上传进度变化时触发，`evt.percent` 为 0–100                                                   |
| `onChange`        | `(file: UploadFile, uploadFiles: UploadFile[]) => void`                                                      | -            | 文件状态改变时触发：添加文件、上传成功、上传失败                                             |
| `onExceed`        | `(files: File[], uploadFiles: UploadUserFile[]) => void`                                                     | -            | 选择的文件数超出 `limit` 时触发                                                              |
| `beforeUpload`    | `(rawFile: UploadRawFile) => UploadAwaitable<void \| undefined \| null \| boolean \| File \| Blob>`          | -            | 上传前的钩子：返回 `false` 或被 reject 时中止上传并移除文件；返回 File / Blob 时改为上传它   |
| `beforeRemove`    | `(file: UploadFile, uploadFiles: UploadFile[]) => UploadAwaitable<boolean>`                                  | -            | 删除前的钩子：返回 `false` 或被 reject 时取消删除                                            |
| `class`           | `ClassValue`                                                                                                 | -            | 根元素样式覆盖                                                                               |
| `ui`              | `UploadUi`                                                                                                   | -            | 各部位样式覆盖，键位见下方「自定义样式（ui）」                                               |

`UploadFile` 的字段：`name`、`uid`、`status`（`ready` / `uploading` / `paused` / `success` / `fail`，`paused` 只在开启 `chunk` 时出现）、`percentage`、`size`、`url`、`response`、`errorMessage`、`raw`。`UploadRequestOptions` 传给 `httpRequest`：`action`、`method`、`data`（已解析成对象）、`filename`、`file`、`headers`、`withCredentials`，以及 `onProgress` / `onSuccess` / `onError` 三个回调。类型均从 `~/components/reborn/ui/reborn-upload` 导出。

#### UploadChunkAdapter

| 字段          | 类型                                                         | 默认值 | 描述                                                                                         |
| ------------- | ------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------- |
| `chunkSize`   | `number`                                                     | 5MB    | 每片字节数；空文件也按 1 片处理                                                              |
| `concurrency` | `number`                                                     | `3`    | 同时上传的分片数                                                                             |
| `retries`     | `number`                                                     | `2`    | 单片失败后的重试次数，第 n 次重试前等待 n 秒                                                 |
| `init`        | `(task: UploadChunkTask) => Promise<C> \| C`                 | -      | 开始上传前调用一次，返回值作为 `context` 传给后续各步；暂停后继续、失败后重试不再调用        |
| `uploaded`    | `(task: UploadChunkContextTask<C>) => Promise<number[]> \| number[]` | -      | 每次开始或继续前调用，返回服务端已收到的分片序号，这些分片不再上传；不提供时只跳过本次会话内传完的分片 |
| `uploadChunk` | `(part: UploadChunkPart<C>) => Promise<unknown>`             | -      | 上传单个分片，抛错或 reject 即视为失败并按 `retries` 重试                                    |
| `merge`       | `(task: UploadChunkContextTask<C>) => Promise<unknown> \| unknown` | -      | 全部分片传完后调用，返回值作为文件的 `response`                                              |

`UploadChunkTask` 含 `file`、`chunkSize`、`chunkCount`、`data`（已解析的额外字段）、`headers`、`withCredentials` 与 `signal`；`UploadChunkContextTask` 在此基础上多一个 `context`；`UploadChunkPart` 再多 `index`（从 0 开始）、`start` / `end`（字节区间，含头不含尾）、`blob` 与 `onProgress(percent)`。

### Emits

| 事件名            | 回调参数                  | 描述                                                 |
| ----------------- | ------------------------- | ---------------------------------------------------- |
| `update:fileList` | `files: UploadUserFile[]` | 文件加入、移除、清空时回写列表；进度与状态原地更新 |

### Slots

| 插槽名    | 作用域参数                              | 描述                                                                         |
| --------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| `default` | -                                       | 触发区内容；`text` / `picture` 非拖拽形态下组件不内置按钮，需在这里放按钮；同时提供 `trigger` 插槽时，改为渲染在触发区之后 |
| `trigger` | -                                       | 触发文件选择的内容，优先于默认插槽                                           |
| `tip`     | -                                       | 提示说明文字，拖拽模式在框内，普通 `text` / `picture` 在触发区下方，`picture-card` 下另起一行 |
| `file`    | `{ file: UploadFile, index: number }`   | 自定义单个文件的展示，替换整条列表项（照片墙下为整张卡片）的内容             |

### Expose

| 方法名         | 签名                                                     | 描述                                                                   |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `submit`       | `() => void`                                             | 上传所有待上传（`ready`）且带 `raw` 的文件；已暂停的文件不在其列，用 `resume()` 继续 |
| `abort`        | `(file?: UploadFile \| UploadRawFile) => void`           | 中止上传：传文件只中止它，不传则中止全部（含已暂停的）；被中止的文件回到 `ready`，分片断点一并丢弃 |
| `pause`        | `(file?: UploadFile \| UploadRawFile) => void`           | 暂停分片上传：传文件只暂停它，不传则暂停全部上传中的文件；未开启 `chunk` 时不做任何事 |
| `resume`       | `(file?: UploadFile \| UploadRawFile) => void`           | 继续分片上传：传文件只继续它，不传则继续全部已暂停与失败的文件；不再经过 `beforeUpload` |
| `clearFiles`   | `(statuses?: UploadStatus[]) => void`                    | 清空列表，可只清除指定状态的文件；上传中的请求一并中止                 |
| `handleStart`  | `(rawFile: UploadRawFile) => void`                       | 把一个原生文件加入列表（状态 `ready`），不发起上传，会触发 `onChange` |
| `handleRemove` | `(file: UploadFile \| UploadRawFile) => Promise<void>`   | 删除文件，先经过 `beforeRemove`；上传中的文件会同时中止请求            |

### 自定义样式（ui）

`ui` 以 Tailwind 类覆盖各部位，随文件状态变化的键（`item`、`itemAction`、`card`）会叠加在对应状态的默认样式之后。

| 键名         | 说明                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| `root`       | 根容器；`picture-card` 下是卡片与上传入口共用的换行 flex 容器，间距 16px       |
| `trigger`    | 触发区外壳；`text` / `picture` 非拖拽时只包住插槽内容，`picture-card` 下即 104px 的虚线上传卡片 |
| `dragger`    | 拖拽区，仅 `drag` 且非 `picture-card` 时渲染                                   |
| `tip`        | 提示文字容器，仅提供 `tip` 插槽时渲染                                          |
| `list`       | 文件列表容器，距上传区 12px；行间距 `text` 4px、`picture` 8px；`picture-card` 下为 `contents`，不占盒子 |
| `item`       | `text` / `picture` 的单条列表项，悬停为手型指针（禁用时为禁止光标，上传中为等待光标）；成功为主色、失败为红色；`picture` 下带 `gray-4` 描边，失败时换红色描边 |
| `itemIcon`   | 文件图标与上传中图标的容器；`text` 下 16px，`picture` 下 40px 灰底             |
| `itemThumb`  | `picture` 下已有地址的图片缩略图，视频为首帧，40px                             |
| `itemName`   | 文件名容器；传入 `onPreview` 时可点击                                          |
| `itemStatus` | 失败图标，悬停或聚焦显示失败原因；已暂停时为文件名后的灰色「已暂停」           |
| `itemActions`| 列表项右侧的按钮组，装控制按钮与删除按钮                                       |
| `itemControl`| 开启 `chunk` 时的暂停 / 继续 / 重试按钮，24px，常驻显示；失败时标红            |
| `itemAction` | 删除按钮，24px；`text` 下悬停整行才显示，失败的行常驻；失败时标红              |
| `progress`   | 上传中与已暂停时的 2px 进度条；`text` / `picture` 下左端与文件名对齐；已暂停时转灰 |
| `card`       | `picture-card` 的单张卡片，104px；失败时红色描边与浅红底                       |
| `cardImage`  | 卡片内图片或视频首帧，88px、2px 圆角                                           |
| `cardStatus` | 卡片内「上传中...」「已暂停」或非图片、视频文件的图标与文件名                  |
| `cardMask`   | 悬停图片或聚焦卡片内按钮时的操作遮罩，只盖住中间 88px 的图片区域               |
| `cardAction` | 遮罩上的预览、暂停 / 继续 / 重试、删除按钮，16px                               |

```vue
<RebornUpload
  v-model:file-list="files"
  action="/api/upload"
  list-type="picture-card"
  :ui="{ card: 'rounded-full', cardImage: 'rounded-full', trigger: 'rounded-full' }"
/>
```

## 注意事项

- **`text` / `picture` 的非拖拽形态不内置按钮**。触发区只是一层点击代理，需要在默认插槽放一个 `RebornButton`；外壳不设 `tabindex`，聚焦与回车 / 空格打开选择框都由按钮自己承担，避免出现两个 Tab 停靠点。所以插槽里应放可聚焦的按钮而不是纯文字，禁用时也要给按钮同步 `disabled`，组件只拦截点击、不改按钮外观。
- **超出 `limit` 时整批丢弃**。组件按「已有数量 + 本次选择数量」判断，超出就触发 `onExceed` 并且这一批一个都不加入，不会截取前几个；需要部分接收时在 `onExceed` 里自行调用 `handleStart`。
- **钩子是 prop 不是事件**。`onSuccess`、`beforeUpload` 等要写成 `:on-success`、`:before-upload`，写成 `@success` 不会被调用；列表变化唯一的事件是 `update:fileList`。
- **回显文件没有 `raw`，`submit()` 会跳过它们**。通过 `fileList` 传入的历史文件缺省状态补为 `success`；只有组件自己选进来的文件带 `raw`，才能被上传或重传。
- **`beforeUpload` 拦截后的移除不经过 `beforeRemove`**。返回 `false` 或 reject 时文件直接移出列表，但 `onRemove` 仍会触发；返回纯 `Blob` 时组件补上原文件名再上传，MIME 类型优先取 Blob 自身的，为空才沿用原文件。
- **未开 `multiple` 时只取第一个文件**。拖入多个文件同样只收第一个；`directory` 模式视为多选，不受此限。
- **拖入与选择文件夹都会按 `accept` 过滤**。浏览器只对点击选择的普通文件生效 accept，组件在拖放和文件夹两条路径上补做一次；非文件夹模式下拖入的文件夹会被忽略。
- **中止后文件回到 `ready` 而不是移除**。`abort()` 让上传中的文件进度归零、状态回到待上传，之后可以再次 `submit()`；要连同列表一起清掉用 `clearFiles()`。
- **自定义 `httpRequest` 返回值决定能否中止**。返回带 `abort` 方法的对象才能被 `abort()` 或删除时中止；返回 Promise 时其结果自动转交成功 / 失败；同步抛错直接标记失败。中止或重传后，旧请求迟到的回调会被丢弃。
- **`chunk` 与 `httpRequest` 二选一**。传入 `chunk` 后上传全部走分片适配器，`httpRequest` 与 `action` / `method` / `name` 不再生效；`data`、`headers`、`withCredentials` 照常解析后放进适配器各步的参数里，由调用方决定怎么用。
- **续传能跨多远取决于 `uploaded`**。组件只在内存里记录本次会话传完的分片，刷新页面或删掉文件后就没了；要做到「删掉文件再选同一个文件接着传」，`init` 须按文件指纹返回同一个会话，并提供 `uploaded` 让服务端报告已收到的分片。
- **`submit()` 不继续已暂停的文件**。暂停的文件状态是 `paused` 而不是 `ready`，用 `resume()` 继续；`resume()` 不再经过 `beforeUpload`，压缩等改写只在第一次上传前执行。`abort()` 会丢弃断点，之后 `submit()` 从第一片重新开始。
- **回显文件没有暂停 / 继续按钮**。控制按钮只给带 `raw` 的文件，通过 `fileList` 传入的历史文件不显示。
- **文件名只有在传入 `onPreview` 时才可点击**。不传时文件名是普通文本，`picture-card` 的遮罩也只剩删除按钮。
