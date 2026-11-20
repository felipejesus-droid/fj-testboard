const REQUIRED_HEADINGS = {
  T01: ['dimensões de avaliação', 'escala 0 a 5', 'matriz de lacunas', 'oportunidades prioritárias', 'sequência de 90 dias'],
  T02: ['fatos observados', 'inferências', 'contradições', 'hipóteses e premissas'],
  T03: ['problema', 'usuários', 'escopo', 'requisitos', 'medidas de sucesso', 'riscos', 'questões abertas'],
  T04: ['problema', 'usuários', 'escopo', 'requisitos', 'premissas', 'questões abertas'],
  T05: ['agenda', 'objetivos de aprendizagem', 'exercícios', 'governança e proteção de dados', 'como medir o aprendizado', 'o que verificar'],
  T06: ['agenda', 'exercícios', 'o que verificar'],
  T07: ['lâmina 8'],
  T08: ['lâmina 8'],
  T09: ['calendário de 30 dias', 'publicações completas'],
  T10: ['calendário de 30 dias', 'publicações completas'],
  T11: ['escopo mvp'],
  T12: ['revisão', 'correções'],
};

export function headingsFor(taskId) {
  return REQUIRED_HEADINGS[taskId] || [];
}
