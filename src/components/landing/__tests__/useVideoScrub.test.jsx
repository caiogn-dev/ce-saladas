import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let capturado = null;
const kill = vi.fn();

vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn((config) => {
      capturado = config;
      return { kill, isActive: true };
    }),
  },
}));

import { useVideoScrub } from '../useVideoScrub';

// Controla o rAF manualmente: guarda o callback agendado em vez de esperar o
// navegador, e `avancarFrame()` executa exatamente um passo do laço.
let frameAgendado = null;

function avancarFrame() {
  const cb = frameAgendado;
  frameAgendado = null;
  if (cb) cb();
}

function montar({ ativo = true, duracao = 10 } = {}) {
  const palco = document.createElement('div');
  const video = { duration: duracao, seeking: false, currentTime: 0 };
  const hook = renderHook(() =>
    useVideoScrub({ palcoRef: { current: palco }, videoRef: { current: video }, ativo }),
  );
  return { palco, video, hook };
}

beforeEach(() => {
  vi.clearAllMocks();
  capturado = null;
  frameAgendado = null;
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    frameAgendado = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frameAgendado = null;
  });
});

describe('useVideoScrub', () => {
  it('não cria ScrollTrigger quando inativo', async () => {
    montar({ ativo: false });
    await act(async () => {});
    expect(capturado).toBeNull();
  });

  it('escreve --p no palco conforme o progresso', async () => {
    const { palco } = montar();
    await act(async () => {});
    act(() => capturado.onUpdate({ progress: 0.42 }));
    expect(palco.style.getPropertyValue('--p')).toBe('0.4200');
  });

  it('mata o ScrollTrigger no unmount', async () => {
    const { hook } = montar();
    await act(async () => {});
    hook.unmount();
    expect(kill).toHaveBeenCalledTimes(1);
  });

  // ── O núcleo do scrub: o laço que de fato move o vídeo ──

  it('um passo do laço aproxima currentTime do alvo', async () => {
    const { video } = montar({ duracao: 10 });
    await act(async () => {});
    act(() => capturado.onUpdate({ progress: 1 })); // alvo = 10s

    expect(video.currentTime).toBe(0);
    act(() => avancarFrame());

    // Suavização de 0.15 sobre a distância de 10s.
    expect(video.currentTime).toBeCloseTo(1.5, 5);

    act(() => avancarFrame());
    expect(video.currentTime).toBeGreaterThan(1.5);
    expect(video.currentTime).toBeLessThan(10);
  });

  it('com seek pendente, o frame é pulado e currentTime não muda', async () => {
    const { video } = montar({ duracao: 10 });
    await act(async () => {});
    act(() => capturado.onUpdate({ progress: 1 }));

    video.seeking = true;
    act(() => avancarFrame());
    expect(video.currentTime).toBe(0);

    // Assim que o seek termina, o laço volta a andar — não ficou travado.
    video.seeking = false;
    act(() => avancarFrame());
    expect(video.currentTime).toBeCloseTo(1.5, 5);
  });

  it('o laço para quando o palco sai de cena e volta quando reentra', async () => {
    const { video } = montar({ duracao: 10 });
    await act(async () => {});
    act(() => capturado.onUpdate({ progress: 1 }));

    act(() => capturado.onLeave());
    expect(frameAgendado).toBeNull();

    act(() => avancarFrame()); // nada agendado: não deve mover nada
    expect(video.currentTime).toBe(0);

    act(() => capturado.onEnterBack());
    act(() => avancarFrame());
    expect(video.currentTime).toBeCloseTo(1.5, 5);
  });

  it('não agenda um segundo laço se já estiver rodando', async () => {
    montar({ duracao: 10 });
    await act(async () => {});

    const agendadoInicial = frameAgendado;
    act(() => capturado.onEnter());
    expect(frameAgendado).toBe(agendadoInicial);
  });

  it('duração desconhecida não escreve NaN em currentTime', async () => {
    const { video } = montar({ duracao: NaN });
    await act(async () => {});
    act(() => capturado.onUpdate({ progress: 0.5 }));
    act(() => avancarFrame());
    expect(video.currentTime).toBe(0);
  });
});
