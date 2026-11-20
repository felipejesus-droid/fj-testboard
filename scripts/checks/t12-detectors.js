import YAML from 'yaml';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath } from '../lib/util.js';
import { pwaStructural } from './pwaChecks.js';

function loadDefects() {
  const p = join(repoPath(), 'private', 'answer-keys', 'T12.yaml');
  if (!existsSync(p)) return null;
  return YAML.parse(readFileSync(p, 'utf8')).defects;
}

export function extractFencedFiles(text) {
  const files = {};
  const markers = [
    { name: 'index.html', rx: /`?index\.html`?\s*\n+```[^\n]*\n([\s\S]*?)```/i },
    { name: 'manifest.webmanifest', rx: /`?manifest\.webmanifest`?\s*\n+```[^\n]*\n([\s\S]*?)```/i },
    { name: 'sw.js', rx: /`?sw\.js`?\s*\n+```[^\n]*\n([\s\S]*?)```/i },
  ];
  for (const m of markers) {
    const found = text.match(m.rx);
    if (found) files[m.name] = found[1];
  }
  return files;
}

export function t12Detectors(input) {
  let html = input.files['index.html'] || '';
  let sw = input.files['sw.js'] || '';
  let manifestRaw = input.files['manifest.webmanifest'] || '';
  if (!html && !sw && !manifestRaw) {
    const extracted = extractFencedFiles(input.text.join('\n'));
    html = extracted['index.html'] || '';
    sw = extracted['sw.js'] || '';
    manifestRaw = extracted['manifest.webmanifest'] || '';
  }
  const defects = loadDefects();
  if (!defects) {
    const res = pwaStructural(input);
    return { pass: res.pass, detail: `modo reduzido (gabarito privado ausente): ${res.detail}` };
  }
  const stillBroken = [];
  for (const d of defects) {
    let broken = false;
    const target = d.detector.file === 'sw.js' ? sw : d.detector.file === 'manifest.webmanifest' ? manifestRaw : html;
    switch (d.detector.kind) {
      case 'text_present_in_file':
        broken = target.includes(d.detector.pattern);
        break;
      case 'regex_present':
        broken = new RegExp(d.detector.pattern, 'i').test(target);
        break;
      case 'regex_absent':
        broken = !new RegExp(d.detector.pattern, 'i').test(target);
        break;
      case 'json_field_present': {
        let m = null;
        try { m = JSON.parse(manifestRaw); } catch { broken = true; break; }
        broken = !m[d.detector.field];
        break;
      }
      default:
        broken = true;
    }
    if (broken) stillBroken.push(d.id);
  }
  const fixed = 12 - stillBroken.length;
  return {
    pass: fixed >= 9,
    detail: `${fixed}/12 defeitos corrigidos${stillBroken.length ? '; permanecem: ' + stillBroken.join(', ') : ''}`,
  };
}

export function t12NoRegressions(input, ctx) {
  return pwaStructural(input, ctx);
}
