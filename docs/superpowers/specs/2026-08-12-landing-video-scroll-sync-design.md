# Landing com vídeo sincronizado ao scroll — ce-saladas

Data: 2026-08-12
Repo: `ce-saladas` (branch `development` — é a que está em produção)
Arquivo hoje: `src/pages/LandingPage.jsx` (606 linhas) + `LandingPage.css` (1386 linhas)

## Ponto de partida

Diferente da landing do Cardapidex, **esta já tem GSAP montado direito**: import
dinâmico de `gsap` + `ScrollTrigger`, `gsap.context` com cleanup, timeline do hero,
botões magnéticos, tilt 3D nos cards, contadores animados, parallax da coluna
visual. Nada disso vai ser reescrito.

O que falta:

1. Scroll nativo — todo aquele GSAP roda sobre um scroll seco. Falta o Lenis.
2. Não existe vídeo. O usuário tem um vídeo do **camarão salada** e quer ele
   sincronizado ao scroll.

## Estado do arquivo de vídeo — pendência declarada

Em 12/ago/2026 a pasta `/home/graco/WORK/ftp-data/ce-saladas-video` **não existe**.
`/home/graco/WORK/ftp-data/` pertence ao `root`, então o upload provavelmente
precisa de `sudo` ou de ir por outro caminho.

A seção será construída **completa e com poster**, atrás de uma constante única de
caminho. Quando o arquivo entrar e passar pelo pipeline abaixo, a seção acende sem
mudança de código.

### Pipeline de preparo do vídeo

Vídeo cru de celular **não serve** pra seek por scroll: os keyframes são esparsos,
então cada `currentTime = x` força o decoder a reconstruir do keyframe anterior e o
resultado é travado. O arquivo precisa ser reencodado com keyframe em todo frame.

```bash
ffmpeg -i camarao-cru.mp4 \
  -an \                          # sem áudio: nunca toca, e áudio atrapalha o seek
  -vf "scale=-2:1080,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -g 1 -keyint_min 1 -sc_threshold 0 \   # todo frame é keyframe → seek instantâneo
  -crf 26 -preset slow \
  -movflags +faststart \
  public/video/camarao-salada.mp4
```

Metas: **3 a 5 segundos**, **abaixo de 4 MB**. Acima disso o custo de rede mata o
ganho. Se o vídeo cru for mais longo, cortar o melhor trecho — não tentar sincronizar
20 segundos de scroll.

Também gerar o poster (primeiro frame), que é o que aparece antes do vídeo carregar
e é o fallback permanente em conexão lenta:

```bash
ffmpeg -i public/video/camarao-salada.mp4 -frames:v 1 -q:v 3 \
  public/video/camarao-salada-poster.jpg
```

Um script `scripts/preparar-video.sh` encapsula os dois comandos, recebendo o arquivo
cru como argumento.

## Como o sync funciona

Mesmo contrato do palco do Cardapidex: `position: sticky` pra segurar a cena,
ScrollTrigger com `scrub` só pra ler progresso.

```
<section class="videoStage">        ← altura 260vh
  <div class="videoSticky">         ← sticky; top: 0; height: 100svh
    <video muted playsinline preload="auto" poster="...">
    <div class="videoCopy">         ← 3 legendas que trocam por faixa de progresso
  </div>
</section>
```

O ScrollTrigger não escreve `--p` aqui: escreve `video.currentTime`.

```js
// progresso 0→1 vira posição no vídeo, com lerp pra não serrilhar
alvo = progresso * video.duration
atual += (alvo - atual) * 0.15        // suavização
video.currentTime = atual
```

O seek acontece dentro de um `requestAnimationFrame` com guarda: se um seek
anterior ainda não terminou (`video.seeking === true`), o frame é pulado em vez de
enfileirar. Isso é o que impede o efeito de "vídeo engasgando" quando o usuário rola
rápido.

O vídeo nunca dá `play()`. Ele fica pausado no frame 0 e é inteiramente dirigido
pelo scroll.

### Legendas

Três blocos de copy sobre o vídeo, cada um visível numa faixa de progresso, com
fade cruzado:

