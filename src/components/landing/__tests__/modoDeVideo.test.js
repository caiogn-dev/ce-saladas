import { describe, it, expect } from 'vitest';
import { MODOS, modoDeVideo, modoForcadoDaUrl } from '../modoDeVideo';

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

  it('celular também sincroniza — o arquivo é retrato, é lá que ele encaixa', () => {
    expect(modoDeVideo({ ...base, largura: 390 })).toBe(MODOS.SYNC);
    expect(modoDeVideo({ ...base, largura: 320 })).toBe(MODOS.SYNC);
  });

  it('saveData cai em loop em qualquer tela', () => {
    expect(modoDeVideo({ ...base, conexao: { saveData: true } })).toBe(MODOS.LOOP);
    expect(modoDeVideo({ ...base, largura: 390, conexao: { saveData: true } })).toBe(MODOS.LOOP);
  });

  it('conexão lenta cai em loop', () => {
    for (const tipo of ['slow-2g', '2g', '3g']) {
      expect(modoDeVideo({ ...base, conexao: { effectiveType: tipo } })).toBe(MODOS.LOOP);
    }
  });

  it('4g sincroniza', () => {
    expect(modoDeVideo({ ...base, conexao: { effectiveType: '4g' } })).toBe(MODOS.SYNC);
  });

  it('largura ausente não degrada mais — o modo sync não depende dela', () => {
    expect(modoDeVideo({ ...base, largura: undefined })).toBe(MODOS.SYNC);
    expect(modoDeVideo({ ...base, largura: NaN })).toBe(MODOS.SYNC);
  });

  it('o override da URL vence inclusive reduced motion', () => {
    expect(modoDeVideo({ ...base, reducedMotion: true, forcado: 'sync' })).toBe(MODOS.SYNC);
    expect(modoDeVideo({ ...base, forcado: 'poster' })).toBe(MODOS.POSTER);
  });

  it('override inválido é ignorado em vez de quebrar o palco', () => {
    expect(modoDeVideo({ ...base, forcado: 'seiLa' })).toBe(MODOS.SYNC);
  });
});

describe('modoForcadoDaUrl', () => {
  it('lê ?palco= quando o valor é um modo conhecido', () => {
    expect(modoForcadoDaUrl('?palco=loop')).toBe('loop');
    expect(modoForcadoDaUrl('?a=1&palco=poster')).toBe('poster');
  });

  it('devolve null pra ausente ou desconhecido', () => {
    expect(modoForcadoDaUrl('')).toBeNull();
    expect(modoForcadoDaUrl('?palco=xpto')).toBeNull();
  });
});
