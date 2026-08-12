# Vídeo do camarão sincronizado ao scroll — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Somar uma seção de vídeo dirigida pelo scroll (o camarão salada, quadro a quadro sob o dedo) à landing do ce-saladas, e dar scroll suave à página inteira com Lenis — sem reescrever o GSAP que já existe lá.

**Architecture:** Palco de `260vh` segurado por `position: sticky`. Um ScrollTrigger com `scrub` converte progresso em `video.currentTime`, com suavização e guarda de seek pendente. O vídeo nunca dá `play()` — fica pausado e é inteiramente dirigido pelo scroll. Uma função pura decide entre três modos (`sync`, `loop`, `poster`) conforme viewport, conexão e preferência de movimento.

**Tech Stack:** Next.js 16 (Pages Router), React 19, CSS global (`LandingPage.css`), GSAP 3.14 + ScrollTrigger (já em `package.json`), Lenis (nova dependência), Vitest + Testing Library (**a montar — hoje não existe neste repo**), ffmpeg.

## Global Constraints

- Repo `ce-saladas`, branch `development` — **é a branch que está em produção**. Não criar branch.
- Restart do serviço: `systemctl --user restart ce-saladas-dev`.
- **Não reescrever** o GSAP existente de `src/pages/LandingPage.jsx`: timeline do hero, cursor glow, botões magnéticos, tilt 3D dos cards, contadores. O Lenis entra *dentro* do fluxo existente, não em paralelo.
- Todo movimento desligado sob `prefers-reduced-motion: reduce` — a landing já respeita isso (`LandingPage.jsx:73`), manter.
- O vídeo **nunca** toca com áudio. A faixa de áudio é removida no encode.
- Este repo usa **CSS global** (`LandingPage.css`), não CSS Modules. Seguir o padrão: classes com prefixo `video-stage__`.
- Comentários e identificadores em português, como o resto do arquivo.
- Commits em português.

## Achado que muda o ponto de partida

`src/utils/__tests__/productDescription.test.js` **existe**, mas este repo não tem
`vitest`, nem `vitest.config.js`, nem script `test` no `package.json`. Aquele teste
nunca rodou aqui — foi portado do `cardapidex-web`. A Task 1 monta o runner, e a
primeira coisa que ele faz é provar que aquele teste órfão passa.

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `vitest.config.js`, `vitest.setup.js` | Runner de testes do repo (novo). |
| `scripts/preparar-video.sh` | Reencode all-keyframe + extração do poster. |
| `public/video/camarao-salada.mp4`, `-poster.jpg` | Saída do script, versionadas. |
| `src/components/landing/modoDeVideo.js` | Função pura: contexto → `'sync' \| 'loop' \| 'poster'`. Concentra toda a política de fallback. |
| `src/components/landing/proximoTempo.js` | Função pura: o passo de suavização + a guarda de seek. |
| `src/components/landing/useVideoScrub.js` | ScrollTrigger + rAF que aplicam `proximoTempo` no elemento de vídeo. |
| `src/components/landing/useLenis.js` | Idêntico ao do `cardapidex-web`. |
| `src/components/landing/VideoStage.jsx` | O palco: escolhe o modo, renderiza vídeo/poster e as três legendas. |
| `src/pages/LandingPage.css` | Estilos do palco, ao final do arquivo. |
| `src/pages/LandingPage.jsx` | Monta `<VideoStage />` e sobe o Lenis. |

---

### Task 1: Montar o runner de testes

**Files:**
- Create: `vitest.config.js`
- Create: `vitest.setup.js`
- Modify: `package.json` (devDependencies + script `test`)

**Interfaces:**
- Consumes: nada.
- Produces: `npm test` funcionando; alias `@` → `src`; ambiente `jsdom`; `@testing-library/jest-dom` carregado.

- [ ] **Step 1: Instalar as dependências de teste**

