export default {
    slots: {
        root: "relative top-0 left-0 right-0 z-40 w-full bg-bg-base/80 backdrop-blur-md transition-all duration-300",
        container: "mx-auto h-full flex items-center justify-between gap-4 max-w-(--ui-container)",
        left: "flex items-center gap-4 lg:flex-1",
        title: "text-title-xl font-bold text-text-primary flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0",
        center: "hidden lg:flex items-center justify-center gap-8 flex-1",
        right: "flex items-center justify-end gap-3 lg:flex-1",
        toggle: "lg:hidden p-2 text-text-secondary hover:bg-bg-sub rounded-lg transition-colors",
        drawer: "h-full flex flex-col bg-bg-base",
        drawerHeader: "p-4 flex items-center justify-between",
        drawerBody: "flex-1 overflow-y-auto p-4 flex flex-col gap-2",
        drawerFooter: "p-4 border-t border-border-divider",
    },
    variants: {
        sticky: {
            true: {
                root: "sticky",
            },
            false: {
                root: "",
            },
        },
    },
    defaultVariants: {
        sticky: false,
    },
} as const;
