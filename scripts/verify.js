import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { repoPath } from './lib/util.js';
import { validateAllTasks } from './lib/tasks.js';
import { exitWith } from './lib/envelope.js';
import { buildScoreboard } from './score.js';
import { buildGuide } from './guide.js';
import { buildDashboard } from './dashboard.js';
import { runSelftest } from './selftest.js';

function step(name, fn) {
  try {
    return fn();
  } catch (e) {
    return { status: 'error', summary: `${name} lançou erro: ${e.message}` };
  }
}

function runTests() {
  let out = '';
  let code = 0;
  try {
    out = execFileSync('node', ['--test', '--test-concurrency=1'], { encoding: 'utf8', cwd: repoPath() });
  } catch (e) {
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    code = e.status ?? 1;
  }
  const m = out.match(/# fail (\d+)/);
  const failN = m ? Number(m[1]) : code === 0 ? 0 : -1;
  if (failN !== 0) {
    const tail = m ? '' : `: ${out.replace(/\s+/g, ' ').trim().slice(-240)}`;
    throw new Error(m ? `${failN} teste(s) falhando` : `runner sem resumo legível (exit ${code})${tail}`);
  }
  return { status: 'success', summary: 'testes ok' };
}

function runGuard() {
  execFileSync('node', [repoPath('scripts', 'guard.js')], { encoding: 'utf8', cwd: repoPath() });
  return { status: 'success', summary: 'guard ok' };
}

function runLock() {
  const out = execFileSync('node', [repoPath('scripts', 'lock-prompts.js'), '--verify'], { encoding: 'utf8', cwd: repoPath() });
  if (!/"status":"success"/.test(out)) throw new Error('lock divergiu');
  return { status: 'success', summary: 'lock ok' };
}

export function runVerify() {
  const problems = [];
  const steps = [];

  steps.push(step('schemas+categorias', () => {
    const { problems } = validateAllTasks();
    if (problems.length > 0) throw new Error(problems.join('; '));
    return { status: 'success', summary: 'cartões, rubricas e schemas ok' };
  }));
  steps.push(step('testes', runTests));
  steps.push(step('guard', runGuard));
  steps.push(step('lock', runLock));
  steps.push(step('selftest', () => {
    const out = runSelftest();
    if (out.status === 'error') throw new Error(out.summary);
    return out;
  }));
  steps.push(step('score R000', () => {
    const out = buildScoreboard('R000-selftest');
    if (out.status === 'error') throw new Error(out.summary);
    const board = JSON.parse(readFileSync(repoPath('rounds', 'R000-selftest', 'scoreboard.json'), 'utf8'));
    const rows = Object.fromEntries(board.by_model.map((m) => [m.model, m.mean_score ?? -1]));
    if (!(rows['mock-good'] > rows['mock-flaky'] && rows['mock-flaky'] > rows['mock-bad'])) {
      throw new Error(`ordem esperada bom>flaco>ruim; veio ${JSON.stringify(rows)}`);
    }
    return { status: 'success', summary: `invariante R000 ok (${rows['mock-good']} > ${rows['mock-flaky']} > ${rows['mock-bad']})` };
  }));
  steps.push(step('guia', () => buildGuide('R000-selftest')));
  steps.push(step('dashboard', () => buildDashboard()));

  for (const s of steps) {
    if (s.status === 'error' || s.status === 'warning') problems.push(s.summary);
  }
  if (problems.length === 0) {
    return {
      status: 'success',
      summary: `verificação completa ok (${steps.length} etapas)`,
      artifacts: ['dashboard/index.html', 'docs/model-guide.md'],
      next_actions: ['Pronto para rodada real: npm run round:new -- R001'],
    };
  }
  return {
    status: 'warning',
    summary: `verificação com avisos: ${problems.join(' | ')}`,
    artifacts: ['dashboard/index.html'],
    next_actions: ['Investigue os avisos antes de usar resultados.'],
  };
}

export function main(args) {
  void args;
  try {
    exitWith(runVerify());
  } catch (e) {
    exitWith({ status: 'error', summary: `verify falhou: ${e.message}` });
  }
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('verify.js');
if (invokedDirectly) main(process.argv.slice(2));
