import { mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { repoPath, sha256 } from './lib/util.js';
import { validateAllTasks } from './lib/tasks.js';
import { exitWith } from './lib/envelope.js';
import { ingestRound } from './round-ingest.js';
import { simulateRatings } from './lib/simulate.js';

const SELFTEST_ROUND = 'R000-selftest';
const MODELS = ['mock-good', 'mock-bad', 'mock-flaky'];

export function runSelftest() {
  const { tasks, problems } = validateAllTasks();
  if (problems.length > 0) {
    return { status: 'error', summary: `cartões inválidos: ${problems.join('; ')}` };
  }
  const fixtureRoot = repoPath('fixtures');
  for (const model of MODELS) {
    for (const [taskId] of tasks) {
      if (!existsSync(join(fixtureRoot, model, taskId))) {
        return { status: 'error', summary: `fixture ausente: fixtures/${model}/${taskId}` };
      }
    }
  }

  rmSync(repoPath('rounds', SELFTEST_ROUND), { recursive: true, force: true });
  const dir = repoPath('rounds', SELFTEST_ROUND);
  const deliveries = [];
  for (const model of MODELS) {
    for (const [taskId, card] of tasks) {
      const deliveryId = `${taskId}__${model}__a1`;
      const saida = join(dir, 'packets', deliveryId, 'saida');
      mkdirSync(saida, { recursive: true });
      for (const f of card.output_spec.files) {
        const src = join(fixtureRoot, model, taskId, f);
        writeFileSync(join(saida, f), existsSync(src) ? readFileSync(src, 'utf8') : '', 'utf8');
      }
      writeFileSync(
        join(saida, 'META.yaml'),
        YAML.stringify({
          model: { vendor: 'FJ-TestBoard', name: model, version_label: 'v0.1', access: 'manual' },
          tokens_in: null,
          tokens_out: null,
          cost_brl: null,
          duration_s: null,
          tools_actually_used: [],
          date: new Date().toISOString(),
        }),
        'utf8'
      );
      deliveries.push({
        delivery_id: deliveryId,
        task_id: taskId,
        task_version: card.version,
        prompt_sha256: sha256(card.frozen_prompt_pt),
        model_slug: model,
        attempt: 1,
        expected_files: card.output_spec.files,
      });
    }
  }

  writeFileSync(
    join(dir, 'round.yaml'),
    YAML.stringify({
      id: SELFTEST_ROUND,
      created_at: new Date().toISOString(),
      models: MODELS,
      tasks: Array.from(tasks.keys()),
      attempts: 1,
      notes: 'Rodada sintética de autoavaliação: fixtures mock-good/mock-bad/mock-flaky de ponta a ponta. Não é resultado de modelo real.',
    }),
    'utf8'
  );
  writeFileSync(join(dir, 'deliveries.yaml'), YAML.stringify(deliveries), 'utf8');

  const result = ingestRound(SELFTEST_ROUND);
  if (result.status === 'error') {
    return { status: 'error', summary: `ingest falhou: ${result.summary}` };
  }
  const sim = simulateRatings(SELFTEST_ROUND);
  if (sim.status === 'error') {
    return { status: 'error', summary: `avaliações simuladas falharam: ${sim.summary}` };
  }
  return { status: 'success', summary: `pipeline de ponta a ponta ok: ${result.summary}; ${sim.summary}`, artifacts: [...(result.artifacts ?? []), ...sim.artifacts] };
}

export function main(args) {
  void args;
  try {
    const out = runSelftest();
    exitWith({
      status: out.status,
      summary: `selftest: ${out.summary}`,
      artifacts: out.artifacts ?? [`rounds/${SELFTEST_ROUND}/runs.jsonl`],
      next_actions:
        out.status === 'success'
          ? [`Rondas sintéticas em rounds/${SELFTEST_ROUND}/; use só para validar o fluxo.`]
          : ['Verifique os avisos do selftest.'],
    });
  } catch (e) {
    exitWith({ status: 'error', summary: `selftest falhou: ${e.message}` });
  }
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('selftest.js');
if (invokedDirectly) main(process.argv.slice(2));
