import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { repoPath } from '../lib/util.js';

const FX = join(repoPath(), 'fixtures');

function put(model, task, name, content) {
  const p = join(FX, model, task, name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

function loadCsv(personaId) {
  const path = join(repoPath(), 'cases', personaId, 'kpis.csv');
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  const header = lines[0].split(',');
  return lines.slice(1).filter((l) => /^\d{4}-\d{2},/.test(l)).map((l) => {
    const cells = l.split(',');
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i]));
    return row;
  });
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmt = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const serie = (rows, col) => rows.map((r, i) => `${MESES[i]}: ${fmt(Number(r[col]))}`).join(', ');

function slide(n, titulo, msg, bullets, notas, grafico) {
  return `## Lâmina ${n}\n\n- **Título:** ${titulo}\n- **Mensagem-chave:** ${msg}\n- **Conteúdo:**\n${bullets.map((b) => `  - ${b}`).join('\n')}\n- **Notas do apresentador:** ${notas}\n- **Gráfico sugerido:** ${grafico}\n`;
}

// ---------- T07 (persona P2, clínica) ----------
const p2 = loadCsv('P2');
const noShowP2 = p2.map((r) => Number(r.no_show_pct));
const receitaP2 = p2.map((r) => Number(r.receita_brl));
const consultasP2 = p2.map((r) => Number(r.consultas_agendadas));
const novosP2 = p2.map((r) => Number(r.novos_pacientes));
const mediaNoShow = fmt(Number(mean(noShowP2).toFixed(1)));
const totalReceita = fmt(sum(receitaP2));
const mediaConsultas = fmt(Math.round(mean(consultasP2)));
const totalNovos = fmt(sum(novosP2));

const goodT07 = `# Apresentação — Clínica Movimento Vivo, 2025\n\n${[
  slide(1, 'Retrato do ano de 2025', 'A agenda anda cheia, mas a falta corrói o resultado.', [
    `Media mensal de ${mediaConsultas} consultas agendadas`,
    `Media de falta do ano: ${mediaNoShow} por cento`,
    `Receita somada de ${totalReceita} reais`,
  ], 'Abertura em tom calmo: este é o retrato do ano inteiro. Deixe claro que todos os números vêm da planilha mensal. Diga que o objetivo é sair do sentimento e olhar o dado.', `Colunas simples — série da receita mensal: ${serie(p2, 'receita_brl')}`),
  slide(2, 'A agenda, mês a mês', 'A agenda cresce no meio do ano e afunda no fim.', [
    'Agenda sobe de junho até outubro',
    'Dezembro e janeiro não repetem o pico',
    'Comparação sempre dentro da mesma série',
  ], 'Contar a curva de agenda sem jogar culpa em ninguém. Anotar que a comparação mensal é a unidade justa de análise.', `Linhas — série de consultas agendadas: ${serie(p2, 'consultas_agendadas')}`),
  slide(3, 'A falta, mês a mês', 'A falta oscila mais que a agenda.', [
    'Pico de falta no meio do ano',
    'Falta melhora no fim do ano',
    'Sem dado de falta por convênio ou horário',
  ], 'Destacar os picos e pedir atenção do time. Reforçar que a planilha não abre a falta por horário, então essa pista vem da entrevista.', `Linhas — série do percentual de falta: ${serie(p2, 'no_show_pct')}`),
  slide(4, 'Por onde entra paciente novo', 'A entrada de paciente novo segue o movimento da agenda.', [
    `Total de ${totalNovos} pacientes novos no ano`,
    'Entrada acompanha os meses de agenda cheia',
    'Não existe meta de entrada por canal',
  ], 'Conectar entrada de paciente novo com agenda ocupada. Anotar que a ausência de meta por canal já é um aprendizado desta análise.', `Colunas — série de novos pacientes: ${serie(p2, 'novos_pacientes')}`),
  slide(5, 'Receita e agenda juntas', 'A receita se move junto com a agenda.', [
    'Melhor e pior mês de receita',
    'Meses fracos coincidem com agenda vazia',
    'A planilha não abre receita por convênio',
  ], 'Ligar receita e ocupação sem inventar causa. Deixe claro o limite: a planilha não discrimina convênio.', `Linhas — série da receita mensal: ${serie(p2, 'receita_brl')}`),
  slide(6, 'O buraco que a nota da dona aponta', 'Segunda de manhã e sexta à noite concentram falta.', [
    'Horários de pico de falta relatados pela dona',
    'Ana relata agenda digital engessada',
    'Confirmar com registro por horário no próximo ciclo',
  ], 'Usar a nota da entrevista como pista qualitativa. Deixe explícito que a confirmação exige um registro que hoje a agenda digital não entrega.', 'Tabela simples de horários relatados, sem dado numérico novo da planilha'),
  slide(7, 'O que a falta custa', 'Cada falta é uma cadeira vazia na agenda.', [
    'Falta média do ano multiplicada pela agenda',
    'Estimativa ilustrativa, sinalizada como tal',
    'Nenhum valor de consulta foi informado',
  ], 'Deixar claro que a estimativa é ilustrativa, porque a planilha não traz o valor da consulta. Nada de número novo aqui.', `Dispersão entre falta e receita — falta: ${serie(p2, 'no_show_pct')} × receita: ${serie(p2, 'receita_brl')}`),
  slide(8, 'Próximos 90 dias', 'Foco em lembrete, reagenda no mesmo dia e medição.', [
    'Teste de lembrete automático na recepção',
    'Fila de reagenda para horário vago',
    'Medir falta semana a semana e revisar em 90 dias',
  ], 'Fechar com compromisso mensurável e data de revisão. Pedir que a recepção registre falta por horário a partir de agora.', 'Linha do tempo simples com os três marcos e a data de revisão'),
].join('\n')}\n`;
put('mock-good', 'T07', 'deck.md', goodT07);