```bash
npm install -D vitest@^4.1.8 jsdom@^29.1.1 \
  @testing-library/react@^16.3.2 @testing-library/dom@^10.4.1 \
  @testing-library/jest-dom@^6.9.1 @testing-library/user-event@^14.5.2
```

- [ ] **Step 2: Criar a configuração**

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
});
```

```js
// vitest.setup.js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Adicionar o script**

Em `package.json`, dentro de `"scripts"`, ao lado de `"lint"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Provar que o teste órfão agora roda**

Run: `npm test`
Expected: PASS — `src/utils/__tests__/productDescription.test.js`, 7 testes. Se algum falhar, corrigir **o teste** e não o utilitário: `productDescription.js` está em produção e o teste é que nunca foi exercitado.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js vitest.setup.js
git commit -m "chore: monta vitest no repo (o teste de productDescription nunca rodou aqui)"
```

---

### Task 2: Preparar o vídeo

**Files:**
- Create: `scripts/preparar-video.sh`
- Create: `public/video/camarao-salada.mp4`
- Create: `public/video/camarao-salada-poster.jpg`

**Interfaces:**
- Consumes: `/home/graco/ftp-data/ce-saladas-video.mp4`.
- Produces: dois assets em `public/video/`, referenciados por caminho literal em `VideoStage.jsx` (Task 6).

- [ ] **Step 1: Escrever o script**

```bash
#!/usr/bin/env bash
# scripts/preparar-video.sh
#
# Prepara um vídeo pra ser dirigido por scroll.
#
# O ponto crítico é `-g 1 -keyint_min 1 -sc_threshold 0`: força TODO frame a ser
# keyframe. Sem isso, cada `video.currentTime = x` obriga o decoder a reconstruir
# a partir do keyframe anterior — e o vídeo entregue tinha UM keyframe em 240
# frames, o que faria o scroll travar por completo.
#
# Uso: ./scripts/preparar-video.sh /caminho/do/video-cru.mp4

set -euo pipefail

ORIGEM="${1:?uso: $0 <video-cru.mp4>}"
DESTINO="public/video/camarao-salada.mp4"
POSTER="public/video/camarao-salada-poster.jpg"

mkdir -p public/video

# 720p mantém a nitidez do original; 12 fps basta porque quem controla o tempo é
# o dedo, não o relógio. Medido: 3,0 MB (contra 5,8 MB a 24 fps).
ffmpeg -y -i "$ORIGEM" \
  -an \
  -vf "scale=720:-2,fps=12" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -crf 28 -preset medium \
  -movflags +faststart \
  "$DESTINO"

# Poster = primeiro frame. É o que aparece antes de carregar e o fallback
# permanente sob reduced-motion.
ffmpeg -y -i "$DESTINO" -frames:v 1 -q:v 3 "$POSTER"

echo "pronto:"
ls -lh "$DESTINO" "$POSTER"
```

- [ ] **Step 2: Rodar**

```bash
chmod +x scripts/preparar-video.sh
./scripts/preparar-video.sh /home/graco/ftp-data/ce-saladas-video.mp4
```

Expected: `camarao-salada.mp4` com cerca de 3,0 MB e o poster com algumas centenas de KB.

- [ ] **Step 3: Verificar que o resultado é seek-friendly**

```bash
# Deve imprimir 120 (todo frame é keyframe), não 1.
ffprobe -v error -select_streams v -show_entries frame=key_frame \
  -of csv=p=0 public/video/camarao-salada.mp4 | grep -c '^1'

# Deve listar só o stream de vídeo — nenhum áudio.
ffprobe -v error -show_entries stream=codec_type -of csv=p=0 public/video/camarao-salada.mp4
```

Expected: `120` e uma única linha `video`.

- [ ] **Step 4: Commit**

```bash
git add scripts/preparar-video.sh public/video/
git commit -m "chore: vídeo do camarão reencodado all-keyframe para seek por scroll"
```

---

### Task 3: Política de fallback (núcleo puro)

