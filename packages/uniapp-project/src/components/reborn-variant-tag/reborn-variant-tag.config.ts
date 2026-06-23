export const variantTagColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;
export const variantTagVariants = [
  "corner-ribbon",
  "promo-badge",
  "activity-badge",
  "status-tag",
  "fold-corner",
] as const;
export const variantTagPositions = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export const variantTagSizes = ["sm", "md", "lg"] as const;

export type VariantTagColor = (typeof variantTagColors)[number];
export type VariantTagVariant = (typeof variantTagVariants)[number];
export type VariantTagPosition = (typeof variantTagPositions)[number];
export type VariantTagSize = (typeof variantTagSizes)[number];

export interface VariantTagUI {
  root?: string;
  container?: string;
  overlay?: string;
  ribbon?: string;
  inline?: string;
  label?: string;
  subLabel?: string;
}

const config = {
  slots: {
    root: "relative inline-flex max-w-full align-middle",
    container: "relative inline-flex overflow-hidden rounded-[40rpx] bg-white",
    overlay: "pointer-events-none absolute z-[2]",
    ribbon: "flex items-center justify-center font-black tracking-[0.08em]",
    inline: "inline-flex items-center justify-center overflow-hidden whitespace-nowrap",
    label: "block leading-none",
    subLabel: "block leading-none",
  },
  variants: {
    variant: {
      "corner-ribbon": {
        overlay: "overflow-hidden",
      },
      "promo-badge": {
        inline: "min-h-[144rpx] px-[24rpx] py-[12rpx]",
      },
      "activity-badge": {
        inline: "min-h-[84rpx] px-[12rpx] py-[12rpx]",
      },
      "status-tag": {
        inline: "min-h-[88rpx] px-[12rpx] py-[12rpx]",
      },
      "fold-corner": {
        overlay: "overflow-visible",
      },
    },
    size: {
      sm: {
        ribbon: "text-24",
        label: "text-24",
        subLabel: "text-20",
      },
      md: {
        ribbon: "text-28",
        label: "text-28",
        subLabel: "text-24",
      },
      lg: {
        ribbon: "text-32",
        label: "text-32",
        subLabel: "text-28",
      },
    },
  },
  defaultVariants: {
    variant: "corner-ribbon" as VariantTagVariant,
    size: "md" as VariantTagSize,
  },
} as const;

export default config;
