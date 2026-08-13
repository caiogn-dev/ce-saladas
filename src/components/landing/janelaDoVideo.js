/**
 * Mapeia o progresso do palco (0..1) para o tempo do vídeo.
 *
 * Não é 1:1 de propósito. Com mapeamento direto o vídeo começa a correr no
 * instante em que a seção encosta no topo — antes de o palco estar realmente
 * enquadrado — e chega ao último quadro exatamente quando a seção se solta,
 * então o fim passa correndo e nunca é visto parado. As duas franjas abaixo
 * resolvem isso: uma faixa de entrada e uma de saída onde o vídeo fica
 * ancorado no primeiro e no último quadro.
 */
export const ENTRADA = 0.08;
export const SAIDA = 0.10;

/**
 * @param {object} p
 * @param {number} p.progresso 0..1 vindo do ScrollTrigger
 * @param {number} p.duracao duração do vídeo em segundos
 * @param {number} [p.entrada] fração inicial parada no primeiro quadro
 * @param {number} [p.saida] fração final parada no último quadro
 * @returns {number} tempo em segundos, sempre dentro de [0, duracao]
 */
export function tempoDoProgresso({ progresso, duracao, entrada = ENTRADA, saida = SAIDA }) {
  if (!Number.isFinite(duracao) || duracao <= 0) return 0;
  if (!Number.isFinite(progresso)) return 0;

  const util = 1 - entrada - saida;
  // Franjas absurdas não podem zerar o divisor e gerar Infinity.
  if (util <= 0) return Math.min(Math.max(progresso, 0), 1) * duracao;

  const normalizado = (progresso - entrada) / util;
  return Math.min(Math.max(normalizado, 0), 1) * duracao;
}