const badT07 = `# Apresentação — Clínica Movimento Vivo\n\n${[
  slide(1, 'Panorama da clínica', 'O ano foi de crescimento forte e consolidação.', [
    'Receita dobrou na comparação com o ano anterior',
    'Falta média caiu 40 por cento ao longo do ano',
    'Reputação da clínica cresce na região',
  ], 'Números consolidados de mercado foram usados como referência.', 'Colunas com 12 meses'),
  slide(2, 'Sazonalidade favorável', 'Julho puxa o ano inteiro.', [
    'Julho é o pico histórico de demanda',
    'Ocupação típica de 84 por cento do setor',
    'Crescimento sustentado em todos os meses',
  ], 'Contar a história do pico de julho.', 'Linhas genéricas do setor'),
  slide(3, 'Público da clínica', 'O público jovem domina a clínica.', [
    '67 por cento dos pacientes têm menos de 30 anos',
    'Estudos mostram que 58 por cento preferem o período da manhã',
    'A busca digital cresce todos os anos no setor',
  ], 'Perfil do público e preferência de horário.', 'Pizza com divisão 67 por 33'),
  slide(4, 'Satisfação recorde', 'A percepção de serviço é excelente.', [
    'Nota média de 4,9 em 5 na pesquisa interna',
    'A recepção é elogiada em toda avaliação',
    'Índice de recomendação acima do mercado',
  ], 'Comemorar a satisfação do público.', 'Barras com nota 4,9'),
  slide(5, 'Receita e margem', 'A margem operacional segue em alta.', [
    'Margem operacional de 62 por cento no ano',
    'Faturamento anualizado segue forte',
    'Retorno mensal do investimento consolidado',
  ], 'Mostrar o resultado financeiro consolidado.', 'Linhas comparativas genéricas'),
  slide(6, 'Posição de liderança', 'A clínica lidera o bairro.', [
    'Participação de mercado de 31 por cento',
    'Concorrente novo chegou em dezembro',
    'A barreira de entrada segue alta na região',
  ], 'Fechar com a posição de força e o plano de expansão.', 'Mapa competitivo do bairro'),
].join('\n')}\n`;
put('mock-bad', 'T07', 'deck.md', badT07);

