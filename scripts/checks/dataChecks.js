import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath } from '../lib/util.js';

function parseCsvRows(personaId) {
  const p = join(repoPath(), 'cases', personaId, 'kpis.csv');
  const lines = readFileSync(p, 'utf8').trim().split('\n');
  const header = lines[0].split(',');
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!/^\d{4}-\d{2},/.test(line)) continue;
    const cells = line.split(',');
    const row = {};
    header.forEach((h, i) => { row[h] = cells[i]; });
    rows.push(row);
  }
  return { header, rows };
}

function variantsOf(n) {
  const out = new Set([String(n)]);
  out.add(n.toFixed(0));
  out.add(n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
  out.add(n.toLocaleString('en-US', { maximumFractionDigits: 2 }));
  out.add(n.toFixed(1).replace('.', ','));
  out.add(n.toFixed(2).replace('.', ','));
  return out;
}

export function allowedNumbersFor(personaId) {
  const { header, rows } = parseCsvRows(personaId);
  const allowed = new Set();
  for (const col of header.slice(1)) {
    const values = rows.map((r) => Number(r[col]));
    let sum = 0;
    for (const v of values) {
      sum += v;
      for (const s of variantsOf(v)) allowed.add(s);
    }
    for (const s of variantsOf(sum)) allowed.add(s);
    const mean = sum / values.length;
    for (const s of variantsOf(Math.round(mean * 100) / 100)) allowed.add(s);
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] === 0) continue;
      const change = Math.round(((values[i] - values[i - 1]) / values[i - 1]) * 1000) / 10;
      for (const s of variantsOf(change)) allowed.add(s);
    }
  }
  for (const row of rows) allowed.add(row.mes);
  for (const c of ['2025', '2027', '12', '8', '30', '60', '90', '44', '16', '15', '5', '7', '4', '6', '3', '2', '1', '0', '100']) {
    allowed.add(c);
  }
  allowed.add('12');
  allowed.add('8');
  allowed.add('0');
  allowed.add('1');
  allowed.add('2');
  allowed.add('3');
  allowed.add('100');
  return allowed;
}

export function numbersTraceable(input, ctx) {
  const personaId = ctx.card.persona_id;
  const allowed = allowedNumbersFor(personaId);
  const text = input.text.join('\n');
  const tokens = text.match(/\d[\d.,]*/g) || [];
  const offenders = [];
  for (const raw of tokens) {
    const cleaned = raw.replace(/[.,]$/, '').replace(/\./g, '.');
    const candidates = [raw, cleaned, raw.replace(/\./g, ''), raw.replace(/\./g, '').replace(',', '.'), raw.replace(',', '.')];
    const ok = candidates.some((c) => allowed.has(c));
    if (!ok) offenders.push(raw);
  }
  const tolerated = offenders.length;
  const pass = tolerated <= Math.max(3, Math.ceil(tokens.length * 0.06));
  return { pass, detail: `${tokens.length} número(s), ${tolerated} não rastreáveis (tolerância ${Math.max(3, Math.ceil(tokens.length * 0.06))})` };
}
