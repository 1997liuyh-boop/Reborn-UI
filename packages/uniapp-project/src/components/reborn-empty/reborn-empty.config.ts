import { tv } from '@/lib/tv'

/**
 * 内置默认插画，与 Web 端同一张图：48×48 的灰色空箱子，单色 #C9CDD4。
 * 用 base64 data URI 而不是 /static 下的文件，是为了让组件被复制进别的工程后仍然开箱即用，
 * 不依赖任何随附资源。
 */
export const EMPTY_DEFAULT_IMAGE
  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBmaWxsPSJub25lIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Zz48cGF0aCBkPSJNMjQuNzYsNEMyNC43NiwzLjU5LDI0LjQyLDMuMjUsMjQuMDEsMy4yNUMyMy42LDMuMjUsMjMuMjYsMy41OSwyMy4yNiw0TDIzLjI2LDEwQzIzLjI2LDEwLjQxLDIzLjYsMTAuNzUsMjQuMDEsMTAuNzVDMjQuNDIsMTAuNzUsMjQuNzYsMTAuNDEsMjQuNzYsMTBMMjQuNzYsNFpNMTcuMjYsMzJDMTcuMjYsMzEuNTksMTcuNiwzMS4yNSwxOC4wMSwzMS4yNUwzMC4wMSwzMS4yNUMzMC40MiwzMS4yNSwzMC43NiwzMS41OSwzMC43NiwzMkMzMC43NiwzMi40MSwzMC40MiwzMi43NSwzMC4wMSwzMi43NUwxOC4wMSwzMi43NUMxNy42LDMyLjc1LDE3LjI2LDMyLjQxLDE3LjI2LDMyWk01LjAxLDQ0Ljc1QzQuNiw0NC43NSw0LjI2LDQ0LjQxLDQuMjYsNDRMNC4yNiwyNkM0LjI2LDI1Ljg0LDQuMzEsMjUuNjksNC40LDI1LjU2TDkuNCwxOC41NkM5LjU0LDE4LjM3LDkuNzcsMTguMjUsMTAuMDEsMTguMjVMMzguMDEsMTguMjVDMzguMjUsMTguMjUsMzguNDgsMTguMzcsMzguNjIsMTguNTZMNDMuNjIsMjUuNTZDNDMuNzEsMjUuNjksNDMuNzYsMjUuODQsNDMuNzYsMjZMNDMuNzYsNDRDNDMuNzYsNDQuNDEsNDMuNDIsNDQuNzUsNDMuMDEsNDQuNzVMNS4wMSw0NC43NVpNNS43NiwyNi43NUw1Ljc2LDQzLjI1TDQyLjI2LDQzLjI1TDQyLjI2LDI2Ljc1TDUuNzYsMjYuNzVaTTYuNDcsMjUuMjVMNDEuNTUsMjUuMjVMMzcuNjIsMTkuNzVMMTAuNCwxOS43NUw2LjQ3LDI1LjI1Wk00LjY1LDUuMzRDNS4wMyw1LjE4LDUuNDgsNS4zNCw1LjY3LDUuNzFMOC40LDExLjA1QzguNTksMTEuNDEsOC40MywxMS44Niw4LjA2LDEyLjAyQzcuNjcsMTIuMTksNy4yMiwxMi4wMyw3LjAzLDExLjY2TDQuMyw2LjMyQzQuMTEsNS45NSw0LjI3LDUuNTEsNC42NSw1LjM0Wk00MS45Miw1LjcxQzQyLjEyLDUuMzQsNDIuNTYsNS4xOCw0Mi45NSw1LjM0QzQzLjMyLDUuNTEsNDMuNDgsNS45NSw0My4yOSw2LjMyTDQwLjU3LDExLjY2QzQwLjM3LDEyLjAzLDM5LjkzLDEyLjE5LDM5LjU0LDEyLjAzQzM5LjE2LDExLjg2LDM5LjAxLDExLjQxLDM5LjIsMTEuMDVMNDEuOTIsNS43MVoiIGZpbGw9IiNDOUNERDQiIGZpbGwtb3BhY2l0eT0iMSIvPjwvZz48L3N2Zz4='

export const emptyTheme = tv({
  slots: {
    // 图片 /（标题 + 描述）/ 操作区三段，段间 48rpx（24px），整体居中
    root: 'reborn-empty flex w-full flex-col items-center gap-[48rpx] text-center',
    // 图片区只负责居中，不限制尺寸：image 插槽塞进来的插画自己决定大小
    image: 'flex shrink-0 items-center justify-center',
    // 默认插画宽 96rpx（48px），高度交给 image 的 widthFix 按原图比例推；image-size 会以行内样式覆盖宽度
    imageGraphic: 'w-[96rpx] max-w-full',
    // 标题与描述同属一段，段内 8rpx（4px）
    content: 'flex min-w-0 max-w-full flex-col items-center gap-[8rpx]',
    title: 'text-28 font-medium leading-[1.5] text-gray-8 dark:text-gray-1',
    description: 'text-28 font-normal leading-[1.5] text-gray-7 dark:text-gray-4',
    // 操作区通常放按钮，横向排列、可换行
    extra: 'flex flex-wrap items-center justify-center gap-[24rpx]',
  },
})

/** 空状态 UI 样式覆盖接口 */
export interface EmptyUI {
  root?: string
  image?: string
  imageGraphic?: string
  content?: string
  title?: string
  description?: string
  extra?: string
}

export default emptyTheme
