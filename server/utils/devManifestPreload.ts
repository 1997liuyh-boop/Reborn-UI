/** 开发清单只在客户端导航时需要，不应占用首屏预加载队列。 */
export function removeDevManifestPreload(head: string): string {
  return head.replace(/<link\b[^>]*>/gi, (tag) => {
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1];
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    return rel === "preload" && href && /\/builds\/meta\/dev\.json(?:[?#]|$)/.test(href) ? "" : tag;
  });
}
