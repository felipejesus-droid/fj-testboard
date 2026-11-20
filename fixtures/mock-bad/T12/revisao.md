# Revisão rápida — checklist recebido

## Revisão

1. **Idioma:** a página está em inglês para uma equipe brasileira; trocar o idioma da página.
2. **Contraste:** o texto da lista está claro demais; escurecer o texto.

## Correções

Devolvo os arquivos como recebi; os demais pontos dependem de decisão do cliente.

`index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Housekeeping Checklist</title>
</head>
<body>
<h1>Housekeeping Checklist</h1>
<p id="progress">Completed: 0/0</p>
<form id="task-form">
  <input type="text" id="room" placeholder="Room number">
  <input type="text" id="guest" placeholder="Guest name">
  <button type="button" id="add-btn"><span>+</span></button>
</form>
<ul id="task-list"></ul>
<script>
var tasks = [];
function render() {
  var list = document.getElementById('task-list');
  var done = 0;
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].done) done++;
    list.innerHTML += '<li style="color:#cccccc">' + tasks[i].guest + ' - Room ' + tasks[i].room +
      ' <input type="checkbox" data-i="' + i + '"' + (done ? '' : '') + '></li>';
  }
  document.getElementById('progress').textContent = 'Completed: ' + done + '/' + tasks.length;
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
```
