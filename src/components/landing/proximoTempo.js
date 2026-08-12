// Quanto da distância até o alvo é percorrido por frame. Mais alto = mais
// responsivo e mais serrilhado; mais baixo = mais macio e mais atrasado.
export const SUAVIZACAO = 0.15;

const EPSILON = 0.001;

/**
 * Um passo da interpolação do tempo do vídeo.
 *
 * @returns {number|null} o novo currentTime, ou null se este frame deve ser PULADO.
 */
export function proximoTempo({ atual, alvo, seeking, duracao }) {
  // Guarda: empilhar seeks é o que faz o vídeo engasgar. Pular é melhor —
  // o próximo frame já corrige a posição.
  if (seeking) return null;
  if (!Number.isFinite(duracao) || duracao <= 0) return null;

  const destino = Math.min(Math.max(alvo, 0), duracao);
  const passo = atual + (destino - atual) * SUAVIZACAO;

  if (Math.abs(destino - passo) < EPSILON) return destino;
  return Math.min(Math.max(passo, 0), duracao);
}
