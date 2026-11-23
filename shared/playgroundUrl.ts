/**
 * Playground 链接的编解码：把演示代码压进 URL 哈希（#code=<base64url>）。
 * 不依赖 Vue，浏览器与服务端（/mcp 的 get_playground_url）共用。
 */

/** 把代码编码为 URL 安全的 base64(供 hash 传递,兼容中文) */
export function encodePlaygroundCode(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 从 URL 安全 base64 还原代码,格式非法时返回 null */
export function decodePlaygroundCode(encoded: string): string | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** 生成带代码的 Playground 完整路径(相对站点根) */
export function buildPlaygroundUrl(code: string): string {
  return `/playground#code=${encodePlaygroundCode(code)}`;
}
