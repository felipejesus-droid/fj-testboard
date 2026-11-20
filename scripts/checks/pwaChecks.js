import { extractFencedFiles } from './t12-detectors.js';

export function pwaStructural(input) {
  let files = input.files;
  if (!files['index.html'] && !files['manifest.webmanifest'] && !files['sw.js']) {
    files = { ...files, ...extractFencedFiles(input.text.join('\n')) };
  }
  const problems = [];
  const html = files['index.html'];
  const manifestRaw = files['manifest.webmanifest'];
  const sw = files['sw.js'];
  if (!html) problems.push('falta index.html');
  if (!manifestRaw) problems.push('falta manifest.webmanifest');
  if (!sw) problems.push('falta sw.js');
  if (problems.length) return { pass: false, detail: problems.join('; ') };

  if (!/<html[^>]*lang=["']pt-BR["']/i.test(html)) problems.push('html sem lang="pt-BR"');
  if (!/<meta[^>]*name=["']viewport["']/i.test(html)) problems.push('sem meta viewport');
  if (/src=["']https?:\/\/|href=["']https?:\/\/(?!\/)/i.test(html)) problems.push('dependência externa no HTML');
  const inputs = (html.match(/<input\b/gi) || []).length;
  const labels = (html.match(/<label\b/gi) || []).length;
  if (inputs > 0 && labels < inputs) problems.push(`inputs (${inputs}) sem label correspondente (${labels})`);

  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (e) {
    problems.push('manifest.webmanifest não é JSON válido');
    return { pass: false, detail: problems.join('; ') };
  }
  for (const field of ['name', 'short_name', 'start_url', 'display']) {
    if (!manifest[field]) problems.push(`manifest sem "${field}"`);
  }
  if (manifest.display !== 'standalone') problems.push('manifest display deve ser "standalone"');

  if (!/addEventListener\(["']install["']/.test(sw)) problems.push('sw.js sem handler de install');
  if (!/addEventListener\(["']fetch["']/.test(sw)) problems.push('sw.js sem handler de fetch');
  const cacheMatch = sw.match(/['"]([^'"]*cache[^'"]*)['"]/gi) || [];
  const cacheListMatch = sw.match(/(?:cacheAssets|PRECACHE|ASSETS|urlsToCache)\s*=\s*\[([\s\S]*?)\]/i);
  if (!cacheListMatch) {
    problems.push('sw.js sem lista de cache');
  } else {
    for (const asset of ['index.html', 'manifest.webmanifest']) {
      if (!cacheListMatch[1].includes(asset)) problems.push(`cache não cobre ${asset}`);
    }
  }
  return { pass: problems.length === 0, detail: problems.length ? problems.join('; ') : 'estrutura PWA íntegra' };
}
