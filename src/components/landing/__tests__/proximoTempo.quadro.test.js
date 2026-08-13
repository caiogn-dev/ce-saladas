import { describe, it, expect } from 'vitest';
import { proximoTempo } from '../proximoTempo';

// Com `fps` informado, o tempo é encaixado na grade de quadros do arquivo.
//
// Por que isso importa: sem encaixe, o laço escrevia `currentTime` a CADA frame
// de rAF (60x/s) com deltas menores que a duração de UM quadro do vídeo. O
// decodificador recebia dezenas de seeks que não mudavam nada na tela — é o que
// fazia a página engasgar e, no fim, travar o renderer.
const base = { atual: 0, alvo: 10, seeking: false, duracao: 10, fps: 24 };

describe('proximoTempo com grade de quadros', () => {
  it('devolve um tempo que cai exatamente sobre um quadro', () => {
    const t = proximoTempo(base);
    expect(Number.isInteger(Math.round(t * 24))).toBe(true);
    expect(t).toBeCloseTo(Math.round(t * 24) / 24, 10);
  });

  it('pula o frame quando o passo cairia no MESMO quadro já exibido', () => {
    // Um alvo a meio quadro de distância não muda nada na tela.
    expect(proximoTempo({ ...base, atual: 5, alvo: 5 + 1 / 24 / 4 })).toBeNull();
  });

  it('não pula quando o passo alcança o quadro seguinte', () => {
    // Suavização de 0.15: precisa de uma distância grande o bastante pra que
    // 15% dela já valha um quadro inteiro.
    expect(proximoTempo({ ...base, atual: 5, alvo: 9 })).not.toBeNull();
  });

  it('chega ao alvo final sem ficar oscilando perto dele', () => {
    let atual = 9.5;
    for (let i = 0; i < 200; i += 1) {
      const t = proximoTempo({ ...base, atual, alvo: 10 });
      if (t === null) break;
      atual = t;
    }
    expect(atual).toBeCloseTo(10, 5);
  });

  it('sem fps informado, mantém o comportamento contínuo de antes', () => {
    const t = proximoTempo({ atual: 0, alvo: 10, seeking: false, duracao: 10 });
    expect(t).toBeCloseTo(1.5, 5);
  });

  it('ignora fps inválido em vez de travar o vídeo', () => {
    expect(proximoTempo({ ...base, fps: 0 })).toBeCloseTo(1.5, 5);
    expect(proximoTempo({ ...base, fps: NaN })).toBeCloseTo(1.5, 5);
  });
});
