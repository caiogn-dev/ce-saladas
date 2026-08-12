/**
 * Seek quadro a quadro é caro e, em Safari iOS, inconsistente. Esta função
 * concentra toda a decisão de QUANDO vale a pena — e quando não vale.
 */
export const MODOS = Object.freeze({
  SYNC: 'sync',     // scroll dirige o frame
  LOOP: 'loop',     // autoplay muted loop, sem seek
  POSTER: 'poster', // imagem estática
});

export const LARGURA_MINIMA_SYNC = 768;

const CONEXOES_LENTAS = new Set(['slow-2g', '2g', '3g']);

/**
 * @param {object} ctx
 * @param {number} ctx.largura largura do viewport em px
 * @param {boolean} ctx.reducedMotion resultado de prefers-reduced-motion
 * @param {object|null} ctx.conexao navigator.connection, ou null
 * @returns {string} um dos MODOS
 */
export function modoDeVideo({ largura, reducedMotion, conexao }) {
  // Quem pediu menos movimento não recebe vídeo nenhum.
  if (reducedMotion) return MODOS.POSTER;

  // Largura desconhecida é tratada como mobile: o modo barato é o padrão seguro.
  if (!Number.isFinite(largura) || largura < LARGURA_MINIMA_SYNC) return MODOS.LOOP;

  if (conexao?.saveData) return MODOS.LOOP;
  if (CONEXOES_LENTAS.has(conexao?.effectiveType)) return MODOS.LOOP;

  return MODOS.SYNC;
}