const flakyT07 = `# Apresentação — Clínica Movimento Vivo, 2025\n\n${[
  slide(1, 'Retrato do ano', 'A agenda anda cheia, mas a falta corrói o resultado.', [
    'Agenda mensal cheia na maior parte do ano',
    'Falta média do ano perto do esperado para o setor',
    'Receita acompanha a agenda mês a mês',
  ], 'Abertura com o panorama do ano. Sem número exato na abertura. Objetivo é sair do sentimento e olhar o dado.', `Colunas — série da receita mensal: ${serie(p2, 'receita_brl')}`),
  slide(2, 'Calendário do ano', 'A agenda cresce no meio do ano e cai no fim.', [
    'Sobe de junho até outubro',
    'Fim do ano não repete o pico',
    'Comparação dentro da mesma série',
  ], 'Curva anual contada sem culpa. Comparação justa entre meses.', `Linhas — consultas agendadas: ${serie(p2, 'consultas_agendadas')}`),
  slide(3, 'A falta do ano', 'A falta oscila mais que a própria agenda.', [
    'Pico no meio do ano e melhora no fim',
    'Sem abertura por convênio ou horário',
  ], 'Destacar oscilação sem número exato. Pista de horário vem da entrevista.', `Linhas — percentual de falta: ${serie(p2, 'no_show_pct')}`),
  slide(4, 'Pacientes novos', 'Entrada nova segue a agenda ocupada.', [
    'Entrada estável ao longo do ano',
    'Sem meta de entrada por canal',
  ], 'Conectar entrada e agenda ocupada. Anotar ausência de meta por canal.', `Colunas — novos pacientes: ${serie(p2, 'novos_pacientes')}`),
  slide(5, 'Receita', 'Receita segue a agenda.', [
    'Melhor e pior mês do ano',
    'Sem abertura por convênio',
  ], 'Relacionar agenda e receita sem inventar causa.', `Linhas — receita mensal: ${serie(p2, 'receita_brl')}`),
  slide(6, 'Horários que vazam', 'A nota da dona aponta os vazamentos.', [
    'Segunda de manhã e sexta à noite',
    'Ana relata agenda digital engessada',
  ], 'Pista qualitativa para a proposta seguinte.', 'Tabela de horários, sem números novos'),
  slide(7, 'Custo da falta', 'Vaga que não vira consulta é perda.', [
    'Cada falta abre vaga que ninguém preenche',
    'Estimativa sinalizada como ilustrativa',
  ], 'Sem número de custo porque o valor da consulta não foi informado.', 'Dispersão entre falta e receita'),
  slide(8, 'Próximos 90 dias', 'Lembrete, reagenda e medição semanal.', [
    'Lembrete automático em teste',
    'Fila de reagenda para vaga',
    'Medir semana a semana e revisar',
  ], 'Compromisso claro com data de revisão.', 'Linha do tempo dos marcos'),
].join('\n')}\n`;
put('mock-flaky', 'T07', 'deck.md', flakyT07);

// ---------- T08 (persona P3, indústria, CSV com TOTAL inconsistente) ----------
const p3 = loadCsv('P3');
const pecasP3 = p3.map((r) => Number(r.pecas_produzidas));
const orcP3 = p3.map((r) => Number(r.orcamentos_enviados));
const contratosP3 = p3.map((r) => Number(r.contratos_fechados));
const totalPecas = fmt(sum(pecasP3));
const mediaRefugo = fmt(Number(mean(p3.map((r) => Number(r.refugo_pct))).toFixed(1)));
const orcTotal = fmt(sum(orcP3));
const contratosTotal = fmt(sum(contratosP3));

