# 配置文件规范 (UniApp)

## 1. 类型定义位置

**所有与组件外观相关的常量与类型必须定义在 `config.ts` 中**，包括：
- `color` 常量数组与类型。
- `size` 常量数组与类型。
- `variant` 常量数组与类型。
- `UI` Slots 类型定义。

## 2. 样式规范 (rpx)

- **单位**: 涉及高度、宽度、间距的样式值必须优先使用 `rpx` (例如 `h-[88rpx]`, `px-[32rpx]`)。
- **模式**: 必须采用 `tailwind-variants` (`tv`) 的 `slots` 模式。

## 3. 代码示例

```typescript
// 1. 定义常量数组
export const [name]Colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const [name]Sizes = ['sm', 'md', 'lg'] as const

// 2. 导出类型
export type [Name]Color = (typeof [name]Colors)[number]
export type [Name]Size = (typeof [name]Sizes)[number]
export type [Name]UI = {
    root?: string
    text?: string
}

// 3. 配置主体
const config = {
    slots: {
        root: 'w-full h-[88rpx] flex items-center justify-center', // 强制使用 rpx
        text: 'text-[28rpx]',
    },
    variants: {
        color: {
            primary: { root: 'bg-primary', text: 'text-white' },
        },
        size: {
            sm: { root: 'h-[64rpx]', text: 'text-[24rpx]' },
        }
    },
    defaultVariants: {
        color: 'neutral',
        size: 'md',
    },
} as const

export default config
```
