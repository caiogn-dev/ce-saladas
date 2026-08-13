// src/components/landing/VideoStage.jsx
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MODOS, modoDeVideo, modoForcadoDaUrl } from './modoDeVideo';
import { useVideoScrub } from './useVideoScrub';

const VIDEO = '/video/camarao-salada.mp4';
const POSTER = '/video/camarao-salada-poster.jpg';

// Quadros por segundo do ARQUIVO. O laço de scrub encaixa os seeks nessa grade;
// pedir tempos entre quadros custa decodificação e não muda um pixel.
// Mantenha em sincronia com scripts/preparar-video.sh.
export const FPS = 24;

/*
  No celular o scrub passa a andar em meia grade: 12 seeks por segundo em vez
  de 24. Cada seek é uma decodificação e uma pintura de um quadro 720x1280, e
  num Android mediano isso não cabe no orçamento de um quadro — a rolagem
  engasgava. 12 divide 24 exatamente, então os tempos continuam caindo sobre
  quadros reais do arquivo; o movimento fica um degrau mais grosso e MUITO
  mais fluido, que é a troca certa aqui.
*/
export const FPS_CELULAR = 12;
export const LARGURA_CELULAR = 900;

/*
  Três afirmações sobre O PRATO, não sobre o processo.
  A versão anterior listava "escolhe / monta / recebe" — exatamente os mesmos
  três passos da seção "Como pedir", que fica logo abaixo. Dizer a mesma coisa
  duas vezes seguidas gasta a atenção do leitor e faz a página parecer sem
  rumo. Aqui o vídeo mostra o prato sendo feito; então o texto fala do prato.

  Sem numeração: numerar só se presta quando a ordem carrega informação, e
  estas três não são uma sequência — são provas. Quem marca o avanço é o ponto
  da trilha, que acende junto com o vídeo.
*/
const PROVAS = [
  { titulo: 'Camarão graúdo', detalhe: 'Salteado na hora, não descongelado em cima do prato.' },
  { titulo: 'Molho da casa', detalhe: 'Feito no dia, na receita que é nossa.' },
  { titulo: 'Montada quando você pede', detalhe: 'Nada esperando pronto na geladeira desde ontem.' },
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
  const [pronto, setPronto] = useState(false);
  const [fps, setFps] = useState(FPS);

  useEffect(() => {
    setModo(
      modoDeVideo({
        largura: window.innerWidth,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        conexao: navigator.connection || null,
        forcado: modoForcadoDaUrl(window.location.search),
      }),
    );
    setFps(window.innerWidth < LARGURA_CELULAR ? FPS_CELULAR : FPS);
  }, []);

  /*
    Só dirigir o vídeo pelo scroll quando ele tiver material pra mostrar.
    Sem esta espera, os seeks começavam com o arquivo ainda baixando: cada
    pedido de quadro caía num trecho que não estava em buffer, nada aparecia,
    e o vídeo só "acordava" quando o download terminava — lá adiante, muito
    depois do ponto do scroll onde deveria ter começado.
  */
  useEffect(() => {
    if (modo !== MODOS.SYNC) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    let vivo = true;

    /*
      🚨 iOS: um vídeo que NUNCA tocou não pinta quadro nenhum quando recebe
      `currentTime`. Como este palco é inteiramente dirigido pelo scroll e
      jamais chama play(), no Safari o decodificador nunca acordava: o
      readyState empacava e ficava só o pôster, para sempre. Um play() seguido
      de pause() imediato ativa o elemento sem que nada chegue a se mover.

      No desktop isso nunca apareceu porque só o motor do Safari se comporta
      assim — inclusive no Chrome do iPhone, que por baixo é Safari.
    */
    const acordar = async () => {
      try {
        await video.play();
        video.pause();
      } catch {
        // Autoplay negado (Modo de Baixo Consumo do iOS): fica pro gesto abaixo.
      }
    };

    // HAVE_CURRENT_DATA: já há quadro pra mostrar. Exigir HAVE_FUTURE_DATA aqui
    // travava o iOS, que segura o readyState até o elemento ser ativado.
    const conferir = () => {
      if (vivo && video.readyState >= 2) setPronto(true);
    };

    const acordarEConferir = async () => {
      await acordar();
      conferir();
    };

    if (video.readyState >= 1) acordarEConferir();

    video.addEventListener('loadedmetadata', acordarEConferir);
    video.addEventListener('loadeddata', conferir);
    video.addEventListener('canplay', conferir);

    // Rede de segurança: com o Modo de Baixo Consumo ligado, o iOS recusa
    // autoplay até existir um gesto do usuário. O primeiro toque na página
    // serve como gesto — e um toque sempre acontece antes de rolar.
    const aoTocar = () => { acordarEConferir(); };
    window.addEventListener('touchstart', aoTocar, { once: true, passive: true });

    return () => {
      vivo = false;
      video.removeEventListener('loadedmetadata', acordarEConferir);
      video.removeEventListener('loadeddata', conferir);
      video.removeEventListener('canplay', conferir);
      window.removeEventListener('touchstart', aoTocar);
    };
  }, [modo]);

  useVideoScrub({
    palcoRef,
    videoRef,
    ativo: modo === MODOS.SYNC && pronto,
    fps,
  });

  const midia = modo === MODOS.POSTER ? (
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
  );

  return (
    <section
      ref={palcoRef}
      className={`video-stage video-stage--${modo}`}
      data-modo={modo}
      data-pronto={pronto ? 'sim' : 'nao'}
      aria-labelledby="video-stage-titulo"
    >
      <div className="video-stage__sticky">
        {/*
          Pinceladas: manchas moles que deslizam em sentidos opostos conforme
          --p. Existem pra dar profundidade ao fundo chapado e pra que o palco
          reaja ao scroll mesmo antes de o vídeo entrar em cena. Não têm
          conteúdo — por isso saem da árvore de acessibilidade.
        */}
        <div className="video-stage__pincelada" data-lado="a" aria-hidden="true" />
        <div className="video-stage__pincelada" data-lado="b" aria-hidden="true" />

        <div className="video-stage__grade">
          <div className="video-stage__texto">
            <p className="video-stage__olho">Da bancada</p>

            <h2 id="video-stage-titulo" className="video-stage__titulo">
              Camarão <em>de verdade</em>.
            </h2>

            <ul className="video-stage__passos">
              {PROVAS.map((prova, i) => (
                <li key={prova.titulo} className="video-stage__passo" data-indice={i}>
                  <span className="video-stage__marcador" aria-hidden="true" />
                  <strong>{prova.titulo}</strong>
                  <span className="video-stage__detalhe">{prova.detalhe}</span>
                </li>
              ))}
            </ul>

            {/*
              A seção que mais convence era a única sem saída. O rótulo é o
              MESMO usado no hero e no CTA final: três nomes diferentes pro
              mesmo destino fazem parecer que são três lugares.
            */}
            <Link href="/cardapio" className="video-stage__cta">
              Ver cardápio
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/*
            O vídeo vive DENTRO da forma orgânica — a mesma linguagem do blob do
            hero, que é onde esta página já mostra comida. Recortar em curva
            resolve o 9:16 sem precisar escondê-lo: a proporção do arquivo deixa
            de ser assunto porque não há retângulo nenhum na tela.
          */}
          <div className="video-stage__blob">{midia}</div>
        </div>
      </div>
    </section>
  );
}