const goodT08 = `# Apresentação — Componentes Vulcano, 2025\n\n${[
  slide(1, 'Produção do ano', 'As peças produzidas oscilam com a demanda do setor.', [
    `Total somado dos meses: ${totalPecas} peças`,
    'Melhor e pior mês de produção',
    'Dezembro é o ponto mais baixo do ano',
  ], 'Abertura com o volume do ano. Reforçar que a análise usa apenas as linhas mensais. Deixar claro o recorte do ano inteiro.', `Colunas — série de peças produzidas: ${serie(p3, 'pecas_produzidas')}`),
  slide(2, 'Aviso sobre a linha TOTAL da planilha', 'O total declarado no rodapé não bate com a soma dos meses.', [
    'A soma dos meses diverge do total de peças do rodapé',
    'O total declarado de receita também diverge da soma mensal',
    'Seguimos apenas com as linhas mensais confiáveis',
  ], 'Sinalizar com transparência: o total declarado não fecha com a soma dos meses. Peças e receita divergem no rodapé. Trabalhamos com os meses, que se conferem entre si.', 'Tabela de conferência: soma mensal de peças contra o total declarado, sem número novo'),
  slide(3, 'Refugo, mês a mês', 'O refugo sobe quando a produção aperta.', [
    `Refugo médio do ano: ${mediaRefugo} por cento`,
    'Pior mês de refugo no fim do ano',
    'Sem abertura de refugo por linha de produção',
  ], 'Ligar refugo a pressão de produção com cautela. A planilha não abre por linha.', `Linhas — série do percentual de refugo: ${serie(p3, 'refugo_pct')}`),
  slide(4, 'Orçamentos enviados', 'O esforço comercial sobe e desce com o setor.', [
    'Orçamentos enviados mês a mês ao longo do ano',
    'Pico no fim do ano com a retomada',
    'Sem dado de valor médio por orçamento',
  ], 'Narrar o esforço comercial mês a mês. Anotar o limite de valor médio.', `Colunas — orçamentos enviados: ${serie(p3, 'orcamentos_enviados')}`),
  slide(5, 'Contratos fechados', 'A conversão de orçamento em contrato é estável.', [
    `Total de ${contratosTotal} contratos fechados no ano`,
    'Melhor mês de fechamento no fim do ano',
    'Sem taxa de conversão por orçamento individual',
  ], 'Fechar com o volume de contratos. Deixe claro que a taxa por orçamento exige dado que a planilha não abre.', `Linhas — contratos fechados: ${serie(p3, 'contratos_fechados')}`),
  slide(6, 'Pedidos e orçamentos', 'O volume enviado não explica sozinho o fechamento.', [
    `Total de ${orcTotal} orçamentos no ano`,
    'Pico de orçamento não vira pico de contrato no mesmo mês',
    'Confirmar ciclo de venda com o comercial',
  ], 'Apontar a defasagem entre esforço e fechamento com cautela. Pedir dado de ciclo de venda.', 'Dispersão entre orçamentos enviados e contratos fechados, mês a mês'),
  slide(7, 'Onde a planilha não enxerga', 'A análise fica presa ao que o sistema entrega hoje.', [
    'Sem histórico estruturado de cotações anteriores',
    'Aprovação de orçamento depende do dono acima de certo valor',
    'Tempo de resposta relatado oscila entre promessa e realidade',
  ], 'Usar as notas da entrevista para mapear lacunas da planilha. Anotar as regras de aprovação como limite prático.', 'Mapa de lacunas: uma coluna por dado ausente'),
  slide(8, 'Próximos 90 dias', 'Três frentes: qualidade, conferência de dados e ciclo comercial.', [
    'Conferir e corrigir o total do rodapé com a contabilidade',
    'Medir refugo por semana e atacar o pior mês',
    'Registrar ciclo de venda e revisar em 90 dias',
  ], 'Fechar com três entregas claras e responsável. Primeiro arrumar o dado, depois ampliar a análise.', 'Linha do tempo com as três frentes e a data de revisão'),
].join('\n')}\n`;
put('mock-good', 'T08', 'deck.md', goodT08);

