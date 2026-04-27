export default {
  slots: {
    root: "flex items-center flex-wrap gap-x-1.5 text-sm leading-none",
    item: "reborn-breadcrumb-item flex items-center gap-x-1.5 group",
    link: "text-gray-7 transition-colors flex items-center gap-1 group-first:text-gray-8 group-first:font-semibold group-last:font-medium group-last:cursor-default group-last:pointer-events-none",
    separator: "text-gray-4 select-none flex items-center justify-center text-xs group-last:hidden",
  },
  variants: {
    active: {
      true: {
        link: "hover:text-primary cursor-pointer",
      },
      false: {
        link: "cursor-default pointer-events-none",
      },
    },
  },
};
