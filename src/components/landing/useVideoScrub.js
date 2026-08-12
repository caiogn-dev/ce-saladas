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