**Files:**
- Create: `src/components/landing/modoDeVideo.js`
- Test: `src/components/landing/__tests__/modoDeVideo.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `MODOS` (objeto congelado: `SYNC: 'sync'`, `LOOP: 'loop'`, `POSTER: 'poster'`); `modoDeVideo({ largura, reducedMotion, conexao }): string`, onde `conexao` é `navigator.connection` ou `null`; `LARGURA_MINIMA_SYNC = 768`.

- [ ] **Step 1: Escrever o teste que falha**

```js
// src/components/landing/__tests__/modoDeVideo.test.js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run src/components/landing/__tests__/modoDeVideo.test.js`
Expected: FAIL — `Failed to resolve import "../modoDeVideo"`

- [ ] **Step 3: Implementar**

```js
// src/components/landing/modoDeVideo.js

/**
 * Seek quadro a quadro é caro e, em Safari iOS, inconsistente. Esta função
 * concentra toda a decisão de QUANDO vale a pena — e quando não vale.
 */
export const MODOS = Object.freeze({
  SYNC: 'sync',     // scroll dirige o frame
  LOOP: 'loop',     // autoplay muted loop, sem seek
  POSTER: 'poster', // imagem estática
});

export const LARGURA_MINIMA_SYNC = 768;

const CONEXOES_LENTAS = new Set(['slow-2g', '2g', '3g']);

/**
 * @param {object} ctx
 * @param {number} ctx.largura largura do viewport em px
 * @param {boolean} ctx.reducedMotion resultado de prefers-reduced-motion
 * @param {object|null} ctx.conexao navigator.connection, ou null
 * @returns {string} um dos MODOS
 */
export function modoDeVideo({ largura, reducedMotion, conexao }) {
  // Quem pediu menos movimento não recebe vídeo nenhum.
  if (reducedMotion) return MODOS.POSTER;

  // Largura desconhecida é tratada como mobile: o modo barato é o padrão seguro.
  if (!Number.isFinite(largura) || largura < LARGURA_MINIMA_SYNC) return MODOS.LOOP;

  if (conexao?.saveData) return MODOS.LOOP;
  if (CONEXOES_LENTAS.has(conexao?.effectiveType)) return MODOS.LOOP;

  return MODOS.SYNC;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run src/components/landing/__tests__/modoDeVideo.test.js`
Expected: PASS — 8 testes

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/modoDeVideo.js src/components/landing/__tests__/modoDeVideo.test.js
git commit -m "feat(landing): política de fallback do vídeo como função pura"
```

---

### Task 4: Passo de suavização com guarda de seek

**Files:**
- Create: `src/components/landing/proximoTempo.js`
- Test: `src/components/landing/__tests__/proximoTempo.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `SUAVIZACAO = 0.15`; `proximoTempo({ atual, alvo, seeking, duracao }): number | null` — devolve `null` quando o frame deve ser **pulado** (seek em andamento, ou duração ainda desconhecida), e o novo `currentTime` caso contrário.

> É aqui que mora a diferença entre um vídeo fluido e um vídeo engasgado. Se um
> seek anterior ainda não terminou e a gente empilha outro, o navegador enfileira
> e o vídeo trava. Pular o frame é o certo: o próximo rAF já corrige.

- [ ] **Step 1: Escrever o teste que falha**

```js
// src/components/landing/__tests__/proximoTempo.test.js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run src/components/landing/__tests__/proximoTempo.test.js`
Expected: FAIL — `Failed to resolve import "../proximoTempo"`

- [ ] **Step 3: Implementar**

