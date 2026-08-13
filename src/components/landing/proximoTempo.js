// Quanto da distância até o alvo é percorrido por frame. Mais alto = mais
// responsivo e mais serrilhado; mais baixo = mais macio e mais atrasado.
export const SUAVIZACAO = 0.15;

const EPSILON = 0.001;

/**
 * Um passo da interpolação do tempo do vídeo.
 *
 * @param {object} p
 * @param {number} p.atual  currentTime aplicado no frame anterior
 * @param {number} p.alvo   tempo que o scroll está pedindo
 * @param {boolean} p.seeking video.seeking
 * @param {number} p.duracao video.duration
 * @param {number} [p.fps]  quadros por segundo do ARQUIVO. Quando informado, o
 *   resultado é encaixado na grade de quadros e passos que cairiam no mesmo
 *   quadro já exibido são descartados.
 * @returns {number|null} o novo currentTime, ou null se este frame deve ser PULADO.
 */
export function proximoTempo({ atual, alvo, seeking, duracao, fps }) {
  // Guarda: empilhar seeks é o que faz o vídeo engasgar. Pular é melhor —
  // o próximo frame já corrige a posição.
  if (seeking) return null;
  if (!Number.isFinite(duracao) || duracao <= 0) return null;

  const destino = Math.min(Math.max(alvo, 0), duracao);
  const passo = atual + (destino - atual) * SUAVIZACAO;
  const bruto = Math.abs(destino - passo) < EPSILON
    ? destino
    : Math.min(Math.max(passo, 0), duracao);

  if (!Number.isFinite(fps) || fps <= 0) return bruto;

  // Encaixe na grade de quadros. O decodificador só tem esses pontos pra
  // mostrar; pedir qualquer coisa entre eles gera um seek que termina no mesmo
  // pixel — custo sem imagem nova.
  const quadroAtual = Math.round(atual * fps);
  const quadroDestino = Math.round(destino * fps);

  // Já estamos no quadro que o scroll pede: nada a fazer.
  if (quadroAtual === quadroDestino) return null;

  const direcao = quadroDestino > quadroAtual ? 1 : -1;
  let quadro = Math.round(bruto * fps);

  // A suavização pode render menos de um quadro por passo perto do alvo. Sem
  // este empurrão o vídeo estacionaria a alguns quadros do fim, para sempre.
  if (quadro === quadroAtual) quadro = quadroAtual + direcao;

  // Nunca passar do destino ao dar o empurrão.
  quadro = direcao > 0
    ? Math.min(quadro, quadroDestino)
    : Math.max(quadro, quadroDestino);

  return Math.min(Math.max(quadro / fps, 0), duracao);
}
