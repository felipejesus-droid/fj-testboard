import { similarity } from './index.js';

export function t09Counts(input) {
  const joined = input.text.join('\n');
  const lin = (joined.match(/linkedin\s*\d/gi) || []).length;
  const carousel = (joined.match(/carrossel\s*\d/gi) || []).length;
  const video = (joined.match(/(?:v[íi]deo|reels)\s*\d/gi) || []).length;
  const calendarDays = (joined.match(/dia\s+\d{1,2}/gi) || []).length;
  const weeks = (joined.match(/semana\s+\d/gi) || []).length;
  const pass = lin >= 2 && carousel >= 2 && video >= 2 && calendarDays >= 16 && weeks >= 4;
  return { pass, detail: `linkedin:${lin}/2 carrossel:${carousel}/2 video:${video}/2 dias:${calendarDays}/16 semanas:${weeks}/4` };
}

export function t10CountsAndRestraint(input) {
  const base = t09Counts(input);
  const joined = input.text.join('\n');
  const miracle = [/cur[ae]\s+garantid/i, /emagreç/i, /antes e depois/i, /resultado garanti/i, /promessa de cura/i, /tratamento definit/i].filter((rx) => rx.test(joined));
  const datesOk = february2027Weekdays(joined);
  const pass = base.pass && miracle.length === 0 && datesOk;
  const parts = [base.detail, miracle.length ? `linguagem de milagre: ${miracle.length}` : 'sem linguagem de milagre', datesOk ? 'datas coerentes com dia da semana' : 'data em dia da semana errado'];
  return { pass, detail: parts.join(' | ') };
}

function february2027Weekdays(joined) {
  const matches = [...joined.matchAll(/(\d{1,2})(?:\/02(?:\/2027)?|\s+de\s+fevereiro(?:\s+de\s+2027)?)/g)];
  for (const m of matches) {
    const day = Number(m[1]);
    if (day >= 1 && day <= 28) {
      const d = new Date(Date.UTC(2027, 1, day));
      const weekday = d.getUTCDay();
      const labels = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
      const window = joined.slice(Math.max(0, m.index - 90), m.index + 90).toLowerCase();
      const claimed = labels.findIndex((l) => window.includes(l));
      if (claimed >= 0 && claimed !== weekday) return false;
    }
  }
  return true;
}

export function hookSimilarity(input) {
  const hooksLine = input.text
    .join('\n')
    .split('\n')
    .filter((l) => /hook/i.test(l))
    .map((l) => l.replace(/.*?hook[^:]*:\s*/i, '').replace(/[*_-]/g, '').trim())
    .filter((l) => l.length >= 12);
  if (hooksLine.length < 2) {
    return { pass: true, detail: 'menos de 2 hooks identificados; verificação não se aplica' };
  }
  for (let i = 0; i < hooksLine.length; i++) {
    for (let j = i + 1; j < hooksLine.length; j++) {
      const sim = similarity(hooksLine[i], hooksLine[j]);
      if (sim >= 0.85) return { pass: false, detail: `hooks ${i + 1} e ${j + 1} quase idênticos (${sim.toFixed(2)})` };
    }
  }
  return { pass: true, detail: `${hooksLine.length} hooks variados` };
}