```js
// src/components/landing/proximoTempo.js

// Quanto da distância até o alvo é percorrido por frame. Mais alto = mais
// responsivo e mais serrilhado; mais baixo = mais macio e mais atrasado.
export const SUAVIZACAO = 0.15;

const EPSILON = 0.001;

/**
 * Um passo da interpolação do tempo do vídeo.
 *
 * @returns {number|null} o novo currentTime, ou null se este frame deve ser PULADO.
 */
export function proximoTempo({ atual, alvo, seeking, duracao }) {
  // Guarda: empilhar seeks é o que faz o vídeo engasgar. Pular é melhor —
  // o próximo frame já corrige a posição.
  if (seeking) return null;
  if (!Number.isFinite(duracao) || duracao <= 0) return null;

  const destino = Math.min(Math.max(alvo, 0), duracao);
  const passo = atual + (destino - atual) * SUAVIZACAO;

  if (Math.abs(destino - passo) < EPSILON) return destino;
  return Math.min(Math.max(passo, 0), duracao);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run src/components/landing/__tests__/proximoTempo.test.js`
Expected: PASS — 6 testes

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/proximoTempo.js src/components/landing/__tests__/proximoTempo.test.js
git commit -m "feat(landing): passo de suavização do vídeo com guarda de seek"
```

---

### Task 5: Hooks — useVideoScrub e useLenis

**Files:**
- Create: `src/components/landing/useVideoScrub.js`
- Create: `src/components/landing/useLenis.js`
- Test: `src/components/landing/__tests__/useVideoScrub.test.jsx`
- Modify: `package.json` (adicionar `lenis`)

**Interfaces:**
- Consumes: `proximoTempo`, `SUAVIZACAO` (Task 4).
- Produces:
  - `useVideoScrub({ palcoRef, videoRef, ativo }): void` — quando `ativo` é `true`, cria o ScrollTrigger e o laço de rAF; quando `false`, não faz nada. Escreve também `--p` no palco, pras legendas.
  - `useLenis(): { stop: () => void, start: () => void }` — cópia literal do hook do `cardapidex-web`.

- [ ] **Step 1: Instalar o Lenis**

```bash
npm install lenis@^1.1.18
```

- [ ] **Step 2: Escrever o teste que falha**

```jsx
// src/components/landing/__tests__/useVideoScrub.test.jsx
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
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx vitest run src/components/landing/__tests__/useVideoScrub.test.jsx`
Expected: FAIL — `Failed to resolve import "../useVideoScrub"`

- [ ] **Step 4: Implementar o useVideoScrub**

```js
// src/components/landing/useVideoScrub.js
import { useEffect } from 'react';
import { proximoTempo } from './proximoTempo';

/**
 * Converte o progresso do palco em posição no vídeo.
 *
 * O vídeo NUNCA recebe play(). Ele fica pausado no frame 0 e é inteiramente
 * dirigido pelo scroll — a mesma técnica das páginas de produto da Apple.
 *
 * O ScrollTrigger só ANOTA o alvo; quem aplica é um laço de rAF separado. Essa
 * separação é o que permite pular frames quando há seek pendente, em vez de
 * empilhar seeks e travar o decoder.
 */
export function useVideoScrub({ palcoRef, videoRef, ativo }) {
  useEffect(() => {
    if (!ativo) return undefined;

    const palco = palcoRef.current;
    const video = videoRef.current;
    if (!palco || !video) return undefined;

    let cancelado = false;
    let trigger = null;
    let raf = null;
    let alvo = 0;
    let atual = 0;

    const laco = () => {
      raf = requestAnimationFrame(laco);
      const t = proximoTempo({
        atual,
        alvo,
        seeking: video.seeking,
        duracao: video.duration,
      });
      if (t === null) return; // frame pulado de propósito
      atual = t;
      video.currentTime = t;
    };

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelado) return;

      gsap.registerPlugin(ScrollTrigger);

      trigger = ScrollTrigger.create({
        trigger: palco,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          // As legendas leem --p direto no CSS.
          palco.style.setProperty('--p', self.progress.toFixed(4));
          if (Number.isFinite(video.duration)) {
            alvo = self.progress * video.duration;
          }
        },
      });

      if (typeof requestAnimationFrame === 'function') {
        raf = requestAnimationFrame(laco);
      }
    })();

    return () => {
      cancelado = true;
      trigger?.kill();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [palcoRef, videoRef, ativo]);
}
```

- [ ] **Step 5: Copiar o useLenis do cardapidex-web**

O arquivo é idêntico — os dois repos são Next 16 + React 19 + GSAP 3.14 e o hook
não tem nenhuma dependência de projeto.

```js
// src/components/landing/useLenis.js
import { useCallback, useEffect, useRef } from 'react';

