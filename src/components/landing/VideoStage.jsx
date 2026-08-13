// src/components/landing/VideoStage.jsx
import { useEffect, useRef, useState } from 'react';
import { MODOS, modoDeVideo, modoForcadoDaUrl } from './modoDeVideo';
import { useVideoScrub } from './useVideoScrub';

const VIDEO = '/video/camarao-salada.mp4';
const POSTER = '/video/camarao-salada-poster.jpg';

// Quadros por segundo do ARQUIVO. O laço de scrub encaixa os seeks nessa grade;
// pedir tempos entre quadros custa decodificação e não muda um pixel.
// Mantenha em sincronia com scripts/preparar-video.sh.
export const FPS = 24;

// A sequência real de um pedido — é ela que o vídeo mostra acontecendo, e é por
// isso que numerar aqui se justifica: a ordem carrega informação.
const PASSOS = [
  { titulo: 'Você escolhe', detalhe: 'Cada ingrediente, do jeito que você come.' },
  { titulo: 'A gente monta na hora', detalhe: 'Nada pronto de véspera esperando na geladeira.' },
  { titulo: 'Chega em Palmas', detalhe: 'Entrega própria, sem app cobrando por cima.' },
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

  useEffect(() => {
    setModo(
      modoDeVideo({
        largura: window.innerWidth,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        conexao: navigator.connection || null,
        forcado: modoForcadoDaUrl(window.location.search),
      }),
    );
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

    // HAVE_FUTURE_DATA: já dá pra pular pelos quadros sem esperar rede.
    const conferir = () => {
      if (video.readyState >= 3) setPronto(true);
    };
    conferir();

    video.addEventListener('canplaythrough', conferir);
    video.addEventListener('loadeddata', conferir);
    return () => {
      video.removeEventListener('canplaythrough', conferir);
      video.removeEventListener('loadeddata', conferir);
    };
  }, [modo]);

  useVideoScrub({
    palcoRef,
    videoRef,
    ativo: modo === MODOS.SYNC && pronto,
    fps: FPS,
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

            <ol className="video-stage__passos">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="video-stage__passo" data-indice={i}>
                  <span className="video-stage__marcador" aria-hidden="true" />
                  <span className="video-stage__numero">{String(i + 1).padStart(2, '0')}</span>
                  <strong>{passo.titulo}</strong>
                  <span className="video-stage__detalhe">{passo.detalhe}</span>
                </li>
              ))}
            </ol>
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
