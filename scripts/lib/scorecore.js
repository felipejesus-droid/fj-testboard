function mean(xs) {
  const v = xs.filter((x) => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function median(xs) {
  const v = xs.filter((x) => x !== null).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
function r1(n) {
  return n === null ? null : Math.round(n * 100) / 100;
}

export function weightedScore(weights, scores) {
  if (!scores || scores.c1 === null) return null;
  let total = 0;
  let wsum = 0;
  for (const k of ['c1', 'c2', 'c3', 'c4', 'c5']) {
    total += (weights[k] ?? 0) * (Number(scores[k]) || 0);
    wsum += weights[k] ?? 0;
  }
  return wsum > 0 ? r1(total / wsum) : null;
}

function joinModel(modelObj) {
  return `${modelObj.vendor} ${modelObj.name}`.trim();
}

export function computeScoreboard({ roundId, generations, ratings, previousScoreboard }) {
  const ratingsByBlind = new Map(ratings.map((r) => [r.blind_id, r]));
  const prevByPair = new Map(
    (previousScoreboard?.deliveries ?? []).map((d) => [`${d.model}|${d.task_id}|${d.task_version}`, d])
  );

  const deliveries = generations.map((g) => {
    const rating = ratingsByBlind.get(g.blind_id);
    const score = rating ? weightedScore(g.weights, rating.scores) : null;
    const approved = rating ? rating.approved === true : null;
    return {
      blind_id: g.blind_id,
      model: g.model,
      task_id: g.task_id,
      task_version: g.task_version,
      category: g.category,
      attempt: g.attempt,
      score,
      approved,
      minutes: rating ? rating.minutes_to_publishable : null,
      cost_brl: g.cost_brl,
      hard_fails: g.hard_fails,
    };
  });

  const suggestions = new Map(deliveries.map((d) => [d.blind_id, prevByPair.get(`${d.model}|${d.task_id}|${d.task_version}`)]));

  const group = (keyFn) => {
    const out = new Map();
    for (const d of deliveries) {
      const key = keyFn(d);
      if (!out.has(key)) out.set(key, []);
      out.get(key).push(d);
    }
    return out;
  };

  function passRates(items) {
    const attempts = items.length;
    const approvedCount = items.filter((d) => d.approved === true).length;
    const firstAttempts = items.filter((d) => d.attempt === 1);
    const pass1 = firstAttempts.length ? firstAttempts.filter((d) => d.approved === true).length / firstAttempts.length : null;
    const pass3 = attempts >= 3 ? approvedCount / attempts : null;
    const costs = items.filter((d) => d.approved === true).map((d) => d.cost_brl);
    const costsPresent = costs.filter((c) => c !== null && c !== undefined);
    const costPerApproved = costs.length === 0 ? null : costsPresent.length === costs.length ? mean(costs) : null;
    return {
      n: attempts,
      approved_count: approvedCount,
      mean_score: r1(mean(items.map((d) => d.score))),
      median_minutes: r1(median(items.map((d) => d.minutes))),
      mean_minutes: r1(mean(items.map((d) => d.minutes))),
      pass_at_1: pass1 === null ? null : r1(pass1),
      pass_at_3: pass3 === null ? null : r1(pass3),
      cost_per_approved: costPerApproved === null ? null : r1(costPerApproved),
    };
  }

  const byModel = [];
  for (const [model, items] of group((d) => d.model)) {
    const base = passRates(items);
    const prevScores = items.map((d) => suggestions.get(d.blind_id)?.score ?? null).filter((s) => s !== null);
    const deltaScores = prevScores.length
      ? items
          .map((d) => {
            const p = suggestions.get(d.blind_id);
            return p && d.score !== null ? d.score - p.score : null;
          })
          .filter((s) => s !== null)
      : [];
    byModel.push({
      model,
      ...base,
      score_delta_vs_previous: deltaScores.length ? r1(mean(deltaScores)) : null,
      delta_n: deltaScores.length,
    });
  }

  const byModelCategory = [];
  for (const [key, items] of group((d) => `${d.model}|${d.category}`)) {
    const [model, category] = key.split('|');
    byModelCategory.push({ model, category, ...passRates(items) });
  }

  const rated = deliveries.filter((d) => d.score !== null);
  const metrics = {
    generations: deliveries.length,
    rated: rated.length,
    approved: deliveries.filter((d) => d.approved === true).length,
    median_minutes: r1(median(rated.map((d) => d.minutes))),
    mean_minutes: r1(mean(rated.map((d) => d.minutes))),
    pass_at_1: (() => {
      const firsts = deliveries.filter((d) => d.attempt === 1 && d.approved !== null);
      return firsts.length ? r1(firsts.filter((d) => d.approved).length / firsts.length) : null;
    })(),
  };

  return {
    round_id: roundId,
    generated_at: new Date().toISOString(),
    deliveries,
    by_model: byModel,
    by_model_category: byModelCategory,
    metrics,
    notes: 'Score ponderado pela rubrica da tarefa (0 a 5). pass@1 = aprovada na primeira tentativa; pass@3 só com 3 tentativas. Custo por entrega aprovada fica nulo se faltar custo em qualquer entrega aprovada do grupo. Delta compara apenas pares tarefa+versão presentes na rodada anterior.',
  };
}
