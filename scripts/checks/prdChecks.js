export function t03Acceptance(input) {
  const joined = input.text.join('\n');
  const reqs = (joined.match(/^#+\s*R\d+\.|^\s*-?\s*R\d+\s*[—:-]/gm) || []).length;
  const cas = (joined.match(/CA\s?\d+|critério de aceitação/gi) || []).length;
  const pass = reqs >= 3 && cas >= reqs;
  return { pass, detail: `${reqs} requisito(s), ${cas} menções a critérios de aceitação (precisa CA >= R)` };
}
