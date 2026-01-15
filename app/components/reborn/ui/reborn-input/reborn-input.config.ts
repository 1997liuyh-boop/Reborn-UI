const size = ["sm", "md", "lg"] as const;

export { size as inputSizes };

export default {
  slots: {
    wrapper:
      "relative inline-flex w-full items-center gap-3 rounded-full bg-gray-2 text-gray-8 transition-colors ring-1 ring-transparent focus-within:bg-white focus-within:ring-gray-8/20 data-[filled=true]:bg-white data-[disabled=true]:bg-gray-3 data-[disabled=true]:text-gray-5 dark:bg-gray-800 dark:text-gray-200 dark:focus-within:bg-gray-900 dark:focus-within:ring-gray-200/20 dark:data-[filled=true]:bg-gray-900 dark:data-[disabled=true]:bg-gray-800 dark:data-[disabled=true]:text-gray-500",
    input:
      "min-w-0 flex-1 bg-transparent text-gray-8 placeholder:text-gray-5 outline-none disabled:cursor-not-allowed dark:text-gray-200 dark:placeholder:text-gray-500",
    leading: "inline-flex items-center text-gray-6 dark:text-gray-400",
    trailing: "inline-flex items-center text-gray-6 dark:text-gray-400",
  },
  variants: {
    fieldGroup: {
      horizontal:
        "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-within:z-[1]",
      vertical:
        "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-within:z-[1]",
    },
    size: {
      sm: {
        wrapper: "h-[var(--input-sm-height)] px-4 text-[length:var(--text-size-26)] leading-[1.5]",
        input: "text-[length:var(--text-size-26)] leading-[1.5]",
      },
      md: {
        wrapper: "h-[var(--input-md-height)] px-5 text-[length:var(--text-size-28)] leading-[1.5]",
        input: "text-[length:var(--text-size-28)] leading-[1.5]",
      },
      lg: {
        wrapper: "h-[var(--input-lg-height)] px-6 text-[length:var(--text-size-32)] leading-[1.5]",
        input: "text-[length:var(--text-size-32)] leading-[1.5]",
      },
    },
    multiline: {
      true: {
        wrapper: "h-auto items-start rounded-2xl py-4",
        input: "min-h-[160px] resize-none",
      },
    },
  },
  defaultVariants: {
    size: "md" as (typeof size)[number],
  },
};
