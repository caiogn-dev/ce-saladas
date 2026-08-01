/**
 * Descrições de produto vêm do painel como texto puro com \n (parágrafos,
 * listas com "-"/"•" e rótulos tipo "Modo de preparo: ..."). O cardápio
 * renderizava tudo num <p> único — as quebras colapsavam num blocão.
 *
 * parseDescriptionBlocks quebra o texto em blocos estruturados:
 *   { type: 'p', label?: 'Modo de preparo', text: '...' }
 *   { type: 'ul', items: ['...', '...'] }
 */

// "Rótulo: resto" — rótulo curto no início da linha (ex.: "Serve: 2 pessoas",
// "Modo de preparo: ..."). Limite de 32 chars evita capturar frases com ":".
const LABEL_RE = /^([A-Za-zÀ-ÿ0-9][^:\n]{1,31}):\s*(.*)$/;

export function parseDescriptionBlocks(text) {
  const blocks = [];
  let list = null;

  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      list = null;
      continue;
    }
    if (/^[-•*]\s+/.test(line)) {
      if (!list) {
        list = [];
        blocks.push({ type: 'ul', items: list });
      }
      list.push(line.replace(/^[-•*]\s+/, ''));
      continue;
    }
    list = null;
    const labelMatch = line.match(LABEL_RE);
    if (labelMatch) {
      blocks.push({ type: 'p', label: labelMatch[1], text: labelMatch[2] });
    } else {
      blocks.push({ type: 'p', text: line });
    }
  }
  return blocks;
}

/** Primeiro parágrafo "limpo" — usado no card, que só tem 2-3 linhas de clamp. */
export function descriptionPreview(text) {
  const first = String(text || '').split('\n').map((l) => l.trim()).find(Boolean);
  return first || '';
}
