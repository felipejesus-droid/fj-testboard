import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { repoPath, readJsonl, appendJsonl } from './lib/util.js';
import { validate } from './lib/validate.js';
import { validateAllTasks } from './lib/tasks.js';
import { exitWith } from './lib/envelope.js';
import { runChecks } from './checks/index.js';
import { loadAnswerKey } from './checks/answerKeys.js';

const BLIND_CHARS = '0123456789abcdef';
function randomBlindId() {
  let id = '';
  for (let i = 0; i < 6; i++) id += BLIND_CHARS[Math.floor(Math.random() * 16)];
  return id;
}

const UNBLIND_SCAN = [
  'claude', 'anthropic', 'chatgpt', 'openai', 'gpt-4', 'gpt-5', 'gpt-3', 'gemini', 'google ai', 'copilot', 'github copilot',
  'mistral', 'grok', 'xai', 'llama', 'meta ai', 'deepseek', 'qwen', 'cursor', 'perplexity',
];

function scanUnblinding(text, meta) {
  const hay = text.toLowerCase();
  const names = [meta.model?.vendor, meta.model?.name].filter(Boolean).map((s) => String(s).toLowerCase());
  const hits = [...UNBLIND_SCAN, ...names].filter((n) => n && hay.includes(n));
  return [...new Set(hits)];
}

function metaFor(saidaDir) {
  const metaPath = join(saidaDir, 'META.yaml');
  if (!existsSync(metaPath)) return null;
  try {
    return YAML.parse(readFileSync(metaPath, 'utf8'));
  } catch (_) {
    return { __invalid: true };
  }
}

