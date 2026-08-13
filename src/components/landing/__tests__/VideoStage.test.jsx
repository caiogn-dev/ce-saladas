// src/components/landing/__tests__/VideoStage.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const scrubSpy = vi.fn();
vi.mock('../useVideoScrub', () => ({
  useVideoScrub: (args) => scrubSpy(args),
}));

import VideoStage from '../VideoStage';

// jsdom não decodifica vídeo: readyState fica 0 pra sempre. Como o palco agora
// só assume o scroll quando há material em buffer, os testes precisam dizer
// explicitamente se o vídeo está pronto.
function fingirVideoPronto(pronto) {
  Object.defineProperty(window.HTMLMediaElement.prototype, 'readyState', {
    configurable: true,
    get: () => (pronto ? 4 : 0),
  });
}

function preparar({ largura, reducedMotion = false, conexao = null, videoPronto = true }) {
  window.innerWidth = largura;
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: reducedMotion,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Object.defineProperty(window.navigator, 'connection', {
    value: conexao,
    configurable: true,
  });
  fingirVideoPronto(videoPronto);
}

beforeEach(() => {
  scrubSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VideoStage', () => {
  it('no desktop, ativa o scrub e o vídeo não tem autoplay', () => {
    preparar({ largura: 1440 });
    const { container } = render(<VideoStage />);
    const video = container.querySelector('video');

    expect(video).not.toBeNull();
    expect(video.hasAttribute('autoplay')).toBe(false);
    expect(video.hasAttribute('loop')).toBe(false);
    expect(scrubSpy).toHaveBeenCalledWith(expect.objectContaining({ ativo: true }));
  });

  it('no celular também sincroniza — o arquivo é retrato', () => {
    preparar({ largura: 390 });
    const { container } = render(<VideoStage />);

    expect(container.querySelector('video').hasAttribute('autoplay')).toBe(false);
    expect(scrubSpy).toHaveBeenCalledWith(expect.objectContaining({ ativo: true }));
  });

  it('não dirige o vídeo pelo scroll enquanto ele não tem buffer', () => {
    // Esta é a regressão que fazia o vídeo "acordar" só depois de o usuário
    // ter rolado a seção inteira: os seeks começavam com o arquivo baixando.
    preparar({ largura: 1440, videoPronto: false });
    render(<VideoStage />);

    expect(scrubSpy).not.toHaveBeenCalledWith(expect.objectContaining({ ativo: true }));
  });

  it('em rede econômica cai em loop e não gasta seek', () => {
    preparar({ largura: 390, conexao: { saveData: true } });
    const { container } = render(<VideoStage />);
    const video = container.querySelector('video');

    expect(video.hasAttribute('autoplay')).toBe(true);
    expect(video.hasAttribute('loop')).toBe(true);
    expect(scrubSpy).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
  });

  it('sob reduced motion, não renderiza vídeo nenhum — só o poster', () => {
    preparar({ largura: 1440, reducedMotion: true });
    const { container } = render(<VideoStage />);

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
    expect(scrubSpy).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
  });

  it('o vídeo é sempre mudo e inline, em qualquer modo', () => {
    preparar({ largura: 1440 });
    const { container } = render(<VideoStage />);
    const video = container.querySelector('video');
    expect(video.hasAttribute('muted') || video.muted).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
  });

  it('mostra os três passos do pedido, numerados, em qualquer modo', () => {
    preparar({ largura: 390 });
    const { container } = render(<VideoStage />);

    expect(screen.getByText(/você escolhe/i)).toBeInTheDocument();
    expect(screen.getByText(/a gente monta na hora/i)).toBeInTheDocument();
    expect(screen.getByText(/chega em palmas/i)).toBeInTheDocument();

    // A numeração é conteúdo, não enfeite: é a ordem real de um pedido.
    const passos = container.querySelectorAll('.video-stage__passo');
    expect(passos).toHaveLength(3);
    expect([...container.querySelectorAll('.video-stage__numero')].map((n) => n.textContent))
      .toEqual(['01', '02', '03']);
  });

  it('a seção é rotulada pelo próprio título, sem título fantasma', () => {
    preparar({ largura: 1440 });
    const { container } = render(<VideoStage />);
    const secao = container.querySelector('section');
    const titulo = container.querySelector('#video-stage-titulo');

    expect(secao.getAttribute('aria-labelledby')).toBe('video-stage-titulo');
    expect(titulo.tagName).toBe('H2');
  });
});