const REDUZIDO = '(prefers-reduced-motion: reduce)';

/**
 * Sobe o Lenis (scroll suave) e o casa com o ticker do GSAP, que é o que mantém
 * o ScrollTrigger em sincronia com a posição interpolada.
 *
 * Tudo por import() dinâmico. Sob prefers-reduced-motion nada é carregado e
 * stop/start viram no-op.
 */
export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia(REDUZIDO).matches) return undefined;

    let cancelado = false;
    let lenis = null;
    let removerTicker = null;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelado) return;

      gsap.registerPlugin(ScrollTrigger);

      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);

      const tick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      removerTicker = () => gsap.ticker.remove(tick);

      lenisRef.current = lenis;
    })();

    return () => {
      cancelado = true;
      if (removerTicker) removerTicker();
      if (lenis) lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  return { stop, start };
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run src/components/landing/__tests__/useVideoScrub.test.jsx`
Expected: PASS — 3 testes

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/landing/useVideoScrub.js src/components/landing/useLenis.js src/components/landing/__tests__/useVideoScrub.test.jsx
git commit -m "feat(landing): hooks de scrub do vídeo e de scroll suave"
```

---

### Task 6: VideoStage

**Files:**
- Create: `src/components/landing/VideoStage.jsx`
- Modify: `src/pages/LandingPage.css` (acrescentar os estilos ao final)
- Test: `src/components/landing/__tests__/VideoStage.test.jsx`

**Interfaces:**
- Consumes: `modoDeVideo`, `MODOS` (Task 3); `useVideoScrub` (Task 5).
- Produces: `export default function VideoStage()` — sem props. Caminhos dos assets são constantes internas.

- [ ] **Step 1: Escrever o teste que falha**

```jsx
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run src/components/landing/__tests__/VideoStage.test.jsx`
Expected: FAIL — `Failed to resolve import "../VideoStage"`

- [ ] **Step 3: Implementar o componente**

```jsx
// src/components/landing/VideoStage.jsx
import { useEffect, useRef, useState } from 'react';
import { MODOS, modoDeVideo } from './modoDeVideo';
import { useVideoScrub } from './useVideoScrub';

const VIDEO = '/video/camarao-salada.mp4';
const POSTER = '/video/camarao-salada-poster.jpg';

const LEGENDAS = [
  { titulo: 'Camarão de verdade.', texto: 'Nada de imitação, nada de congelado de véspera.' },
  { titulo: 'Montada na hora do pedido.', texto: 'Você escolhe cada ingrediente.' },
  { titulo: 'Na sua mesa em Palmas.', texto: 'Entrega própria, sem app cobrando por cima.' },
];

/**
 * Palco de vídeo dirigido por scroll.
 *
 * O modo é decidido no cliente, depois da montagem: no servidor não existe
 * viewport nem conexão, e chutar geraria hidratação divergente. Até o efeito
 * rodar, o modo é POSTER — o estado mais barato e sempre correto.
 */
export default function VideoStage() {
  const palcoRef = useRef(null);
  const videoRef = useRef(null);
  const [modo, setModo] = useState(MODOS.POSTER);

  useEffect(() => {
    setModo(
      modoDeVideo({
        largura: window.innerWidth,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        conexao: navigator.connection || null,
      }),
    );
  }, []);

  useVideoScrub({ palcoRef, videoRef, ativo: modo === MODOS.SYNC });

  return (
    <section
      ref={palcoRef}
      className={`video-stage video-stage--${modo}`}
      data-modo={modo}
      aria-labelledby="video-stage-titulo"
    >
      <div className="video-stage__sticky">
        {modo === MODOS.POSTER ? (
          <img className="video-stage__midia" src={POSTER} alt="Salada de camarão da Cê Saladas" />
        ) : (
          <video
            ref={videoRef}
            className="video-stage__midia"
            src={VIDEO}
            poster={POSTER}
            muted
            playsInline
            preload={modo === MODOS.SYNC ? 'auto' : 'metadata'}
            autoPlay={modo === MODOS.LOOP}
            loop={modo === MODOS.LOOP}
            aria-hidden="true"
          />
        )}

        <div className="video-stage__legendas">
          {/* Título acessível único da seção; o visual fica nas legendas abaixo. */}
          <h2 id="video-stage-titulo" className="sr-only">
            A salada de camarão da Cê Saladas
          </h2>
          {LEGENDAS.map((l, i) => (
            <div key={l.titulo} className="video-stage__legenda" data-indice={i}>
              <strong>{l.titulo}</strong>
              <span>{l.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Acrescentar os estilos ao final de `src/pages/LandingPage.css`**

```css
/* ══════════════════════════════════════════════════════════
   VIDEO STAGE — camarão dirigido pelo scroll
   ══════════════════════════════════════════════════════════ */

/*
  --p é escrito pelo useVideoScrub. Default 0 porque, ao contrário do palco do
  Cardapidex, aqui o estado inicial correto é o primeiro frame.
*/
.video-stage {
  --p: 0;
  position: relative;
  background: #0f1a12;
}

/* Só o modo sync gasta altura de scroll. Loop e poster são seções normais. */
.video-stage--sync { height: 260vh; }

.video-stage--loop,
.video-stage--poster {
  height: auto;
  padding: 0;
}

.video-stage__sticky {
  position: relative;
  overflow: hidden;
}

.video-stage--sync .video-stage__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
}