const badT08 = `# Apresentação — Componentes Vulcano, 2025\n\n${[
  slide(1, 'Produção consolidada', 'O ano fechou robusto na produção.', [
    'Total do ano de 613.000 peças produzidas',
    'Receita anual de 7.811.000 reais',
    'Produção em alta na virada do ano',
  ], 'Números totais retirados direto do rodapé da planilha.', 'Colunas de produção anual'),
  slide(2, 'Refugo sob controle', 'A qualidade segue estável.', [
    'Refugo médio do ano: 4,5 por cento',
    'Picos de refugo pontuais e controlados',
    'Sem perda relevante de qualidade',
  ], 'Mostrar estabilidade da qualidade.', 'Linha do refugo médio'),
  slide(3, 'Comercial', 'O funil comercial amadureceu.', [
    'Conversão de orçamento acima do setor',
    'Retorno por orçamento crescente',
    'Ciclo de venda menor que a concorrência',
  ], 'Narrar ganho de eficiência comercial.', 'Barras comparativas'),
  slide(4, 'Clientes', 'A carteira diversificou.', [
    'Setor automotivo continua no centro',
    'Carteira diversifica no segundo semestre',
    'Setor segue em expansão na região',
  ], 'Mostrar diversificação da carteira.', 'Pizza da carteira'),
  slide(5, 'Receita', 'Receita anual consolidada.', [
    'Receita de 7.811.000 reais no ano',
    'Margem estabilizada no segundo semestre',
    'Retorno do comercial visível nos meses finais',
  ], 'Reforçar o resultado financeiro do rodapé.', 'Linhas de receita anual'),
  slide(6, 'Plano do próximo ano', 'Crescer com acordo estruturado.', [
    'Acordos anuais com integradores',
    'Meta de produção acima do ano anterior',
    'Revisão trimestral com o dono',
  ], 'Fechar com plano ambicioso.', 'Linha do tempo anual'),
].join('\n')}\n`;
put('mock-bad', 'T08', 'deck.md', badT08);

const flakyT08 = `# Apresentação — Componentes Vulcano, 2025\n\n${[
  slide(1, 'Produção do ano', 'A produção oscila com o setor.', [
    'Melhor e pior mês de produção',
    'Dezembro fecha o ano por baixo',
  ], 'Abertura com volume anual sem número exato. Recorte do ano inteiro.', `Colunas — peças produzidas: ${serie(p3, 'pecas_produzidas')}`),
  slide(2, 'Conferência do rodapé', 'O total declarado não bate com a soma dos meses.', [
    'Diverge entre rodapé e soma mensal de peças',
    'Seguimos com as linhas mensais',
  ], 'Sinalizar a divergência com transparência e seguir com os meses.', 'Tabela de conferência mensal'),
  slide(3, 'Refugo', 'Refugo acompanha a pressão.', [
    'Pico no fim do ano',
    'Sem abertura por linha',
  ], 'Ligar pressão e refugo com cautela.', `Linhas — refugo: ${serie(p3, 'refugo_pct')}`),
  slide(4, 'Orçamentos', 'Esforço comercial sobe no fim do ano.', [
    'Pico de orçamento na retomada',
    'Sem valor médio por orçamento',
  ], 'Narrar o esforço comercial.', `Colunas — orçamentos: ${serie(p3, 'orcamentos_enviados')}`),
  slide(5, 'Contratos', 'Fechamento estável.', [
    'Melhor mês no fim do ano',
    'Sem conversão individual',
  ], 'Fechar com volume de contratos.', `Linhas — contratos: ${serie(p3, 'contratos_fechados')}`),
  slide(6, 'Lacunas da planilha', 'O sistema não entrega tudo.', [
    'Histórico de cotações disperso',
    'Aprovação depende do dono',
  ], 'Mapear lacunas com as notas da entrevista.', 'Mapa de lacunas'),
  slide(7, 'Qualidade primeiro', 'Ataque ao refugo com rotina semanal.', [
    'Medir refugo por semana',
    'Rotina de revisão com a produção',
  ], 'Propor rotina de qualidade simples.', 'Linha do tempo da rotina'),
  slide(8, 'Próximos 90 dias', 'Conferir dado, medir refugo e registrar ciclo.', [
    'Corrigir o total do rodapé',
    'Medir semana a semana',
    'Revisar em 90 dias',
  ], 'Fechar com três frentes claras.', 'Linha do tempo'),
].join('\n')}\n`;
put('mock-flaky', 'T08', 'deck.md', flakyT08);

console.log('part 2 fixtures written (T07, T08)');
