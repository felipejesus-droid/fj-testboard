import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import http from 'node:http';
import { repoPath } from '../scripts/lib/util.js';
import { readJsonl } from '../scripts/lib/util.js';
import { validate } from '../scripts/lib/validate.js';
import { generate, adapterEnabled } from '../scripts/adapters/http-generic.js';

function runScript(script, args, expectFail = false) {
  const full = repoPath('scripts', script);
  try {
    return execFileSync('node', [full, ...args], { encoding: 'utf8' });
  } catch (e) {
    if (!expectFail) throw new Error(`script ${script} falhou: ${e.message} ${e.stdout ?? ''} ${e.stderr ?? ''}`);
    return e.stdout ?? '';
  }
}

test('M4: round-new cria pacotes com prompt inlining entradas, linha de ferramentas e formato', () => {
  rmSync(repoPath('rounds', 'R997'), { recursive: true, force: true });
  const out = runScript('round-new.js', ['R997', '--tasks', 'T07', '--models', 'teste-a']);
  assert.match(out, /"status":"success"/);
  const prompt = readFileSync(repoPath('rounds', 'R997', 'packets', 'T07__teste__a1', 'PROMPT.md'), 'utf8');
  assert.ok(!/\{\{INPUT_/.test(prompt), 'placeholder não resolvido no PROMPT.md');
  assert.ok(prompt.includes('no_show_pct') && prompt.includes('consultas'), 'CSV da clínica não embutido');
  assert.ok(prompt.includes('Clínica Movimento Vivo'), 'persona não embutida');
  assert.ok(prompt.includes('Ferramentas permitidas'), 'linha de ferramentas ausente');
  assert.ok(prompt.includes('Formato de saída'), 'linha de formato ausente');
  assert.ok(prompt.includes('<<<DADOS_CLIENTE>>>'), 'marcador ausente');
  rmSync(repoPath('rounds', 'R997'), { recursive: true, force: true });
});

test('M4: round-new rejeita identificador inválido com envelope de erro e exit 1', () => {
  const out = runScript('round-new.js', ['XPTO'], true);
  assert.match(out, /"status":"error"/);
});

test('M4: ingest valida,_checks e cega entregas; run valida contra o schema', () => {
  rmSync(repoPath('rounds', 'R996'), { recursive: true, force: true });
  runScript('round-new.js', ['R996', '--tasks', 'T01', '--models', 'modeloX']);
  const saida = repoPath('rounds', 'R996', 'packets', 'T01__modelox__a1', 'saida');
  writeOut(saida);
  const out = runScript('round-ingest.js', ['R996']);
  assert.match(out, /"status":"success"/);
  const runs = readJsonl(repoPath('rounds', 'R996', 'runs.jsonl'));
  assert.equal(runs.length, 1);
  const r = validate('run.schema.json', runs[0]);
  assert.equal(r.ok, true, 'run fora do schema: ' + r.errors.join('; '));
  assert.match(runs[0].blind_id, /^[a-f0-9]{6}$/);
  const map = JSON.parse(readFileSync(repoPath('rounds', 'R996', 'blind-map.json'), 'utf8'));
  assert.equal(map.blinds.length, 1);
  assert.equal(map.blinds[0].blind_id, runs[0].blind_id);
  const bDir = repoPath('rounds', 'R996', 'blind', runs[0].blind_id);
  assert.ok(existsSync(join(bDir, 'relatorio.md')));
  assert.ok(existsSync(join(bDir, 'meta-blind.yaml')));
  assert.ok(!existsSync(join(bDir, 'META.yaml')), 'META.yaml não deve vazarem na pasta cega');
  const metaBlind = readFileSync(join(bDir, 'meta-blind.yaml'), 'utf8');
  assert.ok(!/modelox/i.test(metaBlind), 'meta cega menciona o slug do modelo');
  rmSync(repoPath('rounds', 'R996'), { recursive: true, force: true });
});

function writeOut(saida, extra = '') {
  mkdirSync(saida, { recursive: true });
  writeFileSync(
    join(saida, 'relatorio.md'),
    `# Diagnóstico — teste\n${extra}\n## Dimensões de avaliação\n## Escala 0 a 5\n## Matriz de lacunas\n## Oportunidades prioritárias\n## Sequência de 90 dias\n`,
    'utf8'
  );
  writeFileSync(
    join(saida, 'META.yaml'),
    'model:\n  vendor: Provador\n  name: ModeloX-9\n  version_label: 2025-11\n  access: manual\ntokens_in: 100\ntokens_out: 200\ncost_brl: 0.05\nduration_s: 45\ntools_actually_used: []\ndate: 2025-11-10T10:00:00Z\n',
    'utf8'
  );
}

test('M4: ingest emite warning quando entrega sai com nome do modelo (possível descegamento)', () => {
  rmSync(repoPath('rounds', 'R995'), { recursive: true, force: true });
  runScript('round-new.js', ['R995', '--tasks', 'T01', '--models', 'modeloX']);
  const saida = repoPath('rounds', 'R995', 'packets', 'T01__modelox__a1', 'saida');
  mkdirSync(saida, { recursive: true });
  writeFileSync(
    join(saida, 'relatorio.md'),
    '# Diagnóstico — teste (feito com ModeloX-9)\n## Dimensões de avaliação\n## Escala 0 a 5\n## Matriz de lacunas\n## Oportunidades prioritárias\n## Sequência de 90 dias\n',
    'utf8'
  );
  writeFileSync(join(saida, 'META.yaml'), 'model:\n  vendor: Provador\n  name: ModeloX-9\n  access: manual\n', 'utf8');
  const out = runScript('round-ingest.js', ['R995']);
  assert.match(out, /"status":"warning"/);
  assert.match(out, /descegamento|poss[íi]vel/i);
  rmSync(repoPath('rounds', 'R995'), { recursive: true, force: true });
});

test('M4: adaptador http desabilitado por padrão', async () => {
  const saved = process.env.FJTB_API_URL;
  delete process.env.FJTB_API_URL;
  assert.equal(adapterEnabled(), false);
  await assert.rejects(() => generate({ prompt: 'x', tools: {} }));
  if (saved) process.env.FJTB_API_URL = saved;
});

test('M4: adaptador http conversa com servidor de teste local (loopback)', async () => {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ text: `eco:${parsed.prompt.length}`, usage: { tokens_in: 11, tokens_out: 7, cost_brl: 0.02, duration_s: 3, tools_actually_used: [] } }));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const saved = [process.env.FJTB_API_URL, process.env.FJTB_API_KEY, process.env.FJTB_API_MODEL];
  process.env.FJTB_API_URL = `http://127.0.0.1:${port}/gen`;
  process.env.FJTB_API_KEY = 'teste-local';
  process.env.FJTB_API_MODEL = 'mock-1';
  try {
    const r = await generate({ prompt: 'olá mundo', tools: { web_search: false } });
    assert.equal(r.text, 'eco:10');
    assert.equal(r.usage.tokens_in, 11);
    assert.equal(r.usage.cost_brl, 0.02);
  } finally {
    if (saved[0] === undefined) delete process.env.FJTB_API_URL; else process.env.FJTB_API_URL = saved[0];
    if (saved[1] === undefined) delete process.env.FJTB_API_KEY; else process.env.FJTB_API_KEY = saved[1];
    if (saved[2] === undefined) delete process.env.FJTB_API_MODEL; else process.env.FJTB_API_MODEL = saved[2];
    await new Promise((r) => server.close(r));
  }
});

test('M4: selftest roda pipeline de ponta a ponta com 36 entregas cegadas e válidas', () => {
  const out = runScript('selftest.js', []);
  assert.match(out, /"status":"success"/);
  const dir = repoPath('rounds', 'R000-selftest');
  const runs = readJsonl(join(dir, 'runs.jsonl'));
  assert.equal(runs.length, 36);
  for (const r of runs) {
    const v = validate('run.schema.json', r);
    assert.equal(v.ok, true, 'run fora do schema: ' + v.errors.join('; '));
  }
  const ids = new Set(runs.map((r) => r.blind_id));
  assert.equal(ids.size, 36, 'blind ids não são únicos');
  const map = JSON.parse(readFileSync(join(dir, 'blind-map.json'), 'utf8'));
  assert.equal(map.blinds.length, 36);
  for (const b of map.blinds) {
    const v = validate('run.schema.json', runs.find((r) => r.blind_id === b.blind_id));
    assert.equal(v.ok, true);
  }
  const blindDirs = readdirSync(join(dir, 'blind'));
  assert.equal(blindDirs.length, 36);
  rmSync(dir, { recursive: true, force: true });
});
