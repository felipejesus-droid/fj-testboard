import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { repoPath } from '../lib/util.js';

const FX = join(repoPath(), 'fixtures');

function put(model, task, name, content) {
  const p = join(FX, model, task, name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

function escopo(md) {
  return md;
}

const ESCOPO_BOM = `# Escopo MVP — Checklist de governança da Pousada Céu de Pinhal

## Escopo MVP

- Quem usa: camareiras e governanta da pousada, no celular, durante a virada de quarto.
- Trabalho central: registrar a conferência de governança de cada quarto sem depender de papel e sem internet.
- Obrigatório (must): lista de tarefas por quarto, marcação de quarto limpo, estado salvo no aparelho (localStorage), funcionamento offline completo.
- Seria bom (should): resumo do dia para a governanta, ordenação por andar.
- Fica de fora (won't): fotos, relatório gerencial, integrção com sistema de reserva, qualquer recurso que exija internet.
- Medida de sucesso: todas as conferências do dia registradas no aparelho, sem retrabalho de transcrição no papel.
`;

// ---------- T11 mock-good ----------
const goodIndex = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Checklist de Governança</title>
<style>
body { font-family: sans-serif; background: #f7f5ef; color: #1c2b3a; margin: 0; padding: 16px; }
button { min-height: 44px; min-width: 44px; }
li { padding: 8px 0; }
</style>
</head>
<body>
<h1>Checklist de Governança</h1>
<p id="progresso">Conferências registradas: 0 de 0</p>
<form id="form-tarefa">
  <label for="quarto">Número do quarto</label>
  <input type="text" id="quarto" name="quarto" placeholder="Ex.: 12">
  <label for="observacao">Observação da camareira</label>
  <input type="text" id="observacao" name="observacao" placeholder="Ex.: reposição completa">
  <button type="button" id="btn-marcar" aria-label="Marcar quarto como limpo">Quarto limpo</button>
</form>
<ul id="lista-tarefas"></ul>
<script>
var chave = 'checklist-governanca-ceu-pinhal';
var tarefas = JSON.parse(localStorage.getItem(chave) || '[]');

function salvar() {
  localStorage.setItem(chave, JSON.stringify(tarefas));
}

function render() {
  var lista = document.getElementById('lista-tarefas');
  lista.innerHTML = '';
  var limpos = 0;
  tarefas.forEach(function (tarefa, i) {
    var li = document.createElement('li');
    var caixa = document.createElement('input');
    caixa.type = 'checkbox';
    caixa.checked = tarefa.feito;
    caixa.id = 'tarefa-' + i;
    caixa.addEventListener('change', function () {
      tarefas[i].feito = caixa.checked;
      salvar();
      render();
    });
    var rotulo = document.createElement('label');
    rotulo.htmlFor = 'tarefa-' + i;
    rotulo.textContent = tarefa.quarto + (tarefa.observacao ? ' — ' + tarefa.observacao : '');
    li.appendChild(caixa);
    li.appendChild(rotulo);
    if (tarefa.feito) limpos++;
    lista.appendChild(li);
  });
  document.getElementById('progresso').textContent = 'Conferências registradas: ' + limpos + ' de ' + tarefas.length;
}

document.getElementById('btn-marcar').addEventListener('click', function () {
  var quarto = document.getElementById('quarto').value.trim();
  if (!quarto) return;
  tarefas.push({ quarto: quarto, observacao: document.getElementById('observacao').value.trim(), feito: true });
  salvar();
  render();
});

render();
</script>
</body>
</html>
`;

const goodManifest = `{
  "name": "Checklist de Governança — Pousada Céu de Pinhal",
  "short_name": "Checklist",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#f7f5ef",
  "theme_color": "#1c2b3a",
  "lang": "pt-BR",
  "icons": []
}
`;

const goodSw = `const CACHE_NAME = 'checklist-governanca-v1';
const PRECACHE_ASSETS = ['./index.html', './manifest.webmanifest'];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function (evento) {
  evento.respondWith(
    caches.match(evento.request).then(function (resposta) {
      return resposta || fetch(evento.request);
    })
  );
});
`;

put('mock-good', 'T11', 'escopo.md', escopo(ESCOPO_BOM));
put('mock-good', 'T11', 'index.html', goodIndex);
put('mock-good', 'T11', 'manifest.webmanifest', goodManifest);
put('mock-good', 'T11', 'sw.js', goodSw);

// ---------- T11 mock-bad ----------
const badIndex = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Housekeeping Checklist</title>
</head>
<body>
<h1>Housekeeping Checklist</h1>
<form id="task-form">
  <input type="text" id="room" placeholder="Room number">
  <input type="text" id="guest" placeholder="Guest name">
  <button type="button" id="add-btn">+</button>
</form>
<ul id="task-list"></ul>
<script>
var tasks = [];
function render() {
  var list = document.getElementById('task-list');
  var html = '';
  for (var i = 0; i < tasks.length; i++) {
    html += '<li>' + tasks[i].guest + '</li>';
  }
  list.innerHTML = html;
}
render();
</script>
</body>
</html>
`;

const badSw = `const CACHE_NAME = 'checklist-v1';

self.addEventListener('install', function (evento) {
  self.skipWaiting();
});
`;

put('mock-bad', 'T11', 'escopo.md', escopo('# Escopo MVP — checklist da pousada\n\nVersão resumida do escopo para comparação entre entregas.\n'));
put('mock-bad', 'T11', 'index.html', badIndex);
put('mock-bad', 'T11', 'sw.js', badSw);

// ---------- T11 mock-flaky ----------
const flakySw = `const CACHE_NAME = 'checklist-governanca-v1';
const PRECACHE_ASSETS = ['./index.html', './manifest.webmanifest'];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});
`;

const flakyIndex = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Checklist de Governança</title>
</head>
<body>
<h1>Checklist de Governança</h1>
<form id="form-tarefa">
  <label for="quarto">Número do quarto</label>
  <input type="text" id="quarto" name="quarto" placeholder="Ex.: 12">
  <label for="observacao">Observação da camareira</label>
  <input type="text" id="observacao" name="observacao" placeholder="Ex.: reposição completa">
  <button type="button" id="btn-marcar" aria-label="Marcar quarto como limpo">Quarto limpo</button>
</form>
<ul id="lista-tarefas"></ul>
<script>
var tarefas = [];
function render() {
  var lista = document.getElementById('lista-tarefas');
  lista.innerHTML = '';
  tarefas.forEach(function (tarefa, i) {
    var li = document.createElement('li');
    var rotulo = document.createElement('label');
    rotulo.textContent = tarefa.quarto;
    li.appendChild(rotulo);
    lista.appendChild(li);
  });
}
render();
</script>
</body>
</html>
`;

put('mock-flaky', 'T11', 'escopo.md', escopo(ESCOPO_BOM));
put('mock-flaky', 'T11', 'index.html', flakyIndex);
put('mock-flaky', 'T11', 'manifest.webmanifest', goodManifest);
put('mock-flaky', 'T11', 'sw.js', flakySw);

// ---------- T12 (revisão do PWA defeituoso) ----------
const flawedPath = join(repoPath(), 'cases', 'shared', 'T12-flawed');
const flawedIndex = readFileSync(join(flawedPath, 'index.html'), 'utf8');
const flawedManifest = readFileSync(join(flawedPath, 'manifest.webmanifest'), 'utf8');
const flawedSw = readFileSync(join(flawedPath, 'sw.js'), 'utf8');

const t12IndexCorrigido = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Checklist de Governança</title>
<style>
body { font-family: sans-serif; background: #f7f5ef; color: #1c2b3a; margin: 0; padding: 16px; }
button { min-height: 44px; }
</style>
</head>
<body>
<h1>Checklist de Governança</h1>
<p id="progresso">Conferências registradas: 0 de 0</p>
<form id="form-tarefa">
  <label for="quarto">Número do quarto</label>
  <input type="text" id="quarto" name="quarto" placeholder="Ex.: 12">
  <label for="hospede">Nome do hóspede</label>
  <input type="text" id="hospede" name="hospede" placeholder="Ex.: Dona Marta">
  <button type="button" id="btn-marcar" aria-label="Marcar quarto como limpo">Quarto limpo</button>
</form>
<ul id="task-list"></ul>
<script>
var chave = 'checklist-governanca-ceu-pinhal';
var tarefas = JSON.parse(localStorage.getItem(chave) || '[]');

function salvar() {
  localStorage.setItem(chave, JSON.stringify(tarefas));
}

function render() {
  var lista = document.getElementById('task-list');
  lista.innerHTML = '';
  var limpos = 0;
  tarefas.forEach(function (tarefa, i) {
    var li = document.createElement('li');
    var caixa = document.createElement('input');
    caixa.type = 'checkbox';
    caixa.id = 'tarefa-' + i;
    caixa.checked = tarefa.feito;
    caixa.addEventListener('change', function () {
      tarefas[i].feito = caixa.checked;
      salvar();
      render();
    });
    var rotulo = document.createElement('label');
    rotulo.htmlFor = 'tarefa-' + i;
    rotulo.textContent = 'Quarto ' + tarefa.quarto + (tarefa.hospede ? ' — ' + tarefa.hospede : '');
    li.appendChild(caixa);
    li.appendChild(rotulo);
    if (tarefa.feito) limpos++;
    lista.appendChild(li);
  });
  document.getElementById('progresso').textContent = 'Conferências registradas: ' + limpos + ' de ' + tarefas.length;
}

document.getElementById('btn-marcar').addEventListener('click', function () {
  var quarto = document.getElementById('quarto').value.trim();
  if (!quarto) return;
  tarefas.push({ quarto: quarto, hospede: document.getElementById('hospede').value.trim(), feito: true });
  salvar();
  render();
});

render();
</script>
</body>
</html>
`;

const t12ManifestCorrigido = `{
  "name": "Checklist de Governança — Pousada",
  "short_name": "Checklist",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#f7f5ef",
  "theme_color": "#1c2b3a",
  "lang": "pt-BR",
  "icons": []
}
`;

const t12SwCorrigido = `const CACHE_NAME = 'checklist-governanca-v1';
const PRECACHE_ASSETS = ['./index.html', './manifest.webmanifest'];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function (evento) {
  evento.respondWith(
    caches.match(evento.request).then(function (resposta) {
      return resposta || fetch(evento.request);
    })
  );
});
`;

const revisaoBoa = `# Revisão da entrega do freelancer — checklist de governança

## Revisão

1. **Segurança — injeção de conteúdo (grave):** o nome do hóspede entra direto no html da página pelo caminho de concatenação com incremento, o que permite injeção de script. Reprodução: cadastrar hóspede com texto entre tag aberta e fechada e recarregar a página. Correção: zerar a lista antes de redesenhar e montar os itens com criação de elemento e conteúdo textual.
2. **Funcional — nada é salvo (grave):** o estado vive só na memória; ao fechar o app tudo se perde. Reprodução: cadastrar quarto, fechar e reabrir. Correção: gravar a lista no aparelho a cada alteração e ler de lá ao abrir.
3. **Funcional — botão sem ação (grave):** o botão de adicionar não tem escuta de clique. Reprodução: preencher e tocar em adicionar, nada acontece. Correção: registrar escuta de clique no botão.
4. **Funcional — marcação sem efeito:** o estado de feito de cada item nunca é lido nem alterado; a caixa de marcar é decorativa. Reprodução: marcar um item e recarregar. Correção: ler e gravar o estado da caixa a cada mudança.
5. **Offline/PWA — sem funcionamento offline:** o service worker não tem escuta de requisições, então nada é servido sem internet. Reprodução: abrir em modo avião após o primeiro carregamento. Correção: adicionar escuta de fetch com resposta do cache.
6. **Offline/PWA — nada pré-cacheado:** o service worker não tem lista de assets; a instalação não guarda nada. Correção: definir lista de pré-cache cobrindo a página e o manifesto.
7. **Offline/PWA — manifesto inválido:** faltam start_url e display no manifesto web. Reprodução: ferramenta de auditoria de PWA acusa manifesto incompleto. Correção: completar os campos fora do escopo do app principal.
8. **Acessibilidade — campos sem rótulo:** os dois campos do formulário não têm label associado; leitor de tela anuncia campo vazio. Correção: associar label a cada campo.
9. **Acessibilidade — botão sem nome acessível:** o botão de adicionar é só um símbolo, sem texto nem rótulo acessível. Correção: incluir rótulo com nome da ação.
10. **Acessibilidade/legibilidade — contraste ilegível:** texto cinza claro sobre fundo claro, abaixo do mínimo exigido. Reprodução: ler a lista sob luz do dia. Correção: cor de texto escura com contraste suficiente.
11. **Padrão/idioma — app em inglês:** lang em inglês e microcopy em inglês para equipe brasileira. Correção: idioma da página e todos os textos em português do Brasil.
12. **Funcional — lista duplicada a cada redesenho:** a lista nunca é zerada antes de redesenhar, então itens se acumulam. Reprodução: cadastrar dois quartos seguidos. Correção: zerar a lista no início do redesenho e recolocar os itens atuais.

## Correções

Todos os 12 defeitos acima foram aplicados nos três arquivos corrigidos abaixo.

\`index.html\`

\`\`\`html
${t12IndexCorrigido}\`\`\`

\`manifest.webmanifest\`

\`\`\`webmanifest
${t12ManifestCorrigido}\`\`\`

\`sw.js\`

\`\`\`javascript
${t12SwCorrigido}\`\`\`
`;

const revisaoRasgada = `# Revisão rápida — checklist recebido

## Revisão

1. **Idioma:** a página está em inglês para uma equipe brasileira; trocar o idioma da página.
2. **Contraste:** o texto da lista está claro demais; escurecer o texto.

## Correções

Devolvo os arquivos como recebi; os demais pontos dependem de decisão do cliente.

\`index.html\`

\`\`\`html
${flawedIndex}\`\`\`

\`manifest.webmanifest\`

\`\`\`webmanifest
${flawedManifest}\`\`\`

\`sw.js\`

\`\`\`javascript
${flawedSw}\`\`\`
`;

// flaky: corrige 6 de 12 (L1, A1, A3, S1, F3, O2)
const flakyHtmlFinal = [
  '<!DOCTYPE html>',
  '<html lang="pt-BR">',
  '<head>',
  '<meta charset="utf-8">',
  '<title>Checklist de Governança</title>',
  '</head>',
  '<body>',
  '<h1>Checklist de Governança</h1>',
  '<form id="task-form">',
  '  <label for="room">Quarto</label>',
  '  <input type="text" id="room" placeholder="Ex.: 12">',
  '  <label for="guest">Hóspede</label>',
  '  <input type="text" id="guest" placeholder="Ex.: Dona Marta">',
  '  <button type="button" id="add-btn">Adicionar</button>',
  '</form>',
  '<ul id="task-list"></ul>',
  '<script>',
  'var tasks = [];',
  'function render() {',
  "  var list = document.getElementById('task-list');",
  "  document.getElementById('add-btn').addEventListener('click', function () {});",
  '  var html = "";',
  '  for (var i = 0; i < tasks.length; i++) {',
  "    if (tasks[i].done) done++;",
  "    html += '<li>' + tasks[i].guest + '</li>';",
  '  }',
  '  list.innerHTML = html;',
  '}',
  'render();',
  '</script>',
  '</body>',
  '</html>',
  '',
].join('\n');

const flakySwFix = flawedSw + `\nself.addEventListener('fetch', function (evento) {\n  evento.respondWith(caches.match(evento.request));\n});\nconst PRECACHE_ASSETS = [];\n`;
const flakyManifestFix = flawedManifest;

const revisaoFlaky = `# Revisão da entrega — checklist de governança

## Revisão

1. **Idioma:** a página está em inglês para equipe brasileira; corrigido para português do Brasil.
2. **Contraste:** texto claro demais na lista; cor de texto escura aplicada.
3. **Acessibilidade:** campos do formulário sem rótulo; labels adicionados.
4. **Funcional:** botão de adicionar sem escuta de clique; escuta registrada.
5. **Offline:** service worker sem escuta de requisições; escuta de fetch adicionada.
6. **Offline:** service worker sem lista de cache; lista criada (ainda incompleta).
7. **Segurança:** montagem de html por concatenação com incremento revisada; substituída por montagem de bloco único (ponto ainda a validar).
8. **PWA:** manifesto ainda sem endereço inicial e modo de exibição; pendente.

## Correções

\`index.html\`

\`\`\`html
${flakyHtmlFinal}\`\`\`

\`manifest.webmanifest\`

\`\`\`webmanifest
${flakyManifestFix}\`\`\`

\`sw.js\`

\`\`\`javascript
${flakySwFix}\`\`\`
`;

put('mock-good', 'T12', 'revisao.md', revisaoBoa);
put('mock-bad', 'T12', 'revisao.md', revisaoRasgada);
put('mock-flaky', 'T12', 'revisao.md', revisaoFlaky);

console.log('part 4 fixtures written (T11, T12)');
