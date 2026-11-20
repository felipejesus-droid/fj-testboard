import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../scripts/lib/validate.js';

const personaValid = {
  id: 'P1', company_name: 'Pousada Vale Nebuloso', segment: 'Pousada', city: 'Gramado',
  size: 'pequena', digital_maturity: 2, maturity_reason: 'Usa planilhas e um sistema simples de reservas; sem automação.',
  tools_in_use: ['WhatsApp', 'planilhas'], pain_points: ['Faltam confirmações automáticas de hospedagem', 'Nada de histórico do hóspede'],
  brand_tone: 'Acolhedor e direto, como quem recebe bem em casa',
  brand_colors: ['#0A1628'], kpi_csv: 'cases/P1/kpis.csv', interview_notes: 'cases/P1/interview_notes.md',
  owner_professional: { name: 'Ana Fictícia', specialty: 'Hospitalidade', audience: 'Hóspedes de lazer', goals: ['Ocupação estável na baixa temporada'] },
  visibility: 'internal',
};

const cardValid = {
  id: 'T01', version: 1, family: 'diagnostico', category: 'A1', persona_id: 'P4',
  title: 'Framework de diagnóstico de maturidade digital',
  frozen_prompt_pt: 'Você é um consultor sênior de transformação digital. Você é um consultor sênior de transformação digital. Você é um consultor sênior de transformação digital. Você é um consultor sênior de transformação digital. Você é um consultor sênior de transformação digital.', input_files: [], tools: { web_search: false, code_exec: false },
  max_revisions: 1, attempts_default: 1,
  output_spec: { kind: 'markdown', files: ['relatorio.md'] },
  checks: { hard: ['h1'], soft: ['s1', 's2'] },
  weights: { c1: 0.2, c2: 0.2, c3: 0.2, c4: 0.2, c5: 0.2 }, visibility: 'internal',
};

test('E1: cada schema aceita exemplo válido', () => {
  assert.equal(validate('persona.schema.json', personaValid).ok, true);
  assert.equal(validate('task-card.schema.json', cardValid).ok, true);
  assert.equal(validate('round.schema.json', { id: 'R001', created_at: '2026-01-01T00:00:00Z', models: ['a', 'b', 'c'], tasks: ['T01'], attempts: 1, notes: 'x' }).ok, true);
  assert.equal(validate('rating.schema.json', { blind_id: 'a1b2c3', rater: 'Felipe', scores: { c1: 3, c2: 3, c3: 3, c4: 3, c5: 3 }, approved: true, approved_override_reason: null, minutes_to_publishable: 15, notes: '', rated_at: '2026-01-01T00:00:00Z' }).ok, true);
});

test('E1: persona rejeita pelo menos 3 exemplos inválidos', () => {
  const bad1 = { ...personaValid, digital_maturity: 9 };
  const bad2 = { ...personaValid, visibility: 'public_summary' };
  const bad3 = { ...personaValid, id: 'P9' };
  const bad4 = { ...personaValid, owner_professional: { ...personaValid.owner_professional, goals: [] } };
  for (const bad of [bad1, bad2, bad3, bad4]) {
    assert.equal(validate('persona.schema.json', bad).ok, false);
  }
});

test('E1: task-card rejeita pelo menos 3 exemplos inválidos', () => {
  const bad1 = { ...cardValid, weights: { c1: 0.5, c2: 0.1, c3: 0.1, c4: 0.1, c5: 0.1 } };
  const bad2 = { ...cardValid, checks: { hard: [], soft: ['s1', 's2'] } };
  const bad3 = { ...cardValid, visible_extra: 1 };
  const bad4 = { ...cardValid, frozen_prompt_pt: 'curto' };
  for (const bad of [bad1, bad2, bad3, bad4]) {
    assert.equal(validate('task-card.schema.json', bad).ok, false);
  }
});

test('E1: rating rejeita score fora do intervalo e blind_id inválido', () => {
  const bad1 = { blind_id: 'a1b2c3', rater: 'Felipe', scores: { c1: 9, c2: 3, c3: 3, c4: 3, c5: 3 }, approved: true, approved_override_reason: null, minutes_to_publishable: 15, notes: '', rated_at: '2026-01-01T00:00:00Z' };
  const bad2 = { ...bad1, blind_id: 'ZZZ' };
  for (const bad of [bad1, bad2]) {
    assert.equal(validate('rating.schema.json', bad).ok, false);
  }
});
