/**
 * Seek quadro a quadro é caro e, em Safari iOS, inconsistente. Esta função
 * concentra toda a decisão de QUANDO vale a pena — e quando não vale.
 */
export const MODOS = Object.freeze({
  SYNC: 'sync',     // scroll dirige o frame
  LOOP: 'loop',     // autoplay muted loop, sem seek
  POSTER: 'poster', // imagem estática
});

const CONEXOES_LENTAS = new Set(['slow-2g', '2g', '3g']);

const FORCADOS = new Set(Object.values(MODOS));

/**
 * @param {object} ctx
 * @param {number} ctx.largura largura do viewport em px
 * @param {boolean} ctx.reducedMotion resultado de prefers-reduced-motion
 * @param {object|null} ctx.conexao navigator.connection, ou null
 * @param {string} [ctx.forcado] modo pedido na URL (?palco=sync|loop|poster)
 * @returns {string} um dos MODOS
 */
export function modoDeVideo({ largura, reducedMotion, conexao, forcado }) {
  // Escape hatch de teste: permite ver os três modos sem simular hardware.
  // Vem antes de tudo de propósito — inclusive de reduced motion.
  if (forcado && FORCADOS.has(forcado)) return forcado;

  // Quem pediu menos movimento não recebe vídeo nenhum.
  if (reducedMotion) return MODOS.POSTER;

  // Antes o mobile caía em LOOP por largura. Mas o arquivo é RETRATO (9:16):
  // o celular é onde ele melhor se encaixa, e era justamente lá que o vídeo
  // parecia "fora de sincronia" — não estava sincronizado, era autoplay solto.
  // Quem decide agora é a rede, não o tamanho da tela.
  if (conexao?.saveData) return MODOS.LOOP;
  if (CONEXOES_LENTAS.has(conexao?.effectiveType)) return MODOS.LOOP;

  // Largura desconhecida não é mais motivo pra degradar: o modo sync não
  // depende de largura nenhuma.
  return MODOS.SYNC;
}

/**
 * Lê o override da querystring. Isolado pra ser testável sem `window`.
 * @param {string} busca location.search
 */
export function modoForcadoDaUrl(busca) {
  try {
    const v = new URLSearchParams(busca).get('palco');
    return v && FORCADOS.has(v) ? v : null;
  } catch {
    return null;
  }
}
