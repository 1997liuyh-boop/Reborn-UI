
export function transformToUniapp(code: string): string {
    // 1. 标签替换
    // div -> view
    // span, font -> text(注意：span可能嵌套，正则要注意)
    // ul, li -> view
    // img -> image
    // a -> navigator
    // select -> picker
    // iframe -> web-view

    let newCode = code;

    // 简单正则替换标签名
    const tagMap: Record<string, string> = {
        div: "view",
        span: "text",
        font: "text",
        ul: "view",
        li: "view",
        img: "image",
        a: "navigator",
        select: "picker",
        iframe: "web-view",
    };

    for (const [k, v] of Object.entries(tagMap)) {
        // 匹配 <tag ...> 和 </tag>
        // 1. <tag
        newCode = newCode.replace(new RegExp(`<${k}(\\s+|>)`, "g"), `<${v}$1`);
        // 2. </tag>
        newCode = newCode.replace(new RegExp(`<\\/${k}>`, "g"), `</${v}>`);
    }

    // 2. 特殊处理
    // input[type="search"] -> type="text" confirm-type="search"
    newCode = newCode.replace(/type=["']search["']/g, 'confirm-type="search"');

    return newCode;
}
