// src/components/landing/__tests__/VideoStage.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const scrubSpy = vi.fn();
vi.mock('../useVideoScrub', () => ({
  useVideoScrub: (args) => scrubSpy(args),
}));

import VideoStage from '../VideoStage';

function preparar({ largura, reducedMotion = false, conexao = null }) {
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

  it('no mobile, cai em loop e não ativa o scrub', () => {
    preparar({ largura: 390 });
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

  it('renderiza as três legendas em qualquer modo', () => {
    preparar({ largura: 390 });
    render(<VideoStage />);
    expect(screen.getByText(/camarão de verdade/i)).toBeInTheDocument();
    expect(screen.getByText(/montada na hora do pedido/i)).toBeInTheDocument();
    expect(screen.getByText(/na sua mesa em palmas/i)).toBeInTheDocument();
  });
});