export function ingestRound(roundId) {
  const dir = repoPath('rounds', roundId);
  const roundPath = join(dir, 'round.yaml');
  const deliveriesPath = join(dir, 'deliveries.yaml');
  if (!existsSync(roundPath) || !existsSync(deliveriesPath)) {
    return { status: 'error', summary: `rodada ${roundId} não encontrada ou incompleta`, next_actions: ['Rode npm run round:new -- ' + (roundId || 'R001')] };
  }
  const round = YAML.parse(readFileSync(roundPath, 'utf8'));
  const rRound = validate('round.schema.json', round);
  if (!rRound.ok) return { status: 'error', summary: `round.yaml inválida: ${rRound.errors.join('; ')}` };

  const { tasks, problems } = validateAllTasks();
  if (problems.length > 0) return { status: 'error', summary: `cartões inválidos: ${problems.join('; ')}` };

  const lock = JSON.parse(readFileSync(repoPath('tasks.lock.json'), 'utf8'));
  const deliveries = YAML.parse(readFileSync(deliveriesPath, 'utf8')) || [];

  const blindDir = join(dir, 'blind');
  rmSync(blindDir, { recursive: true, force: true });
  mkdirSync(blindDir, { recursive: true });

  const runsPath = join(dir, 'runs.jsonl');
  rmSync(runsPath, { force: true });
  const blindMap = [];
  const warnings = [];
  let ingested = 0;
  let missing = 0;
  const usedBlind = new Set();

  for (const d of deliveries) {
    const card = tasks.get(d.task_id);
    if (!card) {
      warnings.push(`${d.delivery_id}: tarefa desconhecida ${d.task_id}`);
      continue;
    }
    const lockEntry = lock.tasks[d.task_id];
    if (!lockEntry || lockEntry.sha256 !== d.prompt_sha256) {
      warnings.push(`${d.delivery_id}: prompt da entrega não confere com o lock (drift)`);
      continue;
    }
    const saidaDir = join(dir, 'packets', d.delivery_id, 'saida');
    const meta = metaFor(saidaDir);
    if (!existsSync(saidaDir) || !meta || meta.__invalid) {
      missing++;
      continue;
    }
    const missingFiles = d.expected_files.filter((f) => !existsSync(join(saidaDir, f)));
    if (missingFiles.length > 0) {
      warnings.push(`${d.delivery_id}: faltam arquivos de saída: ${missingFiles.join(', ')}`);
      missing++;
      continue;
    }
    const files = {};
    for (const f of d.expected_files) files[f] = readFileSync(join(saidaDir, f), 'utf8');
    const checkResults = runChecks(card, files, loadAnswerKey(d.task_id));

    let blindId = randomBlindId();
    while (usedBlind.has(blindId)) blindId = randomBlindId();
    usedBlind.add(blindId);

    const run = {
      delivery_id: d.delivery_id,
      round_id: roundId,
      task_id: d.task_id,
      task_version: d.task_version ?? card.version,
      prompt_sha256: d.prompt_sha256,
      model: {
        vendor: meta.model?.vendor ?? 'desconhecido',
        name: meta.model?.name ?? meta.model?.slug ?? d.model_slug ?? 'desconhecido',
        version_label: meta.model?.version_label ?? null,
        access: meta.model?.access ?? 'manual',
      },
      date: meta.date ?? new Date().toISOString(),
      tools_enabled: { web_search: !!card.tools.web_search, code_exec: !!card.tools.code_exec },
      tools_actually_used: meta.tools_actually_used ?? [],
      attempt: d.attempt ?? 1,
      output_dir: `rounds/${roundId}/blind/${blindId}/`,
      tokens_in: meta.tokens_in ?? null,
      tokens_out: meta.tokens_out ?? null,
      cost_brl: meta.cost_brl ?? null,
      duration_s: meta.duration_s ?? null,
      status_envelope: { status: 'success', summary: `entrega ${d.delivery_id} registrada` },
      auto_checks: checkResults,
      blind_id: blindId,
      visibility: 'internal',
    };
    const rRun = validate('run.schema.json', run);
    if (!rRun.ok) {
      warnings.push(`${d.delivery_id}: run inválida: ${rRun.errors.join('; ')}`);
      continue;
    }
    appendJsonl(runsPath, run);
    const bDir = join(blindDir, blindId);
    mkdirSync(bDir, { recursive: true });
    for (const f of d.expected_files) copyFileSync(join(saidaDir, f), join(bDir, f));
    const blindMeta = {
      blind_id: blindId,
      round_id: roundId,
      task_id: d.task_id,
      task_version: run.task_version,
      attempt: run.attempt,
      date: run.date,
      auto_checks: checkResults,
      visibility: 'internal',
    };
    writeFileSync(join(bDir, 'meta-blind.yaml'), YAML.stringify(blindMeta), 'utf8');
    blindMap.push({ blind_id: blindId, delivery_id: d.delivery_id, model_slug: d.model_slug, task_id: d.task_id });
    ingested++;

    const texto = Object.values(files).join('\n');
    const leakNames = scanUnblinding(texto, meta);
    if (leakNames.length > 0) warnings.push(`${d.delivery_id}: possível descegamento de identidade do modelo na saída (${leakNames.join(', ')})`);
  }

  writeFileSync(join(dir, 'blind-map.json'), JSON.stringify({ round_id: roundId, blinds: blindMap }, null, 2) + '\n', 'utf8');

  if (missing > 0 || warnings.length > 0) {
    return {
      status: 'warning',
      summary: `${ingested} entrega(s) registrada(s), ${missing} ausente(s)/incompleta(s); avisos: ${warnings.length}`,
      details: warnings,
      artifacts: [`rounds/${roundId}/runs.jsonl`, `rounds/${roundId}/blind-map.json`],
      next_actions: missing > 0 ? ['Complete as saídas em packets/<delivery_id>/saida/ e rode o ingest novamente.'] : ['Revise os avisos antes de avaliar.'],
    };
  }
  return {
    status: 'success',
    summary: `${ingested} entrega(s) registrada(s) e cegadas; par blind↔entrega salvo`,
    artifacts: [`rounds/${roundId}/runs.jsonl`, `rounds/${roundId}/blind-map.json`],
    next_actions: [`Rode npm run rate -- ${roundId} para avaliar.`, 'blind-map.json só deve ser aberto depois da rodada completa.'],
  };
}

export function main(args) {
  const out = ingestRound(args[0]);
  const payload = { status: out.status, summary: out.summary, artifacts: out.artifacts ?? [], next_actions: out.next_actions ?? [] };
  if (out.details && out.details.length > 0 && out.details.length <= 8) {
    payload.next_actions = [...(payload.next_actions ?? []), ...out.details.map((d) => 'Aviso: ' + d)];
  } else if (out.details && out.details.length > 8) {
    payload.next_actions = [...(payload.next_actions ?? []), `${out.details.length} avisos registrados; veja o log do comando.`];
    console.error(out.details.join('\n'));
  }
  exitWith(payload);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('round-ingest.js');
if (invokedDirectly) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    exitWith({ status: 'error', summary: `falha no ingest: ${e.message}` });
  }
}
