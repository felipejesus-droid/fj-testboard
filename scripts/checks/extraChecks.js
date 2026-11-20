export function t01Dimensions(input) {
  const joined = input.text.join('\n');
  const dims = (joined.match(/dimens[ãa]o\s+\d+/gi) || []).length;
  const questions = (joined.match(/\?/g) || []).length;
  const opps = (joined.match(/oportunidade\s+[123]/gi) || []).length;
  const pass = dims >= 5 && questions >= 15 && opps >= 3;
  return { pass, detail: `${dims} dimensões (min 5), ${questions} perguntas (min 15), ${opps} oportunidades (min 3)` };
}

export function t05Exercises(input) {
  const joined = input.text.join('\n');
  const ex = (joined.match(/exerc[íi]cio\s+[123]/gi) || []).length;
  const agendaTime = /(\d{1,3}\s?min|\d\s?h\b|\d:\d{2})/.test(joined);
  const pass = ex >= 3 && agendaTime;
  return { pass, detail: `${ex} marcadores de exercício (min 3), agenda com duração: ${agendaTime ? 'sim' : 'não'}` };
}

export function t07Slides(input) {
  const joined = input.text.join('\n');
  const slides = (joined.match(/^##\s+l[âa]mina\s+\d+/gim) || []).length;
  const notes = (joined.match(/notas do apresentador/gi) || []).length;
  const charts = (joined.match(/gr[áa]fico sugerido/gi) || []).length;
  const pass = slides >= 8 && notes >= 8 && charts >= 8;
  return { pass, detail: `${slides} lâminas (min 8), ${notes} blocos de notas (min 8), ${charts} gráficos sugeridos (min 8)` };
}

export function t07BulletsLeanness(input) {
  const joined = input.text.join('\n');
  const bullets = joined.split('\n').filter((l) => /^\s*[-*]\s+/.test(l) && !/Título|Mensagem|Conteúdo|Notas|Gráfico/i.test(l));
  const long = bullets.filter((b) => b.replace(/^\s*[-*]\s+/, '').split(/\s+/).length > 14);
  const pass = bullets.length >= 24 && long.length === 0;
  return { pass, detail: `${bullets.length} bullets (min 24), ${long.length} muito longos (limite 14 palavras)` };
}
