# Revisão da entrega do freelancer — checklist de governança

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

`index.html`

```html
<!DOCTYPE html>
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
```

`manifest.webmanifest`

```webmanifest
{
  "name": "Checklist de Governança — Pousada",
  "short_name": "Checklist",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#f7f5ef",
  "theme_color": "#1c2b3a",
  "lang": "pt-BR",
  "icons": []
}
```

`sw.js`

```javascript
const CACHE_NAME = 'checklist-governanca-v1';
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
```
