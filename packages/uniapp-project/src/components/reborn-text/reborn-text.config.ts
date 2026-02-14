export const textColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export default {
    slots: {
        // #ifndef APP
        base: "reborn-text [flex-shrink:unset] text-28",
        // #endif
        // #ifdef APP
        // @ts-ignore
        base: "reborn-text text-28",
        // #endif
    },
    variants: {
        preWrap: {
            true: {
                // #ifndef APP
                base: "whitespace-pre-wrap",
                // #endif
            },
        },
        color: {
            primary: "text-primary",
            secondary: "text-secondary",
            success: "text-success",
            info: "text-info",
            warning: "text-warning",
            error: "text-error",
            neutral: "text-neutral",
        },
        ellipsis: {
            true: {
                base: [
                    "text-ellipsis overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [line-break:anywhere]",
                ]
            }
        }
    }
};
