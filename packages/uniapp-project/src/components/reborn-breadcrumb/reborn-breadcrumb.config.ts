export default {
  slots: {
    root: "flex flex-row items-center flex-wrap gap-x-1.5 text-28 leading-none",
    item: "reborn-breadcrumb-item flex flex-row items-center gap-x-1.5 group",
    link: "text-gray-500 transition-colors flex flex-row items-center gap-1 group-first:text-gray-8 group-last:font-medium group-last:pointer-events-none",
    separator: "text-gray-400 select-none flex flex-row items-center justify-center text-24 group-last:hidden",
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
