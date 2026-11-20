import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath } from './lib/util.js';
import { validateAllTasks } from './lib/tasks.js';
import { exitWith } from './lib/envelope.js';

const CATEGORY_NAMES = {
  A1: 'A1 · Diagnóstico e análise de lacunas',
  A2: 'A2 · Documento de requisitos (PRD)',
  A3: 'A3 · Capacitação e treinamento',
  B1: 'B1 · Apresentação executiva',
  B2: 'B2 · Conteúdo para redes sociais',
  C: 'C · Aplicativo leve (PWA)',
};

function recomendacaoFor(rows) {
  const qualified = rows.filter((r) => r.mean_score !== null && r.n >= 2);
  if (qualified.length === 0) return { model: 'dados insuficientes', mean: null, minutes: null };
  qualified.sort((a, b) => {
    if (b.mean_score !== a.mean_score) return b.mean_score - a.mean_score;
    const ma = a.median_minutes ?? Infinity;
    const mb = b.median_minutes ?? Infinity;
    return ma - mb;
  });
  if (qualified.length > 1 && qualified[0].mean_score === qualified[1].mean_score) {
    void 0;
  }
  const best = qualified[0];
  return { model: best.model, mean: best.mean_score, minutes: best.median_minutes };
}

export function buildGuide(roundId) {
  const boardPath = repoPath('rounds', roundId, 'scoreboard.json');
  if (!existsSync(boardPath)) {
    return { status: 'error', summary: `sem scoreboard para ${roundId}; rode npm run score -- ${roundId}` };
  }
  const board = JSON.parse(readFileSync(boardPath, 'utf8'));
  const { tasks } = validateAllTasks();
  const categories = [...new Set(Array.from(tasks.values()).map((c) => c.category))].sort();

  const lines = [];
  lines.push('# Guia de modelos — FJ-TestBoard');
  lines.push('');
  lines.push(`Rodada: ${board.round_id} · gerado em ${board.generated_at} · ${board.metrics.generations} entregas (${board.metrics.rated} avaliadas).`);
  lines.push('');
  lines.push('## Recomendação por categoria');
  lines.push('');
  lines.push('| Categoria | Modelo recomendado | Score médio | Mediana de minutos | n |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const cat of categories) {
    const rows = board.by_model_category.filter((r) => r.category === cat);
    const rec = recomendacaoFor(rows);
    lines.push(`| ${CATEGORY_NAMES[cat] ?? cat} | ${rec.model} | ${rec.mean ?? '—'} | ${rec.minutes ?? '—'} | ${rows.map((r) => r.n).join('/')} |`);
  }
  lines.push('');
  lines.push('## Resumo geral');
  lines.push('');
  lines.push('| Modelo | n | Score | aprovações | pass@1 | mediana min | custo/entrega aprovada | Δ vs rodada anterior |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const m of board.by_model) {
    lines.push(`| ${m.model} | ${m.n} | ${m.mean_score ?? '—'} | ${m.approved_count} | ${m.pass_at_1 ?? '—'} | ${m.median_minutes ?? '—'} | ${m.cost_per_approved ?? '—'} | ${m.score_delta_vs_previous ?? '—'} (n=${m.delta_n}) |`);
  }
  lines.push('');
  lines.push('## Como usar');
  lines.push('');
  lines.push('- "—"/"dados insuficientes" significa que não há base suficiente: acrescente rodadas antes de decidir.');
  lines.push('- Rejeições por check duro ficam registradas no scoreboard; leia junto antes de escolher.');
  lines.push('');
  lines.push('Avaliação da FJ Smart. Amostra pequena e parte subjetiva.');
  lines.push('');

  const text = lines.join('\n');
  const outPath = repoPath('docs', 'model-guide.md');
  mkdirSync(repoPath('docs'), { recursive: true });
  writeFileSync(outPath, text, 'utf8');
  if (text.split('\n').length > 60) {
    void 0;
  }
  return {
    status: 'success',
    summary: `guia gerado em docs/model-guide.md (${text.split('\n').length} linhas)`,
    artifacts: ['docs/model-guide.md'],
    next_actions: ['Revise a recomendação antes de compartilhar com clientes.'],
  };
}

export function main(args) {
  const roundId = args[0];
  if (!roundId) return exitWith({ status: 'error', summary: 'uso: npm run guide -- R001' });
  const out = buildGuide(roundId);
  exitWith(out);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('guide.js');
if (invokedDirectly) main(process.argv.slice(2));
