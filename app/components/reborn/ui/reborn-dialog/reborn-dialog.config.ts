export default {
  slots: {
    trigger: "inline-flex",
    root: "fixed inset-0",
    backdrop: "absolute inset-0 bg-black/45 backdrop-blur-[2px]",
    shell: "absolute inset-0 flex items-center justify-center p-4 sm:p-6",
    panel:
      "relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-ui-md border border-black/5 bg-white text-gray-900 shadow-[0_32px_90px_rgba(15,23,42,0.22)]",
    header: "flex items-start justify-between gap-4 border-b border-gray-2 px-4 py-3",
    headerContent: "min-w-0 flex-1 space-y-1",
    title: "text-title-md font-semibold leading-[1.35] text-gray-900",
    description: "text-body-sm leading-[1.6] text-gray-500",
    close: "shrink-0",
    body: "px-4 py-3",
    footer: "flex items-center justify-end gap-3 border-t border-gray-2 px-4 py-2",
  },
  variants: {
    overlay: {
      true: {
        backdrop: "",
      },
      false: {
        backdrop: "bg-transparent backdrop-blur-0",
      },
    },
    scrollable: {
      true: {
        panel: "max-h-[min(86vh,760px)]",
        body: "overflow-y-auto",
      },
      false: {
        body: "overflow-visible",
      },
    },
    fullscreen: {
      true: {
        shell: "p-0",
        panel: "h-full max-h-none max-w-none rounded-none border-0",
        header: "px-8 py-6",
        body: "min-h-0 flex-1 px-8 py-6",
        footer: "px-8 py-5",
      },
      false: {},
    },
    draggable: {
      true: {
        header: "cursor-move select-none",
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      fullscreen: true as const,
      scrollable: true as const,
      class: {
        panel: "h-screen",
        body: "overflow-y-auto",
      },
    },
  ],
  defaultVariants: {
    overlay: true,
    scrollable: false,
    fullscreen: false,
    draggable: false,
  },
};