| Faixa | Copy |
|---|---|
| `0 – .33` | **Camarão de verdade.** Nada de imitação, nada de congelado de véspera. |
| `.33 – .66` | **Montada na hora do pedido.** Você escolhe cada ingrediente. |
| `.66 – 1` | **Na sua mesa em Palmas.** Entrega própria, sem app cobrando por cima. |

Copy fechada aqui pra não virar decisão de implementação. Se o vídeo entregue não
sustentar alguma das três (por exemplo, se não mostrar montagem), ajusta-se o texto
do bloco correspondente — a estrutura de três faixas não muda.

## Fallback: quando não sincronizar

O seek por scroll é caro. Ele é **desligado** e substituído por alternativa em três
casos:

| Situação | O que acontece |
|---|---|
| `prefers-reduced-motion: reduce` | Nem vídeo nem sync: só o poster estático com as três legendas empilhadas. |
| Mobile (largura < 768px) ou `navigator.connection.saveData` / `effectiveType` 2g-3g | Sem sync. O vídeo vira `autoplay muted loop playsinline` num bloco de altura normal — bonito, leve, sem custo de seek. |
| Vídeo falha ao carregar, ou o arquivo ainda não existe | Poster (ou, sem poster, um gradiente da marca) + legendas. A seção nunca fica vazia nem quebra o resto da página. |

O motivo do corte no mobile é direto: seek quadro a quadro em Safari iOS é
inconsistente e é exatamente onde o público desta loja está.

## Lenis nesta landing

`useLenis()` — mesmo hook do spec do Cardapidex, portado (os dois repos são Next 16 +
React 19 + GSAP 3.14; o hook é idêntico e não tem dependência de projeto).

Ele precisa entrar **dentro** do `gsap.context` existente, não em paralelo, pra que
o cleanup atual continue dando conta. O `ScrollTrigger.update` passa a ser dirigido
pelo `lenis.on('scroll')` e o `gsap.ticker` passa a rodar o `lenis.raf`.

Não inicia sob `prefers-reduced-motion`.

## Onde a seção entra

Entre `brand-strip` (linha ~364) e `#como-funciona` (linha ~387). É o momento certo:
logo depois da promessa, antes da explicação de como pedir.

## Componentes

```
src/components/landing/
  VideoStage.jsx        + VideoStage.css     ← palco sticky + legendas
  useVideoScrub.js                           ← ScrollTrigger → currentTime, com guarda de seek
  useLenis.js                                ← idêntico ao do cardapidex-web
  modoDeVideo.js                             ← função pura: decide 'sync' | 'loop' | 'poster'
src/pages/LandingPage.jsx                    ← monta <VideoStage /> na posição acima
```

`modoDeVideo.js` é pura de propósito: recebe `{ largura, reducedMotion, conexao }` e
devolve o modo. É a peça que concentra toda a política de fallback e é testável sem
DOM.

## Testes

1. `modoDeVideo` — os três modos, incluindo bordas (768px exato, `saveData: true`,
   `reducedMotion` vencendo sobre tudo).
2. `useVideoScrub` — com um `video` falso, um seek pendente faz o frame seguinte ser
   pulado em vez de enfileirado.
3. `VideoStage` — sem arquivo de vídeo disponível, renderiza poster e legendas e não
   quebra; em modo `loop`, o elemento tem `autoplay`/`loop` e nenhum listener de
   scroll é registrado.

## Fora de escopo

- Reescrever o GSAP existente da landing (timeline do hero, magnético, tilt).
- Mexer no cardápio, SaladBuilder ou checkout do ce-saladas.
- Áudio no vídeo.
- Sincronizar vídeo no app Flutter.

## Critério de pronto

- [ ] `npm test` verde
- [ ] Build de produção verde
- [ ] Com o vídeo real no lugar: scroll dirige o frame sem engasgo em desktop
- [ ] Mobile cai em `loop` e não tenta seek
- [ ] `prefers-reduced-motion` cai em poster
- [ ] Sem o arquivo de vídeo, a página continua íntegra
- [ ] Restart por `systemctl --user restart ce-saladas-dev`
