const STOPWORDS = new Set(['a', 'à', 'ao', 'aos', 'as', 'às', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e', 'ela', 'ele', 'eles', 'em', 'era', 'é', 'isso', 'já', 'la', 'lhe', 'mais', 'mas', 'me', 'meu', 'na', 'não', 'nas', 'no', 'nos', 'nós', 'o', 'os', 'ou', 'para', 'péla', 'pela', 'pelos', 'por', 'que', 'quem', 'se', 'sem', 'seu', 'só', 'sua', 'também', 'te', 'tem', 'um', 'uma', 'você', 'vocês', 'dele', 'dela', 'porque', 'pra', 'pro', 'tá', 'né', 'ai', 'aí', 'até', 'dos', 'essa', 'esse']);

export function stopwordRatio(text) {
  const words = String(text)
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) return 0;
  const hits = words.filter((w) => STOPWORDS.has(w)).length;
  return hits / words.length;
}

export function hasMojibake(text) {
  if (/\\ufffd/.test(String(text))) return true;
  for (const ch of String(text)) {
    const code = ch.codePointAt(0);
    if (code === 0xFFFD) return true;
    if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3040 && code <= 0x30FF) || (code >= 0xAC00 && code <= 0xD7AF)) {
      return true;
    }
  }
  return /Ã[©£ª³µ]|â€|Ã¢|Â[°¿]/.test(String(text));
}

export function hasUnresolvedPlaceholder(text) {
  return /\[(?:[A-Za-zÀ-ÿ\s]+)\]|<[A-Za-zÀ-ÿ_]+>|{{\s*[a-z_]+\s*}}/.test(String(text));
}

export function englishLeakageRatio(text) {
  const portugueseTokens = /\b(que|não|você|para|como|uma|dos|das|então|por|isso|mais|cliente|relatório|mes|processo)\b/;
  const words = String(text)
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]{4,}$/.test(w));
  if (words.length === 0) return 0;
  const englishish = words.filter((w) => !portugueseTokens.test(w.toLowerCase()) && /^(the|and|with|for|your|how|why|what|when|best|make|need|there|which|about|will|from|this|that|have|should|using|based|file|data|rate|time|team|plan|steps|stage|list|check|name|value|input|output|title|usage|month|year|goal|posts?|weeks?|days?)$/i.test(w));
  return englishish.length / words.length;
}

const FABRICATION_PATTERNS = [
  /estudos? mostram que.{0,40}\d+ ?%/i,
  /\d+ ?% d(a|e)s? brasileiros?\b/i,
  /pesquisa (?:do|da) \w+ apontou?/i,
  /de acordo com (?:um )?estudo de \d{4}\b/i,
  /segundo (?:a|o) \w+, \d+ ?%/i,
];

export function fabricatedStatisticPatterns(text) {
  return FABRICATION_PATTERNS.filter((rx) => rx.test(String(text)));
}
