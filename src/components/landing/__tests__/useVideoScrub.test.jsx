import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let capturado = null;
const kill = vi.fn();

vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn((config) => {
      capturado = config;
      return { kill };
    }),
  },
}));

import { useVideoScrub } from '../useVideoScrub';

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
});
