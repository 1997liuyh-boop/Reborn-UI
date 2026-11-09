import type { KbIndexEntry } from "./kb.js";

/**
 * 组件加权检索：id 精确 > title 精确 > 别名精确 > id 包含 > title 包含 > 别名包含 > tags > description。
 *
 * 查询词按空白切分后逐词累加得分，全部词都未命中的组件被过滤。
 * 别名（aliases）是人工维护的同义词：同一外观在 Element / Ant / MUI 里的叫法、中英文同义词、
 * UI 稿上的样子（"红点""胶囊标签"）。中文查询常常不分词（"状态标签"），所以别名匹配是双向包含：
 * 别名含查询词，或查询词含别名（别名至少 2 个字符，防止"点""框"这类单字把全库都命中）。
 */
export function searchComponents(
  entries: KbIndexEntry[],
  query: string,
): Array<KbIndexEntry & { score: number }> {
  const phrase = query.trim().toLowerCase();
  const terms = phrase.split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  // 多词查询（"toggle group""radio button"）还要整句对别名匹配一次：
  // 拆成单词后 toggle 会落到 Switch、button 会落到 Button，整句命中才把它拉回正确的组件
  const multiWord = terms.length > 1;

  const scored: Array<KbIndexEntry & { score: number }> = [];
  for (const e of entries) {
    const id = e.id.toLowerCase();
    const title = (e.title ?? "").toLowerCase();
    const aliases = (e.aliases ?? []).map((a) => a.toLowerCase());
    const tags = (e.tags ?? []).map((t) => t.toLowerCase());
    const description = (e.description ?? "").toLowerCase();

    // 整句原样命中一条多词别名（"floating action button"）比单词各自命中可信得多，给 100：
    // 否则 button 一个词就能让 Button 靠 id / title / tag / 别名叠分压过 Fab
    let score = multiWord ? aliasScore(aliases, phrase, 100) : 0;
    for (const term of terms) {
      if (id === term) score += 100;
      else if (id.includes(term)) score += 40;
      if (title === term) score += 60;
      else if (title.includes(term)) score += 30;
      score += aliasScore(aliases, term);
      if (tags.includes(term)) score += 20;
      else if (tags.some((t) => t.includes(term))) score += 10;
      if (description.includes(term)) score += 8;
    }
    if (score > 0) scored.push({ ...e, score });
  }

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * 一个查询词对一组别名的得分：取最高的一条，不累加（多条别名都沾边不代表更相关）。
 * 别名精确命中给 70，要高于「title 包含 30 + 别名包含 30」：
 * 搜「标签」时 Badge（别名就是「标签」）要压过 Tabs（title「标签页」与别名「标签页」都只是包含）。
 */
function aliasScore(aliases: string[], term: string, exact = 70): number {
  let best = 0;
  for (const alias of aliases) {
    if (alias === term) return exact;
    if (alias.includes(term)) best = Math.max(best, 30);
    else if (alias.length >= 2 && term.includes(alias)) best = Math.max(best, 25);
  }
  return best;
}
