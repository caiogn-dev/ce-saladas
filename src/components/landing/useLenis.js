import { useCallback, useEffect, useRef } from 'react';

const REDUZIDO = '(prefers-reduced-motion: reduce)';

/**
 * Sobe o Lenis (scroll suave) e o casa com o ticker do GSAP, que é o que mantém
 * o ScrollTrigger em sincronia com a posição interpolada — sem isso o scrub
 * fica meio quadro atrás do que se vê.
 *
 * Tudo por import() dinâmico: nenhum KB entra no bundle inicial da landing.
 * Sob prefers-reduced-motion nada é carregado e stop/start viram no-op.
 *
 * ⚠️ NÃO importe `lenis/dist/lenis.css` aqui. A documentação pede, mas essa
 * folha traz `.lenis.lenis-smooth iframe { pointer-events: none }` — e esta
 * landing tem o mapa do Google no rodapé, que ficaria morto ao toque. A única
 * regra dela que realmente importa é neutralizar `scroll-behavior: smooth`, e
 * isso já está resolvido na raiz: o html não declara mais scroll-behavior
 * (src/index.css), justamente porque ele disputava a rolagem com o Lenis.
 */
export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia(REDUZIDO).matches) return undefined;

    let cancelado = false;
    let lenis = null;
    let removerTicker = null;
    let gsapCarregado = null;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelado) return;

      gsapCarregado = gsap;
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
      // gsap.ticker é singleton global compartilhado pela app inteira: sem isso,
      // o lagSmoothing(0) ligado na montagem vaza "desligado" pras páginas
      // seguintes numa navegação SPA. (500, 33) é o padrão do próprio GSAP.
      if (gsapCarregado) gsapCarregado.ticker.lagSmoothing(500, 33);
    };
  }, []);

  // Usados pelo modo interativo do celular: enquanto o dedo rola DENTRO do
  // iframe, o Lenis precisa sair do caminho, senão ele engole o evento.
  const stop = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  return { stop, start };
}
