import { hasMojibake, hasUnresolvedPlaceholder, englishLeakageRatio, fabricatedStatisticPatterns } from '../lib/pt-ling.js';
import { runT02Contradictions, runT04Surfaced, runT08Flag } from './trapChecks.js';
import { t03Acceptance } from './prdChecks.js';
import { t05HedgedClaims, t06SimpleLanguage } from './trainingChecks.js';
import { numbersTraceable } from './dataChecks.js';
import { t09Counts, t10CountsAndRestraint, hookSimilarity } from './socialChecks.js';
import { pwaStructural } from './pwaChecks.js';
import { t12Detectors } from './t12-detectors.js';
import { t01Dimensions, t05Exercises, t07Slides, t07BulletsLeanness } from './extraChecks.js';
import { headingsFor } from './knownHeadings.js';

export function stripFences(t) {
  return t.replace(/```[\s\S]*?```/g, ' ');
}

function requiredHeadings(input, ctx) {
  const need = headingsFor(ctx.card.id);
  if (need.length === 0) return { pass: true, detail: 'sem seções obrigatórias definidas para esta tarefa' };
  const allText = input.plain.toLowerCase();
  const missing = need.filter((h) => !allText.includes(h.toLowerCase()));
  return { pass: missing.length === 0, detail: missing.length ? `faltam seções: ${missing.join(', ')}` : `todas as ${need.length} seções obrigatórias presentes` };
}

function noDuplicates(input) {
  const paras = input.plain.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 60);
  for (let i = 0; i < paras.length; i++) {
    for (let j = i + 1; j < paras.length; j++) {
      const sim = similarity(paras[i], paras[j]);
      if (sim >= 0.82) {
        return { pass: false, detail: `blocos quase idênticos (${sim.toFixed(2)}): "${paras[i].slice(0, 50)}…" e "${paras[j].slice(0, 50)}…"` };
      }
    }
  }
  return { pass: true, detail: `${paras.length} blocos sem duplicação relevante` };
}

function noMojibake(input) {
  return { pass: !hasMojibake(input.plain), detail: hasMojibake(input.plain) ? 'caracteres corrompidos encontrados' : 'sem caracteres corrompidos' };
}

function noPlaceholders(input) {
  return { pass: !hasUnresolvedPlaceholder(input.plain), detail: hasUnresolvedPlaceholder(input.plain) ? 'placeholders não resolvidos encontrados' : 'sem placeholders' };
}

function noEnglishLeakage(input) {
  const ratio = englishLeakageRatio(input.plain);
  return { pass: ratio < 0.12, detail: `razão de possíveis anglicismos: ${(ratio * 100).toFixed(1)}% (limite 12%)` };
}

function noFabricatedStats(input) {
  const hits = fabricatedStatisticPatterns(input.plain);
  return { pass: hits.length === 0, detail: hits.length ? `${hits.length} padrão(ões) de estatística sem fonte` : 'sem estatística sem fonte' };
}

export const REGISTRY = {
  headings: { generic: true, fn: requiredHeadings },
  no_duplicates: { generic: true, fn: noDuplicates },
  no_mojibake: { generic: true, fn: noMojibake },
  no_placeholders: { generic: true, fn: noPlaceholders },
  no_english_leakage: { generic: true, fn: noEnglishLeakage },
  no_fabricated_stats: { generic: true, fn: noFabricatedStats },
  hooks_similarity: { generic: true, fn: hookSimilarity },
  t02_contradictions: { fn: runT02Contradictions },
  t03_acceptance: { fn: t03Acceptance },
  t04_surfaced: { fn: runT04Surfaced },
  t05_hedged_claims: { fn: t05HedgedClaims },
  t06_simple_language: { fn: t06SimpleLanguage },
  numbers_traceable: { fn: numbersTraceable },
  t08_flag: { fn: runT08Flag },
  t09_counts: { fn: t09Counts },
  t10_counts_restraint: { fn: t10CountsAndRestraint },
  pwa_structural: { fn: pwaStructural },
  t12_detectors: { fn: t12Detectors },
  t01_dimensions: { fn: t01Dimensions },
  t05_exercises: { fn: t05Exercises },
  t07_slides: { fn: t07Slides },
  t07_bullets_leanness: { fn: t07BulletsLeanness },
};

export function similarity(a, b) {
  const grams = (s) => {
    const t = s.toLowerCase().replace(/\s+/g, ' ');
    const set = new Set();
    for (let i = 0; i < t.length - 3; i++) set.add(t.slice(i, i + 4));
    return set;
  };
  const A = grams(a);
  const B = grams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

const CODE_FILE_RX = /\.(html|htm|js|mjs|css|webmanifest|json|csv|xml)$/i;

export function runChecks(card, files, answerKey) {
  const parts = [];
  for (const [name, content] of Object.entries(files)) {
    if (CODE_FILE_RX.test(name)) parts.push('```\n' + content + '\n```');
    else parts.push(content);
  }
  const rawText = parts.join('\n');
  const input = { files, text: [rawText], plain: stripFences(rawText) };
  const ctx = { card, answerKey };
  const results = [];
  const ids = [...card.checks.hard, ...card.checks.soft];
  for (const id of ids) {
    const kind = card.checks.hard.includes(id) ? 'hard' : 'soft';
    const entry = REGISTRY[id];
    let r;
    if (!entry) {
      r = { pass: false, detail: `check desconhecido no registro: ${id}` };
    } else {
      try {
        r = entry.fn(input, ctx);
      } catch (e) {
        r = { pass: false, detail: `check lançou erro: ${e.message}` };
      }
    }
    results.push({ id, kind, pass: r.pass === true, detail: String(r.detail) });
  }
  return results;
}
