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

// jsdom não implementa play/pause. O palco precisa chamar os dois pra acordar o
// decodificador do iOS, então eles viram espiões.
function espionarPlayPause() {
  const play = vi.fn().mockResolvedValue(undefined);
  const pause = vi.fn();
  window.HTMLMediaElement.prototype.play = play;
  window.HTMLMediaElement.prototype.pause = pause;
  return { play, pause };
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
  it('no desktop, ativa o scrub e o vídeo não tem autoplay', async () => {
    espionarPlayPause();
    preparar({ largura: 1440 });
    const { container } = render(<VideoStage />);
    const video = container.querySelector('video');

    expect(video).not.toBeNull();
    expect(video.hasAttribute('autoplay')).toBe(false);
    expect(video.hasAttribute('loop')).toBe(false);
    // Assíncrono: o palco só assume o scroll depois de acordar o decodificador.
    await vi.waitFor(() =>
      expect(scrubSpy).toHaveBeenCalledWith(expect.objectContaining({ ativo: true })));
  });

  it('no celular também sincroniza — o arquivo é retrato', async () => {
    espionarPlayPause();
    preparar({ largura: 390 });
    const { container } = render(<VideoStage />);

    expect(container.querySelector('video').hasAttribute('autoplay')).toBe(false);
    await vi.waitFor(() =>
      expect(scrubSpy).toHaveBeenCalledWith(expect.objectContaining({ ativo: true })));
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

  it('fala do PRATO, não repete os passos da seção "Como pedir"', () => {
    preparar({ largura: 390 });
    const { container } = render(<VideoStage />);

    expect(screen.getByText(/camarão graúdo/i)).toBeInTheDocument();
    expect(screen.getByText(/molho da casa/i)).toBeInTheDocument();
    expect(screen.getByText(/montada quando você pede/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.video-stage__passo')).toHaveLength(3);

    // Sem numeração: estas três não são uma sequência, e a página já tem uma
    // seção numerada logo abaixo com os passos de verdade.
    expect(container.querySelector('.video-stage__numero')).toBeNull();
  });

  it('oferece saída pro cardápio com o MESMO rótulo do resto da página', () => {
    preparar({ largura: 1440 });
    const { container } = render(<VideoStage />);
    const cta = container.querySelector('.video-stage__cta');

    expect(cta).not.toBeNull();
    expect(cta.getAttribute('href')).toBe('/cardapio');
    expect(cta.textContent).toMatch(/ver cardápio/i);
  });

  it('acorda o decodificador com play+pause — sem isso o iOS só mostra o pôster', async () => {
    // No Safari um vídeo que nunca tocou não pinta quadro ao receber
    // currentTime. Como o palco jamais chama play(), sem este empurrão o
    // iPhone ficava eternamente no pôster.
    const { play, pause } = espionarPlayPause();
    preparar({ largura: 390 });
    render(<VideoStage />);

    await vi.waitFor(() => expect(play).toHaveBeenCalled());
    expect(pause).toHaveBeenCalled();
  });

  it('autoplay negado (baixo consumo) não quebra o palco', async () => {
    const play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    window.HTMLMediaElement.prototype.play = play;
    window.HTMLMediaElement.prototype.pause = vi.fn();
    preparar({ largura: 390 });

    expect(() => render(<VideoStage />)).not.toThrow();
    await vi.waitFor(() => expect(play).toHaveBeenCalled());
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
