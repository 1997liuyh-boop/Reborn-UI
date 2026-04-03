const carouselArrowModes = ["hover", "always", "never"] as const;
const carouselDirections = ["horizontal", "vertical"] as const;
const carouselIndicatorPositions = ["inside", "outside", "none"] as const;
const carouselTriggers = ["hover", "click"] as const;
const carouselTypes = ["default", "card"] as const;

const carouselColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const carouselIndicatorTypes = ["line", "dot", "fraction", "button"] as const;

export {
  carouselArrowModes,
  carouselDirections,
  carouselIndicatorPositions,
  carouselTriggers,
  carouselTypes,
  carouselColors,
  carouselIndicatorTypes,
};

export default {
  slots: {
    root: "group/reborn-carousel relative isolate w-full min-w-0 max-w-full overflow-hidden",
    wrapper: "w-full max-w-full min-w-0 overflow-hidden",
    viewport:
      "relative w-full min-w-0 max-w-full overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    track: "flex w-full min-w-full items-stretch",
    slide: "relative min-w-0 max-w-full shrink-0 transition-all duration-500 will-change-transform",
    slideInner:
      "relative w-full overflow-hidden isolate translate-z-0 backface-hidden rounded-[inherit]",
    arrowGroup:
      "pointer-events-none absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 justify-between max-w-(--ui-container) mx-auto",
    arrow:
      "pointer-events-auto cursor-pointer size-10 rounded-full inline-flex items-center justify-center bg-[#302F33]/45 backdrop-blur-3xl border border-[#BABCBF] shadow-lg text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30",
    indicatorWrapper: "flex justify-center",
    indicators:
      "flex items-center gap-2 pointer-events-auto",
    indicator: "rounded-full transition-all duration-300 ease-out",
    indicatorActive: "bg-slate-900 dark:bg-white",
    indicatorInactive: "bg-slate-400/60 dark:bg-slate-500/60",
    slideActive: "",
    slideInactive: "",
  },
  variants: {
    indicatorPosition: {
      inside: {
        indicators: "rounded-full border border-white/60 bg-white/72 px-3 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 pointer-events-auto",
        indicatorWrapper: "pointer-events-none absolute inset-x-0 bottom-4 z-20",
      },
      outside: {
        indicatorWrapper: "mt-5",
      },
      none: {
        indicatorWrapper: "hidden",
      },
    },
    direction: {
      horizontal: {
        viewport: "overflow-x-auto overflow-y-hidden",
        track: "flex-row",
        slide: "h-full",
      },
      vertical: {
        wrapper: "flex flex-row items-center",
        viewport: "overflow-y-auto overflow-x-hidden",
        track: "flex-col",
        slide: "w-full",
        indicatorWrapper: "inset-y-0 inset-x-auto items-center",
        indicators: "flex-col",
      },
    },
    type: {
      default: {
        slideInactive: "opacity-80",
      },
      card: {
        viewport: "py-4",
        slide: "origin-center",
        slideActive: "z-10 scale-[1.05] opacity-100 ring-1 ring-white/10",
        slideInactive: "scale-[0.9] opacity-70 ring-1 ring-white/5",
      },
    },
    motionBlur: {
      true: {
        slideInactive: "blur-[1.5px]",
      },
      false: {},
    },
    arrow: {
      hover: {
        arrowGroup:
          "opacity-0 transition-opacity duration-300 group-hover/reborn-carousel:opacity-100 group-focus-within/reborn-carousel:opacity-100",
      },
      always: {},
      never: {
        arrowGroup: "hidden",
      },
    },
    color: {
      primary: {
        indicatorActive: "bg-primary",
      },
      secondary: {
        indicatorActive: "bg-secondary",
      },
      success: {
        indicatorActive: "bg-success",
      },
      info: {
        indicatorActive: "bg-info",
      },
      warning: {
        indicatorActive: "bg-warning",
      },
      error: {
        indicatorActive: "bg-error",
      },
      neutral: {
        indicatorActive: "bg-neutral",
      },
    },
    indicatorType: {
      line: {
        indicator: "h-2",
        indicatorActive: "w-8",
        indicatorInactive: "w-2",
      },
      dot: {
        indicator: "size-2",
        indicatorActive: "",
        indicatorInactive: "bg-gray-5",
      },
      fraction: {
        indicators: "border-none shadow-none p-1 dark:bg-transparent gap-1",
      },
      button: {
        indicators: "border-none shadow-none p-1 dark:bg-transparent gap-2",
        indicator: "flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none size-5 text-[10px] text-white",
        indicatorActive: "text-white border-transparent",
        indicatorInactive: "bg-gray-2 ring-1 ring-gray-5 text-gray-5",
      },
    },
  },
  defaultVariants: {
    direction: "horizontal" as (typeof carouselDirections)[number],
    type: "default" as (typeof carouselTypes)[number],
    arrow: "hover" as (typeof carouselArrowModes)[number],
    color: "primary" as (typeof carouselColors)[number],
    indicatorType: "line" as (typeof carouselIndicatorTypes)[number],
  },
};
