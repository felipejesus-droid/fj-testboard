import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath } from './lib/util.js';
import { exitWith } from './lib/envelope.js';

function collectBoards() {
  const dir = repoPath('rounds');
  const boards = [];
  if (!existsSync(dir)) return boards;
  for (const id of readdirSync(dir).sort()) {
    const p = join(dir, id, 'scoreboard.json');
    if (existsSync(p)) boards.push(JSON.parse(readFileSync(p, 'utf8')));
  }
  return boards;
}

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Painel — FJ-TestBoard</title>
<style>
:root { --ink: #0A1628; --accent: #00D4FF; --gold: #DCAF3C; --paper: #f7f5ef; --muted: #5a6b7d; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: "Syne", "DM Sans", "Segoe UI", system-ui, sans-serif; }
header { background: var(--ink); color: #fff; padding: 14px 20px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
header h1 { font-size: 18px; margin: 0; }
.badge { background: var(--gold); color: var(--ink); font-size: 11px; padding: 3px 8px; border-radius: 12px; letter-spacing: .06em; }
header select { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--accent); font-family: inherit; }
main { max-width: 980px; margin: 0 auto; padding: 20px; }
.card { background: #fff; border: 1px solid #e3ded2; border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; }
h2 { margin: 0 0 10px; font-size: 15px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { padding: 7px 9px; border-bottom: 1px solid #eee2cc; text-align: left; }
td.num { text-align: right; font-family: "DM Mono", ui-monospace, Consolas, monospace; }
.cell { text-align: center; font-family: "DM Mono", ui-monospace, Consolas, monospace; }
.s-warning { background: #fdf3d7; border: 1px solid var(--gold); padding: 10px; border-radius: 8px; font-size: 13px; margin: 10px 0; }
.how { color: var(--muted); font-size: 12px; line-height: 1.5; }
footer { color: var(--muted); font-size: 11px; text-align: center; padding: 18px; }
.arrow-up { color: #1d7a3e; font-weight: 700; }
.arrow-down { color: #b1122e; font-weight: 700; }
.hidden { display: none; }
label.toggle { font-size: 12px; color: var(--muted); }
</style>
</head>
<body>
<header>
  <h1>FJ-TestBoard</h1>
  <span class="badge">FJ-TestBoard \u00b7 INTERNO</span>
  <select id="round"></select>
  <label class="toggle"><input type="checkbox" id="show-synthetic"> \u2021 mostrar rodada sint\u00e9tica (R000-selftest)</label>
</header>
<main>
  <div id="content"></div>
  <div class="card">
    <h2>Como ler este painel</h2>
    <div class="how">
      <p><b>S</b> = score ponderado pela rubrica da tarefa (0 a 5). Cada c\u00e9lula \u00e9 a m\u00e9dia das entregas do modelo naquela categoria.</p>
      <p><b>Aprov. %</b> = parte das entregas liberadas para o cliente. <b>pass@1</b> = aprovada j\u00e1 na primeira tentativa; <b>pass@3</b> s\u00f3 existe com ao menos 3 entregas.</p>
      <p><b>Min</b> = mediana de minutos at\u00e9 a entrega ficar public\u00e1vel. <b>Custo/aprov.</b> fica vazio quando falta custo em qualquer entrega aprovada do grupo.</p>
      <p><b>\u0394</b> compara com a rodada anterior apenas tarefa+vers\u00e3o repetidas; a seta mostra dire\u00e7\u00e3o, n\u00e3o signific\u00e2ncia.</p>
      <p>Amostra pequena e parte subjetiva: n\u00e3o trate diferen\u00e7as de poucos d\u00e9cimos como verdade.</p>
    </div>
  </div>
</main>
<footer>FJ-TestBoard v0.1 \u00b7 dados internos da FJ Smart \u00b7 funciona offline (file://)</footer>
<script>
var DATA = %%DATA%%;
var $ = function (id) { return document.getElementById(id); };

function shapeFor(board) {
  var map = {};
  board.by_model_category.forEach(function (r) {
    if (!map[r.category]) map[r.category] = {};
    map[r.category][r.model] = r;
  });
  return map;
}

function cellColor(score) {
  if (score === null || score === undefined) return 'background:#f1efe8;color:#8a8a83';
  var t = Math.max(0, Math.min(1, score / 5));
  var r = Math.round(241 - 217 * t);
  var g = Math.round(239 - 122 * t);
  var b = Math.round(232 - 226 * t);
  return 'background:rgb(' + r + ',' + g + ',' + b + ')';
}

function arrow(v) {
  if (v === null || v === undefined) return '—';
  if (v > 0) return '<span class="arrow-up">▲ +' + v.toFixed(2) + '</span>';
  if (v < 0) return '<span class="arrow-down">▼ ' + v.toFixed(2) + '</span>';
  return '± ' + v.toFixed(2);
}

function render() {
  var sel = $('round');
  var id = sel.value;
  var board = DATA.rounds.filter(function (b) { return b.round_id === id; })[0];
  if (!board) { $('content').innerHTML = '<div class="card"><p>Sem scoreboard para ' + id + '.</p></div>'; return; }
  var shape = shapeFor(board);
  var cats = Object.keys(shape).sort();
  var models = board.by_model.map(function (m) { return m.model; });
  var html = '';
  var small = DATA.rounds.filter(function (b) { return b.round_id === id; })[0].metrics.generations < 12;
  if (small) html += '<div class="s-warning">Amostra pequena nesta rodada: leia os números como rascunho, não como conclusão.</div>';
  html += '<div class="card"><h2>Mapa de calor — categoria x modelo (rótulo: S / n)</h2><table><tr><th>categoria</th>';
  models.forEach(function (m) { html += '<th>' + m + '</th>'; });
  html += '</tr>';
  cats.forEach(function (c) {
    html += '<tr><td>' + c + '</td>';
    models.forEach(function (m) {
      var r = shape[c] && shape[c][m];
      if (!r) { html += '<td class="cell" style="background:#f1efe8">—</td>'; return; }
      var warn = r.n < 2 ? ' border:1px dashed #b1122e;' : '';
      html += '<td class="cell" style="' + cellColor(r.mean_score) + warn + '" title="n=' + r.n + '">' + (r.mean_score === null ? '—' : r.mean_score.toFixed(1)) + ' <span style="font-size:10px;color:#444">(' + r.n + ')</span></td>';
    });
    html += '</tr>';
  });
  html += '</table>';
  html += '<p class="how">Borda tracejada vermelha = grupo com menos de 2 entregas (dados insuficientes).</p></div>';

  html += '<div class="card"><h2>Resumo por modelo</h2><table><tr><th>modelo</th><th>n</th><th>S</th><th>aprov.</th><th>pass@1</th><th>pass@3</th><th>mediana min</th><th>custo/aprov.</th><th>Δ vs anterior</th></tr>';
  board.by_model.forEach(function (m) {
    html += '<tr><td>' + m.model + '</td><td class="num">' + m.n + '</td><td class="num">' + (m.mean_score === null ? '—' : m.mean_score.toFixed(2)) + '</td><td class="num">' + m.approved_count + '</td><td class="num">' + (m.pass_at_1 === null ? '—' : Math.round(m.pass_at_1 * 100) + '%') + '</td><td class="num">' + (m.pass_at_3 === null ? 'dado insuficiente' : Math.round(m.pass_at_3 * 100) + '%') + '</td><td class="num">' + (m.median_minutes === null ? '—' : m.median_minutes) + '</td><td class="num">' + (m.cost_per_approved === null ? '—' : 'R$ ' + m.cost_per_approved.toFixed(2)) + '</td><td class="num">' + arrow(m.score_delta_vs_previous) + ' (n=' + m.delta_n + ')</td></tr>';
  });
  html += '</table></div>';

  if (DATA.notices[id]) html += '<div class="s-warning">' + DATA.notices[id] + '</div>';
  $('content').innerHTML = html;
}

function init() {
  var sel = $('round');
  sel.innerHTML = '';
  DATA.rounds.forEach(function (b) {
    var o = document.createElement('option');
    o.value = b.round_id;
    o.textContent = b.round_id;
    if (b.round_id.indexOf('selftest') >= 0) o.className = 'hidden';
    sel.appendChild(o);
  });
  syncVisibility();
  sel.addEventListener('change', render);
  $('show-synthetic').addEventListener('change', syncVisibility);
  render();
}

function syncVisibility() {
  var sel = $('round');
  var show = $('show-synthetic').checked;
  var firstVisible = null;
  Array.prototype.forEach.call(sel.options, function (o, i) {
    var synthetic = o.value.indexOf('selftest') >= 0;
    o.hidden = synthetic && !show;
    if (!o.hidden && firstVisible === null) firstVisible = o.value;
  });
  if (sel.selectedIndex < 0 || sel.options[sel.selectedIndex].hidden) {
    sel.value = firstVisible || '';
  }
  render();
}

init();
</script>
</body>
</html>
`;

export function buildDashboard() {
  const boards = collectBoards();
  const isSynthetic = (b) => b.round_id.includes('selftest');
  const notices = {};
  for (const b of boards) if (isSynthetic(b)) notices[b.round_id] = 'R000-selftest é rodada sintética (fixtures), não resultado de modelo real.';
  const data = { rounds: boards, notices };
  const html = PAGE.replace('%%DATA%%', JSON.stringify(data).replace(/</g, '\\u003c'));
  const outDir = repoPath('dashboard');
  const outPath = join(outDir, 'index.html');
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  if (boards.length === 0) {
    return { status: 'warning', summary: 'painel gerado sem nenhum scoreboard; rode score numa rodada antes', artifacts: ['dashboard/index.html'] };
  }
  return {
    status: 'success',
    summary: `painel offline gerado com ${boards.length} rodada(s)`,
    artifacts: ['dashboard/index.html'],
    next_actions: ['Abra dashboard/index.html direto no navegador (funciona com file://).'],
  };
}

export function main(args) {
  void args;
  try {
    exitWith(buildDashboard());
  } catch (e) {
    exitWith({ status: 'error', summary: `dashboard falhou: ${e.message}` });
  }
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('dashboard.js');
if (invokedDirectly) main(process.argv.slice(2));
