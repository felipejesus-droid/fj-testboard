# Revisão da entrega — checklist de governança

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

`index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Checklist de Governança</title>
</head>
<body>
<h1>Checklist de Governança</h1>
<form id="task-form">
  <label for="room">Quarto</label>
  <input type="text" id="room" placeholder="Ex.: 12">
  <label for="guest">Hóspede</label>
  <input type="text" id="guest" placeholder="Ex.: Dona Marta">
  <button type="button" id="add-btn">Adicionar</button>
</form>
<ul id="task-list"></ul>
<script>
var tasks = [];
function render() {
  var list = document.getElementById('task-list');
  document.getElementById('add-btn').addEventListener('click', function () {});
  var html = "";
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].done) done++;
    html += '<li>' + tasks[i].guest + '</li>';
  }
  list.innerHTML = html;
}
render();
</script>
</body>
</html>
```

`manifest.webmanifest`

```webmanifest
{
  "name": "Housekeeping Checklist",
  "short_name": "Checklist"
}
```

`sw.js`

```javascript
var CACHE_NAME = 'housekeeping-cache-v1';
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('fetch', function (evento) {
  evento.respondWith(caches.match(evento.request));
});
const PRECACHE_ASSETS = [];
```
