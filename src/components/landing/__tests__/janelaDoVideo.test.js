import { describe, it, expect } from 'vitest';
import { tempoDoProgresso, ENTRADA, SAIDA } from '../janelaDoVideo';

const base = { duracao: 10 };

describe('tempoDoProgresso', () => {
  it('segura o primeiro quadro durante toda a faixa de entrada', () => {
    expect(tempoDoProgresso({ ...base, progresso: 0 })).toBe(0);
    expect(tempoDoProgresso({ ...base, progresso: ENTRADA / 2 })).toBe(0);
    expect(tempoDoProgresso({ ...base, progresso: ENTRADA })).toBe(0);
  });

  it('segura o último quadro durante toda a faixa de saída', () => {
    expect(tempoDoProgresso({ ...base, progresso: 1 - SAIDA })).toBeCloseTo(10, 6);
    expect(tempoDoProgresso({ ...base, progresso: 1 })).toBeCloseTo(10, 6);
  });

  it('avança de forma monótona no meio', () => {
    let anterior = -1;
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const t = tempoDoProgresso({ ...base, progresso: p });
      expect(t).toBeGreaterThanOrEqual(anterior);
      anterior = t;
    }
  });

  it('o meio do palco cai perto do meio do vídeo', () => {
    // Não é exatamente 5s: as franjas são assimétricas (a de saída é maior,
    // porque segurar o prato pronto vale mais que segurar o primeiro quadro).
    const t = tempoDoProgresso({ ...base, progresso: 0.5 });
    expect(t).toBeGreaterThan(4.7);
    expect(t).toBeLessThan(5.5);
  });

  it('nunca sai de [0, duracao], nem com progresso fora da faixa', () => {
    expect(tempoDoProgresso({ ...base, progresso: -3 })).toBe(0);
    expect(tempoDoProgresso({ ...base, progresso: 9 })).toBe(10);
  });

  it('duração inválida devolve 0 em vez de NaN', () => {
    expect(tempoDoProgresso({ duracao: NaN, progresso: 0.5 })).toBe(0);
    expect(tempoDoProgresso({ duracao: 0, progresso: 0.5 })).toBe(0);
  });

  it('franjas que somam 1 ou mais não geram Infinity', () => {
    const t = tempoDoProgresso({ ...base, progresso: 0.5, entrada: 0.7, saida: 0.7 });
    expect(Number.isFinite(t)).toBe(true);
  });
});
