import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { repoPath, readJsonl, appendJsonl } from './lib/util.js';
import { validate } from './lib/validate.js';
import { validateAllTasks } from './lib/tasks.js';
import { loadRubric } from './lib/rubrics.js';
import { exitWith } from './lib/envelope.js';

const PORT = Number(process.env.FJTB_RATE_PORT || 4173);
const HOST = '127.0.0.1';

function listRounds() {
  const dir = repoPath('rounds');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => /^R\d{3}(-selftest|b)?$/.test(d))
    .sort();
}

function roundStatus(roundId) {
  const dir = repoPath('rounds', roundId);
  const runs = readJsonl(join(dir, 'runs.jsonl'));
  const ratings = readJsonl(join(dir, 'ratings.jsonl'));
  const rated = new Set(ratings.map((r) => r.blind_id));
  return { total: runs.length, rated: runs.filter((r) => rated.has(r.blind_id)).length };
}

function roundPayload(roundId) {
  const dir = repoPath('rounds', roundId);
  if (!existsSync(join(dir, 'runs.jsonl'))) return null;
  const { tasks } = validateAllTasks();
  const runs = readJsonl(join(dir, 'runs.jsonl'));
  const ratings = readJsonl(join(dir, 'ratings.jsonl'));
  const rated = new Set(ratings.map((r) => r.blind_id));
  const entries = runs
    .filter((r) => !rated.has(r.blind_id))
    .map((r) => {
      const card = tasks.get(r.task_id);
      const outputFiles = {};
      const bDir = join(dir, r.output_dir.replace(`rounds/${roundId}/`, ''));
      if (existsSync(bDir)) {
        for (const f of readdirSync(bDir).filter((f) => f !== 'meta-blind.yaml')) {
          outputFiles[f] = readFileSync(join(bDir, f), 'utf8');
        }
      }
      return {
        blind_id: r.blind_id,
        task_id: r.task_id,
        task_title: card?.title ?? '',
        category: card?.category ?? '?',
        attempt: r.attempt,
        auto_checks: r.auto_checks,
        weights: card?.weights ?? null,
        rubric: card ? loadRubric(card.category) : null,
        output_files: outputFiles,
      };
    });
  return { round_id: roundId, entries, ratings_existentes: [] };
}

function page() {
  return readFileSync(repoPath('scripts', 'rater-ui.html'), 'utf8');
}

export function createApp() {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const json = (code, obj) => {
      res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(obj));
    };
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(page());
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/rounds') {
      json(200, { rounds: listRounds() });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/round') {
      const id = url.searchParams.get('id');
      if (!id || !/^R\d{3}(-selftest|b)?$/.test(id)) return json(400, { error: 'identificador de rodada inválido' });
      const payload = roundPayload(id);
      if (!payload) return json(404, { error: 'rodada sem runs.jsonl; rode o ingest' });
      json(200, payload);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/status') {
      const id = url.searchParams.get('id');
      json(200, { status: roundStatus(id) });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/reveal') {
      const id = url.searchParams.get('id');
      if (!id) return json(400, { error: 'informe a rodada' });
      const st = roundStatus(id);
      if (st.total === 0 || st.rated < st.total) {
        return json(403, { error: `rodada incompleta: ${st.rated} de ${st.total} avaliadas; agora os modelos ficam escondidos` });
      }
      const mapPath = repoPath('rounds', id, 'blind-map.json');
      if (!existsSync(mapPath)) return json(404, { error: 'sem blind-map para esta rodada' });
      json(200, readFileSync(mapPath, 'utf8'));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/rate') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        let data;
        try {
          data = JSON.parse(body);
        } catch (_) {
          return json(400, { error: 'JSON inválido' });
        }
        const dir = repoPath('rounds', data.round_id ?? '');
        const runs = readJsonl(join(dir, 'runs.jsonl'));
        const run = runs.find((r) => r.blind_id === data.blind_id);
        if (!run) return json(404, { error: 'blind_id não encontrado nesta rodada' });
        const rating = {
          blind_id: data.blind_id,
          rater: data.rater ?? 'Felipe Jesus',
          scores: data.scores ?? {},
          approved: data.approved === true,
          approved_override_reason: data.approved_override_reason ?? null,
          minutes_to_publishable: data.minutes_to_publishable ?? null,
          notes: data.notes ?? '',
          rated_at: new Date().toISOString(),
        };
        const hardFails = run.auto_checks.filter((c) => c.kind === 'hard' && !c.pass).length;
        if (hardFails > 0 && rating.approved && !rating.approved_override_reason) {
          return json(422, { error: `entrega com ${hardFails} check(s) duro(s) falhando: para aprovar, escreva o motivo da exceção` });
        }
        if (!rating.approved) rating.approved_override_reason = null;
        const v = validate('rating.schema.json', rating);
        if (!v.ok) return json(422, { error: v.errors.join('; ') });
        const existing = readJsonl(join(dir, 'ratings.jsonl')).filter((r) => r.blind_id !== rating.blind_id);
        writeFileSync(join(dir, 'ratings.jsonl'), existing.map((r) => JSON.stringify(r)).join('\n') + (existing.length ? '\n' : ''), 'utf8');
        appendJsonl(join(dir, 'ratings.jsonl'), rating);
        const st = roundStatus(data.round_id);
        json(200, { ok: true, status: st, message: st.rated >= st.total ? 'rodada completa: já é possível revelar os modelos' : `salvo; faltam ${st.total - st.rated}` });
      });
      return;
    }
    json(404, { error: 'rota desconhecida' });
  });
  return server;
}

export function main(args) {
  void args;
  const server = createApp();
  server.listen(PORT, HOST, () => {
    process.stdout.write(
      JSON.stringify({
        status: 'success',
        summary: `painel de avaliação em http://${HOST}:${PORT} (loopback; sem acesso externo)`,
        artifacts: [],
        next_actions: ['Escolha a rodada no topo da página; modelos só se revelam com a rodada completa.', 'Ctrl+C para encerrar.'],
      }) + '\n'
    );
  });
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('rate.js');
if (invokedDirectly) main(process.argv.slice(2));
