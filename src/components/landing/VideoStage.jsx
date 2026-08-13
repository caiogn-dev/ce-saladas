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
        forcado: modoForcadoDaUrl(window.location.search),
      }),
    );
  }, []);

  useVideoScrub({ palcoRef, videoRef, ativo: modo === MODOS.SYNC, fps: FPS });

  return (
    <section
      ref={palcoRef}
      className={`video-stage video-stage--${modo}`}
      data-modo={modo}
      aria-labelledby="video-stage-titulo"
    >
      <div className="video-stage__sticky">
        {/*
          O arquivo é 720×1280 — retrato. Esticá-lo na largura de um desktop
          significava ampliar 720px para ~1900px: era daí que vinha a impressão
          de vídeo sem qualidade. Agora ele é exibido no formato dele, com
          altura de tela, e o vazio das laterais é preenchido por esta cópia
          borrada e ampliada do pôster — que pode ser esticada à vontade porque
          ninguém enxerga nitidez em algo desfocado.
        */}
        <div
          className="video-stage__fundo"
          style={{ backgroundImage: `url(${POSTER})` }}
          aria-hidden="true"
        />

        <div className="video-stage__moldura">
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
        </div>

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
