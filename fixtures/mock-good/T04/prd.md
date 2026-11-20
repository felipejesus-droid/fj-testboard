# PRD — Módulo de cotação rápida da Componentes Vulcano

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
