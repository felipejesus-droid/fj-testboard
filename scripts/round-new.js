import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { repoPath, sha256 } from './lib/util.js';
import { validateAllTasks } from './lib/tasks.js';
import { exitWith } from './lib/envelope.js';
import YAML from 'yaml';

const ROUND_ID_RX = /^R[0-9]{3}(-selftest|b)?$/;
const DELIVERY_ID_RX = /^T(0[1-9]|1[0-2])__[a-z0-9-]+__a[0-9]+$/;
const CODE_INLINE_RX = /\.(html|htm|js|mjs|css|webmanifest|json|csv|xml)$/i;

function inlineInputs(card) {
  const placeholders = card.frozen_prompt_pt.match(/\{\{INPUT_[A-Z0-9_]+\}\}/g) || [];
  if (placeholders.length === 0) return card.frozen_prompt_pt;
  if (placeholders.length !== card.input_files.length) {
    throw new Error(`${card.id}: ${placeholders.length} placeholders para ${card.input_files.length} arquivos de entrada`);
  }
  let out = card.frozen_prompt_pt;
  card.input_files.forEach((rel, i) => {
    const content = readFileSync(repoPath(rel), 'utf8');
    const fenceName = rel.split('/').pop();
    const body = CODE_INLINE_RX.test(rel)
      ? `--- entrada: ${fenceName} ---\n\`\`\`\n${content}\`\`\`\n`
      : `--- entrada: ${fenceName} ---\n${content}\n`;
    out = out.replace(placeholders[i], body);
  });
  return out;
}

function buildPrompt(card, attempt) {
  const toolsLine = `Ferramentas permitidas nesta entrega: consulta à web = ${card.tools.web_search ? 'SIM' : 'NÃO'}; execução de código = ${card.tools.code_exec ? 'SIM' : 'NÃO'}. Usar ferramenta não permitida invalida a entrega.`;
  const outLine = `Formato de saída: ${card.output_spec.kind === 'markdown' ? 'um único arquivo markdown chamado ' + card.output_spec.files[0] : 'exatamente os arquivos ' + card.output_spec.files.join(', ')}. Tentativa: a${attempt}.`;
  return `${inlineInputs(card)}\n---\n${toolsLine}\n${outLine}\n`;
}

export function main(args) {
  const roundId = args[0];
  if (!roundId || !ROUND_ID_RX.test(roundId)) {
    return exitWith({
      status: 'error',
      summary: `identificador de rodada inválido: "${roundId ?? ''}". Use R001, R002… (ou R000-selftest / Rxxx b).`,
      next_actions: ['Ex.: npm run round:new -- R001'],
    });
  }
  const { tasks, problems } = validateAllTasks();
  if (problems.length > 0) {
    return exitWith({ status: 'error', summary: `cartões inválidos: ${problems.join('; ')}` });
  }
  const dir = repoPath('rounds', roundId);
  if (existsSync(dir)) {
    return exitWith({ status: 'error', summary: `rodada ${roundId} já existe em rounds/${roundId}`, next_actions: ['Escolha outro identificador de rodada.'] });
  }
  const modelsArgs = args.includes('--models') ? args[args.indexOf('--models') + 1].split(',').map((m) => m.trim().toLowerCase()) : ['modelo-a'];
  const tasksSelected = args.includes('--tasks') ? args[args.indexOf('--tasks') + 1].split(',').map((t) => t.trim().toUpperCase()) : Array.from(tasks.keys());
  for (const t of tasksSelected) {
    if (!tasks.has(t)) return exitWith({ status: 'error', summary: `tarefa desconhecida: ${t}` });
  }
  const attempts = args.includes('--attempts') ? Number(args[args.indexOf('--attempts') + 1]) : 1;

  mkdirSync(dir, { recursive: true });
  const created_at = new Date().toISOString();
  const deliveries = [];
  for (const model of modelsArgs) {
    for (const taskId of tasksSelected) {
      for (let a = 1; a <= attempts; a++) {
        const card = tasks.get(taskId);
        const slug = model.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const deliveryId = `${taskId}__${slug}__a${a}`;
        if (!DELIVERY_ID_RX.test(deliveryId)) {
          return exitWith({ status: 'error', summary: `delivery_id inválido: ${deliveryId}` });
        }
        const prompt = buildPrompt(card, a);
        const pdir = join(dir, 'packets', deliveryId);
        mkdirSync(pdir, { recursive: true });
        writeFileSync(join(pdir, 'PROMPT.md'), prompt, 'utf8');
        mkdirSync(join(pdir, 'saida'), { recursive: true });
        deliveries.push({
          delivery_id: deliveryId,
          task_id: taskId,
          task_version: card.version,
          prompt_sha256: sha256(card.frozen_prompt_pt),
          model_slug: slug,
          attempt: a,
          expected_files: card.output_spec.files,
        });
      }
    }
  }
  const round = { id: roundId, created_at, models: modelsArgs, tasks: tasksSelected, attempts, notes: 'Rodada manual: prompts em packets/<delivery_id>/PROMPT.md; salvar as saídas em packets/<delivery_id>/saida/ com META.yaml.' };
  writeFileSync(join(dir, 'round.yaml'), YAML.stringify(round), 'utf8');
  writeFileSync(join(dir, 'deliveries.yaml'), YAML.stringify(deliveries), 'utf8');
  exitWith({
    status: 'success',
    summary: `rodada ${roundId} criada com ${deliveries.length} pacotes de entrega`,
    artifacts: [`rounds/${roundId}/round.yaml`, `rounds/${roundId}/deliveries.yaml`],
    next_actions: [
      'Cole o texto de PROMPT.md de cada pacote no modelo escolhido e salve a resposta em packets/<delivery_id>/saida/.',
      'Adicione META.yaml ao lado das saídas (modelo, custo, tempo).',
      'Rode npm run round:ingest -- ' + roundId,
    ],
  });
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('round-new.js');
if (invokedDirectly) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    exitWith({ status: 'error', summary: `falha ao criar rodada: ${e.message}` });
  }
}
