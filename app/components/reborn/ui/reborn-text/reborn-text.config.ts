const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { colors as textColors };

export default {
    slots: {
        base: "inline [flex-shrink:unset]",
    },
    variants: {
        preWrap: {
            true: {
                base: "whitespace-pre-wrap",
            },
        },
        color: {
            primary: { base: "text-primary" },
            secondary: { base: "text-secondary" },
            success: { base: "text-success" },
            info: { base: "text-info" },
            warning: { base: "text-warning" },
            error: { base: "text-error" },
            neutral: { base: "text-neutral" },
        },
        ellipsis: {
            true: {
                base: "text-ellipsis overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [line-break:anywhere]",
            },
        },
    },
};
