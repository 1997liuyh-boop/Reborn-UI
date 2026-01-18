export const tabsTypes = ["line", "card", "segment"] as const;
export const tabsVariants = ["primary", "secondary", "info", "success", "warning", "error", "neutral"] as const;
export const tabsSizes = ["sm", "md", "lg"] as const;
export const tabsOrientations = ["horizontal", "vertical"] as const;

export default {
  slots: {
    root: "flex flex-col w-full",
    list: "relative flex flex-row items-center w-full overflow-x-auto overflow-y-hidden box-border [&::-webkit-scrollbar]:hidden",
    item: "flex items-center justify-center whitespace-nowrap transition-all border-b-2 border-transparent relative z-10",
    text: "font-medium transition-colors",
    indicator: "absolute bottom-0 left-0 bg-primary transition-all duration-300 z-0",
    content: "w-full",
    scroll: "w-full h-full"
  },
  variants: {
    type: {
      line: {
         list: "border-b border-gray-200 dark:border-gray-700",
         item: "bg-transparent",
         indicator: "h-0.5 rounded-t-sm", 
      },
      card: {
         list: "bg-gray-100 p-1 rounded-lg gap-1 dark:bg-gray-800",
         item: "rounded-md",
         indicator: "hidden" 
      },
      segment: {
         list: "bg-gray-100 p-1 rounded-lg gap-1 dark:bg-gray-800",
         item: "rounded-md flex-1",
         indicator: "absolute bg-white shadow-sm rounded-md h-full top-0" // Requires special handling for positioning
      }
    },
    size: {
      sm: {
        item: "px-3 py-1.5 text-xs",
        text: "text-xs"
      },
      md: {
        item: "px-4 py-2 text-sm",
        text: "text-sm"
      },
      lg: {
         item: "px-5 py-2.5 text-base",
         text: "text-base"
      }
    },
    variant: {
        primary: {
            indicator: "bg-primary",
            text: "text-gray-500 hover:text-gray-700 data-[state=active]:text-primary"
        },
        // ... map other colors if needed, primarily affects text active color and indicator bg
    },
    orientation: {
        horizontal: {
             root: "flex-col",
             list: "flex-row border-b",
             item: "border-b-2 border-transparent",
        },
        vertical: {
             root: "flex-row",
             list: "flex-col border-r w-auto h-full",
             item: "border-r-2 border-transparent w-full justify-start px-4",
             indicator: "right-0 w-0.5 h-full top-0 bottom-auto"
        }
    },
    fill: {
        true: {
            item: "flex-1"
        }
    }
  },
  compoundVariants: [
      {
          type: 'card',
          class: {
              item: "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground"
          }
      },
      {
          type: 'segment',
          class: {
              item: "z-10 data-[state=active]:text-foreground"
          }
      }
  ],
  defaultVariants: {
    type: "line",
    size: "md",
    variant: "primary",
    orientation: "horizontal",
    fill: false
  }
}
