const color = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral"
] as const

const variant = [
  "solid",
  "outline",
  "soft",
  "subtle"
] as const

const size = [
  "xs",
  "sm",
  "default", // Mapped to md
  "md",
  "lg",
  "xl",
  "2xl",
  "icon-xs",
  "icon-sm",
  "icon", // Mapped to icon-md
  "icon-md",
  "icon-lg",
  "icon-xl",
  "icon-2xl"
] as const

export {
  color as buttonColors,
  variant as buttonVariants,
  size as buttonSizes
}

export default {
  "slots": {
    "base": "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-gray-4 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    "label": "truncate",
    "leadingIcon": "shrink-0",
    "leadingAvatar": "shrink-0",
    "leadingAvatarSize": "",
    "trailingIcon": "shrink-0"
  },
  "variants": {
    "fieldGroup": {
      "horizontal": "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]",
      "vertical": "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]"
    },
    "color": {
      "primary": "",
      "secondary": "",
      "success": "",
      "info": "",
      "warning": "",
      "error": "",
      "neutral": ""
    },
    "variant": {
      "solid": "",
      "outline": "",
      "soft": "",
      "subtle": ""
    },
    "size": {
      "xs": { "base": "h-[var(--button-xs-height)] text-24 leading-[1.5] gap-1.5 px-3 has-[>svg]:px-2.5" },
      "sm": { "base": "h-[var(--button-sm-height)] text-24 leading-[1.5] gap-1.5 px-3 has-[>svg]:px-2.5" },
      "default": { "base": "h-[var(--button-base-height)] text-26 leading-[1.5] px-4 py-4 has-[>svg]:px-3" },
      "md": { "base": "h-[var(--button-base-height)] text-26 leading-[1.5] px-4 py-4 has-[>svg]:px-3" },
      "lg": { "base": "h-[var(--button-lg-height)] text-28 leading-[1.5] px-6 has-[>svg]:px-4" },
      "xl": { "base": "h-[var(--button-xl-height)] text-30 leading-[1.5] px-6 has-[>svg]:px-4" },
      "2xl": { "base": "h-[var(--button-2xl-height)] text-32 leading-[1.5] px-6 has-[>svg]:px-4" },
      "icon-xs": { "base": "" },
      "icon-sm": { "base": "size-[var(--button-sm-height)]" },
      "icon": { "base": "size-[var(--button-base-height)]" },
      "icon-md": { "base": "size-[var(--button-base-height)]" },
      "icon-lg": { "base": "size-[var(--button-lg-height)]" },
      "icon-xl": { "base": "size-[var(--button-xl-height)]" },
      "icon-2xl": { "base": "size-[var(--button-2xl-height)]" }
    },
    "square": {
      "true": { "base": "p-0" } 
    }
  },
  "compoundVariants": [
    // Solid Variants
    {
      "color": "primary" as typeof color[number],
      "variant": "solid" as typeof variant[number],
      "class": "bg-blue-6 text-white hover:bg-blue-5"
    },
    {
      "color": "secondary" as typeof color[number], // Secondary not in original, defaulting to Purple/Violet or Gray? User had Info=Gray. I'll make Secondary=Violet
      "variant": "solid" as typeof variant[number],
      "class": "bg-violet-6 text-white hover:bg-violet-5"
    },
    {
      "color": "success" as typeof color[number],
      "variant": "solid" as typeof variant[number],
      "class": "bg-green-6 text-white hover:bg-green-5"
    },
    {
      "color": "info" as typeof color[number], // User's original info was gray-8. I will keep that as explicit choice.
      "variant": "solid" as typeof variant[number],
      "class": "bg-gray-8 text-white hover:bg-gray-7"
    },
    {
      "color": "warning" as typeof color[number],
      "variant": "solid" as typeof variant[number],
      "class": "bg-orange-6 text-white hover:bg-orange-5"
    },
    {
      "color": "error" as typeof color[number], // User's original default was red.
      "variant": "solid" as typeof variant[number],
      "class": "bg-red-6 text-white hover:bg-red-5"
    },
    {
      "color": "neutral" as typeof color[number],
      "variant": "solid" as typeof variant[number],
      "class": "bg-gray-6 text-white hover:bg-gray-5"
    },

    // Outline Variants
    {
      "color": "primary" as typeof color[number],
      "variant": "outline" as typeof variant[number],
      "class": "bg-transparent text-blue-6 border border-blue-6 hover:bg-blue-5/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6"
    },
    {
      "color": "secondary" as typeof color[number],
      "variant": "outline" as typeof variant[number],
      "class": "bg-transparent text-violet-6 border border-violet-6 hover:bg-violet-5/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6"
    },
    {
      "color": "success" as typeof color[number],
      "variant": "outline" as typeof variant[number],
      "class": "bg-transparent text-green-6 border border-green-6 hover:bg-green-5/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6"
    },
    {
      "color": "info" as typeof color[number],
      "variant": "outline" as typeof variant[number],
      "class": "bg-transparent text-gray-8 border border-gray-8 hover:bg-gray-7/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6"
    },
    {
      "color": "warning" as typeof color[number],
      "variant": "outline" as typeof variant[number],
      "class": "bg-transparent text-orange-6 border border-orange-6 hover:bg-orange-5/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6"
    },
    {
      "color": "error" as typeof color[number],
      "variant": "outline" as typeof variant[number],
      "class": "bg-transparent text-red-6 border border-red-6 hover:bg-red-5/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6"
    },
    {
      "color": "neutral" as typeof color[number],
      "variant": "outline" as typeof variant[number],
      "class": "bg-transparent text-gray-6 border border-gray-6 hover:bg-gray-5/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6"
    },

    // Soft Variants (Freestyling as requested, using lighter 1/2 shades)
    {
      "color": "primary" as typeof color[number],
      "variant": "soft" as typeof variant[number],
      "class": "bg-blue-1 text-blue-7 hover:bg-blue-2"
    },
    {
      "color": "secondary" as typeof color[number],
      "variant": "soft" as typeof variant[number],
      "class": "bg-violet-1 text-violet-7 hover:bg-violet-2"
    },
    {
      "color": "success" as typeof color[number],
      "variant": "soft" as typeof variant[number],
      "class": "bg-green-1 text-green-7 hover:bg-green-2"
    },
    {
      "color": "info" as typeof color[number],
      "variant": "soft" as typeof variant[number],
      "class": "bg-gray-2 text-gray-8 hover:bg-gray-3" // Gray-1 is white, so use 2/3
    },
    {
      "color": "warning" as typeof color[number],
      "variant": "soft" as typeof variant[number],
      "class": "bg-orange-1 text-orange-7 hover:bg-orange-2"
    },
    {
      "color": "error" as typeof color[number],
      "variant": "soft" as typeof variant[number],
      "class": "bg-red-1 text-red-7 hover:bg-red-2"
    },
    {
      "color": "neutral" as typeof color[number],
      "variant": "soft" as typeof variant[number],
      "class": "bg-gray-1 text-gray-7 hover:bg-gray-2"
    },

    // Subtle Variants (Transparent bg, colored text, hover light bg)
    {
      "color": "primary" as typeof color[number],
      "variant": "subtle" as typeof variant[number],
      "class": "bg-transparent text-blue-7 hover:bg-blue-1"
    },
    {
      "color": "secondary" as typeof color[number],
      "variant": "subtle" as typeof variant[number],
      "class": "bg-transparent text-violet-7 hover:bg-violet-1"
    },
    {
      "color": "success" as typeof color[number],
      "variant": "subtle" as typeof variant[number],
      "class": "bg-transparent text-green-7 hover:bg-green-1"
    },
    {
      "color": "info" as typeof color[number],
      "variant": "subtle" as typeof variant[number],
      "class": "bg-transparent text-gray-8 hover:bg-gray-2"
    },
    {
      "color": "warning" as typeof color[number],
      "variant": "subtle" as typeof variant[number],
      "class": "bg-transparent text-orange-7 hover:bg-orange-1"
    },
    {
      "color": "error" as typeof color[number],
      "variant": "subtle" as typeof variant[number],
      "class": "bg-transparent text-red-7 hover:bg-red-1"
    },
    {
      "color": "neutral" as typeof color[number],
      "variant": "subtle" as typeof variant[number],
      "class": "bg-transparent text-gray-7 hover:bg-gray-1"
    }
  ],
  "defaultVariants": {
    "color": "primary" as typeof color[number],
    "variant": "solid" as typeof variant[number],
    "size": "md" as typeof size[number]
  }
}
