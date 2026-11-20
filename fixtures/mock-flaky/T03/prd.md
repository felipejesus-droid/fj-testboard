# PRD — Lembrete de consulta da Clínica Movimento Vivo

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
- R4 — Painel de faltas semanais e mensais com comparação por convênio. Critério de aceitação: CA4 — o painel abre em um clique a partir da agenda. de faltas semanais comparável pela recepção. Critério de aceitação: CA4 — o painel mostra o total das faltas da semana anterior até segunda de manhã.
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
