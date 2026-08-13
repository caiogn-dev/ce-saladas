import { useEffect } from 'react';
import { proximoTempo } from './proximoTempo';
import { tempoDoProgresso } from './janelaDoVideo';

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
export function useVideoScrub({ palcoRef, videoRef, ativo, fps }) {
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
    let remedir = null;

    const laco = () => {
      raf = requestAnimationFrame(laco);
      const t = proximoTempo({
        atual,
        alvo,
        seeking: video.seeking,
        duracao: video.duration,
        fps,
      });
      if (t === null) return; // frame pulado de propósito
      atual = t;
      video.currentTime = t;
    };

    // O laço só roda com o palco em cena. Fora de cena o scroll continua
    // gerando onUpdate (é o que atualiza --p para as legendas), mas não há
    // motivo pra manter um rAF batendo pra sempre num notebook enquanto o
    // usuário já rolou pra longe — desperdício de CPU sem efeito visível.
    const ligarLaco = () => {
      if (raf !== null) return; // já está rodando, não duplica
      if (typeof requestAnimationFrame === 'function') {
        raf = requestAnimationFrame(laco);
      }
    };

    const desligarLaco = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
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
        // A landing cresce depois da primeira pintura: fontes, imagens preguiçosas
        // e o mapa do rodapé mudam a altura do documento. Sem reavaliar, o palco
        // continua ancorado na posição que tinha na medição antiga e o vídeo
        // dispara longe de onde a seção realmente está.
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // As legendas leem --p direto no CSS.
          palco.style.setProperty('--p', self.progress.toFixed(4));
          alvo = tempoDoProgresso({ progresso: self.progress, duracao: video.duration });
        },
        // Liga/desliga o laço de rAF conforme o palco entra e sai da tela.
        // Usa os callbacks do próprio ScrollTrigger em vez de um
        // IntersectionObserver à parte: é a mesma fonte de verdade que já
        // decide "o palco está em cena", uma peça móvel a menos.
        onEnter: ligarLaco,
        onEnterBack: ligarLaco,
        onLeave: desligarLaco,
        onLeaveBack: desligarLaco,
      });

      // Uma remedição logo após o load pega tudo que entrou na página depois
      // da montagem deste hook.
      remedir = () => ScrollTrigger.refresh();
      if (document.readyState === 'complete') {
        remedir();
      } else {
        window.addEventListener('load', remedir, { once: true });
      }

      // O palco pode já nascer em cena (ex.: reload com scroll no meio da
      // seção) — nesse caso onEnter não dispara, porque não houve cruzamento.
      if (trigger.isActive) {
        ligarLaco();
      }
    })();

    return () => {
      cancelado = true;
      if (remedir) window.removeEventListener('load', remedir);
      trigger?.kill();
      desligarLaco();
    };
  }, [palcoRef, videoRef, ativo, fps]);
}
