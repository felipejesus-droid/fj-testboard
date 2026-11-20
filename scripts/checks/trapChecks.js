const T02_PATTERNS = [
  { id: 'P1-C1', rx: [/julho/, /agosto/] },
  { id: 'P1-C2', rx: [/dois anos|nenhum ajuste|di[áa]ria/, /(sub|aument|ajust)/], must: [/dois anos|n[ãa]o mex/] },
  { id: 'P1-C3', rx: [/2021|mesmo time|quatro pessoas/, /contrat|novas|dobrou/] },
];

export function runT02Contradictions(input) {
  const joined = input.text.join('\n').toLowerCase();
  let caught = 0;
  const found = [];
  for (const p of T02_PATTERNS) {
    const okMain = p.rx.every((rx) => rx.test(joined));
    const okMust = p.must ? p.must.every((rx) => rx.test(joined)) : true;
    if (okMain && okMust) {
      caught++;
      found.push(p.id);
    }
  }
  const pieces = found.length > 0 ? found.join(', ') : 'nenhuma contradição correspondente';
  return { pass: caught >= 2, detail: `${caught}/3 contradições plantadas detectadas (${pieces})` };
}

const T04_PATTERNS = [
  { id: 'P3-C1', rx: [/apr[óo]v/, /(sem passar|sem o dono|sozinh|direto ao cliente)/] },
  { id: 'P3-C2', rx: [/hist[óo]ric/, /(não existe|já existe|inexist|nunca regist|foi perd)/] },
  { id: 'P3-C3', rx: [/(24 horas|4 dias|quatro dias)/, /(contradi|conflit|inconsist|diverg)/] },
];

export function runT04Surfaced(input) {
  const joined = input.text.join('\n').toLowerCase();
  let caught = 0;
  const found = [];
  for (const p of T04_PATTERNS) {
    const okMain = p.rx.every((rx) => rx.test(joined));
    if (okMain) {
      caught++;
      found.push(p.id);
    }
  }
  const pieces = found.length > 0 ? found.join(', ') : 'nenhuma contradição correspondente';
  return { pass: caught >= 2, detail: `${caught}/3 contradições do brief trazidas à tona (${pieces})` };
}

export function runT08Flag(input) {
  const joined = input.text.join('\n').toLowerCase();
  const mentionsTotal = /total/.test(joined);
  const flags = /inconsist|não bate|diverge|não confere|discrep|não fecha|soma/.test(joined);
  const pass = mentionsTotal && flags;
  return {
    pass,
    detail: pass ? 'linha TOTAL sinalizada com palavra de inconsistência' : 'não sinalizou a inconsistência da linha TOTAL',
  };
}