.video-stage--loop .video-stage__sticky,
.video-stage--poster .video-stage__sticky {
  height: min(78svh, 620px);
}

.video-stage__midia {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Escurece a base pra as legendas terem contraste sem caixa. */
.video-stage__sticky::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to top,
    rgba(15, 26, 18, .88) 0%,
    rgba(15, 26, 18, .32) 42%,
    rgba(15, 26, 18, .12) 100%
  );
}

.video-stage__legendas {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: clamp(36px, 9vh, 96px);
  transform: translateX(-50%);
  width: min(92vw, 640px);
  text-align: center;
  color: #f4fbf5;
}

.video-stage__legenda {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.video-stage__legenda strong {
  font-size: clamp(24px, 4vw, 44px);
  line-height: 1.04;
  letter-spacing: -.03em;
}

.video-stage__legenda span {
  font-size: clamp(14px, 1.7vw, 18px);
  color: rgba(244, 251, 245, .74);
}

/*
  No modo sync as três legendas ocupam o MESMO lugar e trocam por opacidade,
  conforme a faixa de --p. Empilhadas em grid pra não haver salto de altura.
*/
.video-stage--sync .video-stage__legendas {
  display: grid;
}

.video-stage--sync .video-stage__legenda {
  grid-area: 1 / 1;
  transition: opacity .25s linear;
}

.video-stage--sync .video-stage__legenda[data-indice='0'] {
  opacity: clamp(0, (0.33 - var(--p)) / 0.08, 1);
}

.video-stage--sync .video-stage__legenda[data-indice='1'] {
  opacity: min(
    clamp(0, (var(--p) - 0.33) / 0.06, 1),
    clamp(0, (0.66 - var(--p)) / 0.06, 1)
  );
}

.video-stage--sync .video-stage__legenda[data-indice='2'] {
  opacity: clamp(0, (var(--p) - 0.66) / 0.08, 1);
}

/* Nos modos baratos, as três aparecem empilhadas de uma vez. */
.video-stage--loop .video-stage__legendas,
.video-stage--poster .video-stage__legendas {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-stage--loop .video-stage__legenda strong,
.video-stage--poster .video-stage__legenda strong {
  font-size: clamp(19px, 5vw, 26px);
}

@media (prefers-reduced-motion: reduce) {
  .video-stage--sync .video-stage__legenda { transition: none; }
}
```

Se a classe utilitária `.sr-only` ainda não existir em `LandingPage.css`, acrescentar:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Verificar antes: `grep -n "sr-only" src/pages/LandingPage.css src/index.css`

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run src/components/landing/__tests__/VideoStage.test.jsx`
Expected: PASS — 5 testes

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/VideoStage.jsx src/components/landing/__tests__/VideoStage.test.jsx src/pages/LandingPage.css
git commit -m "feat(landing): palco de vídeo com três modos e legendas por progresso"
```

---

### Task 7: Ligar na LandingPage

**Files:**
- Modify: `src/pages/LandingPage.jsx`

**Interfaces:**
- Consumes: `VideoStage` (Task 6), `useLenis` (Task 5).
- Produces: nenhuma mudança de exportação. A página segue com `export default`.

- [ ] **Step 1: Acrescentar os imports**

No topo de `src/pages/LandingPage.jsx`, junto dos outros imports de componente:

```jsx
import VideoStage from '../components/landing/VideoStage';
import { useLenis } from '../components/landing/useLenis';
```

- [ ] **Step 2: Subir o Lenis**

Dentro do componente, logo abaixo de `const cursorGlowRef = useRef(null);` (hoje na
linha 64):

```jsx
  // Scroll suave da página inteira. Sobe antes do GSAP: o hook já liga
  // lenis.on('scroll') no ScrollTrigger.update e casa o lenis.raf com o
  // gsap.ticker, que é o que mantém o scrub em fase com a posição interpolada.
  useLenis();
```

O `useLenis` respeita `prefers-reduced-motion` por conta própria — a mesma guarda
que o `useEffect` do GSAP já tem na linha 73. Não é preciso duplicar a checagem.

- [ ] **Step 3: Montar o palco entre o brand strip e o "como funciona"**

Em `src/pages/LandingPage.jsx`, entre o fechamento do `<section className="brand-strip">`
e a abertura do `<section id="como-funciona" className="how-it-works">`:

```jsx
      {/* ── Camarão em cena — vídeo dirigido pelo scroll ────────── */}
      <VideoStage />
```

É o momento certo na narrativa: logo depois da promessa do marquee, antes de
explicar como pedir.

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS em tudo — `productDescription`, `modoDeVideo`, `proximoTempo`, `useVideoScrub`, `VideoStage`.

- [ ] **Step 5: Validar o build**

Run: `npm run build`
Expected: build verde.

- [ ] **Step 6: Commit**

```bash
git add src/pages/LandingPage.jsx
git commit -m "feat(landing): monta o palco do camarão e liga o scroll suave"
```

---

### Task 8: Verificação em navegador real

**Files:**
- Nenhum arquivo de código, a menos que a verificação encontre defeito.

**Interfaces:**
- Consumes: a landing completa das Tasks 1–7.
- Produces: confirmação dos critérios de pronto do spec.

> Nenhum dos três modos pode ser provado em jsdom: não há layout, não há decoder
> de vídeo, não há rAF real. Esta verificação é obrigatória.

- [ ] **Step 1: Subir o dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verificar o modo sync no desktop**

Em 1440px, rolar devagar pela seção do camarão.
Expected: o vídeo avança quadro a quadro acompanhando o dedo/roda, **sem engasgo**;
rolar pra cima faz o vídeo voltar; as três legendas trocam em cruzamento suave.

- [ ] **Step 3: Verificar que não há seek empilhado**

Rolar **muito rápido** pela seção inteira, de ponta a ponta.
Expected: o vídeo pode pular frames, mas **não** trava nem fica "atrasado
alcançando" depois que o scroll para. Se ficar, a suavização de `SUAVIZACAO = 0.15`
está alta demais — baixar pra `0.1` em `proximoTempo.js` e reavaliar.

- [ ] **Step 4: Verificar o modo loop no mobile**

Em 390px com emulação de toque.
Expected: o vídeo toca sozinho em laço, mudo; a seção tem altura normal (não 260vh);
rolar por cima dela é fluido; **nenhum** seek acontece — confirmar no Performance
que não há picos de decode ao rolar.

- [ ] **Step 5: Verificar o modo poster**

DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", recarregar.
Expected: nenhum elemento `<video>` no DOM (conferir com
`document.querySelectorAll('video').length === 0`), só a imagem, com as três
legendas empilhadas e legíveis.

- [ ] **Step 6: Verificar a economia de dados**

DevTools → Network → throttling "Slow 3G", recarregar em 1440px.
Expected: cai em `loop` — o `effectiveType` reportado como `3g` derruba o sync.

- [ ] **Step 7: Confirmar que o GSAP existente não regrediu**

Percorrer a landing inteira em 1440px.
Expected: timeline do hero, cursor glow, marquee, contadores, botões magnéticos e
tilt dos cards **todos** continuam funcionando. O Lenis deve ter deixado tudo isso
mais suave, não quebrado. Se algum ScrollTrigger disparar na posição errada,
acrescentar `ScrollTrigger.refresh()` após a inicialização do Lenis.

- [ ] **Step 8: Deploy**

```bash
npm run build
systemctl --user restart ce-saladas-dev
```

- [ ] **Step 9: Commit final, se algum ajuste foi necessário**

```bash
git add -A
git commit -m "fix(landing): ajustes da verificação do vídeo em navegador real"
```

---

## Auto-revisão do plano

**Cobertura do spec:**

| Requisito do spec | Task |
|---|---|
| Reencode all-keyframe, 720p@12fps crf28 | 2 |
| Remoção da faixa de áudio | 2 (`-an`, verificado no Step 3) |
| Poster do primeiro frame | 2 |
| Script `scripts/preparar-video.sh` | 2 |
| Palco sticky de 260vh | 6 (CSS) |
| ScrollTrigger dirigindo `currentTime` | 5 |
| Suavização por lerp | 4 |
| Guarda de seek pendente | 4 (lógica), 5 (aplicação) |
| Vídeo nunca dá `play()` no modo sync | 6 (sem `autoPlay`), testado na Task 6 |
| Três legendas por faixa de progresso | 6 |
| Fallback `poster` sob reduced-motion | 3, 6 |
| Fallback `loop` no mobile e em conexão lenta | 3, 6 |
| `modoDeVideo.js` como função pura | 3 |
| Lenis dentro do fluxo existente | 7 |
| Não reescrever o GSAP atual | 7 (Step 7 verifica ausência de regressão) |
| Posição entre `brand-strip` e `#como-funciona` | 7 |
| `npm test` verde | 1, 7 |

Sem lacunas. A Task 1 é acréscimo ao spec: ele exige "npm test verde" como critério
de pronto, o que é impossível sem runner.

**Consistência de tipos:** `modoDeVideo` devolve strings de `MODOS`, comparadas em
`VideoStage` como `MODOS.SYNC`/`MODOS.LOOP`/`MODOS.POSTER` e usadas como sufixo de
classe `video-stage--${modo}` — as mesmas três strings aparecem no CSS como
`--sync`, `--loop`, `--poster`. `proximoTempo` devolve `number | null`, e o `null`
é tratado explicitamente com `if (t === null) return` no laço de `useVideoScrub`.
`useVideoScrub` recebe `{ palcoRef, videoRef, ativo }` na Task 5 e é chamado com
exatamente esses três nomes na Task 6, incluindo no mock do teste.

**Placeholders:** nenhum. Todo passo de código traz o código.
