import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { repoPath } from '../lib/util.js';

const FX = join(repoPath(), 'fixtures');

function put(model, task, name, content) {
  const p = join(FX, model, task, name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

// ---------- T09 (persona P4, contabilidade) ----------
const goodT09 = `# Conteúdo de 30 dias — Duarte Meirelles Contabilidade

## Calendário de 30 dias

Semana 1
- Dia 1 — Post no LinkedIn — tema: o cadastro limpo que trava menos a abertura de empresa.
- Dia 2 — Carrossel — tema: os cinco documentos que a contabilidade pede todo mês.
- Dia 3 — Roteiro de vídeo — tema: o que muda no bolso do dono quando a folha atrasa.
- Dia 4 — Post no LinkedIn — tema: história do escritório e o atendimento de clínicas.

Semana 2
- Dia 5 — Carrossel — tema: impostos do simples no dia a dia.
- Dia 6 — Roteiro de vídeo — tema: por que anotar despesa no mesmo dia economiza tempo.
- Dia 7 — Post no LinkedIn — tema: pergunta aberta sobre rotina financeira.
- Dia 8 — Carrossel — tema: os três relatórios mensais que o dono precisa ler.

Semana 3
- Dia 9 — Roteiro de vídeo — tema: a equipe respondendo dúvidas frequentes.
- Dia 10 — Post no LinkedIn — tema: caso sem nome mostrando organização básica.
- Dia 11 — Carrossel — tema: calendário do pequeno empresário mês a mês.
- Dia 12 — Roteiro de vídeo — tema: o que é registro limpo e por que importa.

Semana 4
- Dia 13 — Post no LinkedIn — tema: convite para conversa sem compromisso.
- Dia 14 — Carrossel — tema: checklist de conferência antes de fechar o mês.
- Dia 15 — Roteiro de vídeo — tema: como o escritório lê o fluxo de caixa do cliente.
- Dia 16 — Post no LinkedIn — tema: resumo do mês e chamada para conversa.

## Publicações completas

### Post no LinkedIn 1
Hook: todo ano vemos clínica perder prazo por cadastro bagunçado.
Texto: cadastro limpo parece detalhe, mas é o que destrava abertura, alteração e fechamento de mês sem susto. O dono descobre o problema quando o prazo já passou. Quem mantém o cadastro em ordem conversa melhor com o contador e decide com menos pressa. Chamada: comente aqui a maior dúvida cadastral da sua operação.

### Post no LinkedIn 2
Hook: o relatório mensal não serve para engavetar.
Texto: três relatórios simples valem mais que uma muralha de números: caixa do mês, contas a pagar e impostos previstos. O dono de clínica que lê essa tríade conversa melhor com o contador e decide com menos susto. Chamada: salve este post e confira se você recebe os três todo mês.

### Carrossel 1
Hook: cinco documentos que toda clínica deveria separar antes do dia 10 do mês.
Slide 1: capa com pergunta direta ao dono.
Slide 2: notas fiscais de serviço e o cuidado com a descrição.
Slide 3: comprovantes de pagamento da equipe.
Slide 4: extratos consolidados do mês.
Slide 5: contratos de aluguel e equipamento.
Slide 6: fechamento com convite para conferir a própria rotina.

### Carrossel 2
Hook: o calendário do pequeno empresário cabe numa folha só.
Slide 1: capa com pergunta sobre prazos.
Slide 2: obrigações do início do mês.
Slide 3: conferência do meio do mês.
Slide 4: ponto de contato com o contador.
Slide 5: reserva e revisão no fim do mês.
Slide 6: fechamento com chamada para conversa.

### Roteiro de vídeo 1
Hook: a folha atrasou e o dono só descobre quando abre o caixa.
Cena 1: contador com planilha na mão, fala: folha atrasada semana o caixa e desgasta a confiança da equipe.
Cena 2: texto na tela: data de folha definida antes do dia 5.
Cena 3: chamada: marque uma conversa com seu contador sobre data fixa de folha.

### Roteiro de vídeo 2
Hook: anotou hoje, conferiu sem dor no fim do mês.
Cena 1: dono de clínica anotando despesa no caderno, fala: despesa anotada no mesmo dia não vira buraco na conferência.
Cena 2: texto na tela: registro limpo, conferência rápida.
Cena 3: chamada: teste por uma semana e veja a diferença na sua rotina.

### Post extra de presença
Hook: quem organiza o mês sente a diferença na conversa com o contador.
Esse reforço existe para manter consistência de tom e não substitui as peças acima.
`;

put('mock-good', 'T09', 'conteudo.md', goodT09);

const badT09 = `# Conteúdo para redes sociais — escritório

## Ideias soltas

- Dia 1 — post motivacional sobre empreendedorismo.
- Dia 2 — frase sobre sucesso.
- Dia 3 — vídeo de bastidor.

## Peças

Post no LinkedIn 1: nosso escritório é referência no mercado e o atendimento é reconhecido por todos.

Carrossel 1: slides sobre dicas fiscais genéricas com estudo internacional de 2019 apontando crescimento.

Roteiro de vídeo 1: fala solta sobre impostos sem roteiro definido.
`;
put('mock-bad', 'T09', 'conteudo.md', badT09);

const flakyT09 = `# Conteúdo de 30 dias — Duarte Meirelles Contabilidade

## Calendário de 30 dias

Semana 1
- Dia 1 — Post no LinkedIn — tema: cadastro limpo que abre porta.
- Dia 2 — Carrossel — tema: documentos do mês.
- Dia 3 — Roteiro de vídeo — tema: folha em dia.
- Dia 4 — Post no LinkedIn — tema: histórico do escritório.

Semana 2
- Dia 5 — Carrossel — tema: impostos do simples.
- Dia 6 — Roteiro de vídeo — tema: anotação diária.
- Dia 7 — Post no LinkedIn — tema: rotina financeira.
- Dia 8 — Carrossel — tema: três relatórios do mês.

## Publicações completas

### Post no LinkedIn 1
Hook: todo ano vemos clínica perder prazo por cadastro bagunçado.
Texto: cadastro limpo evita multa e ganha tempo com o contador. Chamada: comente sua dúvida cadastral.

### Post no LinkedIn 2
Hook: o relatório mensal não serve para engavetar.
Texto: três relatórios simples valem mais que uma muralha de números. Chamada: confira se você recebe os três.

### Carrossel 1
Hook: cinco documentos que toda clínica deveria separar antes do dia 10 do mês.
Slide 1: capa.
Slide 2: notas fiscais.
Slide 3: comprovantes.
Slide 4: extratos.
Slide 5: contratos.
Slide 6: convite para conferir.

### Carrossel 2
Hook: cinco documentos que toda clínica deveria separar antes do dia 10 do mês.
Slide 1: capa.
Slide 2: prazos.
Slide 3: conferência.
Slide 4: contato.
Slide 5: revisão.
Slide 6: fechamento.

### Roteiro de vídeo 1
Hook: a folha atrasou e o dono só descobre quando abre o caixa.
Cena 1: contador explicando o atraso.
Cena 2: texto na tela sobre data fixa.
Cena 3: chamada para conversa.

### Roteiro de vídeo 2
Hook: anotou hoje, conferiu sem dor no fim do mês.
Cena 1: dono anotando despesa.
Cena 2: texto na tela sobre registro limpo.
Cena 3: chamada para teste de rotina.
`;

put('mock-flaky', 'T09', 'conteudo.md', flakyT09);

// ---------- T10 (persona P2, clínica, comunicação de saúde responsável) ----------
const goodT10 = `# Conteúdo de 30 dias — Clínica Movimento Vivo

## Calendário de 30 dias

O calendário começa em 1 de fevereiro de 2027 (uma segunda-feira).

Semana 1
- Dia 1 — Post no LinkedIn — tema: apresentação do time e do jeito de cuidar.
- Dia 2 — Carrossel — tema: o que esperar da primeira sessão de avaliação.
- Dia 3 — Roteiro de vídeo — tema: como organizar a rotina em casa entre sessões.
- Dia 4 — Post no LinkedIn — tema: histórico de cuidado com atendimento individual.

Semana 2
- Dia 8 — Carrossel — tema: cinco hábitos que ajudam no dia do atendimento.
- Dia 9 — Roteiro de vídeo — tema: preparação simples para a sessão.
- Dia 10 — Post no LinkedIn — tema: recepção ágil e agendamento sem enrolação.
- Dia 11 — Carrossel — tema: dúvidas frequentes de quem nunca fez fisioterapia.

Semana 3
- Dia 15 — Roteiro de vídeo — tema: a importância do acompanhamento profissional.
- Dia 16 — Post no LinkedIn — tema: como a clínica monta o plano individual.
- Dia 17 — Carrossel — tema: cuidados em casa que complementam a sessão.
- Dia 18 — Roteiro de vídeo — tema: o papel da avaliação no começo de tudo.

Semana 4
- Dia 22 — Post no LinkedIn — tema: convite para avaliação sem compromisso.
- Dia 23 — Carrossel — tema: mitos e verdades sobre pausas no trabalho.
- Dia 24 — Roteiro de vídeo — tema: pergunta de paciente respondida com ressalva.
- Dia 25 — Post no LinkedIn — tema: resumo do mês e canal direto para conversa.

## Publicações completas

### Post no LinkedIn 1
Hook: começar tratamento gera dúvida, e dúvida demais afasta quem precisa de cuidado.
Texto: na clínica, a primeira sessão é de avaliação: escuta, história e teste simples de movimento. Nada é decidido antes de entender a rotina de cada pessoa. Orientação individual depende de avaliação profissional e muda de pessoa para pessoa. Chamada: mande sua dúvida que a equipe responde no comentário.

### Post no LinkedIn 2
Hook: fisioterapia demora demais para mostrar resultado? Essa objeção é comum e merece resposta honesta.
Texto: o tempo de resposta varia com o quadro, a rotina e a constância de cada pessoa; por isso o plano é individual e revisado a cada etapa. O que dá para prometer é processo: avaliação, acompanhamento e ajuste com profissional. Chamada: se essa objeção já passou pela sua cabeça, converse com a recepção sem compromisso.

### Carrossel 1
Hook: o que acontece na primeira sessão, contado em cinco passos.
Slide 1: capa com pergunta direta.
Slide 2: acolhimento e escuta da história.
Slide 3: teste simples de movimento com orientação.
Slide 4: plano individual explicado com ressalva de avaliação.
Slide 5: agenda realista, combinada junto com o paciente.
Slide 6: convite para marcar avaliação.

### Carrossel 2
Hook: cinco hábitos simples que ajudam entre uma sessão e outra.
Slide 1: capa com pergunta.
Slide 2: pausas no trabalho com orientação simples.
Slide 3: rotina de sono e hidratação como apoio ao cuidado.
Slide 4: anotação de sensações para levar à sessão.
Slide 5: ressalva de que orientação depende de avaliação individual.
Slide 6: fechamento com convite para conversar.

### Roteiro de vídeo 1
Hook: nunca fiz fisioterapia e estou com medo de doer mais.
Cena 1: recepção acolhedora, fala: a primeira visita é de escuta, sem pressa.
Cena 2: profissional mostrando movimento simples, fala: cada plano nasce da avaliação de cada pessoa.
Cena 3: chamada: marque uma conversa sem compromisso na recepção.

### Roteiro de vídeo 2
Hook: a agenda da semana abre na segunda-feira, 1 de fevereiro de 2027.
Cena 1: recepção atualizando o quadro de horários.
Cena 2: paciente perguntando sobre horários livres.
Cena 3: chamada: confira os horários com a recepção.
`;
put('mock-good', 'T10', 'conteudo.md', goodT10);

const badT10 = `# Conteúdo para redes — clínica

## Calendário

- Dia 1 — post com promessa rápida de alívio.
- Semana 1 — mais dois posts motivacionais.

## Publicações

### Post no LinkedIn 1
Hook: o método do sucesso imediato.
Texto: fisioterapia com cura garantida em poucas sessões. Antes e depois de pacientes reais comprovam. Resultado garantido para todo mundo que assinar o pacote.

### Post no LinkedIn 2
Hook: promoção da semana.
Texto: pacote de 10 sessões com desconto agressivo esta semana.
`;
put('mock-bad', 'T10', 'conteudo.md', badT10);

const flakyT10 = `# Conteúdo de 30 dias — Clínica Movimento Vivo

## Calendário de 30 dias

O calendário começa em 1 de fevereiro de 2027 (uma segunda-feira).

Semana 1
- Dia 1 — Post no LinkedIn — tema: apresentação do time.
- Dia 2 — Carrossel — tema: primeira sessão.
- Dia 3 — Roteiro de vídeo — tema: rotina em casa.
- Dia 4 — Post no LinkedIn — tema: atendimento individual.

Semana 2
- Dia 5 — Carrossel — tema: dúvidas frequentes.
- Dia 6 — Roteiro de vídeo — tema: preparação da sessão.
- Dia 7 — Post no LinkedIn — tema: agenda da recepção.
- Dia 8 — Carrossel — tema: hábitos entre sessões.

## Publicações completas

### Post no LinkedIn 1
Hook: começar tratamento gera dúvida, e dúvida demais afasta quem precisa de cuidado.
Texto: a primeira sessão é de avaliação, com escuta e teste simples de movimento. Orientação individual depende de avaliação profissional. Chamada: mande sua dúvida nos comentários.

### Post no LinkedIn 2
Hook: fisioterapia demora demais para mostrar resultado? Resposta honesta.
Texto: o tempo de resposta varia com o quadro e a constância de cada pessoa; o plano é individual. Chamada: converse com a recepção sem compromisso.

### Carrossel 1
Hook: o que acontece na primeira sessão, contado em cinco passos.
Slide 1: capa.
Slide 2: escuta.
Slide 3: avaliação.
Slide 4: plano individual.
Slide 5: agenda combinada.
Slide 6: convite.

### Carrossel 2
Hook: cinco hábitos simples que ajudam entre uma sessão e outra.
Slide 1: capa.
Slide 2: pausas.
Slide 3: rotina.
Slide 4: anotação.
Slide 5: ressalva.
Slide 6: fechamento.

### Roteiro de vídeo 1
Hook: nunca fiz fisioterapia e estou com medo de doer mais.
Cena 1: recepção acolhedora.
Cena 2: movimento simples.
Cena 3: chamada para conversa.

### Roteiro de vídeo 2
Hook: a agenda da semana abre na sexta-feira, 5 de fevereiro de 2027.
Cena 1: recepção atualizando o quadro de horários.
Cena 2: paciente perguntando sobre horários livres.
Cena 3: chamada: confira os horários com a recepção.
`;
put('mock-flaky', 'T10', 'conteudo.md', flakyT10);

console.log('part 3 fixtures written (T09, T10)');
