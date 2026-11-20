export function t05HedgedClaims(input) {
  const joined = input.text.join('\n');
  const legalInvented = /art\.?\s*\d+[ºo°]?|lei\s*n?[ºo°]?\s*[\d.]+|portaria\s*n?[ºo°]?\s*[\d.]+/i.test(joined);
  const hedges = [/verifique/i, /confira/i, /pode mudar/i, /no seu plano/i, /na data d/i, /confirme/i, /na versão atual/i];
  const hasHedge = hedges.some((rx) => rx.test(joined));
  return {
    pass: !legalInvented && hasHedge,
    detail: legalInvented ? 'citação de artigo/lei encontrada (proibido sem fonte)' : hasHedge ? 'afirmações com ressalva' : 'nenhuma ressalva sobre ferramentas encontrada',
  };
}

export function t06SimpleLanguage(input) {
  const joined = input.text.join('\n');
  const prices = /\br?\$\s?\d|R\$\s?\d/.test(joined);
  const sentences = joined.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWords = sentences.length ? sentences.reduce((acc, s) => acc + s.trim().split(/\s+/).length, 0) / sentences.length : 99;
  const pass = !prices && avgWords <= 18;
  return { pass, detail: prices ? 'preço específico sem ressalva encontrado' : `frase média de ${avgWords.toFixed(1)} palavras (limite 18), ${prices ? 'com preços' : 'sem preços'}` };
}
