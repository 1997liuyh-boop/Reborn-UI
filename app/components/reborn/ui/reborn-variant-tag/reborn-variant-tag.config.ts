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
    container: "relative inline-flex overflow-hidden rounded-[20px] bg-white",
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
        inline: "min-h-[72px] px-4 py-2",
      },
      "activity-badge": {
        inline: "min-h-[42px] px-[6px] py-[6px]",
      },
      "status-tag": {
        inline: "min-h-[44px] px-[6px] py-[6px]",
      },
      "fold-corner": {
        overlay: "overflow-visible",
      },
    },
    size: {
      sm: {
        ribbon: "text-[12px]",
        label: "text-[12px]",
        subLabel: "text-[10px]",
      },
      md: {
        ribbon: "text-[16px]",
        label: "text-[16px]",
        subLabel: "text-[12px]",
      },
      lg: {
        ribbon: "text-[18px]",
        label: "text-[18px]",
        subLabel: "text-[14px]",
      },
    },
  },
  defaultVariants: {
    variant: "corner-ribbon" as VariantTagVariant,
    size: "md" as VariantTagSize,
  },
} as const;

export default config;
