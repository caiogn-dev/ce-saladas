import { describe, it, expect } from 'vitest';
import { MODOS, modoDeVideo, LARGURA_MINIMA_SYNC } from '../modoDeVideo';

const base = { largura: 1440, reducedMotion: false, conexao: null };

describe('modoDeVideo', () => {
  it('desktop com conexão boa sincroniza', () => {
    expect(modoDeVideo(base)).toBe(MODOS.SYNC);
  });

  it('reduced motion vence tudo', () => {
    expect(modoDeVideo({ ...base, reducedMotion: true })).toBe(MODOS.POSTER);
    expect(modoDeVideo({ largura: 320, reducedMotion: true, conexao: { saveData: true } }))
      .toBe(MODOS.POSTER);
  });

  it('abaixo de 768 cai em loop', () => {
    expect(modoDeVideo({ ...base, largura: 767 })).toBe(MODOS.LOOP);
    expect(modoDeVideo({ ...base, largura: 390 })).toBe(MODOS.LOOP);
  });

  it('768 exato ainda sincroniza', () => {
    expect(modoDeVideo({ ...base, largura: LARGURA_MINIMA_SYNC })).toBe(MODOS.SYNC);
  });

  it('saveData cai em loop mesmo no desktop', () => {
    expect(modoDeVideo({ ...base, conexao: { saveData: true } })).toBe(MODOS.LOOP);
  });

  it('conexão lenta cai em loop', () => {
    for (const tipo of ['slow-2g', '2g', '3g']) {
      expect(modoDeVideo({ ...base, conexao: { effectiveType: tipo } })).toBe(MODOS.LOOP);
    }
  });

  it('4g sincroniza', () => {
    expect(modoDeVideo({ ...base, conexao: { effectiveType: '4g' } })).toBe(MODOS.SYNC);
  });

  it('largura ausente ou inválida cai em loop, nunca quebra', () => {
    expect(modoDeVideo({ ...base, largura: undefined })).toBe(MODOS.LOOP);
    expect(modoDeVideo({ ...base, largura: NaN })).toBe(MODOS.LOOP);
  });
});
