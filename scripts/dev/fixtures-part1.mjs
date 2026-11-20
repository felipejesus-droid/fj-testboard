import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { repoPath } from '../lib/util.js';

const FX = join(repoPath(), 'fixtures');

function put(model, task, name, content) {
  const p = join(FX, model, task, name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

for (const m of ['mock-good', 'mock-bad', 'mock-flaky']) {
  rmSync(join(FX, m), { recursive: true, force: true });
}

// ---------- T01 ----------
const t01dims = [
  ['Dimensão 1', 'Comunicação com hóspede', ['Quanto tempo média para responder uma mensagem de hóspede?', 'Quantos canais a recepção vigia hoje?', 'O hóspede recorrente é identificado ao falar com o escritório?']],
  ['Dimensão 2', 'Rotina de governança', ['Como a lista de quartos do dia chega às camareiras?', 'Com que frequência a lista sai desatualizada?', 'O que acontece quando um hóspede estende a estada?']],
  ['Dimensão 3', 'Reservas e preço', ['Como o preço da diária é decidido hoje?', 'Qual a participação de reserva direta?', 'Quando a tabela foi revisada pela última vez?']],
  ['Dimensão 4', 'Dados e histórico', ['Onde vive o histórico do hóspede?', 'Quem pode ver o arquivo de avaliações?', 'Existe algum relatório de ocupação por Canal?']],
  ['Dimensão 5', 'Equipe e conhecimento', ['Novos contratados aprendem sozinhos ou com alguém junto?', 'Alguns processo dependem de uma pessoa só?', 'Quanto tempo a recepção gasta com retrabalho de anotação?']],
];

let g_t01 = '# Diagnóstico de maturidade digital — Duarte Meirelles Contabilidade\n\n';
for (const [nome, tema, perguntas] of t01dims) {
  g_t01 += `## Dimensões de avaliação\n\n### ${nome} — ${tema}\n`;
  for (const q of perguntas) g_t01 += `- ${q}\n`;
  g_t01 += '\n';
}
g_t01 += '## Escala 0 a 5\n\n- 0 a 1: controle manual, sem registro confiável; nada documentado.\n- 2 a 3: existe um controle, mas incompleto ou dependente de cada empregado.\n- 4 a 5: rotina padronizada, medida e com dado que respalda decisão.\n\nCada dimensão recebe nota de 0 a 5 segundo essas âncoras; abaixo de 3 marca lacuna.\n\n## Matriz de lacunas\n\n| Dimensão | Estágio provável hoje | Lacuna principal |\n|---|---|---|\n| Dimensão 1 | 2 | Mensagens espalhadas por três canais sem dono claro |\n| Dimensão 2 | 1 | Bilhete de papel versus planilha que quebra toda semana |\n| Dimensão 3 | 2 | Tabela de diária sem revisão recente, comparação com ruas vizinhas |\n| Dimensão 4 | 1 | Histórico do hóspede disperso em papéis da recepção |\n| Dimensão 5 | 2 | Processo de quarto depende de poucas pessoas com rotina oral |\n\n## Oportunidades prioritárias\n\n### Oportunidade 1\nUnificar as mensagens de hóspede em uma só fila com responsável e prazo. Esforço: baixo. Retorno: alto, porque hoje ninguém responde rápido e cada um olha um lugar (L06).\n\n### Oportunidade 2\nSubstituir o bilhete de papel por uma lista central de quartos atualizada durante o dia. Esforço: médio. Retorno: alto, evita camareira em quarto ocupado por estenda de permanência (L02).\n\n### Oportunidade 3\nMontar um cadastro simples de hóspede com a última estada e preferência. Esforço: médio. Retorno: médio, diferencia a reserva direta, que é a que dá mais lucro (L16).\n\n## Sequência de 90 dias\n\n- Dias 1–30: desenhar a fila única de mensagens e treinar a Mariana nela; critério de conclusão: toda mensagem tem dono e resposta em até duas horas.\n- Dias 31–60: implantar a lista digital dos quartos no tablet da governança; critério: zero bilhete de papel por semana.\n- Dias 61–90: cadastro do hóspede em uso pela recepção; critério: hóspede de retorno já reconhecido antes do check-in seguinte.\n';
put('mock-good', 'T01', 'relatorio.md', g_t01);

const b_t01 = '# Diagnóstico rápido de maturidade digital — conta contábil\n\n## Dimensões de avaliação\n\n### Dimensão 1\n- A empresa usa a nuvem?\n- Existem sistemas?\n- Há uma equipe dedicada?\n\n### Dimensão 2\n- O marketing é organizado?\n\n### Dimensão 3\n- Os dados são utilizados?\n\n## Escala 0 a 5\n\nA nota vai de 0 a 5.\n';
put('mock-bad', 'T01', 'relatorio.md', b_t01);

let f_t01 = g_t01;
f_t01 = f_t01.replace('## Sequência de 90 dias', '## Controle de mensagens\n\nA fila única de mensagens é o ponto central da maturidade do escritório: sem ela, cada mensagem fica sem dono e a resposta vira espera.\n\nA fila única de mensagens é o ponto central da maturidade do escritório: sem ela, cada recado fica sem dono e o retorno vira espera.\n\n## Sequência de 90 dias');
put('mock-flaky', 'T01', 'relatorio.md', f_t01);

// ---------- T02 ----------
const g_t02 = `# Análise de lacunas — Pousada Céu de Pinhal

## Fatos observados

- As mensagens de hóspede chegam por três lugares distintos (L05).
- A lista de quartos circula em bilhete de papel e depois é digitada de novo (L18).
- Se a pousada mexeu no preço em algum momento parece haver divergência nas anotações de L09 e L10.
- A equipe apareceu fixa em quatro pessoas desde 2021 (L11) e houve contratação de camareiras novas no último verão (L12).

## Inferências

- O retrabalho de transcrever papel em planilha aumenta a chance de a lista das camareiras sair desatualizada (L02, L13, L18).
- A reserva direta perde espaço porque não há um ponto único de resposta ao hóspede (L16, L06).

## Contradições

- **Contradição 1 (L07 × L08):** a dona diz que julho é o melhor mês (L07) e, na fala seguinte, que agosto último foi o recorde com a festa da colônia (L08). Uma hipótese que explica: a festa acontece em agosto e julho fica marcado na memória pelo frio em vez do movimento.
- **Contradição 2 (L09 × L10):** sem mudança de diária há dois anos (L09) contra aumento no ano passado (L10). Hipótese: aumento pontual em um fim de semana especial não registrava como "mexer no preço".
- **Contradição 3 (L11 × L12):** time fixo desde 2021 (L11) contra duas camareiras novas no último verão (L12). Hipótese: contrato temporário de temporada viva fora da conta da equipe fixa.

## Hipóteses e premissas

- Premissa: existem sazonalidade real de julho e agosto; confirmar com o kpi de outros anos antes de programar campanha.
- Premissa: WhatsApp é o canal dominante; confirmar antes de fechar qualquer ferramenta de resposta única.
- Pergunta aberta: quantas estadias estendidas por mês em média, para dimensionar o efeito da lista desatualizada.
`;
put('mock-good', 'T02', 'relatorio.md', g_t02);

const b_t02 = `# Análise de lacunas — Pousada

## Fatos observados

- A pousada usa folhas de papel na limpeza (L13).
- As reservas diretas dão mais lucro (L16).

## Inferências

- Uma prancheta digital resolveria o problema.

## Hipóteses e premissas

- Confirmar a margem da plataforma antes de decidir campanha.
`;
put('mock-bad', 'T02', 'relatorio.md', b_t02);

let f_t02 = g_t02.replace(/^- \*\*Contradição 3[\s\S]*?\n/, '');
f_t02 = f_t02.replace('- **Contradição 2 (L09 × L10):** sem mudança de diária há dois anos (L09) contra aumento no ano passado (L10). Hipótese: aumento pontual em um fim de semana especial não registrava como "mexer no preço".\n', '- **Contradição 2 (L09 × L10):** sem mudança de diária há dois anos (L09) contra aumento no ano passado (L10). Hipótese: aumento pontual de temporada não valia registro.\n');
put('mock-flaky', 'T02', 'relatorio.md', f_t02);

// ---------- T03 ----------
const g_t03 = `# PRD — Lembrete de consulta da Clínica Movimento Vivo

## Problema

Pacientes confirmam e não aparecem. A recepção faz uma rodada de ligações manual que arma a agenda, e o buraco da falta só se revela na hora (L01, L03).

## Usuários

- Paciente adulto com plano de tratamento em curso.
- Recepção, hoje responsavel por cada confirmação uma a uma.
- Fisioterapeuta, que absorve ociosidade na agenda.

## Escopo

**Entra nesta versão**
- Lembrete automático da consulta com janela configurável e opção de confirmar ou reagendar.
- Gargalo visível: fila de reagenda para preencher horário vago no mesmo dia.

**Fica de fora nesta versão**
- Pagamento online, prontuário digital, IA de triagem.

## Requisitos

- R1 — Lembrete 24 horas antes por mensagem e 2 horas antes no dia. Critério de aceitação: CA1 — o lembrete é disparado pelo sistema na janela certa e registra leitura.
- R2 — Botão de confirmação em um toque. Critério de aceitação: CA2 — a confirmação altera o status da consulta sem intervenção da recepção.
- R3 — Reagendamento a partir do lembrete com regra de horário existente. Critério de aceitação: CA3 — o horário vago aparece para outro paciente da fila no mesmo dia.
- R4 — Painel de faltas semanais comparável pela recepção. Critério de aceitação: CA4 — o painel mostra o total das faltas da semana anterior até segunda de manhã.
- R5 — Número de mensagens limitado por consulta. Critério de aceitação: CA5 — nenhum paciente receber mais de dois lembretes da mesma consulta.

## Medidas de sucesso

- Faltar acima de 21% em média no trimestre para baixo de 18% em 90 dias (alvo definido pelo dono, não previsão).
- Economia de tempo das ligações manuais: meta de 60 minutos/dia em 30 dias, com janela de medição de 4 semanas.

## Riscos

- Paciente interpretar a mensagem como marketing e silenciar notificações.
- Horário de terça e quinta às 19h sobre carregado de reagenda (L13).

## Questões abertas

- Qual canal tem maior alcance do paciente: mensagem de celular ou WhatsApp?
- A recepção aceita deixar de ligar por completo na primeira versão?
`;
put('mock-good', 'T03', 'prd.md', g_t03);

const b_t03 = `# PRD — Lembrete de consulta

## Problema

Pacientes faltam muito e isso causa prejuízo.

## Usuários

Pacientes e recepção.

## Escopo

Entra: lembrete automático, integração total com a agenda, pagamento pelo aplicativo, prontuário, marketing por mensagem.

## Requisitos

- R1 — O sistema envia lembretes automáticos por vários canais.
- R2 — O paciente confirma com um botão.
- R3 — A agenda atualiza em tempo real com sincronização.

## Medidas de sucesso

- Reduzir faltas rapidamente com uma solução fácil de usar.

## Riscos

- Nenhum risco relevante identificado.

## Questões abertas

- Nada por agora.
`;
put('mock-bad', 'T03', 'prd.md', b_t03);

const f_t03 = g_t03.replace('- R4 — Painel', '- R4 — Painel de faltas semanais e mensais com comparação por convênio. Critério de aceitação: CA4 — o painel abre em um clique a partir da agenda.');
put('mock-flaky', 'T03', 'prd.md', f_t03);

// ---------- T04 ----------
const g_t04 = `# PRD — Módulo de cotação rápida da Componentes Vulcano

## Problema

O ciclo de cotação de peças emplaca entre a consulta manual de preço de insumo e a pilha de aprovação do dono, enquanto o comprador quer resposta no mesmo dia (nota de entrevista L04).

## Usuários

- Vendedores internos (dois), que preparam a cotação.
- Dono, que decide esforço de fábrica e margem.
- Comprador técnico, que espera retorno com preço e prazo.

## Escopo

**Entra**
- Montagem da cotação a partir de preço de insumo e tempo de máquina.
- Fila de aprovação do dono com prazo interno.
- Registro do resultado da cotação (ganha ou perdida, com motivo).

**Não entra**
- Integração direta no ERP antigo; a fase 1 trabalha com planilha exportada.
- Precificação automática sem aprovação humana.

## Requisitos

- R1 — Template de cotação com preço de insumo atual e tempo de máquina. Critério de aceitação: CA1 — cotação nova sai com os dois preços preenchidos a partir da planilha exportada.
- R2 — Fila única de aprovação do dono com aviso. Critério de aceitação: CA2 — o dono avista cotações esperando decisão em ordem de chegada.
- R3 — Registro de cotação perdida com motivo escolhido em lista. Critério de aceitação: CA3 — toda cotação marcada perdida tem motivo preenchido antes de fechar.
- R4 — Consulta de cotações passadas por peça parecida. Critério de aceitação: CA4 — busca por tipo de peça retorna as três últimas cotações.

## Premissas

- O preço de insumo da planilha de compras é o preço oficial da cotação.
- Nas fases iniciais o histórico de cotações será construído manualmente, registro por registro, até ter acúmulo suficiente.

## Questões abertas

- **Desencontro 1:** o levantamento diz que a aprovação é sempre do dono e nenhum vendedor fecha sem ele; na mesma lista, item seguinte diz que os vendedores enviam a cotação no mesmo dia sem passar pelo dono. Identificar se há faixa de preço em que o vendedor emenda direto.
- **Desencontro 2:** o brief afirma que o histórico de cotações já existe completo dentro do ERP; as notas de entrevista dizem que não existe histórico estruturado de por que se perdeu uma cotação. Confirmar o que realmente existe antes de prometer busca histórica.
- **Desencontro 3:** o brief diz que a cotação hoje sai em 24 horas na média; a nota de entrevista diz quatro dias úteis. Dimensionar o gargalo real antes de prometer janela de horas.
`;
put('mock-good', 'T04', 'prd.md', g_t04);

const b_t04 = `# PRD — Cotação rápida

## Problema

Demora para sair orçamento de peças.

## Usuários

Vendedores e dono.

## Escopo

Entra: template de cotação com preço de insumo, histórico no ERP e prazo de 60 dias.

## Requisitos

- R1 — O vendedor monta a cotação no template e envia ao comprador.
- R2 — O histórico do ERP alimenta a precificação automática das peças parecidas.
- R3 — O preço de insumo entra novamente toda segunda-feira no sistema.

## Medidas de sucesso

- Cotação registrada em horário no mesmo dia.

## Premissas

- O ERP terá integração direta na fase 1.

## Questões abertas

- A definir depois da implantação.
`;
put('mock-bad', 'T04', 'prd.md', b_t04);

const f_t04 = g_t04.replace('- **Desencontro 3:** o brief diz que a cotação hoje sai em 24 horas na média; a nota de entrevista diz quatro dias úteis. Dimensionar o gargalo real antes de prometer janela de horas.\n', '');
put('mock-flaky', 'T04', 'prd.md', f_t04);

// ---------- T05 ----------
const g_t05 = `# Treinamento de IA para a liderança — Duarte Meirelles Contabilidade

## Agenda

| Bloco | Duração | Objetivo |
|---|---|---|
| 1. O que a ferramenta de conversa resolve e não resolve | 40 min | Calibrar expectativa de uso |
| 2. Demonstração em tarefa do escritório | 30 min | Ver a ferramenta operando em caso real da casa |
| 3. Exercícios guiados | 60 min | Praticar em tarefa de cliente |
| 4. Governança e proteção de dados | 30 min | Regras de uso com dado de cliente |
| 5. Como medir o aprendizado + fechamento | 20 min | Fixar o que muda na rotina |

Total: 3 horas.

## Objetivos de aprendizagem

- Distinguir tarefa que rende automação de tarefa que exige julgamento contábil.
- Escrever uma instrução de trabalho ("prompt") que produza resposta utilizável de primeira.
- Reconhecer risco de dado de cliente em ferramenta aberta e aplicar a regra interna.

## Exercícios

### Exercício 1
Transformar a perguntinha "como me organizo para encerrar o mês?" em instrução estruturada para gerar um checklist de fechamento mensal do escritório. Tempo: 20 min. Material: instruções escritas por dupla.

### Exercício 2
Redigir com apoio da ferramenta uma explicação de imposto para cliente leiga, e depois revisar pontos de terminologia técnica que a ferramenta escondeu. Tempo: 20 min. Material: rascunho impresso para revisão em grupo.

### Exercício 3
Simular uma pergunta de cliente contendo dado pessoal e decidir, com a regra da casa, o que pode entrar na ferramenta e o que não pode. Tempo: 20 min. Material: cartões de situação impressos.

## Governança e proteção de dados

- Dado de cliente nunca entra em ferramenta aberta antes de passar pela desidentificação acordada. Explique em função de como o escritório recebe documentos hoje pelo WhatsApp (L04).
- Toda saída de ferramenta é rascunho: alguém assina por cima com responsabilidade técnica.
- A regra pode mudar conforme o plano contratado da ferramenta; confirme as condições da sua conta e a versão atual antes de padronizar.

## Como medir o aprendizado

- Quiz rápido de 5 perguntas no fim (aferição de conceito).
- Cada participante entrega uma instrução de trabalho escrita própria (aferição de produção).
- Em 30 dias: quantos processos da casa ganharam rascunho por ferramenta (aferição de uso).

## O que verificar

Antes de confiar em qualquer saída de ferramenta de IA, verifique: números (recalcule), datas (confirme no portal oficial), nomes de regra tributária (não assuma), recursos de produto (confira no seu plano) e tom (leia em voz alta como se fosse para o cliente).
`;
put('mock-good', 'T05', 'treinamento.md', g_t05);

const b_t05 = `# Treinamento de IA — Escritório

## Agenda

- 1ª hora: conceitos de IA e Lei nº 13.709/2018 explicada em detalhe.
- 2ª hora: demonstração.

## Objetivos de aprendizagem

Entender IA.

## Exercícios

### Exercício 1
Pedir uma lista de tarefas.

### Exercício 2
Reescrever um e-mail.

## Governança e proteção de dados

A lei dá garantias; siga.

## Como medir o aprendizado

Perguntar se aprenderam.

## O que verificar

Confiar, a ferramenta atual é segura por padrão.
`;
put('mock-bad', 'T05', 'treinamento.md', b_t05);

let f_t05 = g_t05.replace('### Exercício 3', '### Exercício 2b').replace(/### Exercício 2b[\s\S]*?\n\n/, '');
put('mock-flaky', 'T05', 'treinamento.md', f_t05);

// ---------- T06 ----------
const g_t06 = `# IA em 90 minutos para a equipe da pousada

## Agenda

| Bloco | Duração | Objetivo |
|---|---|---|
| 1. O que é um assistente de conversa | 15 min | Perder o medo da ferramenta |
| 2. Praticar na sua rotina | 45 min | Fazer junto, no celular |
| 3. O que verificar antes de usar | 30 min | Ter regra clara de segurança |

## Exercícios

### Exercício 1
Montar a lista de quartos do dia: cada camareira pede ao assistente um modelo de lista com quarto, tipo de limpeza e horário previsto. Depois confere com a lista real da recepção.

### Exercício 2
Responder mensagem de hóspede: escolher um pedido típico de toalha extra e pedir ao assistente duas respostas abertas, uma curta e uma completa. Escolher a melhor e ajustar.

### Exercício 3
Conferência de saída: pedir ao assistente um roteiro de 5 itens para conferir quartos, cortes de cama e amenidades, e testar no quarto vago mais próximo.

## O que verificar

Antes de mandar qualquer texto ao hóspede: o nome está certo? o quarto está certo? o horário bate? se algo parecer estranho, pergunte de novo ou confirme com a recepção.
`;
put('mock-good', 'T06', 'treinamento.md', g_t06);

const b_t06 = `# Treinamento de IA para equipe operacional da pousada — programa completo de capacitação

## Agenda

O treinamento de noventa minutos começa com uma explanação introdutória sobre o estado da arte das ferramentas de inteligência artificial generativas disponíveis no mercado brasileiro no presente momento, seguida de uma contextualização histórica da evolução tecnológica.

## Exercícios

### Exercício 1
Analise criticamente o custo-benefício da implementação de um subscription mensal de assistente de IA que custa R$ 49,90 por usuário, considerando o preço de licença anual.

## O que verificar

Validar integralmente qualquer resposta gerada pela ferramenta mediante verificação metodológica rigorosa.
`;
put('mock-bad', 'T06', 'treinamento.md', b_t06);

const f_t06 = g_t06;
put('mock-flaky', 'T06', 'treinamento.md', f_t06);

console.log('part 1 fixtures written');
