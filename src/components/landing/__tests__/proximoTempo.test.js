import { describe, it, expect } from 'vitest';
import { proximoTempo, SUAVIZACAO } from '../proximoTempo';

const base = { atual: 0, alvo: 10, seeking: false, duracao: 10 };

describe('proximoTempo', () => {
  it('pula o frame quando ainda há um seek em andamento', () => {
    expect(proximoTempo({ ...base, seeking: true })).toBeNull();
  });

  it('pula o frame enquanto a duração é desconhecida', () => {
    expect(proximoTempo({ ...base, duracao: NaN })).toBeNull();
    expect(proximoTempo({ ...base, duracao: 0 })).toBeNull();
    expect(proximoTempo({ ...base, duracao: Infinity })).toBeNull();
  });

  it('caminha em direção ao alvo pela fração de suavização', () => {
    expect(proximoTempo(base)).toBeCloseTo(10 * SUAVIZACAO, 5);
  });

  it('gruda no alvo quando a diferença fica desprezível', () => {
    expect(proximoTempo({ ...base, atual: 9.9999, alvo: 10 })).toBe(10);
  });

  it('funciona também descendo', () => {
    const t = proximoTempo({ ...base, atual: 10, alvo: 0 });
    expect(t).toBeLessThan(10);
    expect(t).toBeGreaterThan(0);
  });

  it('nunca ultrapassa a duração nem fica negativo', () => {
    expect(proximoTempo({ atual: 0, alvo: 999, seeking: false, duracao: 10 })).toBeLessThanOrEqual(10);
    expect(proximoTempo({ atual: 0, alvo: -50, seeking: false, duracao: 10 })).toBeGreaterThanOrEqual(0);
  });
});
